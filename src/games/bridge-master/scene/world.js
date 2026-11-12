import * as THREE from "three";
import { worldPoint } from "./camera.js";

// Procedural geometry stays local; the deterministic engine remains the source of game outcomes.
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#d5e6df");
  scene.fog = new THREE.Fog("#d5e6df", 42, 95);
  const environment = new THREE.Group(),
    bridge = new THREE.Group();
  scene.add(environment, bridge);
  const materials = new Map();
  function material(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra }),
      );
    return materials.get(key);
  }
  function mesh(parent, geometry, color, x = 0, y = 0, z = 0, extra) {
    const object = new THREE.Mesh(geometry, material(color, extra));
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const box = (parent, w, h, d, color, x, y, z) =>
    mesh(parent, new THREE.BoxGeometry(w, h, d), color, x, y, z);
  function beam(parent, a, b, width, depth, color) {
    const delta = b.clone().sub(a);
    const object = box(
      parent,
      delta.length(),
      width,
      depth,
      color,
      ...a.clone().add(b).multiplyScalar(0.5).toArray(),
    );
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(1, 0, 0),
      delta.normalize(),
    );
    return object;
  }
  scene.add(new THREE.HemisphereLight("#f5fff4", "#486b70", 2.4));
  const sun = new THREE.DirectionalLight("#fff1cb", 3.1);
  sun.position.set(-12, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -24,
    right: 24,
    top: 18,
    bottom: -18,
    near: 1,
    far: 65,
  });
  sun.shadow.normalBias = 0.045;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  const start = level.nodes.find((n) => n.id === level.startNodeId);
  const finish = level.nodes.find((n) => n.id === level.finishNodeId);
  function tree(x, y, z, scale = 1, tint = "#527f65") {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    box(group, 0.19, 1.4, 0.19, "#806e4d", 0, 0.7, 0);
    mesh(group, new THREE.ConeGeometry(0.95, 1.65, 7), tint, 0, 1.65, 0);
    mesh(group, new THREE.ConeGeometry(0.72, 1.5, 7), tint, 0, 2.35, 0);
    mesh(group, new THREE.ConeGeometry(0.48, 1.2, 7), "#7a9b70", 0, 2.95, 0);
    environment.add(group);
  }
  for (const [side, node] of [
    [-1, start],
    [1, finish],
  ]) {
    const p = worldPoint(node, 0),
      center = p.x + side * 7;
    const shape = new THREE.Shape();
    const points = [
      [-7, -12],
      [7, -12],
      [7, 5.5],
      [5.8, 7.2],
      [2.5, 8],
      [-3, 7.4],
      [-7, 5.5],
    ];
    points.forEach(([x, z], i) =>
      i ? shape.lineTo(x, z) : shape.moveTo(x, z),
    );
    shape.closePath();
    const cliff = mesh(
      environment,
      new THREE.ExtrudeGeometry(shape, {
        depth: 6.6,
        bevelEnabled: true,
        bevelSize: 0.25,
        bevelThickness: 0.25,
        bevelSegments: 1,
        steps: 1,
      }),
      "#b6ad8f",
      center,
      p.y - 0.35,
      0,
    );
    cliff.rotation.x = Math.PI / 2;
    const grass = mesh(
      environment,
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.26,
        bevelEnabled: false,
        steps: 1,
      }),
      "#93ac77",
      center,
      p.y - 0.09,
      0,
    );
    grass.rotation.x = Math.PI / 2;
    box(environment, 14, 0.16, 2.25, "#556b65", center, p.y - 0.02, 0);
    for (let j = 0; j < 10; j++)
      box(
        environment,
        0.65,
        0.025,
        0.08,
        "#e5dcb2",
        center - 6.5 + j * 1.4,
        p.y + 0.08,
        0,
      );
    for (let j = 0; j < 10; j++) {
      const x = center - 5 + (j % 4) * 3.1;
      const z = -3 - Math.floor(j / 4) * 3.3;
      tree(x, p.y, z, 0.75 + (j % 3) * 0.17, j % 2 ? "#507e62" : "#658b66");
    }
    tree(center + side * 2.5, p.y, 4, 1.25);
    for (let j = 0; j < 7; j++) {
      const rock = mesh(
        environment,
        new THREE.DodecahedronGeometry(1, 0),
        j % 2 ? "#a09e83" : "#c6bb9a",
        p.x + side * (0.3 + (j % 2)),
        p.y - 1.8 - (j % 3) * 1.4,
        -9 + j * 2.5,
      );
      rock.scale.set(1.15, 1.5, 1.8);
      rock.rotation.set(j * 0.4, j * 0.7, 0.3);
    }
    box(environment, 0.4, 1.1, 2.8, "#eee6cf", p.x + side * 0.1, p.y - 0.52, 0);
  }
  // Mountain ranges and snow caps give depth at every aspect ratio.
  for (let j = 0; j < 11; j++) {
    const x = -42 + j * 8,
      radius = 5 + (j % 3),
      h = 7 + (j % 4);
    const mountain = mesh(
      environment,
      new THREE.ConeGeometry(radius, h, 6),
      j % 2 ? "#91ac97" : "#a3bca7",
      x,
      h / 2 - 7,
      -22 - (j % 3) * 3,
    );
    mountain.rotation.y = j * 0.73;
    const cap = mesh(
      environment,
      new THREE.ConeGeometry(radius * 0.24, h * 0.24, 6),
      "#e8eee1",
      x,
      h * 0.88 - 7,
      mountain.position.z,
    );
    cap.rotation.y = mountain.rotation.y;
  }
  const waterGeometry = new THREE.PlaneGeometry(100, 110, 48, 48);
  waterGeometry.rotateX(-Math.PI / 2);
  const water = mesh(environment, waterGeometry, "#458f94", 0, -5.1, 0, {
    roughness: 0.25,
    metalness: 0.22,
  });
  water.castShadow = false;
  const glints = [];
  for (let j = 0; j < 34; j++) {
    const glint = box(
      environment,
      0.35 + (j % 4) * 0.33,
      0.012,
      0.045,
      "#a9d8cb",
      Math.sin(j * 8.3) * 7,
      -4.98,
      -16 + j * 1.25,
    );
    glint.castShadow = false;
    glint.userData.origin = glint.position.x;
    glints.push(glint);
  }
  const clouds = [];
  for (let j = 0; j < 5; j++) {
    const cloud = new THREE.Group();
    cloud.position.set(-28 + j * 14, 14 + (j % 2) * 3, -25 - (j % 3) * 4);
    for (let k = 0; k < 4; k++) {
      const puff = mesh(
        cloud,
        new THREE.IcosahedronGeometry(1.6, 1),
        "#f3f3e7",
        k * 1.6,
        Math.sin(k) * 0.6,
        0,
      );
      puff.scale.set(1.5, 0.7, 1);
      puff.castShadow = false;
    }
    environment.add(cloud);
    clouds.push(cloud);
  }
  const finishPoint = worldPoint(finish, -1.8);
  box(
    environment,
    0.08,
    2.7,
    0.08,
    "#e9e0c1",
    finishPoint.x + 1,
    finishPoint.y + 1.35,
    finishPoint.z,
  );
  for (let x = 0; x < 4; x++)
    for (let y = 0; y < 3; y++)
      box(
        environment,
        0.3,
        0.3,
        0.04,
        (x + y) % 2 ? "#f5eed7" : "#285a4c",
        finishPoint.x + 1.15 + x * 0.3,
        finishPoint.y + 2.55 - y * 0.3,
        finishPoint.z,
      );

  const truck = new THREE.Group(),
    wheels = [];
  scene.add(truck);
  box(truck, 1.9, 0.25, 1, "#354c46", 0, 0.48, 0);
  box(truck, 1.9, 0.55, 1.05, "#e7a635", -0.08, 0.88, 0);
  box(truck, 0.9, 0.6, 0.92, "#f6bf4f", 0.34, 1.4, 0);
  box(truck, 0.65, 0.38, 0.94, "#6aafb3", 0.35, 1.48, 0);
  box(truck, 0.94, 0.1, 1.02, "#f9cd6a", 0.33, 1.75, 0);
  box(truck, 0.6, 0.13, 1.02, "#ffce6d", -0.7, 1.2, 0);
  for (const x of [-0.63, 0.65])
    for (const z of [-0.57, 0.57]) {
      const wheel = mesh(
        truck,
        new THREE.CylinderGeometry(0.33, 0.33, 0.21, 16),
        "#2c403e",
        x,
        0.33,
        z,
      );
      wheel.rotation.x = Math.PI / 2;
      wheels.push(wheel);
      const hub = mesh(
        truck,
        new THREE.CylinderGeometry(0.15, 0.15, 0.23, 12),
        "#d7d8bd",
        x,
        0.33,
        z,
      );
      hub.rotation.x = Math.PI / 2;
    }
  for (const z of [-0.34, 0.34])
    box(truck, 0.05, 0.18, 0.22, "#fff0b6", 0.9, 0.93, z);
  box(truck, 0.1, 0.12, 1.12, "#ede4c9", 1, 0.55, 0);

  const debris = new Map();
  function clearBridge() {
    bridge.traverse((o) => o.geometry?.dispose());
    bridge.clear();
    debris.clear();
  }
  function setBridge(edges, selectedId, preview) {
    clearBridge();
    for (const edge of edges) {
      const a = level.nodes.find((n) => n.id === edge.fromNodeId),
        b = level.nodes.find((n) => n.id === edge.toNodeId);
      const group = new THREE.Group();
      bridge.add(group);
      const color =
        selectedId === edge.id
          ? "#ffc45b"
          : edge.type === "road"
            ? "#576c67"
            : "#c7975e";
      if (edge.type === "road") {
        beam(group, worldPoint(a, 0), worldPoint(b, 0), 0.22, 2.2, color);
        for (const z of [-1.13, 1.13])
          beam(
            group,
            worldPoint(a, z).add(new THREE.Vector3(0, -0.17, 0)),
            worldPoint(b, z).add(new THREE.Vector3(0, -0.17, 0)),
            0.26,
            0.16,
            "#dfbb78",
          );
        const len = worldPoint(a).distanceTo(worldPoint(b));
        for (let j = 0; j < Math.floor(len / 0.65); j++) {
          const p = worldPoint(a, 0).lerp(
            worldPoint(b, 0),
            (j + 0.5) / Math.floor(len / 0.65),
          );
          const stripe = box(
            group,
            0.3,
            0.025,
            0.07,
            "#eee4b7",
            p.x,
            p.y + 0.13,
            0,
          );
          stripe.rotation.z = Math.atan2(a.y - b.y, b.x - a.x);
        }
      } else {
        for (const z of [-1.18, 1.18])
          beam(group, worldPoint(a, z), worldPoint(b, z), 0.2, 0.2, color);
      }
      debris.set(edge.id, group);
    }
    for (const n of level.nodes) {
      for (const z of [-1.2, 1.2]) {
        const p = worldPoint(n, z);
        const joint = mesh(
          bridge,
          new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12),
          n.type === "anchor" ? "#e6b953" : "#e9dab3",
          p.x,
          p.y,
          p.z,
        );
        joint.rotation.x = Math.PI / 2;
      }
    }
    if (preview)
      beam(
        bridge,
        worldPoint(preview.a),
        worldPoint(preview.b),
        0.11,
        0.11,
        preview.ok ? "#82cba6" : "#dd775f",
      );
  }
  let camera,
    previousPose = null,
    failureTime = 0,
    elapsed = 0;
  function resize(nextCamera, width, height) {
    camera = nextCamera;
    renderer.setSize(width, height, false);
  }
  function render(frame, dt = 0) {
    elapsed += dt;
    const moving = frame.phase === "building" || frame.phase === "testing";
    const animate = moving && !frame.reducedMotion;
    const time = animate ? elapsed : 0;
    const vertices = waterGeometry.attributes.position;
    if (animate) {
      for (let i = 0; i < vertices.count; i++)
        vertices.setY(
          i,
          Math.sin(vertices.getX(i) * 0.6 + time) * 0.055 +
            Math.cos(vertices.getZ(i) * 0.5 + time * 0.7) * 0.04,
        );
      vertices.needsUpdate = true;
      glints.forEach((g, i) => {
        g.position.x = g.userData.origin + Math.sin(time * 0.45 + i) * 0.8;
      });
      clouds.forEach((c, i) => {
        c.position.x = -28 + i * 14 + Math.sin(time * 0.035 + i) * 2;
      });
    }
    const pose = frame.pose ?? { x: start.x - 48, y: start.y, angle: 0 };
    const p = worldPoint(pose, 0);
    if (frame.broken && animate) failureTime = Math.min(0.8, failureTime + dt);
    else if (!frame.broken) failureTime = 0;
    truck.position.set(p.x, p.y + 0.1 - failureTime * failureTime * 7, 0);
    truck.rotation.z = (-pose.angle * Math.PI) / 180 - failureTime * 0.65;
    if (previousPose && animate && frame.phase === "testing") {
      const distance = p.distanceTo(previousPose);
      wheels.forEach((w) => {
        w.rotation.y -= distance / 0.33;
      });
    }
    previousPose = p;
    debris.forEach((g, id) => {
      const weak = frame.broken && id === frame.weakEdgeId;
      g.position.y = weak ? -failureTime * failureTime * 5 : 0;
      g.rotation.z = weak ? failureTime * 0.2 : 0;
    });
    if (camera) renderer.render(scene, camera);
  }
  function dispose() {
    scene.traverse((o) => o.geometry?.dispose());
    materials.forEach((m) => m.dispose());
    sun.shadow.map?.dispose();
    renderer.dispose();
  }
  return { resize, setBridge, render, dispose };
}
