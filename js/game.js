/*
  The running game: one shared state object (G), the frame loop, walking,
  warps, the docent's following and leading, visitors, taps and saving.
  Conversations and menus live in docent.js and run as async "flows";
  while one runs, G.busy is set and the player can't walk.
*/
(function (root) {
  const { T, WALK, RUN } = Actors;
  const SAVE_KEY = "pixel-palace-v1";
  const FADE = 0.32;
  const DUST_LIFE = 0.45;
  const HUM_AFTER = 9;
  const TURN_GRACE = 0.09;
  const SETTINGS = { sound: true, music: true, autoTalk: true, stepFree: false, textSpeed: "normal", lang: "en" };
  const TOUR_MODES = ["full", "short", "plan", "gallery"];
  const L = (en, zh) => Lang.L(en, zh);

  const G = root.PP = {
    world: null, map: null, renderer: null, mode: "title",
    player: null, docent: null, npcs: [], npcByMap: {},
    seen: new Set(), settings: { ...SETTINGS, lang: Lang.preferred(navigator) },
    tour: { active: false, mode: "full", gallery: null, visited: new Set() },
    plan: new Set(), stamps: new Set(), spotted: new Set(), challengeOffered: new Set(), sealsShown: new Set(),
    // "with" the docent following you, or exploring "alone"
    companion: "with",
    lead: null, trail: [], autoPath: null, afterAuto: null, followTo: null,
    busy: 0, fade: 0, fadeJob: null, bubbles: [], time: 0, lastBump: 0, leadClock: 0,
    introducedGalleries: new Set(), talkedCases: new Set(),
    // feel: the spotlight on a presented piece, dust underfoot, the camera
    // leaning the way you walk, and when the docent last hummed
    focus: { x: 0, y: 0, amount: 0, target: 0 }, particles: [], look: { x: 0, y: 0 }, idleSince: 0
  };

  // ---- setup ----

  function boot() {
    G.world = World.buildWorld(Maps.MAP_DEFS);
    const canvas = document.getElementById("screen");
    G.renderer = Renderer.create(canvas, {
      world: G.world, galleries: TourData.GALLERIES, stars: TourData.GALLERIES.map(g => g.star)
    });
    UI.init();
    Input.init({
      onUi: action => UI.handle(action),
      onTap: (cx, cy) => tapAt(G.renderer.screenToTile(cx, cy)),
      onActivity: () => Sound.unlock()
    });
    Input.bindCanvas(canvas);
    Input.bindPad(document.getElementById("pad"));
    Input.bindButton(document.getElementById("btn-a"), "a");
    Input.bindButton(document.getElementById("btn-b"), "b", { holdRun: true });
    for (const [id, action] of [["btn-ask", "ask"], ["btn-notebook", "notebook"], ["btn-menu", "menu"], ["btn-go", "go"]]) {
      const b = document.getElementById(id);
      b.addEventListener("click", () => { b.blur(); Sound.unlock(); Input.press(action); });
    }
    loadSave();
    Lang.set(G.settings.lang);
    UI.applyLang();
    applySettings();
    registerOffline();
    const resize = () => G.renderer.resize(touchControlsHeight());
    window.addEventListener("resize", resize);
    resize();
    document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
    enterMap("1F", 12, 9, "down");
    G.docent.hidden = true;
    G.player.hidden = true;
    requestAnimationFrame(loop);
    toTitle();
  }

  // Cache the whole game for offline play (served over http only; a file://
  // page can't register a service worker, and still plays fine online).
  function registerOffline() {
    if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
    navigator.serviceWorker.register("sw.js").catch(e => console.info("Offline mode unavailable:", e.message));
  }

  // Keep the browser's install prompt for the menu's "Install as an app".
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); G.installPrompt = e; });
  window.addEventListener("appinstalled", () => { G.installPrompt = null; UI.toast(L("Installed. Open Pixel Palace from your home screen.", "已安裝。從主畫面打開 Pixel Palace。")); });

  function touchControlsHeight() {
    const t = document.getElementById("touch");
    return t && getComputedStyle(t).display !== "none" ? t.offsetHeight : 0;
  }

  async function toTitle() {
    G.mode = "title";
    G.lead = null;
    G.trail = [];
    UI.setGo(false);
    // behind the ticket, the camera drifts through the bronze gallery
    enterMap("bronze", 16, 26, "up");
    if (G.player) G.player.hidden = true;
    if (G.docent) G.docent.hidden = true;
    Sound.setTune(null);
    Sound.setRoom(null);
    document.body.classList.add("on-title");
    let choice;
    for (;;) {
      choice = await UI.showTitle({
        hasSave: !!G.savedPos, seenCount: G.seen.size, total: TourData.fullTour().length,
        sound: G.settings.sound, onSound: () => { setSetting("sound", !G.settings.sound); return G.settings.sound; },
        onLang: () => setLang(Lang.isZh() ? "en" : "zh")
      });
      if (choice !== "rooms") break;
      // the room lookup works straight from the title, for visitors in the museum
      await Panels.rooms(G, { fromTitle: true });
    }
    document.body.classList.remove("on-title");
    G.mode = "play";
    Sound.unlock();
    if (choice === "continue" && G.savedPos) {
      const p = G.savedPos;
      enterMap(p.map, p.x, p.y, p.dir);
      announceArea();
      run(() => Docent.welcomeBack(G));
    } else {
      // a new visit starts without the last visit's tour, with the docent
      G.tour = { active: false, mode: "full", gallery: null, visited: new Set() };
      G.companion = "with";
      const s = G.world.maps["1F"].spawn;
      enterMap("1F", s.x, s.y, s.dir);
      announceArea();
      run(() => Docent.intro(G));
    }
  }

  // ---- maps ----

  function enterMap(id, x, y, dir) {
    const map = G.world.maps[id];
    G.map = map;
    G.player = G.player || Actors.makeActor({ id: "player", look: "player", x, y, dir });
    G.docent = G.docent || Actors.makeActor({ id: "docent", look: "docent", x, y, dir });
    Actors.place(G.player, x, y, dir);
    G.player.hidden = G.mode === "title";
    G.docent.hidden = G.mode === "title" || G.companion === "alone";
    G.docent.alpha = 1;
    placeBehind(G.docent, G.player);
    if (!G.npcByMap[id]) G.npcByMap[id] = map.npcs.map(n => Actors.makeActor(n));
    G.npcs = G.npcByMap[id];
    G.autoPath = null;
    G.followTo = null;
    G.trail = [];
    G.particles = [];
    G.look = { x: 0, y: 0 };
    updateWhere();
    if (G.mode === "play") {
      Sound.setTune(map.kind === "gallery" ? map.gallery : "lobby");
      Sound.setRoom(map.kind);
    }
    save();
  }

  // The area's name slides in at the top, the way a game marks a new place.
  function announceArea() {
    const m = G.map;
    if (m.kind === "gallery") {
      const g = galleryInfo(m.gallery);
      UI.areaBanner(`${m.floor}F · ${Text.roomList(g.rooms)}`, g.nameZh, L(g.title, g.zh.name));
      UI.announce(`${m.floor}F, ${L(g.title, g.zh.title)}`);
    } else {
      UI.areaBanner(`${m.floor}F`, L("Lobby", "大廳"), TourData.GALLERIES.filter(g => g.floor === m.floor).map(g => TourData.galleryTitle(g)).join(" · "));
      UI.announce(`${m.floor}F, ${L("Lobby", "大廳")}`);
    }
    Sound.play("area");
  }

  const SIDES = { up: ["left", "right"], down: ["right", "left"], left: ["down", "up"], right: ["up", "down"] };

  function placeBehind(d, p) {
    const order = [World.OPPOSITE[p.dir], ...SIDES[p.dir], p.dir].map(k => Actors.DIRS[k]);
    for (const [dx, dy] of order) {
      const x = p.x + dx, y = p.y + dy;
      if (standable(x, y) && !npcAt(x, y)) { Actors.place(d, x, y, p.dir); return; }
    }
    Actors.place(d, p.x, p.y, p.dir);
  }

  const standable = (x, y) => !World.isSolid(G.map, x, y) && !World.isWarp(G.map, x, y) && !World.isStair(G.map, x, y);
  const npcAt = (x, y) => G.npcs.find(n => n.x === x && n.y === y) || null;
  const docentAt = (x, y) => (G.docent && !G.docent.hidden && G.docent.x === x && G.docent.y === y);

  function updateWhere() {
    const m = G.map;
    if (m.kind === "lobby") {
      const here = TourData.GALLERIES.filter(g => g.floor === m.floor).map(g => `${TourData.galleryShort(g)} ${g.rooms.join("/")}`);
      UI.setWhere(`${m.floor}F · ${L("Lobby", "大廳")}`, here.join(" · "));
      return;
    }
    const g = galleryInfo(m.gallery);
    const seenHere = g.tour.filter(id => G.seen.has(id)).length;
    const room = G.player ? World.roomAt(m, G.player.x, G.player.y) : null;
    UI.setWhere(`${m.floor}F · ${room ? Text.roomName(room) : Text.roomList(g.rooms)}`,
      L(`${g.title} · ${seenHere}/${g.tour.length} seen`, `${g.zh.title} · 已看 ${seenHere}/${g.tour.length}`));
  }

  const galleryInfo = id => TourData.GALLERIES.find(g => g.id === id);

  // fade to black, run `mid` (usually a map change), fade back in
  function fadeThrough(mid) {
    return new Promise(resolve => {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      G.fadeJob = { t: 0, phase: "out", mid, resolve, dur: reduce ? 0.001 : FADE };
    });
  }

  async function warpTo(dest, sound) {
    Sound.play(sound);
    G.busy++;
    try {
      await fadeThrough(() => enterMap(dest.map, dest.x, dest.y, dest.dir));
      announceArea();
      await Docent.afterArrive(G);
    } finally {
      G.busy--;
      Input.flush();
    }
    refreshLead();
  }

  // ---- flows ----

  // Runs one conversation or menu at a time; the player waits meanwhile.
  async function run(flow) {
    if (G.busy) return;
    G.busy++;
    G.autoPath = null;
    Input.flush();
    try {
      await flow();
    } catch (e) {
      console.error(e);
    } finally {
      G.busy--;
      Input.flush();
      UI.hideCard();
      G.focus.target = 0;
      G.idleSince = G.time;
      updateWhere();
    }
  }

  // Dim the room around a case while the docent talks about it.
  function spotlight(c) {
    G.focus.x = (c.x + 1) * T;
    G.focus.y = (c.y + 1) * T - 4;
    G.focus.target = 1;
  }

  // ---- the frame loop ----

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // how much of the screen the card (top) and the text box or touch pad
  // (bottom) cover, so the camera can keep the player clear of them
  function screenInsets() {
    const talk = document.getElementById("dialog");
    const card = document.getElementById("card");
    let top = 0;
    if (!card.hidden) {
      // on wide screens the card sits to one side and covers nothing central
      const r = card.getBoundingClientRect();
      if (r.left < window.innerWidth / 2 && r.right > window.innerWidth / 2) top = r.bottom + 6;
    }
    const bottom = talk.hidden ? touchControlsHeight() : window.innerHeight - talk.getBoundingClientRect().top + 6;
    return [top, bottom];
  }

  let last = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0);
    last = ts;
    try {
      step(dt);
    } catch (e) {
      console.error(e);
    }
  }

  function step(dt) {
    update(dt);
    G.renderer.setInsets(...screenInsets());
    G.renderer.frame({
      dt, snap: !!reduceMotion,
      map: G.map, player: G.player, docent: G.docent, npcs: G.npcs, trail: G.trail,
      seen: G.seen, time: G.time, bubbles: currentBubbles(), fade: G.fade,
      focus: G.focus, particles: G.particles, look: G.look, camFocus: G.mode === "title" ? titleCamera() : null
    });
  }

  // a slow drift across the gallery behind the title screen
  function titleCamera() {
    const m = G.map, t = reduceMotion ? 0 : G.time;
    return {
      x: (m.w * T) / 2 + Math.sin(t * 0.06) * ((m.w * T) / 2 - 140),
      y: (m.h * T) * 0.45 + Math.cos(t * 0.045) * 70
    };
  }

  function feel(dt) {
    // the spotlight eases in and out
    const f = G.focus;
    f.amount += (f.target - f.amount) * Math.min(1, dt * (reduceMotion ? 60 : 5));
    // the camera leans a little ahead of a walking player
    const p = G.player;
    const want = p && p.moving && !reduceMotion ? Actors.DIRS[p.dir].map(v => v * 14) : [0, 0];
    G.look.x += (want[0] - G.look.x) * Math.min(1, dt * 2.5);
    G.look.y += (want[1] - G.look.y) * Math.min(1, dt * 2.5);
    // dust drifts up and fades
    for (const d of G.particles) { d.age += dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    G.particles = G.particles.filter(d => d.age < d.life);
  }

  function update(dt) {
    G.time += dt;
    feel(dt);
    if (G.fadeJob) {
      const f = G.fadeJob;
      f.t += dt;
      if (f.phase === "out") {
        G.fade = Math.min(1, f.t / f.dur);
        if (f.t >= f.dur) { f.mid(); f.phase = "in"; f.t = 0; }
      } else {
        G.fade = Math.max(0, 1 - f.t / f.dur);
        if (f.t >= f.dur) { G.fade = 0; G.fadeJob = null; f.resolve(); }
      }
      return;
    }
    if (Actors.update(G.player, dt)) onPlayerArrive();
    Actors.update(G.docent, dt);
    npcsThink(dt);
    if (G.mode !== "play") return;
    if (!G.busy && !UI.isOpen()) playerControl();
    docentThink();
    G.leadClock += dt;
    if (G.lead && G.leadClock > 0.6 && !G.player.moving) refreshLead();
  }

  function playerControl() {
    if (G.player.moving) return;
    if (Input.consume("ask")) return run(() => Docent.ask(G));
    if (Input.consume("notebook")) return run(() => Panels.notebook(G));
    if (Input.consume("menu")) return run(() => Panels.menu(G));
    if (Input.consume("rooms")) return run(() => Panels.rooms(G));
    if (Input.consume("go") && G.lead) {
      G.lead.auto = !G.lead.auto;
      UI.toast(G.lead.auto ? L("Auto-walk on", "自動走：開") : L("Auto-walk off", "自動走：關"));
    }
    if (G.player.moving) return;
    const dir = Input.dir();
    if (dir || G.player.moving) G.idleSince = G.time;
    if (dir) {
      G.autoPath = null;
      if (G.lead) G.lead.auto = false;
      if (G.player.dir !== dir && Input.heldFor(dir) < TURN_GRACE) { G.player.dir = dir; return; }
      tryMove(dir, Input.running());
      return;
    }
    if (Input.consume("a")) return interact();
    Input.consume("b");
    if (G.autoPath && G.autoPath.length) return stepAuto();
    if (G.autoPath && !G.autoPath.length) {
      G.autoPath = null;
      const then = G.afterAuto;
      G.afterAuto = null;
      if (then) then();
      return;
    }
    if (G.lead && G.lead.auto && G.trail.length) {
      const next = G.trail[0];
      if (!npcAt(next.x, next.y)) tryMove(Actors.dirTo(G.player, next), true);
    }
  }

  function tryMove(dir, running) {
    const p = G.player;
    p.dir = dir;
    const f = World.facing(p.x, p.y, dir);
    const t = World.tileAt(G.map, f.x, f.y);
    if (World.isSolid(G.map, f.x, f.y) || npcAt(f.x, f.y)) {
      if (t === "m" && G.map.kind === "lobby") return run(() => Docent.leavePrompt(G));
      if (t === "E") return run(() => Docent.elevator(G));
      if (G.time - G.lastBump > 0.35) { Sound.play("bump"); G.lastBump = G.time; }
      return;
    }
    const from = { x: p.x, y: p.y };
    Actors.startStep(p, dir, running ? RUN : WALK);
    footstep(from, running);
    G.followTo = from;
    if (G.lead) refreshLead();
    docentThink();
  }

  // the sound of the floor underfoot, and a puff of dust when running
  function footstep(from, running) {
    const t = World.tileAt(G.map, from.x, from.y);
    const surface = G.map.kind === "gallery" ? (t === "," ? "marble" : "wood") : ("=,uv".includes(t) ? "carpet" : "marble");
    Sound.play("step-" + surface);
    if (!running || reduceMotion) return;
    for (let i = 0; i < 3; i++) {
      G.particles.push({
        x: from.x * T + 8 + (Math.random() - 0.5) * 8, y: from.y * T + 14,
        vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 8,
        age: 0, life: DUST_LIFE, size: 2, color: G.map.kind === "gallery" ? "200,170,130" : "236,226,206"
      });
    }
  }

  function stepAuto() {
    const next = G.autoPath[0];
    if (npcAt(next.x, next.y)) {
      // someone stepped in the way: go around them once before giving up
      const goal = G.autoPath[G.autoPath.length - 1];
      const around = World.findPath(G.map, G.player, [goal], { blocked: blockedByNpc });
      if (around && around.length) { G.autoPath = around; return; }
      G.autoPath = null;
      G.afterAuto = null;
      return;
    }
    G.autoPath.shift();
    tryMove(Actors.dirTo(G.player, next), G.autoPath.length > 5);
  }

  function onPlayerArrive() {
    const p = G.player;
    if (G.map.kind === "gallery" && World.roomAt(G.map, p.x, p.y) !== World.roomAt(G.map, p.fromX, p.fromY)) updateWhere();
    const warp = World.warpFrom(G.world, G.map, p.x, p.y);
    if (warp) {
      G.autoPath = null;
      return warpTo(warp, warp.kind === "up" || warp.kind === "down" ? "stairs" : "door");
    }
    if (G.lead) {
      refreshLead();
      return;
    }
    if (G.autoPath || G.busy || !G.settings.autoTalk || G.map.kind !== "gallery") return;
    const c = World.caseNextTo(G.map, p.x, p.y, p.dir);
    if (c && !G.seen.has(c.id) && !G.talkedCases.has(c.id) && !Input.dir()) {
      run(() => Docent.present(G, c.id, { faceCase: c }));
    }
  }

  // ---- leading ----

  const blockedByNpc = (x, y) => !!npcAt(x, y);

  function refreshLead() {
    const lead = G.lead;
    G.leadClock = 0;
    if (!lead) { G.trail = []; UI.setGo(false); return; }
    UI.setGo(true);
    const p = G.player;
    const from = { map: G.map.id, x: p.x, y: p.y };
    const opts = { stepFree: G.settings.stepFree };
    const r = World.planRoute(G.world, from, lead.target, { ...opts, blocked: blockedByNpc }) || World.planRoute(G.world, from, lead.target, opts);
    if (!r) { G.trail = []; return; }
    if (r.done) {
      if (p.moving || G.busy) return;
      G.trail = [];
      const arrived = G.lead;
      G.lead = null;
      UI.setGo(false);
      run(() => Docent.arrived(G, arrived));
      return;
    }
    G.trail = r.path;
    if (r.edge && r.edge.via === "elevator" && r.path.length === 0 && !p.moving && !G.busy) {
      const floor = G.world.maps[r.edge.to].floor;
      rideElevator(floor);
    }
  }

  function startLead(target, label) {
    G.lead = { target, label, auto: false };
    G.autoPath = null;
    refreshLead();
  }

  function stopLead() {
    G.lead = null;
    G.trail = [];
    UI.setGo(false);
  }

  async function rideElevator(floor) {
    if (G.map.floor === floor) return;
    Sound.play("ding");
    G.busy++;
    try {
      const shaft = World.elevatorIndex(G.map, G.player.x, G.player.y);
      const dest = World.elevatorArrival(G.world, floor, shaft);
      await fadeThrough(() => enterMap(dest.map, dest.x, dest.y, dest.dir));
      announceArea();
      await Docent.afterArrive(G);
    } finally {
      G.busy--;
    }
    refreshLead();
  }

  // ---- the docent's feet ----

  function docentGoal() {
    const p = G.player, d = G.docent;
    if (G.lead && G.trail.length >= 2) return G.trail[Math.min(2, G.trail.length - 2)];
    if (G.lead) return null;
    if (G.followTo && !(G.followTo.x === p.x && G.followTo.y === p.y)) return G.followTo;
    if (!p.moving && Actors.isNeighbour(d, p)) return null;
    return G.followTo;
  }

  function docentThink() {
    const d = G.docent, p = G.player;
    // exploring alone, the docent's comings and goings are scripted
    if (!d || d.hidden || d.moving || G.fadeJob || G.companion === "alone") return;
    const goal = docentGoal();
    if (!goal) {
      if (!p.moving && G.lead === null && Actors.isNeighbour(d, p) && !G.busy) d.dir = Actors.dirTo(d, p);
      if (!G.busy && G.mode === "play" && G.time - G.idleSince > HUM_AFTER) {
        G.idleSince = G.time;
        bubble(d, "note", 1.4);
      }
      return;
    }
    if (d.x === goal.x && d.y === goal.y) return;
    const path = World.findPath(G.map, d, [goal], {
      stairs: true,
      blocked: (x, y) => (x === p.x && y === p.y) || !!npcAt(x, y)
    });
    if (!path || !path.length) return;
    const next = path[0];
    if (World.isWarp(G.map, next.x, next.y) || (next.x === p.x && next.y === p.y)) return;
    const far = Math.abs(d.x - p.x) + Math.abs(d.y - p.y) > 3;
    Actors.startStep(d, Actors.dirTo(d, next), far ? RUN : (p.moving ? p.speed : WALK));
  }

  // ---- visitors ----

  function npcsThink(dt) {
    for (const n of G.npcs) {
      Actors.update(n, dt);
      if (!n.wander || n.moving || n.talking) continue;
      n.idle -= dt;
      if (n.idle > 0) continue;
      n.idle = 1.6 + Math.random() * 3;
      const dirs = Object.keys(Actors.DIRS);
      const dir = dirs[Math.floor(Math.random() * 4)];
      // beside a case, a visitor stops to look at it for a while
      const caseDir = dirs.find(d => { const f = World.facing(n.x, n.y, d); return World.caseAt(G.map, f.x, f.y); });
      if (caseDir && Math.random() < 0.6) { n.dir = caseDir; n.idle += 2.5; continue; }
      if (Math.random() < 0.4) { n.dir = dir; continue; }
      const f = World.facing(n.x, n.y, dir);
      const [x0, y0, x1, y1] = n.wander;
      const inBox = f.x >= x0 && f.x <= x1 && f.y >= y0 && f.y <= y1;
      const onRoute = list => (list || []).some(t => t.x === f.x && t.y === f.y);
      const taken = (f.x === G.player.x && f.y === G.player.y) || docentAt(f.x, f.y) || npcAt(f.x, f.y) ||
        onRoute(G.trail) || onRoute(G.autoPath);
      if (inBox && standable(f.x, f.y) && !taken) Actors.startStep(n, dir, WALK * 0.6);
      else n.dir = dir;
    }
  }

  // ---- A button and taps ----

  function interact() {
    const p = G.player;
    const f = World.facing(p.x, p.y, p.dir);
    const t = World.tileAt(G.map, f.x, f.y);
    if (docentAt(f.x, f.y)) return run(() => Docent.ask(G));
    let npc = npcAt(f.x, f.y);
    if (!npc && t === "I") {
      const beyond = World.facing(f.x, f.y, p.dir);
      npc = npcAt(beyond.x, beyond.y);
    }
    if (npc) return run(() => Docent.npcTalk(G, npc));
    const c = World.caseAt(G.map, f.x, f.y);
    if (c) return run(() => Docent.present(G, c.id, { faceCase: c }));
    if (t === "s") return run(() => Docent.directory(G));
    if (t === "r") return run(() => Docent.ropeSign(G, f));
    if (t === "E") return run(() => Docent.elevator(G));
    if (t === "T") return run(() => Docent.wallText(G));
    if (t === "m" && G.map.kind === "lobby") return run(() => Docent.leavePrompt(G));
    if (t === "b") return run(() => UI.say([L("You sit for a moment. Your feet thank you.", "你坐下來休息一下，腳終於鬆了口氣。")]));
  }

  function tapAt(tile) {
    if (G.mode !== "play" || G.busy || UI.isOpen() || G.fadeJob) return;
    const map = G.map, p = G.player;
    const t = World.tileAt(map, tile.x, tile.y);
    const around = (x, y) => Object.values(Actors.DIRS).map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
    let goals = null, then = null, stairs = false;
    const c = World.caseAt(map, tile.x, tile.y);
    const npc = npcAt(tile.x, tile.y);
    if (docentAt(tile.x, tile.y)) return run(() => Docent.ask(G));
    if (c) {
      const a = World.approachTiles(map, c);
      goals = a.front.length ? a.front : a.rest;
      then = () => { p.dir = World.dirToward(p, c); interact(); };
    } else if (npc) {
      goals = around(npc.x, npc.y);
      then = () => { p.dir = Actors.dirTo(p, npc); interact(); };
    } else if ("srETIbm".includes(t) && !(t === "m" && map.kind === "gallery")) {
      goals = around(tile.x, tile.y);
      then = () => { p.dir = Actors.dirTo(p, tile); interact(); };
    } else if (!World.isSolid(map, tile.x, tile.y)) {
      goals = [tile];
      stairs = World.isStair(map, tile.x, tile.y);
    }
    if (!goals) return;
    const path = World.findPath(map, p, goals, { stairs, blocked: blockedByNpc });
    if (!path) return;
    if (G.lead) G.lead.auto = false;
    G.autoPath = path;
    G.afterAuto = then;
  }

  // ---- bubbles over heads ----

  function currentBubbles() {
    const out = [];
    G.bubbles = G.bubbles.filter(b => b.until > G.time);
    for (const b of G.bubbles) {
      const a = b.actor;
      // if someone stands right in front of the speaker, put the bubble to the side
      const blocked = a !== G.player && G.player.x === a.x && G.player.y === a.y - 1;
      out.push({ kind: b.kind, x: a.px + (blocked ? 18 : 8), y: a.py + (blocked ? 4 : -4) });
    }
    if (G.mode === "play" && !G.busy && !G.player.moving && !UI.isOpen()) {
      const p = G.player;
      const f = World.facing(p.x, p.y, p.dir);
      const c = World.caseAt(G.map, f.x, f.y);
      if (c) out.push({ kind: "talk", x: c.x * T + 16, y: c.y * T - 12 });
      const n = npcAt(f.x, f.y);
      if (n) out.push({ kind: "talk", x: n.px + 8, y: n.py - 4 });
    }
    return out;
  }

  // the player's x on screen, in CSS pixels
  function playerScreenX() {
    const v = G.renderer.view;
    return ((G.player.px + 8 - G.renderer.cam.x) * v.scale) / v.dpr;
  }

  function bubble(actor, kind, secs = 0.8) {
    G.bubbles.push({ actor, kind, until: G.time + secs });
  }

  // ---- progress, settings, saving ----

  function markSeen(id, { quiet = false } = {}) {
    if (G.seen.has(id)) return false;
    G.seen.add(id);
    Sound.play("seen");
    if (!quiet) UI.toast(L("Notebook: ", "筆記本：") + `${TourData.pieceName(TourData.PIECES[id])} · ${G.seen.size}/${TourData.fullTour().length}`);
    updateWhere();
    save();
    return true;
  }

  // Pieces the visitor wants to see on the real visit. Returns the new state.
  function togglePlan(id) {
    if (G.plan.has(id)) G.plan.delete(id);
    else G.plan.add(id);
    save();
    return G.plan.has(id);
  }

  // Found in the real museum (ticked in the room lookup or a piece's page).
  // Says whether this tick completed the gallery's in-person seal.
  function toggleSpotted(id) {
    const g = TourData.galleryOf(id);
    const count = () => g.tour.filter(x => G.spotted.has(x)).length;
    const before = count();
    if (G.spotted.has(id)) G.spotted.delete(id);
    else G.spotted.add(id);
    save();
    const after = count();
    // the moment plays once, even if a box is unticked and ticked again
    const sealEarned = before < TourData.SPOT_SEAL && after >= TourData.SPOT_SEAL && !G.sealsShown.has(g.id);
    if (sealEarned) G.sealsShown.add(g.id);
    return { on: G.spotted.has(id), sealEarned };
  }

  function earnStamp(galleryId) {
    G.stamps.add(galleryId);
    Sound.play("seen");
    save();
  }

  function setSetting(key, value) {
    G.settings[key] = value;
    applySettings();
    save();
    if (key === "stepFree" && G.lead) refreshLead();
  }

  function setLang(lang) {
    setSetting("lang", lang);
    Lang.set(lang);
    UI.applyLang();
    if (G.renderer) G.renderer.relabel();
    if (G.map) updateWhere();
  }

  function applySettings() {
    Sound.setSfx(G.settings.sound);
    Sound.setMusic(G.settings.sound && G.settings.music);
    UI.setTextSpeed(G.settings.textSpeed);
  }

  // On the title screen only settings and progress change; the saved
  // position stays where the last visit left off.
  function save() {
    const p = G.player;
    const playing = G.map && G.mode === "play" && p;
    const pos = playing ? { map: G.map.id, x: p.moving ? p.fromX : p.x, y: p.moving ? p.fromY : p.y, dir: p.dir } : G.savedPos || null;
    const data = {
      v: 1, seen: [...G.seen], settings: G.settings, pos, plan: [...G.plan], stamps: [...G.stamps], spotted: [...G.spotted], companion: G.companion,
      tour: { active: G.tour.active, mode: G.tour.mode, gallery: G.tour.gallery, visited: [...G.tour.visited] }
    };
    if (playing) G.savedPos = pos;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* private mode: progress lasts this visit only */ }
  }

  const SPEED_NAMES = ["slow", "normal", "fast", "instant"];

  // Anything odd in storage is ignored rather than trusted: a bad save
  // must never stop the game from starting.
  function loadSave() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (e) { data = null; }
    if (!data || typeof data !== "object") return;
    try {
      const known = new Set(TourData.fullTour().map(s => s[1]));
      if (Array.isArray(data.seen)) G.seen = new Set(data.seen.filter(id => typeof id === "string" && known.has(id)));
      if (data.settings && typeof data.settings === "object") {
        for (const k of Object.keys(SETTINGS)) {
          if (Object.hasOwn(data.settings, k) && typeof data.settings[k] === typeof SETTINGS[k]) G.settings[k] = data.settings[k];
        }
        if (!SPEED_NAMES.includes(G.settings.textSpeed)) G.settings.textSpeed = SETTINGS.textSpeed;
        if (!Lang.LANGS.includes(G.settings.lang)) G.settings.lang = Lang.preferred(navigator);
      }
      const ids = list => (Array.isArray(list) ? list.filter(id => typeof id === "string" && known.has(id)) : []);
      const galleries = new Set(TourData.GALLERIES.map(g => g.id));
      if (data.tour && typeof data.tour === "object") {
        G.tour.active = data.tour.active === true;
        G.tour.mode = TOUR_MODES.includes(data.tour.mode) ? data.tour.mode : "full";
        G.tour.gallery = typeof data.tour.gallery === "string" && galleries.has(data.tour.gallery) ? data.tour.gallery : null;
        if (G.tour.mode === "gallery" && !G.tour.gallery) { G.tour.mode = "full"; G.tour.active = false; }
        G.tour.visited = new Set(ids(data.tour.visited));
      }
      G.plan = new Set(ids(data.plan));
      G.spotted = new Set(ids(data.spotted));
      G.companion = data.companion === "alone" ? "alone" : "with";
      if (Array.isArray(data.stamps)) G.stamps = new Set(data.stamps.filter(id => typeof id === "string" && galleries.has(id)));
      const pos = data.pos;
      if (!pos || typeof pos !== "object" || typeof pos.map !== "string" || !Object.hasOwn(G.world.maps, pos.map)) return;
      const map = G.world.maps[pos.map];
      if (!Number.isInteger(pos.x) || !Number.isInteger(pos.y) || typeof pos.dir !== "string" || !Object.hasOwn(Actors.DIRS, pos.dir)) return;
      if (pos.x < 0 || pos.y < 0 || pos.x >= map.w || pos.y >= map.h) return;
      const ok = (x, y) => !World.isSolid(map, x, y) && !World.isWarp(map, x, y);
      if (ok(pos.x, pos.y)) {
        G.savedPos = { map: pos.map, x: pos.x, y: pos.y, dir: pos.dir };
        return;
      }
      // a spot that has since become solid (a new rope, say): the nearest
      // open floor within a couple of steps still counts
      const near = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0], [-2, 0], [0, -2]]
        .map(([dx, dy]) => ({ x: pos.x + dx, y: pos.y + dy })).find(p => ok(p.x, p.y) && World.tileAt(map, p.x, p.y) !== "#");
      if (near && map.kind === "gallery") G.savedPos = { map: pos.map, x: near.x, y: near.y, dir: pos.dir };
    } catch (e) {
      console.warn("Ignoring an unreadable save", e);
    }
  }

  function resetProgress() {
    G.seen = new Set();
    G.plan = new Set();
    G.stamps = new Set();
    G.spotted = new Set();
    G.tour = { active: false, mode: "full", gallery: null, visited: new Set() };
    G.talkedCases.clear();
    G.challengeOffered.clear();
    G.sealsShown.clear();
    updateWhere();
    save();
  }

  Object.assign(G, {
    run, startLead, stopLead, rideElevator, markSeen, setSetting, setLang, resetProgress, toTitle, togglePlan, toggleSpotted, earnStamp,
    bubble, playerScreenX, updateWhere, galleryInfo, save, refreshLead, standable, npcAt, spotlight
  });

  window.addEventListener("DOMContentLoaded", boot);
})(typeof globalThis !== "undefined" ? globalThis : this);
