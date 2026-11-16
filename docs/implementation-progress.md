# Execution ledger — docs/superpowers/plans/2026-11-12-bridge-master-mvp.md

## Setup / rulings
- User authorized skill installation, environment preparation and implementation on 2026-11-12.
- Skills loaded: skill-installer, executing-plans, test-driven-development, using-git-worktrees, verification-before-completion. Playwright installed from official openai/skills using Git because Python is unavailable.
- Ruling: fresh directory has no Git base or shared branch; initialize `feat/bridge-master-mvp` here. No separate worktree is necessary for this new project.
- Ruling: shell helper scripts require unavailable Python/POSIX setup. Keep this portable ledger and run tests directly instead.
- Pre-flight 1→2→3: JSDoc node/edge/level contracts feed engine modules; no conflicting types.
- Pre-flight 3→4→5: simulation result immutable, animation owns elapsed time, reducer owns phase; callbacks use run/session IDs.
- Pre-flight 4→6→7: session is one level opening through success/exit. Retry stays in session; Replay/Next/LevelSelect creates a new session.
- Ruling: `findPath` accepts optional nodes for geometric path length; callers supply nodes. Two endpoints alone do not carry geometry.
- Ruling: reference solutions stay test-only; production levels never auto-build a solution.
- Ruling: progress/score server storage and real LMS are outside standalone scope; no network integration or reward.

## Tasks
- Task 1–3: engine verified: initial 37 tests passed. First production build now passes (261.73 kB JS, 81.91 kB gzip).
- Task 4–7: implemented. Final unit/component/hook suite: 65 passed. UI test allowance is 15 seconds because this host exceeded the default 5 seconds; assertions were preserved.
- Task 8: local browser QA and screenshots completed; final review regression browser run passed 7/7 in 56.6 seconds. Physical mobile devices and new-student playtests remain unverified. See `docs/qa/bridge-master.md`.
- Ruling: keep ESLint 9.39.5 / @eslint/js 9.39.5 because latest ESLint 10 pulls vulnerable minimatch. npm audit after pin: zero vulnerabilities; ESLint 9 is deprecated and should be upgraded when a supported safe dependency tree is available.
- Ruling: use node environment for pure engine tests, jsdom only for component/hook files to reduce startup cost. No gameplay assertion was relaxed.
- Ruling: group closely related engine tests in engine.test.js, reducer in gameReducer.test.js and UI integration in BridgeMaster.test.jsx rather than many one-purpose test files; same planned behaviors remain covered.
- Ruling: Level 4 demonstrates a shorter road path over optional middle nodes. Reference cost 139, max budget 150; Levels 3 and 5 reference cost 185.
- Ruling: one material (wood), all five levels selectable, progress in memory only. No grade-specific content, host tokens or backend contract supplied.

## Final independent review and fix pass
- One independent read-only review was completed. Important findings: fixed-edge duplicates could substitute missing segments; reversed endpoints/property order were rejected; null/undefined edge entries threw exceptions.
- Added six regression cases; four failed before the fix. The final suite passes all 65 tests. A shared graph normalization step now matches fixed segments one-to-one, rejects malformed entries, and supplies both outcome calculation and vehicle path.
- Minor localization encoding artifacts in levels 2, 3 and 5 were corrected.
- Ruling: missing tutorial visual cues are a first-player acceptance gap; included in this fix pass. Added visible node arrow/ring and ready-to-test outline with accessible hint associations. Component regression was red before implementation and green afterward.
- Final lint and production build passed: JS 263.17 kB, gzip 82.39 kB; CSS 10.82 kB, gzip 3.37 kB.
- No merge, remote push, deployment or real LMS changes. Work stays on local `feat/bridge-master-mvp`.

