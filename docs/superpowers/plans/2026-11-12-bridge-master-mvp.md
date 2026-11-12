# Bridge Master MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Ushbu hujjat reja; dastur yaratish hali boshlanmagan.

**Goal:** React + SVG asosida, 5 ta yechiladigan levelga ega, desktop va mobile qurilmalarda ishlaydigan standalone Bridge Master MVP yaratish.

**Architecture:** Qurilish, byudjet, graph, stability, simulation va scoring — React/DOMga bog'liq bo'lmagan pure JavaScript modullar. React reducer o'yin holatini boshqaradi, SVG uni ko'rsatadi. LMS bilan aloqa almashtiriladigan adapter orqali; birinchi versiyada lokal mock ishlaydi.

**Tech Stack:** Taklif: React + JSX, Vite, oddiy CSS, Vitest, React Testing Library va asosiy oqim uchun Playwright. Bular mavjud stack emas; implementatsiya boshlanganda Node bilan mos dependency versiyalari tekshirilib, lockfile bilan saqlanadi.

**Spec:** [BRIDGE_MASTER_SPEC.md](../../../BRIDGE_MASTER_SPEC.md), v1.0, 0–22-bo'limlar.

## 1. Audit: hozir nima bor?

2026-11-12 sanasida papka va yashirin fayllar ro'yxati tekshirildi, 1190 qatorli spec o'qildi.

| Tekshirilgan qism | Aniqlangan holat | Rejaga ta'siri |
| --- | --- | --- |
| Boshlang'ich fayllar | Faqat `BRIDGE_MASTER_SPEC.md`, 39 080 bayt | Greenfield loyiha |
| `package.json`, lockfile, app entry | Yo'q | Avval minimal loyiha va test muhitini yaratish kerak |
| React/bundler/CSS versiyasi | Loyihada belgilanmagan | React + JSX / Vite / CSS — taklif |
| GameLab komponentlari va design tokenlar | Yo'q | Reuse qilinadigan mahalliy komponent aniqlanmadi |
| Test/CI konfiguratsiyasi | Yo'q | Kerakli tekshiruvlarni qo'shish kerak |
| LMS adapter/API/backend contract | Yo'q | Standalone + mock; real integratsiya alohida |
| Git | Bu papka Git repository emas | Git initializatsiyasi implementatsiya boshlanishida |
| Mahalliy vositalar | `node`, `npm.cmd`, `git` topildi | O'rnatilgan vositalar bor; dependency mosligi alohida tekshiriladi |
| Mahalliy qo'shimcha ko'rsatmalar | Papkada `AGENTS.md` yo'q; tekshirilgan ota kataloglarda ham topilmadi | Asosiy loyiha manbasi — master spec |

Audit davomida dastur kodi yaratilmagan, dependency o'rnatilmagan va master spec o'zgartirilmagan. Qo'shilgan yagona artefakt — ushbu reja.

## 2. Global Constraints

- "MVPda React + SVG ishlatamiz; game logic pure JS modullarda bo'ladi" — spec §19.
- "MVPda node koordinatalari level konfiguratsiyasidan keladi." — §3.1.
- "Bir xil ikki node orasida takroriy edge yaratilmaydi." — §3.4.
- `edgeCost = ceil(edgeLength * costPerUnit)` — §5.2.
- "MVPda 5 ta level yetarli." — §6.1; yakuniy acceptance: kamida 5 ta level.
- "Barcha game logicni UI component ichiga aralashtirma." — §18.
- "Foydalanuvchi ko'radigan barcha matnlarni localization object orqali ber." — §18.
- "LMS integration mavjud bo'lmasa mock adapter ishlat; API endpoint uydirma." — §18.
- "Client o'zi reward bermaydi." — §14.4.
- "1366×768 desktop va 360×800 mobile viewportlarda tekshirilsin." — §15.
- "Component unmount bo'lganda timer/RAF to'xtatilsin." — §15.
- "Bir xil bridge graph bir xil test natijasini beradi." — §1.4.
- Og'ir physics/3D engine, multiplayer, free-placement editor va real reward MVPga kirmaydi. O'yin engineering-grade simulator sifatida taqdim etilmaydi.

## 3. Ish boshlashdan oldingi aniqliklar

