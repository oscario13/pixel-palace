/*
  What the docent says. Every export is an async "flow" run by G.run(), so
  the player waits while it plays out. The panels (notebook, plan, room
  lookup and the rest) are in panels.js.
*/
(function (root) {
  const L = (en, zh) => Lang.L(en, zh);
  const piece = id => TourData.PIECES[id];
  const nameOf = id => TourData.pieceName(piece(id));
  const TOTAL = () => TourData.fullTour().length;

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const until = test => new Promise(resolve => {
    const check = () => (test() ? resolve() : requestAnimationFrame(check));
    check();
  });

  const talkDocent = (pages, opts) => talk(pages, opts);
  function talk(pages, opts = {}) {
    return UI.say(pages, { speaker: L("Docent", "導覽員"), portrait: true, onChar: () => Sound.voice("docent"), ...opts });
  }

  // a long blurb as dialogue pages
  const pagesOf = text => Text.paginate(text);

  /*
    Exploring alone, nobody follows you: each case's label speaks for
    itself, the floor guide gives directions, and the stamp station runs
    the challenge. Otherwise it's all the docent.
  */
  const alone = G => G.companion === "alone";
  const label = (pages, opts = {}) => UI.say(pages, { speaker: L("Label", "說明牌"), ...opts });
  const sign = (pages, opts = {}) => UI.say(pages, { speaker: L("Floor guide", "樓層指引"), ...opts });
  const station = (pages, opts = {}) => UI.say(pages, { speaker: L("Stamp station", "集章站"), ...opts });
  const guide = G => (alone(G) ? sign : talk);
  const followLine = G => (alone(G) ? L("Follow the gold trail.", "跟著金色的路線走。") : L("Follow me!", "跟我來！"));

  // eases someone's opacity, for the docent arriving or leaving
  function fade(a, from, to, ms) {
    return new Promise(resolve => {
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / ms);
        a.alpha = from + (to - from) * k;
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  // an open tile about n steps from `from`, as far from the player as it can
  function awayTile(G, from, n) {
    const p = G.player, seen = new Set([from.x + "," + from.y]);
    const queue = [{ x: from.x, y: from.y, d: 0 }];
    let best = null;
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i];
      if (c.d >= n) continue;
      for (const [dx, dy] of Object.values(Actors.DIRS)) {
        const x = c.x + dx, y = c.y + dy, k = x + "," + y;
        if (seen.has(k) || !G.standable(x, y) || G.npcAt(x, y) || (x === p.x && y === p.y)) continue;
        seen.add(k);
        const node = { x, y, d: c.d + 1 };
        queue.push(node);
        const score = node.d * 2 + Math.abs(x - p.x) + Math.abs(y - p.y);
        if (!best || score > best.score) best = { x, y, score };
      }
    }
    return best;
  }

  async function walkPath(a, path, max) {
    for (const t of (path || []).slice(0, max)) {
      Actors.startStep(a, Actors.dirTo(a, t), Actors.WALK);
      await until(() => !a.moving);
    }
  }

  function faceEachOther(G) {
    const d = G.docent, p = G.player;
    if (Actors.isNeighbour(d, p)) d.dir = Actors.dirTo(d, p);
  }

  const touch = () => window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  function controlsHint() {
    return touch()
      ? L("Use the pad to walk, or tap where you want to go. Tap me, or Ask, whenever you want directions.",
        "用方向鍵走路，或點一下想去的地方。需要指路時，點我或按「詢問」。")
      : L("Arrow keys or WASD to walk, Shift to run, Z or Enter to talk. Q asks me for directions, N opens your notebook, R looks up a room, and L shows a piece's photo up close.",
        "方向鍵或 WASD 走路，Shift 跑步，Z 或 Enter 對話。Q 問我路，N 打開筆記本，R 查詢展間，L 放大看文物照片。");
  }


  // ---- arriving and greeting ----

  async function intro(G) {
    const d = G.docent, p = G.player;
    Actors.place(d, p.x, p.y - 4, "down");
    for (let i = 0; i < 3; i++) {
      Actors.startStep(d, "down", Actors.WALK);
      await until(() => !d.moving);
    }
    G.bubble(d, "talk", 0.8);
    Sound.play("alert");
    await wait(500);
    await talk([
      L("Hi! Welcome to the National Palace Museum. I'm a junior docent, and I'll be your guide today.",
        "嗨！歡迎來到國立故宮博物院。我是小小導覽員，今天由我帶你參觀。"),
      L("This walk covers the four permanent exhibitions: the bronzes and jades on 3F, The Magic of Kneaded Clay on 2F, and A Garland of Treasures here on 1F.",
        "這趟要逛四個常設展：3F的銅器和玉器、2F的摶泥幻化，還有就在1F的集瓊藻。"),
      L(`There are ${TOTAL()} pieces to find, every one the museum lists for these galleries. The floors and room numbers are real; the building itself is drawn as a simplified map.`,
        `一共有${TOTAL()}件文物等你發現，每一件都是故宮為這些展廳列出的精選。樓層和展間號碼都是真的，建築則畫成簡化的地圖。`),
      L("Displays do change from time to time, so check npm.gov.tw before a real visit.",
        "展品偶爾會更換，實際參觀前請先查看 npm.gov.tw。")
    ]);
    const i = await talk([L("How would you like to visit today?", "今天想怎麼參觀呢？")], {
      choices: [L("Guide me to the best pieces", "帶我看最精彩的文物"), L("I'll explore on my own", "我想自己逛")],
      cancel: 1
    });
    if (i === 0) return chooseTour(G);
    return leave(G);
  }

  // ---- the two ways to visit ----

  // A planned route: pick its length, see the stops, then set off.
  async function chooseTour(G) {
    const short = TourData.shortTour().map(t => t[1]), full = TourData.highlightTour().map(t => t[1]);
    const time = ids => TourData.minutesLabel(TourData.planMinutes(ids));
    const i = await talk([L("I've planned two routes through the best pieces. Which would you like?", "我準備了兩條精選路線，想走哪一條？")], {
      choices: [
        L(`Must-sees: ${short.length} pieces, ${time(short)}`, `必看精選：${short.length}件，${time(short)}`),
        L(`Highlights: ${full.length} pieces, ${time(full)}`, `完整精選：${full.length}件，${time(full)}`),
        L("I'll explore on my own instead", "我還是自己逛好了")
      ],
      cancel: 2
    });
    if (i === 2) return leave(G);
    const mode = i === 0 ? "short" : "full";
    const go = await Panels.tourPreview(G, i === 0 ? short : full, mode);
    if (!go) return chooseTour(G);
    return startTour(G, mode);
  }

  // The docent says goodbye, walks off and slips out of sight.
  async function leave(G) {
    faceEachOther(G);
    await talk([
      L("Enjoy exploring! Walk up to any case and its label will tell you about it.", "盡情探索吧！走到任何一個展櫃前，說明牌會為你介紹。"),
      L("If you'd like a guide again, tap Ask and call me back. I'll be close by.", "如果又想要導覽，按「詢問」請我回來，我就在附近。")
    ]);
    G.stopLead();
    G.tour.active = false;
    G.companion = "alone";
    G.save();
    const d = G.docent;
    const away = awayTile(G, d, 5);
    if (away) await walkPath(d, World.findPath(G.map, d, [away], { blocked: (x, y) => !!G.npcAt(x, y) }), 5);
    await fade(d, 1, 0, 450);
    d.hidden = true;
    d.alpha = 1;
  }

  // ...and comes back when called, walking up from a few steps away.
  async function comeBack(G) {
    const d = G.docent, p = G.player;
    const spot = awayTile(G, p, 3) || { x: p.x, y: p.y };
    Actors.place(d, spot.x, spot.y, "down");
    d.alpha = 0;
    d.hidden = false;
    const arriving = fade(d, 0, 1, 400);
    const beside = Object.values(Actors.DIRS).map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter(t => G.standable(t.x, t.y) && !G.npcAt(t.x, t.y));
    if (beside.length) await walkPath(d, World.findPath(G.map, d, beside, { blocked: (x, y) => !!G.npcAt(x, y) }), 4);
    await arriving;
    G.companion = "with";
    G.save();
    faceEachOther(G);
    G.bubble(d, "excl", 0.8);
    await talk([L("I'm back! Where shall we go?", "我回來了！想去哪裡呢？")]);
    return ask(G);
  }

  // A tour with nothing left to see (say, after clearing the plan) is over.
  function settleTour(G) {
    if (G.tour.active && !nextStop(G)) {
      G.tour.active = false;
      G.save();
    }
  }

  async function welcomeBack(G) {
    const n = G.seen.size;
    if (alone(G)) {
      G.tour.active = false;
      UI.toast(n ? L(`Welcome back! ${n}/${TOTAL()} pieces seen.`, `歡迎回來！已看 ${n}/${TOTAL()} 件。`) : L("Welcome back!", "歡迎回來！"));
      return;
    }
    faceEachOther(G);
    settleTour(G);
    const pages = [n ? L(`Welcome back! You've seen ${n} of ${TOTAL()} pieces so far.`, `歡迎回來！你已經看過 ${n}／${TOTAL()} 件文物。`) : L("Welcome back!", "歡迎回來！")];
    if (G.tour.active && nextStop(G)) {
      const i = await talk(pages, { choices: [L("Continue the tour", "繼續導覽"), L("Just explore", "自己逛逛")], cancel: 1 });
      if (i === 0) return continueTour(G);
      G.tour.active = false;
      G.save();
      return;
    }
    await talk(pages);
  }

  // after every map change
  async function afterArrive(G) {
    faceEachOther(G);
    if (G.map.kind !== "gallery" || G.introducedGalleries.has(G.map.gallery)) return;
    G.introducedGalleries.add(G.map.gallery);
    const g = G.galleryInfo(G.map.gallery);
    await wait(150);
    if (alone(G)) return UI.say(pagesOf(TourData.text(g, "intro")), { speaker: L("Wall text", "展覽說明") });
    await talk(pagesOf(TourData.text(g, "intro")));
  }

  // ---- one piece ----

  async function present(G, id, { faceCase = null } = {}) {
    const p = piece(id);
    const g = TourData.galleryOf(id);
    const c = faceCase || G.map.cases.find(cc => cc.id === id);
    const pl = G.player;
    if (c && Math.min(...[...Array(c.w * c.h)].map((_, k) => Math.abs(c.x + (k % c.w) - pl.x) + Math.abs(c.y + Math.floor(k / c.w) - pl.y))) === 1) {
      pl.dir = World.dirToward(pl, c);
    }
    settleTour(G);
    G.talkedCases.add(id);
    const fresh = !G.seen.has(id);
    const say = alone(G) ? label : talk;
    if (!alone(G)) G.bubble(G.docent, fresh ? "excl" : "talk", 0.9);
    if (c) G.spotlight(c);
    Sound.play("alert");
    await wait(320);
    const isNew = G.markSeen(id, { quiet: true });
    UI.showCard(id, p, g, isNew ? L(`New in your notebook · ${G.seen.size}/${TOTAL()}`, `新增到筆記本 · ${G.seen.size}/${TOTAL()}`) : "",
      G.playerScreenX() < window.innerWidth / 2 ? "right" : "left",
      { saved: G.plan.has(id), onToggleSave: () => G.togglePlan(id) });
    if (G.tour.active) {
      G.tour.visited.add(id);
      G.save();
    }
    let pages = pagesOf(TourData.text(p, "intro"));
    let toldMore = false, toldLook = false;
    for (;;) {
      const choices = [], acts = [];
      if (p.photo) { choices.push(L("Look closer", "看清楚一點")); acts.push("zoom"); }
      if (!toldMore) { choices.push(L("Tell me more", "多說一點")); acts.push("more"); }
      if (!toldLook) { choices.push(L("What should I look for?", "要看哪裡？")); acts.push("look"); }
      if (G.tour.active) {
        choices.push(nextStop(G) ? L("Next stop ▸", "下一站 ▸") : L("Finish the tour", "結束導覽")); acts.push("next");
        choices.push(L("Pause the tour", "暫停導覽")); acts.push("pause");
      } else {
        choices.push(alone(G) ? L("Done", "看完了") : L("Thanks!", "謝謝！")); acts.push("done");
      }
      const i = await say(pages, { choices, cancel: acts.indexOf(G.tour.active ? "pause" : "done") });
      const act = acts[i];
      if (act === "zoom") { await UI.openViewer(id, p, g); pages = [L("What else would you like to know?", "還想知道什麼呢？")]; continue; }
      if (act === "more") { toldMore = true; pages = pagesOf(TourData.text(p, "more")); continue; }
      if (act === "look") { toldLook = true; pages = pagesOf(TourData.text(p, "look")); continue; }
      UI.hideCard();
      await maybeChallenge(G, g);
      if (act === "next") return continueTour(G);
      if (act === "pause") {
        G.tour.active = false;
        G.save();
        return talk([L("Tour paused. Ask me any time and we'll pick up where we left off.", "導覽暫停。隨時問我，我們就從剛才的地方繼續。")]);
      }
      return;
    }
  }

  // ---- the tours ----

  /*
    Three kinds of tour, all walked top floor down:
      full     the highlights, the museum's best-known pieces
      gallery  every piece in one gallery (G.tour.gallery)
      plan     the pieces the visitor saved
  */
  function tourList(G) {
    if (G.tour.mode === "plan") return TourData.planOrder([...G.plan]);
    if (G.tour.mode === "gallery") {
      const g = G.galleryInfo(G.tour.gallery);
      return g ? g.tour : [];
    }
    if (G.tour.mode === "short") return TourData.shortTour().map(t => t[1]);
    return TourData.highlightTour().map(t => t[1]);
  }

  function nextStop(G) {
    const id = tourList(G).find(x => !G.tour.visited.has(x));
    return id ? [TourData.galleryOf(id).id, id] : null;
  }

  const unseen = (G, ids) => ids.filter(id => !G.seen.has(id));

  async function startTour(G, mode = "full", galleryId = null) {
    G.tour = { active: true, mode, gallery: galleryId, visited: mode === "plan" ? new Set() : new Set(G.seen) };
    G.save();
    if (mode === "plan") {
      const t = TourData.planMinutes([...G.plan]);
      await talk([L(`Let's walk your plan: ${G.plan.size} ${G.plan.size === 1 ? "piece" : "pieces"}, ${TourData.minutesLabel(t)} in the real museum. Top floor first!`,
        `我們來走你的計畫：${G.plan.size}件文物，在真正的博物館裡${TourData.minutesLabel(t)}。從頂樓開始！`)]);
    } else if (mode === "gallery") {
      const g = G.galleryInfo(galleryId);
      const left = unseen(G, g.tour).length;
      await talk([L(`Let's see every piece in ${g.title}: ${left} still to go, in walking order.`,
        `我們來看${g.zh.title}的每一件文物：還有${left}件，照參觀路線走。`)]);
    } else {
      const n = tourList(G).length, left = unseen(G, tourList(G)).length;
      await talk([L(`Let's go! ${n} pieces${G.seen.size && left < n ? ` (${left} still to go)` : ""}. We'll start on the top floor and work our way down, so the whole walk is downhill. Press G, or Auto-walk, to follow me without steering.`,
        `出發吧！一共${n}件${G.seen.size && left < n ? `（還有${left}件）` : ""}。我們從頂樓開始一路往下，整趟都是下坡。按 G 或「自動走」，就能直接跟著我走。`)]);
    }
    return continueTour(G);
  }

  async function continueTour(G) {
    const next = nextStop(G);
    if (!next) {
      const mode = G.tour.mode;
      const g = G.galleryInfo(G.tour.gallery);
      G.tour.active = false;
      G.save();
      Sound.play("seen");
      if (mode === "plan") {
        return talk([
          L("That's everything on your plan! On your real visit, you'll know exactly where to go.", "你的計畫都看完了！真正參觀時，你就知道要去哪裡了。"),
          L("You can save the plan as an image from the menu, to keep on your phone.", "你可以從選單把計畫存成圖片，放在手機裡。")
        ]);
      }
      if (mode === "gallery" && g) return talk([L(`That's every piece in ${g.title}!`, `${g.zh.title}的每一件都看完了！`)]);
      return talk([
        L("And that's the tour! Every gallery has more to find: ask me to show you every piece in one, look up a room, or explore on your own.",
          "導覽到這裡結束！每個展廳都還有更多文物：可以請我帶你看完整個展廳、查詢展間，或自己逛逛。"),
        L("Thank you for walking with me. The exit is on 1F, straight past the grand staircase.", "謝謝你陪我一起走。出口在1F，經過大樓梯直走就到了。")
      ]);
    }
    const [gid, pid] = next;
    const g = G.galleryInfo(gid);
    if (G.map.id !== gid) {
      const lines = [];
      if (G.map.kind === "gallery" && G.tour.mode === "full") {
        const here = G.galleryInfo(G.map.gallery);
        if (here.highlights.every(id => G.seen.has(id))) lines.push(L(`That's the highlights of ${here.title}.`, `${here.zh.title}的精選看完了。`));
      }
      lines.push(L(`Next up: ${g.title}, in ${Text.roomList(g.rooms)} on ${g.floor}F. ${Text.directions(G.map.floor, g.floor, G.settings.stepFree)} Follow me!`,
        `下一站：${g.floor}F的${g.zh.title}，在${Text.roomList(g.rooms)}。${Text.directions(G.map.floor, g.floor, G.settings.stepFree)}跟我來！`));
      await talk(lines);
    } else {
      UI.toast(L(`Next: ${nameOf(pid)}`, `下一件：${nameOf(pid)}`));
    }
    G.startLead({ type: "case", map: gid, id: pid }, nameOf(pid));
  }

  // ---- "where to?" ----

  // the floor guide's menu, when exploring alone
  async function askAlone(G) {
    const g = G.map.kind === "gallery" ? G.galleryInfo(G.map.gallery) : null;
    const choices = [], acts = [];
    const add = (label, act) => { choices.push(label); acts.push(act); };
    add(L("Call the docent back", "請導覽員回來"), "call");
    add(g ? L("Pieces in this room…", "這間展間的文物…") : L("Look up a room…", "查詢展間…"), "rooms");
    add(g ? L("Another gallery…", "去其他展廳…") : L("Go to a gallery…", "去一個展廳…"), "gallery");
    add(L("Where's the Jadeite Cabbage?", "翠玉白菜在哪裡？"), "cabbage");
    add(L("The way out", "出口在哪裡？"), "exit");
    if (G.lead) add(L("Stop showing the way", "不用指路了"), "stop");
    add(L("Never mind", "沒事"), "cancel");
    const i = await sign([L("Where to?", "想去哪裡？")], { choices, cancel: choices.length - 1 });
    const act = acts[i];
    if (act === "call") return comeBack(G);
    if (act === "rooms") return Panels.rooms(G);
    if (act === "gallery") return pickGallery(G);
    if (act === "cabbage") return cabbage(G);
    if (act === "exit") return wayOut(G);
    if (act === "stop") G.stopLead();
  }

  async function ask(G) {
    if (alone(G)) return askAlone(G);
    faceEachOther(G);
    const inGallery = G.map.kind === "gallery";
    const g = inGallery ? G.galleryInfo(G.map.gallery) : null;
    const choices = [], acts = [];
    const add = (label, act) => { choices.push(label); acts.push(act); };
    if (G.tour.active && nextStop(G)) {
      add(G.tour.mode === "plan" ? L("Continue my plan", "繼續我的計畫") : L("Continue the tour", "繼續導覽"), "continue");
    } else {
      add(L("A guided tour of the best pieces…", "精選導覽路線…"), "tour");
    }
    if (G.plan.size && !(G.tour.active && G.tour.mode === "plan")) add(L(`Walk my visit plan (${G.plan.size})`, `走我的參觀計畫（${G.plan.size}）`), "plan");
    if (g && !G.stamps.has(g.id) && g.highlights.every(id => G.seen.has(id))) add(L("The junior docent challenge", "小小導覽員挑戰"), "challenge");
    if (g) {
      const left = unseen(G, g.tour).length;
      if (left && !(G.tour.active && G.tour.mode === "gallery" && G.tour.gallery === g.id)) add(L(`Every piece in this gallery (${left} to go)`, `看這個展廳的每一件（還有${left}件）`), "gallery-tour");
    }
    add(g ? L("Pieces in this room…", "這間展間的文物…") : L("Look up a room…", "查詢展間…"), "rooms");
    add(g ? L("Another gallery…", "去其他展廳…") : L("Go to a gallery…", "去一個展廳…"), "gallery");
    add(L("Where's the Jadeite Cabbage?", "翠玉白菜在哪裡？"), "cabbage");
    add(L("The way out", "出口在哪裡？"), "exit");
    if (G.lead) add(L("Stop leading me", "不用帶路了"), "stop");
    add(L("I'll explore on my own", "我想自己逛"), "leave");
    add(L("Never mind", "沒事"), "cancel");
    const i = await talk([L("Where would you like to go?", "想去哪裡呢？")], { choices, cancel: choices.length - 1 });
    const act = acts[i];
    if (act === "continue") return continueTour(G);
    if (act === "tour") return chooseTour(G);
    if (act === "leave") return leave(G);
    if (act === "plan") return startTour(G, "plan");
    if (act === "gallery-tour") return startTour(G, "gallery", g.id);
    if (act === "challenge") return challenge(G, g);
    if (act === "rooms") return Panels.rooms(G);
    if (act === "gallery") return pickGallery(G);
    if (act === "cabbage") return cabbage(G);
    if (act === "exit") return wayOut(G);
    if (act === "stop") {
      G.stopLead();
      G.tour.active = false;
      G.save();
      return talk([L("Okay! I'll follow you.", "好的！我跟著你走。")]);
    }
  }

  async function pickGallery(G) {
    const gs = TourData.GALLERIES;
    const choices = gs.map(g => `${TourData.galleryTitle(g)} · ${g.floor}F`).concat(L("Back", "返回"));
    const i = await guide(G)([L("Which gallery?", "哪一個展廳？")], { choices, cancel: gs.length });
    if (i >= gs.length) return;
    return goToGallery(G, gs[i]);
  }

  async function goToGallery(G, g) {
    const title = TourData.galleryTitle(g);
    if (G.map.id === g.id) return guide(G)([L(`You're already in ${title}!`, `你已經在${title}了！`)]);
    G.tour.active = false;
    await guide(G)([
      L(`${title} is on ${g.floor}F, in ${Text.roomList(g.rooms)}, ${TourData.gallerySide(g)} of the grand staircase.`,
        `${title}在${g.floor}F大樓梯${TourData.gallerySide(g)}的${Text.roomList(g.rooms)}。`),
      `${Text.directions(G.map.floor, g.floor, G.settings.stepFree)} ${followLine(G)}`
    ]);
    G.startLead({ type: "map", map: g.id }, title);
  }

  // Lead the way to one piece, saying where it is first when it's far.
  async function walkTo(G, id) {
    G.tour.active = false;
    const g = TourData.galleryOf(id);
    const p = piece(id);
    if (G.map.id !== g.id) {
      await guide(G)([L(`That's in ${g.title}, Room ${p.room}, ${TourData.gallerySide(g)} of ${g.floor}F. ${Text.directions(G.map.floor, g.floor, G.settings.stepFree)} ${followLine(G)}`,
        `它在${g.floor}F${TourData.gallerySide(g)}${g.zh.title}的${p.room}室。${Text.directions(G.map.floor, g.floor, G.settings.stepFree)}${followLine(G)}`)]);
    }
    G.startLead({ type: "case", map: g.id, id }, nameOf(id));
  }

  async function cabbage(G) {
    await guide(G)([
      L("Everyone asks! The Jadeite Cabbage is shown in Room 302 on 3F, in A Gathering of Treasures in the National Palace Museum North and South.",
        "大家都會問！翠玉白菜在3F的302陳列室展出。"),
      L("But it travels: the museum lists it at the Southern Branch in Chiayi from 8 December 2026 to 7 March 2027. Check npm.gov.tw before you come. It isn't part of this tour.",
        "不過它會巡展：故宮公告它於2026年12月8日至2027年3月7日在嘉義南部院區展出。來之前請先查看 npm.gov.tw。它不在本導覽範圍內。")
    ]);
  }

  async function wayOut(G) {
    const m = G.world.maps["1F"];
    await guide(G)([G.map.id === "1F" ? L("The exit is right down the red carpet.", "出口就在紅地毯的盡頭。")
      : `${L("The exit is on 1F, past the grand staircase.", "出口在1F，經過大樓梯就到了。")} ${followLine(G)}`]);
    G.startLead({ type: "tile", map: "1F", x: m.spawn.x, y: m.spawn.y, face: "down", then: "exit" }, L("Exit", "出口"));
  }

  // when a lead reaches its target
  async function arrived(G, lead) {
    const t = lead.target;
    if (t.type === "case") {
      const c = G.map.cases.find(cc => cc.id === t.id);
      G.player.dir = World.dirToward(G.player, c);
      return present(G, t.id, { faceCase: c });
    }
    if (t.type === "tile") {
      if (t.face) G.player.dir = t.face;
      if (t.then === "exit") return leavePrompt(G);
      return;
    }
    if (t.type === "map" && G.map.kind === "gallery" && alone(G)) {
      UI.toast(L(`You're in ${TourData.galleryTitle(G.galleryInfo(G.map.gallery))}`, `你已到達${TourData.galleryTitle(G.galleryInfo(G.map.gallery))}`));
      return;
    }
    if (t.type === "map" && G.map.kind === "gallery") {
      faceEachOther(G);
      const g = G.galleryInfo(G.map.gallery);
      const first = g.highlights.find(id => !G.seen.has(id)) || g.tour.find(id => !G.seen.has(id)) || g.highlights[0];
      const i = await talk([L("Here we are!", "到了！")], {
        choices: [L(`Show me the ${nameOf(first)}`, `帶我看${nameOf(first)}`), L("I'll look around myself", "我自己看看")], cancel: 1
      });
      if (i === 0) G.startLead({ type: "case", map: g.id, id: first }, nameOf(first));
    }
  }

  // ---- signs, people, elevator, front door ----

  async function npcTalk(G, npc) {
    npc.talking = true;
    npc.dir = npc.counter ? World.OPPOSITE[G.player.dir] : Actors.dirTo(npc, G.player);
    try {
      await UI.say(npc.lines.map(([en, zh]) => L(en, zh)), { onChar: () => Sound.voice(npc.look === "staff" ? "staff" : "visitor") });
    } finally {
      npc.talking = false;
    }
  }

  async function directory(G) {
    const i = await UI.say([
      L("Floor guide: the four permanent exhibitions.", "樓層導覽：四個常設展。"),
      L("3F: Rituals Cast in Brilliance (bronzes), east side, Rooms 305 and 307. Art in Quest of Heaven and Truth (jades), west side, Rooms 306 and 308.",
        "3F：吉金耀采（銅器），東側305、307室；敬天格物（玉器），西側306、308室。"),
      L("2F: The Magic of Kneaded Clay (ceramics), east side, Rooms 201, 205 and 207.", "2F：摶泥幻化（陶瓷），東側201、205、207室。"),
      L("1F: A Garland of Treasures (precious crafts), west side, Room 106.", "1F：集瓊藻（珍玩），西側106室。"),
      L("Elevator: behind the grand staircase.", "電梯：在大樓梯後面。")
    ], { choices: [L("Take me to one", "帶我去"), L("Thanks", "謝謝")], cancel: 1 });
    if (i === 0) return pickGallery(G);
  }

  // the sign on a roped-off doorway
  function ropeSign(G, at) {
    const rope = World.ropeAt(G.map, at.x, at.y) || G.map.ropes[0];
    return UI.say(pagesOf(TourData.sign(rope.sign)));
  }

  async function wallText(G) {
    const g = G.galleryInfo(G.map.gallery);
    await UI.say([
      L(`${g.nameZh} · ${g.name}`, g.zh.name),
      ...pagesOf(TourData.text(g, "intro")),
      L(`On view since ${g.since}. ${g.tour.length} of its pieces are in this game. Checked against npm.gov.tw, ${TourData.checked()}.`,
        `${g.since} 起展出。本遊戲收錄${g.tour.length}件。已對照 npm.gov.tw 查核（${TourData.checked()}）。`)
    ]);
  }

  async function elevator(G) {
    const floors = [3, 2, 1].filter(f => f !== G.map.floor);
    const i = await UI.say([L("The elevator. Which floor?", "電梯。要去幾樓？")], { choices: floors.map(f => `${f}F`).concat(L("Cancel", "取消")), cancel: floors.length });
    if (i < floors.length) await G.rideElevator(floors[i]);
  }

  async function leavePrompt(G) {
    const i = await UI.say([L("Leave the museum?", "要離開博物館嗎？")], { choices: [L("Keep exploring", "繼續參觀"), L("Leave", "離開")], cancel: 0 });
    if (i !== 1) return;
    G.save();
    G.toTitle();
  }

  // ---- the junior docent challenge ----

  async function maybeChallenge(G, g) {
    if (G.stamps.has(g.id) || G.challengeOffered.has(g.id) || !g.highlights.every(id => G.seen.has(id))) return;
    G.challengeOffered.add(g.id);
    const title = TourData.galleryTitle(g);
    const host = alone(G) ? station : talk;
    const i = await host([
      L(`You've seen the highlights of ${title}!`, `${title}的精選你都看過了！`),
      L(`Ready for the junior docent challenge? Get ${TourData.QUIZ_PASS} of 3 questions right and you'll earn this gallery's stamp for your notebook.`,
        `要挑戰小小導覽員嗎？三題答對${TourData.QUIZ_PASS}題，就能在筆記本蓋上這個展廳的印章。`)
    ], { choices: [L("Let's do it", "來吧！"), L("Maybe later", "等一下")], cancel: 1 });
    if (i === 0) return challenge(G, g);
    return host([alone(G) ? L("Come back any time: it's in the menu under Ask.", "隨時可以回來挑戰：在「詢問」裡。") : L("No problem. Ask me whenever you're ready.", "沒問題，準備好了再問我。")]);
  }

  async function challenge(G, g) {
    const talk = alone(G) ? station : talkDocent;
    const qs = TourData.QUIZZES[g.id].map(TourData.quiz);
    const title = TourData.galleryTitle(g);
    let right = 0;
    for (let n = 0; n < qs.length; n++) {
      const q = qs[n];
      const i = await talk([L(`Question ${n + 1} of ${qs.length}: ${q.q}`, `第${n + 1}題（共${qs.length}題）：${q.q}`)], { choices: q.a });
      if (i === q.correct) {
        right++;
        Sound.play("select");
        await talk([L("Correct!", "答對了！")]);
      } else {
        Sound.play("back");
        await talk([L(`Not quite. The answer is: ${q.a[q.correct]}.`, `差一點！答案是：${q.a[q.correct]}。`)]);
      }
    }
    if (right < TourData.QUIZ_PASS) {
      return talk([L(`${right} out of ${qs.length}. You need ${TourData.QUIZ_PASS} for the stamp. Ask me to try again any time!`,
        `答對${right}題（共${qs.length}題），要答對${TourData.QUIZ_PASS}題才能蓋章。隨時可以再挑戰！`)]);
    }
    G.earnStamp(g.id);
    await UI.stampMoment(g, L(`${title} · stamp earned`, `${title} · 蓋章成功`));
    await talk([L(`${right} out of ${qs.length}! The stamp for ${title} is in your notebook now.`, `答對${right}題！${title}的印章已經蓋在你的筆記本裡了。`)]);
    if (G.stamps.size === TourData.GALLERIES.length) {
      await talk([L("That's all four stamps. You're officially a junior docent!", "四個印章都集滿了，你正式成為小小導覽員！")]);
    }
  }

  root.Docent = {
    intro, welcomeBack, afterArrive, present, ask, arrived, npcTalk, directory, ropeSign, wallText,
    elevator, leavePrompt, nextStop, startTour, chooseTour, leave, comeBack, walkTo, pickGallery, goToGallery, cabbage, controlsHint, talk
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
