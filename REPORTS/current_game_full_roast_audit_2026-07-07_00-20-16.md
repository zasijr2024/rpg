# Current Game Full Roast Audit

Date: 2026-07-07 00:20:16 Europe/Berlin  
Target: current dirty worktree under `REMAKE/`  
Audit request: full audit and evaluation/roasting of the current game, including code, engine, UI, progress, and tests.

## Executive Verdict

This is not a current game. It is a disciplined early remake slice with a surprisingly serious data/test foundation and a very narrow playable surface.

The good news: Room and Outside/Village are no longer toy scaffolding. The current code can run the early fire/builder/forest loop, traps, population, worker assignment, worker income, hut destruction helpers, original-ish sparse layout, deterministic timers, deterministic RNG, and desktop viewport tests. The checks are green.

The hard truth: everything after early village is still absent as runtime gameplay. Events, combat, path/outfitting, world exploration, setpieces, ship, fabricator, space, ending, score, prestige, and a full playthrough are checklist items, not game systems. The repo has a lot of ported data and a few spike prototypes, but data sitting in TypeScript files is not gameplay. The current prototype is closer to "Phase 4 technical slice" than to "A Dark Room remake."

The biggest project risk is not that the code is bad. The biggest risk is that the project keeps marking data coverage, e2e harness coverage, and visual panel snapshots as if they were equivalent to playable parity. That is how a remake becomes a museum catalog of the original instead of a working game.

## Scope And Methodology

Inspected:

- Project docs: `README.md`, `REMAKE/README.md`, `REMAKE/docs/context.md`, `REMAKE/docs/plan.md`, `REMAKE/docs/parity-checklist.md`, `REMAKE/docs/tech-decisions.md`, `REMAKE/docs/ui-spec.md`, `REMAKE/docs/deviations.md`, `REMAKE/docs/changelog.md`.
- Prior reports: latest Phase 3 audit and follow-up under `REPORTS/`.
- Engine/runtime: `GameSession`, `GameEngine`, `RoomRuntime`, `OutsideRuntime`, clock, state store, save adapters.
- UI: `App`, Room/Outside/Settings views, stores/notifications, global CSS, stored screenshot baselines.
- Tests: unit/content/architecture tests, e2e tests, visual tests, spike tests.
- Original reference checks: targeted original source around income, Outside, Room, and state-manager behavior.

Checks run:

- `npm test` in `REMAKE/`: passed, 24 files, 123 tests.
- `npm run build` in `REMAKE/`: passed.
- `npm run test:e2e` in `REMAKE/`: passed, 96 Playwright tests across 1366, 1920, 2560, and 3840 Chromium projects.
- Visual inspection of stored baselines:
  - `phase3-shell-chromium-1366-win32.png`
  - `outside-gather-chromium-1366-win32.png`
  - `room-craft-buy-chromium-1366-win32.png`
  - `phase3-shell-chromium-3840-win32.png`

## Findings

### High - The Current Product Is Still A Slice, Not A Game

Evidence:

- The docs honestly say the current phase is "Phase 4 Outside and Village runtime is complete" and next recommended work is Phase 5 Event Runtime: `REMAKE/docs/context.md:3`.
- The parity checklist leaves Event Runtime unchecked from `REMAKE/docs/parity-checklist.md:101`, Combat from `REMAKE/docs/parity-checklist.md:128`, Path from `REMAKE/docs/parity-checklist.md:144`, World from `REMAKE/docs/parity-checklist.md:158`, and Ship/Fabricator/Space/Ending from `REMAKE/docs/parity-checklist.md:178`.
- Full playthrough smoke is unchecked: `REMAKE/docs/parity-checklist.md:244`.
- Runtime source only contains Room and Outside modules under `REMAKE/src/engine`; world/space/event references in runtime are spike prototypes or data tests, not production systems.

Why this matters:

The current build cannot deliver the game fantasy past early village. It can create a room, reveal the forest, gather, trap, grow population, and move workers. That is meaningful progress, but it is the opening ramp of the original, not the game.

