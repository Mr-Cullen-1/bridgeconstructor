# Single JSX LMS delivery implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Deliver the existing complete game as one uploadable JSX and one Uzbek developer handoff Markdown file.

**Architecture:** Generate an ES module from the existing game, inline CSS/levels/Three.js, and leave only React as a host dependency. Verify the actual delivered file in an isolated LMS-like iframe. The LMS team owns upload, compilation, sandbox, durable results and publishing; updating a compatible game then requires uploading a new JSX only.

**Tech Stack:** Existing Vite/Rolldown, React 19, Three.js, Playwright.

**Spec:** User request, 2026-11-12: all existing design, animation, logic and mechanics in one JSX; one MD explaining the required LMS implementation.

## Constraints and decisions
- Preserve all five levels, viewport layout, interactions and current collapse mechanics.
- Delivery directory contains `BridgeMaster.jsx` and `LMS-INTEGRATION.md` only.
- Bundle Three.js and its license; no CSS/JSON/model/font/image companion files or CDN.
- React is supplied by the LMS once. The game does not mount its own root or send backend requests.
- Use a sandboxed iframe as the documented integration boundary; global game CSS remains confined to its document.
- Existing success/exit/event callbacks remain the gameplay contract. No live LMS access or publication is part of this request.
- Existing source stays maintainable; `npm run export:lms` regenerates the upload artifact after future changes.

## Review focus
- Missing chunks, unresolved local imports and CSS lost during export.
- Duplicate React, development-only code or runtime import mismatch.
- Sandbox restrictions breaking WebGL, secure UUIDs, audio or styling.
- Completion meaning one level rather than all five, retries and duplicate rewards.
- File replacement/version/cache handling without changing an active learner's revision.

## Tasks
1. [x] Add a failing artifact check for a valid default export/manifest, React-only imports and one generated file; implement the wrapper/export script and run it.
2. [x] Build a local isolated iframe harness from the delivered JSX alone; verify all five levels, callbacks, failed attempt/repair, 3D, no-scroll and no runtime network dependencies. Verify representative mobile size and late-span collapse.
3. [x] Write a self-contained Uzbek LMS handoff: exact runtime and props, upload/build lifecycle, sandbox/CSP, parent bridge, durable callback delivery, validation/idempotency, versioning, completion policy and acceptance checks. Distinguish the proposed LMS contract from a verified live integration.
4. [x] Run artifact checks, appropriate source checks and browser QA; record byte size/hash and link both deliverables to the user.

Execution authorization is the user's explicit request to prepare both artifacts. No separate product feature or deployment is introduced.
