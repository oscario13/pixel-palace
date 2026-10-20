/*
  Every map in the game, drawn as text. One character is one 16px tile.

    #  outer wall            W  wall face (2 rows tall, top wall only)
    .  floor                 ,  rug / inlay (walkable)
    =  red carpet            B  balustrade around the stairwell
    u  stairs up             v  stairs down
    d  gallery doorway       r  roped-off doorway (read the sign)
    E  elevator              T  wall text panel (galleries)
    m  entrance / exit mat   s  floor-guide sign
    P  pillar   p  plant     b  bench     I  info desk

  The floors and room numbers are the museum's real ones, and each
  exhibition's doorway is on its real side of the grand staircase (npm.gov.tw,
  Exhibition Floor Plan, checked October 2026): jades west and bronzes east
  on 3F, ceramics east on 2F, Room 106 west on 1F. Only the four permanent
  exhibitions are open. The halls themselves are a simplified game map, and
  the game says so in About.

  The lobbies are drawn by hand below. The galleries are plain halls built
  from a few measurements by gallery(). Their display cases come straight
  from the exhibition's piece list (js/pieces/), so the cases always stand in
  walking order: each room's pieces zig-zag through a grid, starting from
  the side you come in. A floor sign marks where each new period begins.

  What visitors say is a pair of lines, [English, 中文].
*/
(function (root) {
  const TourData = typeof module !== "undefined" && module.exports ? require("./tour-data.js") : root.TourData;

  /*
    A plain hall. `exit` is the way in and out, the columns [x0, x1] of the
    bottom wall. `walls` are inner walls: { x, y0, y1, open } runs down a
    column, { y, x0, x1, open } across a row with a face below it; `open` is
    the gap left to walk through.
  */
  function gallery({ w, h, wallText, exit, walls = [], ring = null, benches = [] }) {
    const g = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => {
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1) return "#";
      return y <= 2 ? "W" : ".";
    }));
    for (let x = wallText[0]; x <= wallText[1]; x++) g[2][x] = "T";
    for (let x = exit[0]; x <= exit[1]; x++) g[h - 1][x] = "m";
    const gap = (wall, i) => wall.open && i >= wall.open[0] && i <= wall.open[1];
    for (const wall of walls) {
      if (wall.x != null) {
        for (let y = wall.y0; y <= wall.y1; y++) if (!gap(wall, y)) g[y][wall.x] = "#";
      } else {
        for (let x = wall.x0; x <= wall.x1; x++) {
          if (gap(wall, x)) continue;
          g[wall.y][x] = "#";
          g[wall.y + 1][x] = "W";
        }
      }
    }
    if (ring) {
      // a ring of inlaid floor around a 2x2 case whose top-left is (x, y)
      for (let y = ring.y - 1; y <= ring.y + 2; y++) {
        for (let x = ring.x - 1; x <= ring.x + 2; x++) {
          const edge = y === ring.y - 1 || y === ring.y + 2 || x === ring.x - 1 || x === ring.x + 2;
          if (edge) g[y][x] = ",";
        }
      }
    }
    for (const [x, y, len] of benches) for (let i = 0; i < len; i++) g[y][x + i] = "b";
    return g.map(r => r.join(""));
  }

  // One room's pieces on a grid, zig-zagging so the walk never doubles back.
  // A mirrored grid starts from the right, for a room entered on that side.
  function placeCases(ids, { x, y, cols, dx, dy, mirror = false }) {
    return ids.map((id, i) => {
      const row = Math.floor(i / cols), k = i % cols;
      const col = (row % 2 === 1) !== mirror ? cols - 1 - k : k;
      return { id, x: x + col * dx, y: y + row * dy };
    });
  }

  // A floor sign under the first case of each period.
  function sectionsFor(cases) {
    const out = [];
    let last = null;
    for (const c of cases) {
      const p = TourData.PIECES[c.id];
      const key = p.room + "/" + p.period;
      if (key !== last) out.push({ x: c.x + 0.5, y: c.y + 3.5, period: p.period });
      last = key;
    }
    return out;
  }

  /*
    A gallery map from its measurements. `rooms` are the museum's rooms in
    this hall in walking order, each with the columns it covers (and rows,
    for a room tucked into a corner), the grid its cases sit on, and where
    its name goes on the floor if not at its lower-left.
  */
  function galleryMap(id, spec) {
    const info = TourData.GALLERIES.find(g => g.id === id);
    const cases = spec.rooms.flatMap(r => placeCases(info.tour.filter(pid => TourData.PIECES[pid].room === r.room), r.grid));
    const star = cases.find(c => c.id === info.star);
    // the rope around the star piece: both sides and the back, not the front
    const blocked = [];
    for (let y = star.y - 1; y <= star.y + 2; y++) blocked.push([star.x - 1, y], [star.x + 2, y]);
    blocked.push([star.x, star.y - 1], [star.x + 1, star.y - 1]);
    return {
      kind: "gallery",
      gallery: id,
      rows: gallery({ ...spec, ring: { x: star.x, y: star.y } }),
      // a room in a corner is found before the hall around it
      rooms: spec.rooms.map(({ room, x0, x1, y0, y1, label }) => ({ room, x0, x1, y0, y1, label }))
        .sort((a, b) => (b.y0 != null) - (a.y0 != null)),
      sections: sectionsFor(cases),
      blocked,
      cases,
      npcs: spec.npcs
    };
  }

  const MAP_DEFS = {
    "1F": {
      kind: "lobby",
      floor: 1,
      rows: [
        "#########################",
        "#WWWWWWWWWWWWWWWWWWWWWWW#",
        "#WWWddWWWWWWEWWWWWWWWWWW#",
        "#p.P..P...........P..P.p#",
        "#.......................#",
        "#.......................#",
        "#........BBBBBBB........#",
        "#........BuuuuuB........#",
        "#........BuuuuuB........#",
        "#........BuuuuuB........#",
        "#........BuuuuuB........#",
        "#........s.===..........#",
        "#.III......===..........#",
        "#..........===..........#",
        "#...bb.....===.....bb...#",
        "#..........===..........#",
        "#........p.===.p........#",
        "#..........===..........#",
        "###########mmm###########"
      ],
      // Room 106 is on the west side
      doors: [{ x: 4, y: 2, to: "precious-crafts" }],
      spawn: { x: 12, y: 17, dir: "up" },
      npcs: [
        {
          id: "desk", look: "staff", x: 3, y: 11, dir: "down", counter: true,
          lines: [
            ["Welcome to the National Palace Museum!", "歡迎來到國立故宮博物院！"],
            ["A Garland of Treasures is right here on 1F, through the doorway on the west side. The ceramics are on 2F, and the bronzes and jades on 3F.",
              "集瓊藻就在1F，從西側的入口進去。陶瓷在2F，銅器和玉器在3F。"],
            ["The elevator is behind the grand staircase, if you'd like a step-free route.", "如果需要無障礙路線，電梯就在大樓梯後面。"],
            ["Already in the museum? Open the menu and choose Look up a room to see every piece in the room you're standing in.",
              "已經在博物館裡了嗎？打開選單，選「查詢展間」，就能看到你所在展間的每件文物。"]
          ]
        },
        {
          id: "v1f-a", look: "visitorA", x: 6, y: 16, dir: "up", wander: [1, 13, 9, 17],
          lines: [["I always start on the top floor and work my way down. Downhill the whole way!", "我都從頂樓開始，一路往下看。整趟都是下坡！"]]
        },
        {
          id: "v1f-b", look: "visitorB", x: 9, y: 5, dir: "left", wander: [7, 4, 11, 5],
          lines: [["I heard there's an ivory ball with eighteen layers in Room 106, just through that door. I have to see it.",
            "聽說106室有一顆十八層的象牙球，就在那扇門裡面。我一定要去看看。"]]
        },
        {
          id: "v1f-c", look: "student", x: 17, y: 12, dir: "left", wander: [15, 11, 22, 13],
          lines: [["Our class is meeting by the grand staircase. Everyone's late except me.", "我們班約在大樓梯集合。除了我，大家都遲到了。"]]
        }
      ]
    },

    "2F": {
      kind: "lobby",
      floor: 2,
      rows: [
        "#########################",
        "#WWWWWWWWWWWWWWWWWWWWWWW#",
        "#WWWWWWWWWWWEWWWWWWddWWW#",
        "#p.P..P...........P..P.p#",
        "#.......................#",
        "#.......................#",
        "#.....B.....BBBBBBB.....#",
        "#.....BvvvvvBuuuuuB.....#",
        "#.....BvvvvvBuuuuuB.....#",
        "#.....BvvvvvBuuuuuB.....#",
        "#.....BvvvvvBuuuuuB.....#",
        "#.....BBBBBBB.....Bs....#",
        "#.......................#",
        "#........,,,,,,,........#",
        "#...bb...,,,,,,,...bb...#",
        "#........,,,,,,,........#",
        "#.p......,,,,,,,......p.#",
        "#.......................#",
        "#########################"
      ],
      // the ceramics are on the east side
      doors: [{ x: 19, y: 2, to: "ceramics" }],
      npcs: [
        {
          id: "v2f-a", look: "visitorC", x: 15, y: 13, dir: "down", wander: [8, 12, 16, 17],
          lines: [["The ceramics are in Rooms 201, 205 and 207, all on the east side. Don't miss the tiny chicken cup!", "陶瓷在東側的201、205和207室。別錯過小小的雞缸杯！"]]
        },
        {
          id: "v2f-b", look: "elder", x: 21, y: 14, dir: "left",
          lines: [["My feet are tired. Good thing there are benches on every floor.", "腳好痠。還好每層樓都有椅子可以坐。"]]
        },
        {
          id: "v2f-c", look: "visitorD", x: 3, y: 12, dir: "right", wander: [1, 12, 5, 13],
          lines: [["The jades and bronzes are one more floor up. I'm saving them for last.", "玉器和銅器還要再上一層樓。我要留到最後再看。"]]
        }
      ]
    },

    "3F": {
      kind: "lobby",
      floor: 3,
      rows: [
        "#########################",
        "#WWWWWWWWWWWWWWWWWWWWWWW#",
        "#WWWddWWWWWWEWWWWWWddWWW#",
        "#p.P..P...........P..P.p#",
        "#.......................#",
        "#.......................#",
        "#........B.....B........#",
        "#........BvvvvvB........#",
        "#........BvvvvvB........#",
        "#........BvvvvvB........#",
        "#........BvvvvvB........#",
        "#........BBBBBBBs.......#",
        "#.......................#",
        "#........,,,,,,,........#",
        "#...bb...,,,,,,,...bb...#",
        "#........,,,,,,,........#",
        "#.p......,,,,,,,......p.#",
        "#.......................#",
        "#########################"
      ],
      // jades to the west, bronzes to the east
      doors: [{ x: 4, y: 2, to: "jade" }, { x: 19, y: 2, to: "bronze" }],
      npcs: [
        {
          id: "v3f-a", look: "visitorB", x: 10, y: 4, dir: "up", wander: [8, 4, 16, 5],
          lines: [["Everyone asks where the Jadeite Cabbage is. It's in Room 302 on this floor, but it travels to the Southern Branch, so check before you come.",
            "大家都在問翠玉白菜在哪裡。它在這層樓的302室，但會到南部院區輪展，來之前要先查一下。"]]
        },
        {
          id: "v3f-b", look: "visitorA", x: 17, y: 15, dir: "left", wander: [13, 12, 22, 17],
          lines: [["About five hundred characters inside one cauldron? I have to see the Mao Gong Ding.", "一個鼎裡有五百個字？我一定要看看毛公鼎。"]]
        },
        {
          id: "v3f-c", look: "visitorE", x: 4, y: 12, dir: "right", wander: [1, 12, 7, 13],
          lines: [["Bronzes to the east, jades to the west. I keep mixing them up!", "銅器在東邊，玉器在西邊。我老是搞混！"]]
        }
      ]
    },

    // Room 305 is the main hall, entered at its south-east; Room 307 is the
    // smaller room tucked into the south-west corner, nearer the stairs
    "bronze": galleryMap("bronze", {
      w: 46, h: 32, wallText: [38, 41], exit: [34, 35],
      walls: [{ y: 23, x0: 1, x1: 24, open: [20, 23] }, { x: 25, y0: 23, y1: 30 }],
      benches: [[30, 29, 3], [38, 29, 3]],
      rooms: [
        { room: "305", x0: 1, x1: 44, label: { x: 26, y: 30 }, grid: { x: 4, y: 5, cols: 8, dx: 5, dy: 6, mirror: true } },
        { room: "307", x0: 1, x1: 24, y0: 23, y1: 30, grid: { x: 4, y: 26, cols: 4, dx: 5, dy: 6, mirror: true } }
      ],
      npcs: [
        {
          id: "vb", look: "visitorC", x: 12, y: 9, dir: "up", wander: [7, 8, 22, 10],
          lines: [["Some of these inscriptions are almost three thousand years old, and people can still read them.", "有些銘文快三千年了，現在的人還讀得懂。"]]
        },
        {
          id: "vb3", look: "visitorB", x: 17, y: 21, dir: "down", wander: [12, 20, 27, 22],
          lines: [["The bells over there were made for the man who helped Duke Wen of Jin become the strongest ruler of his time.", "那邊那組編鐘，是為幫助晉文公稱霸的子犯鑄造的。"]]
        },
        {
          id: "vb2", look: "elder", x: 12, y: 29, dir: "up",
          lines: [["The First Emperor and Wang Mang both tried to make every measure the same. Compare the Qin scoop in 305 with the Jialiang here!",
            "秦始皇和王莽都想統一度量衡。比較一下305室的秦量和這裡的嘉量吧！"]]
        },
        {
          id: "vb4", look: "student", x: 34, y: 26, dir: "up", wander: [28, 24, 42, 27],
          lines: [["For homework we have to copy one character from an inscription. I picked the easiest one I could find.", "我們的作業是從銘文裡抄一個字。我挑了找得到最簡單的那個。"]]
        }
      ]
    }),

    "jade": galleryMap("jade", {
      w: 30, h: 19, wallText: [13, 16], exit: [14, 15],
      benches: [[6, 17, 2], [22, 17, 2]],
      rooms: [{ room: "306", x0: 1, x1: 28, grid: { x: 4, y: 5, cols: 5, dx: 5, dy: 7 } }],
      npcs: [
        {
          id: "vj", look: "elder", x: 12, y: 10, dir: "right", wander: [8, 9, 22, 10],
          lines: [["My grandmother always said jade stands for virtue. That's why people wore it.", "我奶奶常說，玉代表美德，所以大家才會佩戴它。"]]
        },
        {
          id: "vj2", look: "visitorA", x: 20, y: 16, dir: "up", wander: [6, 15, 25, 16],
          lines: [["The little pig-dragon looks like a curled-up baby animal. It's over five thousand years old!", "那隻小玉豬龍看起來像蜷著的小動物，已經五千多年了！"]]
        }
      ]
    }),

    // Room 201, by the stairs, holds the earliest pieces; it opens east into
    // Room 205 (Song to Qing)
    "ceramics": galleryMap("ceramics", {
      w: 37, h: 29, wallText: [7, 10], exit: [5, 6],
      walls: [{ x: 13, y0: 3, y1: 27, open: [12, 16] }],
      benches: [[9, 27, 3], [17, 27, 3], [29, 27, 3]],
      rooms: [
        { room: "201", x0: 1, x1: 12, grid: { x: 3, y: 5, cols: 2, dx: 5, dy: 6 } },
        { room: "205", x0: 14, x1: 35, grid: { x: 16, y: 5, cols: 4, dx: 5, dy: 6 } }
      ],
      npcs: [
        {
          id: "vc", look: "visitorA", x: 19, y: 15, dir: "up", wander: [18, 14, 30, 16],
          lines: [["Five of the six Ru narcissus basins in the world are in this museum. Five!", "全世界六件汝窯水仙盆，有五件在這裡。五件耶！"]]
        },
        {
          id: "vc2", look: "elder", x: 6, y: 21, dir: "up", wander: [2, 20, 11, 22],
          lines: [["That white pitcher is shaped like a bird calling to the sky. People back then thought birds were their ancestors.", "那件白陶鬹像一隻仰天鳴叫的鳥。當時的人相信鳥是他們的祖先。"]]
        }
      ]
    }),

    "precious-crafts": galleryMap("precious-crafts", {
      w: 30, h: 19, wallText: [13, 16], exit: [14, 15],
      benches: [[6, 17, 2], [22, 17, 2]],
      rooms: [{ room: "106", x0: 1, x1: 28, grid: { x: 4, y: 5, cols: 5, dx: 5, dy: 7 } }],
      npcs: [
        {
          id: "vp", look: "visitorB", x: 7, y: 10, dir: "left", wander: [7, 9, 22, 10],
          lines: [["Eighteen layers, and every one of them moves? I need a closer look.", "十八層，而且每一層都會動？我要靠近一點看。"]]
        },
        {
          id: "vp2", look: "visitorC", x: 22, y: 15, dir: "up", wander: [8, 15, 25, 16],
          lines: [["A pocket watch with cupids on it, made in Switzerland for buyers in China. I love it.", "一只畫著小愛神的懷錶，在瑞士為中國買家做的。好喜歡！"]]
        }
      ]
    })
  };

  const api = { MAP_DEFS, placeCases };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Maps = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
