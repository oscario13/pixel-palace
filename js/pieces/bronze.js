/*
  Rituals Cast in Brilliance (吉金耀采), Rooms 305 and 307: every piece the
  museum lists for these rooms, in walking order (oldest first, room by room).

  Each piece:
    sno            the museum's Selections page (theme.npm.edu.tw/selection)
    record         the open-data record the photo comes from (its registration
                   number at digitalarchive.npm.gov.tw/opendata), for photos
                   added in October 2026
    source         a different museum page, when the facts come from elsewhere
    room, period   where it stands, and the floor sign it stands under
    highlight      on the docent's highlights tour
    photo: false   no openly licensed photo yet
    name, nameZh, date, dateZh   the museum's own titles and dating
    intro, more, look            what the docent says; zh: the same in Chinese
*/
(function (root) {
  const PERIODS = {
    shang: { en: "Shang dynasty", zh: "商代" },
    earlyWZ: { en: "Early Western Zhou", zh: "西周早期" },
    midWZ: { en: "Mid Western Zhou", zh: "西周中期" },
    lateWZ: { en: "Late Western Zhou", zh: "西周晚期" },
    springAutumn: { en: "Spring and Autumn", zh: "春秋" },
    warringStates: { en: "Warring States", zh: "戰國" },
    qin: { en: "Qin dynasty", zh: "秦代" },
    han: { en: "Han and Xin", zh: "漢與新莽" }
  };

  const PIECES = {
    // ---- Room 305 ----
    "coiled-dragon-pan": {
      sno: "04001039", record: "中銅001513N000000000", room: "305", period: "shang", highlight: true,
      name: "Pan water vessel with coiling dragon pattern", nameZh: "蟠龍紋盤",
      date: "Late Shang dynasty", dateZh: "商晚期",
      intro: "This is a pan, a basin for water. Look into the middle: a coiled dragon lifts its head right at the center, as if rising out of the water it once held.",
      more: "Pan basins were important water vessels in the Bronze Age. Around the edge swim smaller kui dragons, birds and fish. Decoration this rich suggests it was a ceremonial vessel that belonged to a high-ranking noble. Its solemn, elegant style is typical of the late Shang.",
      look: "Find the dragon's raised head at the exact center of the basin, then follow the ring of dragons, birds and fish around the rim.",
      zh: {
        intro: "這是一件盛水的盤。看看盤心：一條蜷伏的龍正抬起頭，好像要從曾經盛過的水裡浮出來。",
        more: "盤是青銅時代重要的水器。盤面邊緣環繞著夔紋、鳥紋和魚紋。裝飾這麼華麗，應該是等級較高的貴族使用的禮器。莊重古凝的作風，正是商代晚期的典型。",
        look: "找到盤心正中央微微浮起的龍首，再沿著盤緣看一圈夔龍、鳥和魚。"
      }
    },
    "ya-chou-fang-zun": {
      sno: "04001148", record: "中銅001870N000000000", room: "305", period: "shang",
      name: "Square zun wine vessel with inscription \"Ya chou\"", nameZh: "亞醜方尊",
      date: "Late Shang dynasty, 13th–12th century BCE", dateZh: "商後期，西元前13–12世紀",
      intro: "A square wine vessel, 39 centimeters tall, made for the powerful Ya Chou clan. From mouth to foot its outline turns four times, all sharp angles and flanges.",
      more: "Bronzes cast with the Ya Chou mark have been dug up again and again at Sufutun in Shandong, and some scholars link the clan to the Bogu people named in the ancient Zuozhuan. It flourished in the late Shang and was wiped out by King Cheng in the early Western Zhou. About four in ten surviving Ya Chou bronzes are square, like the famous square vessels from the tomb of Fu Hao.",
      look: "Follow the outline down from the flaring mouth: neck, shoulder, body, foot. Then find the square gui in this room that carries the same Ya Chou clan mark.",
      zh: {
        intro: "亞醜家族的方形酒器，高39公分。從口到足，器身轉折四次，稜角畢露。",
        more: "鑄有「亞醜」的銅器多次在山東益都蘇埠屯出土，有學者認為就是《左傳》裡的薄姑氏。這個家族在商晚期極盛，到西周早期被成王所滅。現存有銘文的亞醜銅器約四成是方形器，和婦好墓出土的方尊、方彝等方形器，一起展現商晚期銅器造型的絢爛。",
        look: "從外張的口緣往下看：頸、肩、腹、足，一共四次轉折。再找找同一展間的亞醜方簋，上面有同樣的族徽。"
      }
    },
    "turquoise-yue": {
      sno: "04001133", record: "購銅000107N000000000", room: "305", period: "shang",
      name: "Bronze axe (yue) head with turquoise-inlaid animal mask design", nameZh: "鑲嵌綠松石獸面紋銅鉞",
      date: "Late Shang dynasty, 13th–12th century BCE", dateZh: "商後期，西元前13–12世紀",
      intro: "A bronze axe head inlaid with turquoise. It was never meant for battle. It showed that its owner was a commander with royal authority.",
      more: "A yue has a curved blade at one end and fastens to a long handle at the other. Axes like this were made mainly from the late Shang to the early Zhou, and only very high-ranking commanders carried one. All that turquoise makes it too precious for a battlefield, so it was probably used in ceremonies to show its owner's rank. The animal mask, the most common design on Shang and Zhou bronzes, may have linked people with gods and ancestors, or guarded the object against evil.",
      look: "Find the animal mask picked out in turquoise, then the curved cutting edge at the other end.",
      zh: {
        intro: "鑲嵌綠松石的青銅鉞。它不是真的要上戰場，而是代表持有者擁有極高的軍事統御權。",
        more: "鉞的一端是弧形刀刃，另一端可以裝上長柄，造型很像斧頭，主要流行於商代後期到西周早期。能持鉞的人通常地位極高。這件還鑲嵌了美麗的綠松石，可見是用在禮儀場合，用來顯示主人的尊貴身分。獸面紋是商周最常見的紋飾，可能是和鬼神、祖先溝通的媒介，也可能是守護禮器、避邪驅鬼的神獸。",
        look: "找找用綠松石鑲出的獸面，再看看另一端弧形的刀刃。"
      }
    },
    "ya-qin-zun": {
      sno: "04001134", record: "中銅000819N000000000", room: "305", period: "shang",
      name: "Zun wine vessel with inscription \"Ya qin\" dedicated to Fu Yi", nameZh: "亞禽父乙尊",
      date: "Shang dynasty", dateZh: "商",
      intro: "A wine vessel made to honor \"Father Yi\" in the family's ancestral temple. Its clan sign is the character qin written inside the shape ya.",
      more: "The same Ya Qin clan sign also appears on a bronze seal. On the front and back of the body are animal masks in relief, flanked by creatures with dragon heads and phoenix bodies, all on a background of cloud-and-thunder patterns between pairs of raised lines. Fine raised grid lines decorate the bottom of the belly.",
      look: "Find the animal mask on the belly, then the dragon-headed phoenixes on either side of it.",
      zh: {
        intro: "這件酒器是為了在宗廟祭祀「父乙」而鑄造的。它的族徽是在「亞」字形中寫一個「禽」字。",
        more: "「亞禽」這個複合族徽，在銅尊和銅璽上都看得到。腹部前後各有一個浮雕獸面紋，兩旁是龍首鳳身紋，底下襯著雲雷地紋，上下各以兩道弦紋相夾；腹底還有細細的陽線格紋。",
        look: "先找腹部的獸面，再看它兩旁龍頭鳳身的神獸。"
      }
    },
    "ya-chou-gui": {
      sno: "04001040", record: "故銅002379N000000000", room: "305", period: "shang", highlight: true,
      name: "Square gui food container with inscription \"Yachou\"", nameZh: "亞醜方簋",
      date: "Late Shang dynasty to early Western Zhou period", dateZh: "商晚期至西周早期",
      intro: "A gui was a food vessel for rituals, and this one is square. At the bottom, inside, is the clan mark \"Ya Chou.\"",
      more: "The earliest bronze inscriptions were short clan marks like this one, naming the family that commissioned a vessel. Several bronzes made for the Ya Chou clan survive. Flanges run all around the body. There's an animal mask on the belly, kui phoenixes on the neck and birds on the foot, all on a background of cloud-and-thunder patterns.",
      look: "Look for the ridged flanges on the corners and the animal mask staring out from the belly.",
      zh: {
        intro: "簋是祭祀時盛放食物的禮器，這件是方形的。器內底有「亞醜」兩字族氏銘文。",
        more: "最早的銅器銘文，常是像這樣簡短的族徽，標明鑄器的家族。為亞醜家族鑄造的銅器現在還有好幾件。器身周圍有扉棱，腹部是獸面紋，頸部是夔鳳紋，足部是鳥紋，底下都襯著雲雷紋。",
        look: "看看四角凸起的扉棱，還有從腹部瞪著你的獸面。"
      }
    },
    "double-dragon-gui": {
      source: "https://theme.npm.edu.tw/3d/Content.aspx?sno=04009213&l=2", room: "305", period: "earlyWZ", highlight: true,
      name: "Gui food container with twin-dragon pattern", nameZh: "雙龍紋簋",
      date: "Early Western Zhou dynasty", dateZh: "西周早期",
      intro: "Two dragons wrap around this food vessel, and their horns stick up from the lid. Only when the lid is on do the heads and bodies line up into complete dragons.",
      more: "One dragon has columnar horns and the other has spiral horns, while their bodies coil around the belly. The handles are half-rings shaped like animals. A ewer in the Freer Gallery of Art in the United States has a similar design. Three characters inside, \"Zuo Bao Yi,\" meaning a treasured ritual vessel, were added at a later date.",
      look: "Compare the two kinds of horns on the lid, then trace each one down to its dragon's body on the belly.",
      zh: {
        intro: "兩條龍盤繞在這件盛食器上，龍角從蓋上伸出。只有蓋子蓋上時，龍首和龍身才會組成完整的龍。",
        more: "蓋上一對是柱狀角、一對是螺狀角，龍身則盤繞在器腹。器耳是獸首形的半環耳。美國弗利爾美術館收藏的人面盉，也有相近的圖飾。內底「作寶彝」三字是後來才加上的。",
        look: "比較蓋上兩種不同的龍角，再順著找到各自在器腹上的龍身。"
      }
    },
    "kang-hou-ding": {
      sno: "04001140", record: "中銅000123N000000000", room: "305", period: "earlyWZ",
      name: "Square Ding cauldron of Marquis of Kang", nameZh: "康侯丰方鼎",
      date: "Early Western Zhou dynasty", dateZh: "西周早期",
      intro: "A square ding made for the Marquis of Kang, the youngest brother of King Wu, who founded the Zhou dynasty. Six characters inside name him.",
      more: "The inscription reads \"Kang Hou Feng zuo bao zun\": the Marquis of Kang, Feng, made this treasured vessel. Feng was the ninth son of King Wen. After King Wu conquered the Shang, he made Feng the marquis of Kang. Under the next king, King Cheng, Feng was moved to the state of Wey, so history books also call him Kangshu of Wey. Made at the start of King Cheng's reign for the ancestral temple, it lets a three-thousand-year-old record and a real object back each other up.",
      look: "Look at the four column legs decorated with cicadas, and the ridges down the middle and corners of each side.",
      zh: {
        intro: "這件方鼎屬於康侯封，他是建立周朝的武王最小的弟弟。鼎內六個字記下了他的名字。",
        more: "腹內兩行六字銘文：「康侯丰（封）作寶尊」。封是周文王第九子、武王的最小弟。武王滅商後，把他封在「康」地為侯，所以稱「康侯」。成王即位後，又改封叔父康侯到「衛」，所以史書也稱他「衛康叔」。這件禮器是成王即位之初鑄造、陳設在宗廟裡的，能和史書互相印證三千年前的史實。",
        look: "看看四根圓柱形的足，上面有蟬紋；每一面的中央和四個角，還有凸起的棱脊。"
      }
    },
    "phoenix-gui": {
      sno: "04001138", record: "中銅000464N000000000", room: "305", period: "earlyWZ",
      name: "Gui food container on a square base with phoenix pattern", nameZh: "鳳紋方座簋",
      date: "Early Western Zhou dynasty", dateZh: "西周早期",
      intro: "A grain vessel raised on its own square base, with 18 water-buffalo heads in relief.",
      more: "Ding cauldrons held meat and gui held grain, and the two were used together. Square-base gui were most popular in the early Western Zhou. A little over 100 survive, mostly from large tombs in the west of the Wei River valley, so they ranked high among ritual vessels. The extra base made Zhou gui taller and grander than Shang ones, a sign that the Zhou put more weight on food offerings, where the Shang had favored wine. Buffalo heads on handles and base corners were a fashion around the Zhou royal capital, near today's Baoji, under King Wu and King Cheng.",
      look: "Count the buffalo heads on the handles and the corners of the base. There are 18 in all.",
      zh: {
        intro: "盛放穀物的簋，下面多加了一個方座，全器共有十八個浮雕牛首。",
        more: "鼎盛肉、簋盛黍稷稻粱，兩者是重要的盛食器組合。方座簋盛行於西周初期，現存一百多件，主要出土在關中以西規模較大的墓葬，在禮器中地位很高。圈足下再加方座，讓西周早期的簋比商晚期更高大雄偉，也反映周人改變商人重酒的祭祀組合，轉而重食。用大量牛頭裝飾器耳和方座四角，是武王、成王時周王畿附近（今寶雞一帶）流行的風格。",
        look: "數數看器耳和方座四角上的牛頭，一共十八個。"
      }
    },
    "zu-yi-zun": {
      sno: "04001125", record: "故銅002390N000000000", room: "305", period: "earlyWZ",
      name: "Zun wine vessel of Zu Yi", nameZh: "祖乙尊",
      date: "Early Western Zhou dynasty", dateZh: "西周早期",
      intro: "A wide-mouthed wine vessel whose huge animal masks seem to burst out of the bronze: eyes, horns, ears and fangs all stand out from the surface.",
      more: "Tall, three-part zun like this were popular in the early Western Zhou. Four openwork flanges run down its sides, and on the belly the masks' raised noses take the place of flanges, which makes them even more three-dimensional. The six-character inscription reads \"made this treasured ritual zun for Grandfather Yi\". Whoever made it didn't cast their own name.",
      look: "Look at the belly from the side to see how far the horns and fangs stand out.",
      zh: {
        intro: "大口筒形的酒尊，腹部巨大的獸面雙目、雙角、雙耳和獠牙都聳出器表，非常有氣勢。",
        more: "這種三段式的大口筒狀尊，流行於西周早期。全器四方有四道透雕扉棱，腹部挺立的鼻樑取代了扉棱，讓獸面更加立體。銘文兩行六字：「作祖乙寶尊彝」，記錄某人為祖父乙鑄作這件祭器，但作器者沒有留下名字。",
        look: "從側面看腹部，看看獸角和獠牙凸出器表有多高。"
      }
    },
    "bo-ding-he": {
      sno: "04001139", record: "故銅002389N000000000", room: "305", period: "midWZ",
      name: "He spouted ewer of Bo Ding", nameZh: "伯定盉",
      date: "Mid Western Zhou dynasty", dateZh: "西周中期",
      intro: "A spouted ewer whose lid and body carry the same five characters, \"Bo Ding made this treasured vessel\", written in two different styles.",
      more: "One inscription keeps the square, forceful style of the early Western Zhou. The other has the rounder, more graceful style of the middle period. Finding both on one vessel suggests that two different people wrote the models, at the very moment when the new style was taking over from the old.",
      look: "Find both inscriptions, on the lid and on the vessel: the same words, in two hands.",
      zh: {
        intro: "這件盉的蓋和器身都有同樣五個字：「伯定作寶彝」，字體風格卻完全不同。",
        more: "一個承襲西周早期方正剛勁的書風，另一個開啟中期圓轉婉約的新風格。新舊兩種書風剛好出現在同一件器物上，證明寫範的人有兩位，也代表了書風交替的那一刻。",
        look: "找找蓋上和器身上的兩處銘文：同樣五個字，出自兩個人的手。"
      }
    },
    "xuan-ji-gui": {
      sno: "04001135", record: "中銅000097N000000000", room: "305", period: "midWZ",
      name: "Gui food container of Xuan Ji", nameZh: "縣妀簋",
      date: "Mid Western Zhou dynasty", dateZh: "西周中期",
      intro: "A father's wedding gift, recorded in bronze. The 88-character inscription inside tells how Bo Xifu married his daughter to the lord of Xuan.",
      more: "On the sixteenth day of the twelfth month, in a year of King Mu's reign, Bo Xifu told his daughter she would marry the lord of Xuan, and listed her dowry: a bronze jue for future sacrifices and jades including a huang pendant. Grateful, Xuan Ji had this vessel cast and the gift recorded so that her descendants would never forget her father's kindness. The jades it mentions reflect an old rule that ceremonies were defined by jade and silk.",
      look: "Look around the neck for the animal heads in relief and the long-tailed birds, a style typical of King Mu's time.",
      zh: {
        intro: "這是一份刻在青銅上的嫁妝紀錄：器內底的88字銘文，記下伯屖父把女兒嫁給縣伯。",
        more: "穆王時某年十二月既望（十六日），伯屖父對女兒縣妀說：把妳許配給縣伯為妻，陪嫁的禮物有將來祭祀用的銅爵，以及玉戈（圭）、琱、璜等玉器。縣妀感念父親的恩澤，特別鑄造此器並詳記其事，希望子子孫孫永遠不忘父親的美德。",
        look: "看看頸部：浮雕的犧首，加上雲雷紋襯底的分尾長鳥紋，是穆王時期常見的樣式。"
      }
    },
    "mao-gong-ding": {
      sno: "04001041", record: "中銅000651N000000000", room: "305", period: "lateWZ", highlight: true,
      name: "Ding cauldron of Duke Mao", nameZh: "毛公鼎",
      date: "Late Western Zhou dynasty, 827–782 BCE", dateZh: "西周晚期，西元前827–782年",
      intro: "The Mao Gong Ding, one of the museum's most famous treasures. Cast inside is an inscription of about 500 characters, the longest bronze inscription known.",
      more: "When King Xuan of Zhou came to the throne, he wanted his country to thrive. So he put his uncle, the Duke of Mao, in charge of every affair of state, at home and abroad, and told him to work carefully and selflessly. The inscription records this in seven sections. The king then gave the Duke official robes and gifts, and the Duke had this cauldron cast so his descendants would remember the honor. It has a wide, flared mouth, upright handles, a band of linked rings at the rim and three hoofed feet. It weighs 34.7 kilograms.",
      look: "The writing is cast inside the bowl, so step close and look down over the rim.",
      zh: {
        intro: "毛公鼎，故宮最著名的國寶之一。鼎腹內壁鑄有長達五百字的銘文，是目前所知最長的青銅器銘文。",
        more: "銘文見證了西周「宣王中興」的歷史。前段是周宣王對毛公的訓誥：宣王即位之初，緬懷文王、武王開創國家，對繼承的天命戒慎恐懼，於是把國家大事託付給毛公，殷切告誡。後段詳列宣王給毛公的豐厚賞賜，毛公在文末表達感謝，並願把此鼎傳給後世。鼎的器形極簡樸：半球形器身立在三個獸蹄足上，口沿有兩個立耳，只在口沿下飾一圈重環紋。重34.7公斤。",
        look: "銘文鑄在鼎腹內壁，靠近一點，從口沿往下看。"
      }
    },
    "sanshi-pan": {
      source: "https://theme.npm.edu.tw/3d/Content.aspx?sno=04001043&l=2", room: "305", period: "lateWZ", highlight: true,
      name: "Pan water vessel of San", nameZh: "散氏盤",
      date: "Late Western Zhou dynasty", dateZh: "西周晚期",
      intro: "Inside this water basin are 350 characters recording a land settlement between two states, San and Zhe.",
      more: "The state of Zhe tried to invade its neighbor San and failed, and San then took over part of Zhe's land. The inscription spells out exactly which land was handed over and names the officials who enforced the agreement. San and Zhe were closely linked, even marrying into each other's families in times of peace. The basin was made so that San's successful defense would be remembered.",
      look: "It's a wide, shallow basin on a tall foot, with two loop handles. The writing fills the inside.",
      zh: {
        intro: "這件水盤內有350字銘文，記錄散國和夨國之間的土地交割。",
        more: "夨國侵犯散國沒有成功，只好割地抵過。銘文詳細記下轉讓土地的範圍，以及參與履勘的官員職名。西周時散國和夨國關係密切，友好時甚至互相通婚。散國擋下侵犯並獲得賠償，於是鑄器詳載，傳給子孫。",
        look: "寬闊的淺盤配上高圈足和一對附耳，盤腹外壁繞著長尾夔龍紋，銘文就鑄在盤內。"
      }
    },
    "zhou-bell": {
      sno: "04001042", record: "故銅002377N000000000", room: "305", period: "lateWZ", highlight: true,
      name: "Zhong chime bell of Zong Zhou (bell of Hu)", nameZh: "宗周鐘（㝬鐘）",
      date: "Late Western Zhou dynasty, 827–782 BCE", dateZh: "西周晚期，西元前827–782年",
      intro: "A royal bell from the late Western Zhou, with an inscription of 111 characters cast during hard times for the dynasty.",
      more: "In the late Western Zhou, the Xianyun peoples threatened the northwest and the southern states were in revolt. The bell and its inscription show the Zhou king's brave effort to turn the tide, praying for lasting peace and prosperity for his realm. It's a flat, oval yong bell with 18 bosses on each side, cloud patterns on top, and pairs of S-shaped dragons on the body.",
      look: "Count the round bosses on one face (there are 18), then find the inscription on the central strip and the lower rim.",
      zh: {
        intro: "西周晚期的王室甬鐘，鉦間和鼓部鑄有111字銘文，寫於周朝內憂外患的時候。",
        more: "西周晚期，西北有玁狁威脅，南方諸國也伺機而動。這件鐘的製作和銘文，展現周王力挽狂瀾、祈求國家長治久安的雄心。它是合瓦形的扁圓甬鐘，兩面各有18個枚，舞部飾雲紋，篆部飾S形雙夔龍紋。",
        look: "數數一面的鐘枚（共18個），再找找鉦間和鼓部的銘文。"
      }
    },
    "song-hu": {
      sno: "04009156", record: "中銅001888N000000000", room: "305", period: "lateWZ", highlight: true,
      name: "Hu wine vessel of Song", nameZh: "頌壺",
      date: "Late Western Zhou dynasty, 827–782 BCE", dateZh: "西周晚期，西元前827–782年",
      intro: "This huge wine vessel, 63 centimeters tall, was kept for important occasions. Its inscription records the day a Zhou king gave its owner, Song, a noble title.",
      more: "The same 152 characters appear twice, on the lid and inside the body. They record the time and place of the ceremony, each step carried out by the ministers, the duties the king gave Song, and his gifts of chariots and robes. Such a detailed picture of court life makes it very valuable to historians.",
      look: "Look at the bands of decoration stacked from foot to lid. Together they give the vessel a sense of movement.",
      zh: {
        intro: "這件巨大的酒壺高63公分，是重要場合使用的酒器。銘文記錄周王冊封「頌」的那一天。",
        more: "壺蓋和器身內有相同的152字銘文，完整記錄冊命儀式的細節：先寫時間、地點和官員引導的步驟，再記周王對頌的任命，以及車馬、服飾的賞賜。這些內容可以印證並補充西周晚期的史實。",
        look: "看看從足到蓋層層分布的紋飾，華麗又充滿動感。"
      }
    },
    "le-ji-xian-xu": {
      sno: "04001136", record: "故銅001941N000000000", room: "305", period: "lateWZ",
      name: "Xu food container of Le Ji Xian", nameZh: "𧭥季獻盨",
      date: "Late Western Zhou dynasty, 827–782 BCE", dateZh: "西周晚期，西元前827–782年",
      intro: "A xu, a newer kind of grain vessel that grew out of the gui. Ribbed \"tile\" bands run around its body and lid.",
      more: "The xu and its plain, ribbed tile pattern were part of a \"reform\" of bronze style in the middle and late Western Zhou. Le Ji Xian, who commissioned it, wanted it treasured by his descendants forever. Its two handles are shaped like animal heads.",
      look: "Look at the parallel ridges of the tile pattern, then compare this oval xu with the round gui vessels in the room.",
      zh: {
        intro: "盨是由簋演變而來的新器類，器身和蓋上都有一道道瓦紋。",
        more: "「盨」這種新器類，加上瓦紋器身，是西周中晚期銅器的「維新」。作器者𧭥季獻希望子孫永遠珍藏它。兩耳做成獸首的形狀。",
        look: "看看一道道平行的瓦紋，再和展間裡圓形的簋比一比：這件盨是橢圓形的。"
      }
    },
    "zifan-bells": {
      sno: "04001142", record: "購銅000090N000000000", room: "305", period: "springAutumn",
      name: "Zhong chime bell of Zifan", nameZh: "子犯龢鐘",
      date: "Spring and Autumn period, 770–476 BCE", dateZh: "春秋，西元前770–476年",
      intro: "Chime bells made for Hu Yan, also called Zifan, the uncle who helped Prince Chong'er of Jin become the most powerful ruler of his age.",
      more: "The museum bought twelve of these bells in 1994. By joining their inscriptions, scholars found that eight form one complete set, with a 132-character text, and the other four are the second half of another set. The text tells how Zifan helped Chong'er return to Jin after 19 years in exile and become Duke Wen, defeat the state of Chu at the Battle of Chengpu, and lead the other lords. The tallest bell is 71 centimeters high and weighs 44.5 kilograms.",
      look: "The inscription runs on from one bell to the next, so it takes the whole set to read it. Follow the bells from biggest to smallest.",
      zh: {
        intro: "這組編鐘的主人是狐偃，也就是「子犯」。他是晉國公子重耳的舅舅，幫助重耳成為春秋霸主。",
        more: "故宮在1994年購入十二件子犯龢鐘。把各鐘的銘文接起來，發現其中八件是一整套，連讀共132字（含重文2字），另外四件是另一套的後半。銘文記載子犯幫助流亡十九年的重耳回國即位，成為晉文公；又在城濮之戰大敗楚國，助晉文公號令諸侯。最大的一件高71.2公分、重44.5公斤。",
        look: "銘文是一口鐘接著一口鐘寫下去的，要整套排在一起才讀得完。從大到小看看這組鐘吧！"
      }
    },
    "kui-dragon-pan": {
      sno: "04001141", record: "中銅001298N000000000", room: "305", period: "springAutumn",
      name: "Pan water vessel with coiling kui-dragon pattern", nameZh: "蟠夔紋盤",
      date: "Spring and Autumn period, 770–476 BCE", dateZh: "春秋，西元前770–476年",
      intro: "A basin for ceremonial hand-washing, covered all over with coiling kui dragons.",
      more: "Ritual washing became popular in the middle and late Western Zhou and reached its peak in the Spring and Autumn period. Inscriptions on some of these water vessels show that many were made for a bride's dowry, so they tell us how important both ritual washing and marriage were at the time. Coiling kui-dragon patterns like these were in fashion in the middle and late Spring and Autumn period.",
      look: "Compare it with the Shang coiled-dragon basin in this room: one big dragon there, a crowd of small ones here.",
      zh: {
        intro: "這是盥洗禮用的水盤，全身布滿蟠曲的夔龍紋。",
        more: "用水器行盥洗之禮，從西周中晚期開始流行，到春秋時期最盛。從部分帶銘文的器物可以知道，很多水器和女子出嫁的陪嫁有關，可見當時盥禮與婚嫁的重要。器身滿飾的蟠夔紋，是春秋中晚期流行的紋飾。",
        look: "和同一展間商代的蟠龍紋盤比一比：那邊是一條大龍盤在盤心，這邊是許多小龍彼此纏繞。"
      }
    },
    "hui-snake-ding": {
      sno: "04001145", room: "305", period: "springAutumn", photo: false,
      name: "Ding cauldron with coiled hui-snake pattern", nameZh: "蟠虺紋鼎",
      date: "Spring and Autumn period, 770–476 BCE", dateZh: "春秋，西元前770–476年",
      intro: "A small Qin-style ding, only 9 centimeters tall, decorated with coiling hui snakes.",
      more: "Bronzes in the state of Qin developed their own style from the middle of the Spring and Autumn period. Later, from the middle of the Warring States period, they were strongly influenced by bronzes from the state of Wei. Qin ding changed from shallow, lidless bowls with upright handles and thick legs into deep bowls with round lids. This one is a typical Qin ding from before that change.",
      look: "Check the signs of an early Qin ding: a shallow bowl, no lid, and handles standing straight up from the rim.",
      zh: {
        intro: "一件小小的秦式鼎，高只有9公分，飾有蟠曲的虺紋。",
        more: "秦國的銅禮器在春秋中期逐漸發展出自己的特色，但從戰國中期開始，大受三晉中魏國銅器的影響：鼎原本是淺腹、無蓋、立耳、肥足，後來變成深腹、半圓蓋、附耳。這件就是轉變之前的典型秦式鼎。",
        look: "找找早期秦鼎的特徵：淺腹、沒有蓋子，還有直立在口沿上的雙耳。"
      }
    },
    "hunting-hu": {
      sno: "04001124", record: "中銅001280N000000000", room: "305", period: "warringStates",
      name: "Hu wine vessel with hunting scene pattern", nameZh: "狩獵紋壺",
      date: "Warring States period, 475–221 BCE", dateZh: "戰國，西元前475–221年",
      intro: "Instead of animal masks, this wine jar is covered with scenes: birds holding snakes, winged spirits, and people fighting beasts.",
      more: "Shang and Zhou bronzes were mostly decorated with animal masks and birds. Around the early 5th century BCE, hunting scenes began to appear on bronzes in northern China, followed by feasts and battles. Because hunting scenes came first and were found in the north, scholars think the idea may have come from nomadic peoples, whose rock carvings look similar. Such scenes were popular in Henan, Shanxi, Hebei and Shaanxi, but rare in Chu to the south and in Qi and Lu to the east.",
      look: "Read it from top to bottom: birds with snakes on the neck, winged figures on the shoulder, people and animals fighting on the belly.",
      zh: {
        intro: "這件酒壺沒有獸面紋，取而代之的是一幕幕圖像：鳥銜蛇、帶翅膀的神人，還有人獸相搏。",
        more: "商周銅器大多以獸面、鳥紋為飾。到春秋晚期（西元前五世紀初），北方銅器先出現狩獵紋，接著中原也出現宴樂、戰爭等有情節的圖畫。由於狩獵紋最早出現，又出土於北方，學者推測這種圖畫式裝飾可能與遊牧民族有關，和岩畫風格也很相近。這類銅器在河南、山西、河北、陝西較流行，南方楚地和東方齊魯則相當少見。",
        look: "由上往下看：頸部是鳥銜蛇，肩部是帶翅膀的神人，腹部是人獸相搏。"
      }
    },
    "xi-zun": {
      sno: "04001143", record: "故銅002382N000000000", room: "305", period: "warringStates", highlight: true,
      name: "Zun wine vessel in animal shape decorated with metal wire and turquoise inlay", nameZh: "嵌綠松石金屬絲犧尊",
      date: "Mid Warring States period", dateZh: "戰國中期",
      intro: "A wine vessel shaped like a sturdy four-legged animal. Its mouth is the spout, and a lid on its back lifts off so it can be refilled.",
      more: "See how lifelike it is: raised ears, round eyes, hooves, a dangling tail, even its muscles. Silver threads form angular cloud patterns all over the body, with inlays of turquoise, gold and silver. Its eyes are round gold inlays, turquoise studs its nose, brows and forehead, and a band of gold around its neck forms a collar. The lid is decorated with dragons in gold and silver.",
      look: "Find the gold collar around its neck and the turquoise on its face.",
      zh: {
        intro: "一件四蹄動物造型的酒器。獸口就是流，背上有活頁式的蓋子，可以打開添酒。",
        more: "立耳、圓眼、四蹄、下垂的尾巴，連肌理都很寫實。全身以銀絲鑲嵌斜角雲紋，並有綠松石和金銀鑲嵌。眼珠是圓形的金片，鼻樑、眉和額頭點綴綠松石，頸部嵌金一圈當作項圈。背蓋上是金銀鑲嵌的蟠龍。",
        look: "找找脖子上的金項圈，還有臉上的綠松石。"
      }
    },
    "qin-measure": {
      sno: "04001146", record: "中銅000106N000000000", room: "305", period: "qin",
      name: "Oval Liang Measure by imperial decree of 26th year", nameZh: "廿六年詔橢量",
      date: "Qin dynasty, 221–207 BCE", dateZh: "秦，西元前221–207年",
      intro: "A small bronze scoop, 22 centimeters long, that carries the First Emperor's own decree: from now on, one set of measures for the whole empire.",
      more: "In 221 BCE, the 26th year of his reign, the King of Qin conquered the last of the other states and took a new title, Huangdi, \"emperor\". He replaced the old fiefdoms with commanderies and counties and made writing, weights and measures the same everywhere. His decree was cast onto large numbers of official measures like this one. It says he united the states, brought peace to the people, and ordered his chancellors Wei Zhuang and Wang Wan to make every unclear or differing measure the same.",
      look: "Look for the lines of the decree, in Qin script, the writing he made standard. Then compare it with the Jialiang measure in Room 307: two rulers, both making every measure the same.",
      zh: {
        intro: "長約22公分的小銅量，上面有秦始皇的詔書：從此天下只用一套度量衡。",
        more: "秦王政在位第二十六年（西元前221年）統一六國，自稱「始皇帝」。他廢封建、立郡縣，統一文字和度量衡，並把詔書鑄刻在大量製作的標準量器上。詔書大意是：統一了諸侯，百姓安寧，立號為皇帝，於是命丞相隗狀、王綰把不一致、有疑問的度量全部明確劃一。",
        look: "找找器上的詔書，用的是秦國文字，也就是始皇帝統一後的標準字體。再和307室的嘉量比一比：兩位統治者，都想讓天下的量器一樣。"
      }
    },

    // ---- Room 307 ----
    "ram-lei": {
      sno: "04001144", record: "故銅002383N000000000", room: "307", period: "shang",
      name: "Lei wine vessel decorated with ram-head high relief and knob decoration", nameZh: "鉤連乳丁紋羊首罍",
      date: "Late Shang dynasty", dateZh: "商晚期",
      intro: "A big wine jar with rams' heads sticking out around its shoulder, and a belly covered in rows of knobs.",
      more: "Around the shoulder are rams' heads in high relief, flat birds, and kui dragons with lowered heads. The belly is filled with knobs linked by hooks, round whorls and four-petaled flowers, and hook-shaped flanges run down its sides. The museum notes that this style shows influences from the south.",
      look: "Count the rams' heads around the shoulder, then look for the hooked flanges.",
      zh: {
        intro: "大型盛酒器，肩部一圈高浮雕羊首，腹部滿布乳丁。",
        more: "器肩環繞高浮雕羊首、扁平的鳥紋和俯首夔紋。器腹滿飾鉤連乳丁紋、圓渦紋和四瓣花紋，腹壁另有鉤狀棱脊。這種裝飾風格帶有南方的地域特色。",
        look: "繞著器肩數數看有幾個羊首，再找找鉤狀的棱脊。"
      }
    },
    "tlv-mirror": {
      sno: "04001126", record: "故銅000506N000000000", room: "307", period: "han",
      name: "Shangfang TLV bronze mirror", nameZh: "「尚方」博局紋鏡",
      date: "Han dynasty, 206 BCE–220 CE", dateZh: "漢，西元前206–西元220年",
      intro: "A Han bronze mirror. Its polished front showed your face. Its decorated back is covered with immortals, the Four Spirits and a poem about living forever.",
      more: "In the center is a round knob, surrounded by geometric patterns, bosses, the Four Spirits and immortals. A ring of text promises that the immortals on it never grow old: they drink from a jade spring, eat dates, and roam the heavens and the four seas. At the Qing court it was catalogued in the Continuation of Connoisseurship at Ningshou and kept in a fine case made for it. For Han people, a mirror meant good fortune as much as tidying up.",
      look: "Find the shapes like the letters T, L and V around the center. They're why it's called a TLV mirror.",
      zh: {
        intro: "漢代銅鏡。正面磨亮用來照人，背面布滿仙人、四靈和一圈祈求長壽的吉祥文。",
        more: "鏡背中央是圓紐，四周飾以規矩、乳釘、四靈、仙人等圖像。外圈的吉祥文寫著：「作佳竟（鏡）哉真大好，上有仙人不知老，渴飲玉泉饑食棗，浮游天下敖（遨）四海，壽如金石為國保兮。」這面鏡子在清宮時著錄於《寧壽續鑑》，收在特製的精巧鏡匣裡。漢代人用鏡，除了修整儀容，更重視它的吉祥意義。",
        look: "找找中央四周像英文字母T、L、V的規矩紋，西方因此稱它為「TLV鏡」。"
      }
    },
    "jia-liang": {
      sno: "04001129", record: "故銅002384N000000000", room: "307", period: "han", highlight: true,
      name: "Jialiang fine standard measure", nameZh: "嘉量",
      date: "Xin dynasty, 9 CE", dateZh: "新莽，西元9年",
      intro: "An official measuring tool: five measures for grain combined in one bronze piece, so that measurements would be the same everywhere.",
      more: "When Wang Mang took the throne from the Han and founded the Xin dynasty, he had standard measures recast following ancient models. The main cylinder is the hu, and below it is the dou. On the sides are the sheng, the he and the yue. Two yue make a he, ten he make a sheng, ten sheng make a dou, and ten dou make a hu. The inscriptions explain its origins and the size of each part.",
      look: "Spot all five measures: the big cylinder, the one beneath it, and the small cups on each side.",
      zh: {
        intro: "一件官方的標準量器：五種量穀物的容器合為一體，讓各地的度量都一樣。",
        more: "王莽建立新朝後，依照古制重鑄度量器，稱為「嘉量」。主體上方是「斛」，下方是「斗」，左邊是「升」，右邊是「合」，「合」的下面是「龠」。二龠為一合，十合為一升，十升為一斗，十斗為一斛。器外的銘文說明鑄造緣由和各量的大小。",
        look: "找出全部五個量：大圓筒、它下面的那一個，還有兩側的小杯。"
      }
    },
    "boshan-zun": {
      sno: "04001128", record: "故銅002044N000000000", room: "307", period: "han",
      name: "Amalgam-gilt zun wine vessel in boshan mountain shape", nameZh: "鎏金博山樽",
      date: "Eastern Han dynasty, 25–220 CE", dateZh: "東漢，西元25–220年",
      intro: "A gilded Han wine vessel. Around it, lucky beasts and winged immortals roam the sacred mountains of paradise.",
      more: "The zun was the main wine vessel of the Han dynasty, and many were made and decorated with great care. This one is covered in gold using mercury amalgam. Its pictures of sacred mountains, auspicious animals and feathered immortals show the paradise Han people hoped for.",
      look: "Look for the winged immortals among the mountains and animals.",
      zh: {
        intro: "漢代的鎏金酒樽，四周有神山、瑞獸和羽人，描繪漢代人嚮往的仙境。",
        more: "「樽」同「尊」，是漢代主要的盛酒器，製作、裝飾都很講究。這件器表鎏金，環繞著神山、瑞獸、羽人（仙人）等圖像，表現漢代人喜見的極樂世界。",
        look: "在山巒和動物之間，找找長著羽毛的仙人。"
      }
    }
  };

  const api = { PERIODS, PIECES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.PieceData = root.PieceData || {}).bronze = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
