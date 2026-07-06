# Changelog

All notable remake implementation changes are recorded here.

## 2026-07-06

### Added - Phase 2 Remaining Original Source Data Values

- Added typed original core engine/state/scoring data module.
- Ported exact engine constants:
  - site URL and encoded share URL
  - version
  - max store cap
  - save notification display timing
  - initial game-over flag
  - income tick and hyper-mode timing factor
- Ported exact engine option defaults.
- Ported exact StateManager categories.
- Documented original save migration steps from `1.0` to `1.3`.
- Ported exact score factor list and score bonuses for alien alloy, fleet beacon, and ship hull.
- Added pure helper for original score calculation.
- Completed Path constants with store offset, capacity upgrade priority, armour priority, non-craftable carryables, and capacity helper.
- Added deferred original audio manifest, including audio engine constants, every audio library key, asset path, and category.
- Added deferred localization inventory, including source template metadata, language registry path, locale data paths, and msgid counts.
- Wired core, path, audio, and localization data into the original content registry.
- Added parity tests for engine constants, state categories, migrations, scoring, Path constants, audio manifest, and localization inventory.

### Verified - Phase 2 Remaining Original Source Data Values

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Original Late-Game Data Values

- Added typed original late-game data module for Ship, Space, and Fabricator.
- Ported exact Ship constants:
  - lift-off cooldown
  - alloy cost per hull and thruster
  - base hull and thruster values
- Ported exact Space constants:
  - ship speed
  - asteroid delay and speed values
  - fade/ascent timing
  - starfield dimensions, star count, and animation speed
  - frame/timer intervals
  - original 700px playfield bounds and ship positions
  - asteroid speed randomization factor
- Ported exact Fabricator craftables, including type, cost, maximum, blueprint gate, quantity, and messages.
- Ported Space title thresholds, asteroid glyph probabilities, asteroid wave thresholds, hit-sound altitude tiers, and key bindings.
- Added pure helpers for ship speed, asteroid duration, asteroid scheduling delay, asteroid count by altitude, title lookup, hit audio tier, and background music volume.
- Wired late-game data into the original content registry.
- Added late-game parity tests for constants, manifest keys, Fabricator craftables, Space thresholds/tables, helper formulas, and registry wiring.

### Verified - Phase 2 Original Late-Game Data Values

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Original Room Data Values

- Added typed original room data module.
- Ported exact room timing constants:
  - fire cooling delay
  - room warming delay
  - builder state delay
  - stoke cooldown
  - need-wood delay
  - light/stoke wood costs
  - builder income timing and wood income
- Ported exact room temperature enum values and labels.
- Ported exact fire enum values and labels.
- Ported all original room craftables, including type, maximum, messages, base costs, dynamic cost formula metadata, and deferred audio identifiers.
- Ported all original trade goods, including type, maximum where present, costs, and deferred audio identifiers.
- Ported room misc item classification for `laser rifle`.
- Added pure helpers for original room cost evaluation and workshop gating.
- Wired room data into the original content registry.
- Added room data parity tests for constants, enums, manifest keys, representative craftables, dynamic costs, trade goods, misc classification, workshop gating, and registry wiring.

### Verified - Phase 2 Original Room Data Values

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Original Outside Data Values

- Added typed original outside data module.
- Ported exact outside constants:
  - store offset
  - gather cooldown
  - trap cooldown
  - population timing bounds
  - hut capacity
  - gather wood amounts with and without cart
- Ported exact worker income definitions for all original workers.
- Ported exact trap drop thresholds and messages.
- Ported exact worker unlock mapping from buildings and cleared mines.
- Ported village title thresholds and population-arrival notification thresholds.
- Added pure helper functions for original hut capacity, gather amount, trap drop count, bait consumption, village title lookup, and population message lookup.
- Wired outside data into the original content registry.
- Added outside data parity tests for constants, manifest worker keys, worker income, trap drops, unlocks, thresholds, helper formulas, and registry wiring.

### Verified - Phase 2 Original Outside Data Values

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Original World Data Values

- Added typed original world data module.
- Ported exact original world constants.
- Ported exact world tile symbols.
- Ported exact terrain probabilities.
- Ported exact world weapon definitions.
- Ported exact landmark definitions, including conditional prestige cache metadata.
- Wired world weapons and landmarks into the original content registry.
- Added world data parity tests for constants, tiles, probabilities, weapons, landmarks, and manifest key matching.

### Verified - Phase 2 Original World Data Values

- `npm test`
- `npm run build`

### Added - Phase 2 Original Core Data Values

- Replaced key-only perk registry entries with exact original names, descriptions, and notifications.
- Replaced key-only prestige registry entries with exact original store type mappings.
- Replaced key-only path weight entries with exact original weight values.
- Added original path constants:
  - `DEFAULT_BAG_SPACE = 10`
  - `DEFAULT_ITEM_WEIGHT = 1`
- Added `originalPathWeightFor()` with original default weight behavior.
- Added exact-value tests for perks, prestige mappings, and path weights.

### Verified - Phase 2 Original Core Data Values

- `npm test`
- `npm run build`

### Added - Phase 2 Data Port Foundation Slice

- Copied generated `DATA/canonical-manifest.json` into `src/generated` for typed app/test imports.
- Added typed canonical manifest definitions and baseline assertion.
- Added initial original content registry skeleton for:
  - perks
  - prestige store keys
  - path weight override keys
- Added source-baseline drift tests against selected `ORIGINAL/` file hashes.
- Added manifest parity tests for:
  - source commit
  - required source file checksums
  - initial core key sets
  - room definitions, workers, weapons, fabricator craftables, world tiles, and landmarks
  - event files and representative event titles

### Verified - Phase 2 Data Port Foundation Slice

- `npm test`
- `npm run build`

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
