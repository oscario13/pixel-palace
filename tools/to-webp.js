// Makes the cut-out photos small enough to download on museum Wi-Fi:
// images/objects/<id>.png (kept as the source for tools/pixelize.js) becomes
// images/objects/<id>.webp, transparency and all, encoded by headless Chrome.
//   node tools/to-webp.js [quality 0-1, default 0.86]
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const cdp = require("../tests/cdp.js");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "images/objects");
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); }); });

(async () => {
  const quality = Number(process.argv[2] || 0.86);
  if (!(quality > 0 && quality <= 1)) throw new Error("quality must be between 0 and 1");
  const ids = fs.readdirSync(DIR).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4)).sort();
  const port = await freePort();
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch (e) { await cdp.sleep(100); } }
  const client = await cdp.launch();
  let before = 0, after = 0;
  try {
    await client.send("Runtime.enable");
    await cdp.load(client, base + "tools/map-preview.html", null, { settle: false });
    for (const id of ids) {
      const url = `/images/objects/${id}.png`;
      const data = await client.eval(`new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext("2d").drawImage(img, 0, 0);
          resolve(c.toDataURL("image/webp", ${quality}));
        };
        img.onerror = () => reject(new Error("could not load ${url}"));
        img.src = ${JSON.stringify(url)};
      })`);
      if (!/^data:image\/webp;base64,/.test(data)) throw new Error(`${id}: Chrome did not encode WebP`);
      const buf = Buffer.from(data.split(",")[1], "base64");
      fs.writeFileSync(path.join(DIR, id + ".webp"), buf);
      before += fs.statSync(path.join(DIR, id + ".png")).size;
      after += buf.length;
    }
    console.log(`${ids.length} cut-outs: ${(before / 1e6).toFixed(1)} MB of PNG -> ${(after / 1e6).toFixed(1)} MB of WebP`);
  } finally {
    await client.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
