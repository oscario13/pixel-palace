// Plays the game in headless Chrome with real key events: title -> intro
// -> highlights tour -> auto-walk up the stairs into the bronze gallery ->
// the first piece's card -> notebook -> a phone-sized screen; then the
// Chinese version, the room lookup a visitor uses inside the museum, a
// whole-gallery tour, and a returning visit. Fails on any console error.
// Screenshots go to $SHOTS if set.
const fs = require("fs");
const path = require("path");
const cdp = require("./cdp.js");

const base = process.argv[2];
const SHOTS = process.env.SHOTS || null;
let failures = 0, passes = 0;
function check(name, cond, detail) {
  if (cond) passes++;
  else { failures++; console.log("FAIL", name, detail === undefined ? "" : JSON.stringify(detail)); }
}

const CODES = {
  Enter: ["Enter", "Enter", 13, "\r"], ArrowUp: ["ArrowUp", "ArrowUp", 38], ArrowDown: ["ArrowDown", "ArrowDown", 40],
  ArrowLeft: ["ArrowLeft", "ArrowLeft", 37], ArrowRight: ["ArrowRight", "ArrowRight", 39],
  KeyG: ["g", "KeyG", 71, "g"], KeyN: ["n", "KeyN", 78, "n"], KeyQ: ["q", "KeyQ", 81, "q"], KeyR: ["r", "KeyR", 82, "r"], KeyZ: ["z", "KeyZ", 90, "z"], Escape: ["Escape", "Escape", 27]
};

async function key(client, name, holdMs = 0) {
  const [k, code, vk, text] = CODES[name];
  await client.send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk, text });
  if (holdMs) await cdp.sleep(holdMs);
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
  await cdp.sleep(60);
}

async function until(client, expr, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await client.eval(expr)) return true;
    await cdp.sleep(80);
  }
  return false;
}

const state = `(() => ({ map: PP.map.id, x: PP.player.x, y: PP.player.y, busy: PP.busy, lead: !!PP.lead,
  dialog: !document.getElementById("dialog").hidden, text: document.getElementById("text").textContent,
  choices: [...document.querySelectorAll("#choices .choice")].map(b => b.textContent),
  card: !document.getElementById("card").hidden, panel: !document.getElementById("panel").hidden, seen: PP.seen.size }))()`;

// press Enter through dialogue until `expr` holds (or choices show up)
async function advance(client, expr, max = 40) {
  for (let i = 0; i < max; i++) {
    if (await client.eval(expr)) return true;
    const s = await client.eval(state);
    if (s.choices.length) return false;
    if (s.dialog) await key(client, "Enter");
    else await cdp.sleep(120);
  }
  return client.eval(expr);
}

async function choose(client, label) {
  const s = await client.eval(state);
  const i = s.choices.findIndex(c => c.includes(label));
  if (i < 0) return false;
  for (let k = 0; k < i; k++) await key(client, "ArrowDown");
  await key(client, "Enter");
  return true;
}

async function shot(client, name) {
  if (!SHOTS) return;
  const r = await client.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(SHOTS, name + ".png"), Buffer.from(r.data, "base64"));
}

// The game caches itself, then still starts and shows photos with the
// network switched off.
async function offlineVisit(client) {
  await cdp.setup(client, { width: 1280, height: 800 });
  const seed = `try { localStorage.clear(); } catch (e) {}`;
  await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
  check("service worker takes control", await until(client, `!!(navigator.serviceWorker && navigator.serviceWorker.controller)`, 15000));
  check("game files are cached", await until(client, `caches.keys().then(k => k.some(x => x.startsWith("pixel-palace-")))`, 15000));
  await client.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  try {
    await cdp.load(client, base + "index.html", null, { settle: false });
    check("offline: the title screen still appears", await until(client, `!document.getElementById("title").hidden`));
    const want = await client.eval(`TourData.fullTour().filter(([, id]) => TourData.PIECES[id].photo).length`);
    const photos = await client.eval(`Promise.all(TourData.fullTour().filter(([, id]) => TourData.PIECES[id].photo).map(([, id]) => fetch("images/objects/" + id + ".webp").then(r => r.ok, () => false))).then(r => r.filter(Boolean).length)`);
    check("offline: every photo is available", photos === want && want === 62, [photos, want]);
    await key(client, "Enter");
    check("offline: the visit starts", await until(client, `PP.mode === "play" && !document.getElementById("dialog").hidden`));
  } finally {
    await client.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  }
}

