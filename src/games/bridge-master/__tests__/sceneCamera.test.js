import { expect, it } from "vitest";
import { levels } from "../levels/index.js";
import { createCamera, projectNode } from "../scene/camera.js";

it.each([
  [1366, 540],
  [360, 490],
  [800, 180],
])(
  "keeps all level nodes inside the interaction area at %ix%i",
  (width, height) => {
    for (const level of levels) {
      for (const view of ["depth", "front"]) {
        const camera = createCamera(width, height, view);
        for (const node of level.nodes) {
          const projected = projectNode(node, camera, width, height);
          expect(projected.x).toBeGreaterThanOrEqual(24);
          expect(projected.x).toBeLessThanOrEqual(width - 24);
          expect(projected.y).toBeGreaterThanOrEqual(30);
          expect(projected.y).toBeLessThanOrEqual(height - 24);
        }
      }
    }
  },
);
