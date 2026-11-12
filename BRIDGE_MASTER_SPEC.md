# Bridge Master --- Game Design & Technical Implementation Specification

> **Loyiha:** Junior IT Academy --- Mathematics GameLab\
> **O'yin:** Bridge Master\
> **Hujjat turi:** Product Requirements + Game Design Document +
> Technical Specification\
> **Versiya:** 1.0\
> **Holat:** Codex bilan MVP ishlab chiqishni boshlash uchun\
> **Target:** React / JSX, browser, desktop va mobile\
> **Asosiy til:** Uzbek (Latin); keyinchalik LMS localization orqali
> boshqa tillar

------------------------------------------------------------------------

## 0. Codex uchun qisqa loyiha topshirig'i

Junior IT Academy matematika kursi uchun **Bridge Master** nomli 2D/2.5D
ko'prik qurish puzzle o'yinini ishlab chiq.

O'yinchi ikki qirg'oq orasida ko'prik quradi. U mavjud anchor/node
nuqtalari orasiga material segmentlarini chizadi, material byudjetini
nazorat qiladi va `TEST BRIDGE` tugmasi orqali avtomobilni ko'prikdan
o'tkazib ko'radi. Ko'prikning konstruksiyasi yetarli bo'lsa, avtomobil
finishga yetadi va level bajariladi. Aks holda konstruksiya zaif joyidan
buziladi yoki level muvaffaqiyatsiz tugaydi. O'yinchi qayta qurib
ko'rishi mumkin.

**MVP uchun asosiy texnik qaror:** birinchi versiyani React + SVG
asosida qur. Ko'prik qurish, node/edge modeli, material hisobi va
deterministik konstruksiya tekshiruvini alohida game-logic modullarida
yoz. Haqiqiy muhandislik darajasidagi FEM/physics simulyator yoki og'ir
3D engine qurishga urinma. Vizual egilish, yuklama va sinish
animatsiyalari soddalashtirilgan, ammo takrorlanuvchi va adolatli
bo'lsin.

Codex ishni quyidagi tartibda bajarsin: 1. Repository va mavjud stackni
tekshir; mavjud arxitekturani buzma. 2. Bridge Master uchun mustaqil,
ishga tushadigan MVP yarat. 3. Birinchi navbatda gameplay logic va
testlarni yoz. 4. Keyin SVG rendering, interaction, HUD va
animatsiyalarni qo'sh. 5. Oxirida responsive, accessibility va LMS
integration adapterlarini tekshir. 6. Har bosqichda ishlaydigan buildni
saqla; katta refactorlarni oldindan so'ramasdan qilma.

------------------------------------------------------------------------

## 1. Mahsulot konteksti

### 1.1. Mahsulot

Bridge Master --- Junior IT Academy GameLab katalogidagi matematika
bilan bog'langan casual construction puzzle. U darsdagi odatiy test yoki
misol o'rnini bosmaydi. Maqsad --- o'quvchini qurish, sinash, xatodan
o'rganish va yaxshiroq yechim topishga undash.

### 1.2. Auditoriya

-   1--11-sinf o'quvchilari.
-   Asosiy UX: 7--17 yosh oralig'idagi foydalanuvchilar uchun sodda va
    tushunarli.
-   Desktop va touchscreen qurilmalari.
-   O'yinchi avval ko'prik qurish o'yinini o'ynamagan bo'lishi mumkin.

### 1.3. Mahsulot maqsadlari

1.  O'quvchi ko'prikni o'zi qurib, natijasini sinab ko'ra olishi.
2.  Geometriya, uzunlik, burchak, shakl, simmetriya va resursni
    rejalashtirishni intuitiv mashq qilish.
3.  Levelni qayta urinish orqali muammoni tahlil qilish va yechimni
    yaxshilash.
4.  2--5 daqiqalik qisqa o'yin sessiyalarini ta'minlash.
5.  LMSga yakuniy natija va analytics eventlarini yuborishga tayyor
    bo'lish.

### 1.4. MVP muvaffaqiyat mezonlari

-   Yangi o'yinchi tutorial yordamida 60 soniya ichida birinchi
    segmentni qura oladi.
-   Birinchi level 2--3 daqiqada bajarilishi mumkin.
-   Node tanlash, segment chizish, o'chirish, test qilish va reset
    qilish ishlaydi.
-   Material byudjeti aniq va harakatga darhol javob beradi.
-   Bir xil bridge graph bir xil test natijasini beradi.
-   Levelni desktop mouse va mobile touch orqali to'liq o'ynash mumkin.
-   O'yin xatosiz qayta boshlanadi; testdan keyin qurilish rejimiga
    qaytish mumkin.
-   O'yin LMS bo'lmasa ham standalone demo sifatida ishlaydi.

### 1.5. MVP doirasiga kirmaydi

-   Haqiqiy muhandislik/FEM tahlili.
-   Multiplayer yoki real-time social gameplay.
-   User-generated level editor.
-   3D erkin kamera.
-   Murakkab material deformatsiyasi.
-   Real pul, xarid yoki reklama.
-   LMS reward miqdorini client ichida mustaqil belgilash.
-   11 sinf uchun alohida 11 xil o'yin nusxasi.

------------------------------------------------------------------------

## 2. O'yin konsepsiyasi va gameplay

### 2.1. Core fantasy

"O'zim ko'prik quraman, mashinani o'tkazaman va o'z konstruktsiyam
ishlaganini ko'raman."

### 2.2. Core gameplay loop

1.  **Observe:** leveldagi ikki qirg'oq, tayanch nuqtalari, masofa va
    material byudjetini ko'rish.
2.  **Plan:** qaysi node'larni ulash va qanday shakl hosil qilishni
    o'ylash.