// A returning visitor on 3F with the step-free route on: elevator to 1F,
// tap a case to walk to it, then ask about the Jadeite Cabbage.
async function secondVisit(client) {
  await cdp.setup(client, { width: 1280, height: 800 });
  const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", JSON.stringify({ v: 1, seen: ["mao-gong-ding"], settings: { sound: false, music: false, autoTalk: true, stepFree: true, textSpeed: "instant" }, tour: { active: false }, pos: { map: "3F", x: 12, y: 3, dir: "down" } })); } catch (e) {}`;
  await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
  check("returning visitor gets Continue", await until(client, `[...document.querySelectorAll(".title-actions button")].some(b => /Continue \\(1\\/68/.test(b.textContent))`));
  await key(client, "Enter");
  check("continues on 3F", await until(client, `PP.mode === "play" && PP.map.id === "3F"`));
  await advance(client, `!PP.busy`);
  await key(client, "KeyQ");
  await until(client, `document.querySelectorAll("#choices .choice").length > 0`);
  await choose(client, "Go to a gallery");
  await until(client, `[...document.querySelectorAll("#choices .choice")].some(b => b.textContent.includes("Garland"))`);
  await choose(client, "A Garland of Treasures");
  const heard = await advance(client, `/elevator down two floors/.test(document.getElementById("text").textContent)`, 4);
  let s = await client.eval(state);
  check("step-free directions mention the elevator", heard, s.text);
  await advance(client, `!!PP.lead && !PP.busy`);
  const floors = [];
  // note each map as it's reached, with where the visitor first stands on it
  await client.eval(`window.__floors = []; window.__at = []; setInterval(() => { const id = PP.map.id; if (window.__floors[window.__floors.length - 1] !== id) { window.__floors.push(id); window.__at.push({ id, x: PP.player.x, y: PP.player.y, dir: PP.player.dir, w: PP.map.w, h: PP.map.h, lift: (PP.map.elevators || []).findIndex(e => e.x === PP.player.x && e.y + 1 === PP.player.y) }); } }, 15); true`);
  const leftFrom = await client.eval(`(() => { const p = PP.player; const best = PP.map.elevators.map((e, i) => [Math.abs(e.x - p.x) + Math.abs(e.y + 1 - p.y), i]).sort((a, b) => a[0] - b[0]); return best.map(b => b[1]); })()`);
  await key(client, "KeyG");
  check("reaches Precious Crafts", await until(client, `PP.map.id === "precious-crafts"`, 20000));
  const path = await client.eval("window.__floors");
  const at = await client.eval("window.__at");
  check("step-free route skips 2F (elevator)", !path.includes("2F") && path.includes("1F"), path);
  const on1 = at.find(a => a.id === "1F");
  check("the elevator opens on 1F from one of its shafts", on1 && on1.lift >= 0 && on1.dir === "down", on1);
  check("and it's a shaft near where the ride began", on1 && leftFrom.slice(0, 2).includes(on1.lift), [leftFrom, on1]);
  const inside = at.find(a => a.id === "precious-crafts");
  check("Room 106 is entered through its door, walking in", inside && inside.y === inside.h - 2 && inside.dir === "up", inside);
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  await choose(client, "look around");
  await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);

  // tap the ivory ball's case, first stepping left until it's well on screen
  const casePoint = `(() => { const c = PP.map.cases.find(c => c.id === "ivory-ball"); const v = PP.renderer.view, cam = PP.renderer.cam;
    return { x: ((c.x * 16 + 16) - Math.round(cam.x)) * v.scale / v.dpr, y: ((c.y * 16 + 16) - Math.round(cam.y)) * v.scale / v.dpr }; })()`;
  let pt = await client.eval(casePoint);
  for (let i = 0; i < 8 && pt.x < 80; i++) {
    await key(client, "ArrowLeft", 180);
    await until(client, `!PP.player.moving`, 1000);
    await cdp.sleep(250);
    pt = await client.eval(casePoint);
  }
  for (const type of ["mousePressed", "mouseReleased"]) {
    await client.send("Input.dispatchMouseEvent", { type, x: pt.x, y: pt.y, button: "left", clickCount: 1 });
  }
  await until(client, `PP.busy > 0`, 10000);
  await key(client, "Enter");
  check("tapping a case walks there and presents it", await until(client, `!document.getElementById("card").hidden && /Eighteen ivory balls/.test(document.getElementById("text").textContent)`, 10000));
  await shot(client, "7-tap-crafts");
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  await choose(client, "Thanks");
  await cdp.sleep(700);
  check("an early A press is not replayed after Thanks", await client.eval(`document.getElementById("dialog").hidden && !PP.busy`));
  await key(client, "KeyQ");
  await until(client, `document.querySelectorAll("#choices .choice").length > 0`);
  await choose(client, "Jadeite Cabbage");
  s = await client.eval(state);
  check("the cabbage answer names Room 302", /Room 302/.test(s.text), s.text);
}

