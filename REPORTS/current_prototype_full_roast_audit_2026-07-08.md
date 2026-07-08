# Current Prototype Full Roast Audit

Date: 2026-07-08

## Executive Verdict

The prototype is technically healthier than it looks: lint, build, formatting, unit tests, browser tests, and dependency audit all pass. But as a game prototype, it is still not close to playable parity. It is a strong Room/Outside/Event/Combat slice with a lot of data-driven late-game coverage behind harnesses, not a coherent _A Dark Room_ remake loop yet.

## Scope And Methodology

Inspected:

- `REMAKE` React/Vite prototype structure
- project docs, parity checklist, context, deviations, and plan
- core app shell, session boundary, event runtime, combat runtime, state store, UI, styles, and tests
- visual baselines for Room/Outside surfaces

Checks run:

- `npm run lint`
- `npm run build`
- `npm test`
- `npm run format:check`
- `npm run test:e2e`
- `npm audit --audit-level=moderate`

Result: all checks passed; `npm audit` reported 0 vulnerabilities.

## Findings

### Critical: The Player-Facing Prototype Stops At Room/Outside Plus Modal Events

Evidence:

- `GameLocationKey` only supports `room | outside | settings`.
- `App.tsx` only renders `RoomView`, `OutsideView`, or `SettingsView`.
- Path, World, Ship, Fabricator, Space, ending, and full playthrough remain open in `REMAKE/docs/parity-checklist.md`.

Recommendation:

Stop expanding late-game catalogs until Phase 7/8 make the player loop reachable. Mark the current build as a slice, not a playable parity candidate.

### High: Late-Game Browser Coverage Is Synthetic

Evidence:

- E2E tests use `window.__adrTest?.setState`, `triggerWorldEncounter`, and `triggerEventByKey` for major late-game flows.
- These tests prove runtime slices, not organic gameplay reachability.

Recommendation:

Require one no-harness browser path per implemented phase. Harness tests remain valuable, but they must not be counted as player-reachable parity.

### High: EventRuntime Owns Too Much World/Path Bridging

Evidence:

- World encounter bands and landmark-to-setpiece mappings live in `EventRuntime`.
- `EventRuntime` also imports Path weight/capacity helpers for loot handling.

Recommendation:

Move World event selection into a World boundary and move return-marker consumption into a Path/session boundary. EventRuntime should execute event keys, not decide world topology.

### High: Documentation Can Be Overread As Readiness

Evidence:

- Docs say Phase 6 is finalized, but the checklist still leaves full event title/scene parity, Path, World, Ship, Fabricator, Space, full playthrough, and ending open.

Recommendation:

Add a short readiness warning to the active docs: not playable past Outside; late-game slices are harness-driven.

### Medium: State Access Is Too Loose For The Next Phases

Evidence:

- `GameState` is mostly `Record<string, unknown>`.
- `StateStore.get(path, true)` silently converts missing paths to zero.

Recommendation:

Add typed domain selectors before Phase 7/8, then use them at integration boundaries.

### Medium: Harness Tests Outnumber Organic Reachability Tests

Evidence:

- Current tests are strong for deterministic runtime behavior, but many browser states are direct injections.

Recommendation:

Keep harness tests for edge cases, but add organic browser smoke tests for every implemented phase before calling that phase complete.

### Low: Loot Drop Menu Needs Stronger Accessibility Semantics

Evidence:

- The drop menu is hover/focus-driven and has no explicit expanded state or Escape behavior.

Recommendation:

Make it a controlled menu with `aria-haspopup`, `aria-expanded`, Escape close, and deterministic keyboard behavior.

## Game Evaluation

Room and Outside are the strongest parts. They preserve the sparse original feel and have good visual coverage. Event and Combat are architecturally much better than a simple modal hack, but late-game content is still disconnected from the actual adventure loop.

## UI Evaluation

The UI is intentionally bare, and that is correct for _A Dark Room_. The risk is not aesthetics; it is that future tabs and systems are not real yet, while spike views exist only behind `?spikes=1`.

## Code/Test Evaluation

Good: engine/UI boundaries exist, `CombatRuntime` is separated, deterministic RNG is enforced, and all checks pass.

Weak: `EventRuntime` was carrying World selection logic, and broad string-path state makes future integration fragile.

## Prioritized Next Actions

1. Keep Phase 7 focused on player-reachable Path/outfitting instead of adding more late-game catalogs.
2. Require organic no-harness browser coverage for each implemented phase.
3. Keep World selection outside EventRuntime.
4. Add typed selectors at every new domain boundary.
5. Treat the current late-game coverage as regression scaffolding, not playable parity.
6. Keep accessibility hardening on compact combat/loot controls.

## Residual Risk

The current prototype still cannot complete a fresh playthrough. Passing tests should be read as "the implemented slices are stable," not "the remake is playable."
