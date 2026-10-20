// A tiny Chrome DevTools Protocol client for headless verification.
// No dependencies: Node 24's global WebSocket and fetch.
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Chrome picks its own debugging port (0) and writes it to DevToolsActivePort
async function launch({ extraArgs = [] } = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "pp-chrome-"));
  const proc = spawn(CHROME, [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--hide-scrollbars", "--mute-audio", "--window-size=1440,900", ...extraArgs, "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let wsUrl = null;
  for (let i = 0; i < 100 && !wsUrl; i++) {
    await sleep(100);
    try {
      const port = fs.readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0].trim();
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find(t => t.type === "page");
      if (page) wsUrl = page.webSocketDebuggerUrl;
    } catch (e) { /* not up yet */ }
  }
  if (!wsUrl) throw new Error("Chrome did not start");
  const client = await connect(wsUrl);
  client.close = async () => {
    try { client.ws.close(); } catch (e) {}
    proc.kill("SIGKILL");
    await sleep(150);
    // Chrome can still be flushing its profile for a moment after the kill
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch (e) {}
  };
  return client;
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const listeners = new Map();
    const client = {
      ws,
      send(method, params = {}) {
        const msgId = ++id;
        ws.send(JSON.stringify({ id: msgId, method, params }));
        return new Promise((res, rej) => pending.set(msgId, { res, rej, method }));
      },
      on(event, fn) {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(fn);
      },
      async eval(expression, { awaitPromise = true } = {}) {
        const r = await client.send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true, userGesture: true });
        if (r.exceptionDetails) {
          const d = r.exceptionDetails;
          throw new Error(`eval failed: ${d.exception && d.exception.description || d.text}\n--- in: ${expression.slice(0, 300)}`);
        }
        return r.result.value;
      }
    };
    ws.onopen = () => resolve(client);
    ws.onerror = e => reject(e);
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.rej(new Error(`${p.method}: ${msg.error.message}`));
        else p.res(msg.result);
      } else if (msg.method && listeners.has(msg.method)) {
        listeners.get(msg.method).forEach(fn => fn(msg.params));
      }
    };
  });
}

// Everything the page reports that counts as a console error.
function collectErrors(client, sink) {
  // requests the harness itself cut off by navigating away are not page
  // errors; everything else that fails on the network is
  client.send("Network.enable").catch(() => {});
  client.on("Network.loadingFailed", p => {
    sink.push(`network: ${p.errorText}${p.canceled ? " (canceled)" : ""} ${p.blockedReason || ""} ${p.type} ${(client.urls || {})[p.requestId] || p.requestId}`);
  });
  client.on("Network.requestWillBeSent", p => { client.urls = client.urls || {}; client.urls[p.requestId] = p.request.url; });
  client.on("Runtime.exceptionThrown", p => sink.push(`exception: ${p.exceptionDetails.exception ? p.exceptionDetails.exception.description : p.exceptionDetails.text}`));
  client.on("Runtime.consoleAPICalled", p => {
    if (["error", "assert", "warning"].includes(p.type)) sink.push(`console.${p.type}: ${p.args.map(a => a.value || a.description).join(" ")}`);
  });
  client.on("Log.entryAdded", p => {
    if (p.entry.level === "error" || p.entry.level === "warning") sink.push(`log.${p.entry.level}: ${p.entry.text} ${p.entry.url || ""}`);
  });
}

async function setup(client, { width = 1440, height = 900, touch = false, media = [] } = {}) {
  await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: touch });
  await client.send("Emulation.setTouchEmulationEnabled", touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await client.send("Emulation.setEmulatedMedia", { media: "", features: media });
}

// Navigate with localStorage seeded before any page script runs.
let seedScriptId = null;
async function load(client, url, seed = null, { settle = true } = {}) {
  if (seedScriptId) {
    await client.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: seedScriptId });
    seedScriptId = null;
  }
  if (seed !== null) {
    const r = await client.send("Page.addScriptToEvaluateOnNewDocument", { source: seed });
    seedScriptId = r.identifier;
  }
  const loaded = new Promise(res => {
    const fn = () => res();
    client.on("Page.loadEventFired", fn);
  });
  await client.send("Page.navigate", { url });
  await Promise.race([loaded, sleep(8000)]);
  await client.eval("document.fonts.ready.then(() => true)");
  if (settle) await settleAnimations(client);
}

async function settleAnimations(client, ms = 60) {
  await sleep(ms);
  return client.eval(`(() => { let n = 0; document.getAnimations().forEach(a => { try { const t = a.effect && a.effect.getComputedTiming(); if (t && Number.isFinite(t.endTime)) { a.finish(); n++; } } catch (e) {} }); return n; })()`);
}

function seedScript({ walk = null, curated = null, title = null, curtainSeen = true, raw = null } = {}) {
  const lines = ["try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}"];
  if (walk) lines.push(`localStorage.setItem("npm-wayfinder-wishlist-v2", ${JSON.stringify(JSON.stringify(walk))});`);
  if (curated) lines.push(`localStorage.setItem("npm-wayfinder-curate-v1", ${JSON.stringify(JSON.stringify(curated))});`);
  if (title !== null) lines.push(`localStorage.setItem("npm-wayfinder-curate-title-v1", ${JSON.stringify(title)});`);
  if (curtainSeen) lines.push(`sessionStorage.setItem("npm-wayfinder-curtain-seen", "1");`);
  if (raw) lines.push(raw);
  // run the seed once per navigation only for the top frame
  return `if (window.top === window && !window.__seeded) { window.__seeded = true; ${lines.join(" ")} }`;
}

async function key(client, keyName, { shift = false } = {}) {
  const codes = {
    Tab: { key: "Tab", code: "Tab", keyCode: 9 }, Enter: { key: "Enter", code: "Enter", keyCode: 13, text: "\r" },
    " ": { key: " ", code: "Space", keyCode: 32, text: " " }, Escape: { key: "Escape", code: "Escape", keyCode: 27 },
    ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 }, ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 }, ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    Home: { key: "Home", code: "Home", keyCode: 36 }, End: { key: "End", code: "End", keyCode: 35 }
  };
  const k = codes[keyName];
  const modifiers = shift ? 8 : 0;
  await client.send("Input.dispatchKeyEvent", { type: k.text ? "keyDown" : "rawKeyDown", key: k.key, code: k.code, windowsVirtualKeyCode: k.keyCode, nativeVirtualKeyCode: k.keyCode, text: k.text, modifiers });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: k.key, code: k.code, windowsVirtualKeyCode: k.keyCode, nativeVirtualKeyCode: k.keyCode, modifiers });
  await sleep(30);
}

async function typeText(client, text) {
  await client.send("Input.insertText", { text });
  await sleep(20);
}

module.exports = { launch, collectErrors, setup, load, settleAnimations, seedScript, key, typeText, sleep };