## Keyingi bosqich: mobile QA va playtestga tayyorgarlik
- Oldingi qaydlar tarixiy: foydalanuvchi so‘rovi bilan repo `main` branchiga o‘tkazildi va `https://github.com/Mr-Cullen-1/bridgeconstructor.git` ga push qilindi. Ushbu bosqich boshlanishida local/remote HEAD `2f2d6ab` edi.
- Mavjud rejaning Task 6 va 8 bandlari davom ettirilmoqda: barcha 5 levelni 360×800 hamda 800×360 touch emulyatsiyada tekshirish. Material, node, Test va Next tugmalari ham touch orqali ishlatiladi.
- Real Android/iPhone va yangi o‘quvchi uchun `docs/qa/playtest-guide.md` tayyorlandi: ulanish, takrorlash qadamlari, vaqt o‘lchash mezonlari, bo‘sh qayd jadvali. Real sinov natijasi uydirilmagan.
- Product kodi yoki LMS doirasi o‘zgartirilmagan. Ushbu bosqichda avtomatik deploy yoki LAN server ochilmagan.
- Yakuniy tekshiruv: Chrome/Edge E2E 8/8 (1.6 daqiqa), lint xatosiz, `git diff --check` xatosiz. Level 5 portrait/landscape screenshotlari ko‘rib chiqildi. Unit/build qayta bajarilmadi: product kodi va dependencylar o‘zgarmagan.

## Viewport + 3D, user request 2026-11-12
- Ruling: user explicitly allowed full 3D or 80% 3D/20% 2D and requested implementation before their visual review. Chosen: real Three.js world with 2D HUD/projected accessible inputs; existing deterministic rules stay unchanged. Tradeoff: not free-form 3D engineering physics or exact pixel-ratio enforcement.
- Ruling: new no-scroll and 3D request supersedes original SVG-only/page-scroll spec. Removed page headline/footer and old SVG vehicle; viewport grid keeps controls on-screen. Tradeoff: compact UI replaces the earlier presentation-page composition.
- RED: 1366×768 browser test caught document height overflow. Camera test caught top node clipping in short landscape; framing corrected.
- Three.js 0.187.0 added; install audit reported zero vulnerabilities. Local procedural geometry, no model/texture network requests. Renderer uses current PCFShadowMap.
- StrictMode browser failure: forcing context loss during cleanup invalidated the reused canvas. Removed forced loss; renderer/geometry/material/shadow resources are disposed normally. Real WebGL and replay/level-switch tests pass.
- Performance RED→GREEN: useBridgeGame recreated graph on clock/animation renders, rebuilding all bridge meshes. Memoized by level fixed edges/player edges; hook test confirms identity remains stable on TICK/rerender and changes after construction.
- Independent final reviewer completed one read-only review. No Critical findings. Reported hidden-tab simulation gap was investigated against the full app, rather than the standalone hook.
- Final Ruling: hidden-tab finding rejected — useBridgeGame dispatches PAUSE on visibilitychange, which cancels both simulation and world RAF. Browser test confirms paused state, frozen canvas for 7.5 seconds, no automatic success, and successful explicit Resume. Cost if wrong: unusual real-device event ordering is still unverified and remains in device QA.
- Final: minor (deferred): automatic WebGL context recovery; current UI requests reload after context loss.
- Normal-motion coverage concern closed by the same visibility investigation test: live canvas changes, paused canvas does not. Initial screenshot comparison included the modal entrance transition; assertion now waits for that transition to finish before comparing frozen frames.
- Unit/component/hook 69/69, lint passed, production build passed with large-chunk warning (JS 830.65 kB / gzip 226.53 kB). Final browser suite and screenshots recorded in QA.

## Any construction can be tested — user correction, 2026-11-12
- User corrected the original rule that blocked roadGap/noSupport before START_TEST. Those are now simulated failed attempts; only invalid configuration/corrupt serialized graph is blocked.
- RED: four assertions failed for empty simulation, partial path, missing bracing and attempt progression. GREEN: 72/72 unit/component/hook tests.
- Gap simulation follows the reachable road path closest to the finish and falls at its end; disconnected segments are not crossed. Empty bridge uses the parked vehicle approach to the starting cliff. Partial path is deterministic under edge reorder/reversal.
- Failed result text distinguishes road gap from missing support. Retry preserves construction and attempts. LMS completion remains success-only; attempt definition clarified.
- Initial E2E fixture selected the inert header behind a success modal; corrected the fixture to use the visible Next button. No game behavior was changed to bypass modal protection.
- Normal-motion gap/fall screenshot and full browser regression suite are recorded in QA. Build passed, retaining the known Three.js chunk-size warning.
- Final verification: 72/72 unit/component/hook, 18/18 browser E2E (2.2 minutes), lint and build passed. Local server returned HTTP 200.