3.  **Build:** node'lar orasiga segmentlar chizish.
4.  **Validate:** material sarfi va konstruksiya qoidalarini tekshirish.
5.  **Test:** avtomobilni ko'prikdan o'tkazish.
6.  **Feedback:** ko'prik ishlashi yoki qayerda buzilganini ko'rish.
7.  **Improve:** segment qo'shish/o'chirish va qayta sinash.
8.  **Complete:** finish, score, stars va keyingi level.

### 2.3. Game state machine

Quyidagi holatlar bo'lishi kerak:

-   `loading` --- level va konfiguratsiya yuklanmoqda.
-   `intro` --- level maqsadi qisqa ko'rsatiladi.
-   `building` --- o'yinchi ko'prik qurmoqda.
-   `testing` --- qurilma sinovdan o'tmoqda; qurilish inputi bloklanadi.
-   `success` --- avtomobil finishga yetdi.
-   `failed` --- sinov muvaffaqiyatsiz yakunlandi.
-   `paused` --- o'yin vaqtincha to'xtatilgan.

Ruxsat etilgan asosiy o'tishlar:

-   `loading -> intro -> building`
-   `building -> testing`
-   `testing -> success | failed`
-   `failed -> building` (qurilishni davom ettirish)
-   `success -> next level | level select`
-   `building/testing -> paused -> previous state`

`testing` paytida node yoki edge o'zgartirilmasin. `success` holatida
qurilish lock qilinadi; `Replay` yoki keyingi level tanlanadi.

### 2.4. O'yin oynasi

**Top HUD** - Bridge Master nomi/logo. - Level raqami va nomi. -
Material budget: `used / available`. - Pause va sound toggle.

**Gameplay canvas** - Qirg'oq/terrain. - Daryo yoki jarlik. - Anchor
nuqtalari. - Qurilgan bridge segments. - Avtomobil va finish belgisi. -
Build preview va selection feedback.

**Bottom toolbar** - Material selector: MVPda bitta materialdan boshlash
mumkin; keyingi versiyada wood/steel. - Undo. - Delete selected. - Reset
bridge. - Test Bridge asosiy CTA.

**Result overlay** - Success/Failed. - Score va stars. - Material
sarfi. - Retry / Next Level / Level Select.

------------------------------------------------------------------------

## 3. Ko'prik qurish qoidalari

### 3.1. Graph modeli

Ko'prik graph sifatida ifodalanadi:

-   **Node:** koordinatali ulanish nuqtasi.
-   **Edge:** ikki node orasidagi qurilish segmenti.
-   **Anchor:** terrain bilan mustahkam biriktirilgan node.
-   **Road edge:** avtomobil yuradigan deck segmenti.
-   **Support edge:** konstruksiyani ushlab turuvchi segment.

MVPda node koordinatalari level konfiguratsiyasidan keladi. O'yinchi
faqat level ruxsat bergan node'larni ulaydi. Free placement keyingi
iteratsiyada ko'rib chiqiladi.

### 3.2. Node turlari

  -----------------------------------------------------------------------
  Type                    Vazifasi                O'yinchiga ko'rinishi
  ----------------------- ----------------------- -----------------------
  `anchor`                Qirg'oq/tayanchga       Katta, ajralib turuvchi
                          mahkamlangan nuqta      pin

  `joint`                 Konstruksiya            Oddiy doira
                          segmentlari             
                          tutashadigan nuqta      

  `road`                  Avtomobil yo'li         Yo'l ustidagi node
                          segmenti bilan bog'liq  
                          nuqta                   

  `optional`              Levelda qo'shimcha      Yengil rangli pin
                          qurish nuqtasi          
  -----------------------------------------------------------------------

### 3.3. Edge turlari

MVP: - `road` --- avtomobil yuradigan deck segmenti. - `support` ---
konstruktiv tayanch segmenti.

Keyingi versiya: - `wood` - `steel` - `rope` - `reinforced`

Har bir edge quyidagi ma'lumotlarni saqlaydi:

-   `id`
-   `fromNodeId`
-   `toNodeId`
-   `type`
-   `cost`
-   `length`
-   `isPlayerBuilt`
-   `visualState`

### 3.4. Qurilish qoidalari

1.  Faqat mavjud node'lar orasida segment yaratish mumkin.
2.  Bir node o'ziga ulanmaydi.
3.  Bir xil ikki node orasida takroriy edge yaratilmaydi.
4.  Edge uzunligi nol bo'la olmaydi.
5.  Material byudjeti oshib ketadigan edge qo'shilmaydi.
6.  `road` segmentlar avtomobil yo'lini uzluksiz hosil qilishi kerak.
7.  `support` segmentlar road/deck node'larini anchorlarga bog'laydigan
    konstruktiv yo'l hosil qilishi kerak.
8.  Segment o'chirilganda byudjet qayta hisoblanadi.
9.  Undo oxirgi qurilish/o'chirish amalini qaytaradi.
10. Reset faqat player-built segmentlarni o'chiradi; levelning fixed
    node va fixed edge'larini saqlaydi.

### 3.5. Segment chizish UX

Desktop: - Birinchi node ustiga click. - Ikkinchi node ustiga click. -
Preview chizig'i hover davomida ko'rsatiladi. - `Esc` --- tanlovni bekor
qilish.

Mobile: - Birinchi node ustiga tap. - Ikkinchi node ustiga tap. - Touch
target kamida 40--44 CSS px bo'lishi tavsiya etiladi. - Drag interaction
keyingi versiyada qo'shilishi mumkin.

Feedback: - Valid target: yashil/ijobiy preview. - Invalid target: qizil
yoki neytral warning preview. - Budget yetmasa: segment qo'shilmaydi,
qisqa tushuntirish chiqadi. - Rangga qo'shimcha ravishda ikonka yoki
matn ishlatilsin.

------------------------------------------------------------------------

## 4. Konstruksiya tekshiruvi va "physics"

### 4.1. Muhim texnik qaror

