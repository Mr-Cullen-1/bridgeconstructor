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
