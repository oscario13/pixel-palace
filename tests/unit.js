// Pure-logic checks: maps, warps, pathfinding, tour data and text paging.
// Runs in plain Node, no browser.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const World = require(path.join(ROOT, "js/world.js"));
const { MAP_DEFS } = require(path.join(ROOT, "js/maps.js"));
const TourData = require(path.join(ROOT, "js/tour-data.js"));
const Text = require(path.join(ROOT, "js/text.js"));
const Lang = require(path.join(ROOT, "js/lang.js"));
const Save = require(path.join(ROOT, "js/save.js"));


let passes = 0, failures = 0;
function check(name, cond, detail) {
  if (cond) passes++;
  else { failures++; console.log("FAIL", name, detail === undefined ? "" : JSON.stringify(detail)); }
}

const world = World.buildWorld(MAP_DEFS);
const { maps } = world;
const lobbies = Object.values(maps).filter(m => m.kind === "lobby");
const galleries = Object.values(maps).filter(m => m.kind === "gallery");

// ---- every map parses and hangs together ----
check("three lobby floors", lobbies.map(m => m.id).sort().join() === "1F,2F,3F");
check("one gallery map per permanent exhibition",
  galleries.map(m => m.gallery).sort().join() === TourData.GALLERIES.map(g => g.id).sort().join());

for (const map of Object.values(maps)) {
  const start = map.kind === "lobby" ? (map.spawn || { x: map.elevator.x, y: map.elevator.y + 1 })
    : World.entryOf(map);
  const reach = World.reachable(map, start);
  let walkable = 0, unreachable = [];
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (World.isSolid(map, x, y) || World.isWarp(map, x, y)) continue;
      walkable++;
      if (!reach.has(World.key(x, y))) unreachable.push([x, y]);
    }
  }
  check(`${map.id}: every walkable tile is reachable`, unreachable.length === 0, unreachable.slice(0, 5));
  check(`${map.id}: has walkable floor`, walkable > 50, walkable);

  for (const npc of map.npcs) {
    check(`${map.id}/${npc.id}: NPC stands on floor`, !World.isSolid(map, npc.x, npc.y) && !World.isWarp(map, npc.x, npc.y) && !World.isStair(map, npc.x, npc.y));
    if (npc.wander) {
      const [x0, y0, x1, y1] = npc.wander;
      check(`${map.id}/${npc.id}: wander box holds its start`, npc.x >= x0 && npc.x <= x1 && npc.y >= y0 && npc.y <= y1);
    }
    check(`${map.id}/${npc.id}: has something to say, in both languages`, Array.isArray(npc.lines) && npc.lines.length > 0 &&
      npc.lines.every(l => Array.isArray(l) && l.length === 2 && l[0].trim() && /[\u3400-\u9fff]/.test(l[1])));
  }

  // every warp lands on plain walkable floor
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (!World.isWarp(map, x, y)) continue;
      const to = World.warpFrom(world, map, x, y);
      const dest = maps[to.map];
      const ok = dest && !World.isSolid(dest, to.x, to.y) && !World.isWarp(dest, to.x, to.y) && !World.isStair(dest, to.x, to.y);
      check(`${map.id} ${x},${y} -> ${to.map} ${to.x},${to.y} lands on floor`, ok);
    }
  }
}

// ---- lobbies ----
for (const map of lobbies) {
  check(`${map.id}: elevator present`, !!map.elevator);
  const below = World.elevatorArrival(world, map.floor);
  check(`${map.id}: elevator arrival is floor`, !World.isSolid(map, below.x, below.y));
  check(`${map.id}: floor-guide sign`, map.signs.length === 1);
  for (const r of map.ropes) check(`${map.id}: rope sign text exists`, !!TourData.SIGNS[r.sign], r.sign);
}
check("1F stairs only go up", !!maps["1F"].upFlight && !maps["1F"].downFlight);
check("2F stairs go both ways", !!maps["2F"].upFlight && !!maps["2F"].downFlight);
check("3F stairs only go down", !maps["3F"].upFlight && !!maps["3F"].downFlight);
const middle = map => (map.w - 1) / 2;
const centre = f => (f.x0 + f.x1) / 2;
check("1F grand staircase is in the middle", centre(maps["1F"].upFlight) === middle(maps["1F"]));
check("3F staircase is in the middle", centre(maps["3F"].downFlight) === middle(maps["3F"]));
check("2F stairs sit side by side in the middle", Math.abs((maps["2F"].upFlight.x0 + maps["2F"].downFlight.x1) / 2 - middle(maps["2F"])) <= 0.5);
check("1F spawn is just inside the entrance", maps["1F"].spawn.y === maps["1F"].mat.y - 1);
check("1F entrance is in the middle of the south wall", maps["1F"].mat.y === maps["1F"].h - 1 && centre(maps["1F"].mat) === middle(maps["1F"]));

