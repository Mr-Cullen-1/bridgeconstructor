# Bridge Master

Junior IT Academy GameLab uchun React + Three.js asosidagi lokal ko‘prik qurish o‘yini. Haqiqiy 3D landshaft, ko‘prik va avtomobil; 2D boshqaruv va accessible SVG hit-targetlar. 20 ta bosqich, road/support qurilishi, material byudjeti, undo/delete/reset va deterministik ko‘prik tekshiruvi mavjud.

Interfeys butun viewportga moslashadi: o‘yin, boshqaruv va asosiy modallar uchun sahifa scrolli kerak emas. `3D` / `Old` tugmalari kamerani almashtiradi; sahnaning bo‘sh joyini tortish orqali ko‘rish burchagini o‘zgartirish mumkin. Mobil qurilmada ham nuqtalar ketma-ket tap bilan ulanadi.

“Quruvchilar ustaxonasi” dizayni: iliq oq fon, yashil boshqaruvlar va sariq aksentlar. Desktopda material va asboblar chap panelda, katta 3D maydon o‘ngda; telefonda boshqaruvlar sahna ostida. Qolgan material, joriy bosqich, erishilgan yulduzlar va keyingi qadam haqiqiy o‘yin holatidan ko‘rsatiladi. Kirish, tanaffus, natija va bosqich tanlash oynalari bir xil uslubda. [2026-11-16 UI tekshiruvi](docs/qa/workshop-ui-2026-11-16.md).

## Ishga tushirish

Node.js **22.12+** kerak. Ushbu muhitda Node 24.18.0 va npm 12.0.2 tekshirildi.

```powershell
npm.cmd ci
npm.cmd run dev
```

Brauzerda terminal ko‘rsatgan lokal manzilni oching. Standart: `http://127.0.0.1:5173/`.