Quyidagilar specdagi bo'shliqlarni yopish uchun takliflar; ular mavjud yoki oldindan tasdiqlangan loyiha faktlari emas.

| Masala | Dalil yoki xavf | Taklif etilgan qaror |
| --- | --- | --- |
| Namunaviy level yechilmaydi | §6.4: yo'l nuqtalari x=180 va x=620, masofa 440; `maxEdgeLength=260`; oraliq road node yo'q | Namunani tayyor level sifatida ko'chirmaslik. Yangi koordinatalar va reference solution bilan Level 1 yaratish |
| Byudjet va masofa mos emas | Shu namunada `budget=120`, `costPerUnit=1`; 440 uzunlikdagi yo'lning o'zi 440 birlik talab qiladi | Koordinatalar SVG world unit; `costPerUnit=0.1` kabi aniq masshtabni levelda belgilash; ekran resize'i narxga ta'sir qilmasin |
| Level 1da oddiy yo'l, umumiy qoidada har road node uchun support talab qilingan | §6.2 va §4.2 turlicha talqin qilinishi mumkin | Level 1da `supportPolicy="connected"`: yo'l ikki tomondagi anchorga umumiy graph orqali ulangan bo'lishi yetarli. Level 2–5da `supportPolicy="braced"`: har ichki path node'dan faqat support edge'lar orqali anchorga yo'l talab qilinadi |
| Stability formulasi berilmagan | §4.3 komponentlarni sanaydi, vazn va normalizatsiyani ochiq qoldiradi | Formulani `stability.js` va levelning `stabilityConfig` qismida saqlash; quyidagi boshlang'ich modelni fixturelar bilan kalibrlash |
| Teng yo'llar / bir nechta weak edge | Edge qo'shish tartibi natijani o'zgartirishi mumkin | Eng qisqa road path, tenglikda canonical node ID ketma-ketligi; weak edge tengligida canonical edge key |
| `onFinished` sessiyasi noaniq | §14 payload levelga tegishli; §16.5 sessiyada bir marta deydi | Bir levelni ochish → success yoki exit — bitta session. Failed urinish sessiyani yopmaydi; `onFinished` faqat successda bir marta. Replay/Next yangi session yaratadi |
| Audio default zid | §8.5 sound off; §10 misolida `soundEnabled:true` | Birinchi ochilishda sound off. Audio optional, yo'qligi gameplayni to'xtatmaydi |
| Fixed edge narxi | Reset saqlaydi, lekin budget hisobi batafsil belgilanmagan | `calculateTotalCost` barcha berilgan edge narxini yig'adi; player budget uchun faqat `isPlayerBuilt=true` edge'lar uzatiladi |
| Sinf va progress | Sinf paketlari, saqlash, best score ochiq | Bitta 5-level pack; `classLevel` metadata va kelajak presetlar uchun. Birinchi MVP progressi xotirada, refreshda qayta boshlanadi; server persistence alohida ish |
| Road segment ma'nosi | Har qanday node juftligi road bo'lsa vizual tushunarsiz yo'llar paydo bo'lishi mumkin | Levelda `roadNodeIds` kiritish: road faqat shu yo'l nuqtalari/anchorlar orasida. Kesishgan segmentlar yangi joint yaratmaydi |

Boshlang'ich stability modeli: `S = clamp(wC*C + wT*T - wU*U - wV*V, 0, 1)`.

- `C`: tanlangan road path node'larining anchor bilan bog'langan ulushi; prevalidationdan o'tgan graphda 1.
- `T`: kamida bitta support edge qatnashgan yopiq uchburchaklar bilan qoplangan path road edge'lari ulushi. Begona, yo'ldan uzilgan triangle bonus bermaydi.
- `U`: `braced` rejimida support-only yo'li bo'lmagan ichki node yoki `maxUnbracedSpan`dan uzun road edge bilan tutashgan ichki path node'lar ulushi. Ichki node yo'q bo'lsa 0.
- `V`: bittadan support edge olib tashlab ko'rilganda anchor bilan support-only aloqasini yo'qotadigan ichki path node'lar ulushining eng katta qiymati. `connected` rejimida 0.
- Taklif etilgan dastlabki vaznlar: tutorial `{wC:1,wT:0,wU:0,wV:0}`, keyingi levellar `{wC:0.6,wT:0.4,wU:0.2,wV:0.1}`. Threshold va span qiymati har levelda beriladi; bu raqamlar playtestdan o'tgan balans emas.
- Prevalidation noto'g'ri qurilishni sinovga kiritmaydi. Valid, ammo thresholddan past graph sinovni boshlaydi va tushunarli fail beradi. `S >= stabilityThreshold` — success.
- Weak point: har player edge'ni vaqtincha olib tashlagandagi connectivity/stability yo'qotilishi eng katta bo'lgan edge; tenglik canonical key bilan yechiladi. Vizual sinish vaqtida original graph o'zgarmaydi.