// only the permanent exhibitions are open, each on its real side of the stairs
{
  for (const m of lobbies) {
    check(`${m.id}: no roped-off rooms, only the permanent exhibitions`, m.ropes.length === 0, m.ropes.map(r => r.room));
    const here = TourData.GALLERIES.filter(g => g.floor === m.floor).map(g => g.id).sort();
    check(`${m.id}: a door for each permanent exhibition on this floor, and nothing else`, m.doors.map(d => d.to).sort().join() === here.join(), m.doors.map(d => d.to));
    check(`${m.id}: one elevator, behind the grand staircase`, m.elevators.length === 1 && m.elevators[0].x === middle(m) && m.elevators[0].y === 2, m.elevators);
  }
  for (const g of TourData.GALLERIES) {
    const door = world.doorOf[g.id];
    const map = maps[door.map];
    const west = door.x + door.w - 1 < middle(map);
    check(`${g.id}: opens from the ${g.side} side, as in the museum`, (g.side === "west") === west, [door.x, g.side]);
    check(`${g.id}: says which side it's on`, /east|west|東|西/.test(TourData.gallerySide(g)));
  }
}

// stairs keep your lane both ways
{
  const f1 = maps["1F"].upFlight, f2d = maps["2F"].downFlight, f2u = maps["2F"].upFlight;
  const up = World.warpFrom(world, maps["1F"], f1.x0 + 1, f1.y0);
  check("1F up lands on 2F top of the down flight", up.map === "2F" && up.x === f2d.x0 + 1 && up.y === f2d.y0 - 1 && up.dir === "up", up);
  const down = World.warpFrom(world, maps["2F"], up.x, f2d.y1);
  check("2F down comes back to the same lane on 1F", down.map === "1F" && down.x === f1.x0 + 1 && down.y === f1.y1 + 1, down);
  const up2 = World.warpFrom(world, maps["2F"], f2u.x0 + 3, f2u.y0);
  check("2F up lands on 3F", up2.map === "3F" && up2.x === maps["3F"].downFlight.x0 + 3 && up2.dir === "up", up2);
  const mid = World.isWarp(maps["1F"], f1.x0 + 1, f1.y0 + 1);
  check("only the top step of an up flight warps", mid === false);
}

// doors and exits pair up, lane for lane
for (const g of galleries) {
  const door = world.doorOf[g.gallery];
  const lobby = maps[door.map];
  const doorTiles = World.tilesOf(door);
  check(`${g.id}: way in is in the bottom wall, facing its lobby door`, g.mat.y === g.h - 1);
  doorTiles.forEach((t, lane) => {
    const inside = World.warpFrom(world, lobby, t.x, t.y);
    const want = World.entryOf(g, lane);
    check(`${g.id}: door lane ${lane} leads into its gallery`, inside.map === g.id && inside.x === want.x && inside.y === want.y && inside.dir === want.dir, inside);
    const out = World.warpFrom(world, g, g.mat.x0 + lane, g.mat.y);
    const front = World.frontOf(door, lane);
    check(`${g.id}: exit lane ${lane} returns to its door`, out.map === door.map && out.x === front.x && out.y === front.y && out.dir === front.dir, out);
    check(`${g.id}: you come out walking away from the door`, World.isWarp(lobby, t.x, t.y) && !World.isSolid(lobby, front.x, front.y));
  });
  const info = TourData.GALLERIES.find(x => x.id === g.gallery);
  check(`${g.id}: gallery floor matches the real floor`, g.floor === info.floor, [g.floor, info.floor]);
  check(`${g.id}: has a wall text panel`, !!g.wallText);
}
check("museum front door is bumped, not walked through", World.isSolid(maps["1F"], maps["1F"].mat.x0 + 1, maps["1F"].mat.y) && !World.isWarp(maps["1F"], maps["1F"].mat.x0 + 1, maps["1F"].mat.y));

