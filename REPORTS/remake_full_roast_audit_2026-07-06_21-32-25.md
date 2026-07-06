# Remake Full Roast Audit

Generated: 2026-07-06 21:32:25 Europe/Berlin  
Scope: `REMAKE/docs`, current plan/context, implemented remake scaffold, content data modules, engine services, tests, and current UI scaffold.  
Branch state inspected: clean `remake/parity`, latest tag visible during audit: `phase-2-data-values`.

## Executive Verdict

The project is in a better state than most remake starts: the source baseline is pinned, git history is sane, data extraction exists, and the TypeScript scaffold is not a mess. But the current implementation is still a data-port and spike harness, not a playable remake.

The biggest danger is status inflation. Several docs and checklist items blur the line between "we copied values into TypeScript" and "the game behaves like the original." That distinction matters because the next phase starts runtime behavior. If the team proceeds without fixing the state API semantics and without quarantining the spike UI, Phase 3 will build on sand.

This is not ready for gameplay implementation without a short hardening pass.

## Scope and Methodology

Inspected:

- `REMAKE/docs/plan.md`
- `REMAKE/docs/context.md`
- `REMAKE/docs/parity-checklist.md`
- `REMAKE/docs/changelog.md`
- engine modules under `REMAKE/src/engine`
- content modules under `REMAKE/src/content/original`
- UI scaffold under `REMAKE/src/ui`
- unit/e2e tests under `REMAKE/src/tests`

Checks run:

- `npm test`: 21 files, 80 tests passed
- `npm run build`: passed
- `npm run test:e2e`: 8 tests passed

Passing checks are real, but they currently prove the scaffold and data smoke tests, not gameplay parity.

## Findings

### High - StateStore Update Semantics Already Diverge From Original

Evidence:

- `REMAKE/src/engine/state/StateStore.ts:69` emits `stateName: rest.join(".")`.
- `REMAKE/src/tests/engine/state-store.test.ts:28` expects `{ category: "stores", stateName: "wood" }`.
- Original `state_manager.js` publishes the full changed state path as `stateName`, with category separately derived from it.

Why this matters:

Original modules check paths like `game.workers`, `game.population`, `stores`, and nested state prefixes. If the remake emits truncated paths, future listeners will silently fail or grow compatibility hacks. This is exactly the kind of small foundation bug that turns into scattered UI bugs later.

Recommendation:

Change `StateStore.fire()` to emit `stateName` as the original full path and keep `category` separate. Add tests for:

- `stores.wood`
- `stores["alien alloy"]`
- `game.workers["hunter"]`
- batch updates through `setM` and `addM`

### High - Store Clamping Is Incomplete and Path-Format Dependent

Evidence:

- `REMAKE/src/engine/state/StateStore.ts:40` only clamps when `path.startsWith("stores.")`.
- Original paths frequently use bracket notation: `stores["alien alloy"]`, `stores["cured meat"]`, etc.
- `StateStore.set()` does not clamp numeric store values at all.
- `REMAKE/src/tests/engine/state-store.test.ts:34-37` only tests dot-path `add("stores.wood", ...)`.

Why this matters:

The original StateManager clamps stores to non-negative values and caps numeric values at `MAX_STORE`. The remake currently lets `state.set('stores["wood"]', -1)` and oversized store values through. That is state corruption waiting for the first real room/outside implementation.

Recommendation:

Normalize parsed path tokens before deciding category. Clamp any path whose first token is `stores`, regardless of dot or bracket syntax. Clamp in both `set()` and `add()`. Add regression tests for bracket paths and `MAX_STORE`.

### High - Initial State Does Not Actually Match the Documented Original Categories

Evidence:

- `REMAKE/src/content/original/core/engineData.ts` correctly lists original categories including `timers`, `wait`, and `cooldown`.
- `REMAKE/src/engine/state/types.ts:1-12` omits `timers`, `wait`, and `cooldown`.
- `REMAKE/src/engine/state/types.ts:17-31` does not initialize those categories.

