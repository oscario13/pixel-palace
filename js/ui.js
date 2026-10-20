/*
  Everything drawn in HTML over the game: the wall-label text box and
  choice box, the artifact card, toasts, menus and panels, and the title
  screen. Text lives in the DOM (not the canvas) so it is sharp, handles
  Chinese, and reaches screen readers.
*/
(function (root) {
  const $ = id => document.getElementById(id);
  const SPEEDS = { slow: 28, normal: 55, fast: 110, instant: Infinity };

  let el = {};
  let speed = SPEEDS.normal;
  let reduceMotion = false;
  let talk = null;       // the open dialogue
  let panel = null;      // { resolve, onBack }
  let title = null;
  let toastTimer = null;
  let cardData = null;   // the piece on the card, for "Look closer"
  const L = (en, zh) => Lang.L(en, zh);

  function init() {
    el = {
      dialog: $("dialog"), speaker: $("speaker"), text: $("text"), more: $("more"),
      choices: $("choices"), card: $("card"), toast: $("toast"), panel: $("panel"),
      panelTitle: $("panel-title"), panelBody: $("panel-body"), panelClose: $("panel-close"),
      title: $("title"), whereMain: $("where-main"), whereSub: $("where-sub"), go: $("btn-go"), sr: $("sr"),
      portrait: $("portrait"), logo: $("logo")
    };
    drawPortrait();
    requestAnimationFrame(animatePortrait);
    drawLogo();
    reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.dialog.addEventListener("click", () => handle("a"));
    el.panelClose.addEventListener("click", () => closePanel(null));
    el.panel.addEventListener("click", e => { if (e.target === el.panel) closePanel(null); });
    Viewer.init();
  }

  const isOpen = () => !!(talk || panel || title || Viewer.isOpen());

  // the touch pad hides while text or a panel is up
  function sync() {
    document.body.classList.toggle("ui-open", isOpen());
  }

  function setTextSpeed(name) {
    speed = Object.hasOwn(SPEEDS, name) ? SPEEDS[name] : SPEEDS.normal;
  }

  // ---- dialogue ----

  /*
    Shows pages one at a time with a typewriter. If `choices` are given they
    appear after the last page and the promise resolves with the chosen
    index; `cancel` is the index B / Escape picks (omit to forbid).
  */
  function say(pages, { speaker = "", portrait = false, choices = null, cancel = null, onChar = null } = {}) {
    return new Promise(resolve => {
      if (talk) finishTalk(-1);
      talk = { pages: pages.length ? pages : [""], i: 0, shown: 0, resolve, choices, cancel, onChar, choosing: false, portrait, holdUntil: 0 };
      el.speaker.textContent = speaker;
      el.speaker.hidden = !speaker;
      el.dialog.hidden = false;
      el.dialog.classList.toggle("has-speaker", !!speaker);
      el.dialog.classList.toggle("has-portrait", portrait);
      sync();
      showPage();
    });
  }

  function showPage() {
    const page = talk.pages[talk.i];
    talk.shown = 0;
    el.text.textContent = "";
    el.more.hidden = true;
    el.choices.hidden = true;
    clearInterval(talk.timer);
    if (speed === Infinity || reduceMotion) return pageDone();
    // each Chinese character carries more, so it types out more slowly
    const rate = Text.isCJK(page) ? speed * 0.45 : speed;
    let last = performance.now(), carry = 0;
    talk.timer = setInterval(() => {
      const now = performance.now();
      if (now < talk.holdUntil) { last = now; return; }
      carry += ((now - last) / 1000) * rate;
      last = now;
      let n = Math.floor(carry);
      if (!n) return;
      carry -= n;
      // stop at punctuation for a breath, the way people speak
      for (let k = 1; k <= n; k++) {
        const ch = page[talk.shown + k - 1];
        const hold = PAUSES[ch];
        if (hold && talk.shown + k < page.length) { n = k; carry = 0; talk.holdUntil = now + hold * (55 / Math.max(20, speed)); break; }
      }
      talk.shown = Math.min(page.length, talk.shown + n);
      el.text.textContent = page.slice(0, talk.shown);
      if (talk.onChar && /\S/.test(page[talk.shown - 1] || "") && !PAUSES[page[talk.shown - 1]] && (talk.shown % 2 === 0 || n > 1)) talk.onChar();
      if (talk.shown >= page.length) pageDone();
    }, 16);
  }

  // how long to hold after punctuation, in milliseconds at normal speed
  const PAUSES = { ".": 260, "!": 260, "?": 260, "。": 260, "！": 260, "？": 260, ",": 110, "，": 110, "、": 90, ";": 140, "；": 140, ":": 140, "：": 140, "—": 140 };
  // the portrait's mouth moves while text is typing, not during pauses
  const talking = () => !!(talk && talk.portrait && talk.shown < talk.pages[talk.i].length && performance.now() >= talk.holdUntil);

  function pageDone() {
    clearInterval(talk.timer);
    const page = talk.pages[talk.i];
    talk.shown = page.length;
    el.text.textContent = page;
    el.sr.textContent = (el.speaker.hidden ? "" : el.speaker.textContent + ": ") + page;
    const last = talk.i === talk.pages.length - 1;
    if (last && talk.choices) showChoices();
    else el.more.hidden = false;
  }

  function showChoices() {
    talk.choosing = true;
    el.choices.innerHTML = "";
    talk.choices.forEach((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.textContent = label;
      b.addEventListener("click", () => { Sound.play("select"); finishTalk(i); });
      el.choices.append(b);
    });
    el.choices.hidden = false;
    el.choices.firstChild.focus({ preventScroll: true });
  }

  function moveChoice(delta) {
    const buttons = [...el.choices.querySelectorAll("button")];
    const i = buttons.indexOf(document.activeElement);
    const next = buttons[(i + delta + buttons.length) % buttons.length];
    next.focus({ preventScroll: true });
    Sound.play("move");
  }

  function finishTalk(result) {
    if (!talk) return;
    clearInterval(talk.timer);
    const { resolve } = talk;
    talk = null;
    el.dialog.hidden = true;
    el.choices.hidden = true;
    el.choices.innerHTML = "";
    sync();
    resolve(result);
  }

  function advance() {
    const t = talk;
    if (t.shown < t.pages[t.i].length) return pageDone();
    if (t.i < t.pages.length - 1) {
      t.i++;
      Sound.play("blip");
      return showPage();
    }
    if (!t.choices) finishTalk(0);
  }

  // ---- input routing: returns true when the UI used the action ----

  function handle(action) {
    if (Viewer.isOpen()) return Viewer.handle(action);
    if (action === "plan") {
      if (cardData && cardData.toggle && !el.card.hidden) cardData.toggle();
      return !!(talk || panel || title);
    }
    if (action === "look") {
      if (cardData && !el.card.hidden && cardData.piece.photo) openViewer(cardData.id, cardData.piece, cardData.gallery);
      return true;
    }
    if (title) return handleNav(action, el.title);
    if (panel) {
      if (action === "b" || action === "menu" || action === "notebook") { panel.onBack ? panel.onBack() : closePanel(null); return true; }
      return handleNav(action, el.panelBody);
    }
    if (!talk) return false;
    if (action.startsWith("held:")) return true;
    if (talk.choosing) {
      if (action === "up" || action === "left") moveChoice(-1);
      else if (action === "down" || action === "right") moveChoice(1);
      else if (action === "a") {
        const f = document.activeElement;
        if (f && f.classList.contains("choice")) f.click();
        else if (el.choices.firstChild) el.choices.firstChild.focus({ preventScroll: true });
      }
      else if (action === "b" && talk.cancel !== null) { Sound.play("back"); finishTalk(talk.cancel); }
      return true;
    }
    if (action === "a" || action === "b" || action === "tap") advance();
    return true;
  }

  // arrow keys walk focus through a panel's buttons; A presses the focused one
  function handleNav(action, container) {
    if (action.startsWith("held:")) return true;
    const items = [...container.querySelectorAll("button:not([disabled]), [role=switch]")].filter(b => b.offsetParent !== null);
    if (!items.length) return true;
    const i = items.indexOf(document.activeElement);
    if (["up", "left", "down", "right"].includes(action)) {
      const next = i >= 0 ? nearest(items, items[i], action) : null;
      const delta = action === "up" || action === "left" ? -1 : 1;
      (next || items[(i + delta + items.length) % items.length]).focus();
      Sound.play("move");
    } else if (action === "a") {
      (i >= 0 ? items[i] : items[0]).click();
    }
    return true;
  }

  /*
    The button that lies in the pressed direction from `from`, so the
    arrows move by rows and columns through grids like the menu tiles.
    Null when nothing lies that way (the caller then wraps in order).
  */
  function nearest(items, from, dir) {
    const a = from.getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bestScore = Infinity;
    for (const it of items) {
      if (it === from) continue;
      const b = it.getBoundingClientRect();
      const dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
      const along = dir === "up" ? -dy : dir === "down" ? dy : dir === "left" ? -dx : dx;
      const across = dir === "up" || dir === "down" ? Math.abs(dx) : Math.abs(dy);
      if (along < 4) continue;
      const score = along + across * 2;
      if (score < bestScore) { bestScore = score; best = it; }
    }
    return best;
  }

  // ---- card, toast, HUD ----

  // `side` matters only on wide screens, where the card sits beside the
  // player instead of above them
  function showCard(id, piece, gallery, badge = "", side = "left", { saved = false, onToggleSave = null } = {}) {
    el.card.innerHTML = "";
    cardData = { id, piece, gallery };
    const img = piece.photo ? zoomButton(id, piece, gallery) : noPhoto();
    const body = document.createElement("div");
    body.className = "card-body";
    const zh = document.createElement("p"); zh.className = "card-zh"; zh.lang = "zh-Hant"; zh.textContent = piece.nameZh;
    const name = document.createElement("h2"); name.textContent = piece.name;
    if (Lang.isZh()) { zh.className = "card-zh big"; name.className = "card-en"; }
    const meta = document.createElement("p"); meta.className = "card-meta"; meta.textContent = TourData.pieceDate(piece);
    const room = document.createElement("p"); room.className = "card-room";
    room.textContent = `${gallery.floor}F · ${Text.roomName(piece.room)} · ${TourData.galleryTitle(gallery)}`;
    body.append(zh, name, meta, room);
    if (badge) {
      const b = document.createElement("p");
      b.className = "card-badge";
      b.textContent = "★ " + badge;
      body.append(b);
    }
    if (onToggleSave) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-save";
      const paint = on => {
        btn.textContent = on ? L("★ On my visit plan", "★ 已在參觀計畫") : L("☆ Save to my visit", "☆ 加入參觀計畫");
        btn.setAttribute("aria-pressed", String(on));
      };
      paint(saved);
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const on = onToggleSave();
        paint(on);
        Sound.play(on ? "select" : "back");
        toast(on ? L("Added to your visit plan", "已加入參觀計畫") : L("Removed from your visit plan", "已從參觀計畫移除"));
      });
      cardData.toggle = () => btn.click();
      body.append(btn);
    }
    el.card.append(img, body);
    el.card.classList.toggle("right", side === "right");
    // keep the choice box on the opposite side from the card
    document.getElementById("talk").classList.toggle("choices-left", side === "right");
    el.card.hidden = false;
  }

  function hideCard() {
    el.card.hidden = true;
    cardData = null;
    document.getElementById("talk").classList.remove("choices-left");
  }

  // For the few pieces without an openly licensed photo yet.
  function noPhoto() {
    const d = document.createElement("div");
    d.className = "card-zoom no-photo";
    d.textContent = L("No openly licensed photo yet", "目前還沒有開放授權的照片");
    return d;
  }

  // The cut-out photo as a button that opens the full-size viewer.
  function zoomButton(id, piece, gallery) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card-zoom";
    b.setAttribute("aria-label", L(`Look closer at the ${piece.name}`, `看清楚${piece.nameZh}`));
    const img = document.createElement("img");
    img.src = `images/objects/${id}.webp`;
    img.alt = "";
    const hint = document.createElement("span");
    hint.className = "zoom-hint";
    hint.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8.5v5M8.5 11h5"/></svg>';
    hint.append(L("Look closer", "看清楚一點"));
    b.append(img, hint);
    b.addEventListener("click", e => { e.stopPropagation(); openViewer(id, piece, gallery); });
    return b;
  }

  // ---- seal stamps ----

  // A square cinnabar seal with the gallery's Chinese title, read in
  // columns from the right, with a little ink texture. The round jade seal
  // is the one earned by finding pieces in the real museum.
  function sealCanvas(text, size = 72, { round = false } = {}) {
    const c = document.createElement("canvas");
    const k = 2;
    c.width = c.height = size * k;
    c.className = "seal-canvas";
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", L(`Stamp: ${text}`, `印章：${text}`));
    const ctx = c.getContext("2d");
    ctx.scale(k, k);
    const red = round ? "#2f7d64" : "#b5352b";
    ctx.strokeStyle = red;
    ctx.lineWidth = size * 0.07;
    if (round) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(size * 0.08, size * 0.08, size * 0.84, size * 0.84);
    }
    ctx.fillStyle = red;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${size * 0.3}px "Songti TC","Noto Serif TC","PMingLiU",serif`;
    const chars = [...text];
    const colX = [size * 0.67, size * 0.33];
    const rowY = chars.length >= 4 ? [size * 0.32, size * 0.68] : [size * 0.32, size * 0.68];
    chars.forEach((ch, i) => {
      const col = Math.floor(i / 2), row = i % 2;
      const lone = chars.length === 3 && i === 2;
      ctx.fillText(ch, colX[col], lone ? size / 2 : rowY[row]);
    });
    // worn ink: knock out a sprinkle of tiny specks, the same every time
    ctx.globalCompositeOperation = "destination-out";
    let seed = [...text].reduce((a, ch) => a + ch.charCodeAt(0), 7);
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 90; i++) {
      ctx.fillRect(rand() * size, rand() * size, 0.5 + rand() * 1.2, 0.5 + rand() * 1.2);
    }
    ctx.globalCompositeOperation = "source-over";
    return c;
  }

  // The moment a stamp is earned: it presses down onto the screen.
  function stampMoment(gallery, caption, { round = false } = {}) {
    return new Promise(resolve => {
      const wrap = document.createElement("div");
      wrap.className = "stamp-moment";
      wrap.setAttribute("role", "status");
      const seal = sealCanvas(gallery.nameZh, 160, { round });
      const label = document.createElement("p");
      label.textContent = caption;
      wrap.append(seal, label);
      document.getElementById("app").append(wrap);
      setTimeout(() => Sound.play("stamp"), reduceMotion ? 0 : 260);
      announce(caption);
      const done = () => { wrap.remove(); resolve(); };
      wrap.addEventListener("click", done);
      setTimeout(done, reduceMotion ? 900 : 1700);
    });
  }

  // ---- full-screen viewer for the real photograph (viewer.js) ----

  function openViewer(id, piece, gallery) {
    const opened = Viewer.open(id, piece, gallery, {
      onClose: returnFocus => {
        sync();
        const choice = talk && talk.choosing && el.choices.querySelector(".choice");
        if (choice) choice.focus({ preventScroll: true });
        else if (returnFocus && returnFocus.isConnected && returnFocus !== document.body) returnFocus.focus({ preventScroll: true });
      }
    });
    sync();
    return opened;
  }

  function toast(text) {
    el.toast.textContent = text;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2600);
  }

  function setWhere(main, sub = "") {
    el.whereMain.textContent = main;
    el.whereSub.textContent = sub;
  }
  function setGo(visible) { el.go.hidden = !visible; }

  // A new area's name slides in at the top and fades away.
  let areaTimer = null;
  function areaBanner(small, big, sub) {
    const a = $("area");
    a.querySelector(".area-small").textContent = small;
    const b = a.querySelector(".area-big");
    b.textContent = big;
    b.lang = Text.isCJK(big) ? "zh-Hant" : "en";
    a.querySelector(".area-sub").textContent = sub;
    a.hidden = false;
    a.classList.remove("show");
    void a.offsetWidth;
    a.classList.add("show");
    clearTimeout(areaTimer);
    areaTimer = setTimeout(() => { a.classList.remove("show"); a.hidden = true; }, reduceMotion ? 1600 : 2900);
  }
  function announce(text) { el.sr.textContent = text; }

  // ---- the docent's portrait and the logo, both drawn as pixel art ----

  /*
    The docent's head and shoulders, four times larger. While they talk
    the mouth opens and closes with the text, and now and then they blink.
  */
  let portraitFrames = null, portraitState = "";
  function drawPortrait() {
    if (!portraitFrames) {
      const f = Art.characterFrames("docent").down;
      portraitFrames = { open: f[0], blink: f.blink };
    }
    const now = performance.now();
    const blink = (now / 1000) % 4.2 < 0.14;
    const mouth = talking() && Math.floor(now / 120) % 2 === 0;
    const state = `${mouth}-${blink}`;
    if (state === portraitState) return;
    portraitState = state;
    const ctx = el.portrait.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(blink ? portraitFrames.blink : portraitFrames.open, 0, 0, 16, 14, 0, 8, 64, 56);
    if (mouth) {
      ctx.fillStyle = "#7a2e3a";
      ctx.fillRect(28, 44, 8, 4);
      ctx.fillStyle = "#c2556a";
      ctx.fillRect(30, 46, 4, 2);
    }
  }

  function animatePortrait() {
    requestAnimationFrame(animatePortrait);
    if (talk && talk.portrait) drawPortrait();
  }

  // Our own 5x7 letters, only the ones the name needs.
  const GLYPHS = {
    P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"]
  };

  // Each letter pixel becomes a 2x2 block, with a cinnabar drop shadow
  // below, a lighter top edge, and a one-pixel ink outline around it all.
  function drawLogo() {
    const lines = ["PIXEL", "PALACE"];
    const U = 2, GAP = 1, LEAD = 4, PAD = 2;
    const wordW = word => (word.length * (5 + GAP) - GAP) * U;
    const W = Math.max(...lines.map(wordW)) + PAD * 2;
    const H = lines.length * 7 * U + (lines.length - 1) * LEAD + PAD * 2 + U;
    const glyph = new Set();
    lines.forEach((word, li) => {
      const x0 = PAD + Math.floor((W - PAD * 2 - wordW(word)) / 2);
      const y0 = PAD + li * (7 * U + LEAD);
      [...word].forEach((ch, ci) => {
        GLYPHS[ch].forEach((row, gy) => [...row].forEach((c, gx) => {
          if (c !== "#") return;
          for (let dy = 0; dy < U; dy++) for (let dx = 0; dx < U; dx++) {
            glyph.add(`${x0 + (ci * (5 + GAP) + gx) * U + dx},${y0 + gy * U + dy}`);
          }
        }));
      });
    });
    const has = (set, x, y) => set.has(`${x},${y}`);
    const shadow = new Set();
    for (const k of glyph) {
      const [x, y] = k.split(",").map(Number);
      if (!has(glyph, x, y + 1)) shadow.add(`${x},${y + 1}`);
    }
    const c = el.logo;
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    const dot = (x, y, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); };
    const solid = (x, y) => has(glyph, x, y) || has(shadow, x, y);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (solid(x, y)) continue;
        if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) dot(x, y, "#1f1a1c");
      }
    }
    for (const k of shadow) { const [x, y] = k.split(",").map(Number); dot(x, y, "#b5352b"); }
    for (const k of glyph) {
      const [x, y] = k.split(",").map(Number);
      dot(x, y, has(glyph, x, y - 1) ? "#d8b25a" : "#f1dd9e");
    }
  }

  // ---- panels ----

  function openPanel(heading, build, { onBack = null } = {}) {
    return new Promise(resolve => {
      if (panel) closePanel(null);
      el.panelTitle.textContent = heading;
      el.panelBody.innerHTML = "";
      el.panelBody.scrollTop = 0;
      panel = { resolve, onBack };
      build(el.panelBody, value => closePanel(value));
      el.panel.hidden = false;
      Sound.play("open");
      sync();
      const first = el.panelBody.querySelector("button, [role=switch]");
      (first || el.panelClose).focus({ preventScroll: true });
    });
  }

  function closePanel(value) {
    if (!panel) return;
    const { resolve } = panel;
    panel = null;
    el.panel.hidden = true;
    el.panelBody.innerHTML = "";
    Sound.play("close");
    sync();
    resolve(value);
  }

  function setPanelBack(fn) { if (panel) panel.onBack = fn; }
  function setPanelTitle(text) { if (panel) el.panelTitle.textContent = text; }

  // after a panel rebuilds its body, keep focus inside it
  function focusPanel() {
    if (!panel) return;
    const first = el.panelBody.querySelector("button:not([disabled]), [role=switch]");
    (first || el.panelClose).focus({ preventScroll: true });
  }

  function button(label, onClick, cls = "") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("click", () => { Sound.play("select"); onClick(); });
    return b;
  }

  // ---- title screen ----

  /*
    Resolves with "continue", "new" or "rooms". The language button
    switches in place and redraws the buttons.
  */
  function showTitle({ hasSave, seenCount, total, sound, onSound, onLang }) {
    return new Promise(resolve => {
      title = { resolve };
      const box = el.title.querySelector(".title-actions");
      const done = v => { title = null; el.title.hidden = true; sync(); resolve(v); };
      const draw = () => {
        box.innerHTML = "";
        if (hasSave) {
          box.append(button(L(`Continue (${seenCount}/${total} seen)`, `繼續（已看 ${seenCount}/${total}）`), () => done("continue"), "big"));
          box.append(button(L("New visit, from the entrance", "從入口重新開始"), () => done("new")));
        } else {
          box.append(button(L("Start the visit", "開始參觀"), () => done("new"), "big"));
        }
        box.append(button(L("At the museum? Look up a room", "已在博物館？查詢展間"), () => done("rooms"), "rooms-btn"));
        const row = document.createElement("div");
        row.className = "title-row";
        const s = button("", () => {}, "toggle");
        const paint = on => { s.textContent = L(`Sound: ${on ? "on" : "off"}`, `音效：${on ? "開" : "關"}`); s.setAttribute("aria-pressed", String(on)); };
        paint(sound);
        s.addEventListener("click", () => { sound = onSound(); paint(sound); });
        const lang = button(L("中文", "English"), () => { onLang(); draw(); box.querySelector(".lang-btn").focus({ preventScroll: true }); }, "toggle lang-btn");
        lang.lang = Lang.isZh() ? "en" : "zh-Hant";
        row.append(s, lang);
        box.append(row);
      };
      draw();
      el.title.hidden = false;
      sync();
      box.querySelector("button").focus({ preventScroll: true });
    });
  }

  // ---- the page's fixed text, in the current language ----

  const STATIC = [
    ["#screen", "aria-label", "The museum seen from above", "從上方看博物館"],
    [".hud-buttons", "aria-label", "Game", "遊戲"],
    ["#btn-ask", "aria-label", "Ask the docent", "問導覽員"],
    ["#btn-ask .icon-label", "text", "Ask", "詢問"],
    ["#btn-notebook", "aria-label", "Notebook", "筆記本"],
    ["#btn-notebook .icon-label", "text", "Notebook", "筆記本"],
    ["#btn-menu", "aria-label", "Menu", "選單"],
    ["#btn-menu .icon-label", "text", "Menu", "選單"],
    ["#btn-go .go-label", "text", "Auto-walk", "自動走"],
    ["#pad", "aria-label", "Walk", "走路"],
    ["#btn-b", "aria-label", "Back. Hold to run", "返回。按住可跑步"],
    ["#btn-b", "text", "Back", "返回"],
    ["#btn-a", "aria-label", "Talk or choose", "對話或選擇"],
    ["#btn-a", "text", "Talk", "對話"],
    ["#card", "aria-label", "About this piece", "這件文物"],
    ["#panel-close", "aria-label", "Close", "關閉"],
    ["#zoom-out", "aria-label", "Zoom out", "縮小"],
    ["#zoom-in", "aria-label", "Zoom in", "放大"],
    ["#viewer-close", "aria-label", "Close", "關閉"],
    [".viewer-hint", "text", "Pinch or scroll to zoom · drag to look around · double-tap to zoom in", "雙指或滾輪縮放 · 拖曳移動 · 點兩下放大"],
    [".title-sub", "text", "Walk the National Palace Museum's four permanent exhibitions with a junior docent who introduces every piece.", "跟著小小導覽員，走過故宮的四個常設展，認識每一件文物。"],
    [".title-note", "text", "An independent student project, not affiliated with the National Palace Museum. Photos: NPM Open Data (CC0 and CC BY 4.0). Works offline once loaded.",
      "學生獨立作品，與國立故宮博物院無隸屬關係。照片：故宮 Open Data（CC0 及 CC BY 4.0）。載入後可離線使用。"]
  ];

  function applyLang() {
    document.documentElement.lang = Lang.isZh() ? "zh-Hant" : "en";
    for (const [sel, attr, en, zh] of STATIC) {
      const node = document.querySelector(sel);
      if (!node) continue;
      if (attr === "text") node.textContent = L(en, zh);
      else node.setAttribute(attr, L(en, zh));
    }
  }

  root.UI = {
    init, isOpen, say, handle, setTextSpeed, showCard, hideCard, toast, setWhere, setGo, announce, applyLang, areaBanner,
    openViewer, zoomButton, sealCanvas, stampMoment,
    openPanel, closePanel, setPanelBack, setPanelTitle, focusPanel, button, showTitle
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
