# Phase 3 Completion Roast Audit

Date: 2026-07-06 22:43:53  
Target: current `REMAKE/` prototype after latest roast-audit follow-up  
Question audited: is the prototype now really in a perfectly completed Phase 3 state?

## Executive Verdict

No. Phase 3 is in a much better state, and the previous audit suggestions were mostly implemented. The test suite is green, the Room loop is playable, the UI no longer exposes future systems at start, and the last batch of hardening removed several bad patterns.

But "perfectly completed Phase 3" is still too strong. The prototype is suitable as a Phase 3 exit candidate, not as a flawless Room/Outside parity milestone. There are still concrete original-behavior misses, status-doc contradictions, and architecture shortcuts that should be fixed before Phase 4 starts building worker/population/trap complexity on top of them.

The short roast: the prototype now looks disciplined from the outside, but there are still several places where it wins the test by picking a smaller fight than the original game actually presents.

## Scope And Methodology

Inspected:

- Project planning and status docs:
  - `REMAKE/docs/plan.md`
  - `REMAKE/docs/context.md`
  - `REMAKE/docs/parity-checklist.md`
  - `REMAKE/docs/deviations.md`
  - `REMAKE/docs/changelog.md`
- Runtime and engine:
  - `REMAKE/src/engine/room/RoomRuntime.ts`
  - `REMAKE/src/engine/room/RoomSelectors.ts`
  - `REMAKE/src/engine/outside/OutsideRuntime.ts`
  - `REMAKE/src/engine/clock.ts`
  - `REMAKE/src/engine/cooldowns/CooldownManager.ts`
  - `REMAKE/src/engine/notifications/NotificationCenter.ts`
- UI:
  - `REMAKE/src/ui/App.tsx`
  - `REMAKE/src/ui/RoomView.tsx`
  - `REMAKE/src/ui/OutsideView.tsx`
  - `REMAKE/src/ui/styles/global.css`
- Tests:
  - `REMAKE/src/tests/e2e/app.spec.ts`
  - `REMAKE/src/tests/e2e/room-visual.spec.ts`
  - `REMAKE/src/tests/engine/room-runtime.test.ts`
  - `REMAKE/src/tests/engine/outside-runtime.test.ts`
  - `REMAKE/src/tests/architecture-boundaries.test.ts`
- Original reference:
  - `ORIGINAL/script/room.js`
  - `ORIGINAL/script/outside.js`

Checks run:

- `npm test` - passed, 109 tests
- `npm run build` - passed
- `npm run test:e2e` - passed, 72 Playwright tests

## Findings

### High - Outside First-Arrival Behavior Is Missing

Evidence:

- Original Outside emits the first forest-arrival message and records `game.outside.seenForest`: `ORIGINAL/script/outside.js:580-585`.
- Remake `OutsideRuntime` has `initialize()` and `gatherWood()`, but no `onArrival()` or `seenForest` handling: `REMAKE/src/engine/outside/OutsideRuntime.ts:21-55`.
- `App` calls `outside.initialize()` during refresh, not an arrival lifecycle method: `REMAKE/src/ui/App.tsx:43-47`.
- E2E verifies the tab and gather button, but not the original first outside message: `REMAKE/src/tests/e2e/app.spec.ts:147-172`.

Why this matters:

Phase 3 includes the first transition into Outside. The original does not just show a button; it gives the player the grey-sky/wind arrival beat. This is small text, but in *A Dark Room*, small text is the game. Missing it while claiming Outside tab/title progression is complete is exactly the kind of parity leak that later makes the remake feel mechanically correct but emotionally off.

Recommendation:

Add `OutsideRuntime.onArrival()` with `game.outside.seenForest` state and the original notification. Call it when the active location changes to Outside, not on every render/tick. Add unit and E2E coverage.

### High - Room Store Categorization Still Does Not Match The Original For All Store Items

Evidence:

- Original `Room.updateStoresView` categorizes stores through `Room.Craftables`, `Room.TradeGoods`, `Room.MiscItems`, and `Fabricator.Craftables`: `ORIGINAL/script/room.js:834-840`.
- It then hides upgrades/buildings, puts weapons in `#weapons`, special items in `#special`, and everything else in resources: `ORIGINAL/script/room.js:842-859`.
- Remake selector only checks `originalRoomCraftables` and `originalRoomTradeGoods`: `REMAKE/src/engine/room/RoomSelectors.ts:88-92`.
- `originalRoomMiscItems` exists in the data layer, including `laser rifle`, but the selector does not use it.

