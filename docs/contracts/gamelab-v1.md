# Bridge Master — GameLab JSX kontrakti v1 (2026-11-22)

Manba: `handoff/GameLab-JSX-AUTHOR-CONTRACT.md` (tahrir 1.2), §14 «BridgeMaster uchun moslashtirish». Bu hujjat nima qilingani, qarorlar va tekshiruv natijalarini yozadi. Haqiqiy GameLab runtime/backend bilan tekshirilmagan: faqat mock host ishlatilgan.

## Topshiriladigan fayl

`npm run export:gamelab` → `delivery/gamelab/Game.jsx` (bitta UTF-8 fayl, ~1.57 MB). Birinchi qator `// @junior-gamecenter v1`, yagona import — `react`, `export default Game` va literal `export const gameCenterManifest`. Three.js va uning MIT litsenziyasi, CSS, 20 bosqich, UZ/RU/EN matnlari ichida. `check-gamelab.mjs` manifestni kontrakt §4 bo‘yicha tekshiradi va bosqichlar ro‘yxatiga tenglashtiradi.

Eski `delivery/BridgeMaster.jsx` (LMS contract v1, `onFinished`) **qayta eksport qilinmagan**; u o‘z hujjati va checksumi bilan eskirgan holda qoladi.

## Qarorlar

| Mavzu | Qaror |
| --- | --- |
| Urinish chegarasi | Har «Ko‘prikni sinash» = 1 urinish. Retry har safar yangi `attemptId` (UUID). Sinov boshlanganda `onAttemptStart({attemptId, modeId:"default", levelId, startedAt})` |
| Yakun | `success` yoki `failure` (sababi `road_gap` / `no_support` / `unstable`). `metrics`: `stars`, `score`, `materialUsed`, `stabilityScore`. `durationSeconds` — faqat shu sinovning faol vaqti (pauza kirmaydi) |
| Chiqish / bosqich almashtirish | Sinov davom etayotgan bo‘lsa bir marta `aborted` (`player_exit` / `level_change`, faqat ma’lum `materialUsed`), keyin `onExit()`. Natija tayyor bo‘lgach chiqish uni `aborted` ga almashtirmaydi |
| Rekord | Faqat `success`: `stars` ↓, `score` ↓, `durationSeconds` ↑. `scoreVersion: 1` |
| Saqlash holati | Sarlavhada chip (idle/saving/queued/saved/error), natija oynasida qator, saqlanmaganlar ro‘yxati va «Qayta yuborish» (`onRetrySave(attemptId)`). `start` xatosi o‘yin davomida ko‘rinadi; `queued` hech qachon «Saqlandi» deb ko‘rsatilmaydi |
| Progress | `completedLevelIds` va joriy `scoreVersion` dagi `bestResult.metrics.stars` bosqich tanlashda yulduz sifatida ko‘rinadi; props yangilanishi o‘yinni qayta boshlamaydi |
| Ko‘rsatma | Robot darslari (1–3-bosqich to‘liq, 4/7/10/12/17 qisqa «YANGI!»). `localStorage` yo‘q: GameLab’da dars shu bosqich `completedLevelIds`/`scopes` da yo‘q bo‘lsa va sahifa yuklanishida ko‘rilmagan bo‘lsagina ochiladi; «O‘tkazib yuborish» sahifa yuklanishi davomida hammasini o‘chiradi. Kontraktga yangi prop qo‘shilmagan |
| Tillar | UZ/RU/EN (`i18n/`), `lang` almashganda holat saqlanadi; noma’lum til → `uz` |
| Izolyatsiya | CSS to‘liq `.bridge-app` ichida; `html/body/#root` qoidalari faqat `page-reset.css` da (GameLab eksportiga kirmaydi); modal konteyner ichida (`position:absolute`); `inert` DOM atributi orqali (React 18 va 19 uchun bir xil) |
| Eventlar | `onEvent({name, data:{levelId, attemptNumber}})`, ixtiyoriy |

Rewardlar, coin, checkpoint yo‘q (kontraktga muvofiq).

## Tekshiruv (2026-11-22, lokal)

- Birlik/komponent: **112/112** (tarjima to‘liqligi, manifest, progress qo‘shilgan).
- ESLint: toza. `export:gamelab` + `check:gamelab`: o‘tdi.
- To‘liq E2E (Chrome/Edge, 20 bosqich desktop va mobil touch, 11 viewport): **45/45**; keng modal o‘zgarishidan keyin viewport+dizayn qayta: **19/19**.
- **GameLab mock host (`gamelab-host.html`, `tests/gamelab/`): 10/10** — payloadlar, failure/retry, aborted, level_change, saveState (error/offline/retry), progress/til o‘zgarishi, host sahifa stiliga ta’sir yo‘qligi, eksport qilingan `Game.jsx`.
- Shu 10 test **React 18.3.1** (kontraktning beta profili) bilan ham **10/10** (`.tools/react18` alias serveri; React 19 bilan loyihaning asosiy muhiti).

## Tekshirilmagan

Haqiqiy GameLab runtime, backend, barqaror navbat, qurilma testlari (Safari, haqiqiy telefon), iframe sandbox ichida GameLab eksporti (faqat mock host sahifasida ishladi), yangi o‘quvchilar bilan usability.