```powershell
npm.cmd run test -- --run
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

E2E konfiguratsiyasi o‘rnatilgan **Google Chrome** va **Microsoft Edge** bilan ishlaydi. Mobile sinovlari Chrome touch/viewport emulyatsiyasi; haqiqiy Android/iPhone sinovi emas. Hisobot: `playwright-report/index.html`; screenshotlar: `output/playwright/`.

## O‘ynash

1. `Qurishni boshlash` tugmasini bosing.
2. `Yo‘l` rejimida bir nuqtani, so‘ng ikkinchisini bosing.
3. Keyingi bosqichlarda `Tayanch` rejimida yuqoridagi nuqtalar orqali mustahkam konstruksiya yarating.
4. Istalgan paytda `Ko‘prikni sinash`ni bosing — bo‘sh, chala yoki tayanchsiz ko‘prik ham sinaladi. Yo‘l uzilgan bo‘lsa mashina mavjud yo‘l oxirida yiqiladi; natijadan keyin qurilishni saqlagan holda tuzatib, qayta urinishingiz mumkin.

Klaviatura: **Tab** fokus, **Enter/Space** tanlash, **Esc** tanlovni bekor qilish, **Delete/Backspace** tanlangan kesmani o‘chirish, **Ctrl/Cmd+Z** undo. Touch ham ikki marta ketma-ket nuqta tanlash orqali ishlaydi; drag shart emas.

**Ko‘rsatma (onboarding).** Kirish oynasidan keyin birinchi marta o‘ynaganda robot haqiqiy tugmalar va nuqtalar ustida spotlight bilan o‘rgatadi: qo‘l ko‘rsatkichi, chizilib ko‘rsatiladigan namuna chiziqlar va tugma nomi bilan vazifa («A nuqtani bosing», «Ko‘prikni sinash» tugmasini bosing). Dars bosqichga bog‘langan (`onboarding/steps.js`): 1–3-bosqichlar to‘liq (nuqtalar → yo‘l → tayanch → uchburchak → sinash), 4, 7, 10, 12, 17-bosqichlarda esa nima yangi ekani haqida qisqa «YANGI!» eslatma. Dars faqat shu bosqich hali yakunlanmagan bo‘lsa va ko‘rilmagan bo‘lsa ochiladi; «O‘tkazib yuborish» barcha darslarni o‘chiradi. O‘yin brauzer xotirasiga yozmaydi (GameLab eksporti `localStorage`ni taqiqlaydi): ko‘rilgan darslarni host saqlaydi — `config.onboardingSeen` (dars id’lari, `"*"` = hammasi), `config.onOnboardingDone(lessonId)`, butunlay o‘chirish uchun `config.onboarding: false`. Standalone ilova (`src/App.jsx`) buni `localStorage`da saqlaydi; `?tour` hamma darsni qayta ko‘rsatadi. Testlar: `tests/e2e/onboarding.spec.js`.

Pause va yashirin browser tab vaqtni/animatsiyani to‘xtatadi. Sound dastlab o‘chiq; yoqilganda yengil sintezlangan UI ovozi mavjud. Reduced-motion sozlamasi animatsiyani qisqartiradi.

## Arxitektura

- `src/games/bridge-master/engine/` — React/DOMsiz graph, build rules, narx, stability, simulation, scoring va reducer.
- `levels/bridge-01.json` … `bridge-20.json` — koordinatalar, budget, cheklovlar va thresholdlar.
- `components/` — canvas lifecycle, kameraga mos accessible SVG input, boshqaruv va modallar.
- `scene/` — Three.js world, 3D material/geometriya, yoritish/soya, animatsiya va kamera proyeksiyasi; barcha assetlar lokal procedural geometriya.
- `hooks/` — input, o‘yin holati, RAF lifecycle, preferences va LMS eventlari.
- `i18n/uz.js` — interfeys matnlari; level nomlari level konfiguratsiyasida.
- `adapters/` — xavfsiz callback adapteri va lokal mock event log.
- `__tests__/fixtures/solutions.js` — test-only yechimlar; o‘yin bundle’iga kirmaydi.

Narx: `ceil(length * costPerUnit)` har segment uchun alohida. Narx world koordinatalardan hisoblanadi, ekran o‘lchami uni o‘zgartirmaydi. Fixed segmentlar o‘yinchi budgetidan olinmaydi.

Stability: `clamp(wC*C + wT*T - wU*U - wV*V, 0, 1)`; natija 6 kasrga yaxlitlanadi. C — anchor connectivity, T — tanlangan road pathni uchburchak bilan qoplash, U — tayanchsiz/uzun oraliq riski, V — bitta support yo‘qolishiga sezuvchanlik. Tutorial minimal support policy bilan ishlaydi. Keyingi levellarda ichki road node’lar support-only yo‘l orqali anchorga ulangan bo‘lishi kerak.

Bu **o‘yin modeli**, haqiqiy ko‘prikning muhandislik xavfsizligini hisoblaydigan simulyator emas. Natija oldindan hisoblanadi; vizual animatsiya natijani o‘zgartirmaydi.

3D sahna uchun WebGL2 kerak. WebGL konteksti yo‘qolsa interfeys qayta yuklashni so‘raydi; avtomatik context recovery hali qo‘shilmagan. Reduced motionda ambient suv/bulut animatsiyasi o‘chadi; mashinaning sinov natijasi saqlanadi. Three.js sabab production JS paketi oldingi SVG versiyadan kattaroq; o‘lchami va tekshiruv dalillari QA hujjatida.

## LMS chegarasi

```jsx
import BridgeMaster from './games/bridge-master';

<BridgeMaster
  classLevel={5}
  lang="uz"
  onFinished={result => console.log(result)}
  onExit={metadata => console.log(metadata)}
  config={{ onEvent: event => console.log(event), edgeEvents: false }}