MVPda haqiqiy muhandislik fizikasi shart emas. Biroq natija tasodifiy
bo'lmasligi va o'yinchi tushuna oladigan qoidalarga asoslanishi shart.

Tavsiya etiladigan MVP: - Graph connectivity validation. - Road
continuity validation. - Anchor connectivity validation. -
Triangle/bracing bonus yoki support score. - Deterministik load test. -
Vizual bend/break animatsiyasi.

Bu model o'yin mexanikasini beradi, lekin haqiqiy ko'prikning real
muhandislik xavfsizligini hisoblamaydi. UI yoki hujjatlarda uni
engineering-grade simulator deb taqdim etma.

### 4.2. Testdan oldingi validation

Test tugmasi bosilganda:

1.  Road path start va finish orasida uzluksizmi?
2.  Road path kamida bitta anchor yoki levelning fixed road
    endpointlariga ulanganmi?
3.  Har bir road node'dan anchor'ga support path mavjudmi?
4.  Material budget buzilmaganmi?
5.  Segmentlar takrorlanmaganmi yoki invalid emasmi?

Validation xatosi bo'lsa, sinov boshlanmaydi va foydalanuvchiga aniq
sabab ko'rsatiladi.

### 4.3. Deterministik stability score

MVP uchun har bir road node'ning anchorlarga support graph orqali yetib
borishi tekshirilsin.

Qo'shimcha konstruktiv mustahkamlik: - Uchburchak hosil qiluvchi support
edge'lar bonus beradi. - Uzun, tayanchsiz span'lar riskni oshiradi. -
Anchor'ga qisqa va bir nechta mustaqil yo'l bilan bog'langan road
node'lar barqarorroq hisoblanadi. - Bitta kritik support edge olib
tashlanganda ko'prikning katta qismi uzilib qolsa, vulnerability yuqori
bo'ladi.

Aniq formula alohida modulda saqlansin va level config orqali threshold
sozlansin. Formula hardcode UI ichida bo'lmasin.

**Tavsiya etilgan MVP scoring modeli:** - `connectivityScore`: road
node'lar anchor'ga yetib borish ulushi. - `triangulationScore`: yopiq
uchburchaklar soni/nisbati. - `unsupportedSpanPenalty`: support'siz yoki
uzun oralig'lar uchun penalty. - `budgetPenalty`: byudjetdan oshish ---
testga ruxsat berilmaydi, shuning uchun odatda 0. -
`finalStabilityScore`: konfiguratsiya qilingan weighted score.

Level `stabilityThreshold` bilan yakuniy natijani belgilaydi. Score
chegaralari playtest bilan sozlanadi. Formula uchun unit testlar
bo'lsin.

### 4.4. Test simulyatsiyasi

1.  Avtomobil startga joylashadi.
2.  Qisqa countdown.
3.  Avtomobil road path bo'ylab harakatlanadi.
4.  Konstruksiya `finalStabilityScore` va level threshold bo'yicha
    sinovdan o'tadi.
5.  Fail bo'lsa, oldindan aniqlangan weak point ko'rsatiladi.
6.  Success bo'lsa, avtomobil finishga yetadi.
7.  Harakat tezligi va sinish vaqti deterministik bo'lsin.

### 4.5. Sinish animatsiyasi

-   Zaif edge qizil/orange rangda highlight qilinadi.
-   Segment kichik animatsiya bilan uziladi yoki pastga tushadi.
-   Avtomobil xavfsiz tarzda to'xtatiladi; qo'rqinchli crash yoki keskin
    effektlar bo'lmasin.
-   Fail overlay animatsiya tugagandan keyin chiqadi.
-   Animatsiya o'yin natijasini o'zgartirmaydi; natija avval game logic
    tomonidan aniqlangan bo'ladi.

### 4.6. Keyingi iteratsiya uchun physics upgrade

Agar MVP testlari yaxshi chiqsa: - Matter.js yoki boshqa mos physics
library bilan prototip. - Node'lar va constraint'lar asosida yumshoq
deformatsiya. - Vehicle load va bridge stress ko'rinishi. - Physics
engine natijasini level design bilan deterministiklashtirish. - Barcha
qurilmalarda performance test.

Bunday upgrade MVP scope'iga kiritilmaydi.

------------------------------------------------------------------------

## 5. Material va byudjet tizimi

### 5.1. MVP

Birinchi prototipda bitta material turi ishlatish tavsiya qilinadi. Bu
UX va balansni soddalashtiradi. Material "Build Points" yoki "Material
Units" sifatida ko'rsatilishi mumkin.

### 5.2. Byudjet

-   Har bir level `budget` qiymatiga ega.
-   Har bir edge cost'i uning uzunligi yoki level-defined cost asosida
    hisoblanadi.
-   UI `used / budget` ko'rsatadi.
-   Byudjet tugasa, yangi segment qo'shilmaydi.
-   Segment o'chirilganda sarf kamayadi.

Formula: `edgeCost = ceil(edgeLength * costPerUnit)`

Level-specific cost multiplier bo'lishi mumkin. Har bir cost qiymati
configdan olinadi.

### 5.3. Kelajakdagi materiallar

  Material     Vizual             Xususiyat
  ------------ ------------------ -------------------------------
  Wood         Jigarrang          Arzon, boshlang'ich
  Steel        Kulrang/metall     Qimmatroq, mustahkamroq
  Rope         Arqon ko'rinishi   Taranglik/ustki support uchun
  Reinforced   To'q rang          Cheklangan, maxsus level

Materiallar fizik xususiyatlari MVPda faqat game balance parametrlari
sifatida ishlatiladi.

------------------------------------------------------------------------

## 6. Level design

### 6.1. Level progression

-   Level 1: ikki anchor orasida oddiy yo'l; segment ulashni o'rgatadi.
-   Level 2: qo'shimcha node va bitta support segment.
-   Level 3: kattaroq span; uchburchak bracing ko'rsatadi.
-   Level 4: cheklangan byudjet; resursni rejalashtirish.
-   Level 5: balandligi turlicha ikki qirg'oq; murakkabroq geometriya.

