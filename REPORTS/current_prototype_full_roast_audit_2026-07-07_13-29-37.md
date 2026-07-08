# Current Prototype Full Roast Audit

Date: 2026-07-07 13:29:37  
Scope: `REMAKE/` prototype, gameplay progress through finalized Phase 5, code architecture, UI/UX, balancing, feature completeness, tests, tooling, and documentation.

## Executive Verdict

This is a strong parity scaffold, not yet a strong game prototype.

The good news: Phases 0-5 are materially better than most rewrites at this stage. The project has a pinned source baseline, extracted canonical data, deterministic headless runtimes, serious test coverage, full browser checks, visual baselines, and honest scope documents. The Room and Outside loops are playable and close to original pacing. The event runtime now covers the intended non-combat Global/Room/Outside/Marketing pools.

The hard truth: the prototype currently stops right before _A Dark Room_ becomes _A Dark Room_. There is no real Path outfitting, no world map, no exploration loop, no full combat economy, no setpieces, no mines, no ship, no space, no ending, and no durable save. The implemented slice is a technically disciplined opening act, but product/gameplay evaluation beyond village/events is mostly theoretical. Calling Phase 5 finalized is fair only because the boundary is carefully defined. Calling the game prototype compelling would be premature.

## Scope And Methodology

Inspected:

- Project status and parity docs: `REMAKE/docs/context.md`, `REMAKE/docs/parity-checklist.md`, `REMAKE/docs/deviations.md`, `REMAKE/docs/changelog.md`.
- Runtime architecture: `GameSession`, `RoomRuntime`, `OutsideRuntime`, `EventRuntime`, clock/state/save systems.
- UI implementation and CSS: `App`, `RoomView`, `OutsideView`, `EventPanel`, `StoresPanel`, `global.css`.
- Event content and coverage tests.
- E2E/visual tests and test harness usage.
- Representative screenshots captured under `REPORTS/audit-assets/`.

Checks run:

- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm test`
- `npm run test:e2e`

Results:

- Format check passed.
- Lint passed.
- Production build passed.
- Unit tests passed: 150 tests.
- Playwright tests passed: 164 tests.

## Findings

### High: The Prototype Is Still More Parity Harness Than Game

Evidence:

- `REMAKE/docs/context.md:3` says Phase 5 is finalized only for non-combat Global/Room/Outside/Marketing pools and explicitly pushes full encounter coverage, Path/outfit integration, setpieces, executioner events, and World map application to later work.
- `REMAKE/docs/parity-checklist.md:148-189` leaves Path, World, Ship, Fabricator, Space, Ending, and Prestige open.
- The screenshots confirm the live experience is currently sparse Room/Village/Event state, not the expedition/core-survival arc.

Why this matters:

The opening loop is implemented with admirable rigor, but the design risk of _A Dark Room_ lives in the transition from quiet room to path/world/combat/setpieces. The current build proves the foundation can support the first act. It does not yet prove the actual game arc.

Recommendation:

Treat the current prototype as a validated engine/content/UI foundation. Do not use it for final game-feel, pacing, or retention judgment until Phase 7/8 at minimum. Phase 6 should be framed as risk burn-down for combat correctness, not just "add more enemies."

### High: Scout `World.applyMap` Is a Bridge, Not a Working Feature

Evidence:

- `REMAKE/src/content/original/events/eventData.ts:674` defines `room.scout`.
- `REMAKE/src/content/original/events/eventData.ts:688-694` wires `buyMap` to `context.applyMap()`.
- `REMAKE/src/engine/events/EventRuntime.ts:95` makes `applyMap` optional.
- `REMAKE/src/engine/events/EventRuntime.ts:856` calls `this.effectHandlers.applyMap?.()`.
- `REMAKE/src/engine/GameSession.ts:68-70` injects `killVillagers` and `destroyHuts`, but does not inject `applyMap`.

Why this matters:

In a production `GameSession`, buying the Scout map can spend resources and show the notification while doing nothing to world state. Today that is partly hidden because World/Path are not live. Tomorrow it becomes a subtle parity bug unless the bridge is wired before the Scout event becomes naturally reachable.

Recommendation:

Before Phase 7/8 exposes the Scout path naturally, make `applyMap` either a required handler when World is unlocked or a concrete event-side command that fails visibly when unsupported. Add a `GameSession` integration test proving `buyMap` changes `game.world.mask` once World exists.

### High: Combat Exists in a Vacuum, So Balance Conclusions Are Not Trustworthy

Evidence:

- `REMAKE/src/engine/events/EventRuntime.ts:413` starts combat directly from an event scene.
- `REMAKE/src/engine/events/EventRuntime.ts:490` derives usable weapons from `outfit`, but there is no real Path/outfitting runtime yet.
- `REMAKE/src/engine/events/EventRuntime.ts:594-596` sets `character.dead` on death, but death return/outfit handling is still open in `REMAKE/docs/parity-checklist.md:144-145`.
- `REMAKE/src/tests/e2e/app.spec.ts:653-656` triggers the representative combat encounter directly with a test harness and injected grenade.

Why this matters:

The combat code has useful formulas and timings, but the actual balance of combat depends on how the player gets weapons, food, medicine, inventory capacity, world distance, enemy selection, loot return, and death consequences. Right now combat is technically testable, but not game-balanced.

Recommendation:

In Phase 6, avoid adding encounter data blindly. First wire a minimal Path/outfit contract or a hard test double that exactly mirrors the future contract. Then add death/outfit/loot capacity behavior before expanding the enemy list.

### High: E2E Coverage Is Broad, But Much of It Is State Injection Theater

Evidence:

- `REMAKE/src/tests/e2e/app.spec.ts:9-16` exposes `setState`.
- Many E2E tests use direct state injection: examples at `app.spec.ts:107-108`, `129-130`, `311-316`, `327-342`, `423-427`, and `567-568`.
- The best organic browser test is `app.spec.ts:509`, which naturally reaches Phase 4 workers, but there is no comparable organic Phase 5 random-event progression test across the full non-combat event set.

Why this matters:

State injection is appropriate for layout and deterministic setup. It is not a substitute for proving the game can naturally travel through its own progression without hidden state assumptions. Right now the suite is excellent at verifying pieces, but weaker at catching integration pacing failures.

Recommendation:

Add a small number of high-value organic scenario tests:

- Fresh start to first random Room event without direct event trigger.
- Fresh start to Outside population plus one naturally scheduled Outside event.
- Dev-save/load during active event plus delayed event reward using browser flow.
- Later, fresh start to Path unlock and first expedition.

### Medium: `EventRuntime.restoreLifecycle()` Is Too Easy To Misuse

Evidence:

- `REMAKE/src/engine/events/EventRuntime.ts:270-287` clears the enemy attack timer but drops `eventTimer` and `pendingDelayedActions` references without clearing those timers directly.
- `REMAKE/src/engine/GameEngine.ts:103-107` currently prevents dev-save corruption by calling `clock.restoreNow()`, which clears all manual clock timers before runtime lifecycle restore.

Why this matters:

The current dev-save path is okay because the engine clears timers first. The runtime method itself is not self-contained. If a future caller uses `EventRuntime.restoreLifecycle()` without first resetting the clock, stale event and delayed-action timers can survive.

Recommendation:

Make each runtime restore method locally safe: clear its own known timers and pending delayed-action timers before resetting fields. Do not rely on the caller's restore order for correctness.

### Medium: The UI Is Original-Near, But Fragile By Construction

Evidence:

- `REMAKE/src/ui/styles/global.css:43` centers a fixed-width shell.
- `global.css:180` positions notifications absolutely.
- `global.css:231` lays Outside out with fixed grid columns.
- `global.css:626` positions the event panel absolutely with fixed top/left and width constraints.
- `global.css:800` contains a responsive fallback, but mobile support is explicitly deferred.

Why this matters:

This layout successfully preserves the original desktop feel, and the visual tests prove it is stable across the configured desktop widths. But it is not robust in the way a modern app layout would be robust. It is a carefully tuned stage set. Add Path/World/Combat panels without discipline and overlap problems will come back fast.

Recommendation:

Before Phase 7/8, define layout slots for Path and World with the same rigor used for Room/Outside. Do not let each new feature invent its own panel geometry.

### Medium: The Notification Log Is Useful, But It Can Become Noise

Evidence:

- The event/combat screenshots show old builder and outside notifications stacking in the left rail while event content appears in the center.
- `global.css:180` gives notifications a 700px fixed-height area with fade.

Why this matters:

The original game uses notifications as atmosphere and feedback. The current log preserves that, but by the time workers/events/combat are active, the rail can become a mixed stream of old story beats, production messages, and event alerts. It is readable, but not always meaningful.

Recommendation:

Keep source filtering in the engine, and consider UI-level grouping or source-aware fading later. Do not add more notification volume in Phase 6 without revisiting this.

### Medium: The Debug Tooling Is Helpful But Product-Adjacent

Evidence:

- `REMAKE/docs/deviations.md:80-90` documents the debug settings tab.
- `REPORTS/audit-assets/debug-settings.png` shows it is cleanly gated behind `?debug=1`.

Why this matters:

The debug panel is useful and currently hidden by default. The risk is cultural: once a tool like this exists, tests and manual verification can lean too hard on accelerated or injected states and miss natural pacing.

Recommendation:

Keep `?debug=1` out of all player-parity screenshots except debug-specific coverage. Continue to maintain at least one organic progression scenario per implemented phase.

### Low: Event Modal Accessibility Is Better Than Original, But Still Not Complete

Evidence:

- `REMAKE/src/ui/EventPanel.tsx:32-39` renders a `role="dialog"` with `aria-modal`.
- `EventPanel.tsx:109-136` implements focus trapping.
- The dialog is labelled generically by `aria-label="event"` instead of tying `aria-labelledby` to the title.
- There is no Escape handling.

Why this matters:

This is already more keyboard-conscious than the original. Still, the dialog API is not fully polished. It works for tests and desktop play, but it is not a complete accessibility modal.

Recommendation:

Add `aria-labelledby`, Escape handling where parity allows, and a browser test for restoring focus after event close.

## Game Evaluation

The game currently has a strong first 20-30 minutes foundation:

- Fresh room reveal is restrained and correct.
- Fire, temperature, builder arrival, forest unlock, wood economy, build/craft/buy, village population, traps, workers, and random non-combat events now form a coherent early loop.
- The non-combat event pool gives the world texture without breaking the sparse presentation.

But progression is currently cliff-edged:

- Compass can exist, but Path is not playable.
- Scout can sell a map, but there is no real World to reveal.
- Combat can run, but only as a representative event-modal slice.
- Village economy can produce resources that mostly have nowhere meaningful to go after Phase 5.

Balance judgment:

Do not tune balance yet. The opening economy may be source-faithful, but the missing Path/World sinks mean midgame resource value is not measurable. The prototype can verify formulas; it cannot yet verify full pacing.

## UI Evaluation

Screenshots reviewed:

- `REPORTS/audit-assets/fresh-room.png`
- `REPORTS/audit-assets/outside-village.png`
- `REPORTS/audit-assets/event-beggar.png`
- `REPORTS/audit-assets/combat-snarling-beast.png`
- `REPORTS/audit-assets/debug-settings.png`

What works:

- The fresh room screen is quiet, focused, and faithful.
- Location tabs are understated and readable.
- Stores/village/workers panels look close enough to the original without cloning old DOM.
- Event dialogs stay in the play column and avoid the stores column.
- Debug UI is clearly gated and not visible in default play.

What is weak:

- The UI still feels like a test bench in later staged states because many panels are empty or shallow.
- Combat presentation is technically readable but emotionally flat. It communicates numbers, not danger.
- Event dialogs are functional, but visually boxy and abrupt. Original minimalism works because progression supplies mystery; this prototype does not yet have enough progression depth to make the boxes feel earned.
- Worker arrows are usable but still cryptic without accessible names/tests doing a lot of heavy lifting.

## Code And Architecture Evaluation

Strengths:

- Headless runtime separation is the right call.
- `GameSession` is a useful lifecycle boundary.
- State path utilities and snapshot-oriented runtime APIs make testing practical.
- Content data is centralized and tied to canonical manifest checks.
- The clock abstraction makes deterministic long-timer tests possible.

Weaknesses:

- `EventRuntime` is becoming a gravity well: scheduling, story scenes, delayed actions, combat, loot, perks, store mutation, outfit mutation, death flags, and external effect bridges all live in one class.
- Effect handlers are optional, so missing integration can silently become "cost paid, no effect."
- Combat belongs to Phase 6, but its foundations are already mixed into Phase 5 runtime code. This is pragmatic, but it raises the cost of refactoring once full combat specials arrive.
- There is no durable save story yet. That is documented and acceptable, but it means persistence confidence is intentionally limited.

## Test And Tooling Evaluation

This project has unusually good tests for its stage.

Strong:

- 150 unit tests.
- 164 Playwright tests.
- Visual baselines across 1366/1920/2560/3840 for implemented states.
- Source data and manifest drift checks.
- Architecture boundary tests.
- Deterministic clock/RNG design.

Weak:

- Too many E2E states are injected directly.
- Full playthrough smoke test is still absent.
- Event tests verify many definitions, but natural random scheduling across all Phase 5 pools is not exhaustively exercised.
- Combat tests are representative, not systemic.

## Progress Evaluation

Phase status is now honest:

- Phase 0: complete.
- Phase 0.5: complete and quarantined.
- Phase 1: complete at scaffold/core-services level.
- Phase 2: complete for source data coverage through current scope.
- Phase 3: complete for Room runtime.
- Phase 4: complete for Outside/Village runtime.
- Phase 5: complete for non-combat Global/Room/Outside/Marketing Event Runtime.

The next real risk is Phase 6/7/8 integration. The hardest remaining work is not adding more data. It is making combat, Path, World, inventory, death, and setpieces interact without tearing the clean early architecture apart.

## Prioritized Next Actions

1. Wire or hard-fail the Scout `applyMap` bridge before Path/World makes Scout naturally reachable.
2. Make `EventRuntime.restoreLifecycle()` self-contained by clearing event and delayed-action timers directly.
3. Define a combat runtime boundary before adding all encounters. Do not let `EventRuntime` absorb every special case.
4. Implement player death and outfit/loot return semantics before expanding enemy coverage.
5. Add one organic browser scenario for Phase 5 random events, not just direct `triggerEventByKey`.
6. Plan Path/World layout slots before implementing UI, because the current absolute/fixed geometry will not tolerate casual growth.
7. Keep debug tooling gated and continue separating test harness states from parity screenshots.

## Residual Risk

The current automated checks are green and meaningful. The residual risk is not hidden test failure; it is unimplemented systemic gameplay. The codebase is in good shape for a prototype at Phase 5, but the product is not yet far enough along to judge the full game.

The blunt summary: the foundation is disciplined, the opening loop is credible, the documentation is unusually honest, and the tests are serious. But the game is still mostly a carefully tested doorway. The next phases decide whether this becomes _A Dark Room_ or just an impressively documented room.