Recommendation:

Stop using broad language like "current game" internally unless it is paired with "Phase 4 slice." The next milestone should be a real Event Runtime vertical slice, because the game is currently missing the machinery that makes A Dark Room feel alive between deterministic economy ticks.

### High - Dev Save/Load Exists In Tests, Not In The Actual Browser Session

Evidence:

- `LocalStorageDevSaveAdapter` exists and uses `adr-remake-dev-save`: `REMAKE/src/engine/save/devSave.ts:3`, `REMAKE/src/engine/save/devSave.ts:11`, `REMAKE/src/engine/save/devSave.ts:13`, `REMAKE/src/engine/save/devSave.ts:18`.
- `GameSession` constructs `createGameEngine()` with no save adapter: `REMAKE/src/engine/GameSession.ts:30`.
- `GameEngine.saveDevState()` and `loadDevState()` throw if no adapter is configured: `REMAKE/src/engine/GameEngine.ts:66`, `REMAKE/src/engine/GameEngine.ts:73`.
- The public engine barrel exports `DEV_SAVE_KEY` and `MemoryDevSaveAdapter`, but not `LocalStorageDevSaveAdapter`: `REMAKE/src/engine/index.ts:26`.
- The only save round-trip test uses `MemoryDevSaveAdapter`: `REMAKE/src/tests/engine/game-engine.test.ts:51`, `REMAKE/src/tests/engine/game-engine.test.ts:52`.
- No UI or session method exposes save/load.

Why this matters:

The plan says parity needs simple development save/load under `adr-remake-dev-save`. The repo has the pieces, but the running app does not use them. This is a fake pass: a memory adapter proving serialization in a unit test does not help someone test the current browser game after a refresh.

Recommendation:

Wire `LocalStorageDevSaveAdapter` into browser `GameSession`, export it, add session-level save/load/clear methods, and add a query-gated or settings-gated dev control if this remains tooling-only. Add an e2e test that saves, reloads the page, loads, and confirms meaningful Room/Outside state returns.

### High - The Always-Visible Debug Settings Tab Is A Parity Leak

Evidence:

- `settings` is part of the production location union: `REMAKE/src/engine/GameSession.ts:6`.
- `App` always renders the settings tab, independent of query params or build mode: `REMAKE/src/ui/App.tsx:91`, `REMAKE/src/ui/App.tsx:95`.
- Tests assert it is visible by default in the harness path: `REMAKE/src/tests/e2e/app.spec.ts:49`, `REMAKE/src/tests/e2e/app.spec.ts:51`.
- The docs correctly log it as a deviation: `REMAKE/docs/parity-checklist.md:31`, `REMAKE/docs/parity-checklist.md:219`, `REMAKE/docs/deviations.md`.

Why this matters:

The project knows this is not original. That does not make it harmless. A Dark Room's first trick is that the interface withholds the future. A permanent "settings" tab with speed and income multipliers says "this is a dev tool" before the player has even earned a forest.

Recommendation:

Keep the debug controls, but gate them behind `?debug=1`, a dev-only build flag, or the existing test harness. For release-parity screenshots and default entry, remove the tab entirely. If it must stay during development, treat every visual baseline containing it as a dev-baseline, not a parity-baseline.

### Medium - The UI Still Calls Runtime Objects Directly Instead Of Dispatching Game Commands

Evidence:

- `RoomView` receives `RoomRuntime` and calls `room.lightFire()`, `room.stokeFire()`, `room.build()`, and `room.buy()` directly from button handlers: `REMAKE/src/ui/RoomView.tsx`.
- `OutsideView` receives `OutsideRuntime` and calls `outside.gatherWood()`, `outside.checkTraps()`, `outside.increaseWorker()`, and `outside.decreaseWorker()` directly: `REMAKE/src/ui/OutsideView.tsx`.
- `GameEngine` has a command bus, but current gameplay actions bypass it. The registered commands are only generic state/cooldown/notify primitives: `REMAKE/src/engine/GameEngine.ts:87`, `REMAKE/src/engine/GameEngine.ts:89`, `REMAKE/src/engine/GameEngine.ts:94`.
- The plan says React components should dispatch commands and render snapshots, with gameplay decisions kept out of UI.

