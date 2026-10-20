/*
  The world as data: parsed maps, what is solid, where each warp leads, and
  breadth-first pathfinding inside a map and across maps. No DOM, no canvas,
  so tests/unit.js can run all of it in Node.
*/
(function (root) {
  const TILE = 16;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
  const LEGAL = new Set("#W.,=BuvdrEmsPpbIT");
  const ALWAYS_SOLID = new Set("#WBPpbIEsrT");
  const CASE_W = 2;
  const CASE_H = 2;

  const key = (x, y) => x + "," + y;
  const floorId = n => n + "F";

  function dirFromDelta(dx, dy) {
    if (dx === 1) return "right";
    if (dx === -1) return "left";
    if (dy === 1) return "down";
    return "up";
  }

  // contiguous runs of `ch` in a row, as [{x, w}]
  function runsIn(row, ch) {
    const runs = [];
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== ch) continue;
      const start = x;
      while (row[x + 1] === ch) x++;
      runs.push({ x: start, w: x - start + 1 });
    }
    return runs;
  }

  function boundsOf(rows, ch) {
    let b = null;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== ch) continue;
        b = b
          ? { x0: Math.min(b.x0, x), y0: Math.min(b.y0, y), x1: Math.max(b.x1, x), y1: Math.max(b.y1, y) }
          : { x0: x, y0: y, x1: x, y1: y };
      }
    });
    return b;
  }

  function findRun(rows, ch, at, label) {
    const run = runsIn(rows[at.y] || "", ch).find(r => r.x === at.x);
    if (!run) throw new Error(`${label}: no '${ch}' run starts at ${at.x},${at.y}`);
    return run.w;
  }

  // Tile number `lane` in front of a doorway in a wall face, and the way
  // you face there having just come through it.
  const frontOf = (o, lane) => ({ x: o.x + lane, y: o.y + 1, dir: "down" });

  // The tiles of a doorway itself, left to right.
  const tilesOf = o => Array.from({ length: o.w }, (_, i) => ({ x: o.x + i, y: o.y }));

  function parseMap(id, def) {
    const rows = def.rows;
    const w = rows[0].length;
    const h = rows.length;
    rows.forEach((row, y) => {
      if (row.length !== w) throw new Error(`${id}: row ${y} is ${row.length} wide, expected ${w}`);
      for (const ch of row) if (!LEGAL.has(ch)) throw new Error(`${id}: illegal tile '${ch}' in row ${y}`);
    });

    const map = {
      id, kind: def.kind, w, h, rows,
      floor: def.floor || null,
      gallery: def.gallery || null,
      doors: (def.doors || []).map(d => ({ ...d, w: findRun(rows, "d", d, id) })),
      ropes: (def.ropes || []).map(r => ({ ...r, w: findRun(rows, "r", r, id) })),
      cases: (def.cases || []).map((c, i) => ({ ...c, w: CASE_W, h: CASE_H, order: i + 1 })),
      npcs: def.npcs || [],
      spawn: def.spawn || null,
      rooms: def.rooms || [],
      sections: def.sections || [],
      blocked: new Set((def.blocked || []).map(([x, y]) => key(x, y))),
      elevator: null, elevators: [], signs: [], wallText: null,
      upFlight: boundsOf(rows, "u"),
      downFlight: boundsOf(rows, "v"),
      mat: null
    };

    rows.forEach((row, y) => runsIn(row, "E").forEach(r => {
      for (let i = 0; i < r.w; i++) map.elevators.push({ x: r.x + i, y });
    }));
    map.elevator = map.elevators[0] || null;
    rows.forEach((row, y) => runsIn(row, "s").forEach(r => map.signs.push({ x: r.x, y })));
    const t = boundsOf(rows, "T");
    if (t) map.wallText = { x: t.x0, y: t.y0, w: t.x1 - t.x0 + 1 };
    const m = boundsOf(rows, "m");
    if (m) map.mat = { x0: m.x0, x1: m.x1, y: m.y0, w: m.x1 - m.x0 + 1 };

    map.caseAt = new Map();
    for (const c of map.cases) {
      for (let dy = 0; dy < c.h; dy++) {
        for (let dx = 0; dx < c.w; dx++) {
          const k = key(c.x + dx, c.y + dy);
          if (map.caseAt.has(k)) throw new Error(`${id}: cases overlap at ${k}`);
          map.caseAt.set(k, c);
        }
      }
    }
    return map;
  }

  function buildWorld(defs) {
    const maps = {};
    for (const [id, def] of Object.entries(defs)) maps[id] = parseMap(id, def);
    const doorOf = {};
    for (const map of Object.values(maps)) {
      for (const d of map.doors) doorOf[d.to] = { map: map.id, x: d.x, y: d.y, w: d.w };
    }
    for (const map of Object.values(maps)) {
      if (map.kind === "gallery") {
        const door = doorOf[map.gallery];
        if (!door) throw new Error(`${map.id}: no lobby door leads here`);
        map.floor = maps[door.map].floor;
      }
    }
    return { maps, doorOf };
  }

  // ---- tiles ----

  function tileAt(map, x, y) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return "#";
    return map.rows[y][x];
  }

  // The museum room number at a tile of a gallery map, or null. A room is
  // a band of columns, or a rectangle when it gives rows as well; the
  // first room that holds the tile wins.
  function roomAt(map, x, y) {
    const zone = map.rooms.find(r => x >= r.x0 && x <= r.x1 && (y == null || r.y0 == null || (y >= r.y0 && y <= r.y1)));
    return zone ? zone.room : null;
  }

  function caseAt(map, x, y) {
    return map.caseAt.get(key(x, y)) || null;
  }

  function isSolid(map, x, y) {
    const t = tileAt(map, x, y);
    if (ALWAYS_SOLID.has(t)) return true;
    // the museum's front door is bumped into (it asks before you leave);
    // a gallery's exit mat is walked onto
    if (t === "m" && map.kind === "lobby") return true;
    return map.caseAt.has(key(x, y)) || map.blocked.has(key(x, y));
  }

  const isStair = (map, x, y) => "uv".includes(tileAt(map, x, y));

  // tiles that move you to another map the moment you step onto them
  function isWarp(map, x, y) {
    const t = tileAt(map, x, y);
    if (t === "d") return true;
    if (t === "m") return map.kind === "gallery";
    if (t === "u") return y === map.upFlight.y0;
    if (t === "v") return y === map.downFlight.y1;
    return false;
  }

  // The tile just inside a gallery's way in, in lane `lane`.
  function entryOf(map, lane = 0) {
    const m = map.mat;
    return { x: m.x0 + Math.max(0, Math.min(lane, m.w - 1)), y: m.y - 1, dir: "up" };
  }

  const matTiles = m => Array.from({ length: m.w }, (_, i) => ({ x: m.x0 + i, y: m.y }));

  const openingAt = (list, x, y) => list.find(o => tilesOf(o).some(t => t.x === x && t.y === y)) || null;
  const doorAt = (map, x, y) => openingAt(map.doors, x, y);
  const ropeAt = (map, x, y) => openingAt(map.ropes, x, y);

  function warpFrom(world, map, x, y) {
    if (!isWarp(map, x, y)) return null;
    const t = tileAt(map, x, y);
    if (t === "d") {
      const door = doorAt(map, x, y);
      const to = world.maps[door.to];
      return { kind: "door", map: to.id, ...entryOf(to, x - door.x) };
    }
    if (t === "m") {
      const door = world.doorOf[map.gallery];
      const lane = Math.min(x - map.mat.x0, door.w - 1);
      return { kind: "exit", map: door.map, ...frontOf(door, lane) };
    }
    if (t === "u") {
      const to = world.maps[floorId(map.floor + 1)];
      const lane = x - map.upFlight.x0;
      return { kind: "up", map: to.id, x: to.downFlight.x0 + lane, y: to.downFlight.y0 - 1, dir: "up" };
    }
    const to = world.maps[floorId(map.floor - 1)];
    const lane = x - map.downFlight.x0;
    return { kind: "down", map: to.id, x: to.upFlight.x0 + lane, y: to.upFlight.y1 + 1, dir: "down" };
  }

  // Riding from elevator number `index` comes out of the same shaft on the
  // other floor, or the first one there if that floor has fewer.
  function elevatorArrival(world, floor, index = 0) {
    const map = world.maps[floorId(floor)];
    const e = map.elevators[index] || map.elevators[0];
    return { kind: "elevator", map: map.id, x: e.x, y: e.y + 1, dir: "down" };
  }

  // Which elevator a visitor standing at (x, y) is waiting at: the one
  // they're in front of, or else the nearest.
  function elevatorIndex(map, x, y) {
    let best = 0, bestD = Infinity;
    map.elevators.forEach((e, i) => {
      const d = Math.abs(e.x - x) + Math.abs(e.y + 1 - y);
      if (d < bestD) { best = i; bestD = d; }
    });
    return best;
  }

  function facing(x, y, dir) {
    const [dx, dy] = DIRS[dir];
    return { x: x + dx, y: y + dy };
  }

  // Walkable tiles next to a case, the ones in front of it first.
  function approachTiles(map, c) {
    const front = [], rest = [];
    for (let dx = 0; dx < c.w; dx++) front.push({ x: c.x + dx, y: c.y + c.h, dir: "up" });
    for (let dy = 0; dy < c.h; dy++) {
      rest.push({ x: c.x - 1, y: c.y + dy, dir: "right" });
      rest.push({ x: c.x + c.w, y: c.y + dy, dir: "left" });
    }
    for (let dx = 0; dx < c.w; dx++) rest.push({ x: c.x + dx, y: c.y - 1, dir: "down" });
    const ok = p => !isSolid(map, p.x, p.y) && !isWarp(map, p.x, p.y) && !isStair(map, p.x, p.y);
    return { front: front.filter(ok), rest: rest.filter(ok) };
  }

  // The case beside (x, y), preferring the one being faced.
  function caseNextTo(map, x, y, dir) {
    if (dir) {
      const f = facing(x, y, dir);
      const c = caseAt(map, f.x, f.y);
      if (c) return c;
    }
    for (const d of Object.keys(DIRS)) {
      const f = facing(x, y, d);
      const c = caseAt(map, f.x, f.y);
      if (c) return c;
    }
    return null;
  }

  function dirToward(from, c) {
    if (from.y >= c.y + c.h) return "up";
    if (from.y < c.y) return "down";
    if (from.x < c.x) return "right";
    return "left";
  }

  // ---- pathfinding ----

  /*
    Breadth-first search over walkable tiles. Returns the tiles to step on,
    start excluded and goal included ([] if already there), or null.
    Warp tiles are only entered when they are the goal, and stair tiles only
    when `stairs` is set, so an auto-walk never wanders onto a staircase.
  */
  function findPath(map, start, goals, { stairs = false, blocked = null, limit = 4000 } = {}) {
    const goalSet = new Set(goals.map(g => key(g.x, g.y)));
    if (goalSet.has(key(start.x, start.y))) return [];
    const prev = new Map([[key(start.x, start.y), null]]);
    const queue = [start];
    for (let i = 0; i < queue.length && i < limit; i++) {
      const cur = queue[i];
      for (const [dx, dy] of Object.values(DIRS)) {
        const x = cur.x + dx, y = cur.y + dy;
        const k = key(x, y);
        if (prev.has(k)) continue;
        const isGoal = goalSet.has(k);
        if (isSolid(map, x, y)) continue;
        if (!isGoal && isWarp(map, x, y)) continue;
        if (!isGoal && !stairs && isStair(map, x, y)) continue;
        if (blocked && blocked(x, y) && !isGoal) continue;
        prev.set(k, cur);
        const node = { x, y };
        if (isGoal) {
          const path = [node];
          for (let p = cur; p && prev.get(key(p.x, p.y)) !== null; p = prev.get(key(p.x, p.y))) path.unshift(p);
          return path;
        }
        queue.push(node);
      }
    }
    return null;
  }

  // Which maps to pass through, as edges. Stairs by default; with
  // stepFree the elevator replaces them.
  function mapRoute(world, fromId, toId, stepFree) {
    if (fromId === toId) return [];
    const edgesOf = id => {
      const map = world.maps[id];
      const out = [];
      if (map.kind === "gallery") {
        out.push({ via: "exit", to: world.doorOf[map.gallery].map });
        return out;
      }
      for (const d of map.doors) out.push({ via: "door", to: d.to });
      const up = world.maps[floorId(map.floor + 1)];
      const down = world.maps[floorId(map.floor - 1)];
      if (stepFree) {
        for (const other of Object.values(world.maps)) {
          if (other.kind === "lobby" && other.id !== id && other.elevator) out.push({ via: "elevator", to: other.id });
        }
      } else {
        if (map.upFlight && up) out.push({ via: "up", to: up.id });
        if (map.downFlight && down) out.push({ via: "down", to: down.id });
      }
      return out;
    };
    const prev = new Map([[fromId, null]]);
    const queue = [fromId];
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      for (const edge of edgesOf(id)) {
        if (prev.has(edge.to)) continue;
        prev.set(edge.to, { from: id, edge });
        if (edge.to === toId) {
          const legs = [];
          for (let at = toId; prev.get(at); at = prev.get(at).from) legs.unshift({ from: prev.get(at).from, ...prev.get(at).edge });
          return legs;
        }
        queue.push(edge.to);
      }
    }
    return null;
  }

  // Goal tiles for leaving `map` along `edge`.
  function edgeGoals(map, edge) {
    if (edge.via === "door") {
      const d = map.doors.find(dd => dd.to === edge.to);
      return { goals: tilesOf(d), stairs: false };
    }
    if (edge.via === "exit") return { goals: matTiles(map.mat), stairs: false };
    if (edge.via === "up") {
      const f = map.upFlight;
      return { goals: lane(f.x0, f.x1 - f.x0 + 1, f.y0), stairs: true };
    }
    if (edge.via === "down") {
      const f = map.downFlight;
      return { goals: lane(f.x0, f.x1 - f.x0 + 1, f.y1), stairs: true };
    }
    return { goals: map.elevators.map(e => ({ x: e.x, y: e.y + 1 })), stairs: false };
  }

  function lane(x0, w, y) {
    return Array.from({ length: w }, (_, i) => ({ x: x0 + i, y }));
  }

  // Goal tiles for a final target on its own map.
  function targetGoals(world, map, target) {
    if (target.type === "case") {
      const c = map.cases.find(cc => cc.id === target.id);
      const { front, rest } = approachTiles(map, c);
      return { tiers: [front, rest] };
    }
    if (target.type === "tile") return { tiers: [[{ x: target.x, y: target.y }]] };
    // arriving anywhere on the target map is enough (e.g. "go to a gallery")
    return { tiers: [] };
  }

  /*
    One leg of a route from `from` to `target`:
      { done: true }                           already there
      { path, edge }                           walk `path`, which ends on the warp for `edge`
      { path, edge: null }                     walk `path`, which ends at the target
      null                                     no way through right now
  */
  function planRoute(world, from, target, { stepFree = false, blocked = null } = {}) {
    const legs = mapRoute(world, from.map, target.map, stepFree);
    if (!legs) return null;
    const map = world.maps[from.map];
    if (legs.length === 0) {
      const { tiers } = targetGoals(world, map, target);
      if (tiers.length === 0) return { done: true };
      for (const goals of tiers) {
        if (!goals.length) continue;
        const path = findPath(map, from, goals, { blocked });
        if (path) return path.length ? { path, edge: null, legsLeft: 0 } : { done: true };
      }
      return null;
    }
    const edge = legs[0];
    const { goals, stairs } = edgeGoals(map, edge);
    const path = findPath(map, from, goals, { stairs, blocked });
    if (!path) return null;
    return { path, edge, legsLeft: legs.length };
  }

  // Every walkable tile reachable from `start` (warps excluded, stairs allowed).
  function reachable(map, start) {
    const seen = new Set([key(start.x, start.y)]);
    const queue = [start];
    for (let i = 0; i < queue.length; i++) {
      for (const [dx, dy] of Object.values(DIRS)) {
        const x = queue[i].x + dx, y = queue[i].y + dy;
        const k = key(x, y);
        if (seen.has(k) || isSolid(map, x, y) || isWarp(map, x, y)) continue;
        seen.add(k);
        queue.push({ x, y });
      }
    }
    return seen;
  }

  const api = {
    TILE, DIRS, OPPOSITE, key, floorId, dirFromDelta,
    parseMap, buildWorld, tileAt, caseAt, roomAt, isSolid, isStair, isWarp, warpFrom, elevatorArrival, elevatorIndex,
    entryOf, frontOf, tilesOf, doorAt, ropeAt,
    facing, approachTiles, caseNextTo, dirToward, findPath, mapRoute, planRoute, reachable
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.World = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
