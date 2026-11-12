# Bridge Master — QA, 2026-11-12

Lokal standalone versiya. Real LMS, production deploy yoki real o‘quvchi playtesti natijasi sifatida talqin qilinmasin.

## Tasdiqlangan tekshiruvlar

| Tekshiruv | Natija | Dalil |
| --- | --- | --- |
| Unit/component/hook | 72/72 o‘tdi | `npm.cmd run test -- --run`; chala/bo‘sh ko‘prik sinovi, qisman yo‘l va attempts ham qamrab olingan |
| Lint | O‘tdi, xato yoki warning yo‘q | `npm.cmd run lint` |
| Production build | O‘tdi; katta chunk ogohlantirishi bor | `npm.cmd run build`; JS 831.40 kB, gzip 226.78 kB; CSS 13.90 kB / gzip 4.06 kB |
| Dependency audit | 0 zaiflik | `npm.cmd audit --json` |
| Yakuniy E2E | 18/18 o‘tdi, 2.2 daqiqa | `npm.cmd run test:e2e`; bo‘sh/chala/tayanchsiz sinov, qulash, 3D, 6 viewport va normal-motion lifecycle bilan |
| Chrome, 1366×768 | 5 level success, replay, level select | `gameplay.spec.js` |
| Chrome fail→repair | Valid kuchsiz graph fail, Retry qurilishni saqlaydi, support qo‘shilgach success | `gameplay.spec.js` |
| Klaviatura va tahrirlash | Node Enter, edge delete, Ctrl+Z, reset, budget rejection, sound toggle | `gameplay.spec.js` |
| Pause/resume | Countdown/simulation to‘xtaydi, qayta davom etib successga yetadi | Hook va browser testlari |
| Chrome touch, 360×800 | Barcha 5 level 3 yulduz bilan tugaydi; node/material/Test/Next tap bilan; har levelda 44 CSS px target va horizontal overflow tekshiruvi | `mobile.spec.js` |
| Chrome touch, 800×360 | Barcha 5 level touch orqali 3 yulduz bilan tugaydi; har levelda target/overflow tekshiruvi; qo‘shimcha exit/restart | `mobile.spec.js` |
| Edge, 1366×768 | Tutorial success, browser JS xatosi yo‘q | `smoke.spec.js` |
| Reduced motion | Natija o‘zgarmaydi, animatsiya qisqaradi | Hook testi + E2E default reduced motion |
| Standalone | Callback/API bo‘lmasa barcha level ishlaydi | E2E va adapter testlari |
| Completion | Session bo‘yicha bir marta; Replay sessioni alohida | `lmsAdapter.test.js` |
| Host callback xatosi | Sync throw/async rejection gameplayga tarqalmaydi | `lmsAdapter.test.js` |
| Config/graph | Invalid ID, duplicate, max length, zero length, NaN/Infinity, fixed edge va budget tekshiruvi | `engine.test.js`, `stability.test.js` |
| Determinizm | Edge tartibi/yo‘nalishi outcome, path va weak pointni o‘zgartirmaydi | `stability.test.js` |
| RAF lifecycle | Pause, run almashtirish va unmountdan keyin stale completion yo‘q | `useSimulation.test.jsx` |
| Console | Yakuniy manual Chrome reload’da faqat React DevTools informational yozuvi | Playwright CLI log |

## Vizual dalillar

- [Desktop screenshot](../../output/playwright/desktop-bridge.png)
- [360px mobile screenshot](../../output/playwright/mobile-bridge.png)
- [Level 5 portrait](../../output/playwright/mobile-360-level-5.png)
- [Level 5 landscape](../../output/playwright/mobile-800-level-5.png)
- [Playwright HTML report](../../playwright-report/index.html)
- [3D desktop, 1920×1080](../../output/playwright/3d-1920x1080.png)
- [3D mobile, 360×800](../../output/playwright/3d-360x800.png)
- [3D kichik telefon, 320×568](../../output/playwright/3d-320x568.png)
- [3D landscape, 800×360](../../output/playwright/3d-800x360.png)
- [Chala ko‘prik oxirida avtomobilning yiqilishi](../../output/playwright/partial-bridge-fall.png)

3D versiya foydalanuvchining 2026-11-12 dagi screenshot va scrollsiz viewport talabiga muvofiq eski sahifa layoutini almashtirdi. Desktop, portrait va landscape screenshotlari ochilib ko‘rildi. Node hit-area 44 CSS px, koordinatalar Three.js kamerasi orqali proyeksiya qilinadi.

Yangi viewport tekshiruvlari 1366×768, 1920×1080, 360×800, 390×844, 320×568 va 800×360 o‘lchamlarda documentning ikki o‘qda scroll qilmasligi, toolbar hamda intro/result/level-select tugmalarining ekranga sig‘ishini tekshiradi. Avvalgi landscape scroll cheklovi shu versiyada olib tashlangan.