Why this matters:

The docs now claim state categories are represented, but the runtime state shape does not include all of them. That gap will surface when cooldowns, timers, waiting wanderers, or event scheduling move into real gameplay.

Recommendation:

Add the missing categories to `GameState` and `createInitialState()`, or explicitly document and test a deliberate replacement model. Right now it is neither original-compatible nor intentionally different.

### High - The Visible UI Violates Discovery Parity if It Survives Into Phase 3

Evidence:

- `REMAKE/src/ui/App.tsx:3` imports `SpikeLab`.
- `REMAKE/src/ui/App.tsx:32` renders `<SpikeLab />`.
- `REMAKE/src/ui/SpikeLab.tsx:11` exposes tabs `room`, `world`, and `space`.
- `REMAKE/src/tests/e2e/spike.spec.ts:7` and `:35` explicitly test visible `world` and `space` spike tabs.
- `REMAKE/docs/parity-checklist.md:194-204` requires future systems to remain hidden before original unlocks.

Why this matters:

The original game's most important trick is hiding its genre shifts. The current scaffold puts "world" and "space" in the first screen. As a risk spike this is acceptable; as soon as Phase 3 begins, it becomes a design violation.

Recommendation:

Move spike UI behind a dev-only route, query flag, or separate story page before implementing Room runtime. Add discovery tests that assert a fresh game exposes only the original starting affordances.

### High - Data Tests Prove Key Coverage, Not Full Data Fidelity

Evidence:

- `REMAKE/src/tests/content/room-data.test.ts` checks representative craftables with `toContainEqual`, not every craftable field.
- Similar representative tests exist for world, late-game, outside, and deferred manifests.
- Manifest tests mostly compare keys and selected constants, not full source-derived snapshots.

Why this matters:

The user asked for exact same game data. The current suite can miss a wrong cost, wrong message, wrong maximum, wrong audio ID, wrong threshold, or typo in any untested entry. This is not theoretical; hand-porting large content tables is exactly where subtle drift happens.

Recommendation:

Generate full canonical JSON snapshots from `ORIGINAL/` for all data tables that can be safely extracted, then compare entire arrays/objects. Keep representative tests for readability, but do not pretend they are parity coverage.

### High - Event Content Is Still the Largest Unported Gameplay Surface

Evidence:

- `REMAKE/docs/parity-checklist.md:96-105` has all event content coverage unchecked.
- `REMAKE/docs/parity-checklist.md:79-94`, `:107-121`, and `:123-136` leave outside, event runtime, and combat behavior mostly unimplemented.
- Current `REMAKE/src/content/original` contains no event scene data modules.

Why this matters:

For *A Dark Room*, events are not side content. They are the pacing engine, narrative delivery, combat delivery, rewards, and progression glue. A data port without event trees is still missing a large part of the game.

Recommendation:

Before or during Phase 3, create an event content extraction strategy. Do not wait until Phase 5 to discover that original callback-bearing scenes need a richer data model than the current table modules.

### Medium - The Context Document Is Stale and Misleads New Sessions

Evidence:

- `REMAKE/docs/context.md:3` says current phase is "pre-implementation planning and parity hardening."
- The implementation has progressed through scaffold, Phase 1 services, and Phase 2 data values.
- `REMAKE/docs/changelog.md:234` still says "No gameplay has been implemented yet", which is true, but `context.md` no longer explains the actual current implementation state.

Why this matters:

The user explicitly wanted README/context files so Codex can resume quickly. A stale context file is worse than no context because it causes the next agent to restart from the wrong mental model.

Recommendation:

Update `REMAKE/docs/context.md` after every milestone. It should currently say: Phase 2 data values complete, gameplay runtime not started, next recommended work is Phase 3 Room runtime hardening plus state API fixes.

### Medium - Architecture Boundary Tests Are Too Narrow for the Plan They Claim to Enforce

Evidence:

- `REMAKE/docs/plan.md` requires checks for engine/UI, data/UI, original/expansion boundaries, UI low-level mutation, and direct randomness.
- `REMAKE/src/tests/architecture-boundaries.test.ts` only checks engine imports and direct `Math.random()`.

Why this matters:

The architecture plan is good, but enforcement is partial. As soon as UI work begins, the easiest mistake will be mutating state directly from React components or importing UI into data helpers. No test catches that today.

Recommendation:

Extend architecture tests before Phase 3:

- `src/content/original` cannot import `src/ui`
- `src/content/original` cannot import `src/content/expansions`
- `src/ui` cannot import low-level `StateStore` mutation APIs directly
- tests should ignore generated files intentionally, not accidentally

### Medium - Source Commit Is Duplicated Instead of Imported From the Manifest Authority

Evidence:

- `REMAKE/src/engine/GameEngine.ts:11` hardcodes `SOURCE_COMMIT`.
- `REMAKE/src/content/original/manifest/canonicalManifest.ts:6-7` already exports `SOURCE_BASELINE_COMMIT`.

Why this matters:

The plan is strict about a single pinned baseline. Duplicating that value creates one more place to forget during a baseline refresh.

Recommendation:

Import `SOURCE_BASELINE_COMMIT` into `GameEngine` or pass source metadata through a content/config boundary. Do not duplicate baseline constants.

### Medium - E2E and 4K Coverage Is Still Mostly Theatre

Evidence:

- `REMAKE/playwright.config.ts` only tests 1920x1080 and 3840x2160.
- `REMAKE/docs/plan.md` and `REMAKE/docs/parity-checklist.md` require 1366x768, 1920x1080, 2560x1440, 3840x2160, and browser zoom checks.
- `REMAKE/src/tests/e2e/app.spec.ts` only checks the scaffold heading and status.
- `REMAKE/src/tests/e2e/spike.spec.ts` checks prototype visibility and one overflow condition.

Why this matters:

The project says 4K support is a requirement, but the current tests only prove a prototype did not horizontally overflow at two sizes. They do not validate actual Room, Outside, Path, event, combat, or world UI because those screens do not exist yet.

Recommendation:

Keep current spike tests, but do not count them as UI parity. Add viewport matrix and screenshot checks only when real screens exist. For Phase 3, start with fresh Room at 1366, 1920, 2560, and 3840.

### Medium - The Current UI Is Honest but Not Useful Gameplay

Evidence:

- `REMAKE/src/ui/App.tsx:15` renders "Gameplay is not implemented yet."
- `REMAKE/docs/changelog.md:234` says the app shell is explicitly not final gameplay state.

Why this matters:

This is fine for scaffolding, but it means "begin implementation" has not yet reached a player-facing vertical slice. From here on, every step should reduce scaffold surface, not decorate it.

Recommendation:

Phase 3 should start by replacing the scaffold first screen with the actual original fresh-start Room shell. Keep SpikeLab reachable only in dev tooling.

### Medium - Checklist `[~]` Status Is Ambiguous and Overused

Evidence:

- `REMAKE/docs/parity-checklist.md:83-92` marks multiple Outside runtime behaviors `[~]` although only data helpers exist.
- `REMAKE/docs/parity-checklist.md:175-185` marks ship/space formulas `[~]` although no runtime behavior consumes them.

Why this matters:

`[~]` currently means both "data exists" and "behavior partially implemented." That destroys the checklist's value as an implementation tracker.

Recommendation:

Split statuses into `data represented`, `runtime implemented`, and `UI verified`, or keep `[x]` only for behavior that is actually playable/tested. Data-only work should not mark runtime parity in progress unless there is executable behavior.

### Low - Localization Inventory Has an English Asymmetry That Needs a Note

Evidence:

- `originalLanguageCodes` includes `en`.
- `originalLocaleInventory` has 25 entries and does not include `en`.

Why this matters:

This may be correct because English is the default source language, but future localization work will trip over the asymmetry unless it is documented.