MVPda 5 ta level yetarli. Har bir level bitta yangi fikr yoki mexanikani
o'rgatsin.

### 6.2. Level 1 --- tutorial spec

**Nomi:** First Bridge\
**Maqsad:** ikki qirg'oq orasida avtomobil uchun uzluksiz yo'l
yaratish.\
**Tavsiya etilgan ko'rinish:** yon tomondan 2D ko'rinish, pastda daryo,
ikki qirg'oq, ikki anchor va deck uchun tayyor node'lar.

Level 1: - 2 ta asosiy anchor. - 2--4 ta build node. - 1 ta road path
yaratish. - Minimal support talab. - Keng byudjet. - 1 ta avtomobil. -
Vaqt limiti yo'q.

Tutorial bosqichlari: 1. "Ikki qirg'oq orasida yo'l qur." 2. Birinchi
node highlight qilinadi. 3. Ikkinchi node highlight qilinadi. 4. Segment
preview ko'rsatiladi. 5. "Test Bridge" tugmasi highlight qilinadi. 6.
Avtomobil o'tadi va success feedback chiqadi.

Level 1da fail ehtimolini minimal qilish kerak. Tutorial o'quvchiga
o'yin qoidalarini o'rgatadi, jazolamaydi.

### 6.3. Level 2--5

  Level   Yangi mexanika                                  Qiyinchilik
  ------- ----------------------------------------------- -------------
  2       Support segment qo'shish                        Oson
  3       Uzunroq span va triangulation                   O'rta
  4       Material budget cheklovi                        O'rta
  5       Notekis balandlik va murakkab node joylashuvi   O'rta+

### 6.4. Level config namunasi

``` json
{
  "id": "bridge-01",
  "title": "First Bridge",
  "difficulty": 1,
  "budget": 120,
  "costPerUnit": 1,
  "stabilityThreshold": 0.55,
  "startNodeId": "n-left-road",
  "finishNodeId": "n-right-road",
  "nodes": [
    { "id": "n-left-anchor", "x": 120, "y": 300, "type": "anchor" },
    { "id": "n-left-road", "x": 180, "y": 300, "type": "road" },
    { "id": "n-right-road", "x": 620, "y": 300, "type": "road" },
    { "id": "n-right-anchor", "x": 680, "y": 300, "type": "anchor" }
  ],
  "fixedEdges": [],
  "buildRules": {
    "allowedEdgeTypes": ["road", "support"],
    "maxEdgeLength": 260,
    "allowDuplicateEdges": false
  },
  "vehicle": {
    "speed": 140,
    "width": 34,
    "height": 20
  }
}
```

Bu faqat schema namunasi. Yakuniy koordinatalar va thresholdlar renderer
o'lchami va gameplay playtestidan keyin sozlanadi.

------------------------------------------------------------------------

## 7. Matematika bilan bog'liqlik

Bridge Master matematikani o'yinning ustiga majburan qo'shmaydi.
O'yinchi qurish jarayonida quyidagi tushunchalardan foydalanadi:

  -----------------------------------------------------------------------
  Sinf guruhi                         Tabiiy matematik bog'lanish
  ----------------------------------- -----------------------------------
  1--2                                Uzun/qisqa, yaqin/uzoq, shakllarni
                                      tanish, sanash

  3--4                                Kesma, uzunlik, burchak,
                                      uchburchak, oddiy o'lchash

  5--6                                Perimetrga yaqin intuitiv
                                      tushuncha, ko'pburchaklar,
                                      simmetriya, birliklar

  7--8                                Nisbat, masshtab, koordinata va
                                      geometrik konstruksiya

  9--11                               Geometrik optimallashtirish,
                                      cheklovlar, samarali yechim va
                                      resurs taqsimoti
  -----------------------------------------------------------------------

### Pedagogik qoida

-   Gameplay matematik testga aylanmasin.
-   Level maqsadi vizual va sodda bo'lsin.
-   Kichik sinflarda timer ishlatilmasin.
-   O'quvchi xato qilganda tushuntiruvchi feedback olsin.
-   Katta sinflarda optional challenge qo'shish mumkin: "materialni 20%
    tejab ko'prik qur".

------------------------------------------------------------------------

## 8. UX/UI va visual direction

### 8.1. Art direction

-   2D gameplay, 2.5D taassurot.
-   Low-poly/isometric muhit.
-   Rangli, yumshoq va bolalar uchun yoqimli ko'rinish.
-   Daryo yoki jarlik, ikki qirg'oq, uzoqdagi tog'lar, bulutlar.
-   Ko'prik segmentlari aniq ko'rinadi.
-   Orqa fon gameplay kontrastiga xalaqit bermaydi.
-   O'yin oynasi Junior IT Academy UI tizimiga mos, lekin mustaqil game
    feel beradi.

### 8.2. Tavsiya etilgan ranglar

Bu ranglar boshlang'ich taklif; mavjud Junior IT Academy design system
bilan tekshiriladi.

-   Sky/background: och ko'k yoki yumshoq gradient.
-   Terrain: yashil/earth tone.
-   Water: ko'k/cyan.
-   Road: to'q kulrang.
-   Wood: jigarrang.
-   Anchor: ko'k yoki sariq highlight.
-   Valid preview: yashil.
-   Invalid preview: qizil yoki orange.
-   HUD: yuqori kontrastli, o'qilishi oson.

Rang ma'nosi ikonka yoki matn bilan ham ifodalansin.

### 8.3. Animatsiyalar

