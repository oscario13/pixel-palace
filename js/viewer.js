/*
  The full-screen photo viewer, after museum collection sites like Google
  Arts & Culture: the photo opens at once at screen size, the sharp
  2000px version streams in behind it, and a side panel says what to look
  for and credits the photo. Pinch, wheel, double-tap or the keyboard zoom
  in; a drag pans with a little momentum; a mini-map shows where you are.
*/
(function (root) {
  const $ = id => document.getElementById(id);
  const L = (en, zh) => Lang.L(en, zh);
  const ZOOM_MIN = 1;
  const ZOOM_MAX_SHARP = 6, ZOOM_MAX = 3;
  const TWEEN_MS = 220;
  const FRICTION = 0.9;

  let v = null;   // { resolve, s, tx, ty, max, pointers, returnFocus, onClose, anim, glide }
  let reduceMotion = false;

  function init() {
    reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bind();
  }

  const isOpen = () => !!v;

  /*
    Opens the viewer and resolves when it closes. `onClose` runs first, so
    the caller can put focus back where it belongs.
  */
  function open(id, piece, gallery, { onClose = null } = {}) {
    return new Promise(resolve => {
      if (v) close();
      const sharp = !!piece.record;
      $("viewer-zh").textContent = piece.nameZh;
      $("viewer-title").textContent = piece.name;
      $("viewer-meta").textContent = `${TourData.pieceDate(piece)} · ${gallery.floor}F${L(",", "")} ${Text.roomName(piece.room)} · ${TourData.galleryTitle(gallery)}`;
      $("viewer-look-head").textContent = L("What to look for", "觀看重點");
      $("viewer-look").textContent = TourData.text(piece, "look");
      $("viewer-intro").textContent = TourData.text(piece, "intro");
      $("viewer-credit").textContent = credit(piece);
      $("viewer-info").setAttribute("aria-label", L("About this photo", "照片說明"));
      const img = $("viewer-img");
      img.alt = L(`Photograph of the ${piece.name}`, `${piece.nameZh}的照片`);
      // never show the last piece's photo under this one's title
      img.removeAttribute("src");
      img.style.width = img.style.height = "";
      $("viewer-mini-img").removeAttribute("src");
      img.onload = () => { if (v && v.id === id && !v.ratio) { v.ratio = img.naturalWidth / img.naturalHeight; fit(); } };
      img.src = `images/photos/${id}.jpg`;
      $("viewer-mini-img").src = img.src;
      v = {
        resolve, onClose, s: 1, tx: 0, ty: 0, max: sharp ? ZOOM_MAX_SHARP : ZOOM_MAX,
        pointers: new Map(), returnFocus: document.activeElement, anim: null, glide: null, id, ratio: 0
      };
      $("viewer-hd").hidden = true;
      if (sharp) loadSharp(id);
      apply();
      $("viewer").hidden = false;
      setInert(true);
      paintInfo();
      $("viewer-close").focus({ preventScroll: true });
      Sound.play("open");
    });
  }

  // "<name> The National Palace Museum, Taipei, CC BY 4.0 @ www.npm.gov.tw",
  // the museum's own attribution form, plus the open-data record number.
  function credit(p) {
    const name = Lang.isZh() ? p.nameZh : p.name;
    const rec = p.record ? ` (${L("Open Data", "開放資料")} ${p.record})` : "";
    return `${L("Photo", "照片")}: ${name}, ${L("The National Palace Museum, Taipei", "國立故宮博物院，臺北")}, CC BY 4.0 @ www.npm.gov.tw${rec}`;
  }

  // While the viewer is open, the game behind it can't take focus.
  const BEHIND = ["hud", "touch", "card", "talk", "btn-go", "panel"];
  function setInert(on) {
    for (const id of BEHIND) { const e = $(id); if (e) e.inert = on; }
  }

  /*
    The photo's box is sized from the stage and the photo's shape, not its
    pixels, so swapping in the sharp version changes nothing on screen.
  */
  function fit() {
    if (!v || !v.ratio) return;
    const stage = $("viewer-stage"), img = $("viewer-img");
    const W = Math.min(stage.clientWidth * 0.94, 1100), H = stage.clientHeight * 0.96;
    const w = Math.min(W, H * v.ratio);
    img.style.width = `${Math.round(w)}px`;
    img.style.height = `${Math.round(w / v.ratio)}px`;
    apply();
  }

  // the side panel shows by default on wide screens and on request on narrow ones
  function paintInfo() {
    const shown = getComputedStyle(document.querySelector(".viewer-side")).display !== "none";
    $("viewer-info").setAttribute("aria-pressed", String(shown));
  }

  // Swap in the sharp version once it has fully arrived, without a jump.
  function loadSharp(id) {
    const hd = $("viewer-hd");
    hd.textContent = L("Loading full detail…", "載入高解析度…");
    hd.hidden = false;
    const big = new Image();
    big.decoding = "async";
    big.onload = () => {
      if (!v || v.id !== id) return;
      $("viewer-img").src = big.src;
      hd.textContent = L("Full detail", "高解析度");
      setTimeout(() => { if (v && v.id === id) hd.hidden = true; }, 1400);
    };
    big.onerror = () => { if (v && v.id === id) hd.hidden = true; };
    big.src = `images/zoom/${id}.jpg`;
  }

  function close() {
    if (!v) return;
    const { resolve, returnFocus, onClose } = v;
    cancelAnimationFrame(v.anim);
    cancelAnimationFrame(v.glide);
    v = null;
    $("viewer").hidden = true;
    setInert(false);
    if (onClose) onClose(returnFocus);
    resolve();
  }

  // Keep the zoomed photo from being dragged out of view, then draw it and
  // the mini-map's window.
  function apply() {
    const img = $("viewer-img");
    const maxX = (img.clientWidth * (v.s - 1)) / 2, maxY = (img.clientHeight * (v.s - 1)) / 2;
    v.tx = Math.max(-maxX, Math.min(maxX, v.tx));
    v.ty = Math.max(-maxY, Math.min(maxY, v.ty));
    img.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`;
    const zoomed = v.s > 1.01;
    $("viewer-stage").classList.toggle("zoomed", zoomed);
    const mini = $("viewer-mini");
    mini.hidden = !zoomed;
    if (zoomed) {
      // the visible part of the photo, as fractions of it
      const stage = $("viewer-stage");
      const W = img.clientWidth * v.s, H = img.clientHeight * v.s;
      const w = Math.min(1, stage.clientWidth / W), h = Math.min(1, stage.clientHeight / H);
      const cx = 0.5 - v.tx / W, cy = 0.5 - v.ty / H;
      const box = $("viewer-mini-box");
      box.style.left = `${(cx - w / 2) * 100}%`;
      box.style.top = `${(cy - h / 2) * 100}%`;
      box.style.width = `${w * 100}%`;
      box.style.height = `${h * 100}%`;
    }
    // aria-disabled rather than disabled, so a focused button keeps focus
    $("zoom-in").setAttribute("aria-disabled", String(v.s >= v.max - 0.01));
    $("zoom-out").setAttribute("aria-disabled", String(v.s <= ZOOM_MIN + 0.01));
  }

  // The zoom and pan that keep the point (px, py), measured from the
  // stage's centre, under the finger or cursor.
  function target(s, px, py) {
    const next = Math.max(ZOOM_MIN, Math.min(v.max, s));
    const k = next / v.s;
    return { s: next, tx: px - k * (px - v.tx), ty: py - k * (py - v.ty) };
  }

  function zoomTo(s, px = 0, py = 0) {
    const t = target(s, px, py);
    v.s = t.s; v.tx = t.tx; v.ty = t.ty;
    apply();
  }

  // the same, eased over a moment, for buttons, keys and double-taps
  function zoomSmooth(s, px = 0, py = 0) {
    if (reduceMotion) return zoomTo(s, px, py);
    cancelAnimationFrame(v.anim);
    cancelAnimationFrame(v.glide);
    const from = { s: v.s, tx: v.tx, ty: v.ty }, to = target(s, px, py);
    const t0 = performance.now();
    const ease = k => 1 - Math.pow(1 - k, 3);
    const step = now => {
      if (!v) return;
      const k = Math.min(1, (now - t0) / TWEEN_MS), e = ease(k);
      v.s = from.s + (to.s - from.s) * e;
      v.tx = from.tx + (to.tx - from.tx) * e;
      v.ty = from.ty + (to.ty - from.ty) * e;
      apply();
      if (k < 1) v.anim = requestAnimationFrame(step);
    };
    v.anim = requestAnimationFrame(step);
  }

  function stagePoint(e) {
    const r = $("viewer-stage").getBoundingClientRect();
    return { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) };
  }

  // keys and pad buttons while the viewer is open; always used up
  function handle(action) {
    if (action.startsWith("held:")) return true;
    if (["b", "menu", "notebook", "look"].includes(action)) { Sound.play("back"); close(); }
    else if (action === "a") zoomSmooth(v.s > 1.5 ? 1 : 2.5);
    else if (v.s > 1.01 && ["up", "down", "left", "right"].includes(action)) {
      const step = 90;
      if (action === "up") v.ty += step;
      if (action === "down") v.ty -= step;
      if (action === "left") v.tx += step;
      if (action === "right") v.tx -= step;
      apply();
    }
    return true;
  }

  // after a drag, the photo keeps sliding a little and slows to a stop
  function glide(vx, vy) {
    if (reduceMotion || Math.hypot(vx, vy) < 0.05) return;
    let last = performance.now();
    const step = now => {
      if (!v) return;
      const dt = Math.min(40, now - last);
      last = now;
      v.tx += vx * dt;
      v.ty += vy * dt;
      const f = Math.pow(FRICTION, dt / 16);
      vx *= f;
      vy *= f;
      apply();
      if (Math.hypot(vx, vy) > 0.02) v.glide = requestAnimationFrame(step);
    };
    v.glide = requestAnimationFrame(step);
  }

  function bind() {
    const stage = $("viewer-stage");
    $("viewer-close").addEventListener("click", () => { Sound.play("back"); close(); });
    $("zoom-in").addEventListener("click", () => v && v.s < v.max - 0.01 && zoomSmooth(v.s * 1.6));
    $("zoom-out").addEventListener("click", () => v && v.s > ZOOM_MIN + 0.01 && zoomSmooth(v.s / 1.6));
    $("viewer-info").addEventListener("click", () => {
      $("viewer").classList.toggle("info-open");
      paintInfo();
      Sound.play($("viewer-info").getAttribute("aria-pressed") === "true" ? "open" : "back");
      fit();
    });
    window.addEventListener("resize", () => { if (v) { fit(); paintInfo(); } });
    stage.addEventListener("wheel", e => {
      if (!v) return;
      e.preventDefault();
      cancelAnimationFrame(v.anim);
      const p = stagePoint(e);
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
      zoomTo(v.s * Math.exp(-dy * 0.0025), p.x, p.y);
    }, { passive: false });
    let lastTap = 0, lastTouchZoom = 0, pinch = null, drag = null;
    stage.addEventListener("dblclick", e => {
      if (!v || performance.now() - lastTouchZoom < 600) return;
      const p = stagePoint(e);
      zoomSmooth(v.s > 1.5 ? 1 : 2.5, p.x, p.y);
    });
    stage.addEventListener("pointerdown", e => {
      if (!v) return;
      cancelAnimationFrame(v.glide);
      cancelAnimationFrame(v.anim);
      stage.setPointerCapture(e.pointerId);
      v.pointers.set(e.pointerId, stagePoint(e));
      if (v.pointers.size === 2) {
        const [a, b] = [...v.pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: v.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
        drag = null;
        return;
      }
      drag = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty, vx: 0, vy: 0, t: performance.now() };
      stage.classList.add("dragging");
      const now = performance.now();
      if (e.pointerType !== "mouse" && now - lastTap < 300) {
        const p = stagePoint(e);
        zoomSmooth(v.s > 1.5 ? 1 : 2.5, p.x, p.y);
        lastTouchZoom = now;
      }
      lastTap = now;
    });
    stage.addEventListener("pointermove", e => {
      if (!v || !v.pointers.has(e.pointerId)) return;
      v.pointers.set(e.pointerId, stagePoint(e));
      if (pinch && v.pointers.size === 2) {
        const [a, b] = [...v.pointers.values()];
        zoomTo(pinch.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), pinch.cx, pinch.cy);
      } else if (drag && v.s > 1.01) {
        const now = performance.now();
        const nx = drag.tx + (e.clientX - drag.x), ny = drag.ty + (e.clientY - drag.y);
        const dt = Math.max(1, now - drag.t);
        // a smoothed velocity in px per ms, for the glide on release
        drag.vx = drag.vx * 0.6 + ((nx - v.tx) / dt) * 0.4;
        drag.vy = drag.vy * 0.6 + ((ny - v.ty) / dt) * 0.4;
        drag.t = now;
        v.tx = nx;
        v.ty = ny;
        apply();
        // past an edge, start again from where the photo actually stopped
        if (v.tx !== nx || v.ty !== ny) { drag.x = e.clientX; drag.y = e.clientY; drag.tx = v.tx; drag.ty = v.ty; }
      }
    });
    const end = e => {
      if (!v) return;
      v.pointers.delete(e.pointerId);
      if (v.pointers.size < 2) pinch = null;
      if (!v.pointers.size) {
        if (drag && v.s > 1.01 && performance.now() - drag.t < 80) glide(drag.vx, drag.vy);
        drag = null;
        stage.classList.remove("dragging");
      }
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }

  root.Viewer = { init, open, close, isOpen, handle };
})(typeof globalThis !== "undefined" ? globalThis : this);