Why this matters:

This is not catastrophic yet because the only real modules are Room and Outside. But once Events, Combat, World, and Space arrive, passing runtime objects into React components will encourage UI components to become thin controllers over mutable engine internals. The architecture will look headless on paper while the UI keeps a hand on the steering wheel.

Recommendation:

Introduce typed game commands such as `room.lightFire`, `room.build`, `outside.checkTraps`, and `outside.assignWorker`. Let UI dispatch commands through a session facade, not hold runtime instances. Keep runtimes private implementation details of the session/engine boundary.

### Medium - Test Coverage Is Green But Too Much Confidence Comes From State Injection

Evidence:

- E2E tests define `setState()` through `window.__adrTest`: `REMAKE/src/tests/e2e/app.spec.ts:9`, `REMAKE/src/tests/e2e/app.spec.ts:16`.
- The Phase 4 browser test creates Outside state directly: `features.location.outside`, `trap`, `hut`, `lodge`, and `population`: `REMAKE/src/tests/e2e/app.spec.ts:245`, `REMAKE/src/tests/e2e/app.spec.ts:247`, `REMAKE/src/tests/e2e/app.spec.ts:248`, `REMAKE/src/tests/e2e/app.spec.ts:249`, `REMAKE/src/tests/e2e/app.spec.ts:250`, `REMAKE/src/tests/e2e/app.spec.ts:251`.
- Visual tests also synthesize most interesting states with direct state writes: `REMAKE/src/tests/e2e/room-visual.spec.ts:35`, `REMAKE/src/tests/e2e/room-visual.spec.ts:43`, `REMAKE/src/tests/e2e/room-visual.spec.ts:51`, `REMAKE/src/tests/e2e/room-visual.spec.ts:64`.
- There is a natural Phase 3 playthrough test, but no natural Phase 4 playthrough from building huts to population growth to worker assignment without state injection.

Why this matters:

Harness state injection is a legitimate testing tool. The problem is using it as proof that gameplay progression works. The current tests prove the UI can render and manipulate a manufactured Phase 4 state. They do not prove a player naturally reaches a village with workers through the actual game loop.

Recommendation:

Add one natural integration/e2e test that starts fresh, accelerates time, gathers enough wood, builds hut/lodge through real actions, advances population, assigns a worker, collects income, and verifies the final stores/workers. Keep injected-state visual tests, but stop letting them carry progression claims.

### Medium - Visual Coverage Does Not Yet Prove The Current Phase 4 UI

Evidence:

- The only full-shell screenshot is named and scoped as Phase 3: `REMAKE/src/tests/e2e/room-visual.spec.ts:71`, `REMAKE/src/tests/e2e/room-visual.spec.ts:75`.
- The Outside visual baseline covers gather/trap, not a populated village with worker rows: `REMAKE/src/tests/e2e/room-visual.spec.ts:62`, `REMAKE/src/tests/e2e/room-visual.spec.ts:68`.
- The checklist marks Outside worker table readability complete, while Path/World/Event/Combat/Ship/Fabricator/Space visuals remain unchecked: `REMAKE/docs/parity-checklist.md:219`, `REMAKE/docs/parity-checklist.md:221`, `REMAKE/docs/parity-checklist.md:222`, `REMAKE/docs/parity-checklist.md:224`, `REMAKE/docs/parity-checklist.md:225`, `REMAKE/docs/parity-checklist.md:226`.
- Browser zoom checks remain unchecked: `REMAKE/docs/parity-checklist.md:226`.

Why this matters:

The current visuals look sparse and mostly faithful. But the visual evidence is behind the implementation claims. Worker controls are one of the first dense UI surfaces in the remake, and the screenshot set does not lock down that state.

Recommendation:

Add full-shell and focused screenshots for Phase 4 states: empty forest, traps, lonely hut, populated hut, worker assignment, worker income, and cooldown-in-progress. Run them at all four target widths. Add at least one zoom check before calling 4K/layout acceptance complete.

### Medium - Data Coverage Is Broad, But Runtime Behavior Coverage Is Still Thin

Evidence:

- Source-derived direct comparisons exist for room craftables/trade goods, outside income/traps, path constants/weights, and fabricator craftables: `REMAKE/src/tests/content/source-data-snapshot-parity.test.ts`.
- The parity checklist marks many source data domains complete: `REMAKE/docs/parity-checklist.md:47`, `REMAKE/docs/parity-checklist.md:49`, `REMAKE/docs/parity-checklist.md:54`, `REMAKE/docs/parity-checklist.md:55`, `REMAKE/docs/parity-checklist.md:56`.
- The corresponding runtime sections for Path, World, Ship, Fabricator, Space, Event, and Combat are unchecked.

Why this matters:

This is a classic remake trap: porting tables feels like progress because the diff is tangible, but callback behavior, scene transitions, combat timing, world generation, death, loot, and ending flow are where parity actually lives. The project has a foundation. It does not yet have most of the game.

Recommendation:

For each future phase, require at least one behavior scenario test before any checklist item can be marked complete. Do not mark a domain "complete" in any status summary unless both data and runtime behavior are covered, or explicitly call it "data-only complete."

### Low - The Layout Is Tastefully Sparse, But It Is Also Rigid

Evidence:

- CSS locks the original-near wrapper at 920px, location width at 700px, and stores width at 220px: `REMAKE/src/ui/styles/global.css:10`, `REMAKE/src/ui/styles/global.css:12`.
- The app shell uses a fixed left notification reserve: `REMAKE/src/ui/styles/global.css:35`.
- Room/Outside/Settings panels are constrained to the location width: `REMAKE/src/ui/styles/global.css:84`, `REMAKE/src/ui/styles/global.css:87`.
- Mobile-ish fallback starts at 760px despite mobile being deferred: `REMAKE/src/ui/styles/global.css:653`.

Why this matters:

The current layout looks close to the original and avoids modern dashboard noise. That is good. The price is that it is tuned around early screens and manually positioned panels. Future event/combat/world/ship/space surfaces will stress this quickly.

Recommendation:

Keep the original-near visual language, but define per-module layout contracts before Event/Combat/World arrive. Avoid letting absolute positioning become the default escape hatch for every new surface.

## Game Evaluation

The playable loop is currently:

- fresh Room
- light/stoke fire
- builder discovery and warming
- outside unlock
- gather wood
- build early Room items
- traps and trap loot
- huts/population/worker model once state reaches that point
- worker assignment and passive income

That is a credible early-game runtime. It has actual timers, cooldowns, original messages, original-ish store grouping, deterministic trap drops, population timers, and consumption-blocked worker jobs.

But it stops before the game becomes the game. There is no event scheduler, no event scenes, no combat, no dusty path, no outfitting, no world map, no landmarks, no death loop, no ship, no fabricator, no space, no ending. The prototype has the opening economy but not the adventure, not the danger, not the reveal into a larger world.

The roast: the current build can simulate villagers making bait, but it cannot yet give the player a reason to care that bait exists.

## UI Evaluation

The default visual direction is one of the strongest parts of the current implementation. The UI is sparse, readable, mostly original-near, and not polluted by illustrations, cards, gradients, or dashboard furniture. The Times-style typography and restrained controls are a better fit than the earlier generic app shell direction.

The weak spots:

