import { expect, it } from "vitest";
import { levels } from "../levels/index.js";
import { validateLevel } from "../engine/levelValidation.js";
import { canConnectNodes, createEdge } from "../engine/buildRules.js";
import { getSimulationOutcome } from "../engine/simulation.js";
import { calculateTotalCost } from "../engine/budget.js";
import { calculateStars } from "../engine/scoring.js";
import { solutions } from "./fixtures/solutions.js";
it("ships twenty unique levels", () => {
  expect(levels).toHaveLength(20);
  expect(new Set(levels.map((l) => l.id)).size).toBe(20);
  expect(new Set(levels.map((l) => JSON.stringify(l.nodes))).size).toBeGreaterThanOrEqual(19);
});
it("level four saves support material by skipping optional road nodes", () => {
  const level = levels[3];
  const edges = solutions[3].map(([a, b, type = "road"]) =>
    createEdge(level, level.nodes.find((n) => n.id === a), level.nodes.find((n) => n.id === b), type),
  );
  expect(calculateTotalCost(edges)).toBe(139);
  expect(getSimulationOutcome(level, edges)).toMatchObject({
    status: "completed",
    stabilityScore: 0.9,
  });
  const previousSolution = solutions[2].map(([a, b, type = "road"]) =>
    createEdge(level, level.nodes.find((n) => n.id === a), level.nodes.find((n) => n.id === b), type),
  );
  expect(calculateTotalCost(previousSolution)).toBe(185);
  expect(calculateTotalCost(previousSolution)).toBeGreaterThan(level.budget);
});
it.each(Array.from({ length: 20 }, (_, index) => index))(
  "level %i has an affordable three-star solution and a useful weak bridge",
  (index) => {
    const level = levels[index];
    expect(validateLevel(level)).toEqual({ valid: true, errors: [] });
    const edges = [...level.fixedEdges];
    for (const [a, b, type = "road"] of solutions[index]) {
      expect(canConnectNodes(level, edges, a, b, type).ok).toBe(true);
      edges.push(
        createEdge(
          level,
          level.nodes.find((n) => n.id === a),
          level.nodes.find((n) => n.id === b),
          type,
        ),
      );
    }
    const result = getSimulationOutcome(level, edges);
    expect(result.status).toBe("completed");
    expect(
      calculateStars(level, {
        ...result,
        materialUsed: calculateTotalCost(edges.filter((e) => e.isPlayerBuilt)),
      }),
    ).toBe(3);
    if (index > 0) {
      const weak = edges.filter((e) => !e.isPlayerBuilt || e.type === "road");
      expect(getSimulationOutcome(level, weak)).toMatchObject({
        valid: true,
        status: "failed",
      });
    }
  },
);