// ---- cases match the tour ----
for (const g of galleries) {
  const info = TourData.GALLERIES.find(x => x.id === g.gallery);
  check(`${g.id}: cases follow the tour order exactly`, g.cases.map(c => c.id).join() === info.tour.join(), g.cases.map(c => c.id));
  const entry = World.entryOf(g);
  for (const c of g.cases) {
    for (let dy = 0; dy < c.h; dy++) {
      for (let dx = 0; dx < c.w; dx++) {
        check(`${g.id}/${c.id}: case sits on open floor`, ".,".includes(World.tileAt(g, c.x + dx, c.y + dy)));
      }
    }
    const { front } = World.approachTiles(g, c);
    check(`${g.id}/${c.id}: can be viewed from the front`, front.length === 2, front);
    const p = World.findPath(g, entry, front);
    check(`${g.id}/${c.id}: front reachable from the entrance`, Array.isArray(p), c);
    for (const npc of g.npcs) check(`${g.id}/${c.id}: no visitor blocks the front`, !front.some(f => f.x === npc.x && f.y === npc.y));
  }
}

// ---- route planning across floors ----
{
  const from = { map: "1F", ...maps["1F"].spawn };
  const target = { type: "case", map: "bronze", id: "mao-gong-ding" };
  check("stairs route 1F -> bronze goes 1F, 2F, 3F, bronze",
    World.mapRoute(world, "1F", "bronze", false).map(l => l.to).join() === "2F,3F,bronze");
  check("step-free route 1F -> bronze takes the elevator",
    World.mapRoute(world, "1F", "bronze", true).map(l => l.via).join() === "elevator,door");
  const leg = World.planRoute(world, from, target);
  const last = leg.path[leg.path.length - 1];
  check("first leg ends on the top step", leg.edge.via === "up" && last.y === maps["1F"].upFlight.y0, leg.edge);
  const legFree = World.planRoute(world, from, target, { stepFree: true });
  const lastFree = legFree.path[legFree.path.length - 1];
  check("step-free first leg ends at an elevator", maps["1F"].elevators.some(e => lastFree.x === e.x && lastFree.y === e.y + 1), lastFree);
  const outOn3 = World.elevatorArrival(world, 3, World.elevatorIndex(maps["1F"], lastFree.x, lastFree.y));
  check("the elevator comes out in front of the elevator upstairs", outOn3.map === "3F" && outOn3.x === maps["3F"].elevator.x && outOn3.y === maps["3F"].elevator.y + 1, outOn3);
  check("step-free path never touches the stairs", legFree.path.every(p => !World.isStair(maps["1F"], p.x, p.y)));

  const bronze = maps.bronze;
  const { x: bx, y: by } = World.entryOf(bronze);
  const inBronze = { map: "bronze", x: bx, y: by };
  const mao = bronze.cases.find(c => c.id === "mao-gong-ding");
  const final = World.planRoute(world, inBronze, target);
  const end = final.path[final.path.length - 1];
  check("final leg ends in front of the Mao Gong Ding", final.edge === null && end.y === mao.y + mao.h && (end.x === mao.x || end.x === mao.x + 1), end);
  const there = World.planRoute(world, { map: "bronze", x: mao.x, y: mao.y + mao.h }, target);
  check("standing in front counts as arrived", there && there.done === true, there);
  check("a gallery target is done on arrival", World.planRoute(world, inBronze, { type: "map", map: "bronze" }).done === true);

  const step = final.path[1];
  const blocked = (x, y) => x === step.x && y === step.y;
  const around = World.planRoute(world, inBronze, target, { blocked });
  check("paths step around blocked tiles", around && around.path.every(p => !(p.x === step.x && p.y === step.y)));
}

