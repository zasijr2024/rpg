# Changelog

All notable remake implementation changes are recorded here.

## 2026-07-06

### Added - Phase 1 Engine Services

- Added typed `EventBus`.
- Added typed `CommandBus`.
- Added `NotificationCenter`.
- Added `CooldownManager` with renderable progress snapshots.
- Added memory-backed dev save adapter for deterministic save/load tests.
- Integrated core commands into `GameEngine`:
  - `state.set`
  - `state.add`
  - `notify`
  - `cooldown.start`
- Added dev-save round-trip support through the configured save adapter.
- Added unit tests for command dispatch, event publish/subscribe, notification recording, cooldown expiry/progress, engine command integration, and dev-save round trips.

### Verified - Phase 1 Engine Services

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 0.5 Risk Spike

- Added separated spike modules under `src/spikes`.
- Added 61x61 ASCII world viewport generator.
- Added miniature deterministic event runtime with cost, reward, transition, and RNG branch behavior.
- Added cooldown pressure simulator to prove timer ticks can be coalesced into lower-frequency UI notifications.
- Added Canvas and DOM space prototypes.
- Added spike UI panel with tabs, keyboard focus probe, ASCII viewport, and both space prototypes.
- Added Playwright 4K project at 3840x2160.
- Added e2e checks for:
  - ASCII viewport stability and no horizontal overflow
  - keyboard focus and world movement probe
  - Canvas and DOM space prototype visibility
- Recorded Space rendering direction in `tech-decisions.md`: use Canvas for final Space implementation unless later parity evidence disproves it.

### Verified - Phase 0.5 Risk Spike

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added

- Started implementation on `remake/parity`.
- Added Vite + React + TypeScript scaffold under `REMAKE/`.
- Added Vitest unit test configuration.
- Added Playwright desktop smoke test configuration.
- Added strict Vite dev server port `41730` to avoid collisions with unrelated local apps.
- Added initial restrained desktop UI scaffold.
- Added headless engine foundation:
  - deterministic `Mulberry32Rng`
  - manual test clock
  - path-based state store
  - initial game engine snapshot
  - dev-only save adapter using `adr-remake-dev-save`
- Added architecture-boundary tests:
  - engine cannot import React/UI
  - source cannot call `Math.random()` directly
- Added engine unit tests for RNG, clock, and state store.

### Verified

- `npm install`
- `npm test`
- `npm run build`
- `npm run test:e2e`

### Notes

- No gameplay has been implemented yet.
- The app shell is explicitly an implementation scaffold, not the final first-screen gameplay state.
- Save/load remains dev-only and disposable until post-parity save versioning.