-   Node hover/tap: scale 1.0 → 1.12.
-   Edge draw: qisqa stroke animation.
-   Segment qo'shish: yengil pop-in.
-   Test start: 3-2-1 countdown.
-   Vehicle: road path bo'ylab silliq harakat.
-   Bridge bend: kichik deformatsiya yoki yengil translate.
-   Break: weak edge highlight + drop.
-   Success: confetti yoki yulduzlar, 1--2 soniyadan oshmasin.
-   Reduce motion preference bo'lsa animatsiyalar qisqartirilsin.

### 8.4. Responsive layout

Desktop: - O'yin maydoni maksimal kenglikda, HUD yuqorida, toolbar
pastda. - Mouse hover va keyboard shortcuts.

Tablet: - Canvas to'liq kenglikka moslashadi. - Toolbar tugmalari
kattaroq.

Mobile: - Portrait va landscape tekshiriladi. - Node'lar
kattalashtiriladi. - Bottom toolbar safe-area hisobga oladi. -
Scroll/zoom gesture o'yin maydonini tasodifan buzmasin. - Bir qo'l bilan
asosiy interaction bajarilishi maqsad qilinadi.

### 8.5. Accessibility

-   Tugmalarda accessible label.
-   Keyboard orqali node tanlash va segment yaratish imkoniyati imkon
    qadar qo'llansin.
-   Focus holati ko'rinadigan bo'lsin.
-   Rang yagona signal bo'lmasin.
-   Sound off default yoki foydalanuvchi sozlamasiga bog'liq.
-   `prefers-reduced-motion` qo'llab-quvvatlansin.
-   Matnlar qisqa va yoshga mos bo'lsin.

------------------------------------------------------------------------

## 9. Texnik arxitektura

### 9.1. Asosiy texnologiya

MVP tavsiyasi: - React / JSX. - SVG rendering. - CSS
transitions/keyframes. - Pure JavaScript game logic. - JSON level
config. - Vitest/Jest mavjud bo'lsa unit tests. - TypeScript bo'lsa
repository standartiga amal qilish; mavjud loyiha JS bo'lsa majburan
TSga ko'chirmaslik.

**Nega SVG?** - Node va edge'lar vektor obyektlar sifatida aniq. -
Click/touch hit-area boshqarish oson. - Responsive scaling qulay. - 2D
bridge editor uchun Canvas'dan ko'ra DOM interaction sodda. -
Keyinchalik 2.5D backgroundni SVG/CSS layer bilan boyitish mumkin.

### 9.2. Taklif etiladigan folder structure

Repositoryga qarab pathlarni moslashtir. Mavjud conventions bo'lsa,
ularni saqla.

``` text
src/
  games/
    bridge-master/
      index.jsx
      BridgeMaster.jsx
      components/
        GameHeader.jsx
        GameToolbar.jsx
        BridgeScene.jsx
        NodeMarker.jsx
        BridgeSegment.jsx
        Vehicle.jsx
        BudgetMeter.jsx
        TutorialOverlay.jsx
        ResultModal.jsx
        PauseModal.jsx
      hooks/
        useBridgeGame.js
        useGameInput.js
      engine/
        graph.js
        buildRules.js
        budget.js
        stability.js
        simulation.js
        scoring.js
        history.js
      levels/
        index.js
        bridge-01.json
        bridge-02.json
        bridge-03.json
        bridge-04.json
        bridge-05.json
      styles/
        bridge-master.css
      utils/
        geometry.js
        ids.js
      __tests__/
        graph.test.js
        buildRules.test.js
        budget.test.js
        stability.test.js
        scoring.test.js
```

### 9.3. Responsibility separation

**BridgeMaster.jsx** - GameShell va o'yin state'ini birlashtiradi. -
Level tanlash/yuklash. - Callback va LMS adapterga natija uzatish.

**BridgeScene.jsx** - Faqat vizual render. - Node, edge, terrain, water,
vehicle. - Game logicni o'z ichida hisoblamaydi.

