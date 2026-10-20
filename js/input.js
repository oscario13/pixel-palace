/*
  Keyboard, the on-screen pad and taps, turned into a few actions:
  up/down/left/right (held), a, b, menu, notebook, ask, go, rooms (pressed), and
  run (held). While a dialogue or panel is open, presses go to the UI
  instead of the game.
*/
(function (root) {
  const KEYS = {
    ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
    KeyZ: "a", Enter: "a", Space: "a",
    KeyX: "b", Escape: "b", Backspace: "b",
    KeyM: "menu", KeyN: "notebook", KeyQ: "ask", KeyG: "go", KeyL: "look", KeyP: "plan", KeyR: "rooms"
  };
  const DIR_ACTIONS = ["up", "down", "left", "right"];

  const held = new Map();      // dir -> time it went down
  const pressed = [];          // one-shot actions waiting for the game: { action, at }
  const PRESS_TTL = 250;       // ms; older presses are dropped, never replayed later
  let runKey = false, runHeldB = false;
  let uiHandler = null;        // returns true when the UI took the action
  let tapHandler = null;
  let activityHandler = null;

  function press(action) {
    if (activityHandler) activityHandler();
    if (uiHandler && uiHandler(action)) return;
    if (!DIR_ACTIONS.includes(action)) pressed.push({ action, at: performance.now() });
  }

  function down(dir) {
    if (!held.has(dir)) held.set(dir, performance.now());
  }

  function up(dir) {
    held.delete(dir);
  }

  function onKeyDown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") { runKey = true; return; }
    const action = KEYS[e.code];
    if (!action) return;
    // let a focused panel button handle its own Enter/Space
    const t = e.target;
    const inPanel = t && t.closest && t.closest("#panel button, #title button, #viewer button");
    if (inPanel && (e.code === "Enter" || e.code === "Space")) return;
    e.preventDefault();
    if (DIR_ACTIONS.includes(action)) {
      if (!e.repeat) press(action);
      if (!(uiHandler && uiHandler("held:" + action))) down(action);
    } else if (!e.repeat) {
      if (action === "b") runHeldB = true;
      press(action);
    }
  }

  function onKeyUp(e) {
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") { runKey = false; return; }
    const action = KEYS[e.code];
    if (DIR_ACTIONS.includes(action)) up(action);
    if (action === "b") runHeldB = false;
  }

  // the most recently pressed direction that is still held
  function dir() {
    let best = null, at = -1;
    for (const [d, t] of held) if (t > at) { best = d; at = t; }
    return best;
  }

  function heldFor(d) {
    return held.has(d) ? (performance.now() - held.get(d)) / 1000 : 0;
  }

  function consume(action) {
    const now = performance.now();
    while (pressed.length && now - pressed[0].at > PRESS_TTL) pressed.shift();
    const i = pressed.findIndex(p => p.action === action);
    if (i === -1) return false;
    pressed.splice(i, 1);
    return true;
  }

  // forget presses made while a conversation, menu or warp had the screen
  function flush() {
    pressed.length = 0;
  }

  function clear() {
    pressed.length = 0;
    held.clear();
  }

  // ---- touch ----

  function bindPad(pad) {
    let active = null;
    const set = (e) => {
      const r = pad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.12) { held.clear(); active = null; pad.dataset.dir = ""; return; }
      const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      if (d !== active) {
        held.clear();
        active = d;
        press(d);
        if (!(uiHandler && uiHandler("held:" + d))) down(d);
        pad.dataset.dir = d;
      }
    };
    const end = () => { held.clear(); active = null; pad.dataset.dir = ""; };
    pad.addEventListener("pointerdown", e => { e.preventDefault(); pad.setPointerCapture(e.pointerId); set(e); });
    pad.addEventListener("pointermove", e => { if (active !== null || e.buttons) set(e); });
    pad.addEventListener("pointerup", end);
    pad.addEventListener("pointercancel", end);
    pad.addEventListener("lostpointercapture", end);
  }

  function bindButton(el, action, { holdRun = false } = {}) {
    el.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (holdRun) runHeldB = true;
      press(action);
    });
    const release = () => { if (holdRun) runHeldB = false; };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", release);
  }

  function bindCanvas(canvas) {
    let start = null;
    canvas.addEventListener("pointerdown", e => { start = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener("pointerup", e => {
      if (!start) return;
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      start = null;
      if (moved > 12) return;
      if (activityHandler) activityHandler();
      if (uiHandler && uiHandler("tap")) return;
      if (tapHandler) tapHandler(e.clientX, e.clientY);
    });
  }

  function init({ onUi, onTap, onActivity }) {
    uiHandler = onUi;
    tapHandler = onTap;
    activityHandler = onActivity;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => { held.clear(); runKey = false; runHeldB = false; });
  }

  const api = {
    init, bindPad, bindButton, bindCanvas, press, dir, heldFor, consume, flush, clear,
    running: () => runKey || runHeldB
  };
  root.Input = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
