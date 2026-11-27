import { img, svg, sizeOf } from "../assets/design/index.js";
import { toStage, UNITS, WATER_LEVEL, visibleStage } from "./view.js";

// Layered 2D illustration of the bridge site, built from the design pack: backdrop plate, water,
// cliff slabs, vegetation and props, the road, the bridge beams, the truck and particles. It keeps
// the exact interface of the old 3D world (`resize`, `setBridge`, `render`, `dispose`) so the game
// logic stays untouched: the deterministic engine decides every outcome, this only draws it.
const SLAB = 0.62; // stage pixels per cliff-sprite pixel
// Where the road meets the cliff lip, in cliff-sprite pixels.
const LIP = { left: { x: 1384, y: 92 }, right: { x: 10, y: 96 } };
const ROAD = { up: 38, down: 2 }; // road band relative to the anchor's stage y
const TRUCK_WIDTH = 176;
const WORLD = 35 * UNITS; // stage pixels per old "world unit" (kept for the collapse tuning)

const hash = (text) => {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};
const make = (parent, tag, className, css) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (css) Object.assign(element.style, css);
  parent.appendChild(element);
  return element;
};
// A sprite standing on `base` (stage y) with its bottom-centre at `x`.
function sprite(parent, name, { x, base, w, h, flip = false, className = "" }) {
  const s = sizeOf(name);
  const width = w ?? (h * s.w) / s.h,
    height = h ?? (w * s.h) / s.w;
  const element = make(parent, "img", `sc-sprite ${className}`, {
    left: `${x - width / 2}px`,
    top: `${base - height}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
  element.src = img(name);
  element.alt = "";
  element.draggable = false;
  if (flip) element.style.setProperty("--flip", "-1");
  return element;
}

// Pooled 2D particles (dust, smoke, splashes) drawn on a screen-space canvas in stage coordinates.
function createParticles(canvas, max = 220) {
  const g = canvas.getContext("2d"); // null where there is no canvas (tests): particles then stay invisible
  const items = Array.from({ length: max }, () => ({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, size: 4, color: "#fff", gravity: 0, grow: false }));
  let cursor = 0;
  return {
    emit(at, { count = 8, color = "#ffffff", speed = 50, up = 1, spread = 1, gravity = 260, life = 0.7, size = 4, grow = false } = {}) {
      for (let n = 0; n < count; n++) {
        const p = items[cursor];
        cursor = (cursor + 1) % max;
        p.x = at.x;
        p.y = at.y;
        p.vx = (Math.random() - 0.5) * 2 * spread * speed;
        p.vy = -up * (0.4 + Math.random()) * speed;
        p.life = p.max = life * (0.6 + Math.random() * 0.6);
        p.size = size * (0.6 + Math.random() * 0.8);
        p.color = color;
        p.gravity = gravity;
        p.grow = grow;
      }
    },
    update(dt) {
      for (const p of items) {
        if (p.life <= 0) continue;
        p.life -= dt;
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    },
    draw(view, width, height, dpr) {
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, width, height);
      for (const p of items) {
        if (p.life <= 0) continue;
        const k = Math.max(0, p.life / p.max);
        g.globalAlpha = Math.min(1, k * 1.4);
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(view.ox + p.x * view.k, view.oy + p.y * view.k, Math.max(0.5, p.size * (p.grow ? 1 + (1 - k) * 2 : k) * view.k), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    },
  };
}

export function createScene(host, level) {
  host.textContent = "";
  host.dataset.renderer = "layered";
  const root = make(host, "div", "sc-root");
  root.style.setProperty("--water", `url("${img("water")}")`);
  const stage = make(root, "div", "sc-stage");
  const start = level.nodes.find((n) => n.id === level.startNodeId),
    finish = level.nodes.find((n) => n.id === level.finishNodeId);
  const A = toStage(start),
    E = toStage(finish);
  const left = sizeOf("cliff-left"),
    right = sizeOf("cliff-right");
  const slabL = { w: left.w * SLAB, h: left.h * SLAB },
    slabR = { w: right.w * SLAB, h: right.h * SLAB };
  const topL = A.y - LIP.left.y * SLAB,
    topR = E.y - LIP.right.y * SLAB;
  const horizon = Math.max(topL, topR) + 40; // bottom of the backdrop plate
  const waterY = toStage({ x: 400, y: WATER_LEVEL }).y;

  // ---- Far scenery: sky colour, the backdrop plate, drifting clouds (move against the camera) ----
  const far = make(stage, "div", "sc-layer sc-far");
  const skyFill = make(far, "div", "sc-sky", { background: sizeOf("backdrop").top });
  const plate = make(far, "div", "sc-plate");
  const plateImage = make(plate, "img", "sc-plate-img");
  plateImage.src = img("backdrop");
  plateImage.alt = "";
  plateImage.draggable = false;
  const clouds = make(far, "div", "sc-clouds");
  [[-120, 70, 380, 70], [470, 150, 280, 95], [980, 60, 430, 80], [1460, 130, 320, 110]].forEach(([x, y, w, duration], i) => {
    const cloud = sprite(clouds, "cloud", { x, base: y + (w * 232) / 700, w, className: "sc-cloud" });
    cloud.style.animationDuration = `${duration}s`;
    cloud.style.animationDelay = `${-i * 17}s`;
  });

  // ---- Water below the plate, with shimmering highlights ----
  const water = make(stage, "div", "sc-layer sc-water");
  make(water, "div", "sc-shimmer sc-shimmer-a");
  make(water, "div", "sc-shimmer sc-shimmer-b");

  // ---- Banks: cliff slab, vegetation, road, sign / flag ----
  const world = make(stage, "div", "sc-layer sc-world");
  function bank(side, anchor, slabSize, slabTop) {
    const g = make(world, "div", `sc-bank sc-bank-${side}`);
    const dir = side === "l" ? -1 : 1;
    const slab = make(g, "img", "sc-slab");
    slab.src = img(side === "l" ? "cliff-left" : "cliff-right");
    slab.alt = "";
    slab.draggable = false;
    const place = { left: `${side === "l" ? anchor.x + 12 - slabSize.w : anchor.x - 12}px`, width: `${slabSize.w}px`, height: `${slabSize.h}px` };
    // A second copy, raised and faded out below its grass, gives the bank a ridge of grass behind the road.
    const ridge = make(g, "img", "sc-slab sc-ridge", { ...place, top: `${slabTop - 52}px` });
    ridge.src = slab.src = img(side === "l" ? "cliff-left" : "cliff-right");
    ridge.alt = "";
    ridge.draggable = false;
    g.insertBefore(ridge, slab);
    Object.assign(slab.style, { ...place, top: `${slabTop}px` });
    const slabBottom = slabTop + slabSize.h;
    const back = anchor.y - ROAD.up - 14; // trees and bushes stand on the grass behind the road
    const put = (name, dx, base, opts = {}) => sprite(g, name, { x: anchor.x + dir * dx, base, flip: side === "r" && opts.mirror !== false, ...opts });
    // Back row of trees (sway a little), bushes and the fence.
    const trees = [
      ["tree-pine", 270, 176], ["tree-pine", 372, 138], ["tree-broadleaf", 480, 236],
      ["tree-pine", 610, 200], ["tree-pine", 700, 158], ["tree-broadleaf", 830, 210], ["tree-pine", 930, 190],
    ];
    trees.forEach(([name, dx, h], i) =>
      put(name, dx + (side === "r" ? 10 : 0), back + (i % 2 ? 6 : 0), { h: name === "tree-pine" ? h : undefined, w: name === "tree-pine" ? undefined : h * 1.02, className: "sc-sway", mirror: false }),
    );
    put("fence", side === "l" ? 560 : 360, back + 14, { w: 190 });
    put("bush", 170, back + 14, { w: 112 });
    put("bush", 760, back + 12, { w: 130 });
    // Props on the road edge.
    if (side === "l") put("sign", 214, anchor.y - ROAD.up + 6, { h: 92, mirror: false });
    else put("flag", 74, anchor.y - ROAD.up + 6, { h: 140, mirror: false, className: "sc-flag" });
    // Front strip of grass: flowers and stones between the road and the cliff lip.
    put("flowers", 330, anchor.y + 40, { w: 62 });
    put("rocks-small", 440, anchor.y + 38, { w: 92 });
    put("flowers", 560, anchor.y + 44, { w: 54 });
    put("rock-large", 700, anchor.y + 52, { w: 150 });
    put("grass-tuft", 120, anchor.y + 52, { w: 70 });
    // Rocks and foam where the cliff meets the water.
    put("rock-large", 150, slabBottom + 4, { w: 170 });
    put("rocks-small", 20, slabBottom - 8, { w: 90 });
    put("rocks-small", 300, slabBottom + 8, { w: 110 });
    for (const [dx, w] of [[70, 330], [210, 250]]) {
      const foam = make(g, "img", "sc-foam", { left: `${anchor.x + dir * dx - w / 2}px`, top: `${slabBottom - 54}px`, width: `${w}px`, height: `${w / 3}px` });
      foam.src = svg("water-ripple");
      foam.alt = "";
    }
    // The road: asphalt band with a dashed centre line, ending at the anchor.
    const length = 1700;
    make(g, "div", "sc-road", {
      left: `${side === "l" ? anchor.x - length : anchor.x}px`,
      top: `${anchor.y - ROAD.up}px`,
      width: `${length}px`,
      height: `${ROAD.up + ROAD.down}px`,
    });
    return g;
  }
  bank("l", A, slabL, topL);
  bank("r", E, slabR, topR);
  // The waterfall stands behind the right bank.
  sprite(world, "waterfall", { x: E.x + 470, base: topR + 46, h: 330, className: "sc-waterfall" });
  world.insertBefore(world.lastChild, world.firstChild);

  // ---- Bridge beams, truck, particles ----
  const beams = make(stage, "div", "sc-layer sc-beams");
  const truckSize = sizeOf("truck");
  const truckHeight = (TRUCK_WIDTH * truckSize.h) / truckSize.w;
  const truck = make(stage, "img", "sc-truck", { left: `${-TRUCK_WIDTH / 2}px`, top: `${-truckHeight}px`, width: `${TRUCK_WIDTH}px`, height: `${truckHeight}px` });
  truck.src = img("truck");
  truck.alt = "";
  truck.draggable = false;
  const canvas = make(root, "canvas", "sc-fx");
  const particles = createParticles(canvas);
  // Foreground plants in the screen corners (a little parallax the other way).
  const front = make(root, "div", "sc-front");
  for (const side of ["l", "r"]) {
    const plant = make(front, "img", `sc-plant sc-plant-${side}`);
    plant.src = img("grass-tuft");
    plant.alt = "";
    plant.draggable = false;
    const bloom = make(front, "img", `sc-bloom sc-bloom-${side}`);
    bloom.src = img("flowers");
    bloom.alt = "";
    bloom.draggable = false;
  }

  let view = null,
    dpr = 1,
    edgeNodes = new Map(),
    knownEdges = null,
    shake = 0,
    elapsed = 0,
    previousPose = null,
    smokeClock = 0,
    wasBroken = false;
  const splashed = new Set();

  function resize(next, width, height) {
    view = next;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vis = visibleStage(view);
    stage.style.transform = `translate(${view.ox}px, ${view.oy}px) scale(${view.k})`;
    // Backdrop plate: wide enough for any screen, bottom edge on the horizon.
    const plateW = Math.max(1700, (vis.right - vis.left) * 1.08 + 120);
    const plateH = (plateW * 844 * 0.42) / 1500;
    Object.assign(plate.style, { left: `${800 - plateW / 2}px`, top: `${horizon - plateH}px`, width: `${plateW}px`, height: `${plateH}px` });
    plateImage.style.width = `${plateW}px`;
    plateImage.style.height = `${(plateW * 844) / 1500}px`;
    Object.assign(skyFill.style, { left: `${vis.left - 400}px`, width: `${vis.right - vis.left + 800}px`, top: `${vis.top - 600}px`, height: `${horizon - plateH - (vis.top - 600) + 2}px` });
    Object.assign(water.style, { left: `${vis.left - 400}px`, width: `${vis.right - vis.left + 800}px`, top: `${horizon - 140}px`, height: `${Math.max(340, vis.bottom - horizon + 380)}px` });
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  function clearBridge() {
    beams.textContent = "";
    edgeNodes = new Map();
  }
  function setBridge(edges, selectedId) {
    clearBridge();
    const fresh = knownEdges ? edges.filter((e) => e.isPlayerBuilt && !knownEdges.has(e.id)) : [];
    knownEdges = new Set(edges.map((e) => e.id));
    for (const edge of edges) {
      const a = toStage(level.nodes.find((n) => n.id === edge.fromNodeId)),
        b = toStage(level.nodes.find((n) => n.id === edge.toNodeId));
      const length = Math.hypot(b.x - a.x, b.y - a.y),
        angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const road = edge.type === "road";
      const wrapper = make(beams, "div", `sc-edge sc-edge-${edge.type}`);
      const beam = make(wrapper, "img", `sc-beam ${selectedId === edge.id ? "is-selected" : ""} ${fresh.some((e) => e.id === edge.id) ? "is-new" : ""}`, {
        width: `${length + 10}px`,
        height: `${road ? 24 : 26}px`,
        left: `${-(length + 10) / 2}px`,
        top: `${road ? -12 : -13}px`,
      });
      beam.src = svg(road ? "timber-beam-vector" : "steel-beam-vector");
      beam.alt = "";
      beam.draggable = false;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      edgeNodes.set(edge.id, { wrapper, mid, angle, seed: hash(edge.id), a, b });
      if (fresh.some((e) => e.id === edge.id))
        for (const end of [a, b]) particles.emit(end, { count: 9, color: "#f3d9a8", speed: 46, up: 1.1, spread: 1.2, life: 0.55, size: 5 });
    }
  }

  function splash(key, at, strength) {
    if (splashed.has(key)) return;
    splashed.add(key);
    particles.emit({ x: at.x, y: waterY }, { count: Math.round(22 * strength), color: "#dff7ff", speed: 110, up: 2.2, spread: 1.4, gravity: 320, life: 0.9, size: 5 });
  }

  function render(frame, dt = 0) {
    if (!view) return;
    elapsed += dt;
    const moving = frame.phase === "building" || frame.phase === "testing";
    const animate = moving && !frame.reducedMotion;
    root.classList.toggle("is-still", !animate);
    const pose = frame.pose ?? { x: start.x - 48, y: start.y, angle: 0 };
    const p = toStage(pose);
    const failure = frame.broken ? frame.collapseSeconds : 0;
    const drop = failure * failure * 7 * WORLD;
    const travelled = previousPose ? Math.hypot(p.x - previousPose.x, p.y - previousPose.y) : 0;
    const bob = animate && frame.phase === "testing" && travelled > 0.02 && !frame.broken ? Math.sin(elapsed * 24) * 1.4 : 0;
    const truckY = p.y - 8 + drop + bob;
    truck.style.transform = `translate(${p.x}px, ${truckY}px) rotate(${pose.angle + failure * 43}deg)`;
    if (previousPose && animate && frame.phase === "testing") {
      smokeClock += dt;
      if (travelled > 0.02 && !frame.broken && smokeClock > 0.08) {
        smokeClock = 0;
        particles.emit({ x: p.x - TRUCK_WIDTH * 0.42, y: p.y - 30 }, { count: 1, color: "#eceaf4", speed: 14, up: 1.1, spread: 0.5, gravity: -20, life: 0.8, size: 5, grow: true });
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
    edgeNodes.forEach((e, id) => {
      const weak = frame.broken && frame.collapseEdgeIds.includes(id);
      let dx = 0,
        dy = 0,
        swing = 0;
      if (weak) {
        swing = failure * (0.5 + e.seed * 0.9) * (e.seed > 0.5 ? 1 : -1);
        dy = drop * (0.8 + e.seed * 0.5);
        dx = swing * failure * 0.6 * WORLD;
        if (e.mid.y + dy > waterY - 10) {
          splash(id, { x: e.mid.x + dx }, 0.8);
          if (!frame.reducedMotion) shake = Math.max(shake, 0.13);
        }
      }
      e.wrapper.style.transform = `translate(${e.mid.x + dx}px, ${e.mid.y + dy}px) rotate(${e.angle - (swing * 180) / Math.PI}deg)`;
      if (dy > 0) collapsed.push(id);
    });
    if (frame.broken && truckY > waterY - 14) {
      splash("truck", { x: p.x }, 1.3);
      if (!frame.reducedMotion) shake = Math.max(shake, 0.2);
    }

    particles.update(dt);
    shake = Math.max(0, shake - dt * 0.9);
    const jitter = shake > 0.001 ? shake * shake * 2.4 * WORLD : 0;
    const jx = (Math.random() - 0.5) * jitter * view.k,
      jy = (Math.random() - 0.5) * jitter * view.k;
    stage.style.transform = `translate(${view.ox + jx}px, ${view.oy + jy}px) scale(${view.k})`;
    particles.draw(view, view.width, view.height, dpr);

    // Diagnostics let browser QA verify real motion on screen (level coordinates, like the engine).
    host.dataset.collapsedEdges = JSON.stringify(collapsed);
    host.dataset.vehicleX = String(pose.x);
    host.dataset.vehicleY = String(pose.y);
  }

  function dispose() {
    host.textContent = "";
  }
  return { resize, setBridge, render, dispose };
}
