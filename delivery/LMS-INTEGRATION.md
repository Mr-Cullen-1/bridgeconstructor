# Bridge Master — bitta JSX o‘yin uchun LMS integratsiya talablari

**Dev jamoaga topshirish hujjati · 2026-11-12 · kontrakt v1**

## 1. Natija va mas’uliyat chegarasi

Maqsad: LMS bir marta umumiy JSX o‘yin yuklash va ishlatish muhitini tayyorlaydi. Keyin kontent jamoasi o‘yin dizayni, animatsiyasi, bosqichlari va mexanikasini yangi `BridgeMaster.jsx` yuklash orqali yangilaydi. Shu kontrakt, React muhiti va ruxsatlar doirasidagi yangilanishlar uchun LMS frontendini qayta yozish talab qilinmaydi.

Topshiriladigan fayllar:

| Fayl | Vazifasi |
| --- | --- |
| `BridgeMaster.jsx` | LMSga yuklanadigan to‘liq o‘yin |
| `LMS-INTEGRATION.md` | Ushbu texnik topshiriq; LMSga kontent sifatida yuklash shart emas |

JSX ichida 20 ta bosqich, o‘zbekcha matnlar, CSS, SVG ikonalar, Three.js, procedural 3D sahna, yoritish, soyalar, kamera, animatsiyalar, ovoz, qurilish, hisoblash, qulash va callback adapteri bor. Qo‘shimcha CSS/JSON/rasm/model/font fayli, Three.js importi yoki CDN talab qilinmaydi. Test yechimlari va test frameworklari faylga kiritilmagan.

**LMS ta’minlaydi:** React/ReactDOM muhiti, JSX/ES module kompilyatsiyasi, izolatsiyalangan oynada mount, upload/preview/publish/versioning, o‘quvchi va darsga bog‘lash, natijani backendga ishonchli saqlash.

**JSX ta’minlaydi:** o‘yinning barcha funksiyalari va `onFinished`, `onExit`, `config.onEvent` chaqiruvlari. JSX o‘zi backendga so‘rov yubormaydi, login/token saqlamaydi va React root yaratmaydi.

Bu hujjat **LMS uchun taklif qilinayotgan amalga oshirish kontrakti**. Haqiqiy LMS kodi/serveri tekshirilmagan va unga hech narsa yuklanmagan. Quyidagi API yo‘llari, storage va transport talablari dev jamoa bajaradigan ishlar; ular tayyor mavjud xizmat sifatida ko‘rsatilmagan.

## 2. Fayl formati va runtime

```js
import Game, { bridgeMasterManifest } from "./BridgeMaster.jsx";
```

`default` — React function component. Named export:

```js
{
  contractVersion: 1,
  gameId: "bridge-master",
  version: "1.1.0",
  runtime: "react-19",
  requiredCapabilities: ["webgl2"],
  levelIds: [
    "bridge-01", "bridge-02", "bridge-03", "bridge-04", "bridge-05",
    "bridge-06", "bridge-07", "bridge-08", "bridge-09", "bridge-10",
    "bridge-11", "bridge-12", "bridge-13", "bridge-14", "bridge-15",
    "bridge-16", "bridge-17", "bridge-18", "bridge-19", "bridge-20"
  ]
}
```

Manifest yordamchi metadata; server uni alohida validatsiya qiladi. Artifactning haqiqiy identifikatori server hisoblagan SHA-256 va immutable revisionId bo‘ladi.

| Talab | Qaror |
| --- | --- |
| Manba formati | UTF-8 `.jsx`, ES module; `import` va `export` qo‘llab-quvvatlanadi |
| JSX sintaksisi | Hozirgi eksportdagi JSX `React.createElement`ga kompilyatsiyalangan. Bu `.jsx` uchun ham yaroqli JavaScript; keyingi fayllar oddiy JSX sintaksisini ham ishlatishi mumkin |
| Tashqi import | Faqat `react`; o‘yinning ichki modullari va Three.js fayl ichida |
| React | Shu artifact React **19.3.1** va ReactDOM **19.3.1** bilan tekshirildi. Runner ikkalasining bir xil versiyasini pin qilsin; boshqa versiya alohida QA talab qiladi |
| React nusxasi | Har iframe runnerida bitta React nusxasi; game va ReactDOM bir xil instance ishlatadi |
| Brauzer imkoniyatlari | WebGL2, Canvas, requestAnimationFrame, ResizeObserver, Pointer Events, `inert`, `100dvh`, `crypto.randomUUID` |
| Transport | Production HTTPS; lokal tekshiruv localhost. Oddiy LAN HTTP secure context bo‘lmasligi mumkin |
| Ovoz | Web Audio, faqat foydalanuvchi tugma bosgandan so‘ng; ovoz ishlamasa o‘yin davom etadi |
| Mount | Brauzerda client-side `createRoot`; o‘yinni SSR orqali render qilish talab qilinmaydi |
| Upload limiti | Tavsiya: kamida 5 MiB limit. Hozirgi JSX 1 448 388 bayt; juda kichik matn maydonida kesib saqlamang |

