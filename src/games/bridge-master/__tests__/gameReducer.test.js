import { expect, it } from "vitest";
import level from "../levels/bridge-01.json";
import { initialState, gameReducer } from "../engine/gameReducer.js";
import { createEdge } from "../engine/buildRules.js";
const act = (s, type, extra = {}) => gameReducer(s, { type, ...extra });
const ready = () => act(initialState(level, "session-1"), "START_BUILDING");
const connect = (s, a, b) =>
  act(act(s, "SELECT_NODE", { nodeId: a }), "SELECT_NODE", { nodeId: b });
const built = () =>
  [
    ["a", "b"],
    ["b", "c"],
    ["c", "d"],
    ["d", "e"],
  ].reduce((s, [a, b]) => connect(s, a, b), ready());
it("builds on node pairs and cancels repeated node selection", () => {
  let s = ready();
  s = act(s, "SELECT_NODE", { nodeId: "a" });
  s = act(s, "SELECT_NODE", { nodeId: "a" });
  expect(s.selectedNodeId).toBeNull();
  s = connect(s, "a", "b");
  expect(s.playerEdges).toHaveLength(1);
  expect(s.history).toHaveLength(1);
});
it("does not record invalid actions in history", () => {
  const s = connect(ready(), "a", "e");
  expect(s.playerEdges).toEqual([]);
  expect(s.history).toEqual([]);
  expect(s.message).toBe("tooLong");
});
it("undo reverses add and remove, reset clears history", () => {
  let s = connect(ready(), "a", "b");
  s = act(s, "SELECT_EDGE", { edgeId: s.playerEdges[0].id });
  s = act(s, "REMOVE_EDGE");
  expect(s.playerEdges).toHaveLength(0);
  s = act(s, "UNDO");
  expect(s.playerEdges).toHaveLength(1);
  s = act(s, "RESET_BRIDGE");
  expect(s.playerEdges).toHaveLength(0);
  expect(s.history).toHaveLength(0);
});
it("keeps fixed edges when resetting", () => {
  const fixed = {
    ...createEdge(level, level.nodes[0], level.nodes[1], "road"),
    isPlayerBuilt: false,
  };
  const s = act(
    initialState({ ...level, fixedEdges: [fixed] }, "s"),
    "RESET_BRIDGE",
  );
  expect(s.level.fixedEdges).toEqual([fixed]);
});
it("tests an empty bridge, records a failed attempt and permits repair", () => {
  let s = act(ready(), "START_TEST");
  expect(s.phase).toBe("testing");
  expect(s.attempts).toBe(1);
  expect(s.message).toBeNull();
  s = act(s, "FINISH_TEST", {
    runId: s.runId,
    completedAt: "2026-11-12T00:00:00Z",
  });
  expect(s.phase).toBe("failed");
  expect(s.result.stars).toBe(0);
  s = act(s, "RETRY");
  expect(s.phase).toBe("building");
  expect(s.attempts).toBe(1);
  expect(connect(s, "a", "b").playerEdges).toHaveLength(1);
});
it("still rejects corrupt graph data before simulation", () => {
  const s = act({ ...ready(), playerEdges: [null] }, "START_TEST");
  expect(s.phase).toBe("building");
  expect(s.attempts).toBe(0);
  expect(s.message).toBe("invalidGraph");
});
it("locks build actions during testing and success and rejects stale completions", () => {
  const s = act(built(), "START_TEST");
  expect(s.phase).toBe("testing");
  expect(s.attempts).toBe(1);
  for (const type of [
    "SELECT_NODE",
    "REMOVE_EDGE",
    "UNDO",
    "RESET_BRIDGE",
    "START_TEST",
  ])
    expect(act(s, type, { nodeId: "a" })).toBe(s);
  expect(act(s, "FINISH_TEST", { runId: 999 })).toBe(s);
  const done = act(s, "FINISH_TEST", {
    runId: s.runId,
    completedAt: "2026-11-12T00:00:00Z",
  });
  expect(done.phase).toBe("success");
  expect(done.result.stars).toBe(3);
  expect(act(done, "RESET_BRIDGE")).toBe(done);
});
it("pause freezes active time and resumes the previous phase", () => {
  let s = act(built(), "START_TEST");
  s = act(s, "PAUSE");
  expect(s.phase).toBe("paused");
  expect(act(s, "TICK", { ms: 1000 }).activeMs).toBe(0);
  s = act(s, "RESUME");
  expect(s.phase).toBe("testing");
  expect(act(s, "TICK", { ms: 1000 }).activeMs).toBe(1000);
});
it("redo puts back what undo took away, step by step, and building anything new clears it", () => {
  let s = built();
  expect(s.future).toEqual([]);
  s = act(act(s, "UNDO"), "UNDO");
  expect(s.playerEdges).toHaveLength(2);
  expect(s.future).toHaveLength(2);
  s = act(s, "REDO");
  expect(s.playerEdges.map((e) => e.id)).toEqual(built().playerEdges.slice(0, 3).map((e) => e.id));
  expect(s.future).toHaveLength(1);
  s = act(s, "REDO");
  expect(s.playerEdges).toHaveLength(4);
  expect(act(s, "REDO")).toMatchObject({ playerEdges: s.playerEdges, future: [] }); // nothing left to redo
  // Undo, then build something different: the old future is gone.
  let t = act(built(), "UNDO");
  expect(t.future).toHaveLength(1);
  t = connect(t, "d", "e");
  expect(t.future).toEqual([]);
  // Removing a segment also clears it, and redo can undo a removal.
  let u = act(built(), "UNDO");
  u = act(u, "SELECT_EDGE", { edgeId: u.playerEdges[0].id });
  u = act(u, "REMOVE_EDGE");
  expect(u.future).toEqual([]);
  const removed = act(act(u, "UNDO"), "REDO");
  expect(removed.playerEdges).toHaveLength(2);
});
it("redo does nothing outside building", () => {
  const s = act(initialState(level, "session-1"), "REDO");
  expect(s.playerEdges).toEqual([]);
});
