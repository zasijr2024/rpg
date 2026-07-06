# Changelog

All notable remake implementation changes are recorded here.

## 2026-07-06

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

