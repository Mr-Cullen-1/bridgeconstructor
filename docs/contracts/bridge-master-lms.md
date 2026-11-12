# Bridge Master callback contract — standalone v0.1

Bu loyiha taklifi va lokal testlangan adapter contracti. Haqiqiy LMS backend contracti hali taqdim etilmagan; tarmoq so‘rovlari yo‘q.

## Component props

`classLevel=5`, `lang="uz"`, `config={}`, optional `onFinished(result)`, optional `onExit(metadata)`.

`config.levels` valid level arrayni almashtiradi; `config.translations[lang]` Uzbek UI lug‘atiga override beradi. `config.onEvent` optional analytics callback; `config.edgeEvents` default false. Host yangi pack yoki sinf parametrlarini almashtirganda komponentni yangi React `key` bilan remount qiladi. Hozir classLevel qiyinchilikni avtomatik o‘zgartirmaydi.

## Session

- Level ochilishi yangi `crypto.randomUUID()` sessionId yaratadi.
- Valid test attemptsni oshiradi; invalid graph uchun test boshlanmaydi.
- Failed test va Retry bir sessionda qoladi.
- Success `onFinished`ni bir session uchun bir marta chaqiradi.
- Replay, Next yoki LevelSelect yangi session ochadi.
- Exit user amali `onExit(metadata)`ni bir session uchun bir marta chaqiradi.
- Callback xatosi gameplayni to‘xtatmaydi; callback tarmoq yetkazib berilishi kafolatlanmaydi. Host retry/outbox va server idempotencyni o‘zi ta’minlaydi.

## Completion payload

| Field | Qiymat |
| --- | --- |
| gameId | `bridge-master` |
| sessionId | UUID |
| levelId | `bridge-01` … `bridge-05` yoki host config IDsi |
| classLevel | 1–11 butun son |
| status | `completed` |
| score | finite, nonnegative o‘yin bali |
| stars | 1, 2 yoki 3 |
| materialUsed | player-built material sarfi |
| stabilityScore | 0–1 |
| durationSeconds | faol vaqt, pause/hidden vaqtisiz, yaxlitlangan sekund |
| attempts | valid testlar soni |
| completedAt | ISO timestamp |

Fail natijasi UI ichida mavjud (`stars:0`), ammo `onFinished` orqali yuborilmaydi. `bridge_test_failed` eventidan foydalaniladi.

## Eventlar

`game_opened`, `tutorial_started`, `tutorial_completed`, `level_started`, `bridge_test_started`, `bridge_test_failed`, `bridge_test_succeeded`, `level_completed`, `game_exited`. Ixtiyoriy: `bridge_edge_added`, `bridge_edge_removed`.

Metadata: `gameId`, `sessionId`, `levelId`, `timestamp`, `classLevel`, `attemptNumber`. `studentId` olinmaydi. Class metadata yoki edge eventlarini serverga uzatish siyosatini host boshqaradi.

Client score reward/coin emas. Client payloadni ishonchli natija sifatida qabul qilmaslik; real rewardni LMS backend o‘z qoidalari va idempotency nazorati bilan boshqaradi.
