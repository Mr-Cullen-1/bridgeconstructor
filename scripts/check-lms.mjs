import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseAst } from "rolldown/parseAst";

const file = new URL("../delivery/BridgeMaster.jsx", import.meta.url);
const source = await readFile(file, "utf8");
const ast = parseAst(source);
const imports = ast.body.filter((node) => node.type === "ImportDeclaration");
assert(imports.length > 0, "Host React import is required");
assert(imports.every((node) => node.source.value === "react"), "Only React may remain external");
assert(!source.includes("import("), "No dynamic imports or chunks");
assert(!source.includes("import.meta"), "No build-time module metadata at runtime");
assert(!source.includes("process.env"), "No Node environment dependency");
const exported = ast.body.flatMap((node) => node.type === "ExportNamedDeclaration"
  ? node.specifiers.map((s) => s.exported.name) : []);
assert(exported.includes("default"), "Default React component must be exported");
assert(exported.includes("bridgeMasterManifest"), "Runtime manifest must be exported");
const levelDirectory = new URL("../src/games/bridge-master/levels/", import.meta.url);
const levelFiles = (await readdir(levelDirectory)).filter((name) => /^bridge-\d+\.json$/.test(name));
const levelIds = await Promise.all(levelFiles.map(async (name) =>
  JSON.parse(await readFile(new URL(name, levelDirectory), "utf8")).id,
));
for (const token of [...levelIds, ".bridge-app", "sc-root", "collapseEdgeIds", "data:image/webp;base64,"]) {
  assert(source.includes(token), `Missing embedded game content/license: ${token}`);
}
console.log(JSON.stringify({
  file: "delivery/BridgeMaster.jsx",
  bytes: Buffer.byteLength(source),
  levels: levelIds.length,
  sha256: createHash("sha256").update(source).digest("hex"),
  externalImports: imports.map((node) => node.source.value),
  exports: exported,
}, null, 2));
