/*
  The Magic of Kneaded Clay (摶泥幻化), Rooms 201 and 205: every piece the
  museum lists for these rooms, in walking order (oldest first, room by room).
  Fields as in bronze.js.
*/
(function (root) {
  const PERIODS = {
    neolithic: { en: "Neolithic", zh: "新石器時代" },
    han: { en: "Han dynasty", zh: "漢代" },
    tang: { en: "Tang dynasty", zh: "唐代" },
    fiveDynasties: { en: "Five Dynasties", zh: "五代" },
    song: { en: "Song dynasty", zh: "宋代" },
    yuan: { en: "Yuan dynasty", zh: "元代" },
    ming: { en: "Ming dynasty", zh: "明代" },
    qing: { en: "Qing dynasty", zh: "清代" }
  };

  const PIECES = {
    // ---- Room 201 ----
    "white-gui-pitcher": {
      sno: "04001122", record: "贈瓷000445N000000000", room: "201", period: "neolithic",
      name: "White pottery gui-pitcher", nameZh: "白陶鬹",
      date: "Dawenkou culture, Neolithic period, 4300–2500 BCE", dateZh: "新石器時代 大汶口文化，西元前4300–2500年",
      intro: "A white pottery wine pitcher shaped like an abstract bird, its neck stretched up as if calling to the sky. It's 29.5 centimeters tall.",
      more: "People of the Dawenkou culture believed they were descended from birds, so potters shaped vessels like this one, which also held fine wine. Its white color comes from clay rich in aluminum oxide. Legends say the sage rulers of ancient China treated pottery as an essential skill for daily life, and archaeology shows potters at work all over China in the Neolithic.",
      look: "Find the bird in it: the spout raised like a beak, and three legs holding up the body.",
      zh: {
        intro: "一件白陶酒器，造型像一隻抽象的鳥，引頸向天鳴啼。高29.5公分。",
        more: "大汶口文化的人們相信「鳥」是祖先的來源，所以陶工用泥土塑造出這隻鳥兒，同時也是盛裝美酒的容器。它的白色來自含有大量三氧化二鋁的陶土。傳說古代賢王都很重視製陶，把它當作民生的重要技能；實際上，新石器時代各地都有製陶業。",
        look: "找找它身上的鳥：像鳥嘴一樣仰起的流口，還有撐起身體的三隻腳。"
      }
    },
    "black-stem-cup": {
      sno: "04001094", record: "贈瓷000447N000000000", room: "201", period: "neolithic",
      name: "Black pottery stem cup", nameZh: "黑陶高足杯",
      date: "Longshan culture, Neolithic period, 2500–2000 BCE", dateZh: "龍山文化，西元前2500–2000年",
      intro: "A tall black pottery cup on a slender stem, 24 centimeters high. Pottery with walls this thin is called eggshell pottery.",
      more: "Potters of the Shandong Longshan culture developed the potter's wheel, which let them make very thin walls and even carve openwork patterns into them. To turn pottery black, they added carbon at the very end of the firing or closed the kiln's air intake, so carbon soaked into the clay.",
      look: "Look at how thin and even the walls are, and how the tall stem balances the wide cup.",
      zh: {
        intro: "一件細長高足的黑陶杯，高24公分。壁薄如蛋殼的這類陶器，又叫「蛋殼陶」。",
        more: "山東的龍山文化發展出輪製拉坯技術，可以做出很薄、甚至還能鏤雕圖案的陶器。在窯中最後加碳，或封閉空氣入口，讓窯中產生滲碳作用，就燒出了黑陶。",
        look: "看看杯壁有多薄多均勻，還有細高的足怎麼撐起寬大的杯口。"
      }
    },
    "cocoon-jar": {
      sno: "04001099", record: "故雜001175N000000000", room: "201", period: "han",
      name: "Cocoon-shaped black pottery jar", nameZh: "黑陶繭形壺",
      date: "Western Han period, 206 BCE–8 CE", dateZh: "西漢，西元前206–西元8年",
      intro: "A black pottery jar shaped like a silkworm's cocoon. It was made to store wine.",
      more: "Bands of parallel lines run around its body. Between them, many centuries later, the Qianlong Emperor had a 90-character poem engraved. It's 32 centimeters tall and nearly a meter around.",
      look: "Look between the bands of lines for the emperor's poem.",
      zh: {
        intro: "一件像蠶繭形狀的黑陶壺，是用來貯酒的。",
        more: "器身飾有多組平行線紋，行間刻有清乾隆皇帝所賦的詩文90字。高32公分，腹圍將近一公尺。",
        look: "在一道道平行線紋之間，找找乾隆皇帝的詩。"
      }
    },
    "tang-lady": {
      sno: "04009152", record: "贈瓷000434N000000000", room: "201", period: "tang", highlight: true,
      name: "Painted pottery figure of a standing lady", nameZh: "灰陶加彩仕女俑",
      date: "Tang dynasty, 618–907", dateZh: "唐，西元618–907年",
      intro: "A Tang dynasty tomb figure of a young woman, 75 centimeters tall. Her round face and full figure were the Tang ideal of beauty.",
      more: "Tang funerals were elaborate, with many grave goods to provide for the dead and to show off the family's wealth. She has long, fine brows, a small peach-shaped mouth and a calm expression. Her tall hairstyle, with strands curving around her cheeks, was popular in the late Tang. She stands with easy confidence in a long, broad robe.",
      look: "Look for the pointed shoes peeking out under her robe, and her hands: one raised to her chest, one lowered.",
      zh: {
        intro: "唐代墓葬中的仕女俑，高75公分。圓潤的臉龐和豐腴的體態，正是唐代女子追求的美。",
        more: "唐代重視隆重的葬禮，常以豐厚的物品陪葬，一方面希望死者來世衣食無缺，一方面也炫耀家族的財富。她有細長的眉眼、櫻桃小口，神情安詳；高聳蓬鬆的髮髻、兩邊頭髮環抱臉頰，是唐代晚期流行的樣式。她穿著寬大的長袍，流露雍容自信的姿態。",
        look: "找找從長袍下襬露出的尖頭小靴，還有她的雙手：右手舉到胸前，左手微微下垂。"
      }
    },
    "tang-lady-polo": {
      sno: "04009170", record: "購瓷000134N000000000", room: "201", period: "tang", highlight: true,
      name: "Pottery figure of lady playing polo game in sancai glaze", nameZh: "三彩馬球仕女俑",
      date: "Tang dynasty, 618–907", dateZh: "唐，西元618–907年",
      intro: "A Tang lady on horseback, holding a polo stick. Polo came from Persia and was a favorite sport of the Tang upper class.",
      more: "She rides a yellow horse with a colorful saddle, turning to one side with the halter in one hand and the stick in the other. Tang women often wore nomadic-style clothes for riding, with turned-down collars, narrow sleeves and soft boots. The figure is glazed in sancai, three-color glaze, with yellow, green, white and ochre dripping into one another.",
      look: "Follow the colors running down the horse. That dripping effect is the sancai glaze.",
      zh: {
        intro: "一位騎在馬上、手握球桿的唐代仕女。來自波斯的馬球，很受唐代上層社會歡迎。",
        more: "她跨騎在彩鞍黃馬上，側身微傾，左手勒韁，右手握桿擊球。唐代婦女以健康為美，喜歡穿翻領、窄袖、軟靴的胡服，輕便地從事各種馬上活動。整件施以黃、綠、白、褐色相間的三彩釉，色彩淋漓鮮豔。",
        look: "看看馬身上流淌交融的色彩，那就是三彩釉的效果。"
      }
    },
    "xing-flask": {
      sno: "04009154", record: "中瓷004012N000000000", room: "201", period: "tang",
      name: "Porcelain vase with loops in white glaze", nameZh: "邢窯 白瓷穿帶壺",
      date: "Tang dynasty, 618–907", dateZh: "唐，西元618–907年",
      intro: "A water flask in pure white porcelain from the Xing kilns. Early connoisseurs compared Xing white wares to silver and snow.",
      more: "The Xing kilns, in today's Hebei province, were a leading maker of white porcelain in northern China, known for fine clay and pure white glaze. Flasks like this held water in the Tang, and the Xing kilns made a great many of them. Their shape copies the metal and leather water bottles carried by the nomadic peoples of the north, and since the kilns were close to where those peoples lived, they may have been made for them.",
      look: "Find the shallow grooves down each side and the small loops above and below them. A rope ran through them to carry the flask.",
      zh: {
        intro: "邢窯的白瓷水壺。邢窯白瓷胎質細緻、釉色潔白，古人稱讚它「如銀、如雪」。",
        more: "邢窯位於河北省內丘、臨城一帶，是唐代北方生產白瓷的著名窯場。穿帶壺是唐代常見的盛水器，又以邢窯白瓷的製品最多，造型像北方遊牧民族隨身攜帶的金屬或皮質水壺。邢窯離遊牧民族活動的區域不遠，這種瓷器或許就是為他們製作的。",
        look: "找找壺身兩側微微內凹的凹槽，還有上下貼附的小耳，是用來穿繩攜帶的。"
      }
    },
    "yue-washer": {
      sno: "04009169", record: "故瓷014979N000000000", room: "201", period: "fiveDynasties",
      name: "Celadon water container, Yue ware", nameZh: "越窯 秘色青瓷洗",
      date: "Five Dynasties period, 907–960", dateZh: "五代，西元907–960年",
      intro: "A wide celadon basin from the Yue kilns. Late Tang poets said Yue glaze had the color of \"a thousand emerald peaks\".",
      more: "Basins like this come mostly from the tombs of the royal family of the Wuyue kingdom, which usually held at least one. Its shape and firing method match the famous Yue wares found in the underground treasury of Famen Temple, so it's certainly Yue ware. Yet inside, an expert from the committee that inventoried the Qing palace wrote in ink that it was Ru ware, which shows how views of Ru and Yue wares have changed over the last hundred years.",
      look: "Look around the edge of the base for the ring of rough spur marks, where the gray clay shows through.",
      zh: {
        intro: "越窯的大口青瓷洗。晚唐詩人形容越窯青瓷的釉色，像一望無際的「千峰翠色」。",
        more: "出土這類青瓷洗的墓葬，墓主多是吳越國的王室成員，而且至少都陪葬一件。它的造形和裝燒方法，都和法門寺地宮出土的越窯秘色青瓷洗相似，所以無疑是越窯青瓷。但器內有清室善後委員會專家墨書的「汝窯撇口果洗一件」，可見近百年來大家對汝窯和越窯的看法有了改變。",
        look: "看看底緣那一圈不規整的支燒痕，透過痕跡可以看到灰色的胎。"
      }
    },

    // ---- Room 205 ----
    "baby-pillow": {
      sno: "04001028", record: "故瓷004923N000000000", room: "205", period: "song", highlight: true,
      name: "Pillow in the shape of a recumbent child in white glaze, Ding ware", nameZh: "定窯 白瓷嬰兒枕",
      date: "Northern Song dynasty, 960–1127", dateZh: "北宋，西元960–1127年",
      intro: "Yes, this is a pillow! A white porcelain pillow from the Ding kilns, shaped like a healthy little child lying on a mattress.",
      more: "In the Song dynasty, ceramic pillows came in many designs, and this one was for everyday use. The child wears a long brocaded top and crosses its legs behind. The glaze is ivory white with a hint of gray. Only three pillows like it are known, and this one has the finest glaze and decoration. Pick it up and a lump of clay inside rattles against the walls. The Qianlong Emperor had a poem inscribed on the bottom in the spring of 1773.",
      look: "Look at the child's face and the pattern on the brocaded top.",
      zh: {
        intro: "沒錯，這是一個枕頭！定窯白瓷枕，做成一個小孩趴在榻上，背部就是枕頭的地方。",
        more: "定窯是宋代北方著名的窯場，以白瓷為主，釉色白中帶微黃。這件的頭和身體分別模製再接合，然後剔刻面容。拿起來搖一搖，器內的泥塊會輕敲內壁，叮叮作響。類似的嬰兒枕全世界只知道三件，這件的釉色和裝飾最美，枕底還刻有乾隆皇帝的御題詩。",
        look: "看看孩子的臉，還有身上錦衣的花紋。"
      }
    },
    "ru-narcissus-bowl": {
      sno: "04001033", record: "故瓷017851N000000000", room: "205", period: "song", highlight: true,
      name: "Narcissus basin in bluish-green glaze, Ru ware", nameZh: "汝窯 青瓷無紋水仙盆",
      date: "Northern Song dynasty, late 11th–early 12th century", dateZh: "北宋",
      intro: "This Ru ware basin is famous for its pure sky-blue glaze with no crackle at all, which is very rare in surviving Ru ware.",
      more: "Only six Ru ware narcissus basins are known. Five of them are here in this museum, and the sixth is in Osaka. A Ming connoisseur wrote that Ru pieces with crackle are genuine, but those without crackle are even better, and this basin is the best example of that. The Qianlong Emperor loved it. He had his poem carved on it and designed a new stand with a drawer holding an album of his own calligraphy and paintings.",
      look: "Look at the glaze: smooth, clear blue, with no crackle lines anywhere. Then find its four cloud-shaped feet.",
      zh: {
        intro: "這件汝窯水仙盆，以純淨無紋片的天青釉聞名，在傳世汝窯中非常罕見。",
        more: "汝窯水仙盆全世界只知道六件，其中五件在故宮，另一件在大阪。晚明鑑賞家說，汝窯有紋片的是真品，沒有紋片的更好，這件正是最好的例子。全器滿布溫潤的天青釉，正是宋人追求「雨過天青」般寧靜開朗的美感。乾隆皇帝很喜愛它，在盆上刻了御製詩，還為它設計附有抽屜的新座，抽屜裡放著他親筆書畫的冊頁。",
        look: "看看釉色：光滑清澈的天青色，一條紋片也沒有。再找找它的四個雲頭形足。"
      }
    },
    "guan-washer": {
      sno: "04001027", record: "故瓷014018N000000000", room: "205", period: "song",
      name: "Hibiscus-shaped basin with light bluish-green glaze, Guan ware", nameZh: "官窯 青瓷葵花式洗",
      date: "Southern Song dynasty, 1127–1279", dateZh: "南宋，西元1127–1279年",
      intro: "A Guan ware box shaped like a six-petaled hibiscus, in a soft blue-green glaze. It held cosmetics, though it has long been called a washer.",
      more: "From its sides to its top it swells and curves like an opening flower, and the top sinks along the petal ridges into a small round center. The thick glaze turns a deeper blue where it pools and a pale brown where it's thin. Its crackle is sparse, long and light, and the foot rim is dark brown.",
      look: "Count the six petals, then find where the glaze pools a deeper blue.",
      zh: {
        intro: "官窯青瓷，做成六瓣葵花的形狀，釉色粉青溫潤。它其實是粧奩盒，但一向被稱為「洗」。",
        more: "從器壁到頂面都曲突有致，頂面順著瓣稜浮雕出向中心斜入的凹弧，像一朵伸展的花。粉青厚釉溫潤勻淨，積釉處色碧，釉薄處略呈粉褐；開片稀疏而長，顏色淺淡；足緣呈暗褐色。",
        look: "數數六片花瓣，再找找釉積得比較深、顏色較碧的地方。"
      }
    },
    "longquan-vase": {
      sno: "04001034", record: "故瓷017827N000000000", room: "205", period: "song",
      name: "Vase with phoenix-shaped handles in celadon glaze, Longquan ware", nameZh: "龍泉窯 青瓷鳳耳瓶",
      date: "Southern Song dynasty, 1127–1279", dateZh: "南宋，西元1127–1279年",
      intro: "A Longquan celadon vase with a dish-shaped mouth and two little phoenixes for handles. Its plain, straight lines are what make it so elegant.",
      more: "The straight neck and straight body form two simple steps, the plainest of lines but also the most solid and stable. The half-round phoenix handles, made in molds, draw your eye up to the mouth, where the glaze pools thick and glossy. Vases of this shape were made in many sizes from the Song to the early Ming, but the Song ones have the finest shape and glaze.",
      look: "Look at the phoenix handles, then up at the glossy rim of the dish-shaped mouth.",
      zh: {
        intro: "龍泉窯青瓷瓶，盤口直頸，兩側有一對鳳耳。正是平直簡單的線條，讓它顯得格外典雅。",
        more: "直頸、直腹形成兩階式的瓶身，是最平實的線條，也是最紮實穩定的組合。頸部配上模合成型、半立體的華麗雙鳳耳，引導視線到盤口；盤面積釉厚，呈現靈巧豐潤的光澤。這種造型由宋到明初都有燒造，各種大小都有，但以宋代的造型和釉色最為精美。",
        look: "看看兩側的鳳耳，再往上看盤口那一圈厚厚的釉光。"
      }
    },
    "jun-pillow": {
      sno: "04001035", record: "故瓷017425N000000000", room: "205", period: "yuan",
      name: "Ruyi-shaped pillow with sky blue glaze and purple spots, Jun ware", nameZh: "鈞窯 天青釉紫斑如意枕",
      date: "Yuan dynasty, 1279–1368", dateZh: "元，西元1279–1368年",
      intro: "A Jun ware pillow shaped like a ruyi cloud, in thick sky-blue glaze splashed with purple-red spots.",
      more: "The purple-red spots come from copper in the glaze, scattered naturally across the blue. The Qianlong Emperor carved a poem on the base in 1776 and thought it came from the Northern Song. But compared with Song pillows, its lines are simpler, its corners sharper and its shape squarer, all signs of the Yuan dynasty. A gourd-shaped hole on each side shows that it's hollow inside.",
      look: "Find the purple spots on the blue, and the gourd-shaped hole in the side.",
      zh: {
        intro: "鈞窯如意形瓷枕，滿施天藍色濃釉，上面浮現紫紅色的彩斑。",
        more: "天藍底釉上的紫紅斑，是由銅紅元素構成的，圖案自然成趣。乾隆皇帝在1776年於枕底刻了御製詩，以為「是枕猶北宋」。但和傳世的如意枕比較，這件線條更簡潔俐落，刻意突出枕面尖端，形狀也更接近方形，比較像元代的作法。兩側各有一個葫蘆形開孔，器內是中空的。",
        look: "找找天藍釉上的紫斑，還有側面的葫蘆形開孔。"
      }
    },
    "ge-stem-bowl": {
      sno: "04001091", record: "故瓷017708N000000000", room: "205", period: "yuan",
      name: "Stem bowl with celadon glaze, Ge ware", nameZh: "哥窯 青瓷高足碗",
      date: "Yuan dynasty, 1279–1368", dateZh: "元，西元1279–1368年",
      intro: "A Ge ware bowl on a tall stem. Its creamy glaze is covered in crackle, dark lines with fine brown ones between, known as \"gold threads and iron lines\".",
      more: "Ge ware is a pale celadon with dense crackle, sometimes called \"broken ware\". It was probably made to imitate Guan ware, perhaps at the Longquan kilns, and its name first appears in writing in the late Yuan, possibly its peak. Tall stem cups and bowls were made in great numbers in the Yuan. Easy to hold, they were used for wine, fruit and buns. A Song-style celadon made in a shape the Mongol rulers favored shows how quickly new habits spread, and stem bowls later became an important shape for Ming imperial porcelain.",
      look: "Look for the two kinds of crackle: the dark \"iron lines\" and the finer brown \"gold threads\".",
      zh: {
        intro: "哥窯高足碗，米色青釉上滿佈開片，黑色線紋間有淺褐細線，就是所謂的「金絲鐵線」。",
        more: "「哥窯」是一種淡色青瓷，開片多而細碎，有「碎器」之稱，一般認為是仿官窯的作品，也可能出自龍泉窯；直到元末才有文獻記錄這個窯名，可能是它的盛行期。高足杯、碗大量出現在元代，足瘦高、便於擎拿，可以盛酒，也可以盛果子、饅頭。這件有宋代傳統釉色的青瓷，竟燒成馬上民族習用的器形，可見外來用器習慣在元代快速風行，後來也成為明代官窯的重要造形。",
        look: "找找兩種開片線：黑色的「鐵線」和較細的褐色「金絲」。"
      }
    },
    "blue-white-flask": {
      sno: "04001095", record: "故瓷012549N000000000", room: "205", period: "ming",
      name: "Flask with figures decoration in underglaze blue", nameZh: "青花人物紋如意耳扁壺",
      date: "Ming dynasty, Yongle reign (1403–1424)", dateZh: "明永樂，西元1403–1424年",
      intro: "A blue-and-white flask painted with five dancers and musicians in foreign dress. Only two flasks like it are known: this one, and one in the Topkapi Palace in Istanbul.",
      more: "Its shape, with a flat round body and two curved ruyi handles, came from the pottery and glass of Central and Western Asia. Plantain leaves decorate the neck, and lotus petals ring the shoulder and base. On each side, figures dance and play music in a landscape of mountains, trees and streams. Their poses closely resemble 14th-century Islamic paintings of people praying for dried-up springs to flow again.",
      look: "Count the figures: three on one side, two on the other. Then find the curved handles that link the neck and shoulder.",
      zh: {
        intro: "青花扁壺上畫著五位身穿異國服飾、奏樂跳舞的人物。這樣的人物紋如意耳扁壺，全世界只知道兩件：一件在本院，一件在土耳其伊斯坦堡的托普卡普宮。",
        more: "如意耳扁壺的器形，受到中西亞陶器和玻璃器的影響：小口、細頸、扁圓腹、平底無足，頸部兩側各有一個弓形耳連接頸和肩。頸上畫蕉葉紋，肩部和近底處各畫一圈仰覆蓮瓣。腹部兩面畫山水，人物在遠山近景間樂舞，姿態和組合與十四世紀伊斯蘭祈求乾涸泉水再度流動的畫作很相近。",
        look: "數數人物：一面三人，另一面兩人。再找找連接頸和肩的弓形耳。"
      }
    },
    "doucai-chicken-cup": {
      sno: "04001036", record: "故瓷005192N000000000", room: "205", period: "ming", highlight: true,
      name: "Chicken cup in doucai painted enamels", nameZh: "鬥彩雞缸杯",
      date: "Ming dynasty, Chenghua reign (1465–1487)", dateZh: "明成化，西元1465–1487年",
      intro: "The famous chicken cup, just 4 centimeters tall. By the late Ming, a pair of these was already worth 100,000 cash.",
      more: "Around the outside are two scenes of a rooster and hen with their three chicks, separated by China roses and orchids. The inside is plain white. On the base, six characters in blue read \"Made in the Chenghua reign of the Great Ming.\" Palace records show it was in the Qing court by the Yongzheng reign, and the Qianlong Emperor had an embroidered box made for it.",
      look: "Find the two chicken families. Each has a rooster, a hen and three chicks.",
      zh: {
        intro: "著名的雞缸杯，高只有4公分。到了晚明，已經有「一雙值錢十萬」的身價。",
        more: "外壁畫了兩組公雞、母雞各帶三隻小雞的場景，中間以月季和蘭花隔開，內面純白沒有紋飾。底有青花「大明成化年製」款。從清宮紀錄看，雍正朝時它已經在宮中，乾隆皇帝還下旨為它配置錦匣。景德鎮成化官窯遺址出土的半成品，讓我們知道鬥彩是先畫青花線條，再填上各種釉上彩，然後再入窯燒成。",
        look: "找找兩組小雞家庭，每一組都有公雞、母雞和三隻小雞。"
      }
    },
    "hundred-deer-zun": {
      sno: "04009158", record: "故瓷012030N000000000", room: "205", period: "ming",
      name: "Vase with \"One hundred deer\" motif in wucai painted enamels", nameZh: "五彩百鹿圖尊",
      date: "Ming dynasty, Wanli reign (1573–1620)", dateZh: "明萬曆，西元1573–1620年",
      intro: "A big jar painted with a herd of deer, 89 of them, running among rocks, trees and clouds. It's called the \"hundred deer\" vase.",
      more: "Porcelain production soared in the Wanli reign, and the court spent huge sums on it. Painted wucai wares like this were the most typical, often with lucky Buddhist and Daoist themes. The Great Chronicle of Jiangxi lists the court's orders in detail. The 19th year of Wanli saw the most designs ordered, including a \"hundred deer\" jar in wucai, which may have looked like this one. The base reads \"Made in the Wanli reign of the Great Ming\" in blue.",
      look: "Try counting the deer you can see. There are 89 in all.",
      zh: {
        intro: "一件大罐上畫滿了在岩石、樹林和雲朵間奔走的鹿群，一共八十九頭，所以叫「百鹿尊」。",
        more: "萬曆時瓷器燒造量大增，朝廷花費甚鉅；以五彩為代表的各式彩繪盛行，題材常見象徵吉祥或仙人的佛、道紋樣。《江西省大志》詳細記載了當時朝廷對瓷器的要求。萬曆十九年是降發樣式與數量最多的一年，該年下令燒製的「五彩百鹿永保乾坤罈」，很可能就是像這件一樣的作品。底部有青花「大明萬曆年製」款。",
        look: "試著數數看得到的鹿，全器一共有八十九頭。"
      }
    },
    "red-glaze-zun": {
      sno: "04001114", room: "205", period: "qing", photo: false,
      name: "Zun vessel with red glaze", nameZh: "紅釉尊",
      date: "Qing dynasty, Kangxi reign (1662–1722)", dateZh: "清康熙，西元1662–1722年",
      intro: "A vase in brilliant \"Lang red\" glaze. Its shape copies the vase that Guanyin holds, so it's also called a Guanyin vase.",
      more: "From 1705 to 1712, Lang Tingji, governor of Jiangxi, managed the imperial kilns at Jingdezhen. Among the porcelains made there was a red glaze imitating one from the Ming Xuande reign, with an especially striking color. Because Lang oversaw it, the glaze became known as \"Lang ware red\". The uneven way the glaze has slipped away from the rim is typical of Lang red.",
      look: "Look at the rim, where the red glaze thins out unevenly and leaves the edge pale.",
      zh: {
        intro: "一件釉色鮮紅的「郎窯紅」瓷瓶。形制像觀音手持的淨瓶，所以又叫觀音尊。",
        more: "康熙四十四年至五十一年（1705–1712），江西巡撫郎廷極奉派管理景德鎮御窯廠的燒造。當時生產的瓷器中，有一種遙仿明代宣德的紅釉器，色澤鮮豔，特別引人注目，因為是郎廷極監造，所以稱為「郎窯紅」。瓶口不規則的脫釉，正是郎窯紅的典型風格。",
        look: "看看瓶口：紅釉不規則地褪去，露出淺色的口緣。"
      }
    },
    "falangcai-teapot": {
      sno: "04001038", record: "故瓷017753N000000000", room: "205", period: "qing",
      name: "Pot with blue landscape in falangcai polychrome enamels", nameZh: "琺瑯彩青山水壺",
      date: "Qing dynasty, Yongzheng reign (1723–1735)", dateZh: "清雍正，西元1723–1735年",
      intro: "A small teapot made for the Yongzheng Emperor, 9 centimeters tall, with landscapes painted in shades of blue and two lines of poetry.",
      more: "One side reads \"The trees hug the mountains to the south\", with a red seal, \"High Mountains\". The other reads \"Mist engulfs the sandbar far to the north\", sealed \"Long Rivers\". Flowers of the four seasons fill the background and the lid, and the porcelain is so thin that light shines through it. The Yongzheng Emperor liked simple, elegant teapots, and this squat shape copies Yixing teapots. A palace inventory of 1835 lists it by name.",
      look: "Find the two red seals, \"High Mountains\" and \"Long Rivers\", one on each side.",
      zh: {
        intro: "雍正皇帝的小茶壺，高9.2公分，兩面畫著藍色山水，還題了詩句。",
        more: "一面墨書「樹接南山近」，下有紅色「山高」印；另一面題「煙含北渚遙」，下有「水長」印。空白處和壺蓋畫滿四季花卉，胎薄透光，質地細膩。雍正喜愛簡約大方的茶壺，這種壺身較短、壺口略大的造型，是仿宜興壺而作。道光十五年（1835）的陳設檔案裡，就記有這把茶壺。",
        look: "找找兩面的紅色印記：「山高」和「水長」。"
      }
    },
    "qianlong-vase": {
      sno: "04009155", record: "故瓷017646N000000000", room: "205", period: "qing", highlight: true,
      name: "Revolving vase decorated with swimming goldfish and gold tracing on cobalt blue glaze", nameZh: "霽青描金游魚轉心瓶",
      date: "Qing dynasty, Qianlong reign (1736–1795)", dateZh: "清乾隆，西元1736–1795年",
      intro: "A vase inside a vase. Turn the neck and the inner layer spins, so the goldfish painted inside seem to swim past the openings.",
      more: "The inner layer is pale lake-green like water, painted with water plants, fallen blossoms and goldfish. The outer layer is cobalt blue traced with gold, with four openwork panels. It works like a trotting-horse lantern, whose pictures turn as it spins, which is why vases like this are called revolving vases. The base reads \"Made in the Qianlong reign of the Great Qing.\"",
      look: "Look through the four openwork windows on the belly to spot the goldfish.",
      zh: {
        intro: "瓶中有瓶。轉動瓶頸，內瓶就跟著旋轉，畫在裡面的金魚好像在窗口後游來游去。",
        more: "內瓶施淺青湖綠色釉，像一池湖水，上面用粉彩畫水草、落花和金魚。外瓶是霽青色描金，腹部有四個鏤空開光。轉動時就像走馬燈一樣，所以叫「轉心瓶」。底部有青花「大清乾隆年製」款。",
        look: "從腹部四個鏤空的窗口往裡看，找找金魚。"
      }
    },
    "eight-trigram-vase": {
      sno: "04001121", room: "205", period: "qing", photo: false,
      name: "Vase with rotating interior and openwork of eight trigram and ruyi motifs in yellow ground and fencai polychrome enamels", nameZh: "粉彩黃地八卦如意轉心套瓶",
      date: "Qing dynasty, Qianlong reign (1736–1795)", dateZh: "清乾隆，西元1736–1795年",
      intro: "Another revolving vase from the Qianlong reign, and an even more complex one: a vase within a vase, with a turning center and a body that is really cut in two.",
      more: "The outer vase comes apart into a neck and a body. The inner vase is joined to the neck at the top and fits into the bottom of the outer vase with a tenon joint, so turning the neck spins the inner vase. Around the middle, the two halves of the body meet along an interlocking ruyi-cloud edge. Looking separate yet joined, they stand for heaven and earth in harmony, and a country at peace with its people prosperous.",
      look: "Find the wavy ruyi-cloud line where the two halves of the body lock together, and the eight trigrams in the openwork.",
      zh: {
        intro: "又一件乾隆朝的轉心瓶，結構更複雜：同時匯集了套瓶、轉心和交泰的技法。",
        more: "外瓶可以拆成頸和身兩部分；內瓶上部和頸相連，下底用卡榫和外瓶內底套接，所以轉動瓶頸就能轉動內瓶。瓶身中央上下交錯、真正切開的如意雲紋，看似分離又彼此相連，正是交泰瓶的精神，有上下交通、國泰民安的含義。",
        look: "找找瓶身中央上下咬合的如意雲紋，還有鏤空的八卦紋。"
      }
    },
    "elephant-zun": {
      sno: "04009187", record: "故瓷010711N000000000", room: "205", period: "qing",
      name: "Zun in the form of an elephant of peace", nameZh: "太平有象瓷尊",
      date: "Qing dynasty, 18th century", dateZh: "清，十八世紀",
      intro: "A porcelain elephant carrying a vase on its back. In Chinese, \"vase\" sounds like \"peace\" and \"elephant\" like \"sign\", so together they read \"signs of peace\".",
      more: "The elephant stands with its head turned back, its trunk curled up between its tusks, and its gray-brown skin has darker touches for hair. The saddle cloth is painted with ruyi, chimes, bats, waves and jewels, all wishes for long life, good fortune and plenty. The vase on top has a lake-green glaze with red and green lotus scrolls outlined in gold. There's no reign mark, but its shape and style point to the Qianlong reign. Such elephants were displayed in pairs, and cloisonné versions exist too.",
      look: "Look at its face: head turned, eyes half closed, trunk curled up.",
      zh: {
        intro: "一頭背上馱著寶瓶的瓷象。大象和寶瓶合起來，就是吉祥話「太平有象」。",
        more: "大象四足直立，側首回視，雙眼微睜，鼻子上捲，兩側有長牙；象身施灰棕色釉，局部加飾深色毫毛。背上披著元寶形鞍，垂下厚長錦緞，彩繪如意、吉磬、蝙蝠、波濤等紋樣，有壽山福海、吉慶有餘的寓意。上面的瓷尊以湖綠釉為地，彩繪紅綠番蓮紋，邊戟塗金。它沒有款識，但器形和紋飾顯示可能產製於乾隆朝。這類陳設都是成對擺放，也有銅胎掐絲琺瑯的製品。",
        look: "看看牠的臉：側首回視，雙眼微睜，鼻子向上捲起。"
      }
    },
    "red-gold-jar": {
      sno: "04001119", record: "故瓷008208N000000000", room: "205", period: "qing",
      name: "Lidded jar with happiness-character pattern in gold on a red ground", nameZh: "紅地描金萬福紋蓋罐",
      date: "Qing dynasty, Jiaqing reign (1796–1820)", dateZh: "清嘉慶，西元1796–1820年",
      intro: "A lidded jar, probably for tea leaves, covered from top to bottom in gold on a red ground.",
      more: "Look closely and the pattern spells out a wish. Lotus flowers linked by scrolling stems carry the wan symbol for \"ten thousand\" and, at their centers, the character fu, \"blessings\": ten thousand blessings. And lotus, lian, sounds like \"continuous\", so the scrolls wish for those blessings year after year. A very lucky tea caddy indeed.",
      look: "Find the character fu, \"blessings\", in the center of a lotus flower.",
      zh: {
        intro: "一件可能用來裝茶葉的蓋罐，紅色的地子上由上到下都描滿了金彩，富麗堂皇。",
        more: "蓋身紋飾藏著「萬福連連」的祝福：規整的蕃蓮花以卷草枝葉相連，「萬」字符號和蓮花中心的「福」字代表「萬福」；「蓮」諧音「連」，纏枝蓮又寓意連綿不斷。真是一件吉祥滿貫的茶葉罐！",
        look: "在蓮花中心找找「福」字。"
      }
    },
    "fish-dragon-vase": {
      sno: "04001118", record: "故瓷017960N000000000", room: "205", period: "qing",
      name: "Flower-shaped vase with fish and dragon on a green ground", nameZh: "綠地魚龍圖花式瓶",
      date: "Qing dynasty, Guangxu reign (1875–1908)", dateZh: "清光緒，西元1875–1908年",
      intro: "A big, bright vase shaped like an eight-petaled flower, 51.6 centimeters tall, in a yellow-green glaze that looks almost modern.",
      more: "Animal-mask handles with rings hang from its shoulders. On both sides, in caltrop-flower panels, a five-clawed dragon roams the clouds while a carp leaps from the waves below. It's the lucky image of the carp leaping the Dragon Gate: someone who rises above everyone else.",
      look: "Find the carp jumping out of the waves, and the dragon in the clouds above it.",
      zh: {
        intro: "一件鮮豔的大瓶，高51.6公分，做成八瓣花形，滿佈黃綠色釉，看起來很有現代感。",
        more: "器身兩側貼塑獸耳銜環，腹部前後有菱花式開光，框欄裡浮雕魚龍圖：五爪龍遨遊彩雲間，鯉魚從波濤中躍出，帶有「魚躍龍門、出人頭地」的吉祥意義。",
        look: "找找從浪中躍起的鯉魚，還有在雲間的龍。"
      }
    }
  };

  const api = { PERIODS, PIECES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.PieceData = root.PieceData || {}).ceramics = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
