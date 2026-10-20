/*
  Procedural pixel drawing for everything that is not a person: floors,
  walls, the grand staircase, doors, display cases, pillars. Each map's
  unchanging layer is drawn once into its own canvas (drawStatic); things a
  person can walk behind (pillars, plants, signs, cases) are drawn every
  frame, sorted by depth, by the renderer.
*/
(function (root) {
  const T = 16;

  const LOBBY = {
    floorA: "#f2e9d6", floorB: "#ece1ca", grout: "#dccfb2", vein: "#ddd0b3",
    carpet: "#b8332b", carpetDark: "#9a2a24", gold: "#e2b84a", goldDark: "#b88a2c", goldLight: "#f4d88a",
    rug: "#2c4a7c", rugEdge: "#1f3459", rugDot: "#e8dfc8",
    wallTop: "#2b2433", wallEdge: "#4b4058", plaster: "#f3e9d5", plasterShade: "#e6d9bf",
    jade: "#2f7d64", jadeLight: "#47a081", wood: "#8d5b36", woodDark: "#6f4527", woodLight: "#b07a48", base: "#563520"
  };

  const GALLERY_COLORS = {
    "bronze": { wall: "#2e625c", wallDark: "#224a45", accent: "#d4aa4c" },
    "jade": { wall: "#3b6b52", wallDark: "#2b503d", accent: "#cfe3c4" },
    "ceramics": { wall: "#2e4f7c", wallDark: "#213b5f", accent: "#d6e4f2" },
    "precious-crafts": { wall: "#7a2f2c", wallDark: "#5a2220", accent: "#e2b84a" }
  };

  const PARQUET = ["#5c4535", "#553f30", "#614a39", "#584232", "#5f4636"];

  const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0);

  function px(ctx, color, x, y, w = 1, h = 1) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function lerpColor(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = s => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * k);
    return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  }

  const tile = (map, x, y) => World.tileAt(map, x, y);

  // ---- floors ----

  // big marble slabs, two tiles square, with a darker inlaid band around
  // the edge of the hall
  function marble(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    const border = x === 1 || x === map.w - 2 || y === 3 || y === map.h - 2;
    if (border) {
      px(ctx, "#d8c49c", X, Y, T, T);
      px(ctx, "#c4ac80", X, Y, T, 1);
      const inner = (x === 1 && 13) || (x === map.w - 2 && 2) || 0;
      if (y === 3) px(ctx, LOBBY.goldDark, X, Y + 12, T, 1);
      if (y === map.h - 2) px(ctx, LOBBY.goldDark, X, Y + 3, T, 1);
      if (inner) px(ctx, LOBBY.goldDark, X + inner, Y, 1, T);
      if ((x + y) % 2 === 0) px(ctx, "#e9dcbf", X + 6, Y + 6, 4, 4);
      return;
    }
    const sx = x >> 1, sy = y >> 1;
    px(ctx, (sx + sy) & 1 ? LOBBY.floorB : LOBBY.floorA, X, Y, T, T);
    if (!(x & 1)) px(ctx, LOBBY.grout, X, Y, 1, T);
    if (!(y & 1)) px(ctx, LOBBY.grout, X, Y, T, 1);
    const h = hash(sx, sy);
    if (h % 3 === 0 && (x & 1) === (h & 1)) {
      const vx = X + 2 + (h % 9), vy = Y + 3 + ((h >> 3) % 8);
      for (let i = 0; i < 6; i++) px(ctx, LOBBY.vein, vx + i, vy + (i >> 1));
    }
  }

  // Long boards, four to a tile, each about two tiles long with staggered
  // joints, low-contrast seams and a little grain, so it reads as a
  // polished wooden floor rather than brick.
  const BOARD = 30;
  function parquet(ctx, x, y, light) {
    const X = x * T, Y = y * T;
    for (let r = 0; r < 4; r++) {
      const row = y * 4 + r, rowY = Y + r * 4;
      const offset = hash(row, 11) % BOARD;
      let gx = X;
      while (gx < X + T) {
        const board = Math.floor((gx + offset) / BOARD);
        const end = Math.min(X + T, (board + 1) * BOARD - offset);
        let tone = PARQUET[hash(board, row) % PARQUET.length];
        if (light) tone = lerpColor(tone, "#9a7a56", 0.3);
        px(ctx, tone, gx, rowY, end - gx, 4);
        px(ctx, lerpColor(tone, "#2a1d16", 0.35), gx, rowY + 3, end - gx, 1);
        // a few streaks of grain
        const h = hash(board * 7 + 3, row);
        if (h % 3 === 0) px(ctx, lerpColor(tone, "#8a6a4e", 0.35), Math.max(gx, X + (h % 12)), rowY + 1, 4, 1);
        if (end < X + T || (end === X + T && (end + offset) % BOARD === 0)) px(ctx, lerpColor(tone, "#2a1d16", 0.45), end - 1, rowY, 1, 3);
        gx = end;
      }
    }
  }

  function floor(ctx, map, x, y) {
    if (map.kind === "gallery") parquet(ctx, x, y, false);
    else marble(ctx, map, x, y);
  }

  function carpet(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    px(ctx, LOBBY.carpet, X, Y, T, T);
    for (let i = 0; i < T; i += 4) px(ctx, LOBBY.carpetDark, X, Y + i + 2, T, 1);
    const edge = (dx, dy) => !"=uvm".includes(tile(map, x + dx, y + dy));
    if (edge(-1, 0)) { px(ctx, LOBBY.gold, X, Y, 2, T); px(ctx, LOBBY.goldDark, X + 2, Y, 1, T); }
    if (edge(1, 0)) { px(ctx, LOBBY.gold, X + 14, Y, 2, T); px(ctx, LOBBY.goldDark, X + 13, Y, 1, T); }
  }

  function rug(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    px(ctx, LOBBY.rug, X, Y, T, T);
    for (let yy = 1; yy < T; yy += 4) for (let xx = 1; xx < T; xx += 4) px(ctx, LOBBY.rugDot, X + xx + ((yy >> 2) & 1) * 2, Y + yy);
    const not = (dx, dy) => tile(map, x + dx, y + dy) !== ",";
    if (not(0, -1)) { px(ctx, LOBBY.gold, X, Y, T, 2); px(ctx, LOBBY.rugEdge, X, Y + 2, T, 1); }
    if (not(0, 1)) { px(ctx, LOBBY.gold, X, Y + 14, T, 2); px(ctx, LOBBY.rugEdge, X, Y + 13, T, 1); }
    if (not(-1, 0)) { px(ctx, LOBBY.gold, X, Y, 2, T); px(ctx, LOBBY.rugEdge, X + 2, Y + 2, 1, T - 4); }
    if (not(1, 0)) { px(ctx, LOBBY.gold, X + 14, Y, 2, T); px(ctx, LOBBY.rugEdge, X + 13, Y + 2, 1, T - 4); }
  }

  // ---- walls ----

  // the tiles that show a wall's face, and where doorways are cut into it
  const FACE = "WdrET";
  const isFace = (map, x, y) => FACE.includes(tile(map, x, y));

  function wallTop(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    px(ctx, LOBBY.wallTop, X, Y, T, T);
    const open = (dx, dy) => !"#W dreET".includes(tile(map, x + dx, y + dy)) && tile(map, x + dx, y + dy) !== "m";
    if (y === map.h - 1 && open(0, -1)) px(ctx, "#5a4d68", X, Y, T, 2);
    if (open(1, 0)) px(ctx, LOBBY.wallEdge, X + 14, Y, 2, T);
    if (open(-1, 0)) px(ctx, LOBBY.wallEdge, X, Y, 2, T);
  }

  // A face is two rows tall: a frieze on top, panelling below. A lone face
  // row (a low partition) is all panelling.
  function wallFace(ctx, map, x, y, gal) {
    const X = x * T, Y = y * T;
    const upper = !isFace(map, x, y - 1) && isFace(map, x, y + 1);
    if (gal) {
      if (upper) {
        px(ctx, gal.wall, X, Y, T, T);
        px(ctx, gal.wallDark, X, Y, T, 4);
        px(ctx, gal.accent, X, Y + 4, T, 1);
        if (x % 2 === 0) px(ctx, gal.wallDark, X, Y + 5, 1, T - 5);
      } else {
        px(ctx, gal.wallDark, X, Y, T, T);
        px(ctx, gal.accent, X, Y + 1, T, 1);
        px(ctx, lerpColor(gal.wallDark, "#000000", 0.25), X + 2, Y + 4, T - 4, 8);
        px(ctx, gal.wallDark, X + 3, Y + 5, T - 6, 6);
        px(ctx, "#1c171d", X, Y + 13, T, 3);
      }
      return;
    }
    if (upper) {
      px(ctx, LOBBY.plaster, X, Y, T, T);
      px(ctx, LOBBY.plasterShade, X, Y + T - 2, T, 2);
      px(ctx, LOBBY.jade, X, Y, T, 4);
      // a simple key-fret meander in the frieze
      for (let i = 0; i < T; i++) {
        const m = (x * T + i) % 6;
        if (m === 0 || m === 1) px(ctx, LOBBY.jadeLight, X + i, Y + 1);
        if (m === 1) px(ctx, LOBBY.jadeLight, X + i, Y + 2);
      }
      px(ctx, LOBBY.gold, X, Y + 4, T, 1);
    } else {
      px(ctx, LOBBY.wood, X, Y, T, T);
      px(ctx, LOBBY.woodDark, X, Y, T, 2);
      px(ctx, LOBBY.woodLight, X, Y + 2, T, 1);
      px(ctx, "#7a4c2c", X + 2, Y + 5, T - 4, 1);
      px(ctx, "#7a4c2c", X + 2, Y + 11, T - 4, 1);
      px(ctx, "#7a4c2c", X + 2, Y + 5, 1, 7);
      px(ctx, "#a06c40", X + 13, Y + 5, 1, 7);
      px(ctx, LOBBY.base, X, Y + 13, T, 3);
    }
  }

  function lobbyWindow(ctx, x) {
    const X = x * T + 2, Y = T + 6;
    px(ctx, "#5a371f", X, Y, 12, 9);
    px(ctx, "#cfe6e8", X + 1, Y + 1, 10, 7);
    px(ctx, "#eaf6f6", X + 2, Y + 2, 3, 2);
    px(ctx, "#8a5a36", X + 6, Y + 1, 1, 7);
    px(ctx, "#8a5a36", X + 1, Y + 4, 10, 1);
    for (const [dx, dy] of [[3, 2], [9, 2], [3, 6], [9, 6]]) px(ctx, "#8a5a36", X + dx, Y + dy);
  }

  // a silk banner hanging on the lobby wall, in the floor's colour
  const BANNER = { 1: ["#a8322a", "#7c221c"], 2: ["#2f5e9a", "#214777"], 3: ["#2f7d64", "#215a48"] };
  function banner(ctx, x, floor) {
    const [cloth, shade] = BANNER[floor] || BANNER[1];
    const X = x * T + 3, Y = T + 3, W = 10, H = 26;
    px(ctx, "rgba(40,24,16,0.25)", X + 1, Y + 2, W, H);
    px(ctx, LOBBY.goldDark, X - 2, Y - 1, W + 4, 2);
    px(ctx, LOBBY.gold, X - 2, Y - 1, W + 4, 1);
    px(ctx, cloth, X, Y + 1, W, H - 4);
    px(ctx, shade, X + W - 2, Y + 1, 2, H - 4);
    // a gold roundel and a key-fret band
    px(ctx, LOBBY.gold, X + 3, Y + 6, 4, 4);
    px(ctx, cloth, X + 4, Y + 7, 2, 2);
    for (let i = 0; i < W; i += 2) px(ctx, LOBBY.goldLight, X + i, Y + 14, 1, 1);
    px(ctx, LOBBY.gold, X, Y + 16, W, 1);
    // a swallowtail end
    for (let i = 0; i < 3; i++) {
      px(ctx, cloth, X, Y + H - 3 + i, W / 2 - i, 1);
      px(ctx, shade, X + W / 2 + i, Y + H - 3 + i, W / 2 - i, 1);
    }
  }

  // a small spotlight on a track, along the gallery's top wall
  function trackLight(ctx, x, gal) {
    const X = x * T + 6, Y = T + 1;
    px(ctx, "#121015", X - 4, Y, 12, 1);
    px(ctx, "#2b2730", X, Y + 1, 4, 3);
    px(ctx, "#8a8590", X, Y + 1, 4, 1);
    px(ctx, "#fff3cf", X + 1, Y + 4, 2, 1);
    const g = ctx.createLinearGradient(0, Y + 4, 0, Y + 26);
    g.addColorStop(0, "rgba(255,236,190,0.22)");
    g.addColorStop(1, "rgba(255,236,190,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(X + 1, Y + 4);
    ctx.lineTo(X + 3, Y + 4);
    ctx.lineTo(X + 9, Y + 27);
    ctx.lineTo(X - 5, Y + 27);
    ctx.closePath();
    ctx.fill();
  }

  // a period's sign, set into the gallery floor like a brass-rimmed plaque
  function floorPlaque(ctx, cx, cy, w) {
    const X = Math.round(cx - w / 2), Y = Math.round(cy - 5), H = 10;
    px(ctx, "rgba(0,0,0,0.25)", X + 1, Y + 1, w, H);
    px(ctx, "#b8913f", X, Y, w, H);
    px(ctx, "#1d171c", X + 1, Y + 1, w - 2, H - 2);
    px(ctx, "#e2c27a", X, Y, w, 1);
  }

  function wallPlaque(ctx, x, gal) {
    const X = x * T + 4, Y = T + 7;
    px(ctx, "#17131a", X, Y, 8, 6);
    px(ctx, gal.accent, X + 1, Y + 1, 5, 1);
    px(ctx, "#8b8590", X + 1, Y + 3, 6, 1);
    px(ctx, "#8b8590", X + 1, Y + 4, 4, 1);
  }

  // ---- doorways ----

  // a doorway cut into the lower row `row` of a wall face
  function opening(ctx, x0, w, row, inside, glow) {
    const X0 = x0 * T + 2, X1 = (x0 + w) * T - 2, Y0 = (row - 1) * T + 12, Y1 = (row + 1) * T;
    for (let y = Y0; y < Y1; y++) px(ctx, lerpColor("#120e16", inside, (y - Y0) / (Y1 - Y0)), X0, y, X1 - X0, 1);
    px(ctx, glow, X0, Y1 - 3, X1 - X0, 3);
    return { X0, X1, Y0, Y1 };
  }

  function frame(ctx, o, wood, trim) {
    px(ctx, wood, o.X0 - 2, o.Y0 - 2, 2, o.Y1 - o.Y0 + 2);
    px(ctx, wood, o.X1, o.Y0 - 2, 2, o.Y1 - o.Y0 + 2);
    px(ctx, wood, o.X0 - 2, o.Y0 - 2, o.X1 - o.X0 + 4, 2);
    px(ctx, trim, o.X0, o.Y0, 1, o.Y1 - o.Y0);
    px(ctx, trim, o.X1 - 1, o.Y0, 1, o.Y1 - o.Y0);
    px(ctx, trim, o.X0, o.Y0, o.X1 - o.X0, 1);
  }

  function plaque(ctx, o, fill, border) {
    const X = o.X0 - 6, W = o.X1 - o.X0 + 12, Y = o.Y0 - 11, H = 10;
    px(ctx, border, X, Y, W, H);
    px(ctx, fill, X + 1, Y + 1, W - 2, H - 2);
    px(ctx, border, X + 2, Y + 2, 1, 1);
    px(ctx, border, X + W - 3, Y + 2, 1, 1);
  }

  function galleryDoor(ctx, d) {
    const g = GALLERY_COLORS[d.to];
    const o = opening(ctx, d.x, d.w, d.y, lerpColor(g.wall, "#000000", 0.35), lerpColor(g.wall, "#ffffff", 0.18));
    frame(ctx, o, "#3a2416", LOBBY.gold);
    plaque(ctx, o, "#231b22", "#c9a24a");
  }

  function ropedDoor(ctx, r) {
    const o = opening(ctx, r.x, r.w, r.y, "#3b3542", "#4a4452");
    frame(ctx, o, "#4a4452", "#9a97a3");
    plaque(ctx, o, "#2e2a33", "#9a97a3");
    // brass posts and a sagging velvet rope
    const L = o.X0 + 2, R = o.X1 - 4, top = o.Y1 - 10;
    for (const X of [L, R]) {
      px(ctx, "#b88a2c", X, top, 2, 10);
      px(ctx, "#f4d88a", X, top - 1, 2, 2);
    }
    for (let X = L + 2; X < R; X++) {
      const t = (X - L) / (R - L);
      const sag = Math.round(4 * 4 * t * (1 - t));
      px(ctx, "#b02a2a", X, top + 1 + sag, 1, 2);
      px(ctx, "#6e1a1a", X, top + 3 + sag, 1, 1);
    }
  }

  function elevator(ctx, e) {
    const X = e.x * T, Y = (e.y - 1) * T;
    px(ctx, "#8a909c", X + 1, Y + 9, 14, 23);
    px(ctx, "#cfd4dd", X + 2, Y + 10, 12, 22);
    px(ctx, "#e9ecf1", X + 3, Y + 11, 1, 20);
    px(ctx, "#e9ecf1", X + 9, Y + 11, 1, 20);
    px(ctx, "#6b7180", X + 7, Y + 10, 2, 22);
    px(ctx, "#241f2b", X + 3, Y + 2, 10, 6);
    for (let i = 0; i < 3; i++) {
      px(ctx, "#f2b43d", X + 5 - i + 1, Y + 3 + i, 1 + i * 2 - 1 || 1, 1);
    }
    px(ctx, "#f2b43d", X + 5, Y + 3, 1, 1); px(ctx, "#f2b43d", X + 4, Y + 4, 3, 1); px(ctx, "#f2b43d", X + 3, Y + 5, 5, 1);
    px(ctx, "#f2b43d", X + 8, Y + 4, 5, 1); px(ctx, "#f2b43d", X + 9, Y + 5, 3, 1); px(ctx, "#f2b43d", X + 10, Y + 6, 1, 1);
  }

  function wallText(ctx, t, gal) {
    const X = t.x * T + 2, Y = T + 3, W = t.w * T - 4, H = 2 * T - 7;
    px(ctx, gal.accent, X, Y, W, H);
    px(ctx, "#141117", X + 1, Y + 1, W - 2, H - 2);
    px(ctx, gal.wallDark, X + 2, Y + 2, W - 4, 1);
  }

  // ---- the grand staircase ----

  function flight(ctx, f, up) {
    const rows = f.y1 - f.y0 + 1, steps = rows * 2;
    const runner0 = (f.x0 + 1) * T, runner1 = f.x1 * T;
    for (let s = 0; s < steps; s++) {
      const k = s / (steps - 1);
      const tread = up ? lerpColor("#fbf2df", "#dccaa6", k) : lerpColor("#e9dcc0", "#5e4f40", k);
      const riser = lerpColor(tread, "#6b5a45", 0.45);
      const Y = f.y0 * T + s * 8;
      const X0 = f.x0 * T, W = (f.x1 - f.x0 + 1) * T;
      px(ctx, tread, X0, Y, W, 5);
      px(ctx, lerpColor(tread, "#ffffff", 0.5), X0, Y, W, 1);
      px(ctx, riser, X0, Y + 5, W, 3);
      const red = up ? LOBBY.carpet : lerpColor(LOBBY.carpet, "#2a0e0c", k * 0.7);
      px(ctx, red, runner0, Y, runner1 - runner0, 5);
      px(ctx, lerpColor(red, "#000000", 0.25), runner0, Y + 5, runner1 - runner0, 3);
      px(ctx, LOBBY.gold, runner0, Y + 4, runner1 - runner0, 1);
      px(ctx, LOBBY.goldDark, runner0, Y, 1, 8);
      px(ctx, LOBBY.goldDark, runner1 - 1, Y, 1, 8);
    }
    if (!up) {
      const bottom = (f.y1 + 1) * T;
      const grad = ctx.createLinearGradient(0, bottom - 14, 0, bottom);
      grad.addColorStop(0, "rgba(20,14,22,0)");
      grad.addColorStop(1, "rgba(20,14,22,0.55)");
      ctx.fillStyle = grad;
      ctx.fillRect(f.x0 * T, bottom - 14, (f.x1 - f.x0 + 1) * T, 14);
    }
  }

  function balustrade(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    const isB = (dx, dy) => tile(map, x + dx, y + dy) === "B";
    const L = isB(-1, 0), R = isB(1, 0), U = isB(0, -1), D = isB(0, 1);
    const wood = "#5e3b22", woodHi = "#8a5a36";
    if (L || R) {
      const a = L ? X : X + 6, b = R ? X + T : X + 10;
      px(ctx, "rgba(40,24,12,0.22)", a, Y + 14, b - a, 2);
      for (let bx = a + 1; bx < b - 1; bx += 3) { px(ctx, woodHi, bx, Y + 7, 1, 7); px(ctx, wood, bx + 1, Y + 7, 1, 7); }
      px(ctx, wood, a, Y + 4, b - a, 3);
      px(ctx, LOBBY.gold, a, Y + 3, b - a, 1);
      px(ctx, wood, a, Y + 13, b - a, 1);
    }
    if (U || D) {
      const a = U ? Y : Y + 6, b = D ? Y + T : Y + 10;
      px(ctx, wood, X + 5, a, 6, b - a);
      px(ctx, woodHi, X + 6, a, 1, b - a);
      px(ctx, LOBBY.gold, X + 7, a, 2, b - a);
    }
    px(ctx, "rgba(40,24,12,0.25)", X + 6, Y + 13, 6, 2);
    px(ctx, wood, X + 5, Y + 3, 6, 10);
    px(ctx, woodHi, X + 5, Y + 3, 1, 10);
    px(ctx, LOBBY.gold, X + 5, Y + 1, 6, 3);
    px(ctx, LOBBY.goldLight, X + 6, Y + 1, 3, 1);
  }

  // ---- furniture ----

  function bench(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    const left = tile(map, x - 1, y) !== "b", right = tile(map, x + 1, y) !== "b";
    const a = X + (left ? 1 : 0), b = X + T - (right ? 1 : 0);
    px(ctx, "rgba(30,20,15,0.18)", a + 1, Y + 13, b - a, 3);
    px(ctx, "#c08a55", a, Y + 5, b - a, 4);
    px(ctx, "#d9a46c", a, Y + 5, b - a, 1);
    px(ctx, "#8a5a34", a, Y + 9, b - a, 3);
    if (left) px(ctx, "#5a3a22", X + 2, Y + 12, 2, 3);
    if (right) px(ctx, "#5a3a22", X + 12, Y + 12, 2, 3);
  }

  function desk(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    const left = tile(map, x - 1, y) !== "I", right = tile(map, x + 1, y) !== "I";
    const a = X + (left ? 1 : 0), b = X + T - (right ? 1 : 0);
    px(ctx, "rgba(30,20,15,0.2)", a, Y + 15, b - a, 1);
    px(ctx, "#ead7b2", a, Y + 1, b - a, 6);
    px(ctx, "#f6ead0", a, Y + 1, b - a, 1);
    px(ctx, "#8f5a35", a, Y + 7, b - a, 8);
    px(ctx, LOBBY.gold, a, Y + 7, b - a, 1);
    px(ctx, "#764628", a + 2, Y + 9, b - a - 4, 1);
    px(ctx, "#764628", a + 2, Y + 13, b - a - 4, 1);
    if (!left && !right) {
      // a stack of floor guides on the counter
      px(ctx, "#ffffff", X + 4, Y + 2, 7, 4);
      px(ctx, "#2f7d64", X + 5, Y + 3, 5, 1);
      px(ctx, "#c2382f", X + 5, Y + 4, 3, 1);
    }
  }

  function entrance(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    px(ctx, LOBBY.wallTop, X, Y, T, T);
    px(ctx, "#4b4058", X, Y, T, 2);
    px(ctx, "#a9d6df", X + 1, Y + 2, T - 2, T - 2);
    px(ctx, "#e4f6f8", X + 3, Y + 4, 2, 2);
    px(ctx, "#e4f6f8", X + 5, Y + 6, 2, 2);
    px(ctx, "#7fb4c0", X + 1, Y + 2, 1, T - 2);
    const grad = ctx.createLinearGradient(0, Y, 0, Y - T);
    grad.addColorStop(0, "rgba(255,248,220,0.35)");
    grad.addColorStop(1, "rgba(255,248,220,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(X, Y - T, T, T);
  }

  function exitMat(ctx, map, x, y) {
    const X = x * T, Y = y * T;
    px(ctx, "#f3e3c0", X, Y, T, T);
    px(ctx, "#3a2416", X + 1, Y, T - 2, 13);
    px(ctx, "#7a4a2e", X + 2, Y, T - 4, 12);
    for (const r of [3, 6, 9]) px(ctx, "#5c3520", X + 2, Y + r, T - 4, 1);
    const grad = ctx.createLinearGradient(0, Y, 0, Y - 2 * T);
    grad.addColorStop(0, "rgba(255,240,205,0.28)");
    grad.addColorStop(1, "rgba(255,240,205,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(X, Y - 2 * T, T, 2 * T);
  }

  // midpoint circle, one pixel wide, for the inlay ring around a star case
  function ring(ctx, cx, cy, r, color) {
    let x = r, y = 0, err = 1 - r;
    ctx.fillStyle = color;
    while (x >= y) {
      for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) ctx.fillRect(cx + a, cy + b, 1, 1);
      y++;
      if (err < 0) err += 2 * y + 1;
      else { x--; err += 2 * (y - x) + 1; }
    }
  }

  // ---- the whole unchanging layer of a map ----

  function drawStatic(map, starIds = []) {
    const canvas = Art.makeCanvas(map.w * T, map.h * T);
    const ctx = canvas.getContext("2d");
    const gal = map.kind === "gallery" ? GALLERY_COLORS[map.gallery] : null;

    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const t = tile(map, x, y);
        if (t === "#") wallTop(ctx, map, x, y);
        else if (FACE.includes(t)) wallFace(ctx, map, x, y, gal);
        else if (t === "=") carpet(ctx, map, x, y);
        else if (t === ",") { if (gal) parquet(ctx, x, y, true); else rug(ctx, map, x, y); }
        else if (t === "m") { if (gal) exitMat(ctx, map, x, y); else entrance(ctx, map, x, y); }
        else floor(ctx, map, x, y);
      }
    }
    // the top wall's face also runs behind the doorway rows
    for (let x = 1; x < map.w - 1; x++) wallFace(ctx, map, x, 1, gal);

    if (map.upFlight) flight(ctx, map.upFlight, true);
    if (map.downFlight) flight(ctx, map.downFlight, false);

    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const t = tile(map, x, y);
        if (t === "B") balustrade(ctx, map, x, y);
        else if (t === "b") bench(ctx, map, x, y);
        else if (t === "I") desk(ctx, map, x, y);
      }
    }

    if (gal) {
      for (let x = 2; x < map.w - 2; x++) {
        const clear = [-1, 0, 1].every(d => tile(map, x + d, 2) === "W");
        if (clear && x % 5 === 3) wallPlaque(ctx, x, gal);
        else if (clear && x % 5 === 0) trackLight(ctx, x, gal);
      }
      if (map.wallText) wallText(ctx, map.wallText, gal);
      for (const c of map.cases.filter(cc => starIds.includes(cc.id))) {
        const cx = (c.x + 1) * T, cy = (c.y + 1) * T + 2;
        ring(ctx, cx, cy, 27, "#b8913f");
        ring(ctx, cx, cy, 24, "#8a6a30");
      }
    } else {
      // windows and banners alternate along any clear stretch of wall, and a
      // banner hangs in the alcove between a pair of pillars
      const alcove = x => tile(map, x - 1, 3) === "P" ? tile(map, x + 2, 3) === "P" : false;
      let last = -9, n = 0;
      for (let x = 2; x < map.w - 2; x++) {
        if (tile(map, x, 2) === "W" && tile(map, x + 1, 2) === "W" && alcove(x)) {
          banner(ctx, x + 0.5, map.floor);
          last = x + 1;
          n++;
          continue;
        }
        const clear = [-1, 0, 1].every(d => tile(map, x + d, 2) === "W" && tile(map, x + d, 3) !== "P");
        if (!clear || x - last < 3) continue;
        if (n++ % 2) lobbyWindow(ctx, x);
        else banner(ctx, x, map.floor);
        last = x;
      }
    }
    for (const d of map.doors) galleryDoor(ctx, d);
    for (const r of map.ropes) ropedDoor(ctx, r);
    for (const e of map.elevators) elevator(ctx, e);

    if (gal) {
      for (const sec of map.sections) floorPlaque(ctx, (sec.x + 0.5) * T, sec.y * T, sectionWidth(map, sec));
    }

    // every wall face casts a soft shadow on the floor in front of it
    const shade = ctx.createLinearGradient(0, 0, 0, 7);
    shade.addColorStop(0, "rgba(30,18,26,0.30)");
    shade.addColorStop(1, "rgba(30,18,26,0)");
    ctx.fillStyle = shade;
    for (let y = 1; y < map.h; y++) {
      for (let x = 1; x < map.w - 1; x++) {
        if (!isFace(map, x, y - 1) || isFace(map, x, y) || tile(map, x, y) === "#") continue;
        ctx.save();
        ctx.translate(x * T, y * T);
        ctx.fillRect(0, 0, T, 7);
        ctx.restore();
      }
    }

    if (gal) {
      // a darker room, with a pool of light around every case
      ctx.fillStyle = "rgba(14,10,18,0.30)";
      ctx.fillRect(T, 3 * T, (map.w - 2) * T, (map.h - 4) * T);
      ctx.globalCompositeOperation = "screen";
      for (const c of map.cases) {
        const cx = (c.x + 1) * T, cy = (c.y + 1) * T + 6;
        const light = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
        light.addColorStop(0, "rgba(255,232,180,0.40)");
        light.addColorStop(1, "rgba(255,232,180,0)");
        ctx.fillStyle = light;
        ctx.fillRect(cx - 36, cy - 36, 72, 72);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    return canvas;
  }

  // wide enough for the period's name in either language
  function sectionWidth(map, sec) {
    const g = root.TourData && root.TourData.GALLERIES.find(gg => gg.id === map.gallery);
    const p = g && g.periods[sec.period];
    if (!p) return 48;
    return Math.round(Math.max(p.en.length * 3.4 + 12, p.zh.length * 7 + 12));
  }

  // ---- objects drawn every frame, sorted by depth ----

  // Brass posts with a velvet rope around three sides of each star piece;
  // the front stays open so you can walk up to it.
  function stanchions(map, starIds) {
    const out = [];
    for (const c of map.cases.filter(cc => starIds.includes(cc.id))) {
      const L = (c.x - 1) * T + 8, R = (c.x + 2) * T + 8, B = (c.y - 1) * T + 8, F = (c.y + 2) * T + 2;
      out.push({ kind: "post", px: L, py: B, ropes: [[R, B], [L, F]], depth: (c.y - 1) * T + 12 });
      out.push({ kind: "post", px: R, py: B, ropes: [[R, F]], depth: (c.y - 1) * T + 12 });
      out.push({ kind: "post", px: L, py: F, ropes: [], depth: (c.y + 2) * T + 4 });
      out.push({ kind: "post", px: R, py: F, ropes: [], depth: (c.y + 2) * T + 4 });
    }
    return out;
  }

  function post(ctx, o) {
    for (const [x2, y2] of o.ropes) {
      // a rope sagging between two posts
      const steps = Math.max(Math.abs(x2 - o.px), Math.abs(y2 - o.py));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const sag = Math.abs(y2 - o.py) < 2 ? Math.round(4 * 3 * t * (1 - t)) : 0;
        const x = Math.round(o.px + (x2 - o.px) * t), y = Math.round(o.py - 9 + (y2 - o.py) * t + sag);
        px(ctx, "#9c2424", x, y, 1, 2);
        px(ctx, "#5e1414", x, y + 2, 1, 1);
      }
    }
    const X = o.px - 1, Y = o.py - 12;
    px(ctx, "rgba(0,0,0,0.25)", X - 1, Y + 12, 5, 2);
    px(ctx, "#8a6a30", X, Y + 2, 3, 10);
    px(ctx, "#e2c27a", X, Y + 2, 1, 10);
    px(ctx, "#f4d88a", X - 1, Y, 5, 3);
    px(ctx, "#8a6a30", X - 1, Y + 11, 5, 2);
  }

  function staticObjects(map, starIds = []) {
    const out = [];
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const t = tile(map, x, y);
        if (t === "P") out.push({ kind: "pillar", x, y, depth: (y + 1) * T });
        else if (t === "p") out.push({ kind: "plant", x, y, depth: (y + 1) * T });
        else if (t === "s") out.push({ kind: "sign", x, y, depth: (y + 1) * T });
      }
    }
    for (const c of map.cases) out.push({ kind: "case", x: c.x, y: c.y, case: c, depth: (c.y + c.h) * T });
    if (map.kind === "gallery") out.push(...stanchions(map, starIds));
    return out;
  }

  function pillar(ctx, x, y) {
    const X = x * T, Y = y * T;
    px(ctx, "rgba(40,25,20,0.22)", X + 4, Y + 13, 12, 3);
    px(ctx, "#d6c9ae", X + 2, Y + 10, 12, 6);
    px(ctx, "#efe5cf", X + 2, Y + 10, 12, 1);
    px(ctx, "#a8987a", X + 2, Y + 15, 12, 1);
    px(ctx, "#c43c2d", X + 4, Y - 22, 8, 32);
    px(ctx, "#e7664f", X + 5, Y - 22, 1, 32);
    px(ctx, "#d84f3a", X + 6, Y - 22, 1, 32);
    px(ctx, "#8f2a20", X + 10, Y - 22, 2, 32);
    px(ctx, "#2f7d64", X + 3, Y - 22, 10, 2);
    px(ctx, LOBBY.gold, X + 2, Y - 26, 12, 4);
    px(ctx, LOBBY.goldLight, X + 2, Y - 26, 12, 1);
    px(ctx, LOBBY.goldDark, X + 2, Y - 23, 12, 1);
  }

  const decorCache = {};
  function decor(name) {
    if (!decorCache[name]) decorCache[name] = Art.fromRows(Art.DECOR[name].rows, Art.DECOR[name].pal);
    return decorCache[name];
  }

  function plant(ctx, x, y) {
    const img = decor("plant");
    ctx.drawImage(img, x * T, y * T + T - img.height);
  }

  function sign(ctx, x, y) {
    const img = decor("sign");
    ctx.drawImage(img, x * T, y * T + T - img.height + 2);
  }

  // Returns the y of the glass top, so the renderer can place a sparkle there.
  // The vitrine fills the whole 2-tile width; a tall object makes the glass
  // rise above the case's footprint, the way a real vitrine stands tall.
  function displayCase(ctx, c, sprite, { star = false, time = 0 } = {}) {
    const X = c.x * T, Y = c.y * T;
    const L = X + 1, R = X + 31, W = R - L;
    px(ctx, "rgba(0,0,0,0.28)", X, Y + 28, 32, 4);
    px(ctx, star ? "#3a1d1d" : "#262028", L, Y + 18, W, 12);
    px(ctx, star ? "#c9a24a" : "#5a4f5e", L, Y + 18, W, 1);
    px(ctx, "#17121a", L, Y + 29, W, 1);
    px(ctx, "#efe6d0", X + 12, Y + 22, 8, 5);
    px(ctx, "#8a7f70", X + 13, Y + 23, 6, 1);
    px(ctx, "#8a7f70", X + 13, Y + 25, 4, 1);
    px(ctx, star ? "#6b2a2a" : "#4a4150", L, Y + 14, W, 4);
    px(ctx, star ? "#8a3a36" : "#5d5363", L, Y + 14, W, 1);
    let top = Y - 2;
    if (sprite) {
      const sx = X + 16 - Math.floor(sprite.width / 2), sy = Y + 16 - sprite.height;
      ctx.drawImage(sprite, sx, sy);
      top = Math.min(top, sy - 3);
    }
    const H = Y + 17 - top;
    ctx.fillStyle = "rgba(190,225,255,0.09)";
    ctx.fillRect(L, top, W, H);
    px(ctx, "rgba(225,240,255,0.30)", L, top, W, 3);
    px(ctx, "rgba(255,255,255,0.65)", L, top, W, 1);
    px(ctx, "rgba(255,255,255,0.5)", L, top, 1, H);
    px(ctx, "rgba(255,255,255,0.35)", R - 1, top, 1, H);
    px(ctx, "rgba(255,255,255,0.35)", L, Y + 17, W, 1);
    for (let i = 0; i < 7; i++) px(ctx, "rgba(255,255,255,0.35)", L + 3 + i, Y + 12 - i);
    for (let i = 0; i < 3; i++) px(ctx, "rgba(255,255,255,0.35)", L + 7 + i, Y + 12 - i);
    // now and then a gleam of light slides across the glass
    const phase = (time * 0.18 + (c.order || 0) * 0.137) % 1;
    if (phase < 0.22) {
      const gx = L + Math.round((phase / 0.22) * (W + H));
      for (let i = 0; i < H; i++) {
        const x = gx - i;
        if (x > L && x < R - 1) px(ctx, "rgba(255,255,255,0.28)", x, top + i, 2, 1);
      }
    }
    if (star) {
      px(ctx, LOBBY.gold, L, top, 2, 2);
      px(ctx, LOBBY.gold, R - 2, top, 2, 2);
    }
    return top;
  }

  // ---- crisp text, drawn by the renderer after upscaling ----

  // Built again whenever the language changes (see render.js).
  function labels(map, galleries) {
    const L = root.Lang ? root.Lang.L : (en => en);
    const out = [];
    const info = id => galleries.find(g => g.id === id);
    for (const d of map.doors) {
      const g = info(d.to);
      const rooms = g.rooms.join(" · ");
      out.push({ x: (d.x + d.w / 2) * T, y: (d.y - 1) * T + 6, w: d.w * T + 10, h: 8, lines: [{ text: g.nameZh, zh: true }], color: "#f4d88a" });
      out.push({ x: (d.x + d.w / 2) * T, y: (d.y + 1) * T + 5, w: d.w * T + 18, h: 7, lines: [{ text: rooms }], pill: "#231b22", color: "#f4d88a", layer: "floor" });
    }
    for (const r of map.ropes) {
      const text = r.sign === "treasures302" ? "302" : L("Rotating", "特展");
      out.push({ x: (r.x + r.w / 2) * T, y: (r.y - 1) * T + 6, w: r.w * T + 10, h: 8, lines: [{ text, zh: text === "特展" }], color: "#d9d6e0" });
    }
    // period signs on the floor, like the sections of a real exhibition
    if (map.kind === "gallery") {
      const g = info(map.gallery);
      for (const sec of map.sections) {
        const text = L(g.periods[sec.period].en, g.periods[sec.period].zh);
        const zh = text !== g.periods[sec.period].en;
        out.push({ x: (sec.x + 0.5) * T, y: sec.y * T, w: sectionWidth(map, sec) - 4, h: 7, lines: [{ text, zh }], color: "#f1dd9e", layer: "floor" });
      }
    }
    for (const r of map.rooms) {
      // on the floor at the room's lower-left, clear of the top bar
      const text = L(`Room ${r.room}`, `${r.room} 室`);
      const at = r.label || { x: r.x0, y: r.y1 != null ? r.y1 : map.h - 2 };
      out.push({ x: (at.x + 1.6) * T, y: at.y * T + 8, w: 34, h: 8, lines: [{ text, zh: text.includes("室") }], pill: "rgba(23,18,28,0.78)", color: "#f4d88a", layer: "floor" });
    }
    if (map.wallText) {
      const g = info(map.gallery);
      const t = map.wallText;
      out.push({
        x: (t.x + t.w / 2) * T, y: T + 3 + (2 * T - 7) / 2, w: t.w * T - 8, h: 2 * T - 10,
        lines: [{ text: g.nameZh, zh: true, size: 1.25 }, { text: L(g.title, g.zh.short), size: 0.62, zh: !!root.Lang && root.Lang.isZh() }], color: "#f4ead4"
      });
    }
    if (map.upFlight) {
      const f = map.upFlight;
      out.push({ x: (f.x0 + f.x1 + 1) / 2 * T, y: (f.y1 + 1) * T + 8, w: 28, h: 8, lines: [{ text: `▲ ${map.floor + 1}F` }], pill: "rgba(35,27,34,0.85)", color: "#f4d88a", layer: "floor" });
    }
    if (map.downFlight) {
      const f = map.downFlight;
      out.push({ x: (f.x0 + f.x1 + 1) / 2 * T, y: (f.y0 - 1) * T + 8, w: 28, h: 8, lines: [{ text: `▼ ${map.floor - 1}F` }], pill: "rgba(35,27,34,0.85)", color: "#f4d88a", layer: "floor" });
    }
    return out;
  }

  const api = { T, LOBBY, GALLERY_COLORS, drawStatic, staticObjects, pillar, plant, sign, post, displayCase, labels, lerpColor };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Tiles = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