Recommendation:

Add a short note that `en` is source/default and has no `DATA/locales/en.md` inventory file.

## Game Evaluation

The game design target is well understood in the docs: preserve sparse discovery, keep genre shifts hidden, avoid tutorial prose, and defer audio/mobile/save migration. That part is solid.

The implementation has not yet proven it can execute the design. Current gameplay value is zero because there is no Room loop. The real test starts with Phase 3:

- fresh start must show only the original first affordance
- fire must reveal builder timing without extra explanation
- stores must appear at the original trigger point
- no hidden system can leak through tabs, labels, ARIA names, headings, or debug panels

The current spike UI would fail that instantly if shipped as part of the real app.

## UI Evaluation

The visual scaffold is restrained and not ugly. It uses monospace, simple borders, and avoids decorative noise. That matches the intended tone.

But it is not the game UI. It says "implementation scaffold", shows meta data, and exposes Phase 0.5 world/space prototypes. It is useful developer scaffolding, not parity UI.

Specific UI risk:

- Discovery is currently broken by visible `world` and `space` tabs.
- 4K checks are prototype-only.
- No actual Room, store list, notification stack, cooldown button, event panel, or combat panel exists.
- Accessibility has focus checks for spikes, not for game flows.

Verdict: acceptable as a lab bench; unacceptable as the first screen of the remake.

## Code and Architecture Evaluation

Good:

- Engine has separable services: command bus, event bus, cooldowns, clock, RNG, notifications.
- Content is separated under `content/original`.
- Source baseline drift checks exist.
- Direct `Math.random()` is blocked in source files.
- The codebase is still small and readable.

Bad:

- State semantics already diverge from original in ways likely to break module update handlers.
- Store clamping is incomplete.
- State category shape does not match documented original categories.
- Architecture boundary enforcement is underbuilt compared to the plan.
- Data tests rely heavily on sampled assertions and key lists.

Verdict: decent skeleton, but do not build gameplay on the current `StateStore` without fixing it.

## Test Evaluation

The test count looks healthier than the behavioral coverage really is.

What the tests prove:

- scaffold builds
- base services work in simple cases
- data modules expose many expected keys and representative values
- spike prototypes render

What the tests do not prove:

- original state update semantics
- bracket-path store clamping
- all room/outside/world/late-game data values
- event content parity
- discovery parity
- any real gameplay progression
- actual 1366/1440/zoom layout support
- full playthrough viability

The passing suite is not false; it is just early-stage. Treat it as scaffolding confidence, not remake confidence.

## Prioritized Next Actions

1. Fix `StateStore` semantics before Phase 3.
   - Full `stateName`, category from first path token, clamp stores for dot and bracket paths, initialize all original categories.

2. Quarantine `SpikeLab`.
   - Move it behind dev-only routing or remove it from default app render before Room runtime begins.

3. Update `REMAKE/docs/context.md`.
   - Current phase should reflect Phase 2 data completion and Phase 3 readiness work.

4. Tighten checklist semantics.
   - Do not use `[~]` for data-only representation on runtime parity lines.

5. Expand architecture-boundary tests.
   - Enforce the boundaries already promised in the plan.

6. Add full data snapshot parity checks where practical.
   - Use generated source-derived snapshots, not only hand-written representative assertions.

7. Start Phase 3 with a tiny vertical slice.
   - Fresh Room screen, light fire, stoke fire, fire state, temperature tick, notifications, and discovery tests.

## Checks Run

- `npm test`: passed, 21 files, 80 tests.
- `npm run build`: passed.
- `npm run test:e2e`: passed, 8 tests.
- `git status --short`: clean before report creation.

## Residual Risk

The largest unverified areas are exactly the areas that make the game: event runtime, event content, combat, world generation, discovery behavior, and end-to-end progression. The project is organized enough to proceed, but only after the state API and spike-UI issues are corrected. Otherwise Phase 3 will start by encoding accidental scaffold behavior into the actual remake.
