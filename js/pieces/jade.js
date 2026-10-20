/*
  Art in Quest of Heaven and Truth (敬天格物), Room 306: every piece the museum
  lists for the room, in walking order (oldest first). Fields as in bronze.js.
*/
(function (root) {
  const PERIODS = {
    neolithic: { en: "Neolithic cultures", zh: "新石器時代" },
    shang: { en: "Shang dynasty", zh: "商代" },
    han: { en: "Han dynasty", zh: "漢代" },
    songYuan: { en: "Song to Yuan", zh: "宋至元" }
  };

  const PIECES = {
    "hooked-cloud-pei": {
      sno: "04009161", record: "購玉000271N000000000", room: "306", period: "neolithic",
      name: "Jade pei pendant in the shape of hooked cloud", nameZh: "玉勾雲形佩",
      date: "Late Hongshan culture, 3500–3000 BCE", dateZh: "紅山文化晚期，西元前3500–3000年",
      intro: "An abstract jade, 19 centimeters wide, that may show a sacred bird hidden in the clouds. A shaman wore it to speak with the heavens.",
      more: "Eagles soared over the steppes west of the Liao River and north of the Yan Mountains, so the Hongshan people saw these hook-beaked birds of prey as messengers of the gods. Early people noticed that jade glowed like spring sunlight and never decayed, and believed it held a special energy, so they offered jade and silk to their gods. They also believed an object's shape carried power, so they carved jades in the forms of the cosmos, their ancestors and sacred animals. This was the beginning of China's reverence for jade.",
      look: "Look for the hooks curling out from the center like wisps of cloud. At its thickest it's only half a centimeter.",
      zh: {
        intro: "寬19公分的抽象玉雕，似乎是藏在雲端裡的神鳥。巫師佩戴它來和天上的神靈溝通。",
        more: "遼河之西、燕山之北的草原上，常有成群的鷹鵰翱翔，所以紅山文化的居民把這種彎喙猛禽視為神的使者「玄鳥」。先民發現美玉散發春陽般的光澤，又堅韌不朽，相信它蘊含豐富的「精氣」，於是用玉帛祭祀神明。他們也相信物體的形狀能產生法力，就依照宇宙運行的模式，或祖先、神靈動物的樣子來雕琢玉器。「崇玉文化」也從這時萌芽。",
        look: "看看從中心向外勾捲、像雲一樣的弧鉤。它最厚的地方只有0.55公分。"
      }
    },
    "pig-dragon": {
      sno: "04009160", record: "購玉000316N000000000", room: "306", period: "neolithic",
      name: "Jade Pig-dragon", nameZh: "玉豬龍",
      date: "Late Hongshan culture, 3500–3000 BCE", dateZh: "紅山文化晚期，西元前3500–3000年",
      intro: "A plump, curled-up jade creature with big ears and a wrinkled snout, only 7.8 centimeters tall. It looks a lot like an animal embryo.",
      more: "Prehistoric people may have believed an embryo held the purest life force, and carved this shape to stand for new life. The Hongshan culture of northeastern China is famous for its fine jade animals. Scholars still debate what to call them: some say pig-dragons, others bear-dragons. Pigs were vital farm animals, while bears were worshipped in the northeast. Either way, the body always curves like the early pictograph for the character \"dragon\".",
      look: "Find the big ears, the wrinkled nose and the curled body that nearly closes into a ring.",
      zh: {
        intro: "圓圓胖胖、蜷成一圈的玉雕，有招風耳和皺起的鼻頭，高只有7.8公分，模樣很像動物的胚胎。",
        more: "史前先民或許相信胚胎最具有生命的元氣，就用這種造型來強調蛻變的生命力。紅山文化分布在中國東北，以動物主題的精巧玉雕最著名。學界對這類玉器的名稱有過爭論：有人稱「豬龍」，也有人稱「熊龍」。豬是農村重要的牲畜，熊則是東北居民崇拜的動物。不論是從豬或熊變成龍，身體都是彎彎的，很像原始文字中的「龍」字。",
        look: "找找招風耳、皺起的鼻頭，還有幾乎圍成一圈的彎曲身體。"
      }
    },
    "jade-cong": {
      sno: "04001079", room: "306", period: "neolithic", highlight: true,
      name: "Jade Cong Tube", nameZh: "玉琮",
      date: "Late Liangzhu culture, 2500–2000 BCE", dateZh: "良渚文化晚期，西元前2500–2000年",
      intro: "A tall square tube with a round hole through the middle, made by the Liangzhu culture more than four thousand years ago. It stands 47 centimeters high.",
      more: "It's carved from deep green nephrite with light and dark ochre spots. Seventeen tiers of small-eyed faces run down its four corners, 68 faces in all. It probably reached the Qing court only in the 19th century, so unlike many old jades it was never carved with the Qianlong Emperor's poems, and it still looks the way it was made. Near the top are faint lines of a mysterious engraved symbol, probably linked to beliefs about a spirit bird.",
      look: "Look down the corners for the stacked faces, each one a small pair of eyes.",
      zh: {
        intro: "一件高47公分的方柱形玉琮，中間有圓孔，是四千多年前良渚文化的作品。",
        more: "它用深碧綠色、帶深淺赭斑的閃玉琢成，四個轉角由上而下雕了十七節小眼面紋，全器共有六十八個小眼面紋。它大約在十九世紀才入藏清宮，所以表面沒有乾隆皇帝的題詩，保留了原貌。上射口還有以極輕細線刻出的神秘符號，可能和當時信奉的「神鳥」有關。",
        look: "沿著四個轉角往下看，一節一節都是小小的眼面紋。"
      }
    },
    "jade-gui": {
      sno: "04009159", room: "306", period: "neolithic", highlight: true,
      name: "Jade Gui Tablet", nameZh: "玉圭",
      date: "Late Shandong Longshan culture, c. 2200–1900 BCE", dateZh: "山東龍山文化晚期，西元前2200–1900年",
      intro: "A gui tablet, a ritual jade that stood for a ruler's power. In the Longshan culture, only the ruling class could use jade.",
      more: "Faces of gods or ancestors are carved in low relief on its middle. More than 3,000 years after it was made, it entered the Qing imperial collection. The Qianlong Emperor loved it so much that he had his poetry carved into it and a wooden stand made for it. He didn't know what the ancient carvings meant, though, so his poetry runs in the opposite direction to the original designs.",
      look: "Compare the directions: the emperor's poem and the ancient faces point opposite ways.",
      zh: {
        intro: "玉圭是象徵統治者身分的禮器。在龍山文化，只有統治者才有資格使用玉器。",
        more: "圭的中段兩面以淺浮雕琢出神祖面紋：一面具象，頭戴「介」字形冠、圓眼咧嘴、有獠牙和圓耳環；另一面抽象，是大漩渦眼。三千多年後它傳入清宮，乾隆皇帝非常喜愛，加配紫檀木座，又兩次賦詩加刻在器表。可惜他不了解這些紋飾，配座和刻詩的方向都和神祖面紋相反。現在故宮以刃線向上的方式擺放，尊重原創者的理念。",
        look: "比較方向：乾隆的詩和古老的神面，方向剛好相反。"
      }
    },
    "eagle-gui": {
      sno: "04001020", record: "故玉001856N000000000", room: "306", period: "neolithic",
      name: "Jade Gui Tablet", nameZh: "玉圭",
      date: "Late Longshan culture, 2200–1900 BCE", dateZh: "山東龍山文化晚期，西元前2200–1900年",
      intro: "A second Longshan jade gui, from the region around Mount Tai. Faint carvings show the gods of the Dongyi people: an ancestor in a jeweled crown, and an eagle flying up to heaven.",
      more: "Gui tablets stood for a ruler's power and were held blade up. This one was made 4,300 to 3,800 years ago, when the Dongyi people lived around Mount Tai. One face shows a god or ancestor with spiral eyes and a crown trimmed with phoenix feathers. The other shows an eagle whose shape echoes that crown. On the narrow edge, only about a centimeter wide, is a long-haired woman with round earrings, possibly the Dongyi queen mother Changyi. The Qianlong Emperor didn't know what the carvings meant, so he turned it blade down and had his poem and seal carved on it.",
      look: "Look at the narrow edge for the tiny long-haired woman, then compare the direction of the emperor's poem with the ancient carvings.",
      zh: {
        intro: "另一件龍山文化玉圭，來自泰山周邊的海岱地區。上面淺淺地刻著東夷人信奉的神祖，還有向上衝飛的鷹鳥。",
        more: "圭是象徵統治者身分地位的禮器，在典禮中要刃部朝上捧握。這件距今約4300至3800年，當時住在那裡的是文獻中的「東夷」。一面雕著大漩渦眼、頭戴「介」形寶冠的神祖，冠兩旁插著鳳羽；另一面是向上衝飛的鷹鳥，整隻鷹構成象徵通天的「介」形。寬約1公分的窄邊上，還刻著一個戴圓耳環的長髮女子，可能是東夷母后「常儀」。十八世紀的乾隆皇帝不了解這些紋飾，把刃部朝下，加刻了御製詩和璽文。",
        look: "在窄邊上找找那位長髮女子，再比較乾隆的詩和古老紋飾的方向。"
      }
    },
    "dragon-phoenix-jade": {
      sno: "04001089", record: "故雜000960N000000000", room: "306", period: "shang",
      name: "Jade Ornament in the Shape of Phoenix Crowned with Dragon", nameZh: "龍冠鳳紋玉飾",
      date: "Late Shang dynasty", dateZh: "商晚期",
      intro: "A thin jade phoenix, only 3 millimeters thick, wearing a kui dragon as its crown.",
      more: "With its hooked beak and curled tail, the phoenix seems to be in motion, and the fine, precise carving gives the whole piece great spirit. It was made in the late Shang dynasty, more than three thousand years ago.",
      look: "Find the little dragon perched on the phoenix's head, then follow the curl of its tail.",
      zh: {
        intro: "一片薄薄的玉鳳，厚只有0.3公分，頭上戴著一條夔龍當作冠飾。",
        more: "鉤喙卷尾，雕工細緻，全器神采飛動。它是三千多年前商代晚期的作品。",
        look: "找找停在鳳頭上的小夔龍，再順著看鳳尾的捲曲。"
      }
    },
    "bi-xie": {
      sno: "04001022", record: "故玉002789N000000000", room: "306", period: "han", highlight: true,
      name: "Jade Pi-Hsieh, auspicious beast", nameZh: "玉辟邪",
      date: "Eastern Han dynasty, 25–220 CE", dateZh: "東漢，西元25–220年",
      intro: "A winged beast whose name means \"to ward off evil.\" With its head raised and jaws open, it looks ready to growl.",
      more: "In the Han dynasty, bixie were shown as winged, four-legged animals, a form that probably came from Western Asia. Huge stone ones lined the roads to tombs, and smaller ones were carved from fine jade for the wealthy and powerful. This is one of the larger Han jade bixie known, and its long, horse-like snout sets it apart from the tiger-like faces of others. It belonged to the imperial collection. An emperor's poem is carved on its chest, and its rosewood stand reads \"Imperial curio for the Qianlong Emperor.\"",
      look: "Follow the long beard from its jaw down to its chest, where the poem is carved.",
      zh: {
        intro: "一隻長著翅膀的神獸，名字的意思是「避開邪惡」。牠昂首張口，好像正在咆哮。",
        more: "四足猛獸又長著翅膀的形象，最初可能來自西亞；漢代繼承這個傳統，把帶翼瑞獸當作天上仙界的象徵之一。這件辟邪雖然站著不動，卻充滿作勢前躍的動感。清代乾隆皇帝很喜愛它，特地製作底座，並賦詩篆刻在胸口和座底。玉質原本是青白色，前人把頭、頸、胸等處染成褐紅色，更顯古意。",
        look: "看看牠的胸口，那裡刻著乾隆皇帝的詩。"
      }
    },
    "lotus-leaf-wash": {
      sno: "04001024", room: "306", period: "songYuan", photo: false,
      name: "Jade Brush Wash in the Shape of Lotus Leaf", nameZh: "玉荷葉洗",
      date: "Southern Song to Yuan dynasty, 1127–1368", dateZh: "南宋至元，西元1127–1368年",
      intro: "A jade cup shaped like a dried lotus leaf curling in on itself. Its stalk winds up from the base, so it works as both foot and handle.",
      more: "The jade is mostly brownish yellow, with a little of its original yellow-green showing on the base, and reddish color in the carved lines suggests it was dyed. A white jade lotus cup from a Southern Song tomb in Quzhou, Zhejiang, has a similar design, though this one is more refined. The poet Su Dongpo joked that his morning drink was \"watering the books\", and the Ming painter Chen Hongshou painted him holding a lotus cup much like this one, as a sign of a scholar keeping his ideals in hard times. That painting is in this museum too.",
      look: "Follow the stalk from the center of the base up to the rim, and look for the leaf veins on the outside.",
      zh: {
        intro: "一只像枯荷葉向內捲起的玉杯。葉梗從杯底彎繞到杯側，同時當作足和把手。",
        more: "玉質大多是褐黃色，底部微微露出原本的黃綠色，刻線中摻有褐紅色，推測曾經染色。浙江衢州南宋史繩祖墓出土的白玉荷葉杯，設計手法很相似，但這件更成熟細膩。蘇東坡曾把晨飲稱為「澆書」，明代陳洪綬在〈畫隱居十六觀冊〉（也在本院）裡，就畫東坡手持一只很像這件的荷葉杯，象徵文人不向惡劣環境屈服。",
        look: "順著葉梗從杯底中心看到杯緣，再找找外壁的葉脈。"
      }
    },
    "jade-duck": {
      sno: "04009113", room: "306", period: "songYuan", highlight: true,
      name: "Jade Duck", nameZh: "黃玉鴨",
      date: "Song to Yuan dynasty", dateZh: "宋至元",
      intro: "A little yellow jade duck, just 8.5 centimeters long. With a few simple cuts, the carver made it look plump and full of life.",
      more: "It's carved from yellow nephrite, with a dark brown head, belly and feet. The carving is very simple, but the lifted tail and rounded bottom are captured so well that it looks adorable and lively. The brown areas feel slightly rough, and their color fades from the tips of the bill and feet backward, so the museum thinks the color was added by dyeing.",
      look: "Look at the lifted tail and round bottom; that's where all its personality comes from.",
      zh: {
        intro: "一隻小小的黃玉鴨，長只有8.5公分。寥寥幾刀，就讓牠顯得圓胖又生動。",
        more: "以黃色閃玉琢成，頭、腹和雙足是深褐色。從北宋開始，以雁鴨為主題的玉器越來越多，和當時繪畫重「寫生」的風氣一致。這件的琢碾手法極簡單，卻抓住了鴨子翹尾豐臀的特徵，可愛又活潑。褐色部分表面較粗糙，顏色由嘴、足的尖端向後漸淡，研判是經過人為染色。",
        look: "看看牠翹起的尾巴和圓圓的屁股，可愛的神情都在這裡。"
      }
    }
  };

  const api = { PERIODS, PIECES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.PieceData = root.PieceData || {}).jade = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
