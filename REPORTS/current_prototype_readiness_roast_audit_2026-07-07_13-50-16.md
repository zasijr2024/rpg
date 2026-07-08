# Current Prototype Readiness Roast Audit

Date: 2026-07-07 13:50:16  
Scope: readiness of `REMAKE/` after latest roast-audit remediation, with emphasis on whether the prototype is genuinely ready to enter the next phase.

## Executive Verdict

Ready for the next phase: yes, with a narrow definition.

This prototype is ready to start Phase 6 Combat Event Runtime work. It is not ready to claim the game is broadly playable, balanced, or representative of the full _A Dark Room_ arc. The opening Room/Outside/Event foundation is now disciplined enough to build on. The previous concrete blockers were addressed: Scout map purchase no longer silently spends resources on an unwired World bridge, event lifecycle restore is self-contained, passive fresh-run Phase 5 scheduling has browser coverage, and combat death has at least a pinned representative guardrail.

The roast: the prototype has graduated from "carefully tested doorway" to "safe construction site." That is progress. It is still not the house.

## Scope And Methodology

Inspected:

- Phase and scope docs: `REMAKE/docs/context.md`, `REMAKE/docs/parity-checklist.md`, `REMAKE/docs/tech-decisions.md`, `REMAKE/docs/ui-spec.md`.
- Latest prior audit: `REPORTS/current_prototype_full_roast_audit_2026-07-07_13-29-37.md`.
- Runtime hot spots: `REMAKE/src/engine/events/EventRuntime.ts`, `REMAKE/src/content/original/events/eventData.ts`.
- UI hot spots: `REMAKE/src/ui/App.tsx`, `REMAKE/src/ui/EventPanel.tsx`, `REMAKE/src/ui/styles/global.css`.
- Readiness tests: `REMAKE/src/tests/engine/event-runtime.test.ts`, `REMAKE/src/tests/e2e/app.spec.ts`.
- Tooling scripts in `REMAKE/package.json`.

Checks run:

- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run check:architecture`
- `npm run build`
- `npm run test:e2e`

Results:

- Format check passed.
- Lint passed.
- Unit/integration tests passed: 153 tests.
- Architecture boundary tests passed: 5 tests.
- Production build passed.
- Playwright/browser/visual suite passed: 168 tests.

## Findings

### No Critical Or High Readiness Blockers

Evidence:

- Current phase docs explicitly bound Phase 5 to non-combat Global/Room/Outside/Marketing events and state that full combat, encounter, setpiece, executioner, Path/outfit return, and World map parity remain later work: `REMAKE/docs/context.md:3`, `REMAKE/docs/context.md:38`.
- The previous Scout no-op bridge is now hard-gated through `canApplyMap`: `REMAKE/src/content/original/events/eventData.ts:43`, `REMAKE/src/content/original/events/eventData.ts:694`, `REMAKE/src/engine/events/EventRuntime.ts:869`.
- `EventRuntime.restoreLifecycle()` now clears its own timers and delayed actions: `REMAKE/src/engine/events/EventRuntime.ts:272`, `REMAKE/src/engine/events/EventRuntime.ts:279`, `REMAKE/src/engine/events/EventRuntime.ts:845`.
- Representative combat death is now tested and no longer treats `0` HP as implicit full health: `REMAKE/src/engine/events/EventRuntime.ts:589`, `REMAKE/src/engine/events/EventRuntime.ts:686`, `REMAKE/src/tests/engine/event-runtime.test.ts:508`.
- Passive fresh-run Marketing event scheduling now has browser coverage: `REMAKE/src/tests/e2e/app.spec.ts:591`.

Assessment:

The last audit's concrete implementation blockers are closed. The remaining problems are scope boundaries and next-phase risks, not reasons to hold Phase 6.

### Medium: Phase 6 Must Start With Combat Boundary Work, Not Enemy Data Dumping

Evidence:

- Combat logic still lives inside `EventRuntime`: attack/heal actions, weapon cooldowns, stun, enemy timers, loot, death, and HP calculations are all in one class.
- The technical decision now explicitly says combat needs a runtime boundary before full encounter expansion: `REMAKE/docs/tech-decisions.md:197`.
- Combat parity is still marked in-progress, not complete: `REMAKE/docs/parity-checklist.md:134`.

Why this matters:

If Phase 6 starts by adding every encounter into the current `EventRuntime`, the code will turn into a pile of special cases. The current implementation is acceptable as a representative slice; it is not an acceptable long-term home for all combat behavior.

Recommendation:

First Phase 6 task should be a combat boundary extraction or at minimum a combat service/interface with tests. Only then add encounter breadth.

### Medium: Death And Outfit Return Are Still The Biggest Gameplay Risk

Evidence:

- Current death path marks `character.dead` and closes combat, but full original death return/outfit behavior remains open: `REMAKE/docs/parity-checklist.md:146`, `REMAKE/docs/parity-checklist.md:290`.
- Path/outfit parity is still entirely open: `REMAKE/docs/parity-checklist.md:150`.

Why this matters:

Combat balance means nothing until death, carried inventory, returned loot, and world recovery semantics are correct. Otherwise enemy difficulty is just a fake number exercise.

Recommendation:

Implement death/outfit return semantics before expanding enemy coverage beyond the representative slice.

### Medium: The UI Is Stable For Current Scope, But Still A Fixed-Geometry Trap

Evidence:

- Layout still relies on fixed columns and absolute positioning for notifications and event panels: `REMAKE/src/ui/styles/global.css:180`, `REMAKE/src/ui/styles/global.css:626`.
- Path/World layout slots are now documented: `REMAKE/docs/ui-spec.md:46`.
- Visual/browser checks pass across current supported desktop projects, but Path and World UI are not implemented.

Why this matters:

The current UI is stable because the current game surface is small. Path and World will stress the layout immediately. The documented slots are good, but they are not implementation.

Recommendation:

Before or during Phase 7/8, build Path/World layout skeletons with visual checks before filling in detailed gameplay.

### Medium: E2E Is Much Better, But Still Leans On State Injection

Evidence:

- There is now an organic fresh-run Marketing event test: `REMAKE/src/tests/e2e/app.spec.ts:591`.
- There is still extensive use of `setState` in browser tests for layout and feature slices.
- Full playthrough smoke test remains open: `REMAKE/docs/parity-checklist.md:254`.

Why this matters:

State injection is fine for isolated verification. It is weak evidence for pacing and natural integration. The suite is good at proving parts work; it still has limited proof that the whole game loop flows naturally.

Recommendation:

Add one organic scenario per future phase. Phase 6 should get a natural or near-natural combat scenario once Path/outfit prerequisites exist.

### Low: Event Modal Accessibility Is Functional, Not Finished

Evidence:

- `EventPanel` renders `role="dialog"` and `aria-modal`: `REMAKE/src/ui/EventPanel.tsx:33`.
- Focus trapping exists: `REMAKE/src/ui/EventPanel.tsx:121`.
- It still uses generic `aria-label="event"` instead of `aria-labelledby`, and no Escape/return-focus behavior is implemented.

Why this matters:

This is not a next-phase blocker, but it is unfinished modal hygiene.

Recommendation:

Add `aria-labelledby`, optional Escape behavior if parity permits, and focus-return coverage.

## Game Evaluation

The early game foundation is now credible. Room, fire, stores, Outside, traps, workers, population, non-combat events, and the representative combat slice are coherent enough to support the next implementation phase.

The game is still not meaningfully balanced beyond the opening/village/event layer. Missing Path, World, inventory capacity, full encounters, mines, setpieces, ship, space, and ending means midgame and late-game pacing cannot be judged. Do not tune resource balance yet.

## UI Evaluation

Current UI is ready for the next phase because the implemented surfaces pass visual/browser checks and the debug/spike surfaces are gated. It remains intentionally sparse and original-near.

The weakness is future expansion pressure. The current geometry works for Room/Outside/Event. It will not survive Path/World growth unless the documented layout slots are implemented deliberately.

## Code And Architecture Evaluation

The architecture is in better shape than before the remediation:

- Cross-runtime effects now have capability gating.
- Event lifecycle restore owns its timers.
- HP `0` is no longer confused with missing health.
- The combat boundary risk is documented as a technical decision.

The main architectural smell remains `EventRuntime` gravity. It is carrying enough combat behavior to prove the slice, but not enough structure to absorb all encounters cleanly.

## Test And Tooling Evaluation

The tooling gate is strong for this stage:

- 153 Vitest tests.
- 168 Playwright tests.
- Architecture boundary checks.
- Build/typecheck.
- Format/lint.
- Visual baselines for implemented surfaces.

The suite is still not a full-game confidence machine because full playthrough, Path, World, and death/outfit scenarios are not implemented.

## Readiness Decision

Phase 6 may begin.

Allowed next work:

1. Extract or define the combat runtime boundary.
2. Implement death/outfit return semantics.
3. Add representative encounter coverage through that boundary.
4. Keep `EventRuntime` as event lifecycle owner, not the permanent home for every combat special case.

Not allowed:

1. Mark full combat parity complete.
2. Add broad encounter data before death/outfit semantics are solved.
3. Treat the prototype as game-feel complete.
4. Build Path/World panels ad hoc against the current fixed layout.

## Residual Risk

The remaining risk is not hidden broken Phase 5 behavior. It is future integration complexity. The next phase is where the project either preserves its clean architecture or starts burying midgame complexity inside the event runtime.

Blunt summary: yes, move on. But move on with discipline. The foundation is ready; the game is not.