`crypto.randomUUID()` secure context talab qiladi. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)

`.jsx` faylini to‘g‘ridan-to‘g‘ri `<script src>`ga berish yetarli emas: brauzer `react` bare importini o‘zi topmaydi. LMS kompilyatorida importni pin qilingan Reactga resolve qilish, runtime bilan bundle qilish va JavaScript MIME bilan berish kerak. Source ichidagi `import`/`export`larni regex orqali o‘chirmang; butun faylni komponent funksiyasi ichiga ko‘chirmang.

## 3. Upload → publish → ishga tushirish

1. Vakolatli admin bitta `.jsx` yuklaydi. Foydalanuvchi ruxsati, fayl hajmi, UTF-8, extension va haqiqiy parse natijasi tekshiriladi. Fayl nomi server pathi sifatida ishlatilmaydi.
2. Source immutable saqlanadi; server SHA-256, revisionId, uploader, vaqt, gameId va draft status yozadi.
3. Cheklangan build worker source’ni parse qiladi. Faqat ruxsat etilgan `react` importi qabul qilinadi; lokal/URL/Node importlari va dynamic import rad etiladi. Source’ni API serverida `import()`/`eval()` qilib manifest o‘qimang. Manifest literalini AST orqali tekshiring yoki izolatsiyalangan previewdan oling va tekshiring.
4. Worker JSX/ESMni kompilyatsiya qiladi va LMS bootstrap + React + ReactDOM bilan bitta browser runner bundle yaratadi. Unda `process.env`, HMR, unresolved import, external chunk yoki alohida CSS dependency qolmasin. Tavsiya: belgilangan timeout va xotira limiti; upload orqali `package.json`, npm install skripti yoki bundler plugin bajarilmasin.
5. Admin **Preview**da o‘ynaydi. Syntax/runtime/WebGL/CSP xatosi ko‘rsatiladi. Noto‘g‘ri draft eski published revisionni almashtirmaydi.
6. **Publish** darsdagi activeRevisionIdni atomar o‘zgartiradi. Oldingi revisionlar va natijalar saqlanadi; rollback uchun oldingi revision tanlanadi.
7. Student activity ochganda backend launchId yaratadi va studentId, enrollment/activityId, revisionId, runtimeVersion, completionPolicy bilan bog‘laydi. Shu launch davomida revision o‘zgarmaydi.
8. LMS iframe runnerini ochadi va faqat ruxsat etilgan propsni beradi. Natijalar launchga bog‘lanib parent orqali backendga yuboriladi.

Compiled runner URLni content hash/revision bilan yarating, masalan `/game-runtime/{revisionId}/{sha256}/runner.js`. Hashli fayl immutable cache qilinishi mumkin; qaysi revision active ekanini qaytaradigan endpoint yangilanishni aks ettirishi kerak. Faol o‘quvchi yangi publish sabab o‘yin o‘rtasida boshqa kodga o‘tmasin.

**Muhim:** LMS ichida kompilyatsiyadan keyin runner JS/HTML saqlanishi mumkin. Kontent jamoasi baribir faqat bitta JSX yuklaydi; HTML yoki boshqa asset tayyorlash uning vazifasi bo‘lmaydi.

## 4. Izolatsiya, ekran va CSP

O‘yinni LMS sahifasining DOMiga bevosita qo‘ymang: ichki CSS `html`, `body`, `#root` va buttonlarni ham boshqaradi. Tavsiya etilgan chegara — alohida iframe dokumenti, yaxshisi LMSdan ajratilgan runtime originida.

