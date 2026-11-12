import { expect, it } from "vitest";
import { levels } from "../levels/index.js";
import { validateLevel } from "../engine/levelValidation.js";
import { canConnectNodes, createEdge } from "../engine/buildRules.js";
import { getSimulationOutcome } from "../engine/simulation.js";
import { calculateTotalCost } from "../engine/budget.js";
import { calculateStars } from "../engine/scoring.js";
import { solutions } from "./fixtures/solutions.js";
it("ships five unique levels", () => {
  expect(levels).toHaveLength(5);
  expect(new Set(levels.map((l) => l.id)).size).toBe(5);
});
it.each([0, 1, 2, 3, 4])(
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
      const weak = edges.filter(
        (e) =>
          !(e.type === "support" && [e.fromNodeId, e.toNodeId].includes("e")),
      );
      expect(getSimulationOutcome(level, weak)).toMatchObject({
        valid: true,
        status: "failed",
      });
    }
  },
);