/>
```

Callbacks optional. `onFinished` faqat muvaffaqiyatli level yakunida, bir session uchun bir marta; Retry shu sessionni saqlaydi, Replay/Next yangi session ochadi. Bir xil mount davomida config/level pack almashtirish uchun komponentni yangi `key` bilan qayta oching.

Server, auth, real LMS API, reward va progress persistence ulanmagan. Progress va yulduzlar faqat joriy sahifa xotirasida; refresh qayta boshlaydi. `classLevel` metadata; sinflar uchun alohida tasdiqlangan pack hali yo‘q. Tafsilot: [LMS contract](docs/contracts/bridge-master-lms.md).

## Skill va muhit

`playwright` skilli rasmiy `openai/skills` repozitoriysidan foydalanuvchining `.codex/skills/playwright/` papkasiga o‘rnatildi. `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion` va React quality skilllari oldindan mavjud edi.

Dependencylar `package-lock.json` bilan qayd etilgan. ESLint 9.39.5 vaqtincha ishlatilmoqda: o‘rnatish paytidagi ESLint 10 dependency auditi minimatch ogohlantirishini ko‘rsatdi; ESLint 9 daraxtida audit toza. ESLint 9 deprecated; xavfsiz, qo‘llab-quvvatlanadigan yangi versiyaga alohida yangilash kerak.

[Vite rasmiy qo‘llanmasi](https://vite.dev/guide/) va [Vitest rasmiy qo‘llanmasi](https://vitest.dev/guide/) bilan muhit talablari tekshirildi.

- [Master spec](BRIDGE_MASTER_SPEC.md)
- [Bajarish rejasi](docs/superpowers/plans/2026-11-12-bridge-master-mvp.md)
- [Ish qaydlari](docs/implementation-progress.md)
- [QA natijalari](docs/qa/bridge-master.md)
- [Haqiqiy telefon va o‘quvchi sinovi yo‘riqnomasi](docs/qa/playtest-guide.md)

## GameLab JSX (kontrakt v1)

```powershell
npm.cmd run export:gamelab   # delivery/gamelab/Game.jsx + manifest tekshiruvi
npm.cmd run test:gamelab     # eksport + mock host brauzer testlari (dev server kerak emas, avtomatik ishga tushadi)
```

Kirish: `src/gamelab/Game.jsx` (props: `context, lang, progress, saveState, onAttemptStart, onAttemptEnd, onRetrySave, onExit, onEvent`). Mock host: `gamelab-host.html` (`?lang=ru&save=error|offline&artifact=1`). Tafsilot va qarorlar: [GameLab v1](docs/contracts/gamelab-v1.md). Matnlar UZ/RU/EN (`src/games/bridge-master/i18n/`). Kirish oynasi GameLab dizaynida (3D robot/tanga/kubok assetlari `scripts/make-intro-assets.mjs` bilan olingan).

## Bitta JSX orqali LMSga topshirish (eski LMS v1)

Tayyor fayllar: [BridgeMaster.jsx](delivery/BridgeMaster.jsx) va [LMS dev jamoasi uchun hujjat](delivery/LMS-INTEGRATION.md).
O‘yin, CSS, 20 ta level va Three.js bir JSX ichida; host faqat React runtime va callback transportini beradi. Kontent versiyasi `1.1.0`, callback kontrakti `v1`. Bosqichlar beshtadan to‘rtta sahifada tanlanadi; oyna joriy bosqich sahifasida ochiladi.

```powershell
npm.cmd run export:lms
npm.cmd run test:lms
```

`export:lms` mavjud source’dan bitta artifact chiqaradi va Reactdan boshqa import/chunk qolmaganini tekshiradi.
`test:lms` aynan shu artifactni sandbox iframe ichida ishga tushirib, barcha 20 level, callbacks, qulash/repair va mobil viewportni tekshiradi. [20 bosqichli paket tekshiruvi](docs/qa/twenty-levels-2026-11-16.md).
Mahalliy LMS ko‘rinishini qo‘lda ochish: eksportdan keyin `npm.cmd run preview:lms`, so‘ng `http://127.0.0.1:4174`.
Bu lokal QA runner; live LMS upload, backend, auth, durable outbox yoki publish xizmatini amalga oshirmaydi.
