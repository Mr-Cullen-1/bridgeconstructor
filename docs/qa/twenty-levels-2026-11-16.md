# Twenty-level pack — 2026-11-16

## Scope

User requested 20 levels and an updated single final JSX. Original levels 1–5 are unchanged. Added 15 explicit JSON layouts using the existing deterministic construction/stability model: downhill and rolling roads, lower bracing, two/three support hubs, prefabricated roads/supports, and material-saving puzzles. Each new level has an Uzbek introduction/hint.

Level selection now shows five cards per page, opens on the current level's page, preserves earned stars and keeps page controls beside Close. The construction panel shows the current group of five steps plus current/total numbering. Content version is 1.1.0; LMS callback contract remains v1. Manifest IDs are derived from the same imported level list as the game.

## Reference constructions

These costs are verified affordable three-star solutions, not a claim of mathematical minimum cost. Fixed segments are excluded from player material usage. Construction pairs live only in test fixtures and are not exported into the game.

| Level | Name | Reference cost | Three-star budget | Total budget |
| --- | --- | ---: | ---: | ---: |
| 1 | Birinchi ko‘prik | 56 | 56 | 80 |
| 2 | Tayanch kuchi | 135 | 135 | 155 |
| 3 | Uchburchak siri | 185 | 185 | 215 |
| 4 | Oqilona quruvchi | 139 | 139 | 150 |
| 5 | Yangi cho‘qqilar | 185 | 185 | 205 |
| 6 | Pastga yo‘l | 185 | 185 | 215 |
| 7 | Pastki tayanch | 185 | 185 | 210 |
| 8 | Yumshoq dovon | 186 | 190 | 215 |
| 9 | Vodiy bag‘rida | 189 | 190 | 210 |
| 10 | Ikki qanot | 182 | 185 | 210 |
| 11 | Tog‘ yo‘li | 175 | 175 | 195 |
| 12 | Qurilishni davom ettir | 156 | 160 | 180 |
| 13 | Pastdan ko‘mak | 182 | 185 | 205 |
| 14 | Notekis qirg‘oqlar | 185 | 185 | 200 |
| 15 | Uch tayanch | 200 | 200 | 220 |
| 16 | Dovon ustasi | 190 | 190 | 205 |
| 17 | Tayyor poydevor | 152 | 155 | 170 |
| 18 | Balandliklar zanjiri | 194 | 195 | 205 |
| 19 | Tejamkor yo‘l | 146 | 150 | 160 |
| 20 | Usta muhandis | 197 | 200 | 205 |

## Evidence

- 96 unit/component/hook tests passed: all 20 configurations, legal edge-by-edge construction, affordable three-star completion, valid weak constructions preserving fixed edges, camera framing and pagination callbacks/current-page behavior.
- Full source browser suite: **33/33 passed** in 12.6 minutes. All 20 levels completed with three stars on desktop Chrome and touch emulation at 360×800 and 800×360, plus the 11-size viewport matrix, modal states, camera alignment, pause, repair, keyboard and Edge coverage. Each complete touch run took 2.9 minutes; its future timeout was raised to five minutes to leave scheduling margin without weakening assertions.
- Actual exported JSX: **3/3 LMS browser tests passed** in 2.8 minutes. All 20 levels completed with three stars and 20 completion callbacks. Ready manifest contains the exact 20 IDs, version 1.1.0 and contract v1. Late-span collapse/repair, failure/exit events and mobile completion passed. The opaque sandbox blocked parent DOM access, no runtime error occurred, and requests were limited to the parent HTML, frame HTML and runner JS.
- Level-pack test first failed because only five levels existed; selector tests first failed because all cards rendered and no page controls existed. Both pass after implementation.
- Existing camera tests caught new upper nodes outside the safe interaction area. New hub coordinates were adjusted to y >= 100, preserving the original camera and first five levels.
- Targeted three-viewport browser navigation passed at 1366×768, 320×568 and 800×360: all four pages, level 20 selection, current-page reopening, focus trapping, real construction, success, earned stars and absence of Next after the final level.
- The 320×568 browser test reproduced clipped pagination after longer level descriptions. Short phone cards now omit subtitles; the selected level still displays its full introduction. Assertions also check actions against the modal bounds. Screenshots of all three final-page/final-bridge layouts were visually inspected.
- ESLint and production build passed. JS 850.18 kB / 230.14 kB gzip; CSS 22.51 kB / 5.64 kB gzip. The existing Three.js large-chunk warning remains.
- Independent read-only review found no actionable source regression; responsive visual/keyboard checks were reserved for browser verification.

## Artifact

`delivery/BridgeMaster.jsx`: **1,448,388 bytes**, SHA-256 `448fd1bf326710231593187b81ba84af52286c0a43ab7f9d0272dd3ddfd4afcd`. Includes all 20 levels, CSS, Three.js and game code. React remains the only external import. The exporter/checker verifies one output and the full JSON catalog's IDs.

Repeated export produced the same checksum. Temporary Vite and LMS preview servers were stopped after QA; Windows LMS teardown completed with exit 0 after its confirmed server process was stopped.

## Limits

The physics model is educational and deterministic. Difficulty progression is authored and tested for solvability; student playtesting and optimal-solution analysis were not performed. Mobile checks use Chrome touch/viewport emulation, not physical phones or Safari. No live LMS upload, backend, persistent progress or deployment is part of this change.