## 4. Review Focus

1. Node/edge massivlari tartibi va edge yo'nalishi almashsa natija, tanlangan yo'l va weak point o'zgarmasin — Task 2–3.
2. Noto'g'ri JSON, yo'q ID, nol uzunlik, `NaN`/Infinity yoki buzilgan fixed edge bo'lsa tushunarli config xatosi chiqsin — Task 1–2.
3. Pause, hidden tab, level almashtirish yoki unmount paytida eski RAF natija chiqarmasin — Task 4–5.
4. 360px ekranda SVG kichraysa ham node hit-area kamida 44 CSS px bo'lsin; qo'shni targetlar bir-birini yopmasin — Task 6.
5. Double click, qayta render, callback exception yoki Replay completionni takror yubormasin va o'yinni buzmasin — Task 7.

## 5. Taklif etilayotgan fayl tuzilmasi

Quyidagi fayllar hozir yo'q; implementatsiyada tegishli bosqichda yaratiladi.

```text
package.json / package-lock.json        # scriptlar va dependency lock
index.html / vite.config.js             # standalone entry va bundler
eslint.config.js / .gitignore
src/main.jsx / src/App.jsx              # standalone demo shell
src/games/bridge-master/
  index.jsx / BridgeMaster.jsx          # public export va orchestration
  types.js                             # JSDoc contractlar
  engine/
    levelValidation.js                 # config integrity
    graph.js / buildRules.js / budget.js
    stability.js / simulation.js / scoring.js / history.js
    gameReducer.js                     # phase transitionlar
  hooks/
    useBridgeGame.js / useGameInput.js / useSimulation.js
  components/
    GameHeader.jsx / GameToolbar.jsx / BudgetMeter.jsx
    BridgeScene.jsx / NodeMarker.jsx / BridgeSegment.jsx / Vehicle.jsx
    TutorialOverlay.jsx / ResultModal.jsx / PauseModal.jsx / LevelSelect.jsx
  levels/
    index.js / bridge-01.json ... bridge-05.json
  i18n/uz.js                           # barcha UI matnlari
  adapters/lmsAdapter.js / mockAdapter.js
  styles/bridge-master.css
  __tests__/
    levelValidation.test.js / graph.test.js / buildRules.test.js
    budget.test.js / history.test.js / stability.test.js
    simulation.test.js / scoring.test.js / gameReducer.test.js
    BridgeMaster.test.jsx / lmsAdapter.test.js / levels.test.js
    fixtures/solutions.js              # har level uchun reference graphlar
tests/e2e/bridge-master.spec.js
playwright.config.js / tests/setup.js
docs/qa/bridge-master.md                # tekshirilgan qurilma va cheklovlar
docs/contracts/bridge-master-lms.md      # taklif va haqiqiy contract chegarasi
README.md
```

Qisqartmalar: keyingi tasklarda `game/` — `src/games/bridge-master/`, `test/` — uning `__tests__/` papkasi.

## 6. Bosqichma-bosqich bajarish

### Task 1: Minimal loyiha va yechiladigan Level 1 contracti

**Files:** root konfiguratsiyalar, `src/main.jsx`, `src/App.jsx`, `game/types.js`, `game/engine/levelValidation.js`, `game/levels/bridge-01.json`, `test/levelValidation.test.js`, `test/fixtures/solutions.js`, `README.md`.

**Interfaces:** `validateLevel(level) -> {valid:boolean, errors:string[]}`. JSDoc: `BridgeNode`, `BridgeEdge`, `BridgeLevel`, `GameResult`; levelga `roadNodeIds`, `supportPolicy`, `stabilityConfig`, `parBudget`, `threeStarStability`, `scoreConfig`, `vehicle` qo'shiladi.

