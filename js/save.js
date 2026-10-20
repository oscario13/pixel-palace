/*
  The save file: what a visit keeps between sessions, and the checks that
  read it back. Anything odd in a save is dropped rather than trusted, so a
  damaged or hand-edited save can never stop the game from starting. No DOM
  and no storage here, so tests/unit.js runs all of it in Node; game.js does
  the reading and writing of localStorage.
*/
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports;
  const TourData = inNode ? require("./tour-data.js") : root.TourData;
  const World = inNode ? require("./world.js") : root.World;
  const Lang = inNode ? require("./lang.js") : root.Lang;

  const KEY = "pixel-palace-v1";
  const SETTINGS = { sound: true, music: true, autoTalk: true, stepFree: false, textSpeed: "normal", lang: "en" };
  const TOUR_MODES = ["full", "short", "plan", "gallery"];
  const SPEEDS = ["slow", "normal", "fast", "instant"];
  // where to look for open floor, nearest first, when a saved spot is now solid
  const NEARBY = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0], [-2, 0], [0, -2]];

  // A visit with nothing seen yet, in the visitor's language.
  function fresh(lang) {
    return {
      seen: new Set(), plan: new Set(), stamps: new Set(), spotted: new Set(), companion: "with",
      settings: { ...SETTINGS, lang },
      tour: { active: false, mode: "full", gallery: null, visited: new Set() },
      savedPos: null
    };
  }

  // What's kept between visits, as plain JSON. `pos` is where to continue.
  function serialize(state, pos) {
    return {
      v: 1, seen: [...state.seen], settings: state.settings, pos, plan: [...state.plan], stamps: [...state.stamps],
      spotted: [...state.spotted], companion: state.companion,
      tour: { active: state.tour.active, mode: state.tour.mode, gallery: state.tour.gallery, visited: [...state.tour.visited] }
    };
  }

  function readSettings(saved, lang) {
    const out = { ...SETTINGS, lang };
    if (!saved || typeof saved !== "object") return out;
    for (const k of Object.keys(SETTINGS)) {
      if (Object.hasOwn(saved, k) && typeof saved[k] === typeof SETTINGS[k]) out[k] = saved[k];
    }
    if (!SPEEDS.includes(out.textSpeed)) out.textSpeed = SETTINGS.textSpeed;
    if (!Lang.LANGS.includes(out.lang)) out.lang = lang;
    return out;
  }

  function readTour(saved, ids, galleries) {
    const out = fresh().tour;
    if (!saved || typeof saved !== "object") return out;
    out.active = saved.active === true;
    out.mode = TOUR_MODES.includes(saved.mode) ? saved.mode : "full";
    out.gallery = typeof saved.gallery === "string" && galleries.has(saved.gallery) ? saved.gallery : null;
    if (out.mode === "gallery" && !out.gallery) {
      out.mode = "full";
      out.active = false;
    }
    out.visited = new Set(ids(saved.visited));
    return out;
  }

  // Where to continue from, or null. A gallery spot that has since become
  // solid (a new rope, say) moves to the nearest open floor.
  function readPosition(pos, world) {
    if (!pos || typeof pos !== "object" || typeof pos.map !== "string" || !Object.hasOwn(world.maps, pos.map)) return null;
    const map = world.maps[pos.map];
    if (!Number.isInteger(pos.x) || !Number.isInteger(pos.y) || typeof pos.dir !== "string" || !Object.hasOwn(World.DIRS, pos.dir)) return null;
    if (pos.x < 0 || pos.y < 0 || pos.x >= map.w || pos.y >= map.h) return null;
    const open = (x, y) => !World.isSolid(map, x, y) && !World.isWarp(map, x, y);
    if (open(pos.x, pos.y)) return { map: pos.map, x: pos.x, y: pos.y, dir: pos.dir };
    if (map.kind !== "gallery") return null;
    const near = NEARBY.map(([dx, dy]) => ({ x: pos.x + dx, y: pos.y + dy }))
      .find(p => open(p.x, p.y) && World.tileAt(map, p.x, p.y) !== "#");
    return near ? { map: pos.map, x: near.x, y: near.y, dir: pos.dir } : null;
  }

  // Read a save back into a visit. `lang` is the visitor's own language,
  // used when the save doesn't say or names one the game doesn't have.
  function parse(data, world, lang) {
    const out = fresh(lang);
    if (!data || typeof data !== "object") return out;
    try {
      const known = new Set(TourData.fullTour().map(s => s[1]));
      const galleries = new Set(TourData.GALLERIES.map(g => g.id));
      const ids = list => (Array.isArray(list) ? list.filter(id => typeof id === "string" && known.has(id)) : []);
      out.seen = new Set(ids(data.seen));
      out.plan = new Set(ids(data.plan));
      out.spotted = new Set(ids(data.spotted));
      if (Array.isArray(data.stamps)) out.stamps = new Set(data.stamps.filter(id => typeof id === "string" && galleries.has(id)));
      out.companion = data.companion === "alone" ? "alone" : "with";
      out.settings = readSettings(data.settings, lang);
      out.tour = readTour(data.tour, ids, galleries);
      out.savedPos = readPosition(data.pos, world);
    } catch (e) {
      // keep whatever was read before the surprise
      console.warn("Ignoring part of an unreadable save", e);
    }
    return out;
  }

  const api = { KEY, SETTINGS, fresh, serialize, parse };
  if (inNode) module.exports = api;
  else root.Save = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
