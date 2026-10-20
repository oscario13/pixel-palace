// Runs every check: the pure-logic unit tests, then a scripted playthrough
// in headless Chrome against a fresh `python3 -m http.server`.
//   node tests/run.js            all suites
//   SHOTS=/some/dir node tests/run.js play   keep screenshots
const { spawn, spawnSync } = require("child_process");
const net = require("net");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SUITES = ["unit", "play"];

const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); }); });

(async () => {
  const wanted = process.argv.slice(2);
  const suites = wanted.length ? SUITES.filter(s => wanted.includes(s)) : SUITES;
  // keep the offline file list current before testing
  spawnSync(process.execPath, [path.join(ROOT, "tools/build-sw.js")], { stdio: "inherit" });
  const port = await freePort();
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}/`;
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    try { up = (await fetch(base)).ok; } catch (e) { await new Promise(r => setTimeout(r, 100)); }
  }
  if (!up) { server.kill(); console.error("python3 -m http.server did not start"); process.exit(1); }
  const failed = [];
  for (const suite of suites) {
    console.log(`\n=== ${suite}`);
    const r = spawnSync(process.execPath, [path.join(__dirname, `${suite}.js`), base], { stdio: "inherit" });
    if (r.status !== 0) failed.push(suite);
  }
  server.kill();
  console.log(failed.length ? `\nFailed: ${failed.join(", ")}` : `\nAll ${suites.length} suites passed`);
  process.exit(failed.length ? 1 : 0);
})();