- [ ] Node/bundler mosligini tekshirib React + JSX/Vite loyiha, Vitest va lint scriptlarini sozlash; Git repository yaratish. Scriptlar: `dev`, `test`, `lint`, `build`, `test:e2e`.
- [ ] Config testlarini yozish: unique node ID, barcha endpointlar mavjudligi, finite koordinatalar, musbat budget/speed/max length, `0 <= threshold <= 1`, `0 < parBudget <= budget`, fixed-edge integrity. `npm.cmd run test -- --run` yangi validator bo'lmagani sabab fail bo'lishini tekshirish.
- [ ] `validateLevel`ni yozish; noto'g'ri config o'yinni ishga tushirmasin, foydalanuvchiga qisqa lokalizatsiyalangan xato berilsin.
- [ ] Level 1 uchun boshlang'ich fixture: anchorlar `(120,300)`, `(680,300)`; road node'lar `(260,300)`, `(400,300)`, `(540,300)`; 4 ketma-ket road edge, `maxEdgeLength=160`, `costPerUnit=0.1`, `budget=80`, `parBudget=56`, threshold `0.55`, connected policy. Har edge cost 14, jami 56. Fixed edge yo'q.
- [ ] `npm.cmd run test -- --run`, `npm.cmd run lint`, `npm.cmd run build`: muvaffaqiyat. Level 1 fixture cost va uzunlik talablari Task 2da engine bilan qayta tekshiriladi.

**Natija:** ochiladigan minimal sahifa, ishlaydigan test muhiti va aniq Level 1 data modeli.

### Task 2: Qurish, byudjet, graph va undo

**Files:** `game/engine/{graph,buildRules,budget,history}.js` va mos `test/*.test.js`.

**Interfaces:** spec §9.5 nomlarini saqlash. `findPath(edges,start,finish) -> string[] | null`; `getEdgeKey(a,b) -> string`; `canConnectNodes(...) -> {ok:boolean, reasonCode:string|null}`; `createEdge(...) -> BridgeEdge`; `removeEdge(edges,id) -> BridgeEdge[]`; `pushHistory(history,playerEdges,limit=30) -> History`; `undo(history,playerEdges) -> {history,playerEdges}`.

- [ ] Testlar: self/unknown/duplicate/zero-length/too-long edge rad; reverse duplicate ham rad; aynan budgetga teng sarf qabul; oshsa rad; delete va undo sarfni tiklaydi; fixed edge o'chirilmaydi; tarix 30 snapshotdan oshmaydi.
- [ ] Testlarni ishga tushirib kutilgan failni ko'rish, keyin pure engine funksiyalarini yozish. `length` world koordinatalardan, narx har segment uchun alohida `ceil` qilinadi; serialized costga ko'r-ko'rona ishonilmaydi.
- [ ] Graph path eng qisqa umumiy geometrik uzunlik asosida tanlansin; tenglik canonical node ketma-ketligi orqali. `getVehiclePath` faqat road edge'larni uzatadi. Kesishgan, ammo umumiy node IDsi yo'q segmentlar ulanmagan hisoblanadi.
- [ ] Level 1 reference solution 56 birlik, har segment 140 uzunlik ekanini engine orqali tekshirish. Invalid urinish historyni o'zgartirmasligi va 0 qolgan budget holatini tekshirish.
- [ ] `npm.cmd run test -- --run`, lint va build muvaffaqiyatli; engine Reactsiz ishlaydi.

**Natija:** UI bo'lmasa ham ko'prik qurish qoidalari va sarf ishonchli ishlaydi.

### Task 3: Adolatli stability, simulation va score

**Files:** `game/engine/{stability,simulation,scoring}.js`, mos testlar va fixturelar.

**Interfaces:** `calculateStability(level,edges) -> {score,connectivityScore,triangulationScore,unsupportedSpanPenalty,vulnerabilityPenalty,weakEdgeId}`; `validateRoadContinuity` / `validateAnchorConnectivity -> {valid,reasonCode}`; `getSimulationOutcome -> {valid,status,reasonCode,stabilityScore,weakEdgeId}`; `getVehiclePath -> BridgeNode[]`; `createTestRun -> {outcome,path,durationMs,failureAtMs}`. `calculateStars -> 0|1|2|3`; `calculateScore -> number`.

