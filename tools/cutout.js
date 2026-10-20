// One-time build step: lifts each photo in images/photos off its studio
// backdrop and saves the cut-out to images/objects, which the card shows and
// tools/pixelize.js turns into a case sprite. Existing cut-outs are kept.
//
//   node tools/cutout.js                 cut out every photo without a cut-out
//   node tools/cutout.js jade-duck ...   redo just these
//   node tools/cutout.js --sheet out.png also save a contact sheet to check by eye
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const cdp = require("../tests/cdp.js");

const ROOT = path.resolve(__dirname, "..");

// Where the default thresholds eat into a pale object or keep too much
// backdrop, tune them per photo (see tools/cutout.html).
const OPTIONS = {
  "xing-flask": { step: 5, far: 30 },
  "yue-washer": { step: 6, far: 34 },
  "guan-washer": { step: 6, far: 34 },
  "longquan-vase": { step: 6, far: 34 },
  "ge-stem-bowl": { step: 6, far: 34 },
  "white-gui-pitcher": { step: 6, far: 34 },
  "bovet-watch": { step: 14, far: 70 },
  "xuan-ji-gui": { step: 5, far: 30 },
  "ya-qin-zun": { step: 6, far: 34 },
  "ya-chou-fang-zun": { step: 6, far: 34 },
  "tlv-mirror": { step: 7, far: 40 },
  "ru-narcissus-bowl": { step: 4, far: 22 },
  "hunting-hu": { step: 6, far: 34 },
  "bo-ding-he": { step: 6, far: 34 },
  "zu-yi-zun": { step: 6, far: 34 }
};

const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); }); });

(async () => {
  const args = process.argv.slice(2);
  const sheetAt = args.indexOf("--sheet");
  const sheet = sheetAt >= 0 ? args.splice(sheetAt, 2)[1] : null;
  const photos = fs.readdirSync(path.join(ROOT, "images/photos")).filter(f => f.endsWith(".jpg")).map(f => f.slice(0, -4));
  const ids = args.length ? args : photos.filter(id => !fs.existsSync(path.join(ROOT, "images/objects", id + ".png")));
  if (!ids.length) { console.log("every photo already has a cut-out"); return; }

  const port = await freePort();
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch (e) { await cdp.sleep(100); } }
  const client = await cdp.launch();
  try {
    await client.send("Page.enable");
    await cdp.load(client, base + "tools/cutout.html", null, { settle: false });
    for (const id of ids) {
      const r = await client.eval(`cutout(${JSON.stringify(`../images/photos/${id}.jpg`)}, ${JSON.stringify(OPTIONS[id] || {})})`);
      if (r.error) { console.log(`${id}: ${r.error}`); continue; }
      fs.writeFileSync(path.join(ROOT, "images/objects", id + ".png"), Buffer.from(r.png.split(",")[1], "base64"));
      console.log(`${id}: ${r.w}x${r.h}, object is ${Math.round(r.kept * 100)}% of the photo`);
    }
    if (sheet) {
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1400, height: 1100, deviceScaleFactor: 1, mobile: false });
      await client.eval(`(() => {
        document.body.style.cssText = "margin:0;display:flex;flex-wrap:wrap;gap:4px;padding:4px;font:10px sans-serif;" +
          "background:repeating-conic-gradient(#ccc 0 25%,#999 0 50%) 0 0/16px 16px";
        for (const id of ${JSON.stringify(ids)}) {
          const d = document.createElement("div");
          d.style.cssText = "text-align:center;background:rgba(255,255,255,.4)";
          d.innerHTML = '<img style="height:120px" src="../images/objects/' + id + '.png?' + Date.now() + '"><br>' + id;
          document.body.append(d);
        }
      })()`);
      await cdp.sleep(1500);
      const shot = await client.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(sheet, Buffer.from(shot.data, "base64"));
      console.log("sheet:", sheet);
    }
  } finally {
    await client.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