// ---- every piece has verified, complete data, in both languages ----
{
  const ids = TourData.fullTour().map(s => s[1]);
  check("68 pieces in the game", ids.length === 68 && new Set(ids).size === 68, ids.length);
  check("no stray piece records", Object.keys(TourData.PIECES).length === ids.length);
  const cjk = /[\u3400-\u9fff]/;
  for (const id of ids) {
    const p = TourData.PIECES[id];
    const g = TourData.galleryOf(id);
    check(`${id}: has a record`, !!p);
    if (!p) continue;
    for (const k of ["name", "nameZh", "date", "dateZh", "room", "intro", "more", "look", "source"]) {
      check(`${id}: has ${k}`, typeof p[k] === "string" && p[k].trim().length > 0);
    }
    for (const k of ["intro", "more", "look"]) {
      check(`${id}: has ${k} in Chinese`, !!p.zh && typeof p.zh[k] === "string" && cjk.test(p.zh[k]));
      check(`${id}: English ${k} is English`, !cjk.test(p[k]), p[k].slice(0, 40));
    }
    check(`${id}: Chinese title and date are Chinese`, cjk.test(p.nameZh) && cjk.test(p.dateZh));
    check(`${id}: source is a museum page`, /^https:\/\/(theme\.npm\.edu\.tw|www\.npm\.gov\.tw)\//.test(p.source), p.source);
    check(`${id}: Chinese source is a museum page`, /^https:\/\/(theme\.npm\.edu\.tw|www\.npm\.gov\.tw)\//.test(p.sourceZh), p.sourceZh);
    check(`${id}: room belongs to its exhibition`, g.rooms.includes(p.room), [p.room, g.rooms]);
    check(`${id}: period has a floor sign`, !!g.periods[p.period], p.period);
    check(`${id}: no engineering notes`, !/engineering/i.test(p.intro + p.more + p.look));
    const hasCutout = fs.existsSync(path.join(ROOT, "images/objects", id + ".png"));
    const hasWebp = fs.existsSync(path.join(ROOT, "images/objects", id + ".webp"));
    const hasPhoto = fs.existsSync(path.join(ROOT, "images/photos", id + ".jpg"));
    if (p.photo) {
      check(`${id}: has a cut-out`, hasCutout);
      check(`${id}: has a small WebP of its cut-out for the game to load`, hasWebp &&
        fs.statSync(path.join(ROOT, "images/objects", id + ".webp")).mtimeMs >= fs.statSync(path.join(ROOT, "images/objects", id + ".png")).mtimeMs - 1000);
      check(`${id}: has a full photo for Look closer`, hasPhoto);
    } else {
      check(`${id}: no photo, and no image files sneaked in`, !hasCutout && !hasWebp && !hasPhoto);
    }
    check(`${id}: has a sharp zoom photo exactly when its open-data record is known`, fs.existsSync(path.join(ROOT, "images/zoom", id + ".jpg")) === !!p.record);
    if (p.record) check(`${id}: open-data record number looks right`, /^[故中購贈][銅玉瓷雜琺雕]\d{6}N\d{9}$/.test(p.record), p.record);
  }
  check("every photo added in October 2026 names its open-data record",
    ids.filter(id => TourData.PIECES[id].photo && !TourData.PIECES[id].highlight && !TourData.PIECES[id].record).length === 0);
  check("six pieces are still waiting for a licensed photo", ids.filter(id => !TourData.PIECES[id].photo).length === 6);
  for (const g of TourData.GALLERIES) {
    check(`${g.id}: star is a highlight`, g.highlights.includes(g.star));
    check(`${g.id}: highlights are in walking order`, g.highlights.join() === g.tour.filter(id => g.highlights.includes(id)).join());
    check(`${g.id}: has official name, Chinese title and opening date`, !!(g.name && g.nameZh && g.title && /^\d{4}-\d{2}-\d{2}$/.test(g.since)));
    check(`${g.id}: has Chinese title, name, short name and intro`, ["title", "name", "short", "intro"].every(k => cjk.test(g.zh[k] || "")));
  }
  check("22 highlights on the docent's tour", TourData.highlightTour().length === 22, TourData.highlightTour().length);
  const photos = fs.readdirSync(path.join(ROOT, "images/objects")).map(f => f.replace(/\.(png|webp)$/, ""));
  check("no photos of pieces that aren't in the game", photos.every(f => ids.includes(f)), photos.filter(f => !ids.includes(f)));
  const full = fs.readdirSync(path.join(ROOT, "images/photos")).map(f => f.replace(/\.jpg$/, ""));
  check("no full photos of pieces that aren't in the game", full.every(f => ids.includes(f)), full.filter(f => !ids.includes(f)));
  check("galleryOf finds the gallery", TourData.galleryOf("mao-gong-ding").id === "bronze" && TourData.galleryOf("nope") === null);
  // the museum's real floors and rooms (npm.gov.tw Exhibition Floor Plan, October 2026)
  const real = { bronze: [3, "305,307"], jade: [3, "306,308"], ceramics: [2, "201,205,207"], "precious-crafts": [1, "106"] };
  for (const g of TourData.GALLERIES) check(`${g.id}: real floor and rooms`, g.floor === real[g.id][0] && g.rooms.join() === real[g.id][1]);
  // how many pieces the museum lists per room (Selections by Gallery), plus the Classic Tour pieces
  const perRoom = Object.fromEntries(TourData.rooms().map(r => [r.room, r.pieces.length]));
  check("pieces per room match the museum's lists", JSON.stringify(perRoom) === JSON.stringify({ 305: 22, 307: 4, 306: 9, 308: 0, 201: 7, 205: 16, 207: 0, 106: 10 }), perRoom);
}

// ---- reading data in either language ----
{
  const p = TourData.PIECES["mao-gong-ding"], g = TourData.GALLERIES[0];
  Lang.set("zh");
  check("Chinese: piece name, text and gallery title", TourData.pieceName(p) === "毛公鼎" && /五百字/.test(TourData.text(p, "intro")) && TourData.galleryTitle(g) === "吉金耀采");
  check("Chinese: room list wording", Text.roomList(["305", "307"]) === "305、307 陳列室");
  check("Chinese: directions", Text.directions(1, 3, false) === "沿著大樓梯往上兩層，到3F。" && Text.directions(3, 1, true) === "我們搭電梯下兩層，到1F。");
  check("Chinese: quiz", TourData.quiz(TourData.QUIZZES.bronze[0]).a[1] === "約500字");
  check("Chinese: time label", TourData.minutesLabel({ low: 20, high: 30 }) === "約 20–30 分鐘");
  Lang.set("en");
  check("English again", TourData.pieceName(p) === "Ding cauldron of Duke Mao" && TourData.galleryTitle(g) === "Rituals Cast in Brilliance");
  check("a Chinese-first browser starts in Chinese", Lang.preferred({ languages: ["zh-TW", "en"] }) === "zh" && Lang.preferred({ languages: ["en-US", "zh-TW"] }) === "en" && Lang.preferred({}) === "en");
  check("unknown languages are ignored", (Lang.set("fr"), Lang.get() === "en"));
}

// ---- each case stands in the room the museum lists its piece in ----
for (const g of galleries) {
  check(`${g.id}: room zones are the exhibition's rooms`, g.rooms.every(r => TourData.galleryOf(g.cases[0].id).rooms.includes(r.room)));
  for (const c of g.cases) {
    const want = TourData.PIECES[c.id].room;
    const corners = [[c.x, c.y], [c.x + c.w - 1, c.y + c.h - 1]].map(([x, y]) => World.roomAt(g, x, y));
    check(`${g.id}/${c.id}: case is in Room ${want}`, corners.every(r => r === want), corners);
  }
}

// ---- text paging ----
{
  let worst = 0, worstZh = 0;
  for (const [id, p] of Object.entries(TourData.PIECES)) {
    for (const t of [p.intro, p.more, p.look]) {
      const pages = Text.paginate(t);
      worst = Math.max(worst, ...pages.map(pg => pg.length));
      check(`${id}: paging keeps every word`, pages.join(" ").replace(/[\s—,;]/g, "") === t.replace(/[\s—,;]/g, ""));
    }
    for (const t of [p.zh.intro, p.zh.more, p.zh.look]) {
      const pages = Text.paginate(t);
      worstZh = Math.max(worstZh, ...pages.map(pg => pg.length));
      check(`${id}: Chinese paging keeps every character`, pages.join("") === t.replace(/\s+/g, " ").trim());
    }
  }
  for (const g of TourData.GALLERIES) {
    for (const pg of Text.paginate(g.intro)) worst = Math.max(worst, pg.length);
    for (const pg of Text.paginate(g.zh.intro)) worstZh = Math.max(worstZh, pg.length);
  }
  check("no page is longer than the limit", worst <= Text.PAGE_MAX, worst);
  check("no Chinese page is longer than its limit", worstZh <= Text.PAGE_MAX_ZH, worstZh);
  check("short text is one page", Text.paginate("Hello there.").length === 1);
  check("empty text has no pages", Text.paginate("   ").length === 0);
  check("splits sentences, not abbreviations mid-word", Text.sentences("It is 9 CE. Then more.").length === 2);
  check("splits Chinese sentences after 。", Text.sentences("這是第一句。這是「第二句。」第三句！").length === 3);
  check("directions: same floor", Text.directions(3, 3, false, "en").includes("this floor"));
  check("directions: two floors up", Text.directions(1, 3, false, "en") === "Up the grand staircase, two floors, to 3F.");
  check("directions: elevator", Text.directions(3, 1, true, "en").includes("elevator down"));
  check("room list wording", Text.roomList(["201", "205", "207"], "en") === "Rooms 201, 205 and 207" && Text.roomList(["106"], "en") === "Room 106");
}

// ---- the challenge and the visit plan ----
{
  const all = [];
  for (const g of TourData.GALLERIES) {
    const qs = TourData.QUIZZES[g.id];
    check(`${g.id}: three challenge questions`, Array.isArray(qs) && qs.length === 3);
    for (const q of qs || []) {
      all.push(q);
      check(`${g.id}: "${q.q.slice(0, 40)}" has three different answers and a valid correct one`,
        q.a.length === 3 && new Set(q.a).size === 3 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 3);
      check(`${g.id}: "${q.q.slice(0, 40)}" in Chinese too`, !!q.zh && /[\u3400-\u9fff]/.test(q.zh.q) && q.zh.a.length === 3 && new Set(q.zh.a).size === 3);
      const about = TourData.QUIZZES[g.id] && g.highlights;
      check(`${g.id}: challenge is unlocked by the highlights`, Array.isArray(about) && about.length >= 2);
    }
  }
  check("the right answer isn't always in the same place", new Set(all.map(q => q.correct)).size === 3);
  check("passing needs most answers right", TourData.QUIZ_PASS === 2);
  check("plan is sorted into walking order, duplicates and unknown ids dropped",
    TourData.planOrder(["ivory-ball", "nope", "mao-gong-ding", "ivory-ball"]).join() === "mao-gong-ding,ivory-ball");
  const empty = TourData.planMinutes([]), one = TourData.planMinutes(["jade-duck"]);
  const everything = TourData.planMinutes(TourData.fullTour().map(t => t[1]));
  check("an empty plan takes no time", empty.low === 0 && empty.high === 0);
  check("one piece is about five minutes", one.low === 5 && one.high === 5, one);
  check("time ranges are ordered and in five-minute steps", everything.low < everything.high && everything.low % 5 === 0 && everything.high % 5 === 0, everything);
  check("a collapsed range reads naturally", TourData.minutesLabel({ low: 5, high: 5 }) === "about 5 minutes" && TourData.minutesLabel({ low: 20, high: 30 }) === "about 20–30 minutes");
  check("crossing floors costs more than staying on one",
    TourData.planMinutes(["mao-gong-ding", "ivory-ball"]).high > TourData.planMinutes(["mao-gong-ding", "song-hu"]).high);
}

// ---- the save file: a damaged or hand-edited save never stops the game ----
{
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const sorted = set => [...set].sort();

  const blank = Save.parse(null, world, "zh");
  check("no save: a fresh visit in the visitor's language", blank.seen.size === 0 && blank.settings.lang === "zh" && blank.savedPos === null && blank.companion === "with");
  check("no save: default settings", blank.settings.sound === true && blank.settings.textSpeed === "normal" && blank.settings.stepFree === false);
  check("no save: no tour running", blank.tour.active === false && blank.tour.mode === "full" && blank.tour.gallery === null && blank.tour.visited.size === 0);

  // a real visit survives the trip through JSON
  const visit = {
    seen: new Set(["mao-gong-ding", "jade-cong"]), plan: new Set(["ivory-ball"]), stamps: new Set(["bronze"]), spotted: new Set(["xi-zun"]),
    companion: "alone", settings: { sound: false, music: true, autoTalk: false, stepFree: true, textSpeed: "fast", lang: "zh" },
    tour: { active: true, mode: "gallery", gallery: "jade", visited: new Set(["jade-cong"]) }
  };
  const pos = { map: "3F", x: 12, y: 5, dir: "up" };
  const saved = JSON.parse(JSON.stringify(Save.serialize(visit, pos)));
  check("a save says which version it is", saved.v === 1);
  const back = Save.parse(saved, world, "en");
  check("round trip keeps what was seen, planned, stamped and found", same(sorted(back.seen), sorted(visit.seen)) && same(sorted(back.plan), ["ivory-ball"]) &&
    same(sorted(back.stamps), ["bronze"]) && same(sorted(back.spotted), ["xi-zun"]), back);
  check("round trip keeps settings and exploring alone", same(back.settings, visit.settings) && back.companion === "alone", back.settings);
  check("round trip keeps the tour", back.tour.active && back.tour.mode === "gallery" && back.tour.gallery === "jade" && same(sorted(back.tour.visited), ["jade-cong"]));
  check("round trip keeps where you stood", same(back.savedPos, pos), back.savedPos);

  // odd contents are dropped one by one, keeping the rest
  const odd = Save.parse({
    seen: ["mao-gong-ding", "not-a-piece", 7, null, { id: "x" }],
    plan: "ivory-ball", spotted: [["xi-zun"]], stamps: ["bronze", "gift-shop", 3],
    companion: "ALONE",
    settings: { sound: "yes", music: false, textSpeed: "warp", lang: "fr", stepFree: 1, extra: true, constructor: "x" },
    tour: { active: "true", mode: "gallery", gallery: "attic", visited: "jade-cong" }
  }, world, "en");
  check("unknown pieces and non-strings are dropped from what was seen", same(sorted(odd.seen), ["mao-gong-ding"]), sorted(odd.seen));
  check("a plan that isn't a list is ignored", odd.plan.size === 0 && odd.spotted.size === 0);
  check("only real exhibitions keep a stamp", same(sorted(odd.stamps), ["bronze"]));
  check("anything but \"alone\" means the docent comes along", odd.companion === "with");
  check("settings of the wrong type keep their defaults", odd.settings.sound === true && odd.settings.stepFree === false && odd.settings.music === false);
  check("an unknown text speed or language falls back", odd.settings.textSpeed === "normal" && odd.settings.lang === "en");
  check("unknown settings aren't copied in", !Object.hasOwn(odd.settings, "extra") && !Object.hasOwn(odd.settings, "constructor"));
  check("a one-gallery tour of an unknown gallery is dropped", odd.tour.mode === "full" && odd.tour.active === false && odd.tour.gallery === null);
  check("an unknown tour mode becomes the full tour", Save.parse({ tour: { mode: "speedrun", active: true } }, world, "en").tour.mode === "full");

  // where you stood: only a real, open tile counts
  const at = p => Save.parse({ pos: p }, world, "en").savedPos;
  check("an open tile is kept", same(at({ map: "1F", x: 12, y: 13, dir: "up" }), { map: "1F", x: 12, y: 13, dir: "up" }));
  check("a stair step is a place you can stand", !!at({ map: "1F", x: 12, y: 8, dir: "up" }));
  for (const p of [
    { map: "constructor", x: 1, y: 1, dir: "up" }, { map: "1F", x: 12, y: 15, dir: "toString" }, { map: "1F", x: 1.5, y: 3, dir: "up" },
    { map: "1F", x: -1, y: 3, dir: "up" }, { map: "1F", x: 99, y: 3, dir: "up" }, { map: "1F", x: 12, y: 2, dir: "up" }, "1F", null
  ]) check(`a bad position is ignored: ${JSON.stringify(p)}`, at(p) === null, at(p));
  const c = maps.jade.cases[0];
  const nudged = at({ map: "jade", x: c.x, y: c.y, dir: "up" });
  check("a gallery spot that became solid moves to open floor nearby", !!nudged && !World.isSolid(maps.jade, nudged.x, nudged.y) &&
    Math.abs(nudged.x - c.x) + Math.abs(nudged.y - c.y) <= 2, nudged);
  check("a lobby spot that became solid is ignored", at({ map: "1F", x: 3, y: 12, dir: "up" }) === null);

  // garbage of every shape just gives a fresh visit, never an exception
  for (const junk of [[], 42, "save", true, { seen: null, settings: null, tour: null, pos: {} }, { settings: [], tour: [], stamps: {} }, { pos: { map: "1F", x: "12", y: "13", dir: "up" } }]) {
    let r = null, threw = false;
    try { r = Save.parse(junk, world, "en"); } catch (e) { threw = true; }
    check(`odd save ${JSON.stringify(junk)} is read without throwing`, !threw && r && r.seen instanceof Set && r.settings.lang === "en");
  }
  check("the save key is versioned", /^pixel-palace-v\d+$/.test(Save.KEY));
}

// ---- it installs and works offline ----
{
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));
  check("manifest: standalone app with a name", manifest.display === "standalone" && manifest.name && manifest.short_name);
  const pngSize = f => { const b = fs.readFileSync(path.join(ROOT, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  for (const icon of manifest.icons) {
    const [w, h] = pngSize(icon.src);
    check(`manifest icon ${icon.src} is ${icon.sizes}`, `${w}x${h}` === icon.sizes, [w, h]);
  }
  check("has a maskable icon", manifest.icons.some(i => i.purpose === "maskable"));
  check("apple touch icon is 180px", pngSize("icons/apple-touch-icon.png").join("x") === "180x180");
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const listed = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\]);/)[1]);
  const needed = ["index.html", ...["css", "js", "js/pieces", "images/objects", "images/photos"].flatMap(d => fs.readdirSync(path.join(ROOT, d))
    .filter(f => fs.statSync(path.join(ROOT, d, f)).isFile()).map(f => `${d}/${f}`))].filter(f => !(f.startsWith("images/objects/") && f.endsWith(".png")));
  check("service worker caches every game file", needed.every(f => listed.includes(f)), needed.filter(f => !listed.includes(f)));
  check("the cut-outs' PNG sources aren't downloaded", !listed.some(f => /^images\/objects\/.*\.png$/.test(f)));
  const firstVisit = listed.reduce((n, f) => n + fs.statSync(path.join(ROOT, f)).size, 0);
  check("the first visit downloads under 8 MB, for museum Wi-Fi", firstVisit < 8e6, (firstVisit / 1e6).toFixed(1) + " MB");
  check("the big zoom photos are cached on demand, not up front", !listed.some(f => f.startsWith("images/zoom/")) && /images\/zoom\//.test(sw));
  check("the zoom cache is named after its photos, so new ones replace old", /const ZOOM_CACHE = "pixel-palace-zoom-[0-9a-f]{8}"/.test(sw));
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  check("no third-party requests in the page", !/https?:\/\/(?!www\.w3\.org)/.test(html.replace(/<!--[\s\S]*?-->/g, "")));
  check("no Pokémon references anywhere public", !/pok[eé]mon/i.test(html + JSON.stringify(manifest)));
}

console.log(`unit: ${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