Why this matters:

The latest fix handles representative Phase 3 rows like wood, compass, bolas, and waterskin. It does not handle the original store classification surface. A store item such as `laser rifle` will be treated as an uncategorized resource instead of a weapon. The acceptance criterion says store display categories match original behavior; this implementation matches a curated sample.

Recommendation:

Include original misc item classification in `RoomSelectors`, and either include Fabricator classification now as data already exists or document that Fabricator store categorization is Phase 11. Add tests for `laser rifle` and at least one blueprint/fabricator-shaped item.

### High - UI Still Owns Too Much Of The Game Update Phase

Evidence:

- `App.refreshGameView()` calls mutating runtime methods on refresh: `room.onArrival()`, `room.refreshAvailability()`, `outside.initialize()`, and `engine.cooldowns.expireCompleted()`: `REMAKE/src/ui/App.tsx:43-47`.
- The production clock driver is started from React and invokes that refresh callback: `REMAKE/src/ui/App.tsx:51-55`.
- The test harness embedded in `App` directly calls `engine.state.set(path, value)`: `REMAKE/src/ui/App.tsx:58-75`.
- The plan says the engine owns scheduled timers/module unlocks and the UI should dispatch commands/render snapshots, not calculate or mutate game outcomes: `REMAKE/docs/plan.md`.
- The architecture test only blocks UI imports of low-level state modules; it does not catch `App` holding an engine instance and mutating `engine.state` through the public object: `REMAKE/src/tests/architecture-boundaries.test.ts`.

Why this matters:

The previous audit's snapshot mutation problem is mostly fixed, but the update phase is still smeared across React. This is tolerable in Phase 3, but it is not "perfect." In Phase 4, this pattern will tempt worker income, trap refresh, population arrival, and village UI rebuilds into the same refresh loop.

Recommendation:

Move "refresh availability", arrival lifecycle, cooldown expiry, and module initialization into an engine/module update boundary. Keep React responsible for starting/stopping a driver and dispatching explicit user commands. Keep the test harness outside production UI or isolate it behind a dev-only adapter that does not normalize direct state mutation as an app pattern.

### Medium - Craft Visibility Can Bypass Original Workshop Gating For Existing Non-Building Items

Evidence:

- Original `craftUnlocked` checks builder level and workshop requirement before the "already built" visibility shortcut: `ORIGINAL/script/room.js:1077-1086`.
- The original shortcut specifically checks `game.buildings["thing"]`, not arbitrary `stores["thing"]`: `ORIGINAL/script/room.js:1082-1085`.
- Remake visibility returns true when `itemCount(...) > 0` for any craftable type: `REMAKE/src/engine/room/RoomRuntime.ts:389-393`.
- `craftOptions()` then exposes workshop craftables based on visibility, not eligibility: `REMAKE/src/engine/room/RoomRuntime.ts:354-358`.

Why this matters:

If a tool, weapon, or upgrade enters stores before the workshop exists, the remake can expose the craft option earlier than the original. Phase 3 does not yet have events handing out items, so this is currently a latent parity bug. But a "perfect" Phase 3 foundation should not carry a known future unlock leak into event/combat phases.

Recommendation:

Make the "already exists" visibility shortcut mirror the original: buildings can stay visible after being built; workshop-required store items should still require workshop gating before they appear as craft actions. Add tests for `stores.torch = 1` without workshop and `game.buildings["trap"] = 1`.

### Medium - Store Row Ordering Is Not Original

Evidence:

- Original inserts new store rows alphabetically by translated display key inside their category: `ORIGINAL/script/room.js:879-896`.
- Remake returns `Object.entries(stores)` order from state and renders it directly: `REMAKE/src/engine/room/RoomRuntime.ts:432-442`, `REMAKE/src/ui/RoomView.tsx:112-126`.
- Current E2E checks category inclusion/exclusion, not ordering: `REMAKE/src/tests/e2e/app.spec.ts:113-124`.

Why this matters:

This is not a game-breaking bug, but it is a visible UI parity miss. The original store panel has a stable sorted feel; the remake can drift based on mutation order. If "stores display categories match original behavior" is a Phase 3 acceptance criterion, ordering is part of that behavior.

Recommendation:

Sort rows by display key within each category before returning the snapshot or before rendering. Add an E2E or unit assertion with out-of-order inserted stores.

### Medium - `deviations.md` Is Stale Enough To Be Actively Misleading

