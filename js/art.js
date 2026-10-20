/*
  Hand-drawn pixel art: people and small decor, written as text. Each
  character is one pixel and maps through a palette; "." is transparent.

  Front and back views are symmetric, so they are written as left halves and
  mirrored. Side views face left; right is the mirror image. The second walk
  frame is the first one mirrored, which swaps which foot is forward.
*/
(function (root) {
  const sym = halves => halves.map(h => h + [...h].reverse().join(""));

  // ---- shared body parts (rows 11-15 of a 16x16 front view) ----
  const FRONT_LEGS = sym(["...oppPp", "....oppo", "....offo"]);
  const WALK_LEGS = ["....oppooppo....", "....oppooffo....", "....offo........"];

  // the player: a visitor in a knit beanie with a pom-pom
  const HEAD_BEANIE = sym([
    "......oo",
    ".....oww",
    "....occc",
    "...occCc",
    "...occcc",
    "..okCkCk",
    "..ohssss",
    "..ohsess",
    "..ohsess",
    "...osrss",
    "....osss"
  ]);

  const HEAD_HAIR = sym([
    "........",
    ".....ooo",
    "....ohhH",
    "...ohhhH",
    "...ohhhh",
    "..ohhhhh",
    "..ohhsss",
    "..ohsess",
    "..ohsess",
    "...osrss",
    "....osss"
  ]);

  // the docent wears their hair up in a bun
  const HEAD_BUN = sym([
    "......oo",
    ".....ohH",
    "....ohhH",
    "...ohhhH",
    "...ohhhh",
    "..ohhhhh",
    "..ohhsss",
    "..ohsess",
    "..ohsess",
    "...osrss",
    "....osss"
  ]);

  const BACK_BEANIE = sym([
    "......oo",
    ".....oww",
    "....occc",
    "...occCc",
    "...occcc",
    "..okCkCk",
    "..ohhhhh",
    "..ohhHhh",
    "..ohhhhh",
    "...ohhhh",
    "....osss"
  ]);

  const BACK_HAIR = sym([
    "........",
    ".....ooo",
    "....ohhH",
    "...ohhhH",
    "...ohhhh",
    "..ohhhhh",
    "..ohhhhh",
    "..ohhHhh",
    "..ohhhhh",
    "...ohhhh",
    "....osss"
  ]);

  const BACK_BUN = sym([
    "......oo",
    ".....ohH",
    "....ohhH",
    "...ohhhH",
    "...ohhhh",
    "..ohhhhh",
    "..ohhhhh",
    "..ohhHhh",
    "..ohhhhh",
    "...ohhhh",
    "....osss"
  ]);

  const TORSO = sym(["...ottTt", "..osttTt"]);
  // an admission ticket on a lanyard, and a tote-bag strap from behind
  const TORSO_TICKET = ["...otlTttTlto...", "..osttTggTttso.."];
  const TORSO_TOTE_BACK = ["...otltttTtto...", "..osttltttTtso.."];
  const TORSO_VEST = sym(["...ovvtt", "..osvvtt"]);
  const TORSO_VEST_BACK = sym(["...ovvvv", "..osvVvv"]);

  const SIDE_BEANIE = [
    ".......oooo.....",
    "......owwwwo....",
    ".....occccccco..",
    "....occCcccccco.",
    "....occccccccco.",
    "...okCkCkCkCkko.",
    "...ossssshhhho..",
    "...oessshhhho...",
    "...osssshhhho...",
    "....osrsshho....",
    ".....osssso....."
  ];
  const SIDE_HAIR = [
    "................",
    "......oooooo....",
    ".....ohhhhHho...",
    "....ohhhhhhHho..",
    "....ohhhhhhhho..",
    "...ohhhhhhhhho..",
    "...osshhhhhhho..",
    "...oessshhhho...",
    "...osssshhhho...",
    "....osrsshho....",
    ".....osssso....."
  ];
  const SIDE_BUN = [
    "........ooo.....",
    "......ooohHo....",
    ".....ohhhhHho...",
    "....ohhhhhhHho..",
    "....ohhhhhhhho..",
    "...ohhhhhhhhho..",
    "...osshhhhhhho..",
    "...oessshhhho...",
    "...osssshhhho...",
    "....osrsshho....",
    ".....osssso....."
  ];
  const SIDE_TORSO = [".....ottTto.....", ".....otsTto....."];
  const SIDE_TORSO_TICKET = [".....oltTto.....", ".....ogsTto....."];
  const SIDE_TORSO_VEST = [".....ovtvvo.....", ".....ovsvvo....."];
  const SIDE_LEGS = [".....oppPpo.....", "......oppo......", "......offo......"];
  const SIDE_WALK_LEGS = [".....oppppo.....", "....oppo.opo....", "....offo.offo..."];

  // stand + walk for one facing, from a 16-row stand
  function frames(stand, walkLegs) {
    return { stand, walk: [...stand.slice(1, 14), ...walkLegs] };
  }

  function template(front, back, side, torso, torsoBack, sideTorso) {
    return {
      down: frames([...front, ...torso, ...FRONT_LEGS], WALK_LEGS),
      up: frames([...back, ...torsoBack, ...FRONT_LEGS], WALK_LEGS),
      left: frames([...side, ...sideTorso, ...SIDE_LEGS], SIDE_WALK_LEGS)
    };
  }

  const TEMPLATES = {
    player: template(HEAD_BEANIE, BACK_BEANIE, SIDE_BEANIE, TORSO_TICKET, TORSO_TOTE_BACK, SIDE_TORSO_TICKET),
    person: template(HEAD_HAIR, BACK_HAIR, SIDE_HAIR, TORSO, TORSO, SIDE_TORSO),
    docent: template(HEAD_BUN, BACK_BUN, SIDE_BUN, TORSO_VEST, TORSO_VEST_BACK, SIDE_TORSO_VEST)
  };

  const SKIN = { s: "#f7c9a3", S: "#e3a27d", r: "#f19a8b" };
  const INK = { o: "#2b2235", e: "#2b2235", w: "#ffffff" };

  const LOOKS = {
    player: { template: "player", pal: { ...INK, ...SKIN, c: "#d9a441", C: "#f3cd72", k: "#a8782a", h: "#3a2a22", H: "#5a4334",
      t: "#34497a", T: "#26365c", l: "#b5352b", g: "#f6ecc4", p: "#2f3346", P: "#23263a", f: "#8a5a36" } },
    docent: { template: "docent", pal: { ...INK, ...SKIN, h: "#2a2532", H: "#4d4566", t: "#f6f3ec", T: "#d9d2c5",
      v: "#2f8b69", V: "#1f6a50", g: "#f3c84b", p: "#30344a", P: "#23263a", f: "#3b2b26" } },
    staff: { template: "person", pal: { ...INK, ...SKIN, h: "#3a2a22", H: "#5b4334", t: "#2d3f6b", T: "#1f2d50",
      p: "#2d3346", P: "#20253a", f: "#2b2226" } },
    visitorA: { template: "person", pal: { ...INK, ...SKIN, h: "#6b4426", H: "#8e6038", t: "#e2793a", T: "#b95a26",
      p: "#3d5b8c", P: "#2c4570", f: "#5a3a2a" } },
    visitorB: { template: "person", pal: { ...INK, ...SKIN, h: "#23202a", H: "#433e54", t: "#e480a9", T: "#bf5f86",
      p: "#5b4a70", P: "#433556", f: "#3a2a30" } },
    visitorC: { template: "person", pal: { ...INK, ...SKIN, h: "#dfb75f", H: "#f2d58a", t: "#5aa35d", T: "#3f8045",
      p: "#8c7a58", P: "#6c5d42", f: "#4a3a2a" } },
    elder: { template: "person", pal: { ...INK, s: "#f0c49f", S: "#d79f7c", r: "#e79a8a", h: "#bdb8b0", H: "#e2ded6",
      t: "#8b3a4b", T: "#6b2a38", p: "#4a4b55", P: "#36373f", f: "#2f2a2a" } },
    visitorD: { template: "person", pal: { ...INK, s: "#c98d63", S: "#a8704c", r: "#d9806f", h: "#2a1d18", H: "#4a352a",
      t: "#c23b3b", T: "#962a2a", p: "#2f3a4a", P: "#222b38", f: "#2a2020" } },
    visitorE: { template: "person", pal: { ...INK, s: "#8e5c3c", S: "#70442a", r: "#b8705c", h: "#151216", H: "#332b33",
      t: "#e9c46a", T: "#c49a3e", p: "#4b6a5a", P: "#36503f", f: "#2a2020" } },
    // a school uniform: white shirt, navy trousers, on a class trip
    student: { template: "person", pal: { ...INK, ...SKIN, h: "#1d1a22", H: "#3a3442", t: "#f4f2ec", T: "#d5d1c6",
      p: "#25315a", P: "#1a2344", f: "#1d1a22" } }
  };

  // ---- decor ----
  const DECOR = {
    // blue-and-white pot with a leafy plant; 16 wide, 24 tall, sits on the bottom 16
    plant: {
      pal: { o: "#233126", g: "#4f9a4c", G: "#78c060", d: "#2f6e3a", w: "#f4f1ea", b: "#2f5ea8", B: "#1f3f78", s: "#d9d4c8" },
      rows: [
        "......oooo......",
        "....oogGGgoo....",
        "...ogGGgGGgdo...",
        "..ogGgdgGGgddo..",
        "..ogggGgggdgdo..",
        ".ogGGgdgGGgdgdo.",
        ".odgggGggdgggdo.",
        "..odgGGgdgGgdo..",
        "..oddgggdggddo..",
        "...oddgdddddo...",
        "....oodddddo....",
        "......oddo......",
        "....oooooooo....",
        "...owwwwwwwwo...",
        "...obbbbbbbbo...",
        "..owwwwwwwwwwo..",
        "..owbbwwbbwwbo..",
        "..obwwbbwwbbwo..",
        "..owwwwwwwwwwo..",
        "..owwBwwwwBwwo..",
        "..owBbBwwBbBwo..",
        "..owwwwwwwwwwo..",
        "...obbbbbbbbo...",
        "...oswwwwwwso...",
        "....osssssso....",
        ".....oooooo....."
      ]
    },
    // a floor-guide sign on a post; 16 wide, 20 tall
    sign: {
      pal: { o: "#2b2235", W: "#8a5a36", w: "#5c3a24", p: "#f3e9d2", k: "#6b5a4e", r: "#c2382f", g: "#2f8b69", b: "#2f5ea8", y: "#d9a93c" },
      rows: [
        "................",
        ".oooooooooooooo.",
        ".oWWWWWWWWWWWWo.",
        ".oWppppppppppWo.",
        ".oWyypkkkkkppWo.",
        ".oWppppppppppWo.",
        ".oWrrpkkkkpppWo.",
        ".oWppppppppppWo.",
        ".oWggpkkkkkkpWo.",
        ".oWppppppppppWo.",
        ".oWbbpkkkppppWo.",
        ".oWppppppppppWo.",
        ".oWWWWWWWWWWWWo.",
        ".oooooooooooooo.",
        "......owWo......",
        "......owWo......",
        "......owWo......",
        ".....oowWoo.....",
        "....owwwwwwo....",
        "....oooooooo...."
      ]
    },
    // "!" (9 x 10): something new
    excl: {
      pal: { o: "#2b2235", w: "#ffffff", r: "#c2382f" },
      rows: [
        ".ooooooo.",
        "owwwrwwwo",
        "owwwrwwwo",
        "owwwrwwwo",
        "owwwwwwwo",
        "owwwrwwwo",
        ".ooooooo.",
        "..owo....",
        "...o.....",
        "........."
      ]
    },
    // "♪" (9 x 10): humming along
    note: {
      pal: { o: "#2b2235", w: "#ffffff", g: "#2f8b69" },
      rows: [
        ".ooooooo.",
        "owwwgggwo",
        "owwwgwgwo",
        "owwwgwwwo",
        "owwggwwwo",
        "owwggwwwo",
        ".ooooooo.",
        "..owo....",
        "...o.....",
        "........."
      ]
    },
    // speech bubble with "…" (9 x 8): something to ask about here
    talk: {
      pal: { o: "#2b2235", w: "#ffffff", d: "#2f8b69" },
      rows: [
        ".ooooooo.",
        "owwwwwwwo",
        "owwwwwwwo",
        "owdwdwdwo",
        "owwwwwwwo",
        ".ooooooo.",
        "..owo....",
        "...o....."
      ]
    }
  };

  // ---- builders (browser only) ----

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function fromRows(rows, pal) {
    const c = makeCanvas(rows[0].length, rows.length);
    const ctx = c.getContext("2d");
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = pal[row[x]];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });
    return c;
  }

  function mirrored(canvas) {
    const c = makeCanvas(canvas.width, canvas.height);
    const ctx = c.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, 0, 0);
    return c;
  }

  // eyes closed: the eye pixels become skin
  const closedEyes = rows => rows.map(r => r.replace(/e/g, "s"));

  /*
    { down: [stand, walkA, walkB], up: [...], left: [...], right: [...] },
    and each facing with a face also has .blink, the stand with eyes shut.
  */
  function characterFrames(lookId) {
    const look = LOOKS[lookId];
    const t = TEMPLATES[look.template];
    const out = {};
    for (const dir of ["down", "up", "left"]) {
      const stand = fromRows(t[dir].stand, look.pal);
      const walk = fromRows(t[dir].walk, look.pal);
      out[dir] = dir === "left" ? [stand, walk, walk] : [stand, walk, mirrored(walk)];
      if (dir !== "up") out[dir].blink = fromRows(closedEyes(t[dir].stand), look.pal);
    }
    out.right = out.left.map(mirrored);
    out.right.blink = mirrored(out.left.blink);
    return out;
  }

  const SPRITE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";

  function artifactCanvas(sprite, { silhouette = null } = {}) {
    const c = makeCanvas(sprite.w, sprite.h);
    const ctx = c.getContext("2d");
    for (let i = 0; i < sprite.px.length; i++) {
      const ch = sprite.px[i];
      if (ch === ".") continue;
      ctx.fillStyle = silhouette || sprite.pal[SPRITE_CHARS.indexOf(ch)];
      ctx.fillRect(i % sprite.w, Math.floor(i / sprite.w), 1, 1);
    }
    return c;
  }

  const api = { TEMPLATES, LOOKS, DECOR, sym, fromRows, mirrored, characterFrames, artifactCanvas, makeCanvas };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Art = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
