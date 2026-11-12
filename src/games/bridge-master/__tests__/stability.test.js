import { expect, it } from "vitest";
import tutorial from "../levels/bridge-01.json";
import { createEdge } from "../engine/buildRules.js";
import { calculateStability } from "../engine/stability.js";
import { createTestRun, getSimulationOutcome } from "../engine/simulation.js";
import { calculateStars, calculateScore } from "../engine/scoring.js";

export const braced = {
  ...tutorial,
  id: "fixture",
  budget: 200,
  parBudget: 135,
  stabilityThreshold: 0.8,
  threeStarStability: 0.9,
  nodes: [
    { id: "a", x: 120, y: 300, type: "anchor" },
    { id: "b", x: 400, y: 300, type: "road" },
    { id: "e", x: 680, y: 300, type: "anchor" },
    { id: "f", x: 400, y: 150, type: "joint" },
  ],
  roadNodeIds: ["a", "b", "e"],
  supportPolicy: "braced",
  buildRules: { ...tutorial.buildRules, maxEdgeLength: 330 },
  stabilityConfig: { wC: 0.6, wT: 0.4, wU: 0.2, wV: 0.1, maxUnbracedSpan: 300 },
};
const make = (l, pairs) =>
  pairs.map(([a, b, t = "road"]) =>
    createEdge(
      l,
      l.nodes.find((n) => n.id === a),
      l.nodes.find((n) => n.id === b),
      t,
    ),
  );
const roads = [
  ["a", "b"],
  ["b", "e"],
];
const weak = make(braced, [
  ...roads,
  ["a", "f", "support"],
  ["b", "f", "support"],
]);
const strong = make(braced, [
  ...roads,
  ["a", "f", "support"],
  ["b", "f", "support"],
  ["e", "f", "support"],
]);
it("blocks discontinuous road and missing bracing before testing", () => {
  expect(getSimulationOutcome(braced, [])).toMatchObject({
    valid: false,
    reasonCode: "roadGap",
  });
  expect(getSimulationOutcome(braced, make(braced, roads))).toMatchObject({
    valid: false,
    reasonCode: "noSupport",
  });
});
it("gives weak and strong valid bridges different deterministic outcomes", () => {
  expect(getSimulationOutcome(braced, weak)).toMatchObject({
    valid: true,
    status: "failed",
  });
  expect(getSimulationOutcome(braced, strong)).toMatchObject({
    valid: true,
    status: "completed",
    stabilityScore: 0.9,
  });
});
it("accepts exact threshold and rejects just below it", () => {
  expect(
    getSimulationOutcome({ ...braced, stabilityThreshold: 0.9 }, strong).status,
  ).toBe("completed");
  expect(
    getSimulationOutcome({ ...braced, stabilityThreshold: 0.9001 }, strong)
      .status,
  ).toBe("failed");
});
it("preserves outcome, weak point and vehicle path under shuffled reversed edges", () => {
  const before = JSON.stringify(strong);
  const reordered = [...strong]
    .reverse()
    .map((e) => ({ ...e, fromNodeId: e.toNodeId, toNodeId: e.fromNodeId }));
  expect(createTestRun(braced, reordered)).toEqual(
    createTestRun(braced, strong),
  );
  expect(JSON.stringify(strong)).toBe(before);
});
it("awards tutorial completion without requiring support", () => {
  const edges = make(tutorial, [
    ["a", "b"],
    ["b", "c"],
    ["c", "d"],
    ["d", "e"],
  ]);
  expect(getSimulationOutcome(tutorial, edges)).toMatchObject({
    valid: true,
    status: "completed",
    stabilityScore: 1,
  });
  expect(createTestRun(tutorial, edges).durationMs).toBe(4000);
});
it("disconnected decorative triangles do not increase stability", () => {
  const l = {
    ...braced,
    nodes: [
      ...braced.nodes,
      { id: "x", x: 1, y: 1, type: "joint" },
      { id: "y", x: 2, y: 2, type: "joint" },
      { id: "z", x: 3, y: 1, type: "joint" },
    ],
  };
  const decoration = make(l, [
    ["x", "y", "support"],
    ["y", "z", "support"],
    ["z", "x", "support"],
  ]);
  expect(calculateStability(l, [...strong, ...decoration]).score).toBe(0.9);
});
it.each([
  ["failed", 0, 1, 0],
  ["completed", 70, 0.8, 1],
  ["completed", 56, 0.8, 2],
  ["completed", 56, 0.9, 3],
])("assigns stars for %s %i %f", (status, materialUsed, stabilityScore, want) =>
  expect(
    calculateStars(tutorial, { status, materialUsed, stabilityScore }),
  ).toBe(want),
);
it("keeps score finite and fails safely for invalid numeric input", () => {
  expect(
    calculateScore(tutorial, {
      status: "failed",
      materialUsed: 0,
      stabilityScore: 1,
    }),
  ).toBe(0);
  expect(
    calculateScore(tutorial, {
      status: "completed",
      materialUsed: 56,
      stabilityScore: 1,
    }),
  ).toBe(825);
  expect(
    calculateScore(tutorial, {
      status: "completed",
      materialUsed: NaN,
      stabilityScore: 1,
    }),
  ).toBe(0);
});
