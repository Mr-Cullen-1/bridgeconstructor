import { OrthographicCamera, Vector3 } from "three";

export const worldPoint = (node, z = 1.22) =>
  new Vector3((node.x - 400) / 35, (300 - node.y) / 35, z);

export function createCamera(width, height, view = "depth", yaw = 0) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const halfHeight = Math.max(height < 260 ? 7.2 : 5.4, 10.8 / aspect);
  const camera = new OrthographicCamera(
    -halfHeight * aspect,
    halfHeight * aspect,
    halfHeight,
    -halfHeight,
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
