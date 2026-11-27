// Layered 2D scene geometry. The art lives on a 1600 x 900 "stage" (the design pack's coordinate
// system); level coordinates map onto it linearly, and the stage is scaled so that every node and
// its label fits the free band between the top and bottom HUD.
export const STAGE = { width: 1600, height: 900 };
const UNIT = 145 / 140; // stage pixels per level unit (the pack's node spacing is 145 px)
export const stageX = (x) => 800 + (x - 400) * UNIT;
export const stageY = (y) => 455 + (y - 300) * UNIT;
export const toStage = (point) => ({ x: stageX(point.x), y: stageY(point.y) });
export const UNITS = UNIT;
// Level y at which falling things reach the water.
export const WATER_LEVEL = 478;

// Stage rectangle that must stay clear of the HUD: every node, its marker and its label.
const BOUNDS = { left: 476, right: 1124, top: 218, bottom: 604 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createView(width, height, insets = {}) {
  const top = Math.max(0, insets.top ?? 0),
    bottom = Math.max(0, insets.bottom ?? 0);
  const free = Math.max(120, height - top - bottom);
  const w = BOUNDS.right - BOUNDS.left,
    h = BOUNDS.bottom - BOUNDS.top;
  // On phones the bridge takes about three quarters of the width, so the banks, the road and the trees
  // around it stay in view and the scene feels like the real place; elsewhere it fills the width.
  const fill = width < 700 ? 0.72 : (width - 48) / width;
  const k = clamp(Math.min((width * fill) / w, (free - 44) / h), 0.2, 1.35);
  const cx = (BOUNDS.left + BOUNDS.right) / 2,
    cy = (BOUNDS.top + BOUNDS.bottom) / 2;
  return {
    width,
    height,
    k,
    ox: width / 2 - cx * k,
    oy: top + free / 2 - cy * k,
  };
}

// Screen position of a level node (the interactive plane carries no parallax).
export function projectNode(node, view) {
  const p = toStage(node);
  return { x: view.ox + p.x * view.k, y: view.oy + p.y * view.k };
}

// Stage rectangle currently visible on screen.
export function visibleStage(view) {
  return {
    left: -view.ox / view.k,
    right: (view.width - view.ox) / view.k,
    top: -view.oy / view.k,
    bottom: (view.height - view.oy) / view.k,
  };
}
