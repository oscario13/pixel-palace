# Pixel Palace

A pixel-art walk through the **National Palace Museum's four permanent
exhibitions**, with a junior docent who follows you, asks where you want to go,
leads you there, and introduces each piece when you walk up to its case. It
covers all **68 pieces** the museum lists for those galleries, in **English or
Traditional Chinese**, and doubles as a companion inside the real museum:
**Look up a room** shows every piece in the room you're standing in.

**An independent student project. Not affiliated with or endorsed by the
National Palace Museum.**

## Design

The look is the game's own, taken from the museum rather than from any other
game. Text sits on rice-paper "wall labels" with an ink rule. The speaker is a
cinnabar seal stamp, the photo card is a lit vitrine, and the title screen is an
admission ticket. The logo is drawn from the game's own pixel letters. All the
pixel art (characters, tiles, icon) is drawn in code in `js/art.js`,
`js/tiles.js` and `tools/icon.html`. The case sprites are generated from the
museum's open-data photos.

## How it feels

The polish follows what research and well-loved games point to: effects tied
to events and used sparingly ("juice"), lighting doing the atmosphere work
(Eastward), a world that moves on its own (Stardew Valley), and a museum that
guides you with light and goes quiet when you look closely (Animal Crossing).

- **Light.** The galleries are dark with a pool of light on every case, dust
  drifting in the light, a glint sliding across the glass now and then, and
  track lights on the walls. When the docent presents a piece the room dims
  around it like a spotlight. The lobbies get sun shafts and a soft vignette.
- **Movement.** A one-pixel bounce on each footfall, dust when you run, a
  camera that leans the way you walk, a circular wipe between rooms, and the
  area's name sliding in when you arrive. People blink; visitors wander and
  stop to look at cases; the docent hums when you stand still.
- **Text and menus.** Pixel-notched frames on rice paper; the docent's
  portrait talks and blinks; text pauses at commas and full stops; a bobbing
  pointer on choices; the menu is a grid of icon tiles.
- **Sound.** One theme played on a different instrument in each place:
  zither in the lobbies, bells among the bronzes, flute with the jades, pipa
  for the ceramics, music box for A Garland of Treasures. Room tone and
  distant footsteps underneath; your own steps click on marble, thud on wood
  and hush on carpet; each speaker has their own voice blip.
- **Look closer.** The photo opens at once, then the sharp 2000px version
  streams in. Pinch, scroll or double-tap to zoom (eased), drag with
  momentum, a mini-map shows where you are, and a side panel says what to
  look for and credits the photo the museum's way.

## As an app

- **Installable.** It has a web app manifest and icons (`manifest.webmanifest`,
  `icons/`). On Android or desktop Chrome, use Menu → Install as an app. On
  iPhone or iPad, use Safari's Share → Add to Home Screen. It opens full screen
  with its own icon.
- **Works offline.** A service worker (`sw.js`) caches every file on the first
  visit, including all 62 photos, so it keeps working inside the museum without
  Wi-Fi. That first visit is about 7 MB: the cut-outs ship as WebP
  (`node tools/to-webp.js` after changing a cut-out PNG), and the big zoom
  photos are only saved once you look at them. `sw.js` is generated: run
  `node tools/build-sw.js` after changing any file so devices pick up the new
  version. `node tests/run.js` does this automatically.
- **No third-party requests.** It uses no web fonts, trackers or CDNs.

## Playing

No build step and no dependencies. Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. To play on a phone on the same Wi‑Fi, open
`http://<this Mac's IP>:8000` (find the IP with `ipconfig getifaddr en0`).

| | Keyboard | Touch |
|---|---|---|
| Walk | Arrow keys or WASD | The pad, or tap where you want to go |
| Run | Hold Shift (or X) | Hold B |
| Talk / choose | Z, Enter or Space | A, or tap the text box |
| Back | X or Esc | B |
| Ask the docent | Q | Ask |
| Notebook | N | Notebook |
| Menu | M | Menu |
| Auto-walk while being led | G | Auto-walk ▸ |
| Look up a room | R | Menu → Look up a room |

## What's in it

- **Three lobby floors** with the grand staircase in the middle. Up flights
  are entered from the south, down flights from the north, and you keep your
  lane between floors. An elevator behind the staircase gives a step-free route.
  Only the four permanent exhibitions are open.
