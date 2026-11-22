import * as THREE from "three";
import { worldPoint } from "./camera.js";

// Cartoon adventure look: toon shading with outlines, bright sky, wooden planks and steel rails.
// Procedural geometry only; the deterministic engine stays the source of every game outcome.
const WATER_Y = -5.1;
const INK = 0x2b1a10;
const hash = (text) => {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};
const easeOutBack = (t) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

function skyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 256;
  const g = canvas.getContext("2d");
  const gradient = g.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#3f9df2");
  gradient.addColorStop(0.5, "#8fd6ff");
  gradient.addColorStop(1, "#fff1c8");
  g.fillStyle = gradient;
  g.fillRect(0, 0, 2, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Reusable instanced particle pool (dust, smoke, splashes).
function createParticles(parent, max = 260) {
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geometry, material, max);
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D(),
    color = new THREE.Color();
  const items = Array.from({ length: max }, () => ({
    life: 0, max: 1, size: 0, shrink: true, gravity: 0,
    p: new THREE.Vector3(), v: new THREE.Vector3(),
  }));
  for (let i = 0; i < max; i++) {
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color.set(0xffffff));
  }
  parent.add(mesh);
  let cursor = 0;
  return {
    emit(at, { count = 8, color: tint = "#ffffff", speed = 1.4, up = 1, spread = 1, gravity = 5, life = 0.7, size = 0.12, grow = false } = {}) {
      for (let n = 0; n < count; n++) {
        const index = cursor,
          item = items[index];
        cursor = (cursor + 1) % max;
        item.p.copy(at);
        item.v.set((Math.random() - 0.5) * 2 * spread, up * (0.4 + Math.random()), (Math.random() - 0.5) * 2 * spread).multiplyScalar(speed);
        item.life = item.max = life * (0.6 + Math.random() * 0.6);
        item.size = size * (0.6 + Math.random() * 0.8);
        item.shrink = !grow;
        item.gravity = gravity;
        mesh.setColorAt(index, color.set(tint));
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    update(dt) {
      for (let i = 0; i < max; i++) {
        const item = items[i];
        if (item.life <= 0) continue;
        item.life -= dt;
        item.v.y -= item.gravity * dt;
        item.p.addScaledVector(item.v, dt);
        const k = Math.max(0, item.life / item.max);
        dummy.position.copy(item.p);
        dummy.scale.setScalar(item.size * (item.shrink ? k : 1 + (1 - k) * 2));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (item.life <= 0) {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}

export function createWorld(canvas, level) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const sky = skyTexture();
  scene.background = sky;
  scene.fog = new THREE.Fog("#cdeeff", 62, 150);
  const root = new THREE.Group(), // everything that can shake
    environment = new THREE.Group(),
    bridge = new THREE.Group();
  root.add(environment, bridge);
  scene.add(root);

  const steps = new THREE.DataTexture(
    new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]),
    3,
    1,
    THREE.RGBAFormat,
  );
  steps.minFilter = steps.magFilter = THREE.NearestFilter;
  steps.needsUpdate = true;
  const materials = new Map();
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  function material(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    if (!materials.has(key))
      materials.set(key, new THREE.MeshToonMaterial({ color, gradientMap: steps, ...extra }));
    return materials.get(key);
  }
  function outline(object, thickness = 0.05) {
    const g = object.geometry;
    let sx = 1.07, sy = 1.07, sz = 1.07;
    if (g.type === "BoxGeometry") {
      const { width, height, depth } = g.parameters;
      sx = (width + thickness * 2) / width;
      sy = (height + thickness * 2) / height;
      sz = (depth + thickness * 2) / depth;
    }
    const shell = new THREE.Mesh(g, outlineMaterial);
    shell.scale.set(sx, sy, sz);
    object.add(shell);
    return object;
  }
  function mesh(parent, geometry, color, x = 0, y = 0, z = 0, extra) {
    const object = new THREE.Mesh(geometry, material(color, extra));
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const box = (parent, w, h, d, color, x, y, z, outlined = false) => {
    const object = mesh(parent, new THREE.BoxGeometry(w, h, d), color, x, y, z);
    return outlined ? outline(object) : object;
  };
  function beam(parent, a, b, width, depth, color, outlined = false) {
    const delta = b.clone().sub(a);
    const object = box(parent, delta.length(), width, depth, color,
      ...a.clone().add(b).multiplyScalar(0.5).toArray(), outlined);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), delta.normalize());
    return object;
  }

  scene.add(new THREE.HemisphereLight("#ffffff", "#9fc7ff", 2.1));
  const sun = new THREE.DirectionalLight("#fff4d6", 2.5);
  sun.position.set(-12, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 20, bottom: -20, near: 1, far: 65 });
  sun.shadow.normalBias = 0.045;
  sun.shadow.bias = -0.0002;
  scene.add(sun);

  const start = level.nodes.find((n) => n.id === level.startNodeId);
  const finish = level.nodes.find((n) => n.id === level.finishNodeId);
  const greens = ["#4fc15b", "#3aae56", "#74d35f"];
  function tree(x, y, z, scale = 1, tone = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    box(group, 0.22, 1.2, 0.22, "#8a5a2b", 0, 0.6, 0);
    if (tone % 2) {
      mesh(group, new THREE.IcosahedronGeometry(1.05, 1), greens[tone % 3], 0, 1.9, 0);
    } else {
      mesh(group, new THREE.ConeGeometry(0.95, 1.5, 7), greens[tone % 3], 0, 1.7, 0);
      mesh(group, new THREE.ConeGeometry(0.7, 1.3, 7), greens[(tone + 1) % 3], 0, 2.45, 0);
      mesh(group, new THREE.ConeGeometry(0.46, 1.1, 7), "#8ae26a", 0, 3.05, 0);
    }
    environment.add(group);
  }
  function bush(x, y, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    for (const [dx, r] of [[-0.45, 0.45], [0, 0.6], [0.5, 0.42]])
      mesh(group, new THREE.IcosahedronGeometry(r, 1), "#46b75a", dx, r * 0.7, 0);
    environment.add(group);
  }
  function flower(x, y, z, color) {
    box(environment, 0.05, 0.3, 0.05, "#3d9a4a", x, y + 0.15, z).castShadow = false;
    mesh(environment, new THREE.SphereGeometry(0.11, 8, 6), color, x, y + 0.34, z).castShadow = false;
  }

  const foam = [];
  for (const [side, node] of [[-1, start], [1, finish]]) {
    const p = worldPoint(node, 0),
      center = p.x + side * 7;
    const shape = new THREE.Shape();
    [[-7, -12], [7, -12], [7, 5.5], [5.8, 7.2], [2.5, 8], [-3, 7.4], [-7, 5.5]].forEach(([x, z], i) =>
      i ? shape.lineTo(x, z) : shape.moveTo(x, z),
    );
    shape.closePath();
    const cliff = mesh(environment,
      new THREE.ExtrudeGeometry(shape, { depth: 6.6, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 1, steps: 1 }),
      "#c98d5a", center, p.y - 0.35, 0);
    cliff.rotation.x = Math.PI / 2;
    const strata = mesh(environment,
      new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false, steps: 1 }),
      "#b27648", center, p.y - 3.2, 0);
    strata.rotation.x = Math.PI / 2;
    strata.scale.set(1.012, 1.012, 1);
    const grass = mesh(environment,
      new THREE.ExtrudeGeometry(shape, { depth: 0.34, bevelEnabled: false, steps: 1 }),
      "#79d957", center, p.y - 0.06, 0);
    grass.rotation.x = Math.PI / 2;
    box(environment, 14, 0.16, 2.25, "#4b4f66", center, p.y - 0.02, 0);
    for (let j = 0; j < 10; j++)
      box(environment, 0.65, 0.025, 0.1, "#ffd54a", center - 6.5 + j * 1.4, p.y + 0.08, 0).castShadow = false;
    for (let j = 0; j < 10; j++) {
      const x = center - 5 + (j % 4) * 3.1,
        z = -3 - Math.floor(j / 4) * 3.3;
      tree(x, p.y, z, 0.75 + (j % 3) * 0.17, j);
    }
    tree(center + side * 2.5, p.y, 4, 1.2, side > 0 ? 1 : 0);
    for (let j = 0; j < 6; j++) bush(center - 6 + j * 2.3, p.y, -2.2 - (j % 2) * 5.5, 0.8 + (j % 3) * 0.2);
    for (let j = 0; j < 14; j++)
      flower(center - 6.4 + j * 0.95, p.y, 2.6 + ((j * 7) % 3) * 0.55, ["#ff6b81", "#ffd54a", "#ffffff", "#c58bff"][j % 4]);
    for (let j = 0; j < 7; j++) {
      const rock = mesh(environment, new THREE.DodecahedronGeometry(1, 0), j % 2 ? "#b9a58d" : "#d1bfa1",
        p.x + side * (0.3 + (j % 2)), p.y - 1.8 - (j % 3) * 1.4, -9 + j * 2.5);
      rock.scale.set(1.15, 1.5, 1.8);
      rock.rotation.set(j * 0.4, j * 0.7, 0.3);
    }
    // Wooden bumper post where the road ends over the gap.
    box(environment, 0.46, 1.2, 2.9, "#e8c388", p.x + side * 0.1, p.y - 0.5, 0, true);
    for (const dz of [-1, 1]) {
      const ring = mesh(environment, new THREE.TorusGeometry(1.1 + dz * 0.0, 0.07, 6, 28), "#ffffff", p.x + side * 0.4, WATER_Y + 0.05, dz * 0.3,
        { transparent: true, opacity: 0.55 });
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1.5, 3.2, 1);
      ring.castShadow = false;
      foam.push({ ring, phase: side + dz });
    }
  }
  // Start signpost.
  {
    const p = worldPoint(start, 0);
    box(environment, 0.16, 1.7, 0.16, "#8a5a2b", p.x - 6.4, p.y + 0.8, 2.3, true);
    const board = box(environment, 1.5, 0.62, 0.14, "#e8b265", p.x - 5.8, p.y + 1.45, 2.3, true);
    mesh(board, new THREE.ConeGeometry(0.2, 0.42, 3), "#ff5a3c", 0.55, 0, 0.1).rotation.z = -Math.PI / 2;
  }

  // Far hills and puffy clouds.
  for (let j = 0; j < 12; j++) {
    const x = -52 + j * 9.5 + (j % 3) * 1.5,
      r = 6 + (j % 4) * 1.3;
    const hill = mesh(environment, new THREE.SphereGeometry(r, 14, 10), j % 2 ? "#8fd96b" : "#6fc765",
      x, -3.5, -26 - (j % 3) * 4);
    hill.scale.y = 0.62;
    hill.castShadow = false;
    if (j % 3 === 0) {
      const far = mesh(environment, new THREE.SphereGeometry(r * 1.5, 12, 8), "#a9dff0", x + 5, -4, -48);
      far.scale.y = 0.55;
      far.castShadow = false;
    }
  }
  const waterGeometry = new THREE.PlaneGeometry(110, 120, 44, 44);
  waterGeometry.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeometry, new THREE.MeshStandardMaterial({
    color: "#2bc0e0", roughness: 0.28, metalness: 0.08, flatShading: true,
  }));
  water.position.y = WATER_Y;
  water.receiveShadow = true;
  environment.add(water);
  const glints = [];
  for (let j = 0; j < 38; j++) {
    const glint = box(environment, 0.35 + (j % 4) * 0.35, 0.012, 0.05, "#e9fbff",
      Math.sin(j * 8.3) * 8, WATER_Y + 0.1, -16 + j * 1.2);
    glint.castShadow = false;
    glint.userData.origin = glint.position.x;
    glints.push(glint);
  }
  const clouds = [];
  for (let j = 0; j < 7; j++) {
    const cloud = new THREE.Group();
    cloud.position.set(-34 + j * 11, 13 + (j % 3) * 2.4, -24 - (j % 3) * 4);
    for (let k = 0; k < 5; k++) {
      const puff = mesh(cloud, new THREE.IcosahedronGeometry(1.5 - Math.abs(k - 2) * 0.22, 1), "#ffffff",
        k * 1.5, Math.sin(k * 1.2) * 0.5, 0);
      puff.scale.set(1.4, 0.8, 1);
      puff.castShadow = false;
    }
    environment.add(cloud);
    clouds.push(cloud);
  }
  const birds = [];
  for (let j = 0; j < 3; j++) {
    const bird = new THREE.Group();
    const wings = [-1, 1].map((side) => {
      const wing = box(bird, 0.7, 0.05, 0.22, "#ffffff", side * 0.35, 0, 0);
      wing.geometry.translate(side * 0.35, 0, 0);
      wing.position.x = 0;
      wing.castShadow = false;
      return wing;
    });
    bird.position.set(-40 + j * 14, 10 + j * 0.8, -14);
    bird.userData = { wings, speed: 1.6 + j * 0.4, base: bird.position.x };
    environment.add(bird);
    birds.push(bird);
  }
  const fish = box(environment, 0.5, 0.2, 0.18, "#ff8f4d", 0, WATER_Y - 1, -2, true);
  fish.castShadow = false;
  fish.userData = { t: -1 };

  // Finish flag and arch.
  const finishPoint = worldPoint(finish, -1.8);
  box(environment, 0.1, 3, 0.1, "#f3e7c8", finishPoint.x + 1, finishPoint.y + 1.5, finishPoint.z, true);
  for (let x = 0; x < 4; x++)
    for (let y = 0; y < 3; y++)
      box(environment, 0.34, 0.34, 0.05, (x + y) % 2 ? "#ffffff" : "#2a2438",
        finishPoint.x + 1.2 + x * 0.34, finishPoint.y + 2.8 - y * 0.34, finishPoint.z);

  // The delivery truck: smooth bevelled body from side profiles, round lights, real wheels.
  const truck = new THREE.Group(),
    body = new THREE.Group(),
    crates = new THREE.Group(), // roof beacon: wobbles while driving
    wheels = [];
  root.add(truck);
  truck.add(body);
  truck.scale.setScalar(0.8);
  const glassMaterial = new THREE.MeshToonMaterial({ color: "#bfe9ff", gradientMap: steps, emissive: "#6fb8e6", emissiveIntensity: 0.35 });
  materials.set("glass", glassMaterial);
  function rounded(x, y, w, h, r) {
    const s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // Extrudes a side profile across the truck width with rounded (bevelled) edges and an ink outline.
  function solid(shape, depth, color, { bevel = 0.07, ink = 0.035, glass = false } = {}) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 14,
    });
    geometry.computeBoundingBox();
    const c = geometry.boundingBox.getCenter(new THREE.Vector3()),
      size = geometry.boundingBox.getSize(new THREE.Vector3());
    geometry.translate(-c.x, -c.y, -c.z);
    const object = new THREE.Mesh(geometry, glass ? glassMaterial : material(color));
    object.position.set(c.x, c.y, 0);
    object.castShadow = !glass;
    object.receiveShadow = true;
    body.add(object);
    if (ink) {
      const shell = new THREE.Mesh(geometry, outlineMaterial);
      shell.scale.set((size.x + ink * 2) / size.x, (size.y + ink * 2) / size.y, (size.z + ink * 2) / size.z);
      object.add(shell);
    }
    return object;
  }
  const RED = "#e8452c", DARK = "#2d2640", CHROME = "#dfe5ec";
  // Chassis, cargo box and cab (hood sloping into the windshield).
  solid(rounded(-1.82, 0.36, 3.7, 0.24, 0.1), 0.78, DARK, { bevel: 0.05 });
  solid(rounded(-1.78, 0.52, 1.8, 1.08, 0.14), 1.04, "#fff1d0", { bevel: 0.07 });
  const cab = new THREE.Shape();
  cab.moveTo(0.08, 0.5);
  cab.lineTo(0.08, 1.2);
  cab.quadraticCurveTo(0.1, 1.44, 0.34, 1.46);
  cab.lineTo(0.84, 1.46);
  cab.quadraticCurveTo(1.0, 1.45, 1.1, 1.3);
  cab.lineTo(1.32, 0.99);
  cab.quadraticCurveTo(1.37, 0.92, 1.52, 0.92);
  cab.lineTo(1.72, 0.9);
  cab.quadraticCurveTo(1.84, 0.88, 1.84, 0.72);
  cab.lineTo(1.84, 0.5);
  cab.closePath();
  solid(cab, 1.0, RED, { bevel: 0.08 });
  // Windows: side glass for both sides and a sloped windshield.
  const glass = new THREE.Shape();
  glass.moveTo(0.26, 1.02);
  glass.lineTo(0.26, 1.34);
  glass.quadraticCurveTo(0.27, 1.4, 0.36, 1.4);
  glass.lineTo(0.84, 1.4);
  glass.lineTo(1.2, 1.02);
  glass.closePath();
  for (const side of [-1, 1]) {
    const pane = solid(glass, 0.02, "#000", { bevel: 0, ink: 0, glass: true });
    pane.position.z = side * 0.6;
    const frame = solid(glass, 0.012, "#2a2438", { bevel: 0, ink: 0 });
    frame.position.z = side * 0.592;
    frame.scale.set(1.07, 1.1, 1);
    // Door seam and handle.
    box(body, 0.025, 0.62, 0.03, "#a82f1d", 0.66, 0.96, side * 0.6);
    box(body, 0.14, 0.045, 0.045, CHROME, 0.9, 1.0, side * 0.61);
  }
  const slope = new THREE.Vector3(0.22, -0.31, 0).normalize();
  const windshield = box(body, 0.03, 0.4, 0.86, "#bfe9ff", 1.215, 1.15, 0);
  windshield.material = glassMaterial;
  windshield.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), slope);
  windshield.position.add(new THREE.Vector3(slope.y * -1, slope.x, 0).multiplyScalar(0.03));
  // Cargo emblem and stripe, rear door seam.
  box(body, 1.82, 0.14, 1.14, RED, -0.88, 0.74, 0);
  for (const side of [-1, 1]) {
    const emblem = mesh(body, new THREE.CircleGeometry(0.3, 22), "#ffd54a", -0.88, 1.17, side * 0.63);
    emblem.castShadow = false;
    if (side < 0) emblem.rotation.y = Math.PI;
    const dot = mesh(body, new THREE.CircleGeometry(0.17, 18), RED, -0.88, 1.17, side * 0.635);
    dot.castShadow = false;
    if (side < 0) dot.rotation.y = Math.PI;
  }
  box(body, 0.03, 1.0, 0.03, "#c9b48a", -1.84, 1.08, 0);
  // Bumpers (capsules), round headlights, grille and tail lights.
  for (const x of [1.9, -1.86]) {
    const bumper = mesh(body, new THREE.CapsuleGeometry(0.08, 0.86, 4, 10), CHROME, x, 0.5, 0);
    bumper.rotation.x = Math.PI / 2;
    outline(bumper, 0.025);
  }
  for (const z of [-0.37, 0.37]) {
    const light = mesh(body, new THREE.SphereGeometry(0.13, 14, 10), "#fff6a8", 1.86, 0.76, z, { emissive: "#ffe27a" });
    light.scale.x = 0.45;
    outline(light, 0.02);
    const tail = box(body, 0.05, 0.14, 0.18, "#ff3b30", -1.86, 0.74, z * 1.15);
    tail.material = material("#ff3b30", { emissive: "#c01810" });
  }
  box(body, 0.04, 0.2, 0.48, "#2a2438", 1.87, 0.62, 0, true);
  box(body, 0.05, 0.1, 0.22, "#ffffff", 1.9, 0.5, 0);
  // Side mirrors and exhaust.
  for (const side of [-1, 1]) {
    box(body, 0.04, 0.04, 0.16, "#2a2438", 1.14, 1.12, side * 0.62);
    const mirror = mesh(body, new THREE.SphereGeometry(0.09, 10, 8), "#2a2438", 1.14, 1.14, side * 0.74);
    mirror.scale.set(0.6, 1, 0.8);
  }
  mesh(body, new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), "#8d97a5", -0.06, 1.55, 0.5);
  body.add(crates);
  const beaconBase = mesh(crates, new THREE.CylinderGeometry(0.16, 0.2, 0.08, 14), DARK, 0.6, 1.54, 0);
  beaconBase.castShadow = false;
  mesh(crates, new THREE.SphereGeometry(0.13, 12, 10), "#ffb020", 0.6, 1.64, 0, { emissive: "#ff9a00" });
  // Wheel arches and wheels (tyre, rim, hub and lug bolts so the spin is visible).
  for (const [x, arch] of [[1.18, RED], [-1.0, DARK]])
    for (const z of [-0.6, 0.6]) {
      const arc = mesh(body, new THREE.TorusGeometry(0.47, 0.075, 8, 24, Math.PI), arch, x, 0.4, z * 0.97);
      arc.castShadow = false;
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.4, z * 1.03);
      const tire = mesh(wheel, new THREE.CylinderGeometry(0.4, 0.4, 0.3, 26), "#26212f");
      tire.rotation.x = Math.PI / 2;
      const rim = mesh(wheel, new THREE.CylinderGeometry(0.25, 0.25, 0.32, 20), CHROME);
      rim.rotation.x = Math.PI / 2;
      const hub = mesh(wheel, new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12), "#8d97a5");
      hub.rotation.x = Math.PI / 2;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const bolt = mesh(wheel, new THREE.CylinderGeometry(0.026, 0.026, 0.37, 6), "#4a4458", Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0);
        bolt.rotation.x = Math.PI / 2;
        bolt.castShadow = false;
      }
      body.add(wheel);
      wheels.push(wheel);
    }

  const particles = createParticles(root);
  const debris = new Map();
  let knownEdges = null,
    previewBeam = null,
    shake = 0,
    smokeClock = 0,
    previousPose = null,
    elapsed = 0,
    wasBroken = false;
  const splashed = new Set();
  function clearBridge() {
    bridge.traverse((o) => {
      if (o.geometry && o.geometry.type !== "BoxGeometry") o.geometry.dispose();
    });
    bridge.clear();
    debris.clear();
    previewBeam = null;
  }
  function setBridge(edges, selectedId, preview) {
    clearBridge();
    const now = performance.now();
    const fresh = knownEdges ? edges.filter((e) => e.isPlayerBuilt && !knownEdges.has(e.id)) : [];
    knownEdges = new Set(edges.map((e) => e.id));
    for (const edge of edges) {
      const a = level.nodes.find((n) => n.id === edge.fromNodeId),
        b = level.nodes.find((n) => n.id === edge.toNodeId);
      const group = new THREE.Group();
      bridge.add(group);
      const selected = selectedId === edge.id;
      const A = worldPoint(a, 0),
        B = worldPoint(b, 0);
      if (edge.type === "road") {
        const length = A.distanceTo(B);
        const angle = Math.atan2(B.y - A.y, B.x - A.x);
        for (const z of [-0.95, 0.95])
          beam(group, A.clone().add(new THREE.Vector3(0, -0.2, z)), B.clone().add(new THREE.Vector3(0, -0.2, z)),
            0.2, 0.2, selected ? "#ffc45b" : "#7a4a22", true);
        const count = Math.max(1, Math.round(length / 0.5));
        for (let j = 0; j < count; j++) {
          const p = A.clone().lerp(B, (j + 0.5) / count);
          const plank = box(group, (length / count) * 0.9, 0.14, 2.06, selected ? "#ffd98a" : j % 2 ? "#dba765" : "#c98e4c", p.x, p.y, 0);
          plank.rotation.z = angle;
        }
        for (const z of [-1.08, 1.08]) {
          beam(group, A.clone().add(new THREE.Vector3(0, 0.55, z)), B.clone().add(new THREE.Vector3(0, 0.55, z)),
            0.09, 0.09, "#a9bccf", true);
          const posts = Math.max(1, Math.round(length / 1.1));
          for (let j = 0; j <= posts; j++) {
            const p = A.clone().lerp(B, j / posts);
            box(group, 0.1, 0.55, 0.1, "#8497ab", p.x, p.y + 0.28, z);
          }
        }
      } else {
        for (const z of [-1.18, 1.18]) {
          beam(group, worldPoint(a, z), worldPoint(b, z), 0.26, 0.26, selected ? "#ffc45b" : "#8fa6bd", true);
          beam(group, worldPoint(a, z), worldPoint(b, z), 0.1, 0.3, "#ff8a3d");
        }
      }
      const origin = A.clone().lerp(B, 0.5);
      group.children.forEach((child) => child.position.sub(origin));
      group.position.copy(origin);
      group.userData.origin = origin;
      if (fresh.some((e) => e.id === edge.id)) {
        group.userData.born = now;
        group.scale.setScalar(0.01);
        for (const end of [A, B]) particles.emit(end.clone().setZ(0), { count: 9, color: "#f3d9a8", speed: 1.3, spread: 1.2, up: 1.1, life: 0.55, size: 0.14 });
      }
      debris.set(edge.id, group);
    }
    for (const n of level.nodes) {
      for (const z of [-1.2, 1.2]) {
        const p = worldPoint(n, z);
        const joint = mesh(bridge, new THREE.SphereGeometry(n.type === "anchor" ? 0.3 : 0.25, 12, 10),
          n.type === "anchor" ? "#ffd54a" : "#c7d5e3", p.x, p.y, p.z);
        outline(joint, 0.04);
      }
    }
    if (preview) {
      previewBeam = beam(bridge, worldPoint(preview.a), worldPoint(preview.b), 0.14, 0.14,
        preview.ok ? "#5fe08a" : "#ff6b4a");
      previewBeam.material = new THREE.MeshBasicMaterial({ color: preview.ok ? "#5fe08a" : "#ff6b4a", transparent: true, opacity: 0.8 });
    }
  }
  let camera;
  function resize(nextCamera, width, height) {
    camera = nextCamera;
    renderer.setSize(width, height, false);
  }
  function render(frame, dt = 0) {
    elapsed += dt;
    const moving = frame.phase === "building" || frame.phase === "testing";
    const animate = moving && !frame.reducedMotion;
    const time = animate ? elapsed : 0;
    const now = performance.now();
    if (animate) {
      const vertices = waterGeometry.attributes.position;
      for (let i = 0; i < vertices.count; i++)
        vertices.setY(i, Math.sin(vertices.getX(i) * 0.6 + time) * 0.07 + Math.cos(vertices.getZ(i) * 0.5 + time * 0.7) * 0.05);
      vertices.needsUpdate = true;
      glints.forEach((g, i) => {
        g.position.x = g.userData.origin + Math.sin(time * 0.45 + i) * 0.8;
        g.visible = Math.sin(time * 2 + i * 1.7) > -0.5;
      });
      clouds.forEach((c, i) => {
        c.position.x = -34 + i * 11 + Math.sin(time * 0.04 + i) * 3;
      });
      birds.forEach((bird) => {
        const { wings, speed, base } = bird.userData;
        bird.position.x = ((base + 45 + time * speed) % 90) - 45;
        bird.position.y += Math.sin(time * 2 + base) * 0.002;
        wings[0].rotation.z = Math.sin(time * 11) * 0.7;
        wings[1].rotation.z = -Math.sin(time * 11) * 0.7;
      });
      foam.forEach(({ ring, phase }) => {
        const k = 1 + Math.sin(time * 1.6 + phase) * 0.06;
        ring.scale.set(1.5 * k, 3.2 * k, 1);
        ring.material.opacity = 0.4 + Math.sin(time * 1.6 + phase) * 0.15;
      });
      const jump = fish.userData;
      if (jump.t < 0 && Math.sin(time * 0.9) > 0.985) {
        jump.t = 0;
        fish.position.x = (Math.sin(time * 13.1) * 9) | 0;
      }
      if (jump.t >= 0) {
        jump.t += dt;
        const s = jump.t / 1.1;
        fish.position.y = WATER_Y - 0.4 + Math.sin(Math.min(1, s) * Math.PI) * 2.4;
        fish.rotation.z = Math.cos(Math.min(1, s) * Math.PI) * 0.9;
        if (s >= 1) {
          jump.t = -1;
          fish.position.y = WATER_Y - 1;
          particles.emit(new THREE.Vector3(fish.position.x, WATER_Y + 0.1, -2), { count: 8, color: "#e9fbff", speed: 2, up: 1.6, life: 0.6, size: 0.1 });
        }
      }
      if (previewBeam) previewBeam.material.opacity = 0.55 + Math.sin(time * 8) * 0.25;
    }
    const pose = frame.pose ?? { x: start.x - 48, y: start.y, angle: 0 };
    const p = worldPoint(pose, 0);
    const failureTime = frame.broken ? frame.collapseSeconds : 0;
    const drop = failureTime * failureTime * 7;
    truck.position.set(p.x, p.y + 0.1 - drop, 0);
    truck.rotation.z = (-pose.angle * Math.PI) / 180 - failureTime * 0.75;
    const travelled = previousPose ? p.distanceTo(previousPose) : 0;
    body.position.y = animate && frame.phase === "testing" && travelled > 0.0005 && !frame.broken ? Math.sin(time * 24) * 0.022 : 0;
    crates.rotation.z = frame.broken ? Math.min(1, failureTime) * 0.5 : body.position.y * 1.5;
    if (previousPose && animate && frame.phase === "testing") {
      wheels.forEach((w) => {
        w.rotation.z -= travelled / 0.32;
      });
      smokeClock += dt;
      if (travelled > 0.0005 && !frame.broken && smokeClock > 0.07) {
        smokeClock = 0;
        particles.emit(new THREE.Vector3(p.x - 0.05, p.y + 1.85, 0.4), { count: 1, color: "#e8e6f0", speed: 0.5, up: 1.2, spread: 0.4, gravity: -0.6, life: 0.8, size: 0.2, grow: true });
      }
    }
    previousPose = p;

    if (frame.broken && !wasBroken) {
      shake = frame.reducedMotion ? 0 : 0.34;
      splashed.clear();
    }
    if (!frame.broken) splashed.clear();
    wasBroken = !!frame.broken;
    const collapsed = [];
    const splash = (key, at, strength) => {
      if (splashed.has(key)) return;
      splashed.add(key);
      particles.emit(new THREE.Vector3(at.x, WATER_Y + 0.1, at.z), { count: 22 * strength, color: "#dff7ff", speed: 3.2, up: 2.6, spread: 1.4, gravity: 9, life: 0.9, size: 0.14 });
      if (!frame.reducedMotion) shake = Math.max(shake, 0.16 * strength);
    };
    debris.forEach((g, id) => {
      const weak = frame.broken && frame.collapseEdgeIds.includes(id);
      const seed = hash(id);
      g.position.copy(g.userData.origin);
      const born = g.userData.born;
      let pop = 1;
      if (born !== undefined) {
        const age = (now - born) / 280;
        if (age >= 1 || frame.reducedMotion) delete g.userData.born;
        else pop = Math.max(0.01, easeOutBack(Math.max(0, age)));
      }
      if (weak) {
        const swing = failureTime * (0.5 + seed * 0.9) * (seed > 0.5 ? 1 : -1);
        g.position.y -= drop * (0.8 + seed * 0.5);
        g.position.x += swing * failureTime * 0.6;
        g.rotation.z = swing;
        g.rotation.x = failureTime * 0.35 * seed;
        if (g.position.y < WATER_Y + 0.4) splash(id, g.position, 0.8);
      } else {
        g.rotation.set(0, 0, 0);
      }
      g.scale.setScalar(pop);
      if (g.position.y < g.userData.origin.y) collapsed.push(id);
    });
    if (frame.broken && truck.position.y < WATER_Y + 0.8) splash("truck", truck.position, 1.3);

    particles.update(dt);
    shake = Math.max(0, shake - dt * 0.9);
    const jitter = shake > 0.001 ? shake * shake * 2.4 : 0;
    root.position.set((Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter, 0);

    // Renderer diagnostics also allow browser QA to verify actual mesh motion.
    canvas.dataset.collapsedEdges = JSON.stringify(collapsed);
    canvas.dataset.vehicleX = String(truck.position.x);
    if (camera) renderer.render(scene, camera);
  }
  function dispose() {
    scene.traverse((o) => o.geometry?.dispose());
    particles.dispose();
    materials.forEach((m) => m.dispose());
    outlineMaterial.dispose();
    steps.dispose();
    sky.dispose();
    sun.shadow.map?.dispose();
    renderer.dispose();
  }
  return { resize, setBridge, render, dispose };
}
