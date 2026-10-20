/*
  The full-screen panels: menu, notebook and stamp book, the room lookup for
  use inside the real museum, one piece's page, the visit plan, the floor
  guide, options and About. Each is an async flow like the docent's.
*/
(function (root) {
  const L = (en, zh) => Lang.L(en, zh);
  const piece = id => TourData.PIECES[id];
  const nameOf = id => TourData.pieceName(piece(id));
  const TOTAL = () => TourData.fullTour().length;

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const zhSpan = text => { const s = el("span", "", text); s.lang = "zh-Hant"; return s; };

  // The cut-out photo as a small picture, or a plain label when there's none.
  function thumb(id) {
    if (!piece(id).photo) {
      const ph = el("span", "thumb thumb-none", L("No photo yet", "暫無照片"));
      ph.setAttribute("aria-hidden", "true");
      return ph;
    }
    const img = el("img", "thumb");
    img.src = `images/objects/${id}.webp`;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    return img;
  }

  // ---- one piece ----

  /*
    A piece's own page inside a panel: photo, both names, where it is, what
    the docent says, what to look for, and a "found it" check for use in
    the real museum. `walk` offers "Walk me there"; `back` returns to the
    list it came from.
  */
  function pieceDetail(body, G, id, { back, close, walk = true }) {
    const p = piece(id), g = TourData.galleryOf(id);
    body.innerHTML = "";
    body.scrollTop = 0;
    UI.setPanelBack(back);
    const art = el("article", "nb-detail");
    const pic = p.photo ? UI.zoomButton(id, p, g) : el("div", "card-zoom no-photo", L("No openly licensed photo yet", "目前還沒有開放授權的照片"));
    const first = el("h3", "", TourData.pieceName(p));
    const second = el("p", Lang.isZh() ? "card-en" : "card-zh", Lang.isZh() ? p.name : p.nameZh);
    if (!Lang.isZh()) second.lang = "zh-Hant";
    const meta = el("p", "card-meta", `${TourData.pieceDate(p)} · ${g.floor}F${L(",", "")} ${Text.roomName(p.room)} · ${TourData.galleryTitle(g)}`);

    // the in-person check
    const spot = el("section", "spot-box");
    const spotHead = el("h4", "", L("At the museum", "在博物館"));
    const spotBtn = UI.button("", () => {}, "spot-btn");
    const paintSpot = () => {
      const on = G.spotted.has(id);
      spotBtn.textContent = on ? L("✓ Found it in the museum", "✓ 已在博物館找到") : L("☐ I found it in the museum", "☐ 我在博物館找到它了");
      spotBtn.setAttribute("aria-pressed", String(on));
      spotBtn.classList.toggle("on", on);
    };
    spotBtn.addEventListener("click", async () => {
      const r = G.toggleSpotted(id);
      paintSpot();
      if (r.sealEarned) await UI.stampMoment(g, L(`${TourData.galleryTitle(g)} · seen in person`, `${TourData.galleryTitle(g)} · 親眼看見`), { round: true });
    });
    paintSpot();
    spot.append(spotHead, el("p", "", TourData.text(p, "look")), spotBtn);

    const link = el("a", "nb-source", L("The museum's page about this piece ↗", "故宮對這件文物的介紹 ↗"));
    link.href = TourData.pieceSource(p); link.target = "_blank"; link.rel = "noopener";
    const actions = el("div", "nb-actions");
    const saveLabel = () => (G.plan.has(id) ? L("★ On my visit plan", "★ 已在參觀計畫") : L("☆ Save to my visit", "☆ 加入參觀計畫"));
    const save = UI.button(saveLabel(), () => {
      G.togglePlan(id);
      save.textContent = saveLabel();
      save.setAttribute("aria-pressed", String(G.plan.has(id)));
    });
    save.setAttribute("aria-pressed", String(G.plan.has(id)));
    if (walk) actions.append(UI.button(L("Walk me there", "帶我過去"), () => close({ go: id }), "primary"));
    actions.append(save);
    if (p.photo) actions.append(UI.button(L("Look closer", "看清楚一點"), () => UI.openViewer(id, p, g)));
    actions.append(UI.button(L("Back to the list", "回到列表"), back));
    art.append(pic, first, second, meta, el("p", "nb-hook", TourData.text(p, "intro")), el("p", "", TourData.text(p, "more")), spot);
    if (p.photo) {
      const rec = p.record ? ` (${p.record})` : "";
      art.append(el("p", "photo-credit", L(`Photo: National Palace Museum, Taipei, Open Data${rec}`, `照片：國立故宮博物院 Open Data${rec}`)));
    }
    art.append(link, actions);
    body.append(art);
    actions.querySelector("button").focus({ preventScroll: true });
  }

  // ---- the room lookup ----

  /*
    For a visitor standing in the real museum: pick your room and see every
    piece in it, with what to look for and a box to tick when you find it.
    No walking needed.
  */
  async function rooms(G, { room = null, fromTitle = false } = {}) {
    const here = !fromTitle && G.map && G.map.kind === "gallery" ? World.roomAt(G.map, G.player.x, G.player.y) : null;
    const all = TourData.rooms();
    const result = await UI.openPanel(L("Look up a room", "查詢展間"), (body, close) => {
      const pickRoom = () => {
        body.innerHTML = "";
        UI.setPanelBack(null);
        body.append(el("p", "panel-note", L("At the museum? Pick the room you're standing in to see every piece there and what to look for. Room numbers are on the wall by each doorway.",
          "在博物館裡嗎？選你所在的展間，就能看到裡面的每件文物和觀看重點。展間號碼標在每個入口旁的牆上。")));
        for (const floor of [3, 2, 1]) {
          const sec = el("section", "room-floor");
          sec.append(el("h3", "", `${floor}F`));
          const grid = el("div", "room-grid");
          for (const r of all.filter(x => x.floor === floor)) {
            const g = TourData.GALLERIES.find(x => x.id === r.gallery);
            const b = UI.button("", () => showRoom(r.room), "room-btn" + (r.room === here ? " here" : ""));
            b.append(el("strong", "", r.room), el("span", "", TourData.galleryShort(g)),
              el("small", "", r.pieces.length ? L(`${r.pieces.length} pieces`, `${r.pieces.length} 件`) : L("see note", "說明")));
            if (r.room === here) b.append(el("em", "", L("you are here", "你在這裡")));
            grid.append(b);
          }
          if (floor === 3) {
            const b = UI.button("", () => {
              body.innerHTML = "";
              UI.setPanelBack(pickRoom);
              body.append(el("h3", "", L("Room 302", "302 陳列室")), el("p", "", TourData.sign("treasures302")),
                UI.button(L("Back to the rooms", "回到展間列表"), pickRoom));
            }, "room-btn other");
            b.append(el("strong", "", "302"), el("span", "", L("Jadeite Cabbage", "翠玉白菜")), el("small", "", L("not on this tour", "不在本導覽")));
            grid.append(b);
          }
          sec.append(grid);
          body.append(sec);
        }
        UI.focusPanel();
      };
      const showRoom = roomNo => {
        const r = all.find(x => x.room === roomNo);
        const g = TourData.GALLERIES.find(x => x.id === r.gallery);
        body.innerHTML = "";
        body.scrollTop = 0;
        UI.setPanelBack(pickRoom);
        const head = el("header", "room-head");
        head.append(el("h3", "", `${r.floor}F · ${Text.roomName(r.room)}`), el("p", "card-meta", TourData.galleryName(g)));
        body.append(head);
        if (!r.pieces.length) {
          body.append(el("p", "", L(`The museum's selections don't list any pieces in this room, but it's part of ${g.title} and may show more of the same collection.`,
            `故宮的精選沒有列出這間的文物，但它屬於「${g.zh.title}」，可能展出同一類的其他收藏。`)));
        } else {
          const found = r.pieces.filter(id => G.spotted.has(id)).length;
          body.append(el("p", "room-progress", L(`Found in person: ${found} of ${r.pieces.length}. Walk around and tick each one off as you find it.`,
            `已親眼找到：${found}／${r.pieces.length} 件。邊走邊找，找到就打勾。`)));
          const list = el("div", "room-list");
          for (const id of r.pieces) {
            const p = piece(id);
            const row = UI.button("", () => pieceDetail(body, G, id, { back: () => showRoom(roomNo), close, walk: !fromTitle }), "room-row");
            const text = el("span", "room-row-text");
            text.append(el("b", "", TourData.pieceName(p)), el("small", "", TourData.pieceDate(p)));
            const marks = el("span", "room-marks");
            if (G.spotted.has(id)) marks.append(el("i", "mark-spot", "✓"));
            if (G.plan.has(id)) marks.append(el("i", "mark-plan", "★"));
            row.setAttribute("aria-label", `${TourData.pieceName(p)}${G.spotted.has(id) ? L(", found", "，已找到") : ""}${G.plan.has(id) ? L(", on your plan", "，在計畫中") : ""}`);
            row.append(thumb(id), text, marks);
            list.append(row);
          }
          body.append(list);
        }
        body.append(UI.button(L("All rooms", "所有展間"), pickRoom));
        UI.focusPanel();
      };
      if (room || here) showRoom(room || here);
      else pickRoom();
    });
    if (result && result.go) return Docent.walkTo(G, result.go);
  }

  // ---- a planned tour, before setting off ----

  /*
    The route the docent has planned: every stop in walking order, floor by
    floor, with the time it takes. Resolves true to start, false to choose
    again.
  */
  async function tourPreview(G, ids, mode) {
    const t = TourData.planMinutes(ids);
    const title = mode === "short" ? L("Must-see tour", "必看精選路線") : L("Highlights tour", "完整精選路線");
    const result = await UI.openPanel(title, (body, close) => {
      body.append(el("p", "plan-summary", L(`${ids.length} pieces · ${TourData.minutesLabel(t)} · top floor first, then downhill`,
        `${ids.length} 件 · ${TourData.minutesLabel(t)} · 從頂樓開始，一路往下`)));
      const route = el("ol", "tour-route");
      let n = 0;
      for (const g of TourData.GALLERIES) {
        const here = ids.filter(id => TourData.galleryOf(id) === g);
        if (!here.length) continue;
        const stop = el("li", "tour-stop");
        const head = el("h3");
        head.append(`${g.floor}F · ${TourData.galleryTitle(g)} `, el("small", "", Text.roomList(g.rooms)));
        const list = el("div", "tour-pieces");
        for (const id of here) {
          const p = piece(id);
          const row = el("div", "tour-piece");
          const num = el("span", "tour-num", String(++n));
          const text = el("span", "room-row-text");
          text.append(el("b", "", TourData.pieceName(p)), el("small", "", `${TourData.pieceDate(p)} · ${Text.roomName(p.room)}`));
          row.append(num, thumb(id), text);
          list.append(row);
        }
        stop.append(head, list);
        route.append(stop);
      }
      const actions = el("div", "nb-actions sticky-actions");
      actions.append(UI.button(L("Start the tour", "開始導覽"), () => close("start"), "primary"),
        UI.button(L("Choose again", "重新選擇"), () => close("back")));
      body.append(route, actions);
    });
    return result === "start";
  }

  // ---- the menu ----

  // simple line icons for the menu tiles
  const ICONS = {
    ask: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    rooms: '<path d="M5 20V5l7-2 7 2v15"/><path d="M9 20v-6h6v6M9 9h6"/>',
    plan: '<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4L4.2 9.7l5.4-.8z"/>',
    notebook: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    guide: '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>',
    lang: '<path d="M4 6h9M8.5 4v2c0 4-2 7-4.5 8M6 10c1.5 2 3.5 3.5 6 4"/><path d="M13 20l4-9 4 9M14.5 17h5"/>',
    options: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    install: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    title: '<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/>'
  };

  async function menu(G) {
    const pick = await UI.openPanel(L("Menu", "選單"), (body, close) => {
      const grid = el("div", "menu-tiles");
      const items = [
        [L("Ask the docent", "問導覽員"), "ask", L("Directions and tours", "指路和導覽")],
        [L("Look up a room", "查詢展間"), "rooms", L("At the museum", "在博物館裡")],
        [L("My visit plan", "我的參觀計畫"), "plan", L(`${G.plan.size} saved`, `已存 ${G.plan.size} 件`)],
        [L("Notebook", "筆記本"), "notebook", L(`${G.seen.size}/${TOTAL()} seen · stamps`, `已看 ${G.seen.size}/${TOTAL()} · 印章`)],
        [L("Floor guide", "樓層導覽"), "guide", L("Galleries and rooms", "展廳和展間")],
        [L("中文", "English"), "lang", L("切換成中文", "Switch to English")],
        [L("Options", "設定"), "options", L("Sound, text, route", "音效、文字、路線")],
        [L("About", "關於"), "about", L("Sources and credits", "資料來源與致謝")]
      ];
      if (canInstall(G)) items.push([L("Install as an app", "安裝成 App"), "install", L("Works offline", "可離線使用")]);
      items.push([L("Back to title", "回到標題"), "title", L("Your progress is saved", "進度已儲存")]);
      for (const [label, value, hint] of items) {
        const b = UI.button("", () => close(value), "menu-tile" + (value === "lang" ? " lang-btn" : ""));
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = ICONS[value];
        const text = el("span", "menu-tile-text");
        const name = el("b", "", label);
        if (value === "lang") name.lang = Lang.isZh() ? "en" : "zh-Hant";
        text.append(name, el("small", "", hint));
        b.append(icon, text);
        grid.append(b);
      }
      body.append(grid);
    });
    if (pick === "ask") return Docent.ask(G);
    if (pick === "rooms") return rooms(G);
    if (pick === "notebook") return notebook(G);
    if (pick === "plan") return plan(G);
    if (pick === "guide") return guide(G);
    if (pick === "lang") { G.setLang(Lang.isZh() ? "en" : "zh"); return menu(G); }
    if (pick === "options") return options(G);
    if (pick === "about") return about(G);
    if (pick === "install") return install(G);
    if (pick === "title") { G.save(); G.toTitle(); }
  }

  // ---- the notebook ----

  function spriteCanvas(id, seen) {
    const c = Art.artifactCanvas(ARTIFACT_SPRITES[id], { silhouette: seen ? null : "#4a4256" });
    c.className = "nb-sprite";
    return c;
  }

  function stampBook(G, close) {
    const book = el("section", "stamp-book");
    book.append(el("h3", "", L(`Stamp book · ${G.stamps.size}/${TourData.GALLERIES.length}`, `印章簿 · ${G.stamps.size}/${TourData.GALLERIES.length}`)));
    const slots = el("div", "stamp-slots");
    for (const g of TourData.GALLERIES) {
      const short = TourData.galleryShort(g);
      const slot = el("figure", "stamp-slot" + (G.stamps.has(g.id) ? " earned" : ""));
      slot.append(G.stamps.has(g.id) ? UI.sealCanvas(g.nameZh) : el("span"),
        el("figcaption", "", G.stamps.has(g.id) ? short : L(`${short}: see its highlights, then ask me for the challenge`, `${short}：看完精選後問我挑戰`)));
      slots.append(slot);
    }
    book.append(slots);
    // the second row is earned in the real museum
    const seals = el("div", "stamp-slots seal-row");
    for (const g of TourData.GALLERIES) {
      const short = TourData.galleryShort(g);
      const n = g.tour.filter(id => G.spotted.has(id)).length;
      const earned = n >= TourData.SPOT_SEAL;
      const slot = el("figure", "seal-slot" + (earned ? " earned" : ""));
      slot.append(earned ? UI.sealCanvas(g.nameZh, 72, { round: true }) : el("span"),
        el("figcaption", "", earned ? L(`${short}, in person`, `${short}，親眼看見`)
          : L(`${short}: find ${TourData.SPOT_SEAL} pieces in the real museum (${n}/${TourData.SPOT_SEAL})`, `${short}：在博物館找到${TourData.SPOT_SEAL}件（${n}/${TourData.SPOT_SEAL}）`)));
      seals.append(slot);
    }
    const planBtn = UI.button(L(`My visit plan (${G.plan.size}) ▸`, `我的參觀計畫（${G.plan.size}）▸`), () => close({ plan: true }));
    planBtn.classList.add("plan-link");
    const roomBtn = UI.button(L("Look up a room ▸", "查詢展間 ▸"), () => close({ rooms: true }));
    roomBtn.classList.add("plan-link");
    const links = el("div", "book-links");
    links.append(planBtn, roomBtn);
    book.append(seals, links);
    return book;
  }

  async function notebook(G) {
    const heading = L(`Notebook · ${G.seen.size}/${TOTAL()} seen`, `筆記本 · 已看 ${G.seen.size}/${TOTAL()}`);
    const result = await UI.openPanel(heading, (body, close) => {
      const list = () => {
        body.innerHTML = "";
        UI.setPanelBack(null);
        body.append(stampBook(G, close));
        for (const g of TourData.GALLERIES) {
          const sec = el("section", "nb-gallery");
          const seenHere = g.tour.filter(id => G.seen.has(id)).length;
          const h = el("h3");
          h.append(`${g.floor}F · ${TourData.galleryTitle(g)} `);
          if (!Lang.isZh()) h.append(zhSpan(g.nameZh));
          h.append(el("small", "", ` ${Text.roomList(g.rooms)} · ${seenHere}/${g.tour.length}`));
          const bar = el("div", "progress");
          bar.setAttribute("role", "progressbar");
          bar.setAttribute("aria-label", L(`${g.title}: ${seenHere} of ${g.tour.length} seen`, `${g.zh.title}：已看 ${seenHere}/${g.tour.length}`));
          const fill = el("i");
          fill.style.width = `${Math.round((seenHere / g.tour.length) * 100)}%`;
          bar.append(fill);
          const grid = el("div", "nb-grid");
          for (const id of g.tour) {
            const seen = G.seen.has(id);
            const b = UI.button("", () => pieceDetail(body, G, id, { back: list, close }), "nb-item" + (seen ? " seen" : ""));
            b.append(spriteCanvas(id, seen), el("span", "", nameOf(id)));
            if (G.plan.has(id)) b.append(el("i", "nb-star", "★"));
            if (G.spotted.has(id)) b.append(el("i", "nb-spot", "✓"));
            b.setAttribute("aria-label", `${nameOf(id)}${seen ? L(", seen", "，已看過") : L(", not seen yet", "，還沒看過")}${G.plan.has(id) ? L(", on your visit plan", "，在參觀計畫中") : ""}`);
            grid.append(b);
          }
          sec.append(h, bar, grid);
          body.append(sec);
        }
        UI.focusPanel();
      };
      list();
    });
    if (result && result.plan) return plan(G);
    if (result && result.rooms) return rooms(G);
    if (result && result.go) return Docent.walkTo(G, result.go);
  }

  // ---- my visit plan ----

  async function plan(G) {
    const result = await UI.openPanel(L("My visit plan", "我的參觀計畫"), (body, close) => {
      const render = () => {
        body.innerHTML = "";
        const ids = TourData.planOrder([...G.plan]);
        if (!ids.length) {
          const actions = el("div", "nb-actions");
          actions.append(UI.button(L("Open the notebook", "打開筆記本"), () => close({ notebook: true }), "primary"),
            UI.button(L("Look up a room", "查詢展間"), () => close({ rooms: true })));
          body.append(el("p", "", L("Save the pieces you want to see on your real visit: open a piece and tap ☆ Save to my visit, or use the notebook. Your plan puts them in walking order, with floors, rooms and a rough time.",
            "把真正參觀時想看的文物存起來：打開一件文物，點「☆ 加入參觀計畫」，或從筆記本加入。計畫會依參觀路線排好，附上樓層、展間和大約的時間。")), actions);
          return;
        }
        const t = TourData.planMinutes(ids);
        const firstFloor = TourData.galleryOf(ids[0]).floor;
        body.append(
          el("p", "plan-summary", L(`${ids.length} ${ids.length === 1 ? "piece" : "pieces"} · ${TourData.minutesLabel(t)} · start on ${firstFloor}F${ids.length > 1 ? " and walk down" : ""}`,
            `${ids.length} 件 · ${TourData.minutesLabel(t)} · 從${firstFloor}F開始${ids.length > 1 ? "往下走" : ""}`)),
          el("p", "panel-note", L(`The time is a rough guide: ${TourData.MINUTES.pieceLow}–${TourData.MINUTES.pieceHigh} minutes per piece, plus walking between galleries. Displays change, so check npm.gov.tw before you go.`,
            `時間只是粗略估計：每件${TourData.MINUTES.pieceLow}–${TourData.MINUTES.pieceHigh}分鐘，加上展廳之間的走路時間。展品會更換，出發前請先查看 npm.gov.tw。`)));
        for (const floor of [3, 2, 1]) {
          const onFloor = ids.filter(id => TourData.galleryOf(id).floor === floor);
          if (!onFloor.length) continue;
          const sec = el("section", "plan-floor");
          sec.append(el("h3", "", `${floor}F`));
          for (const id of onFloor) {
            const p = piece(id), g = TourData.galleryOf(id);
            const row = el("div", "plan-row");
            const name = el("span", "plan-name");
            name.append(TourData.pieceName(p), el("br"), Lang.isZh() ? p.name : zhSpan(p.nameZh), ` · ${TourData.galleryTitle(g)}`);
            const remove = UI.button("✕", () => { G.togglePlan(id); render(); }, "plan-remove");
            remove.setAttribute("aria-label", L(`Remove the ${p.name} from your plan`, `把${p.nameZh}從計畫移除`));
            row.append(el("span", "plan-room", p.room), name, remove);
            sec.append(row);
          }
          body.append(sec);
        }
        const actions = el("div", "nb-actions");
        let armed = false;
        const clear = UI.button(L("Clear the plan", "清除計畫"), () => {
          if (!armed) { armed = true; clear.textContent = L("Press again to clear", "再按一次清除"); return; }
          for (const id of ids) G.togglePlan(id);
          render();
        }, "danger");
        actions.append(
          UI.button(L("Walk it with the docent", "請導覽員帶我走"), () => close({ tour: true }), "primary"),
          UI.button(L("Save as an image", "存成圖片"), () => savePlanImage(ids)),
          clear
        );
        body.append(actions);
        UI.focusPanel();
      };
      render();
    });
    if (result && result.tour) return Docent.startTour(G, "plan");
    if (result && result.notebook) return notebook(G);
    if (result && result.rooms) return rooms(G);
  }

  // A tall, phone-friendly picture of the plan, to keep for the real visit.
  async function savePlanImage(ids) {
    const W = 1080, rowH = 104, floors = [3, 2, 1].filter(f => ids.some(id => TourData.galleryOf(id).floor === f));
    const H = 330 + floors.length * 84 + ids.length * rowH + 170;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    const sans = 'system-ui, -apple-system, "Segoe UI", "PingFang TC", sans-serif';
    const serif = '"Songti TC", "Noto Serif TC", "PMingLiU", serif';
    const zh = Lang.isZh();
    const fit = (text, max) => (text.length > max ? text.slice(0, max - 1) + "…" : text);
    ctx.fillStyle = "#f6f0e3";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1f1a1c";
    ctx.fillRect(0, 0, W, 14);
    ctx.fillStyle = "#b5352b";
    ctx.font = `700 34px ${zh ? sans : serif}`;
    ctx.fillText(zh ? "My visit plan" : "我的參觀計畫", 72, 104);
    ctx.fillStyle = "#1f1a1c";
    ctx.font = `800 68px ${sans}`;
    ctx.fillText(L("My visit plan", "我的參觀計畫"), 72, 184);
    const t = TourData.planMinutes(ids);
    ctx.font = `500 32px ${sans}`;
    ctx.fillStyle = "#3a3236";
    ctx.fillText(L(`National Palace Museum, Taipei · ${ids.length} ${ids.length === 1 ? "piece" : "pieces"} · ${TourData.minutesLabel(t)}`,
      `國立故宮博物院 · ${ids.length} 件 · ${TourData.minutesLabel(t)}`), 72, 244);
    let y = 330;
    for (const floor of floors) {
      ctx.fillStyle = "#1f1a1c";
      ctx.font = `800 40px ${sans}`;
      ctx.fillText(`${floor}F`, 72, y);
      ctx.fillRect(72, y + 18, W - 144, 3);
      y += 84;
      for (const id of ids.filter(i => TourData.galleryOf(i).floor === floor)) {
        const p = piece(id);
        ctx.fillStyle = "#2f7d64";
        ctx.fillRect(72, y - 52, 120, 76);
        ctx.fillStyle = "#ffffff";
        ctx.font = `800 36px ${sans}`;
        ctx.textAlign = "center";
        ctx.fillText(p.room, 132, y - 2);
        ctx.textAlign = "left";
        ctx.fillStyle = "#1f1a1c";
        ctx.font = `700 33px ${sans}`;
        ctx.fillText(fit(zh ? p.nameZh : p.name, zh ? 24 : 46), 222, y - 18);
        ctx.fillStyle = "#b5352b";
        ctx.font = `600 28px ${zh ? sans : serif}`;
        ctx.fillText(fit(zh ? p.name : p.nameZh, zh ? 52 : 30), 222, y + 22);
        y += rowH;
      }
    }
    ctx.fillStyle = "#5d5458";
    ctx.font = `500 26px ${sans}`;
    ctx.fillText(L("Rough time: 3–6 min per piece plus walking. Displays change:", "時間為粗估：每件3–6分鐘，加上走路時間。展品會更換，"), 72, H - 110);
    ctx.fillText(L("check npm.gov.tw before you go. Made with Pixel Palace.", "出發前請查看 npm.gov.tw。Pixel Palace 製作。"), 72, H - 72);
    const blob = await new Promise(res => c.toBlob(res, "image/png"));
    const file = new File([blob], "my-visit-plan.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: L("My visit plan", "我的參觀計畫") }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-visit-plan.png";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    UI.toast(L("Saved my-visit-plan.png", "已儲存 my-visit-plan.png"));
  }

  // ---- the floor guide ----

  async function guide(G) {
    const result = await UI.openPanel(L("Floor guide", "樓層導覽"), (body, close) => {
      body.append(el("p", "panel-note", L(`The four permanent exhibitions, with the museum's real room numbers, checked against npm.gov.tw in ${TourData.checked()}. The game's layout is simplified; the floors and rooms are real.`,
        `四個常設展，標示故宮實際的展間號碼，已於${TourData.checked()}對照 npm.gov.tw 查核。遊戲的平面是簡化的，樓層和展間是真的。`)));
      for (const floor of [3, 2, 1]) {
        const sec = el("section", "guide-floor");
        sec.append(el("h3", "", `${floor}F${G.map && G.mode === "play" && G.map.floor === floor ? L(" · you are here", " · 你在這一層") : ""}`));
        for (const g of TourData.GALLERIES.filter(gg => gg.floor === floor)) {
          const row = el("div", "guide-row");
          const label = el("p");
          if (Lang.isZh()) label.append(`${g.zh.name} · ${Text.roomList(g.rooms)} · ${g.tour.length} 件`);
          else label.append(zhSpan(g.nameZh + " "), `${g.name} · ${Text.roomList(g.rooms)} · ${g.tour.length} pieces`);
          row.append(label, UI.button(L("Walk me there", "帶我過去"), () => close({ gallery: g.id })));
          sec.append(row);
        }
        if (floor === 3) sec.append(el("p", "panel-note", L("Room 302, A Gathering of Treasures in the National Palace Museum North and South, shows the Jadeite Cabbage and the Meat-Shaped Stone. The museum lists the Cabbage at the Southern Branch from 8 December 2026 to 7 March 2027.",
          "302室展出翠玉白菜和肉形石。故宮公告翠玉白菜於2026年12月8日至2027年3月7日在南部院區展出。")));
        body.append(sec);
      }
    });
    if (result && result.gallery) return Docent.goToGallery(G, G.galleryInfo(result.gallery));
  }

  // ---- options ----

  async function options(G) {
    await UI.openPanel(L("Options", "設定"), body => {
      const toggle = (label, key) => {
        const b = UI.button("", () => { G.setSetting(key, !G.settings[key]); b.paint(); }, "switch");
        b.setAttribute("role", "switch");
        b.paint = () => { b.textContent = `${label()}: ${G.settings[key] ? L("on", "開") : L("off", "關")}`; b.setAttribute("aria-checked", String(G.settings[key])); };
        return b;
      };
      const list = el("div", "menu-list");
      const lang = UI.button("", () => { G.setLang(Lang.isZh() ? "en" : "zh"); UI.setPanelTitle(L("Options", "設定")); repaint(); });
      const speeds = ["slow", "normal", "fast", "instant"];
      const speedName = s => L(s, { slow: "慢", normal: "一般", fast: "快", instant: "立即" }[s]);
      const sp = UI.button("", () => { G.setSetting("textSpeed", speeds[(speeds.indexOf(G.settings.textSpeed) + 1) % speeds.length]); repaint(); });
      const toggles = [
        toggle(() => L("Sound", "音效"), "sound"),
        toggle(() => L("Music", "音樂"), "music"),
        toggle(() => L("Docent talks when I walk up to a case", "走到展櫃前導覽員自動介紹"), "autoTalk"),
        toggle(() => L("Step-free route (use the elevator)", "無障礙路線（搭電梯）"), "stepFree")
      ];
      let armed = false;
      const reset = UI.button("", () => {
        if (!armed) { armed = true; reset.textContent = L("Press again to erase all progress", "再按一次清除所有進度"); return; }
        G.resetProgress();
        reset.textContent = L("Notebook cleared", "筆記本已清除");
        reset.disabled = true;
      }, "danger");
      function repaint() {
        lang.textContent = L("Language: English", "語言：中文");
        sp.textContent = `${L("Text speed", "文字速度")}: ${speedName(G.settings.textSpeed)}`;
        reset.textContent = reset.disabled ? L("Notebook cleared", "筆記本已清除")
          : armed ? L("Press again to erase all progress", "再按一次清除所有進度") : L("Reset my notebook", "重設筆記本");
        for (const t of toggles) t.paint();
      }
      repaint();
      list.append(lang, ...toggles, sp, reset);
      body.append(list);
    });
  }

  // ---- installing ----

  const standalone = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function canInstall(G) {
    return !standalone() && (!!G.installPrompt || isIOS());
  }

  async function install(G) {
    if (G.installPrompt) {
      const prompt = G.installPrompt;
      G.installPrompt = null;
      prompt.prompt();
      await prompt.userChoice.catch(() => null);
      return;
    }
    await UI.say([
      L("To install on an iPhone or iPad, tap the Share button in Safari, then choose Add to Home Screen.", "在 iPhone 或 iPad 上，點 Safari 的「分享」按鈕，再選「加入主畫面」。"),
      L("It opens full screen and keeps working without Wi-Fi.", "它會以全螢幕開啟，沒有 Wi-Fi 也能用。")
    ]);
  }

  async function about(G) {
    const noPhoto = Object.values(TourData.PIECES).filter(p => !p.photo).length;
    await UI.openPanel(L("About this game", "關於這個遊戲"), body => {
      const paras = [
        L(`Pixel Palace is a walk through the four permanent exhibitions of the National Palace Museum in Taipei, with a junior docent who introduces each of its ${TOTAL()} pieces. Inside the real museum, Look up a room shows every piece in the room you're standing in.`,
          `Pixel Palace 帶你走過臺北國立故宮博物院的四個常設展，由小小導覽員介紹這裡的${TOTAL()}件文物。在真正的博物館裡，用「查詢展間」就能看到你所在展間的每件文物。`),
        L("It's an independent student project, not affiliated with or endorsed by the National Palace Museum.", "這是學生的獨立作品，與國立故宮博物院沒有隸屬或背書關係。"),
        L(`Accuracy: the exhibition titles, floors and room numbers come from the museum's Exhibition Floor Plan, checked in ${TourData.checked()}. Every piece here is one the museum itself lists for that gallery, in its Selections by Gallery pages or its Classic Tour route. Everything the docent says is drawn from the museum's own description of that piece, which you can open from the notebook.`,
          `正確性：展覽名稱、樓層和展間號碼來自故宮的展覽平面圖，於${TourData.checked()}查核。每一件文物都是故宮在「展廳精選」或經典導覽路線中為該展廳列出的。導覽員說的內容都取自故宮對該件文物的介紹，可以從筆記本打開原頁面。`),
        L("Each exhibition opens from its real side of the grand staircase, as on the museum's floor plans, but the halls are a simplified map: only the four permanent exhibitions are open, and distances and rooms are simplified. Objects on display do change, so check npm.gov.tw before a visit.",
          "每個展覽的入口都在大樓梯真正的那一側，與故宮的樓層平面圖相同；不過大廳是簡化的地圖：只開放四個常設展，距離和展間也都有簡化。展品會更換，參觀前請查看 npm.gov.tw。"),
        L("Once it has loaded, the whole game is saved on your device, so it keeps working without Wi-Fi. Your progress stays on this device too; nothing is sent anywhere.",
          "載入一次後，整個遊戲就存在你的裝置上，沒有 Wi-Fi 也能用。你的進度也只存在這台裝置，不會傳到任何地方。"),
        L(`Artifact photographs: National Palace Museum, Taipei, Open Data (digitalarchive.npm.gov.tw/opendata), released under CC0 for low-resolution images and CC BY 4.0. The pixel versions on the display cases are made from those photos. ${noPhoto} pieces have no openly licensed photo in the game yet.`,
          `文物照片：國立故宮博物院 Open Data（digitalarchive.npm.gov.tw/opendata），低階圖像以 CC0、其他以 CC BY 4.0 開放。展櫃上的像素圖由這些照片製作。還有${noPhoto}件文物目前沒有開放授權的照片。`),
        Docent.controlsHint()
      ];
      for (const t of paras) body.append(el("p", "", t));
    });
  }

  root.Panels = { menu, notebook, rooms, plan, guide, options, about, install, pieceDetail, tourPreview };
})(typeof globalThis !== "undefined" ? globalThis : this);
