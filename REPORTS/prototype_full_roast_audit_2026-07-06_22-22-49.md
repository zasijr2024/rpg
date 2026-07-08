# Full Prototype Roast Audit - A Dark Room Remake

Date: 2026-07-06 22:22:49  
Audited target: current `REMAKE/` prototype after Phase 3 completion claim  
Audit mode: blunt, evidence-driven review of runtime behavior, UI, tests, docs, and scope alignment

## Executive Verdict

The prototype is in a much better place than the earlier scaffold: it has a real Room loop, deterministic engine tests, source-data parity checks, early discovery guards, and screenshot baselines. The basic fresh-start experience is no longer embarrassing.

But the current "Phase 3 complete" claim is still too confident. The code passes the available tests, yet some of those tests are certifying a narrower thing than the docs imply. The biggest issues are not failing tests; they are parity inflation, render-time state mutation, and UI behavior that approximates the original instead of matching it.

The harsh version: the prototype now behaves like a good internal slice, not like a finished Room parity milestone. It is close enough to move toward Phase 4 only if the next work starts by paying down the architectural shortcuts that Phase 3 introduced.

## Scope And Methodology

Inspected:

- Project status and docs:
  - `REMAKE/docs/context.md`
  - `REMAKE/docs/parity-checklist.md`
  - `REMAKE/docs/plan.md`
  - `REMAKE/docs/changelog.md`
- Runtime:
  - `REMAKE/src/engine/room/RoomRuntime.ts`
  - `REMAKE/src/engine/outside/OutsideRuntime.ts`
  - `REMAKE/src/engine/cooldowns/CooldownManager.ts`
  - `REMAKE/src/engine/notifications/NotificationCenter.ts`
  - `REMAKE/src/engine/state/StateStore.ts`
- UI:
  - `REMAKE/src/ui/App.tsx`
  - `REMAKE/src/ui/RoomView.tsx`
  - `REMAKE/src/ui/OutsideView.tsx`
  - `REMAKE/src/ui/styles/global.css`
- Tests:
  - `REMAKE/src/tests/engine/room-runtime.test.ts`
  - `REMAKE/src/tests/engine/outside-runtime.test.ts`
  - `REMAKE/src/tests/e2e/app.spec.ts`
  - `REMAKE/src/tests/e2e/room-visual.spec.ts`
  - `REMAKE/playwright.config.ts`
- Original comparison:
  - `ORIGINAL/script/room.js`
  - `ORIGINAL/script/outside.js`

Checks run:

- `npm test` - passed, 105 tests
- `npm run build` - passed
- `npm run test:e2e` - passed, 44 tests

## Findings

### High - Render-Time Snapshots Mutate Game State

Evidence:

- `RoomRuntime.snapshot()` calls `buildOptions()`, `craftOptions()`, and `buyOptions()` while building a read model: `REMAKE/src/engine/room/RoomRuntime.ts:117-140`.
- `craftUnlocked()` mutates `game.room.buttons` and emits `availableMsg` notifications: `REMAKE/src/engine/room/RoomRuntime.ts:382-413`.
- `buyUnlocked()` mutates `game.room.buttons`: `REMAKE/src/engine/room/RoomRuntime.ts:416-424`.
- `OutsideRuntime.snapshot()` calls `initialize()`, which writes `game.buildings`, `game.population`, and `game.workers`: `REMAKE/src/engine/outside/OutsideRuntime.ts:21-36`.
- `CooldownManager.snapshot()` deletes expired cooldowns: `REMAKE/src/engine/cooldowns/CooldownManager.ts:41-63`.

Why this is bad:

A method named `snapshot()` should not unlock buttons, emit player-facing notifications, initialize unrelated state branches, or garbage-collect runtime state. Right now, rendering the UI is part of the game simulation. That makes test order, UI refresh cadence, and save timing meaningful in ways the design does not acknowledge.

This is fragile because a future React render, dev save, screenshot test, debug panel, or observer can change the game by merely asking what the game looks like.

Recommendation:

Split runtime into command/update phases and pure selectors:

- `tick()` / scheduled callbacks perform state changes.
- `refreshAvailability()` performs original unlock side effects intentionally.
- `snapshot()` becomes pure and side-effect free.
- Add tests that call `snapshot()` repeatedly and assert state and notification lists do not change.

### High - Store Display Parity Is Not Actually Complete

Evidence:

