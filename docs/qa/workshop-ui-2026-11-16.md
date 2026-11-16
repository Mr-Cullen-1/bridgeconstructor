# Workshop UI review — 2026-11-16

## Scope and design source

The supplied `ui-variants-0.1.0.zip` and `ui-variants-kit-0.1.0.zip` contain a design-workflow skill, not target UI screenshots. The user explicitly selected one implementer-chosen design: “Bitta dizaynni o‘zing tanlab qo‘lla”. The production game now uses the Workshop direction; there is no variant gallery.

Warm ivory panels, forest-green controls and amber accents frame the existing 3D scene. Desktop tools occupy the left panel; mobile tools sit below the scene. Intro, pause, failed/success results, exit and level selection share the same visual language. Budget, remaining material, progress and result summaries use actual game state. Existing engine rules, camera input and LMS callbacks remain in place.

## Verified evidence

- Source unit/component/hook tests: **79/79 passed**.
- Full browser regression: **30/30 passed** in 3.7 minutes across desktop Chrome, mobile touch emulation and Edge; 11 viewport sizes plus the complete gameplay and dialog-state suites.
- Exported JSX browser regression: **3/3 passed**. All five levels, completion/event/exit callbacks, late-span collapse and repair, mobile layout, opaque iframe isolation and offline runtime behavior were verified using the actual delivery file.
- ESLint: passed.
- Production build: passed; JS **835.36 kB / 228.12 kB gzip**, CSS **22.08 kB / 5.55 kB gzip**. The existing large-chunk warning remains.
- Additional breakpoint regression: **4/4 passed** at 1024×551, 1024×600, 1024×701 and 1024×741 after reproducing and fixing the failures below.
- Screenshots inspected for desktop, phone and short landscape, including building, introduction, failure, pause, level selection and success. Generated locally in `output/playwright/` by the checked-in tests.
- Read-only review found a label mismatch on Clear: visible “Tozalash” was absent from its accessible name. The name now includes both “Qayta qurish” and “Tozalash”. No other confirmed important regression was reported.

## Reproduced and fixed layout issues

1. The original viewport assertion checked the toolbar container only. The new per-button assertion exposed the Test button extending below 1366×768; compact desktop spacing corrected it.
2. At 1024×701, the goal note reappeared and pushed Test to 715.56 px. The note now stays hidden through 740 px; the 741 px case verifies the next layout boundary.
3. At 1024×551, level-selection actions extended beyond the viewport. Compact desktop dialogs now apply through 650 px independently of the narrow landscape game layout.

The viewport suite checks real button bounds, dialog actions, WebGL scene visibility and successful construction. State tests cover failure → retry, pause → resume, level selection → close, success, real attempt count and earned stars. Existing suites cover all five levels, keyboard/touch input, camera alignment, hidden-tab pause, collapse/repair, exit/restart and Edge.

## LMS artifact

`delivery/BridgeMaster.jsx` is regenerated from the same source UI; React remains the only external import. Contract v1 is unchanged. Size: **1,424,634 bytes**. SHA-256: `c498a6301cb66e7783e9c66ac6c71ee21e8ee199fad1ee25ecc45f19ef446110`.

Repeated export produced the same checksum. Temporary Vite and LMS preview servers were stopped after verification. On Windows, LMS runner teardown required stopping its confirmed server PID; Playwright then exited 0.

## Limits

Mobile checks use Chrome viewport/touch emulation. Physical phones, Safari, formal screen-reader auditing, student usability sessions and live LMS/backend integration have not been tested. The source and sandbox LMS harness do not establish live deployment or persisted student progress. The user will run the project locally; no deployment is requested.