Sahna haqiqiy WebGL: procedural landshaft, daraxtlar, suv, yo‘l/tayanchlar va avtomobil meshlaridan iborat. 2D qatlam — boshqaruv va accessible hit-targetlar. `3D`/`Old` kamera almashinuvi va bo‘sh sahnada drag mavjud. Normal-motion testida canvas kadrlari o‘zgarishi, visibility eventida butun o‘yin pauzaga tushishi, 7.5 sekund davomida kadr o‘zgarmasligi va faqat Resume orqali successga yetishi tekshiriladi. Visibility eventi testda boshqariladi; haqiqiy telefon OS background lifecycle sinovi sifatida talqin qilinmasin.

Three.js qo‘shilishi production JS paketini oshirdi; Vite 500 kB chunk chegarasi haqida ogohlantiradi. Bu build xatosi emas, ammo sekin qurilma/tarmoqdagi performance o‘lchovi hali yo‘q. Renderer DPRni 1.75 bilan cheklaydi; natijani “60 FPS tasdiqlandi” deb talqin qilish mumkin emas.

Haqiqiy telefon va yangi o‘quvchi tekshiruvi uchun [sinov yo‘riqnomasi va bo‘sh qayd jadvali](playtest-guide.md) tayyor. Natija kiritilmaguncha tashqi sinovlar `tekshirilmagan` bo‘lib qoladi.

## Topilib tuzatilgan xatolar

1. SVG keyboard handler JSX qavslaridagi sintaksis xatosi — component import/build orqali aniqlandi, tuzatildi.
2. Dekorativ Enter belgisi test tugmasining accessible nomiga qo‘shilayotgan edi — `aria-hidden` bilan tuzatildi.
3. Keraksiz bo‘sh CSS data importi buildni to‘xtatardi — olib tashlandi.
4. Gorizontal SVG line hit-area geometrik balandligi nol edi — haqiqiy to‘rtburchak polygon bilan almashtirildi.
5. Selected edge Delete qilinganda fokus yo‘qolib Ctrl+Z rootga yetib bormasdi — fokus o‘yin rootida saqlanadi. Browser regression RED→GREEN.
6. Favicon 404 — lokal SVG favicon qo‘shildi.
7. Host graphida duplicate fixed segment yetishmayotgan boshqa segment o‘rniga qabul qilinishi mumkin edi — har segment bir marta moslashtiriladi; hisob va animatsiya bitta tekshirilgan graphdan foydalanadi.
8. Fixed segment endpoint yo‘nalishi/property tartibi rad etilardi, null/undefined segmentlar exception berardi — semantik tekshiruv va malformed entry himoyasi qo‘shildi. Oltita regression case, fixdan avval to‘rttasi qizil, so‘ng barchasi yashil.
9. Tutorialning keyingi nuqtasi va tayyor Test tugmasi vizual ajratilmagan edi — halqa/strelka va tugma outline, shuningdek hint bilan accessible bog‘lanish qo‘shildi. Component regression RED→GREEN.
10. Level 2, 3 va 5 matnlaridagi `?` encoding artefaktlari to‘g‘ri o‘zbekcha apostrofga almashtirildi.
11. Foydalanuvchi tuzatishi: roadGap/noSupport sinovni boshlashdan oldin rad etilardi. Endi bo‘sh, chala va tayanchsiz ko‘priklar ham sinovga kiradi; failed attempt yoziladi, Retry qurilishni saqlaydi. Qisman yo‘lda mashina faqat startdan yetib borish mumkin bo‘lgan segmentlarda yuradi va uzilishda yiqiladi. Natija oynasi sababni ajratadi. To‘rtta RED assertion → GREEN; normal-motion qulash screenshoti ochilib ko‘rildi.

## Hali tekshirilmagan / tashqi bog‘liqliklar

- Haqiqiy iPhone/Safari va Android qurilmalari. Chrome touch emulyatsiyasi real device QA o‘rnini bosmaydi.
- Yangi o‘quvchi birinchi segmentni 60 sekund ichida va Level 1ni 2–3 daqiqada bajara olishi. Bunday playtest o‘tkazilmadi.
- Junior brand/design tokenlariga moslik: ular bu papkada taqdim etilmagan.
- Real LMS payload, auth, analytics transporti, server idempotency, persistence va reward.
- Formal screen-reader/WCAG audit o‘tkazilmadi; keyboard, focus, rangdan tashqari feedback va reduced-motion asoslari tekshirildi.
- ESLint 9.39.5 deprecated; dependency daraxti hozir auditdan toza, lekin xavfsiz supported versiya bilan yangilash kerak.
- WebGL2 talab qilinadi. Context loss holatida tushunarli reload xabari chiqadi; avtomatik context restore deferred. GPU resurslari va RAF unmountda tozalanadi; React StrictMode uchun canvas contextni majburan yo‘qotish qo‘llanmaydi.

Spec §16 va §21 uchun avtomatlashtirilgan qamrov yuqoridagi jadvalda. Yuqoridagi tashqi tekshiruvlar tugamaguncha production/LMS va barcha qurilmalardagi yakuniy DoD to‘liq tasdiqlangan deb hisoblanmaydi.
