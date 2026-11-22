import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { parseAst } from "rolldown/parseAst";
import { createManifest } from "../src/gamelab/manifest.js";
import { validateManifest } from "../src/gamelab/validateManifest.js";

const source = await readFile(new URL("../delivery/gamelab/Game.jsx", import.meta.url), "utf8");
assert(source.startsWith("// @junior-gamecenter v1\n"), "First line must be the // @junior-gamecenter v1 marker");
const ast = parseAst(source);
const imports = ast.body.filter((node) => node.type === "ImportDeclaration");
assert(imports.length > 0, "Host React import is required");
assert(imports.every((node) => node.source.value === "react"), "Only React may remain external");
for (const forbidden of ["import(", "import.meta", "process.env", "window.parent", "localStorage", "createRoot", "postMessage"])
  assert(!source.includes(forbidden), `Forbidden in a GameLab game: ${forbidden}`);
// Global page selectors must not ship; they would restyle the host (contract §10).
assert(!/(^|[\s,}])(html|body|#root)\s*[,{]/m.test(source.replace(/\/\*[\s\S]*?\*\//g, "")), "Game CSS must not style html, body or #root");
const exported = ast.body.flatMap((node) =>
  node.type === "ExportNamedDeclaration"
    ? node.specifiers.map((s) => s.exported.name).concat(node.declaration?.declarations?.map((d) => d.id.name) ?? [])
    : [],
);
assert(exported.includes("default"), "Default React component must be exported");
assert(exported.includes("gameCenterManifest"), "gameCenterManifest must be exported");
const marker = "export const gameCenterManifest = ";
const literal = source.slice(source.indexOf(marker) + marker.length).trim().replace(/;$/, "");
const manifest = JSON.parse(literal);
const levelDirectory = new URL("../src/games/bridge-master/levels/", import.meta.url);
const levelIds = await Promise.all(
  (await readdir(levelDirectory))
    .filter((name) => /^bridge-\d+\.json$/.test(name))
    .sort()
    .map(async (name) => JSON.parse(await readFile(new URL(name, levelDirectory), "utf8")).id),
);
assert.deepEqual(validateManifest(manifest), [], "Manifest must satisfy contract §4");
assert.deepEqual(manifest, createManifest(levelIds), "Manifest must match the level pack");
for (const token of [...levelIds, ".bridge-app", "WebGLRenderer", "Permission is hereby granted", "onAttemptStart", "onRetrySave"])
  assert(source.includes(token), `Missing embedded game content/license: ${token}`);
console.log(JSON.stringify({
  file: "delivery/gamelab/Game.jsx",
  bytes: Buffer.byteLength(source),
  levels: levelIds.length,
  sha256: createHash("sha256").update(source).digest("hex"),
  externalImports: imports.map((node) => node.source.value),
  version: manifest.version,
}, null, 2));
