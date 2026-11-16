import { createServer } from "node:http";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = new URL("../.tools/lms-preview/", import.meta.url);
await mkdir(new URL("game/", out), { recursive: true });
await build({
  root, configFile: false, logLevel: "warn",
  oxc: { jsx: { runtime: "classic" } },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: fileURLToPath(new URL("game/", out)), emptyOutDir: false,
    minify: true, sourcemap: false,
    lib: { entry: "tests/lms/runtime.jsx", name: "LmsRuntime", formats: ["iife"], fileName: () => "runner.js" },
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
await writeFile(new URL("game/index.html", out), `<!doctype html><html lang="uz"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Isolated JSX runtime</title></head><body><div id="root"></div><script src="runner.js"></script></body></html>`);
await writeFile(new URL("index.html", out), `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden}body{display:grid;grid-template-rows:36px minmax(0,1fr)}header{font:14px system-ui;padding:8px;background:#223f38;color:white}iframe{border:0;width:100%;height:100%;display:block;min-height:0}</style>
</head><body><header>Local LMS sandbox — QA only</header><iframe title="Game" sandbox="allow-scripts" src="/game/"></iframe>
<script>
window.__lmsMessages = [];
const frame = document.querySelector('iframe');
frame.addEventListener('load', () => {
  const channelId = crypto.randomUUID();
  const channel = new MessageChannel();
  channel.port1.onmessage = ({data}) => {
    if(data?.protocol !== 'lms-game/v1' || data.channelId !== channelId) return;
    window.__lmsMessages.push(data);
  };
  frame.contentWindow.postMessage({protocol:'lms-game/v1',type:'init',channelId}, '*', [channel.port2]);
});
</script></body></html>`);

const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/game/", ["game/index.html", "text/html; charset=utf-8"]],
  ["/game/runner.js", ["game/runner.js", "text/javascript; charset=utf-8"]],
]);
createServer(async (req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  const file = files.get(path);
  if (!file) { res.writeHead(404); res.end(); return; }
  const headers = { "Content-Type": file[1], "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" };
  if (path.startsWith("/game/")) headers["Content-Security-Policy"] =
    "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'";
  res.writeHead(200, headers);
  res.end(await readFile(new URL(file[0], out)));
}).listen(4174, "127.0.0.1", () => console.log("LMS sandbox preview: http://127.0.0.1:4174"));
