/*
  The four permanent exhibitions and every piece in this game, checked
  against the National Palace Museum's own pages in October 2026:

    - floors, rooms, which side of the building they're on, and exhibition
      titles: npm.gov.tw Exhibition Floor Plan
    - which pieces are in which room: the museum's "Selections by Gallery"
      (theme.npm.edu.tw/selection) and its Classic Tour II route
    - every fact the docent says: that piece's own museum page (`source`)

  The pieces themselves live in js/pieces/, one file per exhibition, in
  walking order. This file adds the exhibitions, the challenge questions and
  the visit-plan arithmetic. Objects on display do change, so the game says
  to check before a visit.
*/
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports;
  const Lang = inNode ? require("./lang.js") : root.Lang;
  const DATA = inNode
    ? { bronze: require("./pieces/bronze.js"), jade: require("./pieces/jade.js"), ceramics: require("./pieces/ceramics.js"), crafts: require("./pieces/crafts.js") }
    : root.PieceData;
  const L = Lang.L;

  const SELECTION = (sno, lang = 2) => `https://theme.npm.edu.tw/selection/Article.aspx?sNo=${sno}&lang=${lang}`;
  const CHECKED = "October 2026";
  const CHECKED_ZH = "2026年10月";

  const GALLERIES = [
    {
      id: "bronze", side: "east", data: "bronze", floor: 3, rooms: ["305", "307"],
      name: "Rituals Cast in Brilliance: Masterpieces of Bronzes in the Museum Collection",
      title: "Rituals Cast in Brilliance", nameZh: "吉金耀采", short: "Bronzes", since: "2010-05-20",
      intro: "Welcome to Rituals Cast in Brilliance, Rooms 305 and 307. China's Bronze Age began in the late Xia dynasty and lasted about 1,500 years, through the Shang and Zhou. Only the ruling class could commission bronzes. Most were ritual vessels for offerings to ancestors, and the number and arrangement of bronzes at a ceremony showed a noble's rank. Many carry inscriptions recording feasts, battles, rewards and appointments.",
      zh: {
        title: "吉金耀采", name: "吉金耀采－院藏銅器精華展", short: "銅器",
        intro: "歡迎來到「吉金耀采」，305和307陳列室。中國的青銅時代從夏代晚期開始，歷經商、周，延續約一千五百年。只有統治階層才能鑄造銅器，大多是祭祀祖先的禮器；典禮中銅器的數量和組合，代表貴族的身分等級。許多銅器上鑄有銘文，記錄宴饗、戰爭、賞賜和冊命。"
      },
      star: "mao-gong-ding"
    },
    {
      id: "jade", side: "west", data: "jade", floor: 3, rooms: ["306", "308"],
      name: "Art in Quest of Heaven and Truth: Masterpieces of Jades in the Museum Collection",
      title: "Art in Quest of Heaven and Truth", nameZh: "敬天格物", short: "Jades", since: "2010-12-01",
      intro: "This is Art in Quest of Heaven and Truth, Rooms 306 and 308. More than seven thousand years ago, people already treasured jade as a beautiful stone that lasts forever. Early cultures shaped it into round bi discs and square cong tubes for their rituals. Later, jade came to stand for a person's virtue, and later still it became an art of exquisite carving.",
      zh: {
        title: "敬天格物", name: "敬天格物－院藏玉器精華展", short: "玉器",
        intro: "這裡是「敬天格物」，306和308陳列室。七千多年前，人們就已珍愛玉這種永恆不朽的美石。早期文化把它琢成圓形的璧、方形的琮，用於祭祀。後來玉成為君子美德的象徵，再後來又發展成精雕細琢的藝術。"
      },
      star: "jade-cong"
    },
    {
      id: "ceramics", side: "east", data: "ceramics", floor: 2, rooms: ["201", "205", "207"],
      name: "The Magic of Kneaded Clay: Ceramic Collection of the National Palace Museum",
      title: "The Magic of Kneaded Clay", nameZh: "摶泥幻化", short: "Ceramics", since: "2010-02-10",
      intro: "The Magic of Kneaded Clay fills Rooms 201, 205 and 207. Most of the museum's ceramics come from the Qing imperial collection, and emperors, officials and potters all shaped the styles of each period. Room 201 holds the earliest pieces, from the Neolithic to the Five Dynasties. Room 205 holds treasures from the Song through the Qing.",
      zh: {
        title: "摶泥幻化", name: "摶泥幻化", short: "陶瓷",
        intro: "「摶泥幻化」位在201、205和207陳列室。故宮的陶瓷大多來自清宮舊藏，每個時代的風格，都由皇帝、官員和陶工共同塑造。201室是最早的作品，從新石器時代到五代；205室則是宋代到清代的珍品。"
      },
      star: "ru-narcissus-bowl"
    },
    {
      id: "precious-crafts", side: "west", data: "crafts", floor: 1, rooms: ["106"],
      name: "A Garland of Treasures: Masterpieces of Precious Crafts in the Museum Collection",
      title: "A Garland of Treasures", nameZh: "集瓊藻", short: "A Garland of Treasures", since: "2014-08-01",
      intro: "This is A Garland of Treasures, Room 106. The name comes from a curio box that belonged to the Qianlong Emperor, and it means a group of small but precious things. Here you'll find enamels, accessories, objects for a scholar's desk, lacquerware, Buddhist ritual objects, carvings and curio boxes, most of them once used in daily life at the Qing court.",
      zh: {
        title: "集瓊藻", name: "集瓊藻—院藏珍玩精華展", short: "集瓊藻",
        intro: "這裡是「集瓊藻」，106陳列室。展名來自乾隆皇帝的一件多寶格，意思是一群小而珍貴的寶物。這裡有琺瑯、佩飾、文房用品、漆器、佛教法器、雕刻和多寶格，大多是清宮日常生活中使用過的東西。"
      },
      star: "ivory-ball"
    }
  ];

  // Every piece, keyed by id, with its museum page filled in.
  const PIECES = {};
  for (const g of GALLERIES) {
    const { PIECES: pieces, PERIODS } = DATA[g.data];
    g.periods = PERIODS;
    g.tour = Object.keys(pieces);
    g.highlights = g.tour.filter(id => pieces[id].highlight);
    for (const [id, p] of Object.entries(pieces)) {
      PIECES[id] = {
        ...p,
        gallery: g.id,
        photo: p.photo !== false,
        source: p.source || SELECTION(p.sno),
        sourceZh: p.sno ? SELECTION(p.sno, 1) : p.source.replace(/([?&]l=)2\b/, "$11")
      };
    }
  }

  const SIGNS = {
    treasures302: {
      en: "Room 302 · A Gathering of Treasures in the National Palace Museum North and South. The Jadeite Cabbage and the Meat-Shaped Stone are shown here, but they travel: the museum lists the Jadeite Cabbage at the Southern Branch in Chiayi from 8 December 2026 to 7 March 2027. Check npm.gov.tw before you come. Not part of this tour.",
      zh: "302 陳列室展出院藏精品，翠玉白菜和肉形石都在這裡，但它們會南北輪展：故宮公告翠玉白菜於2026年12月8日至2027年3月7日在嘉義南部院區展出。參觀前請先查看 npm.gov.tw。不在本導覽範圍內。"
    }
  };

  /*
    The junior docent challenge: three questions per gallery, unlocked once
    the gallery's highlights have been seen. Every answer is something the
    docent says about a highlight, so the quiz only tests what the game taught.
  */
  const QUIZZES = {
    "bronze": [
      { q: "About how many characters are cast inside the Mao Gong Ding?", a: ["About 50", "About 500", "About 5,000"], correct: 1,
        zh: { q: "毛公鼎內鑄有大約多少字？", a: ["約50字", "約500字", "約5,000字"] } },
      { q: "What does the inscription inside the San pan record?", a: ["A land settlement between two states", "A recipe for rice wine", "A list of the king's horses"], correct: 0,
        zh: { q: "散氏盤內的銘文記錄了什麼？", a: ["兩國之間的土地交割", "米酒的釀法", "國王的馬匹清單"] } },
      { q: "Why was the Jialiang measure made?", a: ["To tell the time", "To burn incense", "So grain was measured the same way everywhere"], correct: 2,
        zh: { q: "為什麼要製作嘉量？", a: ["用來計時", "用來焚香", "讓各地量穀物的標準一樣"] } }
    ],
    "jade": [
      { q: "What does the name \"bixie\" mean?", a: ["Flying horse", "To ward off evil", "Long life"], correct: 1,
        zh: { q: "「辟邪」這個名字是什麼意思？", a: ["飛馬", "避開邪惡", "長壽"] } },
      { q: "In the Longshan culture, who was allowed to use jade?", a: ["Only the ruling class", "Everyone", "Only children"], correct: 0,
        zh: { q: "在龍山文化，誰可以使用玉器？", a: ["只有統治者", "每個人", "只有小孩"] } },
      { q: "Why was the jade cong never carved with the Qianlong Emperor's poems?", a: ["Jade can't be carved twice", "It probably reached the Qing court only in the 19th century", "The poems were sanded off"], correct: 1,
        zh: { q: "為什麼這件玉琮上沒有乾隆皇帝的題詩？", a: ["玉不能刻兩次", "它大約在十九世紀才入藏清宮", "詩被磨掉了"] } }
    ],
    "ceramics": [
      { q: "What makes the Ru ware narcissus basin so famous?", a: ["It's the largest Ru piece", "It's painted with dragons", "Its sky-blue glaze has no crackle at all"], correct: 2,
        zh: { q: "汝窯水仙盆為什麼這麼有名？", a: ["它是最大的汝窯", "上面畫著龍", "天青釉上完全沒有紋片"] } },
      { q: "How many Ru narcissus basins are known, and how many are in this museum?", a: ["Six known, five here", "Ten known, one here", "Two known, both here"], correct: 0,
        zh: { q: "汝窯水仙盆全世界有幾件？故宮有幾件？", a: ["六件，故宮有五件", "十件，故宮有一件", "兩件，都在故宮"] } },
      { q: "What sport is the Tang lady on horseback playing?", a: ["Archery", "Polo", "Football"], correct: 1,
        zh: { q: "騎在馬上的唐代仕女在玩什麼運動？", a: ["射箭", "馬球", "踢球"] } }
    ],
    "precious-crafts": [
      { q: "How many nested balls are inside the ivory ball?", a: ["Eight", "Eighteen", "Eighty"], correct: 1,
        zh: { q: "象牙套球一共有幾層？", a: ["八層", "十八層", "八十層"] } },
      { q: "Where does the name \"A Garland of Treasures\" come from?", a: ["A curio box of the Qianlong Emperor", "A Tang dynasty poem", "A Ming garden"], correct: 0,
        zh: { q: "「集瓊藻」這個展名從哪裡來？", a: ["乾隆皇帝的一件多寶格", "一首唐詩", "一座明代花園"] } },
      { q: "How many items does the lacquer curio cabinet's set count?", a: ["9", "1,009", "109"], correct: 2,
        zh: { q: "剔紅雲龍紋小櫃整組共有幾件？", a: ["9件", "1,009件", "109件"] } }
    ]
  };
  const QUIZ_PASS = 2;

  // Spot this many pieces of a gallery in the real museum for its "seen in
  // person" seal.
  const SPOT_SEAL = 3;

  // ---- reading the data in the current language ----

  // A piece's or a gallery's text field, in Chinese when the game is.
  const text = (obj, field) => (Lang.isZh() && obj.zh && obj.zh[field] ? obj.zh[field] : obj[field]);
  const pieceName = p => L(p.name, p.nameZh);
  const pieceDate = p => L(p.date, p.dateZh);
  const pieceSource = p => L(p.source, p.sourceZh);
  const galleryTitle = g => L(g.title, g.zh.title);
  // which side of the grand staircase the exhibition opens from
  const gallerySide = g => (g.side === "east" ? L("on the east side", "東側") : L("on the west side", "西側"));
  const galleryShort = g => L(g.short, g.zh.short);
  const galleryName = g => L(g.name, g.zh.name);
  const periodName = (g, key) => L(g.periods[key].en, g.periods[key].zh);
  const quiz = q => (Lang.isZh() ? { q: q.zh.q, a: q.zh.a, correct: q.correct } : q);
  const sign = key => L(SIGNS[key].en, SIGNS[key].zh);

  // ---- tours and plans ----

  // Every piece, gallery by gallery, top floor down, as [galleryId, pieceId].
  function fullTour() {
    return GALLERIES.flatMap(g => g.tour.map(id => [g.id, id]));
  }

  // The docent's highlights tour: the museum's best-known pieces.
  function highlightTour() {
    return GALLERIES.flatMap(g => g.highlights.map(id => [g.id, id]));
  }

  // The short tour: two must-sees in each gallery, for a visit of under an hour.
  const MUST_SEE = ["mao-gong-ding", "xi-zun", "jade-cong", "bi-xie", "ru-narcissus-bowl", "doucai-chicken-cup", "silver-raft-cup", "ivory-ball"];
  function shortTour() {
    return fullTour().filter(([, id]) => MUST_SEE.includes(id));
  }

  function galleryOf(pieceId) {
    return GALLERIES.find(g => g.tour.includes(pieceId)) || null;
  }

  // Every room the exhibitions use, top floor down, with the pieces in it.
  function rooms() {
    return GALLERIES.flatMap(g => g.rooms.map(room => ({ room, floor: g.floor, gallery: g.id, pieces: g.tour.filter(id => PIECES[id].room === room) })));
  }

  // A visitor's saved pieces in walking order: top floor down, gallery by
  // gallery, the way the tours go.
  function planOrder(ids) {
    const order = fullTour().map(s => s[1]);
    return [...new Set(ids)].filter(id => order.includes(id)).sort((x, y) => order.indexOf(x) - order.indexOf(y));
  }

  /*
    A stated rule of thumb, not measured data: 3 to 6 minutes per piece,
    plus 4 minutes for each change of gallery and 3 for each change of
    floor, rounded to the nearest 5 minutes.
  */
  const MINUTES = { pieceLow: 3, pieceHigh: 6, gallery: 4, floor: 3 };
  function planMinutes(ids) {
    const order = planOrder(ids);
    if (!order.length) return { low: 0, high: 0 };
    let moves = 0;
    for (let i = 1; i < order.length; i++) {
      const a = galleryOf(order[i - 1]), b = galleryOf(order[i]);
      if (a.id !== b.id) moves += MINUTES.gallery + (a.floor !== b.floor ? MINUTES.floor : 0);
    }
    const round5 = m => Math.max(5, Math.round(m / 5) * 5);
    return { low: round5(order.length * MINUTES.pieceLow + moves), high: round5(order.length * MINUTES.pieceHigh + moves) };
  }

  // "about 20–30 minutes", or "about 5 minutes" when the range collapses
  function minutesLabel({ low, high }) {
    if (Lang.isZh()) return low === high ? `約 ${low} 分鐘` : `約 ${low}–${high} 分鐘`;
    return low === high ? `about ${low} minutes` : `about ${low}–${high} minutes`;
  }

  const checked = () => L(CHECKED, CHECKED_ZH);

  const api = {
    GALLERIES, PIECES, SIGNS, CHECKED, QUIZZES, QUIZ_PASS, SPOT_SEAL, MINUTES,
    text, pieceName, pieceDate, pieceSource, galleryTitle, gallerySide, galleryShort, galleryName, periodName, quiz, sign, checked,
    MUST_SEE, fullTour, highlightTour, shortTour, galleryOf, rooms, planOrder, planMinutes, minutesLabel
  };
  if (inNode) module.exports = api;
  else root.TourData = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
