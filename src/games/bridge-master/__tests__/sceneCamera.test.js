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

// The HUD covers the top and bottom of the screen: nodes must stay in the free band between.
it.each([
  [1919, 910, 110, 210],
  [1366, 768, 100, 195],
  [1024, 600, 100, 190],
  [768, 1024, 100, 195],
  [360, 800, 125, 215],
  [320, 568, 125, 215],
  [800, 360, 56, 72],
])("keeps all level nodes clear of the HUD at %ix%i (top %i, bottom %i)", (width, height, top, bottom) => {
  for (const level of levels) {
    for (const view of ["depth", "front"]) {
      const camera = createCamera(width, height, view, 0.12, { top, bottom });
      for (const node of level.nodes) {
        const projected = projectNode(node, camera, width, height);
        expect(projected.x).toBeGreaterThanOrEqual(24);
        expect(projected.x).toBeLessThanOrEqual(width - 24);
        expect(projected.y).toBeGreaterThanOrEqual(top + 24);
        expect(projected.y).toBeLessThanOrEqual(height - bottom - 20);
      }
    }
  }
});