// A visitor who has seen the highlights of A Garland of Treasures asks for
// the challenge, earns the stamp, then saves a piece to the visit plan.
async function stampVisit(client) {
  await cdp.setup(client, { width: 1280, height: 800 });
  const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", JSON.stringify({ v: 1, seen: ["silver-raft-cup", "ivory-ball", "ming-lacquer-cabinet"], settings: { sound: false, music: false, autoTalk: true, stepFree: false, textSpeed: "instant" }, tour: { active: false }, pos: { map: "precious-crafts", x: 11, y: 16, dir: "up" } })); } catch (e) {}`;
  await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
  await until(client, `!document.getElementById("title").hidden`);
  await key(client, "Enter");
  await until(client, `PP.mode === "play" && PP.map.id === "precious-crafts"`);
  await advance(client, `!PP.busy`);
  await key(client, "KeyQ");
  await until(client, `document.querySelectorAll("#choices .choice").length > 0`);
  let s = await client.eval(state);
  check("a finished gallery offers the challenge", s.choices.includes("The junior docent challenge"), s.choices);
  await choose(client, "The junior docent challenge");
  const quiz = await client.eval(`TourData.QUIZZES["precious-crafts"].map(q => q.a[q.correct])`);
  for (const answer of quiz) {
    const ready = `[...document.querySelectorAll("#choices .choice")].some(c => c.textContent === ${JSON.stringify(answer)})`;
    await advance(client, ready);
    const picked = await client.eval(`(() => { const c = [...document.querySelectorAll("#choices .choice")].find(c => c.textContent === ${JSON.stringify(answer)}); if (c) c.focus(); return !!c; })()`);
    check(`challenge answer "${answer}" is offered`, picked);
    await key(client, "Enter");
  }
  await advance(client, `PP.stamps.has("precious-crafts")`);
  check("passing earns the stamp", await until(client, `PP.stamps.has("precious-crafts")`, 8000));
  check("the stamp presses onto the screen", await until(client, `!!document.querySelector(".stamp-moment")`, 3000));
  await shot(client, "8-stamp");
  await until(client, `!document.querySelector(".stamp-moment")`, 4000);
  await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);
  // the last text box can still be closing when N arrives; wait for the
  // notebook itself rather than any panel
  for (let i = 0; i < 3 && !(await until(client, `!!document.querySelector(".nb-item")`, i ? 2000 : 0)); i++) {
    await advance(client, `!PP.busy && document.getElementById("dialog").hidden && document.getElementById("panel").hidden`);
    await key(client, "KeyN");
  }
  check("the notebook shows the earned stamp", await client.eval(`document.querySelectorAll(".stamp-slot.earned canvas").length`) === 1);
  await client.eval(`[...document.querySelectorAll(".nb-item")].find(b => /Ivory ball/.test(b.textContent)).click(); true`);
  await until(client, `[...document.querySelectorAll("#panel-body button")].some(b => /Save to my visit/.test(b.textContent))`);
  await client.eval(`[...document.querySelectorAll("#panel-body button")].find(b => /Save to my visit/.test(b.textContent)).click(); true`);
  check("saving from the notebook adds to the plan", await client.eval(`PP.plan.has("ivory-ball")`));
  await key(client, "Escape");
  await key(client, "Escape");
  await until(client, `document.getElementById("panel").hidden`);
  await client.eval(`document.getElementById("btn-menu").click(); true`);
  await until(client, `!document.getElementById("panel").hidden`);
  await client.eval(`[...document.querySelectorAll("#panel-body button")].find(b => /My visit plan/.test(b.textContent)).click(); true`);
  check("the plan lists the piece with its room", await until(client, `[...document.querySelectorAll(".plan-row")].some(r => /106/.test(r.textContent) && /Ivory ball/.test(r.textContent))`));
  check("the plan gives a time estimate", /about \d+(–\d+)? minutes/.test(await client.eval(`document.querySelector(".plan-summary").textContent`)));
  await shot(client, "9-plan");
  await key(client, "Escape");
}