- **The four permanent exhibitions**, each with its doorway on its real side
  of the grand staircase (jades west and bronzes east on 3F, ceramics east on
  2F, Room 106 west on 1F), with the museum's own titles and rooms:

  | Floor | Exhibition | Rooms | Pieces in the game |
  |---|---|---|---|
  | 3F | Rituals Cast in Brilliance (吉金耀采), bronzes | 305, 307 | 26 |
  | 3F | Art in Quest of Heaven and Truth (敬天格物), jades | 306, 308 | 9 |
  | 2F | The Magic of Kneaded Clay (摶泥幻化), ceramics | 201, 205, 207 | 23 |
  | 1F | A Garland of Treasures (集瓊藻), precious crafts | 106 | 10 |

  The pieces per room follow the museum's own "Selections by Gallery" lists:
  305 (22), 307 (4), 306 (9), 201 (7), 205 (16) and 106 (10). Rooms 207 and 308
  have no listed selections, and the game says so. Every piece stands in a lit
  case, drawn as a pixel sprite made from its real photo, oldest first, with a
  floor sign wherever a new period begins. In the bronze and ceramics galleries
  a partition separates the rooms, so each case stands in its listed room.
- **The docent** follows one step behind you. Ask them for:
  - the highlights tour: 22 of the best-known pieces, top floor down
  - every piece in the gallery you're in, in walking order
  - any gallery or piece, which they lead you to along a glowing trail
  - the way out
  - "Where's the Jadeite Cabbage?" (Room 302, which rotates with the Southern Branch)
- **Walk up to a case** and the docent introduces the piece. A card shows the
  real photograph, the museum's English and Chinese titles, its date and its
  room. Then you choose: "Tell me more", "What should I look for?" or "Next stop".
- **Look closer** opens the museum's full photograph of a piece, full screen.
  Pinch, scroll or double-tap to zoom, and drag to look around. Open it from the
  docent's choices, by tapping the photo on the card, from the notebook, or with
  L on a keyboard.
- **My visit plan.** Tap ☆ Save to my visit on any piece's card or notebook
  entry, or press P. The plan lists your pieces in walking order: top floor
  down, with floors, rooms and a rough time (3–6 minutes per piece, plus
  walking). The docent can walk you through just those pieces, and "Save as an
  image" puts the plan on your phone for the real visit.
- **Look up a room**, for use inside the real museum (title screen, menu, Ask,
  or R). Pick the room number on the wall and see every piece in it, with its
  photo, what to look for, and a "found it" box. No walking needed. It also
  opens on the room you're in when you're in a gallery.
- **Found in person.** Tick off pieces as you find them in the real museum.
  Find three in a gallery and a round jade seal goes into your stamp book.
- **The junior docent challenge.** See a gallery's highlights and the docent
  offers three questions about them. Get two right to earn that gallery's red
  seal stamp in your notebook's stamp book. There are four stamps to collect.
  Every answer is something the docent told you.
- **English or 中文.** Switch on the title screen, in the menu or in Options.
  Every line the docent says, every label, the floor signs and the saved plan
  image come in both. A browser set to Chinese starts in Chinese.
- **The notebook** fills in as you see pieces. It doubles as a checklist for
  a real visit, and any entry can lead you to its case.
- **Options:** sound, music, the docent's auto-talk, step-free routing, text speed.
- Progress saves in this browser only (`localStorage`). There's no account, and nothing leaves the device.

## Accuracy

Everything was checked against the museum's own pages in **October 2026**:

- **Floors, rooms and exhibition titles** come from the npm.gov.tw Exhibition
  Floor Plan, and so does the side of the grand staircase each exhibition
  opens from. `tests/unit.js` checks those against the plan.
- **Which pieces are in which room** comes from the museum's "Selections by
  Gallery" pages (theme.npm.edu.tw/selection) and its Classic Tour II route. Only
  pieces the museum itself places in these galleries are in the game.
- **What the docent says** about each piece is drawn from that piece's own museum
  page. The link is in `js/tour-data.js` (`source`) and in the notebook.
- **Chinese text** is written from the museum's own Chinese pages for each
  piece (the `lang=1` version of the same Selections page).
- **Photos and their licence.** The museum's open-data site
  (digitalarchive.npm.gov.tw/opendata) releases its low-resolution images
  under CC0 and its 6-megapixel images and site text under CC BY 4.0. The 41
  photos added in October 2026 are the small (400px) images from the
  Selections pages, and each one was matched to the same photograph on the
  open-data site by an image fingerprint and checked by eye. Its open-data
  registration number is in `js/pieces/*.js` (`record`) and on its page in
  the game. Six pieces had no matching open-data photograph (a different shot
  of the object, or no record found), so they have no photo yet rather than
  an unlicensed one: the hui-snake ding, jade lotus-leaf washer, red-glaze zun,
  eight-trigram revolving vase, coral Kuixing planter and cloisonné lotus box.
- **Sharp photos for zooming.** For the 56 pieces with a matched open-data
  record, the full-size Selections photo (the same photograph, by file ID) was
  downloaded, shrunk to 2000px and 900px, and the originals deleted. The
  viewer credits each one in the museum's form: "<name> The National Palace
  Museum, Taipei, CC BY 4.0 @ www.npm.gov.tw". The jade cong, jade gui and
  jade duck keep their earlier photos, which had no confident match.