- Original Room separates stores into `resources`, `special`, and `weapons`, and deliberately hides upgrades, buildings, and blueprints in `Room.updateStoresView`: `ORIGINAL/script/room.js:795-920`.
- The remake computes a category in `RoomRuntime.storeCategory()`: `REMAKE/src/engine/room/RoomRuntime.ts:438-445`.
- The UI ignores that category and renders a single flat list: `REMAKE/src/ui/RoomView.tsx:63-73`.
- `REMAKE/docs/plan.md` requires "stores display categories match original behavior" under Phase 3 acceptance.
- `REMAKE/docs/context.md:33` and `REMAKE/docs/parity-checklist.md:73-76` present Room parity as complete.

Why this is bad:

The code carries category metadata but discards it at the rendering boundary. That is exactly the kind of fake parity that later becomes expensive: the engine says "I know weapon/special/resource," while the UI says "everything is just a row."

Recommendation:

Render store sections matching original behavior:

- `stores` container for resources and special rows.
- Separate `weapons` display behavior.
- Hide upgrades/buildings/blueprints on the Room stores panel.
- Add E2E or component tests with representative `torch`, `compass`, `bolas`, `waterskin`, and `trap` states.

### High - Outside "Tab/Title Progression" Is Overclaimed

Evidence:

- Checklist marks Outside unlock and tab/title progression complete: `REMAKE/docs/parity-checklist.md:80-82`.
- The current UI renders `<OutsideView />` directly below `<RoomView />`: `REMAKE/src/ui/App.tsx:29-32`.
- `OutsideView` is a stacked section, not an original-style location tab/panel: `REMAKE/src/ui/OutsideView.tsx:23-39`.
- Original Outside creates a location tab with `Header.addLocation(_("A Silent Forest"), "outside", Outside)`: `ORIGINAL/script/outside.js:154-161`.

Why this is bad:

The current UI is acceptable as an implementation bridge for gather wood. It is not original tab/title progression. Marking it complete blurs the boundary between "we exposed the action" and "we preserved the original location model."

Recommendation:

Downgrade the checklist item or implement a real location navigation shell before Phase 4 deepens Outside/Village. If the modern UI intentionally avoids the original tab slider, document it in `deviations.md`.

### High - The Clock Is Driven By A UI Interval, Not Real Runtime Time

Evidence:

- `App` advances the engine clock by exactly 1000 ms every browser `setInterval`: `REMAKE/src/ui/App.tsx:19-25`.
- Room timers and income are scheduled on `ManualClock`: `REMAKE/src/engine/room/RoomRuntime.ts:500-544`.
- Original uses engine timeouts for timers such as fire cooling, temperature, builder state, gather cooldown, and population scheduling.

Why this is bad:

If the tab is throttled, the browser is busy, or React is paused, the game does not catch up by elapsed wall time. It advances by "number of UI interval callbacks that happened." That is not equivalent to original timing, and it will become more wrong as Phase 4 adds population, worker income, traps, and events.

Recommendation:

Introduce a real engine scheduler adapter:

- Production clock advances by actual elapsed time, not fixed UI ticks.
- Tests keep using `ManualClock`.
- UI subscribes to state/timer events instead of owning engine time.

### Medium - Screenshot Regression Is Too Narrow And Somewhat Flaky

Evidence:

- Visual tests capture only `.roomPanel`: `REMAKE/src/tests/e2e/room-visual.spec.ts:3-11`.
- The firelit screenshot includes the active cooldown text immediately after click.
- The UI interval updates cooldown once per second: `REMAKE/src/ui/App.tsx:19-25`.

Why this is bad:

The baselines protect fresh and immediate firelit states, but they do not protect stores, build/craft/buy, outside unlock, gather button, income rows, or long notification lists. The firelit baseline also depends on the screenshot happening before the countdown changes from `10s` to `9s`; this is probably fine locally, but it is not a robust visual contract.

Recommendation:

- Freeze time or disable the UI interval in visual tests.
- Add scenario screenshots for:
  - stores revealed
  - builder helper with build buttons
  - workshop craft buttons
  - trading post buy buttons
  - outside gather panel
- Keep screenshot names state-specific.

### Medium - E2E Coverage Does Not Exercise The Actual Phase 3 Progression

Evidence:

- E2E covers fresh start, light fire, discovery absence, cooldown display, viewport width, and two Room screenshots: `REMAKE/src/tests/e2e/app.spec.ts`, `REMAKE/src/tests/e2e/room-visual.spec.ts`.
- Unit tests cover deeper mechanics by directly setting state and calling methods: `REMAKE/src/tests/engine/room-runtime.test.ts`.
- There is no E2E that naturally advances through builder arrival, need-wood unlock, outside panel reveal, gather wood, build unlock, craft, or buy.

Why this is bad:

The headless engine may be correct while the actual prototype remains unproven beyond the first click. Phase 3 is a runtime/UI milestone, not just a data or method-call milestone.

Recommendation:

Add a test-only time acceleration hook or engine test harness route, then run one complete Phase 3 E2E scenario:

1. Fresh room.
2. Light fire.
3. Advance builder/temperature/need-wood.
4. Verify Outside appears.
5. Gather wood.
6. Promote builder.
7. Build `trap` and `cart`.
8. Verify costs and stores update in UI.

### Medium - Costs Are Hidden In Browser `title`, Not Proper UI

Evidence:

- Build/craft/buy buttons expose cost via the `title` attribute only: `REMAKE/src/ui/RoomView.tsx:120-128`.
- Original buttons have cost tooltips and dynamic cost refresh behavior: `ORIGINAL/script/room.js:1139-1198`.

Why this is bad:

`title` is weak UX and weak accessibility. It is not reliable for keyboard users, it is not a real tooltip model, and it does not make costs inspectable in a controlled way. It also makes screenshots less useful because cost state is invisible.

Recommendation:

Implement an explicit cost tooltip/popover or inline cost disclosure consistent with the original minimalist style. Test it with keyboard focus and dynamic trap/hut costs.

### Medium - Runtime Is Becoming A Monolith Before The Hard Parts Arrive

Evidence:

- `RoomRuntime.ts` now owns initialization, timers, fire, temperature, builder progression, outside unlock, economy actions, availability, store categorization, income rows, notifications, and UI snapshots.
- The file is already over 500 lines before Outside/Village, event runtime, combat, path, and world are implemented.

Why this is bad:

This is tolerable for a vertical slice, but dangerous as the architectural pattern for later phases. If Phase 4 copies this shape, `OutsideRuntime` will become a pile of traps, workers, huts, population, village titles, income, and UI rows. Then events will do the same. That path leads to a remake where every module is a miniature application with its own hidden rules.

Recommendation:

Before Phase 4:

- Extract pure selectors from mutation methods.
- Extract availability/unlock logic.
- Extract store/economy operations.
- Keep runtime command methods small and test scenario-level behavior at the boundary.

### Medium - Completion Docs Are Slightly Ahead Of Evidence

Evidence:

- `REMAKE/docs/context.md:3` says Phase 3 Room runtime is complete.
- `REMAKE/docs/parity-checklist.md:77` says original room notifications are preserved.
- `REMAKE/docs/parity-checklist.md:236` says visual screenshots for required states/resolutions are complete.
- But screenshots cover only fresh/firelit Room, and notification coverage is representative, not exhaustive across all craftables, all buys, all max cases, and all unlock messages.

Why this is bad:

The project has been burned once by status inflation. The current wording is much better than before, but it still occasionally says "complete" where "representative and sufficient for Phase 3 exit" would be more honest.

Recommendation:

Use sharper labels:

- "Phase 3 exit criteria met" for milestone-level completion.
- "Exhaustive parity" only when all relevant runtime paths are covered.
- Keep checklist items tied to exact test names or source sections.

### Low - NotificationCenter Has No Retention Policy

Evidence:

- `NotificationCenter.notify()` pushes every notification into an in-memory array: `REMAKE/src/engine/notifications/NotificationCenter.ts:14-22`.
- `list()` returns all notifications: `REMAKE/src/engine/notifications/NotificationCenter.ts:24-27`.

Why this matters:

Fine for Phase 3, but events/combat/world will produce many notifications. Without queue semantics, print semantics, source filtering, or retention policy, UI and save snapshots may accumulate noise.

Recommendation:

Define notification lifecycle before Phase 5:

- queue vs history
- source filtering
- max retained history
- persisted vs transient notifications

### Low - Dependency Versions Use `latest`

Evidence:

- `package.json` uses `latest` for Vite, React, TypeScript, Playwright, Vitest, ESLint, and Prettier.

Why this matters:

This is acceptable for a local prototype, but bad for parity work. You are generating screenshot baselines and trying to pin behavior while allowing package upgrades to shift rendering, test behavior, and typechecking.

