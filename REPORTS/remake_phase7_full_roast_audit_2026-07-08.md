# REMAKE Phase 7 Full Roast Audit

Date: 2026-07-08  
Scope: REMAKE after Phase 7 Path/outfitting finalization, before Phase 8 World hardening  
Auditor: Codex using `roasting-audit`

## Executive Verdict

Phase 7 is in decent shape for the narrow Path/outfitting surface. The Compass reveal, carried supply controls, carryable ordering, capacity/weight math, safe return, repeated embark, and desktop visual regressions are covered by a serious test matrix. The project is not pretending the whole game is done, and that restraint matters.

The problem is that the next phase sits on a World runtime that is still a deliberately fake slice. If Phase 8 starts by layering content on top of the current `WorldRuntime`, it will bake in the wrong abstraction. The map generation, landmark placement, roads, outpost behavior, starvation/thirst death loops, ship discovery, mine outcomes, and true world persistence are not rough edges. They are the game.

There is also one concrete state-integrity bug candidate: `WorldRuntime.returnHome()` can be dispatched while no expedition is active and still returns outfit to stores. The production UI does not expose that path, but the runtime/session command boundary does. That is exactly the kind of "only test harness can do it" weakness that becomes a real bug once restore, events, or new Phase 8 controls start reusing the command.

Bottom line: Phase 7 can be accepted, but Phase 8 should begin with World contract hardening, not more content wiring.

## Scope and Methodology

Audited surfaces:

- Code quality and architecture
- Runtime behavior and state correctness
- Game progression and original-data fidelity
- UI/UX, accessibility, and layout resilience
- Tests, tooling, and maintainability
- Documentation and scope alignment

Inspected representative files:

- `REMAKE/src/engine/path/PathRuntime.ts`
- `REMAKE/src/engine/path/pathOutfit.ts`
- `REMAKE/src/engine/world/WorldRuntime.ts`
- `REMAKE/src/engine/GameSession.ts`
- `REMAKE/src/engine/state/StateStore.ts`
- `REMAKE/src/ui/PathView.tsx`
- `REMAKE/src/ui/WorldView.tsx`
- `REMAKE/src/ui/StoresPanel.tsx`
- `REMAKE/src/ui/styles/global.css`
- `REMAKE/src/tests/engine/game-session.test.ts`
- `REMAKE/src/tests/e2e/app.spec.ts`
- `REMAKE/docs/context.md`
- `REMAKE/docs/parity-checklist.md`
- `REMAKE/docs/plan.md`
- `REMAKE/docs/README.md`
- `REMAKE/package.json`
- Original reference: `ORIGINAL/script/path.js`, `ORIGINAL/css/path.css`, `ORIGINAL/css/main.css`