- [ ] Avval testlar: road uzilganida sinov rad, required support yetishmaganda rad, tutorial reference pass, triangulation bonus, thresholdning aynan o'zida pass, valid lekin zaif graph fail. Sinovlarni fail holatda tekshirish.
- [ ] §3dagi stability modelini yozish. Uchburchakni bir marta sanash; yo'ldan uzilgan triangle score oshirmasligi, input array sort/mutation qilinmasligi va bir xil graphni qayta tekshirish invariance testlari.
- [ ] Natija animationdan oldin hisoblanadi. Duration yo'l uzunligi / config speed; fail vaqti weak edgega eng yaqin road nuqtasiga yetish bilan bog'lanadi, tenglikda pathdagi birinchi nuqta. Random yoki `Date.now()` outcome'ga ta'sir qilmasin.
- [ ] Stars: fail 0; success 1; `used <= parBudget` bo'lsa 2; bunga qo'shimcha `S >= threeStarStability` bo'lsa 3. Taklif score: successda `round(base + savingBonus*clamp(1-used/budget,0,1) + stabilityBonus*S)`, failda 0. Config defaultlari: base 500, savingBonus 250, stabilityBonus 250. Non-finite result rad etiladi.
- [ ] Testlar: 0/1/2/3 stars, budget chegarasi, score finite/nonnegative, graph tartibi va reverse endpointlarda bir xil outcome/path/weak point. Test/lint/build o'tsin.

**Natija:** nima uchun o'tishi yoki yiqilishini izohlash mumkin bo'lgan deterministik model.

### Task 4: Reducer va birinchi playable SVG level

**Files:** `game/engine/gameReducer.js`, `game/hooks/{useBridgeGame,useGameInput}.js`, `game/BridgeMaster.jsx`, `game/index.jsx`, scene/node/segment/header/toolbar/budget komponentlari, `game/i18n/uz.js`, CSS; reducer va component testlari.

**Interfaces:** `gameReducer(state,action) -> state`; `useBridgeGame({level,config}) -> {state,dispatch,derived}`; `useGameInput({state,dispatch}) -> input handlers`. Public component props spec §14.1 bilan mos. Barcha edge list = fixed + player; derived budget faqat player edge'lardan.

- [ ] Reducer testlari: barcha ruxsat etilgan phase o'tishlari, invalid action rad, testing/success paytida add/remove/undo blok, reset fixed edge'ni saqlaydi va historyni tozalaydi, retry graphni saqlaydi.
- [ ] Reducer va hooklarni yozish; validation xatosi attemptsni oshirmaydi, valid `START_TEST` aynan bittaga oshiradi; `REPLAY` yangi sessiya, `RETRY` avvalgisida qoladi.
- [ ] SVG scene va click/tap orqali node A → node B qurishni qo'shish. Road/support tanlovini material turidan ajratish; bir xil node qayta bosilsa selection bekor; preview va reasonCode asosidagi Uzbek feedback.
- [ ] Delete, Undo, Reset, Test tugmalari; keyboard: Tab, Enter/Space, Escape, Delete/Backspace, Ctrl/Cmd+Z. Tugma va node label/focuslari.
- [ ] Component test: node tanlashdan keyin edge va budget yangilanishi, invalid target feedback, testingda input lock. Lokal brauzerda Level 1ni build → test outcome → retry/replay oxirigacha o'tkazish.
- [ ] Test/lint/build o'tsin; vaqtinchalik feedback ham aniq ko'rinsin. Keyingi task real vehicle animatsiyasini qo'shadi.

**Natija:** foydalanuvchi bir levelni to'liq o'ynaydi.

### Task 5: Avtomobil, feedback, tutorial va pause

**Files:** `game/hooks/useSimulation.js`, Vehicle/TutorialOverlay/ResultModal/PauseModal, `test/simulation.test.js`, `test/BridgeMaster.test.jsx`, CSS.

**Interfaces:** `useSimulation({run,phase,onComplete}) -> {vehiclePose,elapsedMs,progress}`. Callback active run ID bilan bog'lanadi; engine result o'zgarmaydi.

