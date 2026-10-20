// Draws the app icons (tools/icon.html) in headless Chrome and saves them
// to icons/. Run again after changing the icon art: node tools/make-icons.js
const fs = require("fs");
const path = require("path");
const cdp = require("../tests/cdp.js");

const ROOT = path.resolve(__dirname, "..");
const OUT = [
  ["icon-192.png", 192, 0.06],
  ["icon-512.png", 512, 0.06],
  ["icon-maskable-512.png", 512, 0.16],
  ["apple-touch-icon.png", 180, 0.08]
];

(async () => {
  const client = await cdp.launch({ extraArgs: ["--allow-file-access-from-files"] });
  try {
    await client.send("Page.enable");
    await cdp.load(client, "file://" + path.join(ROOT, "tools/icon.html"), null, { settle: false });
    for (const [name, size, pad] of OUT) {
      const url = await client.eval(`icon(${size}, ${pad})`);
      fs.writeFileSync(path.join(ROOT, "icons", name), Buffer.from(url.split(",")[1], "base64"));
      console.log("wrote icons/" + name);
    }
  } finally {
    await client.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