// The Chinese version: switch on the title, hear the docent in Chinese,
// switch back from the menu.
async function chineseVisit(client) {
  await cdp.setup(client, { width: 1280, height: 800 });
  const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", JSON.stringify({ v: 1, seen: [], settings: { sound: false, music: false, autoTalk: true, stepFree: false, textSpeed: "instant", lang: "en" }, tour: { active: false } })); } catch (e) {}`;
  await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
  await until(client, `!document.getElementById("title").hidden`);
  await client.eval(`document.querySelector(".title-actions .lang-btn").click(); true`);
  check("the title switches to Chinese", await until(client, `[...document.querySelectorAll(".title-actions button")].some(b => b.textContent === "開始參觀") && document.documentElement.lang === "zh-Hant"`));
  check("the page's fixed labels switch too", await client.eval(`document.querySelector("#btn-ask .icon-label").textContent === "詢問"`));
  await shot(client, "10-title-zh");
  // focus stays on the language button, so start with a click
  await client.eval(`document.querySelector(".title-actions button").click(); true`);
  check("the docent speaks Chinese", await until(client, `document.getElementById("speaker").textContent === "導覽員" && /歡迎來到國立故宮博物院/.test(document.getElementById("text").textContent)`));
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  let s = await client.eval(state);
  check("Chinese choices", s.choices[0] === "帶我看最精彩的文物" && s.choices.includes("我想自己逛"), s.choices);
  await shot(client, "11-intro-zh");
  await choose(client, "我想自己逛");
  await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);
  check("the lobby label is in Chinese", /大廳/.test(await client.eval(`document.getElementById("where-main").textContent`)));
  await client.eval(`document.getElementById("btn-menu").click(); true`);
  await until(client, `!document.getElementById("panel").hidden`);
  // the menu is a grid: Down moves a row, Right moves a column
  await client.eval(`document.querySelector(".menu-tile").focus(); true`);
  await key(client, "ArrowDown");
  const down = await client.eval(`[...document.querySelectorAll(".menu-tile")].indexOf(document.activeElement)`);
  await key(client, "ArrowRight");
  const right = await client.eval(`[...document.querySelectorAll(".menu-tile")].indexOf(document.activeElement)`);
  check("arrow keys move through the menu by rows and columns", down === 2 && right === 3, [down, right]);
  await client.eval(`document.querySelector("#panel-body .lang-btn").click(); true`);
  check("the menu switches back to English", await until(client, `document.getElementById("panel-title").textContent === "Menu" && Lang.get() === "en"`));
  check("the choice is saved", await client.eval(`JSON.parse(localStorage.getItem("pixel-palace-v1")).settings.lang === "en"`));
  await key(client, "Escape");
}

