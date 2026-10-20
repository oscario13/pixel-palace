/*
  Text helpers with no DOM: splitting long blurbs into dialogue-box pages,
  and the docent's one-line directions between floors, in either language.
*/
(function (root) {
  const PAGE_MAX = 150;
  // Chinese packs about twice the meaning into each character
  const PAGE_MAX_ZH = 72;

  const Lang = typeof module !== "undefined" && module.exports ? require("./lang.js") : root.Lang;
  const isCJK = text => /[㐀-鿿]/.test(text);
  const lang = () => (Lang ? Lang.get() : "en");

  // English sentences end at . ! or ? (plus a closing quote), followed by a
  // capital; Chinese ones at 。！？ (plus a closing quote), with no space.
  function sentences(text) {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (!clean) return [];
    if (isCJK(clean)) return clean.match(/[^。！？]+(?:[。！？]+[」』）]*|$)/g).map(s => s.trim()).filter(Boolean);
    return clean.split(/(?<=[.!?]["”’)]?)\s+(?=["“‘(]?[A-Z0-9])/);
  }

  // Break one over-long sentence at the comma or dash nearest the limit.
  function splitLong(sentence, max) {
    const parts = [];
    let rest = sentence;
    const zh = isCJK(sentence);
    while (rest.length > max) {
      const window = rest.slice(0, max);
      let cut, keep;
      if (zh) {
        cut = Math.max(window.lastIndexOf("，"), window.lastIndexOf("；"), window.lastIndexOf("："), window.lastIndexOf("、"));
        if (cut < max * 0.4) cut = max - 1;
        keep = cut + 1;
      } else {
        cut = Math.max(window.lastIndexOf(", "), window.lastIndexOf("; "), window.lastIndexOf(" — "));
        if (cut < max * 0.4) cut = window.lastIndexOf(" ");
        if (cut <= 0) cut = max;
        keep = cut + (rest[cut] === "," || rest[cut] === ";" ? 1 : 0);
      }
      parts.push(rest.slice(0, keep).trim());
      rest = zh ? rest.slice(keep).trim() : rest.slice(cut).replace(/^[,;]?\s*(—\s*)?/, "").trim();
    }
    if (rest) parts.push(rest);
    return parts;
  }

  function paginate(text, max) {
    const zh = isCJK(String(text));
    const limit = max || (zh ? PAGE_MAX_ZH : PAGE_MAX);
    const join = zh ? "" : " ";
    const pages = [];
    let page = "";
    for (const s of sentences(text).flatMap(s => (s.length > limit ? splitLong(s, limit) : [s]))) {
      if (page && page.length + join.length + s.length > limit) {
        pages.push(page);
        page = s;
      } else {
        page = page ? page + join + s : s;
      }
    }
    if (page) pages.push(page);
    return pages;
  }

  const FLOOR_WORDS = { en: ["", "one floor", "two floors"], zh: ["", "一層", "兩層"] };

  // "Up the grand staircase, two floors, to 3F." and so on, for the docent.
  function directions(fromFloor, toFloor, stepFree, lng = lang()) {
    const diff = toFloor - fromFloor;
    const zh = lng === "zh";
    if (diff === 0) return zh ? "就在這一層。" : "It's right here on this floor.";
    const words = FLOOR_WORDS[zh ? "zh" : "en"];
    const n = words[Math.abs(diff)] || Math.abs(diff) + (zh ? "層" : " floors");
    if (zh) {
      if (stepFree) return `我們搭電梯${diff > 0 ? "上" : "下"}${n}，到${toFloor}F。`;
      return `沿著大樓梯${diff > 0 ? "往上" : "往下"}${n}，到${toFloor}F。`;
    }
    if (stepFree) return `Let's take the elevator ${diff > 0 ? "up" : "down"} ${n}, to ${toFloor}F.`;
    return diff > 0
      ? `Up the grand staircase, ${n}, to ${toFloor}F.`
      : `Down the grand staircase, ${n}, to ${toFloor}F.`;
  }

  function roomList(rooms, lng = lang()) {
    if (lng === "zh") return `${rooms.join("、")} 陳列室`;
    if (rooms.length === 1) return "Room " + rooms[0];
    return "Rooms " + rooms.slice(0, -1).join(", ") + " and " + rooms[rooms.length - 1];
  }

  const roomName = (room, lng = lang()) => (lng === "zh" ? `${room} 陳列室` : `Room ${room}`);

  const api = { PAGE_MAX, PAGE_MAX_ZH, isCJK, sentences, paginate, directions, roomList, roomName };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Text = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
