# Bridge Master — QA, 2026-11-12

Lokal standalone versiya. Real LMS, production deploy yoki real o‘quvchi playtesti natijasi sifatida talqin qilinmasin.

## Tasdiqlangan tekshiruvlar

| Tekshiruv | Natija | Dalil |
| --- | --- | --- |
| Unit/component/hook | 65/65 o‘tdi | `npm.cmd run test -- --run` |
| Lint | O‘tdi, xato yoki warning yo‘q | `npm.cmd run lint` |
| Production build | O‘tdi | `npm.cmd run build`; JS 263.17 kB, gzip 82.39 kB |
| Dependency audit | 0 zaiflik | `npm.cmd audit --json` |
| Yakuniy E2E | 7/7 o‘tdi, 56.6 sekund | `npm.cmd run test:e2e`; review tuzatishlaridan keyingi run |
| Chrome, 1366×768 | 5 level success, replay, level select | `gameplay.spec.js` |
| Chrome fail→repair | Valid kuchsiz graph fail, Retry qurilishni saqlaydi, support qo‘shilgach success | `gameplay.spec.js` |
| Klaviatura va tahrirlash | Node Enter, edge delete, Ctrl+Z, reset, budget rejection, sound toggle | `gameplay.spec.js` |
| Pause/resume | Countdown/simulation to‘xtaydi, qayta davom etib successga yetadi | Hook va browser testlari |
| Chrome touch, 360×800 | 44 CSS px node hit-area, horizontal overflow yo‘q, tap orqali tutorial success | `mobile.spec.js` |
| Chrome touch, 800×360 | Landscape qurilish/success, exit/restart, horizontal overflow yo‘q | `mobile.spec.js` |
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
- [Playwright HTML report](../../playwright-report/index.html)

Desktop va mobile screenshotlari ochilib ko‘rildi. Desktopda o‘yin kartasining pastki qismiga sahifa scrolli kerak bo‘lishi mumkin; mobile toolbar va matnlar kenglikdan tashqariga chiqmaydi. SVG hit-area haqiqiy render scale asosida hisoblanadi.

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

## Hali tekshirilmagan / tashqi bog‘liqliklar

- Haqiqiy iPhone/Safari va Android qurilmalari. Chrome touch emulyatsiyasi real device QA o‘rnini bosmaydi.
- Yangi o‘quvchi birinchi segmentni 60 sekund ichida va Level 1ni 2–3 daqiqada bajara olishi. Bunday playtest o‘tkazilmadi.
- Junior brand/design tokenlariga moslik: ular bu papkada taqdim etilmagan.
- Real LMS payload, auth, analytics transporti, server idempotency, persistence va reward.
- Formal screen-reader/WCAG audit o‘tkazilmadi; keyboard, focus, rangdan tashqari feedback va reduced-motion asoslari tekshirildi.
- ESLint 9.39.5 deprecated; dependency daraxti hozir auditdan toza, lekin xavfsiz supported versiya bilan yangilash kerak.

Spec §16 va §21 uchun avtomatlashtirilgan qamrov yuqoridagi jadvalda. Yuqoridagi tashqi tekshiruvlar tugamaguncha production/LMS va barcha qurilmalardagi yakuniy DoD to‘liq tasdiqlangan deb hisoblanmaydi.
