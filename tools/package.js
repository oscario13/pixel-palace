// Builds dist/pixel-palace-web.zip: just the files a player's browser needs,
// for uploading to itch.io or any static host. It reads the same list the
// offline cache uses (sw.js), adds sw.js and the zoom photos, and leaves out
// tests/, tools/ and the PNG sources of the cut-outs.
//   node tools/package.js
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "dist", "pixel-palace-web.zip");

const built = spawnSync(process.execPath, [path.join(__dirname, "build-sw.js")], { stdio: "inherit" });
if (built.status !== 0) process.exit(built.status || 1);

const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
const match = sw.match(/const FILES = (\[[\s\S]*?\]);/);
if (!match) throw new Error("sw.js has no FILES list; run tools/build-sw.js");
const zoom = fs.readdirSync(path.join(ROOT, "images/zoom")).filter(f => !f.startsWith(".")).map(f => `images/zoom/${f}`);
// "./" in that list is the page's own URL, not a file
const files = [...JSON.parse(match[1]).filter(f => f !== "./"), "sw.js", ...zoom];
for (const f of files) if (!fs.existsSync(path.join(ROOT, f))) throw new Error(`missing ${f}`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.rmSync(OUT, { force: true });
const zip = spawnSync("zip", ["-q", "-X", OUT, "-@"], { cwd: ROOT, input: files.join("\n") });
if (zip.status !== 0) throw new Error(`zip failed (status ${zip.status}): ${zip.stderr || zip.stdout || zip.error}`);
const mb = n => (n / 1e6).toFixed(1) + " MB";
const unpacked = files.reduce((n, f) => n + fs.statSync(path.join(ROOT, f)).size, 0);
console.log(`${path.relative(ROOT, OUT)}: ${files.length} files, ${mb(unpacked)} unpacked, ${mb(fs.statSync(OUT).size)} zipped`);