- [ ] Fake clock testlar: pause/resume sakrashsiz, hidden tab avtomatik pause, unmount va level change eski completionni to'xtatadi, reduced motion outcome'ni o'zgartirmaydi.
- [ ] 3-2-1 countdown, path uzunligiga mos vehicle harakati, weak edge highlight va yengil break, failda xavfsiz to'xtash; keyin result overlay. Pause countdown, vehicle va sessionning faol vaqtini muzlatadi.
- [ ] Intro → birinchi/ikkinchi node → segment → test → success tutoriali; tutorial noto'g'ri amal va retrydan keyin ham davom etadi.
- [ ] Success/retry/replay/next/level select flow; modal focusni boshqarish va qaytarish. Sound default off; audio yo'q bo'lsa ham flow to'liq.
- [ ] Test/lint/build va brauzerda pass/fail/retry/pause oqimlarini tekshirish.

**Natija:** o'yinchi natijani ko'radi, sababini tushunadi va qayta urinadi.

### Task 6: Qolgan 4 level, vizual sifat va mobile

**Files:** `game/levels/index.js`, `bridge-02.json` … `bridge-05.json`, LevelSelect, scene/style, `test/levels.test.js`, `test/fixtures/solutions.js`.

**Interfaces:** `levels` — stable IDli 5 konfiguratsiya; har biri kamida bitta test reference solutionga ega. Public API sinfga qarab boshqa o'yin nusxasini yaratmaydi.

- [ ] Har level uchun oldin fixture testi: config valid; ruxsat etilgan edge'lar; umumiy cost budget ichida; reference solution success; Level 2–5 uchun kamida bitta valid fail graph. Oson/tejamkor yechim bilan 3 yulduz olish mumkinligini tekshirish.
- [ ] Level 2: support; Level 3: triangle; Level 4: tight budget; Level 5: balandlik farqi. Thresholdlarni fixturelardan kelib chiqib sozlash; real o'quvchi playtesti bo'lmaguncha balansni tasdiqlangan deb belgilamaslik.
- [ ] Low-poly SVG qirg'oq, suv, tog' va bulutlar; aniq segmentlar, yengil depth/shadow. Shu papkada Junior design system yo'qligi sabab ranglar specdagi boshlang'ich yo'nalish bo'yicha.
- [ ] 1366×768, 360×800 va 800×360da HUD/toolbar, safe-area va overflow tekshiruvi. SVG scale bo'yicha target radiusni hisoblash, node'lar orasida kamida 44 CSS px tanlash hududini saqlaydigan mobile scene framing. Butun sahifa scrollini bloklamaslik.
- [ ] Reduced motion, matn+ikonka feedback, ko'rinadigan focus, keyboard-only oqim va sound toggle. Har levelni mobile tap bilan oxirigacha tekshirish.
- [ ] Test/lint/build o'tsin; tutorialning 60 soniya va Level 1ning 2–3 daqiqa maqsadlari real yangi o'yinchi bilan o'lchansin. Bunday playtest bo'lmasa natija "hali o'lchanmagan" deb yozilsin.

**Natija:** 5 levelga ega, mobile va desktop uchun tekshirilgan MVP.

### Task 7: LMS mock adapter va sessiya chegaralari

**Files:** `game/adapters/{lmsAdapter,mockAdapter}.js`, `test/lmsAdapter.test.js`, `docs/contracts/bridge-master-lms.md`, BridgeMaster integration.

**Interfaces:** `createLmsAdapter({onFinished,onExit,onEvent}) -> {emit,finish,exit}`. `finish(result)` session ID bo'yicha idempotent. Result §14.2 maydonlarini saqlaydi; callbacks optional. `onEvent` — config orqali ixtiyoriy extension.

- [ ] Testlar: callback yo'q — standalone ishlaydi; success ikki marta dispatch/re-render bo'lsa 1 completion; retrydan keyingi success 1 completion; replay va next yangi session; callback exception/rejection UI'ni buzmaydi; exit bir marta.
- [ ] Session ID create level/replay/nextda yaratiladi; attempt faqat valid testda oshadi; duration faol o'ynash vaqti. `completedAt` faqat payload metadata, stabilityga aralashmaydi.
- [ ] `game_opened`, tutorial, level, test, completion va exit eventlarini bir marta kerakli nuqtada emit qilish. Edge eventlari config flag bilan optional; shaxsiy student ID yuborilmaydi.
- [ ] In-memory mock event log; tarmoq chaqiruvi yo'q. Real LMS endpoint, auth, reward, persistence va server idempotency talablari alohida tasdiqlanadigan contract sifatida hujjatlashtiriladi.
- [ ] Test/lint/build o'tsin. Natijani "mock contract tekshirildi" deb hisobot qilish; real LMS integratsiyasi deb atamaslik.