// A visitor standing in Room 306 of the real museum: straight from the
// title to the room's list, tick off three pieces, earn the in-person seal.
async function museumVisit(client) {
  await cdp.setup(client, { width: 390, height: 844, touch: true });
  const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", JSON.stringify({ v: 1, seen: [], settings: { sound: false, music: false, autoTalk: true, stepFree: false, textSpeed: "instant", lang: "en" }, tour: { active: false } })); } catch (e) {}`;
  await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
  await until(client, `!document.getElementById("title").hidden`);
  await client.eval(`[...document.querySelectorAll(".title-actions button")].find(b => /Look up a room/.test(b.textContent)).click(); true`);
  check("the room lookup opens from the title", await until(client, `!document.getElementById("panel").hidden && document.querySelectorAll(".room-btn").length >= 8`));
  await shot(client, "12-rooms");
  await client.eval(`[...document.querySelectorAll(".room-btn")].find(b => b.querySelector("strong").textContent === "306").click(); true`);
  check("Room 306 lists its nine pieces", await until(client, `document.querySelectorAll(".room-row").length === 9`), await client.eval(`document.querySelectorAll(".room-row").length`));
  check("no horizontal overflow in the lookup on a phone", await client.eval("document.documentElement.scrollWidth <= innerWidth"));
  for (let i = 0; i < 3; i++) {
    await client.eval(`document.querySelectorAll(".room-row")[${i}].click(); true`);
    await until(client, `!!document.querySelector(".spot-btn")`);
    check(`piece ${i + 1}: has what to look for and no "Walk me there" from the title`, await client.eval(`!!document.querySelector(".spot-box p").textContent && ![...document.querySelectorAll("#panel-body button")].some(b => /Walk me there/.test(b.textContent))`));
    await client.eval(`document.querySelector(".spot-btn").click(); true`);
    if (i === 2) {
      check("the third find presses the round in-person seal", await until(client, `!!document.querySelector(".stamp-moment")`, 3000));
      await shot(client, "13-seal");
      await until(client, `!document.querySelector(".stamp-moment")`, 4000);
    }
    await key(client, "Escape");
    await until(client, `document.querySelectorAll(".room-row").length === 9`);
  }
  check("three pieces ticked off and saved", await client.eval(`PP.spotted.size === 3 && JSON.parse(localStorage.getItem("pixel-palace-v1")).spotted.length === 3`));
  check("the room shows them as found", await client.eval(`document.querySelectorAll(".room-row .mark-spot").length === 3`));
  await client.eval(`document.getElementById("panel-close").click(); true`);
  check("closing returns to the title", await until(client, `document.getElementById("panel").hidden && !document.getElementById("title").hidden`));
  await client.eval(`document.querySelector(".title-actions button").click(); true`);
  await until(client, `PP.mode === "play"`);
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  await choose(client, "on my own");
  await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);
  await key(client, "KeyN");
  await until(client, `!document.getElementById("panel").hidden`);
  check("the notebook shows the in-person seal", await client.eval(`document.querySelectorAll(".seal-slot.earned canvas").length === 1`));
  await key(client, "Escape");
  await cdp.setup(client, { width: 1280, height: 800 });
}

// Inside the jade gallery: ask for every piece in it, and the docent leads
// to the oldest one first.
async function galleryTour(client) {
  const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", JSON.stringify({ v: 1, seen: ["jade-cong"], settings: { sound: false, music: false, autoTalk: true, stepFree: false, textSpeed: "instant", lang: "en" }, tour: { active: false }, pos: { map: "jade", x: 14, y: 17, dir: "up" } })); } catch (e) {}`;
  await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
  await until(client, `!document.getElementById("title").hidden`);
  await key(client, "Enter");
  await until(client, `PP.mode === "play" && PP.map.id === "jade"`);
  await advance(client, `!PP.busy`);
  await key(client, "KeyQ");
  await until(client, `document.querySelectorAll("#choices .choice").length > 0`);
  let s = await client.eval(state);
  check("a gallery offers all of its pieces", s.choices.some(c => /Every piece in this gallery \(8 to go\)/.test(c)), s.choices);
  await choose(client, "Every piece in this gallery");
  await advance(client, `!!PP.lead && !PP.busy`);
  check("the gallery tour leads to the oldest piece first", await client.eval(`PP.lead && PP.lead.target.id === "hooked-cloud-pei"`));
  await key(client, "KeyG");
  check("auto-walk arrives and presents it", await until(client, `!document.getElementById("card").hidden && /hidden in the clouds/.test(document.getElementById("text").textContent)`, 15000));
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  s = await client.eval(state);
  check("the gallery tour goes on to the next piece", s.choices.includes("Next stop ▸"), s.choices);
  await choose(client, "Pause the tour");
  await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);
  await key(client, "KeyR");
  check("R opens the room you're standing in", await until(client, `!document.getElementById("panel").hidden && /Room 306/.test(document.querySelector(".room-head h3").textContent)`));
  await key(client, "Escape");
  await key(client, "Escape");
}

