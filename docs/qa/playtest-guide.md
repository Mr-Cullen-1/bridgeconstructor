# Bridge Master: haqiqiy qurilma va o‘quvchi sinovi

Holat: **sinovga tayyor yo‘riqnoma; haqiqiy ishtirokchi natijalari hali yo‘q**.
Manba: `BRIDGE_MASTER_SPEC.md` §1.4, §15, §16. Avtomatlashtirilgan natijalar [QA hujjatida](bridge-master.md).

## Sinovni ochish

Kompyuterda `npm.cmd run dev` va `http://127.0.0.1:5173/` ishlatiladi. Telefon uchun `localhost` kompyuterni anglatmaydi.

Bir xil ishonchli Wi-Fi tarmog‘ida telefon bilan sinash kerak bo‘lsa, kompyuterda alohida terminalda:

```powershell
npm.cmd run dev -- --host 0.0.0.0 --port 5174 --strictPort
```

Terminaldagi `Network` manzilini telefonda oching. Router qurilmalarni ajratib qo‘ysa yoki Windows firewall kirishni bloklasa, bu usul ishlamasligi mumkin. Firewallni o‘chirib qo‘ymang; kerak bo‘lsa Node uchun faqat private tarmoq ruxsatini sozlang. Sinov oxirida shu terminalda `Ctrl+C` bosing. Bu buyruq yo‘riqnomada berilgan, avtomatik ishga tushirilmagan. Public deploy qilinmagan.

## 1. Haqiqiy qurilma QA

Android Chrome va iPhone Safari uchun alohida qayd yarating. Model, OS, browser versiyasi, portrait/landscape va tekshirilgan Git commitni yozing. Emulyatsiya natijasini haqiqiy qurilma ustuniga kiritmang.

| Amal | Kutilgan natija |
| --- | --- |
| Intro va Level 1ni ochish | Matn va boshlash tugmasi o‘qiladi, bosiladi |
| A → B nuqtalarini bosish | Bitta yo‘l quriladi, material 14 / 80 bo‘ladi |
| Kesmani tanlash → o‘chirish → undo | Narx 0 → 14, kesma qaytadi |
| A → Eni ulash | Uzun segment rad etiladi, tushunarli xabar chiqadi |
| A–B, B–C, C–D, D–E → sinash | Avtomobil o‘tadi, muvaffaqiyat oynasi ochiladi |
| Test davomida pause/resume | Harakat to‘xtaydi va davom etadi |
| Qurilish va testda ekran yo‘nalishini almashtirish | Holat saqlanadi, tugmalar ochiq qoladi |
| Tabni yashirish, qayta ochish | O‘yin pauzada, qayta davom ettirish mumkin |
| Level 2–5ni o‘ynash | Yo‘l/tayanch tanlash va barcha nuqtalar ishlaydi |
| Replay, bosqich tanlash, exit/restart | Modallar boshqariladi; qayta o‘ynash toza boshlanadi |
| Sound va reduced motion | Sound toggle ishlaydi; OS reduced motionda natija saqlanadi |
| Har bir ekran va modal | Gorizontal scroll, kesilgan matn, yopilgan tugma yo‘q |

Avval o‘quvchi sinovini tugating; QA yechimlarini ishtirokchiga ko‘rsatmang. QA uchun yechimlar `src/games/bridge-master/__tests__/fixtures/solutions.js` ichida. O‘yin paketiga yechim qo‘shilmaydi.

## 2. Yangi o‘quvchi bilan sinov

Taklif etiladigan boshlang‘ich sinov: 3–5 yangi o‘yinchi. Bu kichik sifat sinovi; barcha o‘quvchilar uchun statistik xulosa sifatida ishlatilmaydi. Ism o‘rniga P01, P02 kabi kod qo‘llang.

1. Kuzatuvchi brauzer, qurilma va commitni yozadi; yangi sahifa ochadi. Refresh progressni o‘chirishi mumkinligi sabab sinov davomida sahifa yangilanmaydi.
2. Faqat shu vazifani ayting: **“Mashina narigi tomonga o‘tishi uchun ko‘prik quring. Ekrandagi ko‘rsatmalardan foydalanishingiz mumkin.”** Yechimni yoki qaysi nuqtani bosishni aytmang.
3. Intro ko‘ringan paytda sekundomerni boshlang. “Qurishni boshlash” bosilgan vaqt, birinchi haqiqiy segment va Level 1 success oynasi chiqqan vaqtni alohida qayd eting. Boshlanish nuqtasi bo‘yicha bu kelishuv sinovlar orasida o‘zgarmasin.
4. Yordam so‘ralsa, aniq berilgan yordamni va vaqtini yozing. Yordam berilgan natijani mustaqil bajarilgan natija bilan qo‘shmang.
5. Bosishdagi xatolar, o‘qilmagan matn, scroll muammosi va qayta urinishlar sonini qayd eting. O‘yinchining gaplarini talqindan alohida yozing.
6. Level 1dan keyin so‘rang: **“Nima qilish kerakligi qayerda tushunarsiz bo‘ldi?”** Keyingi bosqichda tayanch vazifasini tushunishi kuzatilishi mumkin; to‘g‘ri javobni oldindan aytmang.

## Natijani talqin qilish

- Spec maqsadi: birinchi segment ≤60 soniya; Level 1 taxminan 2–3 daqiqada tugashi mumkin. 120 soniyadan tez natija xato hisoblanmaydi; asosiy kuzatuv — 180 soniya ichida mustaqil tugata olishi.
- Har ishtirokchining haqiqiy vaqtini ko‘rsating. `Mustaqil`, `Yordam bilan`, `Tugatmadi`, `Texnik xato` holatlarini ajrating.
- Tugamagan vaqtni 0 deb yozmang; bo‘sh qoldiring va holatini belgilang. Kuzatuv vaqt chegarasi oldindan belgilanib, qayd etilsin.
- Kichik guruhdagi “n/N ishtirokchi bajardi” natijasi shu sinovga tegishli. Yangi o‘quvchi bo‘lmasa pedagogik mezon `tekshirilmagan` qoladi.
- Muammo topilsa: qurilma + takrorlash bosqichlari + kutilgan/haqiqiy natija + dalil fayli. O‘yinni tugatishni bloklaydigan holat navbatdagi tuzatishning ustuvor vazifasi.

## To‘ldiriladigan qayd

| Ishtirokchi kodi | Qurilma/browser | Commit | Kuzatuv chegarasi (s) | Start bosildi (s) | Birinchi segment (s) | Level 1 success (s) | Holat | Urinishlar | Yordam va kuzatuv |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — | Hali o‘tkazilmagan | — | — |

Qayd to‘ldirilgach `docs/qa/bridge-master.md`dagi tegishli ochiq band yangilanadi. Hozir hech qanday o‘quvchi natijasi tasdiqlanmagan.