Recommendation:

Pin exact dependency versions after Phase 3, before Phase 4 adds larger UI and more screenshots.

## Game Evaluation

The current playable slice finally has the right emotional direction: a dark room, a fire, a delayed stranger, wood pressure, and minimal affordances. It no longer spoils the world/space arc on the default entry. That is a real win.

The weak spot is that the player-facing loop is still barely playable in a normal session. The automated tests can force builder state, craft, buy, and hut/trap cost scenarios, but a human sitting at the prototype will mostly see a slow timer-driven wait. That is faithful in pacing, but not useful for validating the full Phase 3 loop unless there is a dev-only acceleration path.

The first screen is quiet and appropriately restrained. The moment Outside appears as a stacked section, however, the original location model starts to drift. That is not fatal yet, but Phase 4 cannot build village UI on a stacked-section approximation and still claim original navigation parity.

## UI Evaluation

Strengths:

- Minimalist visual tone is aligned with the original.
- Fresh-start discovery is protected.
- Cooldown rendering is stable and readable.
- Viewport matrix now covers 1366, 1920, 2560, and 3840 widths.

Problems:

- Stores are rendered as one flat list, not original resource/special/weapons groupings.
- Costs are hidden in `title`; that is not a real UI.
- Screenshot coverage is too narrow for the milestone claims.
- Outside is visually a second page section, not a location tab/panel.
- The visual baselines mostly prove "the first screen didn't move," not "Phase 3 UI parity is complete."

## Code And Architecture Evaluation

Strengths:

- Engine/UI separation is still mostly intact.
- State path handling is tested.
- Source-derived data parity is stronger than before.
- Room runtime tests cover meaningful edge cases.
- The spike UI remains quarantined.

Problems:

- Snapshot methods mutate state.
- ManualClock is advanced from React instead of an engine scheduler.
- `RoomRuntime` is already too broad.
- Availability checks and notification side effects are coupled.
- Cooldown snapshots mutate the cooldown map.
- Outside runtime starts with the same snapshot-side-effect pattern.

The code works, but it is starting to encode accidental architecture. This needs correction before Phase 4, because Phase 4 has more moving parts than Phase 3.

## Test Evaluation

What is good:

- `npm test`, `npm run build`, and `npm run test:e2e` are all green.
- E2E runs across four desktop viewport projects.
- There are screenshot baselines.
- Unit tests cover important Room runtime formulas and state transitions.

What is weak:

- No natural full Phase 3 E2E progression.
- Screenshot tests cover only fresh/firelit Room.
- No explicit test that `snapshot()` is side-effect free; in fact it is not.
- No UI test for store grouping, craft costs, buy costs, max messages, or outside gather after natural unlock.
- Visual tests may become flaky around countdown text unless time is frozen.

## Prioritized Next Actions

1. Make snapshots pure.
   - Remove state writes and notifications from selectors.
   - Add "snapshot is idempotent" tests.

2. Fix store display parity.
   - Render resources/special/weapons groups.
   - Hide upgrades/buildings/blueprints from Room stores as original does.

3. Decide the location navigation model before Phase 4.
   - Implement original-style tabs/panels or document a deviation.
   - Do not build village UI on top of an accidental stacked-section shell.

4. Move time ownership out of React.
   - Use elapsed real time in production.
   - Keep `ManualClock` for tests.

5. Add a complete Phase 3 E2E scenario.
   - Use a test-only acceleration hook.
   - Cover natural unlocks and UI-visible actions.

6. Improve visual coverage.
   - Add stores/build/craft/buy/outside screenshots.
   - Freeze time for screenshot tests.

7. Pin dependency versions before more screenshot baselines are added.

## Checks Run

- `npm test`
  - Result: passed
  - Count: 105 tests
- `npm run build`
  - Result: passed
- `npm run test:e2e`
  - Result: passed
  - Count: 44 tests
  - Projects: chromium-1366, chromium-1920, chromium-2560, chromium-3840

## Residual Risk

The current prototype is good enough to proceed into Phase 4 only if the first Phase 4 task is architectural hardening, not feature expansion. If Phase 4 begins by adding traps, population, workers, and village UI directly into the same patterns, the project will accumulate hidden state mutations and parity claims that tests do not actually prove.

The green build is real. The completion claim is mostly earned. The architecture is not yet stable enough to scale without cleanup.