// A saved tour doesn't follow a visitor into a new visit from the entrance.
async function newVisitDropsOldTour(client) {
  const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", JSON.stringify({ v: 1, seen: ["mao-gong-ding"], settings: { sound: false, music: false, autoTalk: true, stepFree: false, textSpeed: "instant", lang: "en" }, tour: { active: true, mode: "full", visited: ["mao-gong-ding"] }, pos: { map: "1F", x: 12, y: 15, dir: "up" } })); } catch (e) {}`;
  await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
  await until(client, `!document.getElementById("title").hidden`);
  await client.eval(`[...document.querySelectorAll(".title-actions button")].find(b => /New visit/.test(b.textContent)).click(); true`);
  await until(client, `PP.mode === "play"`);
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  await choose(client, "on my own");
  await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);
  check("a new visit starts without the old tour", await client.eval(`PP.tour.active === false`));
}

// Exploring alone: the docent leaves, labels speak for each case, and the
// docent comes back when called.
async function exploreAlone(client) {
  await cdp.setup(client, { width: 1280, height: 800 });
  const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", JSON.stringify({ v: 1, seen: [], settings: { sound: false, music: false, autoTalk: true, stepFree: false, textSpeed: "instant", lang: "en" }, tour: { active: false } })); } catch (e) {}`;
  await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
  await until(client, `!document.getElementById("title").hidden`);
  await client.eval(`document.querySelector(".title-actions button").click(); true`);
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  await choose(client, "on my own");
  await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);
  check("the docent leaves", await until(client, `PP.docent.hidden && PP.companion === "alone"`, 6000));
  check("exploring alone is saved", await client.eval(`JSON.parse(localStorage.getItem("pixel-palace-v1")).companion === "alone"`));
  let s;
  await client.eval(`PP.run(() => Docent.present(PP, "ivory-ball")); true`);
  check("alone, the case's label speaks", await until(client, `document.getElementById("speaker").textContent === "Label" && !document.getElementById("dialog").classList.contains("has-portrait")`));
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  s = await client.eval(state);
  check("the label ends with Done", s.choices.includes("Done"), s.choices);
  await choose(client, "Done");
  await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);
  await key(client, "KeyQ");
  await until(client, `document.querySelectorAll("#choices .choice").length > 0`);
  s = await client.eval(state);
  check("alone, Ask is the floor guide with a way to call the docent", s.choices[0] === "Call the docent back" && document_speaker_ok(await client.eval(`document.getElementById("speaker").textContent`)), s.choices);
  await choose(client, "Call the docent back");
  check("the docent comes back", await until(client, `!PP.docent.hidden && PP.companion === "with" && PP.docent.alpha >= 0.99`, 6000));
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  s = await client.eval(state);
  check("back with the docent, a guided tour is on offer", s.choices.some(c => /guided tour/.test(c)), s.choices);
  await choose(client, "guided tour");
  await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
  await choose(client, "Must-sees");
  check("the must-see route has eight stops", await until(client, `document.querySelectorAll(".tour-piece").length === 8`));
  await client.eval(`[...document.querySelectorAll("#panel-body button")].find(b => /Start the tour/.test(b.textContent)).click(); true`);
  await advance(client, `!!PP.lead`);
  check("the must-see tour starts at the Mao Gong Ding", await client.eval(`PP.tour.mode === "short" && PP.lead.target.id === "mao-gong-ding"`), await client.eval(`[PP.tour.mode, PP.lead && PP.lead.target.id]`));
}
const document_speaker_ok = t => t === "Floor guide";

// Saves that would have thrown before: prototype keys, junk types, a
// position on the middle of a staircase (valid, should continue there).
async function oddSaves(client) {
  const cases = [
    { pos: { map: "constructor", x: 1, y: 1, dir: "up" }, settings: { textSpeed: "constructor" }, expectContinue: false },
    { pos: { map: "1F", x: 12, y: 15, dir: "toString" }, settings: { sound: "yes" }, expectContinue: false },
    { pos: { map: "1F", x: 12, y: 8, dir: "up" }, expectContinue: true }, { pos: { map: "1F", x: 12, y: 2, dir: "up" }, expectContinue: false },
    "{not json"
  ];
  for (const c of cases) {
    const raw = typeof c === "string" ? c : JSON.stringify({ v: 1, seen: ["mao-gong-ding", "__proto__"], ...c });
    const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", ${JSON.stringify(raw)}); } catch (e) {}`;
    await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
    const label = typeof c === "string" ? "unparseable save" : JSON.stringify(c.pos);
    check(`odd save ${label}: title still appears`, await until(client, `!document.getElementById("title").hidden`));
    if (typeof c !== "string") {
      const hasContinue = await client.eval(`[...document.querySelectorAll(".title-actions button")].some(b => b.textContent.startsWith("Continue"))`);
      check(`odd save ${label}: continue offered only when valid`, hasContinue === c.expectContinue, hasContinue);
    }
    await key(client, "Enter");
    const t0 = await client.eval("PP.time");
    await cdp.sleep(400);
    check(`odd save ${label}: game keeps running`, (await client.eval("PP.time")) > t0 && (await client.eval("PP.mode")) === "play");
  }
}