## Level 4 investigation — 2026-11-12
- Reproduced the confusing budget path: Level 3's adjacent-road/five-support construction costs 185 while Level 4 permits 150. Level 4 is solvable: roads A–C and C–E, supports A–F, C–F and E–F cost 139 and score 0.9 stability / three stars. B and D are optional, but the UI never explained that rule.
- Added a localized level-specific hint in the introduction, building status and budget rejection. Existing construction rules, budget and success threshold remain as designed.
- Browser regression first failed on the missing explanation, then passed through the complete construction, success and transition to Level 5. Added a level regression for the 139-versus-185 material costs.
- Unit/component/hook 73/73, lint and build passed (known large Three.js chunk warning). Touch runs passed all five levels at 360×800 and 800×360; Level 4 screenshots were visually inspected at both sizes and desktop.
- Two browser runs accidentally shared the Playwright artifact directory: the desktop run had an ENOENT trace-cleanup failure. Rerun desktop tests sequentially after mobile completion; do not run separate Playwright processes against the same output directory.
- Sequential desktop rerun passed 7/7 (57.2 seconds); together with the 2/2 mobile scenarios, all nine targeted browser scenarios passed. No remote push or deployment in this investigation.

## Collapse location correction — 2026-11-12
- Root cause: weakEdgeId ranked the damage caused by removing an edge. Removing any road disconnected the route, producing equal scores; the ID tie-break consistently selected the first road. Failure time then snapped to the closest node and was clamped to 20–85% of travel, preventing accurate late-span failure.
- Replaced removal ranking with per-span assessment along the selected vehicle route, using the existing connectivity, triangulation, support/span and vulnerability criteria. A failed run collapses at the first inadequate span's midpoint; later spans are reachable before failure. Overall success thresholds, budgets and star calculations remain unchanged.
- Affected road spans now fall together; without any bracing the entire road drops. Each mesh rotates about its own center, and the vehicle and bridge share the simulation clock so Pause freezes the collapse and Retry restores the original construction. Reduced motion shows the collapsed state without a prolonged fall.
- This remains a deterministic educational stability model, not a real-world structural dynamics solver. Discontinuous-road behavior remains a fall at the reachable gap.
- RED: five engine regressions reproduced the wrong span/timing and missing collapse set; one hook regression exposed the missing synchronized collapse clock. GREEN: beginning/middle/end support defects, reversed edge order, whole-road collapse, intact success and pause covered.
- Targeted Chrome scenarios passed 3/3: missing middle support, missing final support, wholly unsupported road, plus Retry and repair. Inspected the middle/final-collapse screenshots; the final-span case leaves A–B–C–D intact and drops D–E under the truck.
- Final verification: 79/79 unit/component/hook tests; 22/22 browser E2E in 2.7 minutes across desktop Chrome, mobile touch emulation and Edge; lint, production build and diff whitespace check passed. Known bundle-size warning remains (832.11 kB JS / 227.01 kB gzip). Changes stay local.

## Single JSX LMS delivery — 2026-11-12
- User requested two handoff files: complete game in one JSX plus one self-contained LMS implementation MD. Created `delivery/BridgeMaster.jsx` and `delivery/LMS-INTEGRATION.md`; existing features are bundled from their source rather than maintained in a separate implementation.
- Ruling: React is the sole host import; Three.js (including MIT license), CSS, levels and game modules are embedded. Wrapper default export mounts CSS/game and exports a contract-v1 manifest. Global CSS is deliberately isolated by the documented iframe boundary.
- Added repeatable `export:lms`, `check:lms`, `test:lms` and `preview:lms` scripts. The artifact check was initially RED because delivery did not exist, then GREEN. Export rejects additional assets/chunks. Corrected Vite's library-build array return and used current `codeSplitting:false` option.
- Export is reproducible at 1,412,978 bytes, SHA-256 `4930f22bea5b0d10f5dd92015ed46ca90b33277f604c45433945ddd5e57573c2`. Both imports are React; no external CSS, dynamic chunks or Node env references.
- Local harness bundles only the delivered JSX with host React/ReactDOM. Sandbox `allow-scripts` without same-origin and CSP `connect-src 'none'` were tested: all five levels, completion/event/exit callbacks, late-span collapse/repair, mobile no-scroll and actual WebGL. Browser observed exactly parent HTML, frame HTML and runner JS requests. Screenshots inspected.
- LMS E2E passed 3/3. Windows sandbox blocked automatic preview-server teardown; confirmed the exact owned process command line and stopped that preview process, after which Playwright exited 0. This extended wall time to 7.5 minutes; gameplay scenarios took about 38 seconds. Existing local Vite server was not stopped.
- Existing tests 79/79 and build passed. Lint exposed missing `.mjs` glob in the project's ESLint environment setup; included `.mjs` and lint passed. Rolldown 1.2.19 is now an explicit dev dependency for the parser used by the artifact check.
- Fresh independent read-only reviewer found no blocking issue. Minor missing final QA record in the MD was corrected. Production LMS upload/build/backend/outbox/ACK/reward and physical device tests are explicitly unimplemented/unverified in the handoff. No commit, push or deployment in this task.