```html
<iframe
  title="Bridge Master"
  src="RUNTIME_URL"
  sandbox="allow-scripts"
  allow="autoplay; fullscreen"
  referrerpolicy="no-referrer"
  style="width:100%;height:100%;border:0;display:block"
></iframe>
```

Parent konteyner balandligi aniq bo‘lsin, masalan `height: calc(100dvh - var(--lms-header-height))`; grid/flex ichida `min-height:0`. Iframe ichida `<div id="root"></div>` va viewport meta bo‘lsin. O‘yin o‘z iframe viewportini to‘liq egallaydi; parent navbar qolgan joyni oldindan ajratadi. CSS fullscreen uchun Fullscreen API ruxsati shart emas.

Sandboxga `allow-same-origin`, popups, downloads, forms yoki top-navigation ruxsatlarini bu o‘yin uchun qo‘shish talab qilinmaydi. Ayniqsa bir originli iframega `allow-scripts` va `allow-same-origin`ni birga qo‘shish izolatsiyani zaiflashtiradi. [HTML standarti](https://html.spec.whatwg.org/dev/iframe-embed-object.html)

Runtime HTML uchun tekshirilgan CSP bazasi:

```http
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'
X-Content-Type-Options: nosniff
```

Productionda `frame-ancestors`ni HTTP header orqali aniq LMS originiga cheklang. HTML/JSni alohida runtime originidan va to‘g‘ri MIME bilan bering; shu originga boshqa user-upload executable kontent joylashtirmang. Runner klassik bundle script bo‘lsin: opaque iframe ichida module/CORS yuklashga tayanish shart emas.

Inline CSS o‘yin faylining ichida, ayrim elementlarda dynamic style atributlari ham bor. Shu sabab yuqoridagi `style-src` kerak. Qat’iyroq siyosatda `styleNonce` propidan foydalanib style elementiga nonce bering, `style-src-elem`ni moslang va dynamic atributlar uchun `style-src-attr 'unsafe-inline'` qoldiring. `unsafe-eval` kerak emas: buildni oldindan bajaring.

`connect-src 'none'` iframe ichidan API/fetch so‘rovlarini yopadi; natija parent orqali ketadi. Bu yagona himoya emas: arbitrary JSX bajariladigan kod, shuning uchun vakolatli upload, build cheklovlari, sandbox va CSP birga qo‘llanadi. `script-src` shu runtime origini bilan cheklangan qolishi kerak. [CSP sandbox](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox)

Brauzer/GPU WebGL2 bera olmasa o‘yin tushunarli xabar ko‘rsatadi. Bunda LMS completed deb yozmasin. Hozir WebGL context yo‘qolsa reload so‘raladi; avtomatik context recovery yoki 2D fallback yo‘q.

## 5. Komponent propslari

```jsx
<Game
  key={`${launchId}:${revisionId}`}
  classLevel={5}
  lang="uz"
  config={{
    onEvent: event => bridge.send("event", event),
    edgeEvents: false,
  }}
  onFinished={result => bridge.send("completed", result)}
  onExit={metadata => bridge.send("exited", metadata)}
/>
```

Bu kod iframe runnerida ishlaydi; `bridge` quyidagi host transportidir. Callback funksiyalari postMessage orqali uzatilmaydi — ularni runnerning o‘zi yaratadi.

| Prop | Default / kontrakt |
| --- | --- |
| `classLevel` | `5`; 1–11 butun son. Hozir metadata, qiyinchilikni avtomatik almashtirmaydi |
| `lang` | `"uz"`; boshqa til uchun `config.translations` kerak |
| `config` | `{}`; oddiy rejimda embedded 20 bosqich ishlaydi |
| `config.onEvent` | optional callback; analytics eventlari |
| `config.edgeEvents` | `false`; true bo‘lsa kesma qo‘shish/o‘chirish eventlari |
| `config.levels` | optional valid level array. Oddiy upload uchun berilmasin; fayldagi bosqichlar ishlasin |
| `config.translations[lang]` | optional matn override’lari; default lug‘at saqlanadi |
| `onFinished(result)` | optional; muvaffaqiyatli **bitta bosqich** yakunida |
| `onExit(metadata)` | optional; foydalanuvchi o‘yindagi chiqish tugmasini bosganda |
| `styleNonce` | optional; qat’iy CSP uchun inline style elementiga nonce |

Callback xatosi o‘yinni to‘xtatmaydi; callback Promise reject qilsa ham adapter uni ushlaydi. Bu natija saqlandi degani emas. Host callback ma’lumotni transport/outboxga qabul qilib, saqlash holatini o‘zi boshqaradi.

Bir xil mount ichida student, activity, classLevel, revision yoki level packni almashtirmang; yangi `key` bilan remount qiling. Callback funksiyalari yangilanishi qo‘llab-quvvatlanadi. `config`ni har renderda keraksiz yangidan yaratmaslik tavsiya etiladi.

## 6. Iframe ↔ parent transporti

Tavsiya: protokol `lms-game/v1`, har mount uchun yangi channelId va **MessageChannel**. Parent faqat o‘zi yaratgan iframega port beradi. Runtime boshlang‘ich xabarda `event.source === parent`, `event.origin === EXPECTED_LMS_ORIGIN`, protocol, channelId va bitta port kelganini tekshiradi. `EXPECTED_LMS_ORIGIN` server konfiguratsiyasidan olinadi; kelgan xabarning o‘zidan olinmaydi.

```js
// Parent, iframe load bo‘lgach. Callback/state kodlari LMS tomonidan yoziladi.
const channelId = crypto.randomUUID();
const channel = new MessageChannel();
channel.port1.onmessage = event => handleRuntimeMessage(event.data, {
  channelId, launchId, revisionId, port: channel.port1,
});
iframe.contentWindow.postMessage({
  protocol: "lms-game/v1", type: "init", channelId,
  props: { classLevel: 5, lang: "uz" },
}, "*", [channel.port2]);
```

`"*"` faqat opaque sandbox iframega dastlabki portni topshirishda ishlatiladi: bunday originni targetOrigin sifatida yozib bo‘lmaydi. Init ichiga token, student PII yoki backend secret qo‘shilmang. Har navigation/remountda eski portni yoping, channelIdni yangilang. Keyingi xabarlar shu port orqali yuradi; boshqa windowdan kelgan global message’lar qabul qilinmaydi. Agar oddiy postMessage ishlatilsa, `event.origin === "null"`ning o‘zi yetarli emas — aynan expected iframe `event.source` va channelId ham tekshirilishi kerak. [Chrome origin qo‘llanmasi](https://developer.chrome.com/docs/modern-web-guidance/guides/security/validate-origins), [MDN postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

Runtime → parent envelope:

```js
{
  protocol: "lms-game/v1",
  channelId: "mount-specific-uuid",
  messageId: "delivery-specific-uuid",
  type: "completed", // ready | completed | exited | event | error
  payload: { /* callback payload; ready uchun manifest */ }
}
```

`ready` — manifest mosligi, `error` — mount/runtime muammosi. O‘yin natijasining o‘zi `payload`da. Envelope va delivery retry logikasi **LMS runneriga** tegishli; game JSX props bilan ishlaydi va bu transportga qattiq bog‘lanmagan.

### Yetkazish va ACK

1. Runtime callbackdan xabar olganda uni xotiradagi pending queuega qo‘yadi va bir xil messageId bilan ACK kelguncha cheklangan backoff orqali qayta yuboradi.
2. Parent xabarni tekshiradi va launchga bog‘lab **durable outbox**ga yozadi. Shundan keyin `ack` qaytaradi. IndexedDB/outbox xatosida ACK bermaydi va saqlanmagan holatni ko‘rsatadi.
3. Parent outboxni authenticated backendga yuboradi. Offline/5xx holatida retry qiladi; 4xx holatida tushunarli xato va diagnostika qoldiradi. Dublikatdan qo‘shimcha ball/reward yaratilmaydi.
4. Backend commitidan keyin LMS “Saqlandi” holatini ko‘rsatadi. Faqat queuega olingan natija hali serverda saqlangan deb ko‘rsatilmaydi.
5. Parent activitydan chiqishni pending natija durable saqlanmaguncha boshqaradi. Brauzer tabini majburan yopish/kompyuter o‘chishi oldidan callback yetib kelmagan holatni kafolatlab bo‘lmaydi.

Local QA runner faqat transportni tekshiradi; durable outbox/backend/ACK retry uning ichida amalga oshirilmagan. Ular LMS DoD bandlaridir.

## 7. Natija va eventlar

`onFinished` payload shakli (qiymatlar namunaviy):

```json
{
  "gameId": "bridge-master",
  "sessionId": "1e5ecf8e-5bb8-4c98-94c2-143d375f215a",
  "levelId": "bridge-04",
  "classLevel": 5,
  "status": "completed",
  "score": 743,
  "stars": 3,
  "materialUsed": 139,
  "stabilityScore": 0.9,
  "durationSeconds": 42,
  "attempts": 2,
  "completedAt": "2026-11-12T14:00:00.000Z"
}
```

Server quyidagilarni tekshiradi:

- `gameId`, `levelId`, revision va classLevel launch konfiguratsiyasiga mos.
- `status === "completed"`; sessionId UUID; `stars` 1–3 butun son.
- score, materialUsed, durationSeconds, attempts va stabilityScore finite, manfiy emas; attempts butun va kamida 1, stabilityScore 0–1.
- Hozirgi packda score 0–1000; budgetlar bridge-01…05 uchun mos ravishda 80, 155, 215, 150, 205. Keyingi revision konfiguratsiyasi o‘zgarsa validator shu revisionga mos ishlasin.
- completedAt yaroqli timestamp, ammo client vaqtiga ishonib deadline/reward hal qilinmaydi. Server alohida receivedAt yozadi.
- Student, enrollment, activity va launch identity authenticated server contextdan olinadi; JSX yuborgan identityga tayanilmaydi.

`onFinished` faqat successful level uchun bir sessionda bir marta chaqiriladi. Failed attempt UI’da mavjud, lekin completion callback kelmaydi. Callback bir marta chaqirilishi transport yoki backendda exactly-once kafolati emas.

Event nomlari: `game_opened`, `tutorial_started`, `tutorial_completed`, `level_started`, `bridge_test_started`, `bridge_test_failed`, `bridge_test_succeeded`, `level_completed`, `game_exited`. `edgeEvents:true` bo‘lsa: `bridge_edge_added`, `bridge_edge_removed`.

Event shakli: `{ name, gameId, sessionId, levelId, timestamp, classLevel, attemptNumber }`. Hozir failure eventi sabab, score yoki bridge graphini yubormaydi. Eventdan bunday mavjud bo‘lmagan ma’lumotni kutmang.

Exit payload: `{ levelId, sessionId, classLevel, attemptNumber }`. Transport/launch konteksti gameId va revisionni allaqachon biladi. Parentning yopish/back tugmasi yoki unmount o‘yindagi onExitni avtomatik chaqirmaydi; host o‘z route chiqishini alohida qayd qiladi.

Session qoidalari:

- Level ochilganda yangi sessionId.
- Bo‘sh, chala, tayanchsiz yoki mustahkam ko‘prikni sinash attemptsni oshiradi; corrupt graph/config sinovi boshlanmaydi.
- Failed → Retry qurilishni, sessionId va attemptsni saqlaydi.
- Replay, Next va boshqa level tanlash yangi session yaratadi.
- durationSeconds — qurilish/sinov faol vaqti; pause/hidden vaqt kiritilmaydi, yaxlitlangan sekund.

## 8. Dars qachon completed bo‘ladi?

**Bitta `onFinished` = bitta level.** Bu butun o‘yin yoki dars completed degani emas. O‘yin boshidan istalgan levelni tanlashga ruxsat beradi; “5-bosqich yakunlandi” ham oldingi to‘rttasi tugaganini bildirmaydi.

LMS activity sozlamasida completionPolicy bo‘lsin. Ushbu pack uchun tavsiya: `requiredLevelIds = manifest.levelIds`; barcha 20 level serverda completed bo‘lgach dars completed. Boshqa pedagogik talabda aniq subset yoki any-level siyosati alohida saqlanadi. Runtime bu siyosatni o‘zi taxmin qilmaydi. Oldingi besh bosqichli revisionni ishlatayotgan activity yangi revisionga o‘tganda requiredLevelIds siyosati ham ko‘rib chiqilsin; eski launch va natijalar o‘z revisionida qoladi.

Har level uchun bestStars/bestScore saqlanishi mumkin. Rerun ballni yig‘ib cheksiz reward bermasin. Delivery idempotency kaliti: `(launchId, gameId, sessionId)`; event delivery uchun `(launchId, messageId)`. Mukofot idempotency kaliti siyosatga qarab `(studentId, activityId, revisionId, levelId)` yoki revisiondan mustaqil activity/level kaliti bo‘lsin. Qaysi biri tanlangani product qarori sifatida qayd etiladi.

**Client natijasi ishonchli server isboti emas.** Schema/range validatsiyasi soxtalashtirishni to‘liq to‘xtatmaydi. Bu payload ichida bridge graph yo‘q, shu sabab backend undan mexanikani qayta hisoblay olmaydi. Yuqori ahamiyatli baho yoki pullik reward uchun server tekshiruvi/qo‘shimcha attempt dalili alohida kontrakt bilan ishlab chiqiladi. Hozirgi formatni avtomatik “tasdiqlangan muhandislik natijasi” yoki xavfsiz coin manbai deb qabul qilmang.

## 9. Saqlash modeli va API vazifalari

Nomlar tavsiya; jamoa mavjud LMS schema/API uslubiga moslaydi:

| Entity | Asosiy maydonlar |
| --- | --- |
| game_revisions | id, gameId, manifest, sourceSha256, sourceObjectKey, compiledObjectKey, runtimeVersion, status, createdBy, createdAt, publishedAt |
| activity_game | activityId, activeRevisionId, completionPolicy, requiredLevelIds |
| game_launches | launchId, authenticated student/enrollment, activityId, pinned revisionId, startedAt |
| game_level_results | launchId, sessionId, levelId, result fields, receivedAt; unique launch/game/session |
| game_events | launchId, messageId, event payload, receivedAt; unique launch/message |
| learner_game_progress | student/activity/revision/level, bestScore, bestStars, completion; serverdan hosil qilinadi |

Kerakli API imkoniyatlari: upload draft, compile status/errors, preview launch, publish/rollback, student launch, idempotent result save, optional analytics ingest, progress read. Har birida auth/role/enrollment tekshiruvi bo‘ladi. Upload qilingan source va student natijalari uchun audit izi saqlanadi.

**Hozirgi o‘yinda checkpoint/resume yo‘q.** Ko‘prik chizmasi, undo tarixi va level selectiondagi yulduzlar joriy komponent xotirasida; refresh/remount qayta boshlaydi. LMS natijalarni persist qiladi va tashqi progress UI’da ko‘rsatishi mumkin. Oldingi chizmani o‘yin ichida tiklash uchun kelajakda versionlangan `initialState/onStateChange` kabi qo‘shimcha kontrakt kerak; bular hozirgi JSX propslari emas.

## 10. Keyingi o‘yin yangilanishlari

Kontent jamoasi uchun oqim:

1. Loyihadagi source’da dizayn/mexanika/bosqichlar o‘zgartiriladi va tekshiriladi.
2. `npm.cmd run export:lms` bajariladi — yangi `delivery/BridgeMaster.jsx` yaratiladi. Qo‘shimcha delivery asset chiqsa export xato bilan to‘xtaydi.
3. `npm.cmd run test:lms` aynan eksport qilingan JSXni izolatsiyalangan runnerda tekshiradi.
4. Shu **bitta JSX** LMSga yangi draft sifatida yuklanadi → Preview → Publish.
5. Talaba keyingi launchda yangi revisionni oladi. Oldingi natijalar eski revision bilan qoladi.

Generated JSXni qo‘lda o‘zgartirish mumkin bo‘lsa ham, takrorlanuvchi eksport uchun source’ni o‘zgartirib qayta yig‘ish asosiy yo‘l. Eksportni ishlatish uchun dev jamoaga bu repo kerak emas; JSX + ushbu MD yetarli. Repo kontent jamoasida saqlanadi.

CSS/animatsiya/mexanika/embedded levels o‘zgarishi va mavjud props/callbacklar saqlanishi — kontrakt v1 doirasida. Yangi tashqi kutubxona importi, yangi browser ruxsati, server endpoint, incompatible payload, React major yoki checkpoint API qo‘shish runtime/kontrakt yangilanishini talab qilishi mumkin. Bunday o‘zgarishlarda contractVersion oshiriladi; eski revisionlar o‘z runtime versiyasida ishlashda davom etadi.

## 11. Dev jamoa uchun qabul mezonlari

- [ ] Admin faqat bitta JSX yuklaydi; fayl to‘liq saqlanadi va checksum ko‘rsatiladi.
- [ ] Default component va manifest aniqlanadi, noto‘g‘ri import/contract/syntax previewga chiqishdan oldin rad etiladi.
- [ ] Runner React/ReactDOMni pin qiladi, JSX uchun bitta nusxani ishlatadi va tashqi Three.js/CSS talab qilmaydi.
- [ ] Preview va student runtime bir xil build/React/CSP/sandboxdan foydalanadi.
- [ ] Iframe parent DOM/storagega kira olmaydi; runtime API tarmoqqa chiqmaydi; ruxsatsiz channel/xabarlar e’tiborsiz qoldiriladi.
- [ ] Desktop va mobil o‘lchamlarda 3D, touch/keyboard, camera, material, undo/delete/reset, pause/resume, audio toggle va no-scroll ishlaydi.
- [ ] Barcha 20 level completed bo‘ladi; 4-level 139 material bilan 3 yulduz oladi. Bosqich tanlashda to‘rt sahifa va 20-bosqichdan qaytish ishlaydi.
- [ ] Bo‘sh/chala/tayanchsiz ko‘prikni sinash mumkin; zaif o‘rta/oxirgi kesma joyida qulaydi; Retry qurilishni saqlaydi.
- [ ] Failure completion yozmaydi; success payload bir levelga tegishli; barcha required level yig‘ilmasdan dars completed bo‘lmaydi.
- [ ] Callback → parent → durable outbox → backend → saqlandi holati tekshiriladi; offline/retry/duplicate/pending-exit holatlari sinovdan o‘tadi.
- [ ] Student/revision binding serverda; qayta yuborish rewardni ko‘paytirmaydi.
- [ ] Yangi draft eski o‘yinni buzmaydi; publish/rollback va active-session revision pinning tekshiriladi.
- [ ] Runtime error/unsupported WebGL/compile error uchun tushunarli xabar bor; bunday holat completed hisoblanmaydi.
- [ ] Haqiqiy Android/iPhone/Safari va LMSning real browser siyosatlari alohida tekshiriladi.

## 12. Topshirilgan artifact tekshiruvi

2026-11-16: “Quruvchilar ustaxonasi” UI, 20 bosqich va sahifalangan tanlov bilan qayta eksport qilindi; kontent versiyasi 1.1.0, callback va manifest kontrakti v1 saqlangan.

SHA-256: `448fd1bf326710231593187b81ba84af52286c0a43ab7f9d0272dd3ddfd4afcd`

Hajm: **1 448 388 bayt**. Barcha qolgan importlar `react`; bitta JS/JSX chiqishi, external chunk/CSS/source-map yo‘q. Three.js MIT litsenziyasi fayl boshida saqlangan.

Mahalliy QA: haqiqiy eksport JSXdan React/ReactDOM bilan runner bundle qilindi; server faqat parent HTML, iframe HTML va runner JSni berdi. Iframe `sandbox="allow-scripts"`, `connect-src 'none'` bilan ishladi. Tekshiruv natijalari:

- Artifact check o‘tdi: syntax/export/import, embedded content va bitta chiqish fayli tekshirildi; qayta eksportda checksum o‘zgarmadi.
- **3/3 LMS browser ssenariysi o‘tdi:** barcha 20 level 3 yulduz bilan, 20 ta completion callback; manifestda 20 ta ID va 1.1.0 versiya tasdiqlandi; xato oxirgi kesmada qulash → failed event → repair → success → exit callback; 360×800 LMS oynasida no-scroll va completion.
- WebGL renderer ishladi, parent DOMga kirish bloklandi, tashqi runtime request kuzatilmadi: faqat parent HTML, iframe HTML va runner JS yuklandi. Runtime browser error kuzatilmadi.
- Mobil va oxirgi kesmaning qulash screenshotlari ko‘rib chiqildi.
- Mavjud source testlari **96/96**, asosiy browser ssenariylari **33/33**, ESLint, production build va JSX checksum tekshiruvi o‘tdi. Production builddagi katta bundle ogohlantirishi saqlanadi.
- Mustaqil read-only review artifact va handoffda bloklovchi muammo topmadi.

Live LMS, real auth/backend, durable outbox/ACK/reward va haqiqiy telefon tekshiruvi bajarilmagan. Ular 11-bo‘limdagi LMS qabul mezonlari bo‘yicha dev jamoa tomonidan tekshiriladi.

Texnik asos: [Vite library build](https://vite.dev/guide/build). Odatdagi library build CSSni alohida chiqaradi; ushbu exporter CSSni komponentdagi style elementiga joylab, yagona fayl talabi buzilmasligini tekshiradi.
