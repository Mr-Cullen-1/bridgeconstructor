// Builds the game's optimised art from the design pack in `design-source/` (kept out of `public/`
// and out of git: it is 40 MB). Every sprite is cropped to its visible pixels, resized and written as
// WebP into src/games/bridge-master/assets/design/img, together with meta.js (trimmed sizes) and
// the pack's SVG skins/icons. Run: node scripts/make-design-assets.mjs
import { readFile, writeFile, mkdir, copyFile, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const pack = fileURLToPath(new URL("../design-source/", import.meta.url));
const out = fileURLToPath(new URL("../src/games/bridge-master/assets/design/", import.meta.url));
// [source, name, { w | h: target size in px of the trimmed sprite, q: quality, trim: false keeps the canvas }]
const jobs = [
  ...["idle", "wave", "point", "think", "explain", "success", "retry"].map((n) => [`mascot/mascot-${n}.png`, `mascot-${n}`, { h: 640, q: 0.86 }]),
  ["props/truck-right.png", "truck", { w: 560, q: 0.86 }],
  ["props/finish-flag.png", "flag", { h: 420, q: 0.86 }],
  ["props/direction-sign.png", "sign", { h: 380, q: 0.86 }],
  ["props/fence.png", "fence", { w: 600, q: 0.84 }],
  ["props/timber-stack.png", "logs", { w: 260, q: 0.86 }],
  ["environment/cliff-left.png", "cliff-left", { w: 1400, q: 0.82 }],
  ["environment/cliff-right.png", "cliff-right", { w: 1400, q: 0.82 }],
  ["environment/tree-pine.png", "tree-pine", { h: 560, q: 0.84 }],
  ["environment/tree-broadleaf.png", "tree-broadleaf", { w: 520, q: 0.84 }],
  ["environment/bush.png", "bush", { w: 400, q: 0.84 }],
  ["environment/flowers.png", "flowers", { w: 300, q: 0.84 }],
  ["environment/grass-tuft.png", "grass-tuft", { w: 700, q: 0.84 }],
  ["environment/rock-large.png", "rock-large", { w: 600, q: 0.84 }],
  ["environment/rocks-small.png", "rocks-small", { w: 360, q: 0.84 }],
  ["environment/waterfall.png", "waterfall", { w: 560, q: 0.84 }],
  ["environment/cloud.png", "cloud", { w: 700, q: 0.84 }],
  ["environment/background-complete.png", "backdrop", { w: 1500, q: 0.8, trim: false }],
];
// Only the generated folders are rebuilt; index.js (the loader) is hand-written and stays.
await rm(out + "img", { recursive: true, force: true });
await rm(out + "svg", { recursive: true, force: true });
await mkdir(out + "img", { recursive: true });
await mkdir(out + "svg", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const meta = {};
let total = 0;
for (const [file, name, o] of jobs) {
  const png = (await readFile(pack + file)).toString("base64");
  const result = await page.evaluate(async ({ png, o }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const W = image.naturalWidth, H = image.naturalHeight;
    const source = document.createElement("canvas");
    source.width = W; source.height = H;
    const sg = source.getContext("2d", { willReadFrequently: true });
    sg.drawImage(image, 0, 0);
    let box = { x: 0, y: 0, w: W, h: H };
    if (o.trim !== false) {
      const d = sg.getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    }
    const scale = o.w ? o.w / box.w : o.h / box.h;
    const w = Math.round(box.w * scale), h = Math.round(box.h * scale);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, w, h);
    const top = sg.getImageData(0, 0, W, 4).data;
    let r = 0, gg = 0, b = 0;
    for (let i = 0; i < top.length; i += 4) { r += top[i]; gg += top[i + 1]; b += top[i + 2]; }
    const n = top.length / 4;
    const topColor = "#" + [r / n, gg / n, b / n].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    return { uri: c.toDataURL("image/webp", o.q), w, h, topColor };
  }, { png, o });
  const bytes = Buffer.from(result.uri.split(",")[1], "base64");
  await writeFile(`${out}img/${name}.webp`, bytes);
  meta[name] = { w: result.w, h: result.h, top: result.topColor };
  total += bytes.length;
  console.log(name.padEnd(16), `${result.w}x${result.h}`.padEnd(10), (bytes.length / 1024).toFixed(0), "kB");
}
// Near water: a calm strip of the backdrop's own river (between the rocks), mirrored once so it tiles
// sideways without a seam. It continues the plate's water below the horizon in the same colours.
{
  const png = (await readFile(pack + "environment/background-complete.png")).toString("base64");
  const uri = await page.evaluate(async (png) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const sx = 668, sy = 395, sw = 340, sh = 535;
    const c = document.createElement("canvas");
    c.width = sw * 2; c.height = sh;
    const g = c.getContext("2d");
    g.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    g.save(); g.translate(sw * 2, 0); g.scale(-1, 1); g.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh); g.restore();
    return c.toDataURL("image/webp", 0.86);
  }, png);
  const bytes = Buffer.from(uri.split(",")[1], "base64");
  await writeFile(`${out}img/water.webp`, bytes);
  meta.water = { w: 680, h: 535 };
  total += bytes.length;
  console.log("water".padEnd(16), "680x535".padEnd(10), (bytes.length / 1024).toFixed(0), "kB");
}
await browser.close();
for (const dir of ["ui", "icons"]) for (const f of await readdir(pack + dir)) if (f.endsWith(".svg")) await copyFile(pack + `${dir}/${f}`, `${out}svg/${f}`);
// Beams are stretched to any length inside an <img>, so they must not keep the SVG aspect ratio.
for (const f of ["road-segment-vector", "timber-beam-vector", "steel-beam-vector"]) {
  const source = await readFile(pack + `props/${f}.svg`, "utf8");
  await writeFile(`${out}svg/${f}.svg`, source.replace("<svg ", '<svg preserveAspectRatio="none" '));
}
await writeFile(`${out}meta.js`, `// Generated by scripts/make-design-assets.mjs: sizes of the trimmed sprites. Do not edit.\nexport const meta = ${JSON.stringify(meta, null, 2)};\n`);
console.log("total", (total / 1048576).toFixed(2), "MB");
