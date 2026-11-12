import { describe, expect, it } from "vitest";
import level from "../levels/bridge-01.json";
import { validateLevel } from "../engine/levelValidation.js";
import {
  canConnectNodes,
  createEdge,
  removeEdge,
} from "../engine/buildRules.js";
import { calculateTotalCost } from "../engine/budget.js";
import {
  findPath,
  getEdgeKey,
  getConnectedComponents,
} from "../engine/graph.js";
import { pushHistory, undo } from "../engine/history.js";

const edge = (a, b, type = "road", l = level) =>
  createEdge(
    l,
    l.nodes.find((n) => n.id === a),
    l.nodes.find((n) => n.id === b),
    type,
  );
describe("level validation", () => {
  it("accepts playable tutorial", () =>
    expect(validateLevel(level).valid).toBe(true));
  it.each([
    (l) => l.nodes.push({ ...l.nodes[0] }),
    (l) => (l.nodes[0].x = NaN),
    (l) => (l.budget = 0),
    (l) => (l.vehicle.speed = Infinity),
    (l) => (l.startNodeId = "missing"),
    (l) => (l.parBudget = 90),
    (l) => (l.stabilityThreshold = 2),
    (l) =>
      l.fixedEdges.push({ fromNodeId: "missing", toNodeId: "a", type: "road" }),
    (l) => (l.nodes[1].x = 120),
    (l) => (l.buildRules.maxEdgeLength = -1),
  ])("rejects malformed configuration %#", (mutate) => {
    const l = structuredClone(level);
    mutate(l);
    expect(validateLevel(l).valid).toBe(false);
  });
  it("rejects missing data without throwing", () =>
    expect(validateLevel(null).valid).toBe(false));
});
describe("build and budget", () => {
  it("prices four 140-unit road segments at 56 points", () =>
    expect(
      calculateTotalCost([
        edge("a", "b"),
        edge("b", "c"),
        edge("c", "d"),
        edge("d", "e"),
      ]),
    ).toBe(56));
  it.each([
    ["a", "a", "road", "sameNode"],
    ["a", "?", "road", "unknownNode"],
    ["a", "c", "road", "tooLong"],
    ["a", "b", "rope", "invalidType"],
  ])("rejects %s to %s (%s)", (a, b, type, code) =>
    expect(canConnectNodes(level, [], a, b, type)).toEqual({
      ok: false,
      reasonCode: code,
    }),
  );
  it("blocks reversed duplicates across edge types", () =>
    expect(
      canConnectNodes(level, [edge("a", "b")], "b", "a", "support").reasonCode,
    ).toBe("duplicate"));
  it("accepts exact budget and rejects one point less", () => {
    expect(
      canConnectNodes({ ...level, budget: 14 }, [], "a", "b", "road").ok,
    ).toBe(true);
    expect(
      canConnectNodes({ ...level, budget: 13 }, [], "a", "b", "road")
        .reasonCode,
    ).toBe("budget");
  });
  it("rejects zero-length edges", () => {
    const l = structuredClone(level);
    l.nodes[1].x = 120;
    expect(canConnectNodes(l, [], "a", "b", "road").reasonCode).toBe(
      "zeroLength",
    );
  });
  it("preserves fixed edges on removal", () => {
    const fixed = { ...edge("a", "b"), isPlayerBuilt: false };
    expect(removeEdge([fixed], fixed.id)).toEqual([fixed]);
    expect(removeEdge([edge("b", "c")], edge("b", "c").id)).toEqual([]);
  });
});
describe("graph and history", () => {
  it("finds the same path independent of insertion and direction", () => {
    const edges = [
      edge("a", "b"),
      edge("b", "c"),
      edge("c", "d"),
      edge("d", "e"),
    ];
    expect(findPath(edges, "a", "e", level.nodes)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
    expect(
      findPath(
        [...edges]
          .reverse()
          .map((e) => ({
            ...e,
            fromNodeId: e.toNodeId,
            toNodeId: e.fromNodeId,
          })),
        "a",
        "e",
        level.nodes,
      ),
    ).toEqual(["a", "b", "c", "d", "e"]);
  });
  it("reports disconnected roads and isolated nodes", () => {
    expect(findPath([], "a", "e", level.nodes)).toBeNull();
    expect(getConnectedComponents(level.nodes, [edge("a", "b")])).toHaveLength(
      4,
    );
  });
  it("canonical key ignores endpoint direction", () =>
    expect(getEdgeKey("b", "a")).toBe(getEdgeKey("a", "b")));
  it("undo restores add/remove snapshots without mutation", () => {
    const one = [edge("a", "b")];
    const h = pushHistory([], one);
    const result = undo(h, []);
    expect(result.playerEdges).toEqual(one);
    expect(result.history).toEqual([]);
    expect(h).toHaveLength(1);
  });
  it("caps history at 30 actions", () => {
    let h = [];
    for (let i = 0; i < 40; i++) h = pushHistory(h, []);
    expect(h).toHaveLength(30);
  });
});