- The visible `settings` tab breaks the first-screen fiction.
- Inline costs are useful and documented, but they make the UI more explicit than the original.
- Worker controls are compact, but still need visual baselines in real worker-heavy states.
- Current screenshots mostly prove Room/early Outside, not the current declared Phase 4 surface.
- No future dense surfaces have been proven: event panel, combat, world map, outfitting, ship, fabricator, space.

## Code And Engine Evaluation

Strengths:

- The engine is React-independent by import boundary.
- State paths, RNG, clock, cooldowns, notifications, and command/event buses are small and testable.
- Room and Outside snapshots are explicitly side-effect-free in tests.
- The runtime code is readable and not over-abstracted.
- Source-derived data tests compare important tables against the original scripts.

Weaknesses:

- The command bus exists, but gameplay UI does not use gameplay commands.
- Runtime instances are passed into React components.
- `GameSession` is doing useful orchestration but is not yet a real module registry or command boundary.
- Dev save/load is not wired into the running browser app.
- Future systems are represented as data and spikes, not production engine modules.

The current architecture is good enough for Room/Outside. It is not yet proven for event trees, combat, world generation, and space. That is the next serious engineering exam.

## Test Evaluation

The checks are legitimately healthy:

- 123 unit/content/architecture tests passed.
- Production build passed.
- 96 Playwright tests passed across four desktop widths.
- Visual baselines exist for Room, early Outside, and a Phase 3 full shell.

The test suite's blind spots are also clear:

- No full playthrough smoke.
- No natural Phase 4 browser progression.
- No browser save/load persistence test.
- No event/combat/path/world/ship/fabricator/space runtime tests because those systems do not exist yet.
- No zoom matrix despite the UI spec mentioning it.
- Visual tests use state injection for most non-fresh states.

## Progress Evaluation

Best current status statement:

Phase 0 through Phase 4 foundations are substantially implemented, with Room and Outside/Village runtime slices working. Phase 5+ gameplay remains unimplemented. Data coverage is much further ahead than runtime coverage.

Do not say:

- "The remake is playable" without qualifying "early Room/Outside slice."
- "Data parity complete" as if that implies behavior parity.
- "4K support complete" beyond implemented Room/Outside states.
- "Dev save/load complete" until it works in the browser session.

## Prioritized Next Actions

1. Wire real dev save/load into the browser session.
   - Export and inject `LocalStorageDevSaveAdapter`.
   - Add session methods and e2e persistence coverage.

2. Hide or query-gate the debug settings tab.
   - Keep it for parity work.
   - Remove it from default parity UI and screenshots.

3. Add a natural Phase 4 progression test.
   - Fresh start to hut/lodge/population/worker/income using real actions and time advancement.

4. Add Phase 4 worker/village visual baselines.
   - Include full shell and focused panel screenshots at 1366, 1920, 2560, 3840.

5. Turn the command bus into the gameplay action path.
   - Stop passing runtime objects to UI components.

6. Start Phase 5 Event Runtime as a real vertical slice.
   - Event pool scheduling, availability, scene text, buttons, costs, rewards, deterministic chance branch.

7. Keep checklist language strict.
   - Mark data-only work as data-only.
   - Mark runtime parity only when player-reachable behavior exists.

## Checks Run

- `npm test`
  - Result: passed
  - Count: 24 test files, 123 tests
- `npm run build`
  - Result: passed
  - Output bundle: `dist/assets/index-diqwOsMt.js` 264.61 kB, gzip 82.37 kB
- `npm run test:e2e`
  - Result: passed
  - Count: 96 Playwright tests
  - Projects: chromium-1366, chromium-1920, chromium-2560, chromium-3840

## Residual Risk

The current codebase is in decent shape for where it really is. The danger is status inflation. The next phases contain the hard parts: event state, combat timing, world generation, resource death loops, setpieces, and space. If the project keeps accepting data parity and harness-rendered states as runtime parity, the technical foundation will stay green while the actual game remains hollow.

The correct next move is not another polish pass on the Room shell. It is to build the first real Event Runtime slice and make the player encounter something the code did not manually pre-arrange through `setState()`.
