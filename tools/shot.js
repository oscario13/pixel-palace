// Screenshot any page of the project in headless Chrome, served over http.
//   node tools/shot.js <page> <out.png> [width] [height] [js-to-run-first]
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const cdp = require("../tests/cdp.js");

const ROOT = path.resolve(__dirname, "..");
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); }); });

(async () => {
  const [page, out, width = "1200", height = "800", script = ""] = process.argv.slice(2);
  const port = await freePort();
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch (e) { await cdp.sleep(100); } }
  const client = await cdp.launch();
  const errors = [];
  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    cdp.collectErrors(client, errors);
    await cdp.setup(client, { width: +width, height: +height });
    await cdp.load(client, base + page, null, { settle: false });
    await cdp.sleep(400);
    if (script) console.log("script ->", JSON.stringify(await client.eval(script)));
    await cdp.sleep(200);
    const shot = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
    console.log("saved", out, errors.length ? "\nERRORS:\n" + errors.join("\n") : "(no errors)");
  } finally {
    await client.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
