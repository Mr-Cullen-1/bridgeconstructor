// Guided lessons that teach the game where things are on screen. A lesson belongs to one level and
// opens the first time a player builds there: levels 1–3 teach the whole idea (points → road →
// supports → triangles → test), and a few later levels get a short "what is new" note.
//
// Each step spotlights real elements, found through their `data-tour` name (`node-<id>`, `level`,
// `budget`, `materials`, `tool-road`, `tool-support`, `edit`, `camera`, `controls`, `test`).
//   kind "info"   — the player reads it and presses "Got it".
//   kind "action" — the player has to do it (`done`); the tour teaches by doing.
//   ghost         — dashed example lines drawn between nodes: what the player is about to build.
//   shapes        — node-id triples drawn as glowing triangles.
//   hand          — "tap" (a finger pressing the target) or "drag" (a finger travelling along the
//                   first ghost line, node to node).
//   back          — an action step falls back one step when the player undoes its premise.
// The words of every step live in the dictionary: tour.lessons[levelId][stepId].
import { getEdgeKey } from "../engine/graph.js";

const node = (id) => `node-${id}`;
const nodes = (ids) => ids.map(node);
const pairsOf = (ids) => ids.slice(1).map((id, i) => [ids[i], id]);
const has = (state, [a, b]) => state.playerEdges.some((e) => e.id === getEdgeKey(a, b));
const hasAll = (state, pairs) => pairs.every((pair) => has(state, pair));
const lines = (pairs, type) => pairs.map(([from, to]) => ({ from, to, type }));
const supportMode = ({ state }) => state.activeEdgeType === "support";

const testStep = {
  id: "test",
  kind: "action",
  targets: ["test"],
  hand: "tap",
  delay: 0,
  done: ({ state }) => state.phase !== "building",
};
// Picking the support tool; also steps back to it when the player returns to the road tool.
const toolStep = { id: "tool", kind: "action", targets: ["tool-support"], hand: "tap", delay: 350, done: supportMode };
const needsSupportTool = { back: ({ state }) => state.activeEdgeType !== "support" };

function firstBridge(level) {
  const road = level.roadNodeIds;
  const [first, second] = road;
  return [
    { id: "goal", kind: "info", targets: [node(first), node(road.at(-1))] },
    { id: "level", kind: "info", targets: ["level"] },
    { id: "budget", kind: "info", targets: ["budget"] },
    { id: "tools", kind: "info", targets: ["materials"] },
    {
      id: "pickFirst",
      kind: "action",
      targets: [node(first)],
      hand: "tap",
      delay: 200,
      done: ({ state }) => state.selectedNodeId === first || state.playerEdges.length > 0,
    },
    {
      id: "pickSecond",
      kind: "action",
      targets: [node(second)],
      ghost: lines([[first, second]], "road"),
      hand: "tap",
      delay: 800,
      done: ({ state }) => state.playerEdges.length > 0,
      // Pressing Esc or tapping the first point again drops the selection: ask for it again.
      back: ({ state }) => state.playerEdges.length === 0 && state.selectedNodeId !== first,
    },
    { id: "edit", kind: "info", targets: ["edit"] },
    {
      id: "road",
      kind: "action",
      targets: nodes(road),
      ghost: lines(pairsOf(road).slice(1), "road"),
      hand: "drag",
      delay: 700,
      done: ({ roadReady }) => roadReady,
    },
    { id: "controls", kind: "info", targets: ["controls"] },
    testStep,
  ];
}

// Level 2: the first top support, F, and the first triangles.
function supportsIntro() {
  const roads = [["a", "b"], ["b", "e"]];
  const ropes = [["a", "f"], ["b", "f"], ["e", "f"]];
  return [
    { id: "new", kind: "info", targets: [node("f")] },
    {
      id: "road",
      kind: "action",
      targets: nodes(["a", "b", "e"]),
      ghost: lines(roads, "road"),
      hand: "drag",
      delay: 600,
      done: ({ state }) => hasAll(state, roads),
    },
    toolStep,
    {
      id: "supports",
      kind: "action",
      targets: nodes(["a", "b", "e", "f"]),
      ghost: lines(ropes, "support"),
      hand: "drag",
      delay: 700,
      done: ({ state }) => hasAll(state, ropes),
      ...needsSupportTool,
    },
    { id: "triangles", kind: "info", targets: nodes(["a", "b", "e", "f"]), shapes: [["a", "b", "f"], ["b", "e", "f"]] },
    testStep,
  ];
}

// Level 3: a triangle under every piece of a longer road.
function triangleSecret(level) {
  const road = level.roadNodeIds;
  const roads = pairsOf(road);
  const ropes = road.map((id) => [id, "f"]);
  return [
    { id: "idea", kind: "info", targets: [...nodes(road), node("f")] },
    {
      id: "road",
      kind: "action",
      targets: nodes(road),
      ghost: lines(roads, "road"),
      hand: "drag",
      delay: 600,
      done: ({ roadReady }) => roadReady,
    },
    toolStep,
    {
      id: "fan",
      kind: "action",
      targets: [...nodes(road), node("f")],
      ghost: lines(ropes, "support"),
      hand: "drag",
      delay: 700,
      done: ({ state }) => hasAll(state, ropes),
      ...needsSupportTool,
    },
    { id: "triangles", kind: "info", targets: [...nodes(road), node("f")], shapes: roads.map(([a, b]) => [a, b, "f"]) },
    { id: "star", kind: "info", targets: ["budget"] },
    testStep,
  ];
}

// Level 4: not enough material for every node, so skip some with longer pieces.
function skipNodes() {
  const roads = [["a", "c"], ["c", "e"]];
  return [
    { id: "skip", kind: "info", targets: nodes(["b", "d"]) },
    {
      id: "road",
      kind: "action",
      targets: nodes(["a", "c", "e"]),
      ghost: lines(roads, "road"),
      hand: "drag",
      delay: 600,
      done: ({ state }) => hasAll(state, roads),
    },
  ];
}

const note = (targets) => () => [{ id: "news", kind: "info", targets: nodes(targets) }];
const lesson = (build, fresh = false) => Object.assign(build, { fresh });
const LESSONS = {
  "bridge-01": lesson(firstBridge),
  "bridge-02": lesson(supportsIntro),
  "bridge-03": lesson(triangleSecret),
  "bridge-04": lesson(skipNodes, true),
  "bridge-07": lesson(note(["f"]), true), // the support sits below the road
  "bridge-10": lesson(note(["f", "g"]), true), // two top supports, one for each half
  "bridge-12": lesson(note(["a", "b", "d", "e"]), true), // part of the road is already built
  "bridge-17": lesson(note(["a", "f", "e", "h"]), true), // the supports are already built
};

// The lesson for a level, or null. A lesson that mentions a node the level does not have (a custom
// level pack that reuses a level id) is dropped instead of pointing at nothing.
export function lessonFor(level) {
  const build = LESSONS[level?.id];
  if (!build) return null;
  const steps = build(level);
  const ids = new Set(level.nodes.map((n) => n.id));
  const known = (id) => ids.has(id);
  const valid = steps.every(
    (s) =>
      s.targets.every((t) => !t.startsWith("node-") || known(t.slice(5))) &&
      (s.ghost ?? []).every((g) => known(g.from) && known(g.to)) &&
      (s.shapes ?? []).every((shape) => shape.every(known)),
  );
  return valid ? { id: level.id, fresh: build.fresh, steps } : null;
}

// Once a bridge test has started, the player has found the Test button on their own.
export const tourIsOver = (phase) => ["testing", "success", "failed"].includes(phase);