- **What changed from the first version:** twelve pieces were removed because the
  museum doesn't list them in these galleries. They are the olive-pit boat, boxwood
  arhat, ivory dragon boat, Ge ware vase, ruby-red ewer, Shang you, taotie zun,
  Boshan censer, TLV mirror, jade bi disc, yue axe, and the cicada and pigs. Five
  listed pieces were added in their place: the Hu of Song, the twin-dragon gui, the
  square gui with "Ya chou", the jade duck and the red lacquer curio cabinet. Facts
  that the museum doesn't support were corrected or dropped. For example, the
  museum holds *five* of the six known Ru narcissus basins, and the Zong Zhou
  bell's inscription has 111 characters.
- The halls are a simplified game map: only the four permanent exhibitions are
  open, distances are squeezed to fit a screen, and inside each exhibition the
  cases stand in a grid in walking order, not where the museum's own cases
  stand. Objects on display change too. About says all of this.

## Licence

The code and the game's own text are under the MIT licence (`LICENSE`). The
artifact photographs and the case sprites made from them are not: they stay
under the museum's open data terms, below.

## Credits

Artifact photographs: National Palace Museum, Taipei, Open Data
(<https://digitalarchive.npm.gov.tw/opendata>), released under CC0 (low
resolution) and CC BY 4.0. The cut-outs are made by `tools/cutout.js` and the
pixel sprites by `tools/pixelize.js`, both from those photos. The game avoids
looking official: it is an independent student project, as the museum's open
data terms ask.

## Layout

```
index.html            markup only
css/game.css          text box, choice box, card, touch pad, toast, title
css/viewer.css        the Look closer photo viewer
css/panels.css        menu, notebook and stamp book, visit plan, guide
css/rooms.css         room lookup, in-person seals, pieces without a photo
css/feel.css          pixel frames, the choice pointer, menu tiles, animations
js/lang.js            English / 中文: L(en, zh), the current language
js/pieces/*.js        each exhibition's pieces in walking order: titles, dates, rooms, docent text in both languages, sources
js/tour-data.js       the 4 exhibitions, highlights, challenge questions, rooms, the visit-plan arithmetic
js/maps.js            the lobbies as text; the galleries laid out from their piece lists
js/world.js           parsing, collision, warps, pathfinding (no DOM)
js/save.js            the save file: what's kept between visits, and reading it back safely (no DOM)
js/text.js            dialogue paging and directions, in both languages (no DOM)
js/art.js             hand-drawn people and decor as text pixel art
js/artifact-sprites.js  generated, see tools/pixelize.js
js/tiles.js           floors, walls, stairs, doors, cases, pillars
js/render.js          camera, depth sorting, upscaling, sign text
js/actors.js          grid movement
js/input.js           keyboard, touch pad, taps
js/audio.js           Web Audio sound effects and music
js/ui.js              text box, choices, card, panels, title screen, area titles
js/viewer.js          the Look closer photo viewer
js/docent.js          everything the docent says: tours, directions, the challenge
js/panels.js          menu, notebook and stamp book, room lookup, a piece's page, plan, options, about
js/game.js            state, frame loop, walking, warps, following and leading, saving
images/objects/       cut-out photos: .webp for the card, .png as the source of the case sprites
images/photos/        the museum's photographs at 900px, cached for offline use
images/zoom/          the same at 2000px for zooming in, cached when first viewed
sw.js                 offline cache (generated by tools/build-sw.js)
manifest.webmanifest  app name, colours and icons for installing
icons/                app icons (generated by tools/make-icons.js)
tools/                cut-out, WebP, sprite, icon and service-worker generators; screenshot and preview pages
tests/                unit tests and a headless-Chrome playthrough
```

## Checks

```bash
node tests/run.js
```

Runs the unit tests in plain Node: maps, which side each exhibition opens
from, warps, pathfinding across floors, every
piece's data and source in both languages, the pieces per room against the
museum's lists, photo files only for licensed photos, each case standing in its
listed room, dialogue paging in English and Chinese, and save files that are
damaged or hand-edited. Then it plays the game
in headless Chrome with real key presses:

- intro, then the highlights tour with auto-walk up two flights into the bronze gallery
- the first piece's card, then pausing the tour and walking by hand
- a piece without a photo, which says so and offers no "Look closer"
- the notebook, and a phone-sized screen
- switching to Chinese on the title, the docent in Chinese, switching back in the menu
- a visitor in the real museum: the room lookup from the title on a phone,
  ticking off three pieces in Room 306 and earning the in-person seal
- the every-piece tour of the jade gallery, and R opening the room you're in
- a returning visit that takes the elevator, walks into Room 106, taps a case
  to walk to it, and asks about the Jadeite Cabbage
- earning a stamp in the challenge, then saving a piece to the visit plan from
  the notebook
- corrupt or odd saves, which must never stop the game from starting
- going offline after the first visit, when the title, every photo and a new
  visit must still work

Needs Node 22+ and Google Chrome. Set `SHOTS=/some/folder` to keep screenshots.