Evidence:

- `REMAKE/docs/deviations.md` says: "None. The remake has not entered implementation."
- The project has implemented Phase 0 through Phase 3, multiple UI modernizations, test harness behavior, visible inline costs, and a React location tab model.
- `REMAKE/docs/context.md` says the latest prototype roast audit is closed and Phase 3 exit criteria are met.

Why this matters:

The plan explicitly says deviations must be updated whenever parity is intentionally broken. The deviations log now denies the existence of the implementation. That is not harmless paperwork; it removes the project's only official place to distinguish deliberate modernization from accidental drift.

Recommendation:

Update `deviations.md` immediately. At minimum record:

- modern UI styling vs original CSS/pixel behavior
- visible inline costs vs original tooltip/cost refresh behavior
- dev-only test harness route/query
- React tab shell vs original slider mechanics if exact behavior is not intended
- deferred audio/music effects despite preserved audio data

### Medium - Tests Prove The Happy Slice, Not Exhaustive Phase 3 Parity

Evidence:

- Full Phase 3 E2E exists and is useful: `REMAKE/src/tests/e2e/app.spec.ts:147-172`.
- Several UI parity tests still set internal state through `window.__adrTest.setState`: `REMAKE/src/tests/e2e/app.spec.ts:113-145`.
- Visual tests also create stores/build/craft/buy/outside states through direct state injection: `REMAKE/src/tests/e2e/room-visual.spec.ts:33-66`.
- No E2E currently checks first Outside arrival notification, store ordering, `laser rifle` weapon classification, or workshop-gating leak for pre-existing craftable store items.

Why this matters:

The test suite is much stronger than before, but it still certifies a representative Phase 3 slice. That is fine if the docs say "Phase 3 exit criteria met." It is not fine if anyone reads the suite as proof of perfect original parity.

Recommendation:

Keep the harness, but add natural or targeted tests for the gaps above. Use harness state setup for hard-to-reach future-state visuals, not as the main proof of original behavior.

### Medium - Visual Coverage Is Broader, But Still Not A Full Phase 3 Surface

Evidence:

- Visual tests capture `.roomPanel` and `.outsidePanel` only: `REMAKE/src/tests/e2e/room-visual.spec.ts:22-66`.
- The location tab shell is not included in panel screenshots.
- `parity-checklist.md` still leaves browser zoom checks unchecked, while Phase 3 context highlights viewport checks.
- Visual coverage uses state injection for most non-fresh states.

Why this matters:

Panel screenshots catch regressions inside the panel, but they can miss nav/panel spacing, tab overflow, and full-shell composition. The UI looks restrained, but "4K support" and "location progression" are shell-level claims, not just panel-level claims.

Recommendation:

Add at least one full-app screenshot per major Phase 3 state, including tabs. Keep panel screenshots for focused diffs, but do not use them as the only visual proof.

### Low - Realtime Catch-Up Can Become A Long Synchronous Timer Drain

Evidence:

- `RealtimeClockDriver` advances the manual clock by full elapsed wall time every interval: `REMAKE/src/engine/clock.ts:111-118`.
- `ManualClock.advanceBy()` executes every due timer synchronously until it reaches the target: `REMAKE/src/engine/clock.ts:40-52`.
- Builder income is scheduled every 10 seconds: `REMAKE/src/engine/room/RoomRuntime.ts:531-537`.

Why this matters:

For Phase 3 this is probably fine. For Phase 4 and later, a throttled/backgrounded tab can return with many interval callbacks to drain synchronously. That can become an avoidable UI hitch once population, workers, traps, events, and world timers exist.

Recommendation:

Before Phase 4 expands timers, define catch-up semantics: maximum catch-up window, coalesced income ticks, or a module-level elapsed update function instead of repeated interval callback replay.

### Low - `RoomRuntime` Is Still Big Enough To Become The Pattern Everyone Copies

Evidence:

- `RoomRuntime.ts` still owns initialization, fire timers, temperature, builder progression, forest unlock, income scheduling, build/craft/buy commands, unlock availability, store rows, income rows, notifications, and snapshot assembly.
- `RoomSelectors.ts` extracts useful pure helpers, but availability, commands, timers, and presentation snapshot assembly remain bundled.

Why this matters:

This is no longer the worst thing in the prototype, but it still teaches Phase 4 to put Outside/Village into one giant runtime class. That will age badly when traps, workers, population, huts, village title, mine unlocks, and income all land.

