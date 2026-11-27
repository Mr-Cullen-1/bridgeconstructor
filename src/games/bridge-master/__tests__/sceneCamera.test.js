import { expect, it } from "vitest";
import { levels } from "../levels/index.js";
import { createView, projectNode, toStage, visibleStage } from "../scene/view.js";

it.each([
  [1366, 540],
  [360, 490],
  [800, 180],
])("keeps all level nodes inside the interaction area at %ix%i", (width, height) => {
  for (const level of levels) {
    const view = createView(width, height);
    for (const node of level.nodes) {
      const projected = projectNode(node, view);
      expect(projected.x).toBeGreaterThanOrEqual(24);
      expect(projected.x).toBeLessThanOrEqual(width - 24);
      expect(projected.y).toBeGreaterThanOrEqual(30);
      expect(projected.y).toBeLessThanOrEqual(height - 24);
    }
  }
});

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
    const view = createView(width, height, { top, bottom });
    for (const node of level.nodes) {
      const projected = projectNode(node, view);
      expect(projected.x).toBeGreaterThanOrEqual(24);
      expect(projected.x).toBeLessThanOrEqual(width - 24);
      expect(projected.y).toBeGreaterThanOrEqual(top + 24);
      expect(projected.y).toBeLessThanOrEqual(height - bottom - 20);
    }
  }
});

it("maps level coordinates onto the pack's stage: anchors 580 px apart, supports above", () => {
  const [first] = levels;
  const a = toStage(first.nodes.find((n) => n.id === "a")),
    e = toStage(first.nodes.find((n) => n.id === "e"));
  expect(a.x).toBeCloseTo(510, 0);
  expect(e.x).toBeCloseTo(1090, 0);
  expect(a.y).toBeCloseTo(455, 0);
});

it("the view reports what part of the stage is visible", () => {
  const view = createView(1366, 768, { top: 100, bottom: 195 });
  const seen = visibleStage(view);
  expect(seen.right - seen.left).toBeCloseTo(1366 / view.k);
  expect(seen.left).toBeLessThan(476);
  expect(seen.right).toBeGreaterThan(1124);
});
