# Bridge Master UI variants implementation plan

**Goal:** Apply one coherent UI/UX redesign to the existing game, then commit and push for the user to run locally.

**Source:** `ui-variants-0.1.0.zip` and `ui-variants-kit-0.1.0.zip` contain a skill, not target screenshots. Both describe comparing alternatives, states and page context with real iframe dimensions.

**Architecture:** Keep the existing real reducer, scene, simulation and LMS contract. Redesign the production shell, toolbar, dialogs and styles. Desktop has a left construction panel and large right scene; mobile places controls below the scene. Regenerate the single-file LMS artifact from the same source.

**Tech Stack:** Existing React, CSS, Three.js, Vite, Vitest and Playwright; no new dependencies or hosted service.

## Decisions and authorization

- User requested design/UX work followed by commit and push; user will run the project. No deployment or persistent preview server.
- User explicitly chose: “Bitta dizaynni o‘zing tanlab qo‘lla”. This authorizes choosing and implementing one direction without a gallery or further design approval.
- Work in the current checkout on main, preserving existing changes and including the already audited LMS handoff in the requested complete repository push.
- Chosen by the implementer: Workshop. Persistent side controls provide clear material and tool grouping; the scene stays large. Expedition's horizontal layout resembles the current UI; Focus hides too much guidance for new pupils.
- Warm ivory, forest green and amber; stronger readable hierarchy, explicit tool labels and consistent modal treatment. Uzbek UI, existing gameplay rules and callbacks preserved.
- ZIP files are process references, not visual target screenshots. No synthetic student records or gallery controls enter the game.

## Tasks

- [x] Redesign the main shell and desktop/mobile toolbar, preserving engine and accessible control names.
- [x] Apply consistent intro, pause, result, exit and level-selection designs with real state-derived progress.
- [x] Validate responsive controls, state transitions and keyboard use; inspect screenshots.
- [x] Update README and review record, regenerate/check LMS, run source tests/lint/build and browser tests.

Delivery procedure: review the complete staged diff, commit and push main, then verify remote HEAD equals local HEAD. Record the resulting commit in the final handoff. Temporary QA servers have been stopped.

## Review focus

- Short landscape screens must keep controls and modal actions reachable.
- Retry, next and level selection must still use real reducer transitions.
- Node hit areas remain aligned with the Three.js camera and at least 44 CSS pixels.
- Keyboard focus and modal actions remain reachable in all states.
- The LMS export uses the exact same redesigned interface and retains the callback contract.

## Decision record

Revision: 1. User delegated final design selection to the implementer; Workshop selected. The earlier tentative gallery test was removed before implementation after the user's clarification. No gallery or preview-only production branches are needed.