## Workshop UI redesign — 2026-11-16
- The two supplied UI Variants ZIPs contain a workflow skill, not design screenshots. User delegated choosing and applying one design. Selected Workshop: ivory, forest green and amber, desktop side panel and mobile bottom controls, consistent intro/pause/result/level dialogs. Budget, progress, attempts and time use real state; game rules and LMS contract are preserved.
- Responsive regression assertions now inspect each actual toolbar button. Reproduced clipping at 1366×768 and 1024×701, plus level-dialog overflow at 1024×551; corrected spacing and independent compact-dialog breakpoints. Added state coverage for failure/retry, pause/resume, level selection, success and stars.
- Independent read-only reviewer found one accessible-name mismatch on Clear; corrected it. The suggested breakpoint checks reproduced the overflow and passed after correction. Desktop/mobile/landscape screenshots were visually reviewed.
- Final verification: **79/79** source tests, **30/30** main browser tests, **3/3** actual exported-JSX LMS tests, lint and production build passed. JS 835.36 kB / 228.12 kB gzip; known large-bundle warning remains. Details: `docs/qa/workshop-ui-2026-11-16.md`.
- Updated delivery JSX is 1,424,634 bytes; SHA-256 `c498a6301cb66e7783e9c66ac6c71ee21e8ee199fad1ee25ecc45f19ef446110`; repeat export matches. Handoff checksum and size updated. Temporary QA servers stopped. User requested commit/push of the complete current project on main and will run it themselves; no deployment.

## Twenty-level pack — 2026-11-16
- User requested expanding to 20 levels and updating the single final JSX. Original five JSON levels remain byte-for-byte unchanged. Added 15 layouts with sloped roads, lower bracing, two/three support hubs, prefabricated segments and material-saving constraints. Reference solutions are test-only; all 20 have legal three-star constructions within their budgets.
- Added five-card level pagination with current-page initialization, earned stars, keyboard focus trapping and final-level navigation. The main progress strip shows the current five-level group; UI no longer assumes five total levels.
- Manifest IDs now derive from the actual level list. Content version is 1.1.0 and callback contract stays v1. Artifact checks read the full JSON catalog, while source and LMS browser scenarios exercise all 20 levels.
- RED→GREEN: missing levels/pagination assertions; camera framing caught upper nodes outside the interaction margin, corrected by authoring new hubs at y >= 100. Browser checks caught phone footer clipping from long subtitles, corrected with compact short-phone cards and modal-relative bounds assertions.
- Source tests 96/96, lint and build passed. Independent read-only review found no actionable issue. Full verification and per-level reference material costs are recorded in `docs/qa/twenty-levels-2026-11-16.md`.
- Exported JSX is 1,448,388 bytes, SHA-256 `448fd1bf326710231593187b81ba84af52286c0a43ab7f9d0272dd3ddfd4afcd`; repeated export matches. No dependencies or engine rules changed.
- Final browser verification: **33/33** main scenarios (all 20 levels on desktop and both touch viewports), **3/3** exported-JSX LMS scenarios (20 three-star completions, 20 callbacks, matching manifest, offline sandbox, failure/repair/exit). Temporary QA servers stopped. Full pack is ready for the requested main commit/push.