(async () => {
  const client = await cdp.launch();
  const errors = [];
  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    cdp.collectErrors(client, errors);
    await cdp.setup(client, { width: 1280, height: 800 });
    const seed = `try { localStorage.clear(); localStorage.setItem("pixel-palace-v1", JSON.stringify({ v: 1, seen: [], settings: { sound: false, music: false, autoTalk: true, stepFree: false, textSpeed: "instant" }, tour: { active: false } })); } catch (e) {}`;
    await cdp.load(client, base + "index.html", cdp.seedScript({ curtainSeen: false, raw: seed }), { settle: false });
    check("title shows", await until(client, `!document.getElementById("title").hidden`));
    await key(client, "Enter");
    check("intro starts with the docent talking", await until(client, `!document.getElementById("dialog").hidden && document.getElementById("speaker").textContent === "Docent"`));
    await shot(client, "1-intro");
    await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
    let s = await client.eval(state);
    check("intro offers a guided tour or exploring alone", s.choices.length === 2 && /Guide me/.test(s.choices[0]) && /on my own/.test(s.choices[1]), s.choices);
    await choose(client, "Guide me");
    await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
    s = await client.eval(state);
    check("the docent offers two planned routes", s.choices.some(c => /^Must-sees: 8 pieces/.test(c)) && s.choices.some(c => /^Highlights: 22 pieces/.test(c)), s.choices);
    await choose(client, "Highlights");
    check("the planned route is shown before setting off", await until(client, `document.querySelectorAll(".tour-piece").length === 22`));
    await shot(client, "1b-route");
    await client.eval(`[...document.querySelectorAll("#panel-body button")].find(b => /Start the tour/.test(b.textContent)).click(); true`);
    await advance(client, `!!PP.lead`);
    s = await client.eval(state);
    check("tour starts leading", s.lead && !s.dialog, s);
    check("a trail is drawn to the stairs", await client.eval("PP.trail.length > 3"));
    await shot(client, "2-trail");

    await key(client, "KeyG");
    check("auto-walk reaches 2F", await until(client, `PP.map.id === "2F"`, 15000));
    check("auto-walk reaches 3F", await until(client, `PP.map.id === "3F"`, 15000));
    await shot(client, "3-3F");
    check("auto-walk enters the bronze gallery", await until(client, `PP.map.id === "bronze"`, 15000));
    check("gallery intro plays", await until(client, `!document.getElementById("dialog").hidden`));
    s = await client.eval(state);
    check("intro names the rooms", /305 and 307/.test(s.text), s.text);
    await advance(client, `!document.getElementById("card").hidden`, 60);
    check("first stop's card is shown", await until(client, `!document.getElementById("card").hidden`, 15000));
    s = await client.eval(state);
    check("first stop is the coiled-dragon pan", /basin for water/.test(s.text), s.text);
    check("seen count went up", s.seen === 1, s.seen);
    await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
    s = await client.eval(state);
    await shot(client, "4-first-piece");
    check("piece offers closer / more / look / next / pause", s.choices.join("|") === "Look closer|Tell me more|What should I look for?|Next stop ▸|Pause the tour", s.choices);
    check("card shows the museum room", /Room 305/.test(await client.eval(`document.querySelector(".card-room").textContent`)));
    await choose(client, "What should I look for?");
    s = await client.eval(state);
    check("what-to-look-for follows", /dragon's raised head/.test(s.text), s.text);
    await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
    await choose(client, "Look closer");
    check("look closer opens the full photo", await until(client, `!document.getElementById("viewer").hidden && document.getElementById("viewer-img").complete && document.getElementById("viewer-img").naturalWidth >= 450`));
    // Enter on the focused Close button closes; the A key (Z) zooms
    await key(client, "KeyZ");
    check("A zooms the photo in", await until(client, `/scale\\(2\\.5\\)/.test(document.getElementById("viewer-img").style.transform)`, 2000), await client.eval(`document.getElementById("viewer-img").style.transform`));
    check("the sharp photo streams in behind it", await until(client, `/images\\/zoom\\//.test(document.getElementById("viewer-img").src) && document.getElementById("viewer-img").naturalWidth >= 1200`, 8000));
    check("the photo is credited the museum's way", /CC BY 4\.0 @ www\.npm\.gov\.tw/.test(await client.eval(`document.getElementById("viewer-credit").textContent`)));
    check("a mini-map shows where you've zoomed", await client.eval(`!document.getElementById("viewer-mini").hidden`));
    // holding Enter on Zoom in stops at the limit and keeps focus there
    await client.eval(`document.getElementById("zoom-in").focus(); true`);
    for (let i = 0; i < 6; i++) { await key(client, "Enter"); await cdp.sleep(260); }
    check("zoom stops at its limit with focus kept", await client.eval(`document.activeElement.id === "zoom-in" && document.getElementById("zoom-in").getAttribute("aria-disabled") === "true" && /scale\\(6\\)/.test(document.getElementById("viewer-img").style.transform)`),
      await client.eval(`[document.activeElement.id, document.getElementById("viewer-img").style.transform]`));
    await shot(client, "4b-viewer");
    await key(client, "Escape");
    check("Escape closes the viewer and the docent carries on", await until(client, `document.getElementById("viewer").hidden && document.querySelectorAll("#choices .choice").length > 0 || /What else/.test(document.getElementById("text").textContent)`));
    await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
    await choose(client, "Pause the tour");
    await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);
    s = await client.eval(state);
    check("pause ends the conversation", !s.dialog && !s.card && !s.lead, s);

    // a piece without an openly licensed photo says so, and has no "Look closer"
    await client.eval(`PP.run(() => Docent.present(PP, "hui-snake-ding")); true`);
    await advance(client, `document.querySelectorAll("#choices .choice").length > 0`);
    s = await client.eval(state);
    check("no-photo piece: the card says there's no photo yet", await client.eval(`!!document.querySelector("#card .no-photo")`));
    check("no-photo piece: no Look closer", !s.choices.includes("Look closer") && s.choices.includes("Thanks!"), s.choices);
    await choose(client, "Thanks!");
    await advance(client, `!PP.busy && document.getElementById("dialog").hidden`);

    // walk a few steps by hand and check the docent keeps up
    const before = await client.eval("({ x: PP.player.x, y: PP.player.y })");
    await key(client, "ArrowLeft", 600);
    await cdp.sleep(500);
    const after = await client.eval("({ x: PP.player.x, y: PP.player.y, d: Math.abs(PP.docent.x - PP.player.x) + Math.abs(PP.docent.y - PP.player.y) })");
    check("arrow keys walk", after.x < before.x, [before, after]);
    check("docent stays close", after.d <= 2, after);

    await key(client, "KeyN");
    check("notebook opens", await until(client, `!document.getElementById("panel").hidden`));
    check("notebook lists all 68", await client.eval(`document.querySelectorAll(".nb-item").length`) === 68);
    await shot(client, "5-notebook");
    await key(client, "Escape");
    check("notebook closes", await until(client, `document.getElementById("panel").hidden`));

    // phone-sized screen: touch pad shows, nothing spills sideways
    await cdp.setup(client, { width: 390, height: 844, touch: true });
    await client.eval("window.dispatchEvent(new Event('resize'))");
    await cdp.sleep(300);
    await shot(client, "6-phone");
    check("no horizontal overflow on a phone", await client.eval("document.documentElement.scrollWidth <= innerWidth"));

    await exploreAlone(client);
    await chineseVisit(client);
    await museumVisit(client);
    await galleryTour(client);
    await newVisitDropsOldTour(client);
    await secondVisit(client);
    await oddSaves(client);
    await stampVisit(client);
    await offlineVisit(client);
  } catch (e) {
    failures++;
    console.log("FAIL threw", e.message);
  } finally {
    check("no console errors", errors.length === 0, errors);
    await client.close();
  }
  console.log(`play: ${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
