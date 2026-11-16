# Twenty-level pack

User approved extending the current five-level game to twenty and regenerating one final JSX. Existing Workshop design and engine remain the foundation. Implementation choices are delegated by the current request; no additional design approval is needed.

## Design

- Keep levels 1–5 unchanged. Add 6–20 as explicit JSON files with unique geometries, rising/falling road profiles, lower bracing, two/three support hubs, partial prefabricated structures and tighter material challenges. Do not add new physics rules.
- Each level has a legal, affordable, three-star reference solution kept only in test fixtures, plus a valid failing construction. Budget limits and hints support the intended puzzle.
- Show five level cards per page, four pages for the default pack. Open on the current level's page. Keep close and paging actions reachable on small screens. Replace the crowded twenty-step strip with five contextual steps plus the existing current/total label.
- Derive LMS manifest IDs from the imported level list and remove five-level assumptions from UI copy, artifact checks and tests. Export all twenty into the same `delivery/BridgeMaster.jsx`; contract v1 remains compatible, content version becomes 1.1.0.

## Implementation and verification

1. Extend failing level coverage to 20 legal three-star solutions and valid failed attempts; add level-selector pagination/current-page tests.
2. Author 15 new levels, solutions and hints. Validate legal edge construction, affordability, deterministic outcome and unique layouts.
3. Implement five-card pagination and contextual progress. Test keyboard paging/focus, current-page reopening and selection of level 20 at phone/landscape/desktop sizes.
4. Update manifest/export/check scripts and full-pack browser/LMS loops. All 20 levels must complete with real UI and emit one success callback per level in the exported opaque sandbox.
5. Run full source tests, lint, build, responsive and gameplay suites, then export/check and LMS tests. Inspect late-level screenshots. Update handoff checksum/size and QA docs, preserve existing commit/push authorization, stop temporary QA servers.

## Review focus

Budget must count player edges only; fixed edges must remain in weak constructions. New nodes must remain separately touchable. Final-level results must omit Next. Pagination must reveal all 20 without putting buttons outside the viewport, and reopening must select the current page. Manifest and exported runtime must describe the same pack.

## Completion evidence

Implemented and independently reviewed. 96 source tests, 33 main browser scenarios, 3 actual-JSX LMS scenarios, lint and build passed. All 20 levels completed on desktop and both touch layouts; exported runtime emitted 20 three-star completions. See `docs/qa/twenty-levels-2026-11-16.md` for budgets, regressions, artifact checksum and limits. Temporary QA servers stopped; commit/push and remote SHA verification are recorded in the final handoff.
