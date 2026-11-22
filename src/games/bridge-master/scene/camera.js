import { OrthographicCamera, Vector3 } from "three";

export const worldPoint = (node, z = 1.22) =>
  new Vector3((node.x - 400) / 35, (300 - node.y) / 35, z);

// The scene fills the whole screen while the HUD covers `insets.top` / `insets.bottom` pixels.
// The bridge is framed inside the free band between them, so no node ever hides under the HUD.
export function createCamera(width, height, view = "depth", yaw = 0, insets = {}) {
  const top = Math.max(0, insets.top ?? 0),
    bottom = Math.max(0, insets.bottom ?? 0);
  const safeHeight = Math.max(120, height - top - bottom);
  const aspect = Math.max(1, width) / safeHeight;
  const halfHeight = Math.max(safeHeight < 260 ? 7.2 : 5.4, 10.8 / aspect);
  const unit = (2 * halfHeight) / safeHeight; // world units per pixel
  // Shift the frustum so the target lands in the middle of the free band, not the screen.
  const shift = (unit * (top - bottom)) / 2;
  const camera = new OrthographicCamera(
    (-unit * width) / 2,
    (unit * width) / 2,
    (unit * height) / 2 + shift,
    (-unit * height) / 2 + shift,
    0.1,
    160,
  );
  const target = new Vector3(0, 1.4, 0);
  camera.position.set(
    Math.sin(yaw) * 25,
    view === "front" ? 3.4 : 12.4,
    Math.cos(yaw) * 25,
  );
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera;
}

export function projectNode(node, camera, width, height) {
  const p = worldPoint(node).project(camera);
  return { x: ((p.x + 1) * width) / 2, y: ((1 - p.y) * height) / 2 };
}