Recommendation:

Do one more architectural pass before Phase 4 feature expansion: split availability/unlocks, commands/economy, timers, and read-model selectors into clearer internal modules.

## Game Evaluation

The Phase 3 gameplay slice is now legitimately playable: light fire, wait through builder/forest progression, gather wood, build trap, build cart. The reveal curve is no longer spoiled by the spike UI. The pacing is close enough for a milestone gate.

But the game feel is not perfectly preserved. Missing Outside first-arrival text is small mechanically and large atmospherically. The original relies on sparse lines arriving at exactly the right moment. If those lines are treated as decorative, the remake will slowly become a correct spreadsheet wearing the original's coat.

## UI Evaluation

The UI is restrained and readable. The new store grouping, visible costs, tabs, and cooldown rendering are practical improvements over the previous prototype. The fresh screen is quiet enough.

The remaining problems are fidelity and proof. Store grouping does not yet cover all original item classes. Store ordering is not original. Inline costs are useful, but they are a modernization and should be logged. Full-shell visual coverage is still weaker than the confidence implied by "location tab/title progression complete."

## Code And Engine Evaluation

The engine is much healthier than before: snapshots are pure, cooldown expiry is explicit, notification history is bounded, and elapsed time now drives the manual clock. That is real progress.

The remaining architectural smell is ownership. React still orchestrates too much simulation lifecycle through `refreshGameView()`. The test harness puts low-level state mutation inside the app shell. The architecture tests catch imports, not behavioral ownership. This is survivable now, but dangerous as the module graph gets more serious.

## Test Evaluation

The suite is green and meaningfully broader:

- 109 unit/content/architecture tests pass.
- 72 Playwright tests pass.
- Full Phase 3 E2E progression exists.
- Visual baselines cover more states across the desktop viewport matrix.

The blind spots are specific:

- no first-Outside-arrival assertion
- no misc/fabricator store categorization assertion
- no store ordering assertion
- no workshop-gating regression for pre-existing store craftables
- no full-shell visual screenshot for tab/panel composition
- no zoom checks

The tests are good enough to prevent obvious regression. They are not strong enough to certify "perfect Phase 3 parity."

## Documentation And Planning Evaluation

`context.md` is mostly honest now because it says "Phase 3 exit criteria" instead of "exhaustive parity." Good.

`parity-checklist.md` is also improved because visual screenshots are marked in-progress for implemented Phase 3 states. Good.

`deviations.md` is the embarrassing outlier. It still claims no implementation exists. That document alone is enough to reject "perfectly completed Phase 3" as a project-status claim.

## Prioritized Next Actions

1. Implement Outside first-arrival lifecycle.
   - Add `OutsideRuntime.onArrival()`.
   - Set `game.outside.seenForest`.
   - Emit "the sky is grey and the wind blows relentlessly".
   - Trigger it on Outside tab activation.

2. Fix Room store classification completeness.
   - Include `originalRoomMiscItems`.
   - Decide and document Fabricator item classification timing.
   - Add `laser rifle` test coverage.

3. Fix workshop-gating visibility leak.
   - Do not expose workshop-required store craftables merely because they exist in `stores`.
   - Preserve the original building visibility shortcut separately.

4. Update `deviations.md`.
   - Remove the stale "has not entered implementation" claim.
   - Log intentional UI/test-harness/audio/visual deviations.

5. Move update lifecycle out of React before Phase 4.
   - React should not be the place where arrival, availability refresh, and cleanup semantics are normalized.

6. Add the missing tests.
   - Outside arrival notification.
   - Store ordering.
   - Misc store weapon classification.
   - Pre-workshop craft visibility.
   - Full-shell visual screenshots with tabs.

7. Define timer catch-up semantics before adding worker/population/trap loops.

## Checks Run

- `npm test`
  - Result: passed
  - Count: 109 tests
- `npm run build`
  - Result: passed
- `npm run test:e2e`
  - Result: passed
  - Count: 72 tests
  - Projects: chromium-1366, chromium-1920, chromium-2560, chromium-3840

## Residual Risk

The prototype is safe to call "Phase 3 exit candidate with known follow-up fixes." It is not safe to call "perfectly completed Phase 3."

If Phase 4 starts now without addressing the high findings, the project will carry small original-behavior misses and a UI-owned update lifecycle into the first genuinely complex module. That is how a clean Room slice turns into an Outside/Village runtime that technically passes tests while quietly drifting from the original.
