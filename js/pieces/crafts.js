/*
  A Garland of Treasures (集瓊藻), Room 106: every piece the museum lists for
  the room, plus the curio cabinet from its Classic Tour route, in walking
  order (oldest first). Fields as in bronze.js.
*/
(function (root) {
  const CLASSIC_TOUR = "https://www.npm.gov.tw/Articles.aspx?sno=04012815&l=2";

  const PERIODS = {
    yuanMing: { en: "Yuan to Ming", zh: "元至明" },
    ming: { en: "Ming dynasty", zh: "明代" },
    qing: { en: "Qing dynasty", zh: "清代" }
  };

  const PIECES = {
    "silver-raft-cup": {
      sno: "04009168", record: "中雜000100N000000000", room: "106", period: "yuanMing", highlight: true,
      name: "Silver raft cup of \"Zhang Qian Riding a Raft\" with the mark of Zhu Bishan", nameZh: "朱碧山款「張騫乘槎」銀槎",
      date: "Yuan to Ming dynasty, 1271–1644", dateZh: "元至明，西元1271–1644年",
      intro: "A silver cup shaped like a hollow log raft. Riding it is Zhang Qian, who in legend sailed up the Yellow River all the way to the Milky Way.",
      more: "In the story, the Han envoy Zhang Qian set out on a raft to find the source of the Yellow River and reached the Milky Way, where he met the Cowherd and the Weaver Girl. Here he sits gazing at the sky, headscarf fluttering and robe open, smiling into the breeze with a stone from the Weaver Girl's loom in his hand. Marks on the bottom, \"Bishan zi\" and \"made in the Yiyou year of Zhizheng\" (about 1345), suggest it's by the famous Yuan silversmith Zhu Bishan, or by a smith trained in his style. The Qing palace owned three raft cups in Zhu's style, each one different.",
      look: "Find the little stone in Zhang Qian's right hand. It's carved with two characters, zhi ji, \"loom stone\".",
      zh: {
        intro: "一件做成中空枯木筏的銀杯，乘坐其上的是張騫。傳說他乘槎尋訪黃河源頭，一路到了天河。",
        more: "故事說，漢代的張騫乘槎尋訪河源，到了天河遇見牛郎、織女，還帶回了支機石。銀槎上的張騫坐在槎內仰望天際，綸巾揚起、衣襟敞開，臨風微笑，右手握著一塊長方石。器底有「碧山子」和「至正乙酉年造」的篆銘，可知它或許出自元代嘉興著名銀工朱碧山之手，或是承襲他雕刻銀器風格的作品。清代內府曾收藏三件朱氏款的銀槎，造型做工各有特色。",
        look: "找找張騫右手握著的長方石，上面有篆書「支機」兩個字。"
      }
    },
    "cloisonne-lotus-box": {
      sno: "04001025", room: "106", period: "ming", photo: false,
      name: "Box with Indian lotus decoration in cloisonné enamels", nameZh: "掐絲琺瑯番蓮紋盒",
      date: "Ming dynasty, Jingtai reign (1450–1456)", dateZh: "明景泰，西元1450–1456年",
      intro: "A heavy little cloisonné box shaped like a lotus, marked \"Made during the Jingtai reign of the Great Ming\". Jingtai pieces like this gave cloisonné its Chinese name, Jingtai blue.",
      more: "Copper wires outline every lotus petal, filled with enamels in yellow, indigo, light blue, bright red and white, and the gilding on the wires still shows. An early Ming connoisseur, Cao Zhao, sneered that cloisonné suited only the women's quarters, not a scholar's desk. But it became hugely popular, and late Ming collectors ranked Jingtai cloisonné with Chenghua porcelain, Xuande bronzes and Yongle lacquer among the greatest Ming crafts. Many pieces marked Jingtai aren't genuine, but this incense box truly matches the style of the period.",
      look: "Look at the lotus petals around the sides: each tip curls out, and each petal holds a slightly different lotus.",
      zh: {
        intro: "一件沉甸甸的蓮花形掐絲琺瑯盒，盒內底刻著「大明景泰年製」。景泰年間的作品，讓掐絲琺瑯有了「景泰藍」的俗稱。",
        more: "銅胎上以銅絲掐出一片片蓮瓣，填施鵝黃、靛藍、淺藍、鮮紅、瑩白等琺瑯，絲線上的鍍金痕跡依然清晰。明初賞鑑家曹昭曾譏笑掐絲琺瑯「但可婦人閨閣中用，非士夫文房清玩也」，但它在明代製作極盛，晚明鑑賞家更把它和成化瓷器、宣德銅器、永樂漆器並舉。傳世景泰款器真偽雜陳，這件香盒是難得與時代風格相符的有款器。",
        look: "看看盒身一圈的蓮瓣：瓣尖微微外捲，每片蓮瓣裡的折枝蓮都不太一樣。"
      }
    },
    "duck-censer": {
      sno: "04009162", record: "故琺001005N000000000", room: "106", period: "ming",
      name: "Copper incense burner in the shape of a wild duck in cloisonné enamels", nameZh: "掐絲琺瑯鳧式爐",
      date: "Ming dynasty, early 16th century", dateZh: "明，十六世紀前期",
      intro: "An incense burner shaped like a wild duck with its head held high. The smoke drifted up through its neck and out of its bill.",
      more: "Cloisonné is made by bending thin copper wires into little compartments on a metal body, filling them with colored enamels, firing it again and again, then polishing and gilding it. The technique reached China from the West in the Yuan and peaked in the Jingtai reign of the Ming. In this duck, the lid and body fit together at the belly, and colored enamels show every feather. The gilt base was probably added later. The character jia cut into its underside is an appraisal mark from the Qianlong reign.",
      look: "Find the line around the duck's belly where the lid lifts off, then follow the smoke's path up the neck to the bill.",
      zh: {
        intro: "一隻昂首的野鴨造型香爐。香煙從鴨頸往上，從嘴裡飄出來。",
        more: "掐絲琺瑯是先用銅絲在金屬胎上框出格子，填入各色釉料，反覆燒製，再打磨、鍍金而成。這項技術在元朝由西方傳入中國，明代發揚光大，在景泰年間達到高峰，所以又稱「景泰藍」。這件的爐蓋和器身在腹部套合，全身以各色琺瑯表現羽毛。鎏金基座應是後來加的，底部中央陰刻的「甲」字，是乾隆朝評鑑文物的標記。",
        look: "找找鴨腹上爐蓋和器身套合的那一圈，再順著香煙的路線，從頸部看到嘴巴。"
      }
    },
    "ming-lacquer-cabinet": {
      source: CLASSIC_TOUR, room: "106", period: "ming", highlight: true,
      name: "Carved red lacquer curio cabinet with cloud-and-dragon decoration", nameZh: "剔紅雲龍紋小櫃",
      date: "Ming dynasty, Jiajing reign (1522–1566)", dateZh: "明嘉靖，西元1522–1566年",
      intro: "A Ming dynasty cabinet of carved red lacquer, decorated with clouds and dragons. The Qing court turned it into a treasure cabinet full of tiny objects.",
      more: "The cabinet has four tiers, with one, two, three and four drawers, and inside each one the Qing palace added another wooden drawer. With the cabinet, the set counts 109 items, mostly from the Qing. They include ink cakes, 41 small jades, little calligraphy booklets, porcelain, Western clocks and enamels, miniature paintings, lacquer boxes, bronzes, and desk objects such as seals, water containers and paperweights.",
      look: "Look at the drawers: one, two, three and four, tier by tier.",
      zh: {
        intro: "明代剔紅雲龍紋小櫃。清宮把它改裝成百寶櫃，裡面裝滿了小巧的珍玩。",
        more: "櫃子有四層，分別有一、二、三、四個抽屜，清宮又在每個抽屜裡加了木屜。連同櫃子，整組共有109件，大多是清代的東西：墨、41件小玉器、小冊子、瓷器、西洋鐘錶和琺瑯、微型畫、漆盒、銅器，還有印章、水丞、紙鎮等文房用品。",
        look: "看看抽屜：由上而下，一、二、三、四個。"
      }
    },
    "enamel-dragon-vase": {
      sno: "04001106", record: "故琺000690N000000000", room: "106", period: "qing",
      name: "Copper vase with coiled dragons and peony decoration on a yellow ground in painted enamels", nameZh: "銅胎畫琺瑯黃地牡丹紋蟠龍瓶",
      date: "Qing dynasty, Yongzheng reign (1723–1735)", dateZh: "清雍正，西元1723–1735年",
      intro: "A painted enamel vase on a bright yellow ground, covered in peonies, with little kui dragons clinging to its shoulders.",
      more: "Painted enamel came from the West. Under the Yongzheng Emperor's close watch it flourished on porcelain, copper and glass alike, with brilliant colors and very refined decoration. The peonies here are a traditional Chinese lucky pattern, while the dragons on the shoulders and the ring of scrolling leaves on the neck are finely made. It may show craftsmen reinterpreting Chinese traditions after learning Western techniques.",
      look: "Find the kui dragons climbing up each side of the shoulder.",
      zh: {
        intro: "黃地畫琺瑯瓶，畫滿了牡丹，肩部兩側還攀著小小的夔龍。",
        more: "清雍正時期在皇室高度關注下，源自西方的畫琺瑯進入全面發展的階段，無論瓷胎、銅胎或玻璃胎，色彩都很鮮麗，紋飾也極其講究。器表的牡丹是傳統中國吉祥圖案，器肩兩側鑲嵌的夔龍和頸上的捲草環雕工精細，或可看成是吸收西洋技術之後，對傳統工藝所做的再詮釋。",
        look: "找找攀在器肩兩側的夔龍。"
      }
    },
    "bamboo-monkey-horse": {
      sno: "04009173", record: "故雕000117N000000000", room: "106", period: "qing",
      name: "Bamboo-root carving of a well-wishing monkey riding on horse", nameZh: "竹根雕馬上封侯",
      date: "Qing dynasty, 18th century", dateZh: "清，十八世紀",
      intro: "A tiny carving in bamboo root, just 6.7 centimeters long: a resting horse looks back at a little monkey on its back, who's holding a peach.",
      more: "It's a pun. In Chinese, \"on horseback\" also means \"right away\", and \"monkey\" sounds like \"marquis\", so it wishes someone a high rank, and soon. Though the carving is tiny, the animals' poses and expressions and the natural grain of the bamboo are all handled with great care. It was kept as a curio in a treasure box.",
      look: "Find the peach in the monkey's hands, and the horse turning its head to look at it.",
      zh: {
        intro: "一件只有6.7公分長的竹根雕：半臥的駿馬回頭，望著背上捧著桃子的小猴。",
        more: "竹根以圓雕手法雕成，寓意「馬上封侯」：「馬上」有立刻的意思，「猴」諧音「侯」，祝福人很快就能封官晉爵。器雖小，但動物的情態和肌理都處理得毫不含糊，是存放在多寶格裡的賞玩件。",
        look: "找找小猴手裡捧著的桃子，還有回頭看牠的馬。"
      }
    },
    "flint-case": {
      sno: "04009164", record: "故雜000855N000000000", room: "106", period: "qing",
      name: "Gilt flint case with coral-and-turquoise inlay (with carved lacquer box and Qianlong reign mark)", nameZh: "鍍金嵌松石珊瑚火鐮盒 附乾隆款雕漆盒",
      date: "Qing dynasty", dateZh: "清",
      intro: "A gilded flint case, 6.5 centimeters long, studded with coral and turquoise. It was the Qing version of a lighter, worn at the waist.",
      more: "Release the coral knob on top and the case slides open to show a narrow gold compartment for flint and tinder. Striking the flint against the iron plate at the bottom made sparks. For the Manchu imperial family and nobles, who prized riding, archery and hunting, wearing a flint case was also a way to remember their ancestors and traditions. This one came with a silk wrapper and a pomegranate-shaped lacquer box marked with the Qianlong reign, all kept in a treasure box in the Hall of Mental Cultivation, so it was probably the emperor's own.",
      look: "Find the coral knob on top, and the tiny gold beads filling the spaces between the flowers.",
      zh: {
        intro: "一件鍍金的火鐮盒，長6.5公分，鑲著珊瑚和綠松石。它是清代男子繫在腰間的「打火機」。",
        more: "鬆開上方的珊瑚豆、拉開盒身，裡面是金片組成的窄長內腔，可以裝打火用的燧石和火絨；用燧石磨擦下端的鐵片就能取火。對注重騎射圍獵的滿族皇室與貴族來說，佩帶火鐮盒除了實用，更有緬懷先祖、不忘根源的意思。這件配有團龍紋錦袱和乾隆款石榴形雕漆盒，收貯在清宮養心殿的多寶格箱盒中，應是帝王御用的珍藏。",
        look: "找找上方的珊瑚豆，還有花朵之間布滿的細小金珠。"
      }
    },
    "coral-kuixing": {
      sno: "04009165", room: "106", period: "qing", photo: false,
      name: "Artificial planter with a coral carving of the planetary deity Kuixing", nameZh: "珊瑚魁星點斗盆景",
      date: "Qing dynasty", dateZh: "清",
      intro: "A \"potted plant\" with no plant at all: a red coral Kuixing, the god of examinations, balancing on one foot on the head of a jadeite sea creature.",
      more: "The pot is pale green jade, Kuixing is red coral, and the ao fish he stands on is jadeite, all set with sapphires, tourmalines, spinels, amber, crystal, pearls and kingfisher feathers. Kuixing holds a constellation in his right hand and a plum blossom in his left. Standing on the ao fish amid the waves, he stands for success in study and the exams. Gems on the sides of the pot form the \"five blessings around longevity\".",
      look: "Find the constellation in Kuixing's right hand and the plum blossom in his left.",
      zh: {
        intro: "一盆沒有植物的「盆景」：紅珊瑚雕成的魁星，單腳立在翡翠鰲魚的頭上。",
        more: "全器以青白玉雕作方盆，紅色珊瑚為魁星，翠綠翡翠為鰲魚，再綴以藍寶石、紅碧璽、紅尖晶石、紫色寶石、琥珀、白水晶、珍珠和點翠。魁星右手持星斗、左手持梅花，獨腳立在波濤中的鰲魚頭上，象徵啟動文運，寄託人們對功名成就的祝福。玉盆四壁以五色寶石裝飾「五福拱壽」圖案。",
        look: "找找魁星右手的星斗和左手的梅花。"
      }
    },
    "bovet-watch": {
      sno: "04009166", record: "故雜003278N000000000", room: "106", period: "qing",
      name: "\"Bovet\" pocket watch inlaid with pearl and decoration in painted enamels", nameZh: "「播喴」畫琺瑯鑲珠懷錶",
      date: "19th century", dateZh: "十九世紀",
      intro: "One of a pair of Swiss pocket watches made for the Chinese market, ringed with pearls and painted in enamel with three cupids among roses.",
      more: "Western clocks and watches were treasured in China from the Ming and Qing onward, and pocket watches were status symbols as well as timekeepers. Inside the case, a crown mark holds two Chinese characters, Bo Wei, the Chinese name of Bovet, a Swiss watchmaking family famous for enamel watches for the East. Bovet set up a company in Guangzhou in the first half of the 19th century. The pictures on the two watches mirror each other, and the cupids' faces look less Western than usual, a sign they were designed for buyers in late Qing China.",
      look: "Find the cupid holding up a basket of fruit, and the two others sitting close together.",
      zh: {
        intro: "一對瑞士懷錶中的一只，專為中國市場製作，周圍鑲著珍珠，畫琺瑯描繪三個小愛神在玫瑰花間。",
        more: "西洋鐘錶自明清之際傳入中國後，一直很受宮廷和仕宦工商階層喜愛；懷錶不僅能計時，也是彰顯身分的貴重收藏。錶殼內的皇冠形圈飾裡有「播喴」二字，是瑞士製錶家族Bovet的中譯名。播喴以銷往東方的精美琺瑯錶著稱，十九世紀上半葉就在廣州設立公司。這對錶的圖案左右對稱，小愛神的五官也和常見深目高鼻的西洋嬰童不太一樣，應是為晚清中國市場設計的作品。",
        look: "找找高舉果籃的小愛神，還有另外兩個依偎在一起的。"
      }
    },
    "ivory-ball": {
      sno: "04009167", record: "故雕000055N000000000", room: "106", period: "qing", highlight: true,
      name: "Ivory ball of concentric layers decorated with openwork figures", nameZh: "象牙雕鏤空人物套球",
      date: "Qing dynasty, second half of the 19th century", dateZh: "清晚期，西元1850–1900年",
      intro: "Eighteen ivory balls nested one inside another, and each layer can still move on its own.",
      more: "The piece hangs in four parts linked by chains: a dragon-fish hook at the top, two court ladies carved in the round, the nested balls, and a pendant of the Heavenly Twins of Conjugal Felicity. The outer ball is carved with mountains, rivers, pavilions and figures. It was probably made by ivory carvers in Guangdong. The Qing imperial workshop was so amazed by these southern carvers' nested balls and linked chains that it called them \"the work of celestial beings.\"",
      look: "Peer through the openings in the outer ball to see the layers inside.",
      zh: {
        intro: "十八層象牙球一層套一層，每一層都還能各自轉動。",
        more: "整件由四部分以鏈子串連：最上面是鰲魚勾，接著是立雕的兩位仕女、鏤空套球，最下面是和合二仙墜。外層高浮雕山水、亭臺和人物。依雕工和風格判斷，應出自清代中期以後的廣東牙匠。清代南派牙雕的連鏈、活紋和多層象牙球，在北京內廷被稱為「仙工」。",
        look: "從外層的鏤空處往裡看，一層一層的球都在裡面。"
      }
    }
  };

  const api = { PERIODS, PIECES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.PieceData = root.PieceData || {}).crafts = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
