# Technical Decisions

Last updated: 2026-07-08

This file records accepted architecture decisions. Revisit only with evidence from implementation or risk spikes.

## TD-001: Use React With a Headless TypeScript Engine

Decision: use React for UI rendering and a framework-independent TypeScript engine for gameplay rules.

Reason:

- Most screens are stateful text UI, not sprite-heavy scenes.
- The engine must be testable without a browser.
- React components must render snapshots and dispatch commands only.

Enforcement:

- `src/engine` must not import `react`, `react-dom`, or UI modules.
- `src/data` must not import UI modules.
- `src/ui` must not mutate game state directly.
- Add dependency-boundary tests or lint rules in Phase 0.

## TD-002: Use Vite, TypeScript, Vitest, and Playwright

Decision:

- Vite for dev/build.
- TypeScript for source.
- Vitest for unit, engine, and data parity tests.
- Playwright for end-to-end and visual checks.

Reason:

- Low ceremony.
- Stable ecosystem.
- Good test ergonomics.
- Sufficient for desktop web target.

## TD-003: Use CSS Modules or Plain Scoped CSS

Decision: use local CSS, CSS custom properties, and a small internal UI primitive set. Do not use a heavyweight component library for parity.

Reason:

- The original atmosphere depends on sparse, restrained UI.
- Heavy component libraries tend to impose visual language and layout assumptions.

## TD-004: Use Typed TypeScript Content Modules, Not JSON-Only Data

Decision: source-derived gameplay data should be ported into typed TypeScript modules.

Reason:

- Original data includes callback behavior.
- Costs, availability checks, side effects, rewards, and scene branches are executable behavior.
- JSON-only conversion would either lose behavior or reintroduce ad hoc interpreters.

## TD-005: Deterministic RNG Is a Core Engine Requirement

Decision: all random behavior must go through an injectable deterministic RNG service.

Applies to:

- event scheduling
- trap drops
- world generation
- map landmark placement
- combat hits/misses
- loot tables
- scene chance branches
- space/asteroid randomness if gameplay-affecting

Reason:

- Parity tests need repeatability.
- Bugs in procedural systems need reproducible seeds.

## TD-006: Use Canvas Spike for Space, Do Not Commit Until Proven

Decision: use Canvas for the final Space implementation unless later parity testing proves it cannot match the original behavior.

Phase 0.5 evidence:

- Canvas space prototype renders in the app shell.
- DOM space prototype renders in the app shell for comparison.
- Playwright verifies both prototypes at 1920x1080 and 3840x2160.
- Canvas gives a clearer path for stable frame timing, symbol drawing, and collision checks without many positioned DOM nodes.

Acceptance:

- stable movement at target refresh rates
- collision behavior can match original
- visual output remains minimalist
- 4K scaling is controlled

## TD-007: Original Data Is Immutable After Parity

Decision: `content/original` must become immutable after parity except for documented bug fixes.

Reason:

- Future expansions must not contaminate original mode.
- Strict original mode is required.

## TD-008: Debug Multipliers Are Session Tooling, Not Gameplay Parity

Decision: the `settings` tab may expose default-off debug multipliers during parity work behind `?debug=1`, but multiplier behavior must stay isolated from original content data and absent from clean parity checks.

Applies to:

- `speed x 10` through the realtime clock/session layer
- `income x 10` through passive income application and display
- compact runtime debug info for manual verification
- dev save/load/clear controls for disposable parity session snapshots

Reason:

- Long original timers slow down manual parity testing.
- Debug speed/income controls must be easy to disable and test.
- Original data modules must remain unmodified.

Enforcement:

- Defaults are off.
- The tab is hidden by default and visible only when `?debug=1` is present.
- The deviation is logged in `REMAKE/docs/deviations.md`.
- Tests cover default-off state and multiplier behavior.

## TD-009: Dev Saves Snapshot Session Lifecycle During Parity

Decision: parity dev saves remain disposable and migration-free, but they must restore the active session lifecycle instead of only restoring `StateStore`.

Applies to:

- engine state
- manual clock time
- active cooldowns
- notification history
- Room runtime timers
- Outside runtime timers
- active Event Runtime scene and delayed actions

Reason:

- State-only saves made the UI look restored while silently losing pending progression.
- Long original timers make save/load-resume behavior necessary for manual parity work.

Enforcement:

- Save/load tests cover resumed builder progression, population growth, active event state, and delayed event action restore.

## TD-010: Keep Clean Visual Parity Separate From Debug Tooling

Decision: debug tooling is opt-in behind `?debug=1`, and visual parity screenshots must not use that parameter.

Applies to:

- Room visual baselines
- Outside visual baselines
- full-shell visual baselines
- manual screenshot review

Reason:

- The debug tab is useful for development but is not original UI.
- Screenshot drift should catch gameplay/UI regressions, not the presence of tooling.
- The same test harness can still provide deterministic state setup without showing debug controls.

Enforcement:

- `room-visual.spec.ts` navigates with `?testHarness=1` and no `debug=1`.
- E2E coverage still asserts hidden default state, clean `?debug=0` state, and opt-in `?debug=1` state separately.

## TD-011: Cross-Runtime Event Effects Must Be Explicitly Wired

Decision: event content may declare cross-runtime effects, but the runtime must expose a separate capability check before a player can spend resources on an effect owned by a later runtime.

Applies to:

- Scout `buy map` and the later World map reveal algorithm
- Outside hut destruction and villager death side effects
- setpiece, Path, and World event hooks

Reason:

- A no-op event bridge can silently burn player resources while looking like parity.
- Event data should stay source-derived, but runtime ownership must remain explicit.
- Later systems need to plug into events without making `EventRuntime` a dumping ground for unrelated rules.

Enforcement:

- Scout map purchase is hidden unless `canApplyMap` is true and the full map-reveal `applyMap` handler is wired.
- Event runtime tests cover hidden/unspendable Scout map behavior when the map-reveal capability is absent.
- Later cross-runtime effects need both a capability predicate and the effect handler.

## TD-012: Combat Needs a Runtime Boundary Before Full Encounter Expansion

Decision: Phase 6 must define or extract a combat runtime boundary before adding full encounter, setpiece, and executioner coverage.

Boundary:

- `EventRuntime` owns event scheduling, scene loading, modal lifecycle, scene text, non-combat buttons, and scene-level rewards/effects.
- The combat boundary owns combat phase, player/enemy health, attack/heal actions, weapon cooldown interpretation, enemy attack timing, loot rolling/taking, player death, and outfit/return semantics.
- Event scenes may mount a combat definition and receive combat outcomes, but they must not accumulate encounter-specific special cases directly in event lifecycle code.

Reason:

- The current representative combat slice is useful, but expanding it inside `EventRuntime` would make later encounter parity brittle.
- Player death and outfit return semantics depend on Path/World rules and must be solved centrally before broad enemy coverage.

Enforcement:

- Keep direct `CombatRuntime` tests plus the representative `A Snarling Beast` event integration tests as guardrails.
- Do not mark full combat parity complete until player death, outfit return/drop, and Path capacity interactions are covered.
- New encounter families must include tests for the combat boundary rather than only `triggerEventByKey` event-panel tests.

## TD-013: Phase 7 Owns Path Semantics Before Broad World Expansion

Decision: Phase 7 hardening must complete original Path/outfitting semantics before Phase 8 expands into full World generation and landmark parity.

Boundary:

- `PathRuntime` owns Path reveal state, outfitting, capacity/free-space calculations, carryable supply movement, perk display, embark preparation, and safe-return outfit/store reconciliation.
- `WorldRuntime` may consume an outfit through embark and provide return targets, but broad terrain generation, roads, landmark distribution, danger, outposts, mine integration, ship discovery, fabricator discovery, and executioner reachability remain Phase 8+ work.
- Combat/Event code may request return handling through explicit session contracts, but must not write ad hoc Path or World state.

Reason:

- The first Path/World slice made the player funnel reachable, but full Path parity is still the next dependency for reliable World exploration.
- Expanding World first would compound bad assumptions about carry capacity, water, armour, perks, and outfit return behavior.
- Phase 6 is finalized for its pragmatic combat/event boundary, so new work should strengthen the downstream Path contract instead of reopening combat coverage without evidence.

Enforcement:

- Phase 7 changes need source/data evidence plus engine/session tests for store/outfit invariants.
- Any player-facing Path UI change needs E2E or visual coverage at the supported desktop widths.
- Keep the organic fresh-room-to-Path-to-World-return smoke passing while Path is hardened.

## TD-014: Vite Chunk Warning Policy During Parity Phases

Decision: The current Vite production chunk-size warning is accepted during active parity work and is tracked as a release-hardening concern, not a gameplay parity blocker.

Boundary:

- Do not split chunks merely to silence the warning while World, Setpieces, Ship, Fabricator, Space, and ending surfaces are still moving.
- Revisit chunking after Phase 8 and again before any public release candidate, when late-game module boundaries have stabilized enough to split intentionally.
- A build failure, runtime loading regression, or materially worse first-load behavior can promote this from accepted warning to active implementation work.

Reason:

- The warning currently reflects one bundled app surface, not a failing build.
- Premature chunk splitting would create churn while feature ownership and late-game routing are still changing.
- A documented warning policy keeps CI/build output honest without pretending the bundle is already release-optimized.

Enforcement:

- `npm run build` may pass with the known Vite chunk warning during parity phases.
- Any new asset-heavy feature must still justify large dependencies and avoid accidental generated artifact imports.
