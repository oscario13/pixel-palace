/*
  Draws one frame. Everything is drawn at native pixel size (16px tiles)
  into small buffers the size of the view, then scaled up by a whole
  number onto the screen canvas so pixels stay square and sharp.

  The order, back to front:
    1. the floor and walls, with floor signs drawn crisply on top
    2. cases, pillars and people, sorted by depth, on a second buffer, so
       people walk over the floor signs rather than under them
    3. light: sun shafts in the lobbies, drifting dust in the galleries'
       spotlights, and a spotlight on the piece being talked about
    4. wall and door signs, the vignette, and the iris between rooms
*/
(function (root) {
  const T = 16;
  const BG = "#17121c";
  const ZH_FONT = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif';
  const LATIN_FONT = 'system-ui,-apple-system,"Segoe UI","Helvetica Neue",sans-serif';
  const MOTES_PER_CASE = 5;

  function create(canvas, { world, galleries, stars }) {
    const ctx = canvas.getContext("2d");
    const buf = document.createElement("canvas");
    const bctx = buf.getContext("2d");
    const top = document.createElement("canvas");
    const tctx = top.getContext("2d");
    const mapCache = {};
    const frameCache = {};
    const spriteCache = {};
    const view = { scale: 3, w: 320, h: 200, dpr: 1, safeBottom: 0, insetTop: 0 };
    const cam = { x: 0, y: 0 };
    let lastMap = null;
    let vignette = null;
    let motes = [];

    function mapLayer(map) {
      if (!mapCache[map.id]) {
        mapCache[map.id] = {
          base: Tiles.drawStatic(map, stars),
          objects: Tiles.staticObjects(map, stars),
          labels: null
        };
      }
      return mapCache[map.id];
    }

    // signs are text, so they're rebuilt when the language changes
    function relabel() {
      for (const layer of Object.values(mapCache)) layer.labels = null;
    }

    function frames(look) {
      if (!frameCache[look]) frameCache[look] = Art.characterFrames(look);
      return frameCache[look];
    }

    function artifactSprite(id) {
      if (!spriteCache[id]) spriteCache[id] = Art.artifactCanvas(ARTIFACT_SPRITES[id]);
      return spriteCache[id];
    }

    // Whole-number scale chosen so roughly 17x11 tiles (landscape) or
    // 9x12 (portrait) fit on screen.
    function resize(safeBottomCss = 0) {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const cw = Math.round(canvas.clientWidth * dpr), ch = Math.round(canvas.clientHeight * dpr);
      canvas.width = cw;
      canvas.height = ch;
      const landscape = cw > ch;
      const tilesX = landscape ? 17 : 9, tilesY = landscape ? 11 : 12;
      view.scale = Math.max(1, Math.floor(Math.min(cw / (T * tilesX), ch / (T * tilesY))));
      view.w = Math.ceil(cw / view.scale);
      view.h = Math.ceil(ch / view.scale);
      view.dpr = dpr;
      view.safeBottom = Math.round((safeBottomCss * dpr) / view.scale);
      buf.width = top.width = view.w;
      buf.height = top.height = view.h;
      vignette = null;
    }

    // Screen space the HUD, card or text box are covering, in CSS pixels;
    // the camera keeps the player in the part that's still visible.
    function setInsets(topCss, bottomCss) {
      view.insetTop = Math.round((topCss * view.dpr) / view.scale);
      view.safeBottom = Math.round((bottomCss * view.dpr) / view.scale);
    }

    function cameraTarget(map, focusX, focusY) {
      const mw = map.w * T, mh = map.h * T;
      let topInset = view.insetTop;
      let effH = view.h - view.safeBottom - topInset;
      if (effH < T * 4) { topInset = 0; effH = Math.max(T * 4, view.h - view.safeBottom); }
      const x = mw <= view.w ? -Math.floor((view.w - mw) / 2) : clamp(Math.round(focusX - view.w / 2), 0, mw - view.w);
      const y = mh <= effH ? -topInset - Math.floor((effH - mh) / 2) : clamp(Math.round(focusY - topInset - effH / 2), -topInset, mh - effH - topInset);
      return { x, y };
    }

    function placeCamera(map, focusX, focusY, dt, smooth) {
      const t = cameraTarget(map, focusX, focusY);
      if (map.id !== lastMap || !smooth) {
        if (map.id !== lastMap) spawnMotes(map);
        lastMap = map.id;
        cam.x = t.x;
        cam.y = t.y;
        return;
      }
      const k = 1 - Math.exp(-dt * 8);
      cam.x = Math.abs(t.x - cam.x) < 0.5 ? t.x : cam.x + (t.x - cam.x) * k;
      cam.y = Math.abs(t.y - cam.y) < 0.5 ? t.y : cam.y + (t.y - cam.y) * k;
    }

    // ---- people ----

    function drawActor(a, time) {
      if (!a || a.hidden) return;
      const set = frames(a.look)[a.dir];
      let img = set[a.frame || 0];
      // blink now and then when standing facing us
      if (!a.moving && set.blink) {
        const seed = (a.id || "").length * 0.37;
        if ((time + seed) % 3.6 < 0.13) img = set.blink;
      }
      // a one-pixel bounce on each footfall
      const bob = a.moving && a.frame ? -1 : 0;
      const x = Math.round(a.px) - cam.x, y = Math.round(a.py) - cam.y;
      // someone arriving or leaving fades in or out
      const fading = a.alpha != null && a.alpha < 1;
      if (fading) tctx.globalAlpha = Math.max(0, a.alpha);
      tctx.fillStyle = "rgba(0,0,0,0.22)";
      tctx.fillRect(x + 4, y + 13, 8, 2);
      tctx.fillRect(x + 3, y + 14, 10, 1);
      tctx.drawImage(img, x, y - 2 + bob);
      if (fading) tctx.globalAlpha = 1;
    }

    function drawTrail(trail, time) {
      if (!trail || !trail.length) return;
      trail.forEach((p, i) => {
        const a = 0.35 + 0.45 * Math.max(0, Math.sin(time * 5 - i * 0.7));
        const x = p.x * T + 8 - cam.x, y = p.y * T + 8 - cam.y;
        const last = i === trail.length - 1;
        bctx.fillStyle = `rgba(184,138,44,${a.toFixed(2)})`;
        bctx.fillRect(x - 2, y - 1, 4, 2);
        bctx.fillRect(x - 1, y - 2, 2, 4);
        bctx.fillStyle = `rgba(255,236,170,${a.toFixed(2)})`;
        bctx.fillRect(x - 1, y - 1, 2, 2);
        if (last) {
          bctx.strokeStyle = `rgba(244,216,138,${(0.5 + a / 2).toFixed(2)})`;
          bctx.strokeRect(x - 5.5, y - 5.5, 11, 11);
        }
      });
    }

    // dust kicked up by running feet, in map pixels
    function drawParticles(list) {
      for (const p of list || []) {
        const k = Math.max(0, 1 - p.age / p.life);
        tctx.fillStyle = `rgba(${p.color || "236,226,206"},${(0.55 * k).toFixed(2)})`;
        const s = p.size * (0.6 + 0.4 * k);
        tctx.fillRect(Math.round(p.x - cam.x - s / 2), Math.round(p.y - cam.y - s / 2), Math.ceil(s), Math.ceil(s));
      }
    }

    function sparkle(x, y, time, seed) {
      const a = Math.max(0, Math.sin(time * 3 + seed));
      if (a < 0.15) return;
      tctx.fillStyle = `rgba(255,250,220,${a.toFixed(2)})`;
      tctx.fillRect(x - 2, y, 5, 1);
      tctx.fillRect(x, y - 2, 1, 5);
    }

    function bubble(kind, x, y) {
      const d = Art.DECOR[kind];
      if (!d) return;
      if (!frameCache["bubble-" + kind]) frameCache["bubble-" + kind] = Art.fromRows(d.rows, d.pal);
      const img = frameCache["bubble-" + kind];
      tctx.drawImage(img, Math.round(x - img.width / 2) - cam.x, Math.round(y - img.height) - cam.y);
    }

    // ---- light ----

    // dust drifting slowly through each case's spotlight
    function spawnMotes(map) {
      motes = [];
      if (map.kind !== "gallery") return;
      let seed = 7;
      const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      for (const c of map.cases) {
        for (let i = 0; i < MOTES_PER_CASE; i++) {
          motes.push({ cx: (c.x + 1) * T, cy: (c.y + 1) * T - 4, r: 6 + rand() * 18, a: rand() * Math.PI * 2, sp: 0.15 + rand() * 0.25, ph: rand() * 6 });
        }
      }
    }

    function drawMotes(time) {
      for (const m of motes) {
        const a = m.a + time * m.sp;
        const x = m.cx + Math.cos(a) * m.r - cam.x, y = m.cy + Math.sin(a * 0.7) * m.r * 0.6 - cam.y - ((time * 2 + m.ph * 3) % 10);
        if (x < -2 || y < -2 || x > view.w + 2 || y > view.h + 2) continue;
        const k = 0.25 + 0.35 * Math.max(0, Math.sin(time * 1.7 + m.ph));
        tctx.fillStyle = `rgba(255,240,200,${k.toFixed(2)})`;
        tctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }

    // long slanting beams of daylight from the lobby's high windows
    function drawShafts(map, time) {
      tctx.save();
      tctx.globalCompositeOperation = "lighter";
      const pulse = 0.85 + 0.15 * Math.sin(time * 0.6);
      for (let x = 3; x < map.w - 3; x += 6) {
        const X = x * T - cam.x, Y = 3 * T - cam.y;
        if (X > view.w || X + 110 < 0) continue;
        const g = tctx.createLinearGradient(X, Y, X + 70, Y + 150);
        g.addColorStop(0, `rgba(255,236,190,${(0.16 * pulse).toFixed(3)})`);
        g.addColorStop(1, "rgba(255,236,190,0)");
        tctx.fillStyle = g;
        tctx.beginPath();
        tctx.moveTo(X, Y);
        tctx.lineTo(X + 22, Y);
        tctx.lineTo(X + 100, Y + 170);
        tctx.lineTo(X + 70, Y + 170);
        tctx.closePath();
        tctx.fill();
      }
      tctx.restore();
    }

    // everything dims except a pool of light on the piece being presented
    function drawFocus(focus) {
      if (!focus || focus.amount <= 0.01) return;
      const x = focus.x - cam.x, y = focus.y - cam.y;
      const g = tctx.createRadialGradient(x, y, 18, x, y, 74);
      g.addColorStop(0, "rgba(8,5,10,0)");
      g.addColorStop(1, `rgba(8,5,10,${(0.55 * focus.amount).toFixed(3)})`);
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, view.w, view.h);
    }

    function drawVignette(kind) {
      if (!vignette || vignette.kind !== kind) {
        const c = document.createElement("canvas");
        c.width = canvas.width;
        c.height = canvas.height;
        const x = c.getContext("2d");
        const r = Math.hypot(c.width, c.height) / 2;
        const g = x.createRadialGradient(c.width / 2, c.height / 2, r * 0.45, c.width / 2, c.height / 2, r);
        g.addColorStop(0, "rgba(10,6,12,0)");
        g.addColorStop(1, kind === "gallery" ? "rgba(10,6,12,0.55)" : "rgba(40,24,16,0.28)");
        x.fillStyle = g;
        x.fillRect(0, 0, c.width, c.height);
        vignette = { kind, c };
      }
      ctx.drawImage(vignette.c, 0, 0);
    }

    // a circle closing on the player and opening again, between rooms
    function drawIris(amount, px, py) {
      if (amount <= 0) return;
      const R = Math.hypot(canvas.width, canvas.height);
      const r = R * Math.pow(1 - Math.min(1, amount), 1.6);
      ctx.save();
      ctx.fillStyle = "#0a070c";
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      if (r > 1) ctx.arc(px, py, r, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.restore();
    }

    function drawLabels(list, layer) {
      const s = view.scale;
      for (const l of list) {
        if ((l.layer || "wall") !== layer) continue;
        const cx = (l.x - cam.x) * s, cy = (l.y - cam.y) * s;
        const w = l.w * s, h = l.h * s;
        if (cx + w < 0 || cx - w > canvas.width || cy + h < 0 || cy - h > canvas.height) continue;
        if (l.pill) {
          ctx.fillStyle = l.pill;
          ctx.fillRect(Math.round(cx - w / 2), Math.round(cy - h / 2), Math.round(w), Math.round(h));
        }
        ctx.fillStyle = l.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const n = l.lines.length;
        l.lines.forEach((ln, i) => {
          const size = Math.max(9, Math.round((h / n) * 0.8 * (ln.size || 1) * (n > 1 ? 0.92 : 1)));
          ctx.font = `${ln.zh ? 600 : 500} ${size}px ${ln.zh ? ZH_FONT : LATIN_FONT}`;
          ctx.fillText(ln.text, cx, cy + (i - (n - 1) / 2) * (h / n), w);
        });
      }
    }

    /*
      state: { map, player, docent, npcs, trail, seen, time, bubbles, fade,
               focus: {x, y, amount}, particles, look: {x, y}, camFocus }
      bubbles: [{ kind, x, y }] in map pixels (bottom centre)
    */
    function frame(state) {
      const { map, time } = state;
      const layer = mapLayer(map);
      if (!layer.labels) layer.labels = Tiles.labels(map, galleries);
      const look = state.look || { x: 0, y: 0 };
      const focus = state.camFocus || { x: state.player.px + 8 + look.x, y: state.player.py + 8 + look.y };
      placeCamera(map, focus.x, focus.y, state.dt || 0, !state.snap);
      const camX = cam.x, camY = cam.y;
      cam.x = Math.round(camX);
      cam.y = Math.round(camY);
      const s = view.scale;

      // 1. floor and walls
      bctx.fillStyle = BG;
      bctx.fillRect(0, 0, view.w, view.h);
      bctx.drawImage(layer.base, -cam.x, -cam.y);
      drawTrail(state.trail, time);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, view.w * s, view.h * s);
      drawLabels(layer.labels, "floor");

      // 2. everything standing up, sorted by depth
      tctx.clearRect(0, 0, view.w, view.h);
      const draws = [];
      const sparkles = [];
      for (const o of layer.objects) {
        draws.push({
          depth: o.depth,
          draw: () => {
            tctx.save();
            tctx.translate(-cam.x, -cam.y);
            if (o.kind === "pillar") Tiles.pillar(tctx, o.x, o.y);
            else if (o.kind === "plant") Tiles.plant(tctx, o.x, o.y);
            else if (o.kind === "sign") Tiles.sign(tctx, o.x, o.y);
            else if (o.kind === "post") Tiles.post(tctx, o);
            else {
              const topY = Tiles.displayCase(tctx, o.case, artifactSprite(o.case.id), { star: stars.includes(o.case.id), time });
              if (!state.seen.has(o.case.id)) sparkles.push({ x: o.case.x * T + 27, y: topY + 2, seed: o.case.order });
            }
            tctx.restore();
          }
        });
      }
      for (const a of [state.player, state.docent, ...(state.npcs || [])]) {
        if (a && !a.hidden) draws.push({ depth: Math.round(a.py) + T + 0.5, draw: () => drawActor(a, time) });
      }
      draws.sort((a, b) => a.depth - b.depth).forEach(d => d.draw());
      drawParticles(state.particles);
      for (const sp of sparkles) sparkle(sp.x - cam.x, sp.y - cam.y, time, sp.seed);

      // 3. light
      if (map.kind === "gallery") drawMotes(time);
      else drawShafts(map, time);
      drawFocus(state.focus);
      for (const b of state.bubbles || []) bubble(b.kind, b.x, b.y);
      ctx.drawImage(top, 0, 0, view.w * s, view.h * s);

      // 4. signs on walls, the vignette, the iris
      drawLabels(layer.labels, "wall");
      drawVignette(map.kind);
      if (state.fade > 0) {
        const p = state.player;
        drawIris(state.fade, (p.px + 8 - cam.x) * s, (p.py + 6 - cam.y) * s);
      }
      cam.x = camX;
      cam.y = camY;
    }

    // CSS pixel position on the canvas -> map tile
    function screenToTile(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      const gx = ((clientX - r.left) * view.dpr) / view.scale + Math.round(cam.x);
      const gy = ((clientY - r.top) * view.dpr) / view.scale + Math.round(cam.y);
      return { x: Math.floor(gx / T), y: Math.floor(gy / T) };
    }

    return { resize, setInsets, frame, screenToTile, relabel, view, cam, artifactSprite };
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Renderer = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