**Natija:** hostga ulash uchun testlangan public component va hujjatlashtirilgan adapter.

### Task 8: Yakuniy QA va topshirish

**Files:** `tests/e2e/bridge-master.spec.js`, `playwright.config.js`, `docs/qa/bridge-master.md`, README.

**Interfaces:** `npm.cmd run test:e2e` lokal appni ishga tushiradi va asosiy foydalanuvchi oqimlarini tekshiradi.

- [ ] E2E: Level 1 success, valid weak bridge fail → retry → success, budget rejection, delete/undo/reset, pause, keyboard flow, next/replay, beshinchi leveldan level selectga qaytish.
- [ ] `npm.cmd run test -- --run`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test:e2e`: barchasi muvaffaqiyatli bo'lishi kerak.
- [ ] Chrome va Edge desktop; Android Chrome va Safari mobile asosiy oqimi. Emulation haqiqiy telefon sinoviga teng emas: real qurilma bo'lmasa alohida cheklov sifatida yozish.
- [ ] Timer/RAF/listener cleanup, uzun sessiyadan keyingi reset, desktop/mobile screenshots, console xatolari va reduced motion tekshiruvi.
- [ ] Spec §16 va §21 checklistlarini QA hujjatiga bog'lash: passed / failed / unverified. Critical yoki high xatolar qolmasin; tekshirilmagan bandlarni yashirmaslik.
- [ ] READMEda `npm.cmd install`, `npm.cmd run dev`, test/build buyruqlari, UI foydalanishi, level config, stability formulasi va mock LMS chegarasini yozish.

**Natija:** lokal ishga tushadigan loyiha, verifikatsiya hisoboti va keyingi integratsiya uchun aniq contract. Deploy/publish bu reja doirasida emas.

## 7. Bajarish tartibi va nazorat nuqtalari

`Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8`.

- **Birinchi ish sessiyasi:** Task 1–2. Tekshiriladigan natija: loyiha ishga tushadi, Level 1 data valid, graph/build/budget/undo testlari yashil.
- **Birinchi playable milestone:** Task 4 yakuni. Bitta level boshidan oxirigacha o'ynaladi.
- **Asosiy gameplay milestone:** Task 5 yakuni. Harakat, fail/retry, tutorial va pause ishlaydi.
- **MVP milestone:** Task 6–8. Beshta level, adapter, responsive va QA dalillari.
- Har task oxirida o'zgargan fayllar, test natijalari, qolgan risklar qisqa yoziladi. Git commitlar implementatsiya jarayonidagi lokal checkpointlar; push/publish alohida topshiriq bo'ladi.

## 8. Keyinga qoladigan tashqi qarorlar

Standalone MVPni boshlash uchun LMS javoblarini kutish shart emas. Real ulashdan oldin esa quyidagilar kerak:

1. GameLab katalogi yoki dars ichidagi host entry va uning build/import talabi.
2. Backend tasdiqlagan payload, auth context, session idempotency va event transporti.
3. Progress/best score saqlash, refreshdan tiklash va reward qoidalari.
4. 1–11 sinflar uchun tasdiqlangan level pack/difficulty taqsimoti.
5. Junior IT Academy design tokenlari, logo/art va lokalizatsiya contracti.

## 9. Rejani o'z-o'zini tekshirish

- Spec §1–7: scope, graph, budget, levels va pedagogika — Task 1–3, 6.
- Spec §8–13: UI, state, input, feedback, score/audio — Task 3–6.
- Spec §14: public props, result, analytics/reward chegarasi — Task 7.
- Spec §15–16, §21: performance, browser, QA va DoD — Task 5–8.
- Spec §17–20: audit, implementatsiya tartibi va ochiq qarorlar — ushbu rejaning §1–3, §7–8 qismlari.
- Review Focusdagi besh holat uchun tegishli tasklarda aniq tekshiruvlar bor.
- Barcha yangi texnik qarorlar taklif sifatida belgilangan; live LMS mosligi va o'quvchi playtesti hali isbotlanmagan.
