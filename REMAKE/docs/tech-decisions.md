# Technical Decisions

Last updated: 2026-07-09

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

Decision: parity dev saves must restore the active session lifecycle instead of only restoring `StateStore`. The original disposable-format constraint is superseded for production readiness by TD-016; the lifecycle payload boundary remains authoritative.

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

- Scout map purchase is hidden unless `canApplyMap` is true; Phase 8 now satisfies that through the World runtime mask-reveal handler.
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
- Full combat parity is now complete; preserve player death, outfit return/drop, and Path capacity contracts as regression guardrails.
- New encounter families must include tests for the combat boundary rather than only `triggerEventByKey` event-panel tests.

## TD-013: Phase 7 Owns Path Semantics Before Broad World Expansion

Decision: Phase 7 hardening must complete original Path/outfitting semantics before Phase 8 expands into full World generation and landmark parity.

Boundary:

- `PathRuntime` owns Path reveal state, outfitting, capacity/free-space calculations, carryable supply movement, perk display, embark preparation, and safe-return outfit/store reconciliation.
- `WorldRuntime` may consume an outfit through embark and provide return targets. Terrain, roads, landmarks, danger, Outposts, Mines, Ship/Fabricator discovery, complete Setpieces/Executioner integration, player-facing late-game modules, and full parity QA are finalized downstream without moving Path resource authority into those modules.
- Combat/Event code may request return handling through explicit session contracts, but must not write ad hoc Path or World state.

Reason:

- The first Path/World slice made the player funnel reachable, but full Path parity is still the next dependency for reliable World exploration.
- Expanding World first would compound bad assumptions about carry capacity, water, armour, perks, and outfit return behavior.
- Phase 6 is finalized for its pragmatic combat/event boundary, so new work should strengthen the downstream Path contract instead of reopening combat coverage without evidence.

Enforcement:

- Phase 7 changes need source/data evidence plus engine/session tests for store/outfit invariants.
- Any player-facing Path UI change needs E2E or visual coverage at the supported desktop widths.
- Keep the organic fresh-room-to-Path-to-World-return smoke passing while Path is hardened.

## TD-014: Post-Parity Production Chunk Headroom

Decision: The temporary parity-phase exception is retired. Production isolates the original event catalog from the interactive entry, keeps late-game views lazy, and requires a distinct retry URL for every recoverable late-game route.

Boundary:

- The entry budget is 480,000 raw bytes / 125,000 gzip bytes; it must not drift back toward the former 600,000-byte cliff.
- Total JavaScript remains capped at 610,000 raw bytes / 155,000 gzip bytes, and every lazy entry remains capped at 4,000 raw bytes / 2,000 gzip bytes.
- Repeated immutable event strings may be pooled in the production event-catalog chunk. The source catalog remains readable and unchanged, while production browser coverage must execute a pooled event transition.
- Fabricator, Ship, and Space each emit an independent retry entry so a browser that caches a failed module request can recover without discarding the active save.

Reason:

- The Phase 14 audit measured a 599,941-byte entry with only 59 bytes of headroom and no failed-chunk recovery.
- The post-parity module boundaries are stable enough to split intentionally, and repeated executioner/setpiece text makes a production-only string pool both high-value and behavior-preserving.
- The accepted implementation emits a 416,217-byte entry and 587,897 bytes across all JavaScript on the integrated July 11 tree. The event catalog is 151,593 bytes, down from roughly 195 kB before pooling, and all route/retry entries remain below 4 kB.

Enforcement:

- `npm run build` requires the event-catalog chunk, distinct Fabricator/Ship/Space retry entries, compiled-out development surfaces, and all versioned performance budgets.
- Cross-browser production Playwright coverage aborts every late-game route chunk, requires recoverable UI, retries through a fresh module URL, verifies the save survives, and executes an event scene from the pooled catalog.

## TD-015: Phase 8 Stops At World-Side Ship/Fabricator Discovery

Decision: Phase 8 owns the World exploration contracts that discover Ship/Fabricator state, but it does not own the player-facing Ship or Fabricator modules.

Boundary:

- Phase 8 may generate and store Ship direction, unlock `features.location.spaceShip` on original safe-return discovery, and initialize base Ship hull/thrusters.
- Phase 8 may unlock `features.location.fabricator` from the Executioner discovery flag and emit the original builder notification on safe return.
- Phase 10 owns the player-facing Ship tab, hull/thruster display, reinforcement, engine upgrades, and Ship notifications. The remediation spine splits player-facing lift-off and its Space handoff into `RA-P1-13` so it cannot become an inert control before Space exists.
- Phase 11 owns the player-facing Fabricator tab, craftable visibility, blueprint gates, costs, quantities, and fabrication side effects.

Reason:

- Phase 8 is already broad enough with original World generation, movement, visibility, roads, outposts, mines, encounters, and landmark consequences.
- Pulling late-game module controls into Phase 8 would make World parity closure dependent on unrelated UI surfaces.
- The existing plan already has dedicated Ship and Fabricator phases, and keeping those boundaries makes verification clearer.

Enforcement:

- Phase 8 status/checklist language must describe Ship/Fabricator work as discovery/unlock consequences only.
- Do not block Phase 8 closure on Ship/Fabricator tabs or controls.
- Do not add player-facing Ship/Fabricator UI before the corresponding later phase unless the plan is explicitly revised.

## TD-016: Durable Saves Separate Storage Schema From Lifecycle Schema

Decision: production autosaves use a checksummed, versioned storage envelope around the validated session/engine lifecycle payload. Storage schema version 1 is the compatibility boundary; payload version 2 remains the current runtime lifecycle contract.

Boundary:

- `adr-remake-dev-save` remains the primary key for compatibility. `:staging` is never loadable, `:backup` retains one previous committed generation, and `:quarantine` retains the rejected primary plus its deterministic reason.
- Commits write staging, preserve the previous decodable primary as backup, replace primary, then remove staging. Recovery may promote only a decoded backup, never staging.
- Invalid JSON, checksum mismatch, malformed documents, incompatible schema versions, and invalid runtime payloads are rejected before live state mutation. Runtime validation failure triggers one backup attempt; a consumed bad backup cannot loop across startups.
- Unversioned session-v2, engine-v2, and legacy remake state snapshots are supported migration sources. Unknown/future schemas and original-game save imports are not inferred.

Reason:

- Multi-hour progression needs a recoverable last-known-good generation and an explicit compatibility promise before Production Beta.
- Keeping storage and lifecycle versions independent avoids changing the durable format whenever a runtime subsystem adds internal snapshot state.
- A small explicit migration set is safer than treating arbitrary parsed JSON as an old save.

Enforcement:

- Storage/session tests cover corruption, partial/stale writes, incompatible schemas, every supported migration source, semantic validation failure, backup consumption, reset, and exact lifecycle/RNG restoration.
- Chromium reload evidence corrupts the primary document and observes the prior committed visible generation without direct state injection into the live session.

## TD-017: Original Mode Keeps Source-Authentic Balance Rough Edges

Decision: the default original ruleset retains the source's dominant and dominated choices after parity. A balance pass may not silently change Hunter/Gatherer score efficiency, Alien Alloy conversion value, Wanderer or Beggar expected value, or the progression-only role of processing workers.

Reason:

- These relationships are source-authentic product behavior, not remake regressions.
- Changing them inside the original ruleset would destroy the fidelity contract just after the parser-backed denominator closed.
- The uncontrolled progression study and real unassisted sessions must establish actual player bottlenecks before tuning is justified.
- The current four-seed scripted policy completes 0/4 but is not yet policy-valid and is not human evidence. It does not authorize changing original mode.

Enforcement:

- Any rebalance must use a separately named ruleset or mode and a new save-compatibility decision.
- Proposals must include before/after faucet, sink, expected-value, completion, death, and abandonment evidence.
- `content/original` remains immutable except for documented source/parity corrections.
- `P14V-04`/`P14V-05` own policy-valid automated evidence, `P14V-06` owns the human cohort, and `P14V-08` owns the dated release decision. Until that decision, original mode remains the only release ruleset and the default.