Checks run:

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run format:check`
- `npx playwright test`

## Findings

### High - `world.returnHome` Is Not Idempotent and Has No Active-Expedition Guard

Evidence:

- `REMAKE/src/engine/world/WorldRuntime.ts:254` defines `returnHome()` and only checks that the current/default position is the village.
- `REMAKE/src/engine/world/WorldRuntime.ts:257` calls `this.returnOutfitToStores()` before closing the expedition.
- `REMAKE/src/engine/GameSession.ts:262` exposes `returnFromWorld()` as a public session method.
- `REMAKE/src/engine/GameSession.ts:370` registers the `world.returnHome` command and trusts `world.returnHome()` to decide validity.
- `REMAKE/src/tests/engine/game-session.test.ts` has repeated safe-expedition tests, but no regression proving that a second inactive return does not credit stores again.

Why this is fragile:

The UI hides `WorldView` when `snapshot.active` is false, so the normal player path is protected. The runtime is not. After a valid return, the player can be at Path with carried outfit still selected. A second `world.returnHome` dispatch while inactive can add that carried outfit to stores again because `returnHome()` defaults missing world position to the village and never checks `game.world.active`.

That is a state-corruption bug waiting for Phase 8. Once world restore, events, outpost returns, or new navigation commands expand, this command boundary becomes easier to hit accidentally.

Recommendation:

- Add `if (!this.active()) return false;` at the top of `WorldRuntime.returnHome()`.
- Add a session regression test:
  - embark with `cured meat`
  - return home once
  - call `session.returnFromWorld()` again
  - assert stores/outfit did not change and no duplicate return notification fired.
- Consider making all World commands guard `active()` unless explicitly valid while inactive.

### High - Phase 8 Must Replace the World Slice, Not Decorate It

Evidence:

- `REMAKE/src/engine/world/WorldRuntime.ts:155` hard-codes `FIXED_LANDMARKS`.
- `REMAKE/src/engine/world/WorldRuntime.ts:322` renders a compact radius-4 viewport.
- `REMAKE/src/engine/world/WorldRuntime.ts:356` uses `coordinateRoll()` for deterministic terrain instead of original world generation.
- `REMAKE/src/engine/world/WorldRuntime.ts:408` implements that terrain roll with a sine hash.
- `REMAKE/docs/parity-checklist.md:204` says World map dimensions are only internally represented and production viewport is a compact first slice.
- `REMAKE/docs/parity-checklist.md:206` says terrain generation is deterministic/playable but not original.
- `REMAKE/docs/parity-checklist.md:207` says landmark placement is fixed and original counts/radii remain open.
- `REMAKE/docs/parity-checklist.md:208` says roads are not generated.

Why this is fragile:

The current World runtime is good enough as a Path consumer. It is not a foundation for original World parity. If Phase 8 starts by adding outposts, mines, ship discovery, and more setpieces to this map, the implementation will grow around a fake coordinate model and then become expensive to unwind.

Recommendation:

- Start Phase 8 by porting and testing the original world generation contract: terrain probabilities/stickiness, road generation, landmark placement constraints, visibility persistence, and ship placement.
- Keep current fixed landmarks only as a compatibility fixture until replaced.
- Add data-level tests against extracted original world constants and scenario-level tests for landmark radius/count invariants before adding new World UI content.

### Medium - Phase 7 Closure Is Mostly Correct, but Some Docs Still Carry Old Phase-7 Framing

Evidence:

- `REMAKE/docs/context.md:96` still has the heading `Phase 7 kickoff gate:` after the document now says to proceed with Phase 8.
- `REMAKE/docs/plan.md:705` still says `Phase 8 constraint before Phase 7 completion:` even though Phase 7 is now marked complete for Path/outfitting scope.
- `REMAKE/docs/parity-checklist.md:187` marks full Phase 7 Path parity complete for Path/outfitting scope, while explicitly tracking World/ship/map expansion under Phase 8.

Why this is fragile:

The status is defensible, but the document wording is inconsistent. That inconsistency is small today and poisonous later. Phase-based projects rot when old gates survive after closure; people follow stale headings and reopen the wrong surface.

Recommendation:

- Rename `Phase 7 kickoff gate` to `Phase 8 entry guardrails`.
- Rename `Phase 8 constraint before Phase 7 completion` to `Phase 8 constraints inherited from Phase 7`.
- Keep the Phase 7 completion claim scoped exactly as it is now: Path/outfitting only, not World.

### Medium - Organic Reachability Coverage Is Valuable but Too Narrow

Evidence:

- `REMAKE/src/tests/e2e/app.spec.ts:995` contains the organic fresh-room-to-Path-to-World-return test.
- `REMAKE/src/tests/e2e/app.spec.ts:998` skips that test for every project except `chromium-1920`.
- Full Playwright run passes with `205 passed, 3 skipped`; the skipped tests are this organic scenario on non-1920 projects.

Why this is fragile:

The organic test is the best player-facing proof in the suite. It verifies a real progression path through economy, Compass, Path, embark, movement, and return without direct state injection. Running it only at 1920 is understandable for runtime cost, but it leaves 1366 and 4K organic progression as assumed rather than proven.

The visual tests cover layout at those widths. They do not prove the long economy progression works there.

Recommendation:

- Keep the full organic test at 1920.
- Add a cheaper "prebaked organic continuation" at 1366 and 3840: use minimal natural progression or a dev snapshot to start near Compass purchase, then buy Compass, check reveal, outfit, embark, and return.
- Alternatively run the full organic path nightly across all projects while keeping PR checks at 1920.

### Medium - Tooling Is Race-Prone Because ESLint Scans Generated Test Output

Evidence:

- `REMAKE/package.json:10` runs `eslint .`.
- `REMAKE/eslint.config.js` ignores `dist/**`, `node_modules/**`, and visual snapshot folders, but not `test-results/**`.
- During this work, running lint concurrently with Playwright produced `ENOENT: no such file or directory, scandir 'F:\ADR20\REMAKE\test-results'` while Playwright was creating/removing test output.
- Running `npm run lint` alone passes.

Why this is fragile:

This is not a code-quality failure, but it is a CI ergonomics failure. A developer or CI job that parallelizes checks can get a false red build because lint walks Playwright's generated output while Playwright mutates it.

Recommendation:

- Add `test-results/**` and `playwright-report/**` to ESLint ignores.
- Optionally narrow lint to source/config files instead of `eslint .`.

### Low - Build Already Exceeds Vite's Default Chunk Warning

Evidence:

- `npm run build` passes.
- Vite reports `dist/assets/index-*.js` at about `515.52 kB` and warns that some chunks are larger than `500 kB` after minification.
- `REMAKE/package.json` has no production code splitting or chunk-warning policy.

Why this matters:

This is not currently breaking the desktop prototype. It is an early warning that the single bundle is already over the default warning threshold before full World, Ship, Fabricator, Space, and ending are implemented.

Recommendation:

- Do not chase this before Phase 8 behavior is correct.
- Add a tracked decision: either accept a higher warning threshold during parity, or split late-game-heavy data/runtime code once the architecture stabilizes.

### Low - The Status Docs Are Too Monolithic to Stay Reliable

Evidence:

- `REMAKE/docs/context.md` contains a very long current-status block covering multiple phases, executioner/setpiece catalogs, UI hardening, and next-phase rules.
- `REMAKE/docs/changelog.md` is doing real historical work but is now huge enough that small phase-status edits are easy to bury.

Why this matters:

The project has enough surface area that a single mega-context page is now a liability. It is useful as a session bootstrap, but it is not a durable source of truth for phase gates. The risk is not readability aesthetics; the risk is stale phase language hiding in a wall of correct detail.

Recommendation:

- Keep `context.md` short and current.
- Move detailed phase histories into phase-specific status files, e.g. `docs/status/phase-7-path.md` and `docs/status/phase-8-world.md`.
- Keep `parity-checklist.md` as the canonical pass/fail tracker.

## Game Evaluation

The current game loop is finally player-legible through the early/mid-game path:

- Room starts clean.
- Outside/Village progression is reachable.
- Compass can be purchased organically.
- `A Dusty Path` is revealed.
- Cured Meat can be carried.
- Embark opens a World slice.
- The player can move, see a landmark, return, and recover Path state.

That is real progress. The roast: the World is still a cardboard set. It has the shape of a map, not the original map. It consumes food/water counters, but starvation/thirst are notifications rather than the real death/perk loop. It has landmarks, but fixed fixtures instead of original distribution. It can enter focused setpiece bridges, but most of that content is test-harness reachable rather than player-discovered through a faithful world.

For Phase 8, the core question is not "which setpiece do we wire next?" It is "what world-generation and persistence contract will every later setpiece depend on?"

## UI Evaluation

The Path UI is now much closer to the original:

- Supply rows show carried count only.
- Available count lives in tooltip text.
- Single/many controls use arrow-style buttons with accessible names.
- Full carryable list scrolls inside the Path play column instead of blowing out the document.
- Visual baselines cover Path at 1366, 1920, 2560, and 3840 widths.

The minimalist direction is still intact. There is no tutorial spam, no marketing-page drift, and no premature Ship/Fabricator/Space UI.

Remaining UI risks:

- Native `title` tooltips are acceptable for parity scaffolding but weak for keyboard/touch accessibility later.
- World UI is intentionally sparse and will need rework once original map size, roads, visibility, danger, and landmarks land.
- The debug settings tab is correctly hidden by default, but all future debugging affordances need the same discipline.

## Code and Architecture Evaluation

Good:

- `GameSession` provides a real command boundary.
- Path/outfit helpers are centralized in `pathOutfit.ts`.
- Path and World share max-health/max-water/safe-return helpers instead of duplicating upgrade logic.
- State access is mostly structured through selectors and the `StateStore`.
- Combat is correctly isolated behind `CombatRuntime`, not smeared into the event runtime.

Bad or fragile:

- World command methods are not uniformly guarded by `active()`.
- The current World generator is not a generator in the original-game sense.
- Docs still carry some old phase headings.
- Lint tooling can race generated test output.

The architecture is good enough to continue, but Phase 8 should harden World invariants before adding more content.

## Test Evaluation

Strong:

- `npm test` passes with 28 test files and 302 tests.
- Full Playwright passes with 205 tests passed and 3 project-skipped organic tests.
- Path has direct engine tests for carryable ordering, command-boundary rejection, normalization, upgrade priority, safe return, repeated embark, and all-food-consumed return.
- Path has browser/visual coverage for full carryable list overflow and original control rendering.

Weak:

- No test proves `world.returnHome` is a no-op when inactive.
- The best organic progression test only runs at 1920.
- Full playthrough smoke remains unchecked in `parity-checklist.md`.
- The test suite is large, but many late-game routes are still harness-level proofs, not player traversal proofs.

## Prioritized Next Actions

1. Fix `WorldRuntime.returnHome()` active guarding and add an inactive-return duplication regression.
2. Rename the stale Phase 7 headings in `context.md` and `plan.md`.
3. Start Phase 8 by porting original World generation/visibility/landmark contracts, not by adding more fixed landmarks.
4. Add `test-results/**` and `playwright-report/**` to ESLint ignores.
5. Add at least a reduced organic Compass/Path/World smoke at 1366 and 3840, or schedule the full organic test nightly across all desktop projects.
6. Decide whether the Vite chunk warning is accepted during parity or should trigger code splitting later.
7. Split long-running phase status into phase-specific docs so `context.md` stops becoming the dumping ground.

## Checks Run

All checks passed unless noted.

- `npm run build`
  - Passed.
  - Residual warning: Vite chunk over 500 kB, current JS bundle about 515.52 kB minified.
- `npm test`
  - Passed: 28 test files, 302 tests.
- `npm run lint`
  - Passed when run alone.
  - Observed tooling hazard when run concurrently with Playwright because ESLint can scan `test-results`.
- `npm run format:check`
  - Passed.
- `npx playwright test`
  - Passed: 205 passed, 3 skipped.

## Residual Risk

This audit did not prove full original World parity, full setpiece traversal parity, executioner exhaustiveness, Ship/Fabricator/Space behavior, durable save migration, mobile support, or audio. Those are explicitly outside the completed Phase 7 scope.

The biggest immediate risk is not that Phase 7 is broken. The biggest immediate risk is building Phase 8 on the current placeholder World model without first replacing its map-generation and lifecycle contracts.