**engine/** - Graph validation. - Build rules. - Budget. - Stability. -
Simulation. - Score. - Undo/redo history.

**levels/** - Level ma'lumotlari. - Koordinatalar, budget, threshold,
fixed edges, tutorial steps.

### 9.4. Asosiy data types

``` ts
type NodeType = "anchor" | "joint" | "road" | "optional";
type EdgeType = "road" | "support";

type BridgeNode = {
  id: string;
  x: number;
  y: number;
  type: NodeType;
};

type BridgeEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: EdgeType;
  cost: number;
  length: number;
  isPlayerBuilt: boolean;
};

type BridgeLevel = {
  id: string;
  title: string;
  difficulty: number;
  budget: number;
  costPerUnit: number;
  stabilityThreshold: number;
  startNodeId: string;
  finishNodeId: string;
  nodes: BridgeNode[];
  fixedEdges: BridgeEdge[];
  buildRules: {
    allowedEdgeTypes: EdgeType[];
    maxEdgeLength: number;
    allowDuplicateEdges: boolean;
  };
};

type GameResult = {
  gameId: "bridge-master";
  levelId: string;
  status: "completed" | "failed";
  score: number;
  stars: 0 | 1 | 2 | 3;
  materialUsed: number;
  durationSeconds: number;
  attempts: number;
  stabilityScore: number;
};
```

Types mavjud project tiliga moslashtiriladi; bu schema contract uchun.

### 9.5. Engine function contractlari

``` js
// graph.js
getNodeById(nodes, nodeId)
getEdgeKey(fromNodeId, toNodeId)
getConnectedComponents(nodes, edges)
findPath(edges, startNodeId, finishNodeId)

// buildRules.js
canConnectNodes(level, currentEdges, fromNodeId, toNodeId, edgeType)
createEdge(level, fromNode, toNode, edgeType)
removeEdge(edges, edgeId)

// budget.js
calculateEdgeLength(fromNode, toNode)
calculateEdgeCost(level, edge)
calculateTotalCost(edges)
canAffordEdge(level, edges, candidateEdge)

// stability.js
validateRoadContinuity(level, edges)
validateAnchorConnectivity(level, edges)
calculateTriangulationScore(nodes, edges)
calculateUnsupportedSpanPenalty(level, edges)
calculateStability(level, edges)

// simulation.js
createTestRun(level, edges)
getSimulationOutcome(level, edges)
getVehiclePath(level, edges)

// scoring.js
calculateStars(level, result)
calculateScore(level, result)
```

Har bir engine function imkon qadar pure function bo'lsin. React state
yoki DOMga bog'lanmasin.

------------------------------------------------------------------------

## 10. State management

### 10.1. Game state

Tavsiya etiladigan state:

``` js
{
  phase: "building",
  levelId: "bridge-01",
  selectedNodeId: null,
  selectedEdgeId: null,
  activeEdgeType: "road",
  playerEdges: [],
  history: [],
  budgetUsed: 0,
  score: 0,
  attempts: 0,
  startedAt: null,
  testResult: null,
  tutorialStep: 0,
  isPaused: false,
  soundEnabled: true
}
```

`budgetUsed` kabi qiymatlar source of truth sifatida saqlanishi shart
emas; `playerEdges` va level configdan derive qilish afzal.

### 10.2. Reducer actions

-   `LOAD_LEVEL`
-   `START_BUILDING`
-   `SELECT_NODE`
-   `SELECT_EDGE`
-   `SET_EDGE_TYPE`
-   `ADD_EDGE`
-   `REMOVE_EDGE`
-   `UNDO`
-   `RESET_BRIDGE`
-   `START_TEST`
-   `TEST_SUCCESS`
-   `TEST_FAILED`
-   `RETRY`
-   `PAUSE`
-   `RESUME`
-   `NEXT_LEVEL`
-   `EXIT_GAME`

Invalid transitionlar reducer ichida rad etilsin.

### 10.3. Undo

-   Har bir successful `ADD_EDGE` yoki `REMOVE_EDGE` oldingi
    `playerEdges` snapshotini historyga qo'shadi.
-   Undo oxirgi actionni qaytaradi.
-   Test paytida undo disabled.
-   Reset playerEdgesni bo'shatadi va historyni tozalaydi.
-   Undo stack uchun limit, masalan 30 action, konfiguratsiya qilinishi
    mumkin.

------------------------------------------------------------------------

## 11. Interaction va input

### Desktop

-   Click node A, click node B --- edge yaratish.
-   Hover --- preview.
-   Click edge --- select.
-   Delete/Backspace --- selected edge delete.
-   Ctrl/Cmd+Z --- undo.
-   Escape --- selection cancel.
-   Space/Enter --- focused CTA activation.

### Mobile

-   Tap node A, tap node B --- edge yaratish.
-   Tap edge --- select.
-   Delete action toolbar orqali.
-   Undo va Test katta tugmalar.
-   Double tap talab qilinmasin.
-   Touch interactionda page scroll tasodifan ishga tushmasin, lekin
    butun sahifa scrollini global bloklama.

### Input edge cases

-   Bir node ikki marta tanlansa: selection bekor qilinadi.
-   Invalid node tanlansa: segment yaratilmaydi.
-   Byudjet yetmasa: aniq feedback.
-   Test paytida tap/click qurilishni o'zgartirmaydi.
-   O'yin pause qilinganda animation va timer to'xtaydi.
-   Browser tab hidden bo'lsa, test simulation pause/throttle qilinadi.

------------------------------------------------------------------------

## 12. Score va stars

MVP scoring oddiy, tushunarli va leveldan levelga sozlanadigan bo'lsin.

Tavsiya: - Levelni muvaffaqiyatli tugatish: asosiy completion. - 3
stars: success + material target ichida + yuqori stability score. - 2
stars: success + material target ichida. - 1 star: success. - Fail: 0
stars, ammo progress va retry ochiq.

Materialni tejash uchun optional challenge: - `parBudget` --- ideal
material target. - `budget` --- maksimal ruxsat etilgan material. -
`used <= parBudget` bo'lsa bonus.

Score formula config orqali sozlansin. Score manfiy bo'lmasin va
`NaN`/Infinity holatlari bloklansin.

------------------------------------------------------------------------

## 13. Audio va feedback

MVP uchun audio optional: - Button click. - Segment placed. - Invalid
action. - Test countdown. - Vehicle movement (juda past ovoz). - Success
chime. - Fail cue.

Barcha audio: - sound toggle bilan boshqariladi. - Audio asset bo'lmasa
gameplay buzilmaydi. - Autoplay policyga mos bo'ladi; user
interactiondan oldin audio boshlanmasin.

------------------------------------------------------------------------

## 14. LMS integration contract

MVP standalone ishlashi shart. LMS integration adapter orqali ulanadi,
game logic LMSga qattiq bog'lanmaydi.

### 14.1. Component props taklifi

``` jsx
<BridgeMaster
  classLevel={5}
  lang="uz"
  config={gameConfig}
  onFinished={(result) => {}}
  onExit={() => {}}
/>
```

`studentId`ni clientdan mustaqil identifikator sifatida qabul qilma. LMS
autentifikatsiya kontekstini host app boshqarishi kerak.

### 14.2. Result payload

``` js
{
  gameId: "bridge-master",
  sessionId: "uuid",
  levelId: "bridge-01",
  classLevel: 5,
  status: "completed",
  score: 850,
  stars: 3,
  materialUsed: 74,
  stabilityScore: 0.91,
  durationSeconds: 142,
  attempts: 2,
  completedAt: "2026-11-12T10:00:00.000Z"
}
```

Bu taklif etilgan payload. LMS backend contract bilan tekshirilmasdan
real APIga yuborilmasin.

### 14.3. Events

-   `game_opened`
-   `tutorial_started`
-   `tutorial_completed`
-   `level_started`
-   `bridge_edge_added`
-   `bridge_edge_removed`
-   `bridge_test_started`
-   `bridge_test_failed`
-   `bridge_test_succeeded`
-   `level_completed`
-   `game_exited`

Eventlarda zarur bo'lgan minimal metadata: - gameId - levelId -
sessionId - timestamp - classLevel (LMS ruxsat bergan bo'lsa) -
attemptNumber

Har bir edge interactionni analyticsga yuborish shart emas; event volume
va privacy hisobga olinsin.

### 14.4. Reward xavfsizligi

-   O'yin ichidagi score platforma coin/point qiymatiga teng emas.
-   Client o'zi reward bermaydi.
-   Reward faqat LMS backend qoidalari orqali belgilanadi.
-   Bir sessiya uchun duplicate completion/rewarddan server
    himoyalanishi kerak.

------------------------------------------------------------------------

## 15. Performance va browser compatibility

-   SVG elementlari soni levelga mos cheklansin.
-   Animatsiyalar faqat kerakli obyektlarda ishlasin.
-   `requestAnimationFrame` faqat vehicle/test animatsiyasi zarur
    bo'lganda ishga tushsin.
-   Event listenerlar cleanup qilinsin.
-   Component unmount bo'lganda timer/RAF to'xtatilsin.
-   ResizeObserver ishlatilsa cleanup qilinsin.
-   1366×768 desktop va 360×800 mobile viewportlarda tekshirilsin.
-   Chrome, Edge, Safari mobile va Android Chrome'da asosiy flow test
    qilinsin.
-   Reduced motion preference qo'llansin.

------------------------------------------------------------------------

## 16. QA test plan

### 16.1. Graph va build logic

-   [ ] Node o'ziga ulanmaydi.
-   [ ] Bir xil edge takror yaratilmaydi.
-   [ ] Noma'lum node ID bilan edge yaratilmaydi.
-   [ ] Max edge length qoidasiga amal qilinadi.
-   [ ] Byudjetdan oshadigan edge rad qilinadi.
-   [ ] Edge delete qilinganda budget qayta hisoblanadi.
-   [ ] Undo add/remove amalini qaytaradi.
-   [ ] Reset faqat player edgesni o'chiradi.

### 16.2. Stability va simulation

-   [ ] Road path startdan finishgacha uzluksiz bo'lmasa test rad
    etiladi.
-   [ ] Road node anchor bilan bog'lanmagan bo'lsa test rad etiladi yoki
    level qoidasi bo'yicha fail.
-   [ ] Triangle bonus to'g'ri hisoblanadi.
-   [ ] Bir xil graph bir xil stability score beradi.
-   [ ] Thresholddan yuqori graph success beradi.
-   [ ] Thresholddan past graph fail beradi.
-   [ ] Weak edge aniqlanishi takrorlanuvchi bo'ladi.

### 16.3. UI/UX

-   [ ] Node click/tap ishlaydi.
-   [ ] Preview line ko'rinadi.
-   [ ] Invalid interaction feedback beradi.
-   [ ] Budget meter yangilanadi.
-   [ ] Test paytida build input disabled.
-   [ ] Retry qurilish holatiga qaytaradi.
-   [ ] Pause/resume timer va animationni boshqaradi.
-   [ ] Result overlay to'g'ri chiqadi.

### 16.4. Responsive/accessibility

-   [ ] 360px kenglikda node'lar tanlanadi.
-   [ ] Toolbar tugmalari kesilmaydi.
-   [ ] Portrait/landscape layout buzilmaydi.
-   [ ] Keyboard focus ko'rinadi.
-   [ ] Sound toggle ishlaydi.
-   [ ] Reduced motion ishlaydi.
-   [ ] Matnlar Uzbek Latin imlosida va kesilmasdan ko'rinadi.

### 16.5. LMS

-   [ ] `onFinished` bir sessiyada faqat bir marta chaqiriladi.
-   [ ] `onExit` to'g'ri ishlaydi.
-   [ ] LMS callback berilmasa standalone o'yin ishlashda davom etadi.
-   [ ] Result payload schema tekshiriladi.
-   [ ] Reward client tomonda hisoblanmaydi.

------------------------------------------------------------------------

## 17. Ishlab chiqish bosqichlari

### Phase 0 --- Repository inspection

Codex: 1. `package.json`, app entry point va mavjud folder structure'ni
o'qisin. 2. React versiyasi, bundler va CSS yondashuvini aniqlasin. 3.
Mavjud GameLab/game component patternlarini qidirsin. 4. Mavjud design
tokens va LMS callback contractini topishga harakat qilsin. 5. Hech
narsani o'zgartirmasdan qisqa audit report bersin.

**Deliverable:** repository audit + implementation plan.

### Phase 1 --- Game logic

-   Node/edge model.
-   Build validation.
-   Budget calculation.
-   Graph connectivity.
-   Stability score.
-   Simulation outcome.
-   Unit tests.

**Acceptance:** testlar UI'siz ishlaydi.

### Phase 2 --- Playable SVG prototype

-   Terrain, water, anchors.
-   Node markers.
-   Edge rendering.
-   Node-to-node selection.
-   Budget meter.
-   Delete/undo/reset.
-   Test Bridge.

**Acceptance:** bitta level boshidan oxirigacha o'ynaladi.

### Phase 3 --- Gameplay feedback

-   Vehicle movement.
-   Weak point highlight.
-   Success/fail.
-   Retry.
-   Score/stars.
-   Tutorial overlay.

**Acceptance:** foydalanuvchi yutish va yutqazish holatini tushunadi.

### Phase 4 --- Visual polish

-   Low-poly environment.
-   Shadows/depth.
-   Animations.
-   Sound toggle.
-   Responsive HUD.

**Acceptance:** GameLab darajasidagi vizual sifat, lekin performance
saqlanadi.

### Phase 5 --- Levels and difficulty

-   5 level config.
-   Sinflar bo'yicha parametrlar.
-   Optional challenge.
-   Playtesting va tuning.

**Acceptance:** Level progression bosqichma-bosqich yangi fikr
o'rgatadi.

### Phase 6 --- LMS adapter and QA

-   Result callback.
-   Analytics events.
-   Exit handling.
-   Error handling.
-   Full QA checklist.

**Acceptance:** LMS contract bilan mos, standalone rejim ham ishlaydi.

------------------------------------------------------------------------

## 18. Codex uchun aniq ish qoidalari

Codex quyidagilarga amal qilsin:

1.  Avval repositoryni tekshir; mavjud texnologiyalarni taxmin qilma.
2.  Mavjud component conventions va styling tizimidan foydalan.
3.  Birinchi bosqichda faqat Bridge Master scope'ida ishlagin.
4.  Barcha game logicni UI component ichiga aralashtirma.
5.  Katta fizik engine yoki 3D engine qo'shishdan oldin sababini
    tushuntir va tasdiq kut.
6.  Har bir muhim algorithm uchun unit test yoz.
7.  Level konfiguratsiyalarini JSON/JS configda saqla; levellarni
    component ichida hardcode qilma.
8.  Desktop va mobile interactionni bir xil game actionlarga normalize
    qil.
9.  `requestAnimationFrame`, timer va listenerlarni cleanup qil.
10. Foydalanuvchi ko'radigan barcha matnlarni localization object orqali
    ber.
11. LMS integration mavjud bo'lmasa mock adapter ishlat; API endpoint
    uydirma.
12. Har phase oxirida o'zgargan fayllar, bajarilgan ishlar, test
    natijalari va qolgan risklar bo'yicha qisqa report ber.
13. Mavjud LMS yoki boshqa o'yinlarga tegishli kodni ruxsatsiz refactor
    qilma.
14. Build va lint/test komandalarini repositorydan aniqlab, ishga
    tushir.

------------------------------------------------------------------------

## 19. Codex uchun boshlang'ich prompt

Quyidagi promptni repository ochilgan Codex chatiga ber:

> Ushbu repositoryda Junior IT Academy Mathematics GameLab uchun Bridge
> Master o'yinini ishlab chiqamiz. Avval `BRIDGE_MASTER_SPEC.md`
> hujjatini to'liq o'qi. Hozircha kod yozishni boshlama. Birinchi
> navbatda repository audit qil: package.json, React/bundler versiyasi,
> app structure, mavjud game componentlar, design tokens, test setup va
> LMS integration patternlarini tekshir. Mavjud arxitekturani buzmasdan
> Bridge Master uchun mos folder structure va implementation plan taklif
> qil. MVPda React + SVG ishlatamiz; game logic pure JS modullarda
> bo'ladi; haqiqiy engineering physics yoki og'ir 3D engine
> qo'shilmaydi. Auditdan keyin menga: (1) aniqlangan stack, (2) reuse
> qilish mumkin bo'lgan komponentlar, (3) taklif qilinayotgan fayllar
> ro'yxati, (4) bosqichma-bosqich plan, (5) noma'lum LMS contractlari va
> risklarni yoz. Men tasdiqlaganimdan keyin Phase 1 --- game logic va
> unit testlardan boshlaymiz.

------------------------------------------------------------------------

## 20. Ochiq qarorlar

Quyidagilar repository audit va product reviewdan keyin tasdiqlanadi:

-   [ ] O'yin GameLab katalogidan ochiladimi yoki dars ichida ham
    ko'rinadimi?
-   [ ] Birinchi MVPda faqat wood materialmi yoki bir nechta materialmi?
-   [ ] Level progress serverda saqlanadimi?
-   [ ] Best score qayta kirganda saqlanadimi?
-   [ ] Reward beriladimi va LMSning qaysi qoidasi qo'llanadi?
-   [ ] 1--11 sinflar uchun level pack qanday taqsimlanadi?
-   [ ] O'yin uchun yakuniy art direction Junior IT Academy dizayn
    tizimiga qanday moslashtiriladi?

------------------------------------------------------------------------

## 21. Definition of Done

Bridge Master MVP tayyor hisoblanadi, agar:

-   [ ] O'yin repositoryda build bo'ladi va LMS/standalone kontekstda
    ochiladi.
-   [ ] Kamida 5 ta level konfiguratsiyasi mavjud.
-   [ ] O'yinchi node'larni ulab road/support segmentlarini qura oladi.
-   [ ] Material byudjeti real vaqtga yaqin yangilanadi.
-   [ ] Undo, delete va reset ishlaydi.
-   [ ] Road continuity va anchor connectivity tekshiriladi.
-   [ ] Stability natijasi deterministik.
-   [ ] Testda vehicle animatsiyasi ishlaydi.
-   [ ] Success/fail va retry flow to'liq.
-   [ ] Score va stars hisoblanadi.
-   [ ] Desktop va mobile input ishlaydi.
-   [ ] Responsive layout va accessibility asoslari tekshirilgan.
-   [ ] Unit testlar va mavjud project build/lint tekshiruvlari
    muvaffaqiyatli.
-   [ ] LMS callback payload hujjatlashtirilgan; backend contract
    tasdiqlanmaguncha reward berilmaydi.
-   [ ] Critical va high severity QA xatolari qolmagan.

------------------------------------------------------------------------

## 22. Yakuniy eslatma

Bridge Master uchun eng muhim narsa --- murakkab fizika emas, balki
**qurish → sinash → tushunish → yaxshilash** siklining qiziqarli, aniq
va adolatli ishlashidir. Birinchi playable buildni imkon qadar tez
chiqaring. Keyin real o'quvchilar bilan sinab, qaysi level tushunarli,
qaysi interaction noqulay va qaysi konstruksiya qoidalari qiziqarli
ekanini o'lchang.

**MVP ustuvorligi:** avval ishlaydigan gameplay, keyin vizual polish,
undan keyin murakkab fizika.
