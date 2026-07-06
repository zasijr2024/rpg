# A Dark Room Remake Plan

Last updated: 2026-07-06

Primary goal: recreate the latest web version of *A Dark Room* in a modern, stable engine and tech stack while preserving the original vision intact. After the remake reaches full parity, add optimizations, improvements, new features, and expansions step by step.

Design authority: `ANALYSE/authors_vision_and_success.md`

Data authority: `DATA/00-extraction-index.md`

Machine parity authority: `DATA/canonical-manifest.json`

Pinned source baseline: `REMAKE/source-baseline.md`

Original source authority: `ORIGINAL/`

Supporting control documents:

- deferred scope: `REMAKE/deferred.md`
- parity checklist: `REMAKE/parity-checklist.md`
- technical decisions: `REMAKE/tech-decisions.md`
- UI specification: `REMAKE/ui-spec.md`
- content model: `REMAKE/content-model.md`
- deviations log: `REMAKE/deviations.md`
- license and attribution: `REMAKE/license-attribution.md`

## Source Baseline

The first remake targets the local `ORIGINAL/` source pinned in `REMAKE/source-baseline.md`:

- upstream repository: `https://github.com/doublespeakgames/adarkroom`
- source commit: `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`
- extraction date: 2026-07-06
- validation source: `GUIDE/VALIDATION_REPORT.md`

The phrase "latest web version" means this pinned baseline. It must not silently float to a newer upstream revision. Any upstream refresh requires updating `REMAKE/source-baseline.md`, regenerating `DATA/canonical-manifest.json`, and logging the change.

## North Star

The remake must preserve the author's core design goal: the smallest possible interface creating the largest possible sense of discovery. The player should begin with almost nothing, act before they understand, and experience the game expanding through mechanics rather than exposition.

Modernization is allowed only where it strengthens stability, clarity, maintainability, performance, accessibility, or future extensibility without breaking the original pacing, mystery, tone, or sparse presentation.

## Parity Definition

The first completion target is gameplay/UI parity excluding explicitly deferred systems. Parity means original gameplay data, original progression, original scene flow, original formulas, and original player-facing text are represented and testable against the pinned source baseline.

Parity does not include active audio playback, music playback, ambient audio, mobile support, durable save versioning, save migration, original save import, active localization, new content, or balance changes. Those are deferred by `REMAKE/deferred.md`.

During parity, save/load is development-only. Use the localStorage key `adr-remake-dev-save`; pre-parity saves are disposable and may be invalidated at any time. Do not promise save compatibility until Post-Parity Phase A.

## Non-Negotiable Design Constraints

- Keep the exact original game data for the parity release.
- Preserve the slow reveal from one action to room, village, path, world, ship, space, and fabricator.
- Preserve sparse, suggestive text and avoid new explanatory prose during the parity release.
- Preserve original costs, cooldowns, formulas, resource names, event text, enemy stats, loot, landmarks, map rules, prestige data, and unlock conditions.
- Preserve the original moral ambiguity and do not soften terms, implications, or progression beats.
- Preserve genre shifts as discoveries, not as visible future features.
- Do not add audio, music, ambience, mobile support, save versioning, or save migration until after the remake is finished.
- Build desktop-only first, with proper 4K support.
- Make the codebase data-driven and easy to expand after parity.
- Use deterministic, injectable RNG for every random gameplay decision.
- Treat `ORIGINAL/` as immutable vendor/reference source.

## Explicitly Deferred Until After Full Remake Parity

These are intentionally out of scope for the first completed remake:

- Music implementation.
- Sound effect implementation.
- Ambient audio implementation.
- Mobile layout and touch support.
- Save versioning.
- Save migration from older remake saves.
- Import/migration from original browser saves.
- New content.
- Balance changes.
- Localization beyond preserving the extracted data for later use.
- New tutorialization or onboarding.

Important distinction: the first remake still needs a simple development save/load system to make the game playable and testable. It should use one internal save shape during parity work, but should not implement long-term versioning or migration logic until after parity is complete.

## Recommended Tech Stack

### Application

- TypeScript
- Vite
- React
- Zustand or another small external-store library for UI subscription
- Vitest for unit and data parity tests
- Playwright for end-to-end parity and screenshot tests
- ESLint and Prettier

Recommendation: use React for UI and a headless TypeScript game engine for all game rules. Do not put gameplay logic inside React components.

Reasoning:

- TypeScript gives stronger guarantees for the large extracted content model.
- Vite is stable, fast, and low ceremony.
- React is mature and suitable for deterministic UI rendering.
- A headless engine keeps the original game logic testable without a browser UI.
- Zustand is simpler than Redux for this project and supports precise subscriptions.

### Styling

- CSS Modules or plain scoped CSS.
- CSS custom properties for theme, spacing, sizing, and 4K scaling.
- No component library for the core UI.

Recommendation: do not use Tailwind or a heavy UI framework for the parity release. The original atmosphere depends on restrained typography, spacing, and simple controls. A design system can be built with a small set of local primitives.

### Data Format

- Convert original gameplay data into typed TypeScript data modules first.
- Keep function-bearing definitions as TypeScript, not JSON, because original costs, availability checks, scene callbacks, and rewards often include behavior.
- Add machine-readable summary metadata where useful, but do not replace original behavior with incomplete flattened data.

Recommended structure:

```text
src/
  app/
  engine/
  data/
  modules/
  ui/
  styles/
  tests/
```

## Target Architecture

### 1. Headless Game Engine

The engine owns:

- global clock and scheduled timers
- deterministic RNG service
- state reads/writes
- resource mutation
- cooldown progress
- income collection
- event scheduling
- module unlocks
- world generation
- combat resolution
- expedition state
- ship and space rules
- save/load serialization for the parity build

The engine must run without React. Unit tests should instantiate the engine, advance time, fire actions, and inspect state.

Boundary rule: `src/engine` must not import React, React DOM, UI components, CSS, or browser-only rendering code.

### 2. Data Layer

The data layer owns:

- room craftables and trade goods
- outside worker income and trap drops
- path weights
- world tiles, landmarks, weapons, and constants
- event pools and scene definitions
- setpieces
- executioner content
- ship, space, and fabricator constants
- perks
- scoring and prestige maps

Data must be organized by domain, matching the extraction files:

```text
src/data/core.ts
src/data/room.ts
src/data/outside.ts
src/data/path.ts
src/data/world.ts
src/data/ship.ts
src/data/space.ts
src/data/fabricator.ts
src/data/events/global.ts
src/data/events/room.ts
src/data/events/outside.ts
src/data/events/marketing.ts
src/data/events/encounters.ts
src/data/events/setpieces.ts
src/data/events/executioner.ts
src/data/audioManifest.ts
src/data/locales/
```

For parity, audio and localization data can be stored but not actively implemented.

Boundary rule: `src/data` and `src/content/original` must not import UI modules. Source-derived original content must not depend on expansion content.

### 3. State Store

Use a typed state model that mirrors the original:

```text
features
stores
character
income
game
playStats
previous
outfit
config
```

State APIs should preserve original semantics:

- get path with optional zero fallback
- set path
- add numeric value
- batch set
- batch add
- state update events
- maximum store clamping

Recommendation: keep a compatibility-style path API during data porting, then expose typed convenience APIs around it. This reduces risk when porting original formulas such as `stores["alien alloy"]` and `game.buildings["coal mine"]`.

### 4. UI Layer

The UI layer owns:

- module panels
- tab/navigation display
- buttons
- cooldown bars
- stores/resources panel
- notifications
- event modal/panel
- combat view
- world map rendering
- space flight rendering

React components should dispatch commands to the engine and render state snapshots. They should not calculate game outcomes.

Boundary rule: `src/ui` may dispatch commands but must not mutate game state directly. Gameplay decisions must be rejected from UI components during review and by architecture tests/lint rules.

### 5. Rendering Strategy

Most screens should be DOM-based:

- room
- outside
- path
- ship
- fabricator
- event panels
- stores

World map should remain text/ASCII-first:

- render with monospace grid
- preserve tile characters
- support keyboard movement
- keep tooltip/label behavior

Space flight can be implemented with DOM or Canvas. Recommendation: use Canvas for stable frame timing and collision in modern browsers, but visually preserve the original minimalist symbols and plain field. Do not make it a flashy arcade game.

The final Space implementation must be chosen after Phase 0.5 proves Canvas or DOM behavior under 1080p, 1440p, and 4K conditions.

### 6. Architecture Enforcement

Phase 0 must add dependency-boundary checks:

- `src/engine` cannot import `react`, `react-dom`, `src/ui`, or CSS.
- `src/data` cannot import `src/ui`.
- `src/content/original` cannot import `src/content/expansions`.
- `src/ui` cannot call low-level state mutation APIs directly.
- random behavior cannot call `Math.random()` directly outside the RNG service.

Violations should fail tests or linting.

## Desktop and 4K UI Requirements

Desktop is the only supported platform for the first remake.

Minimum target:

- 1366x768 usable
- 1920x1080 primary
- 2560x1440 polished
- 3840x2160 polished 4K support

4K requirements:

- readable text without making the interface feel oversized
- centered main game area with restrained max width
- stores/resources panel remains readable
- world map maintains stable grid proportions
- event panels do not stretch into long unreadable lines
- no overlapping UI at 100%, 125%, 150%, or 200% browser zoom
- keyboard controls remain the primary input

Recommended layout approach:

- constrained content width for room/outside/path panels
- separate responsive scale variables for text, map cells, and button widths
- use `rem`, `ch`, `clamp()`, and CSS custom properties
- do not scale all typography directly with viewport width
- keep letter spacing at 0
- avoid decorative backgrounds and large hero layouts

Initial measurable UI tokens are defined in `REMAKE/ui-spec.md`. Implementation must not rely on eyeballing "4K support"; each major screen needs screenshots at the required desktop resolutions.

## UI Improvement Rules

Allowed improvements:

- better alignment and spacing
- improved button disabled/cooldown states
- clearer focus states
- stable layout that does not jump when text changes
- keyboard accessibility
- readable 4K scaling
- more robust event panel sizing
- optional dark/light parity if original behavior supports it

Not allowed for parity:

- visible tutorials
- future-feature previews
- icons replacing core text actions
- animated decorative effects
- lore panels
- minimaps before map unlock
- modern dashboard look
- card-heavy redesign
- large illustrative art
- new resource categorization that changes the discovery curve

Discovery parity is mandatory. For every progression stage, tests must verify which systems remain hidden. See `REMAKE/parity-checklist.md`.

## Data Parity Plan

### Source Files

Use the generated manifest as the machine reference:

- `DATA/canonical-manifest.json`

Regenerate it with:

- `TOOLS/extract_adr_canonical_manifests.ps1`

Use extracted markdown files as human-readable references:

- `DATA/01-core-engine-state.md`
- `DATA/02-room-data.md`
- `DATA/03-outside-data.md`
- `DATA/04-path-data.md`
- `DATA/05-world-data.md`
- `DATA/06-ship-space-fabricator-data.md`
- `DATA/07-event-system-data.md`
- `DATA/08-events-global-room-outside-marketing.md`
- `DATA/09-events-encounters.md`
- `DATA/10-events-setpieces.md`
- `DATA/11-events-executioner.md`
- `DATA/12-audio-data.md`
- `DATA/14-assets-inventory.md`
- `DATA/15-localization-data.md`
- `DATA/18-canonical-catalogs.md`

The original JavaScript under `ORIGINAL/` remains the final authority if extracted files are ambiguous.

Markdown files are not the canonical machine source for tests. They are documentation. Automated parity checks should read `DATA/canonical-manifest.json` or purpose-built manifests generated from `ORIGINAL/`.

### Conversion Rules

- Port data one domain at a time.
- Keep original keys exactly, including spaces and punctuation.
- Keep original player-facing strings exactly for parity.
- Keep original numeric values exactly.
- Preserve original random ranges and probabilities.
- Preserve original cooldown units and timer behavior.
- Preserve original event scene keys.
- Preserve original loot table semantics.
- Preserve original unlock and availability logic.
- Mark every intentional implementation deviation in a parity notes file.

### Data Verification

Create tests that compare ported data against generated snapshots from `ORIGINAL/` and `DATA/canonical-manifest.json`:

- craftable keys
- trade good keys
- worker keys
- weapon keys
- perk keys
- world tile constants
- landmark keys and labels
- event titles
- event scene keys
- prestige store map
- path weights
- audio manifest paths
- source file checksums for baseline drift detection

Behavior parity tests must also cover callback-driven data:

- dynamic craft costs
- availability conditions
- state side effects
- event scene transitions
- random branch probabilities
- loot application
- combat specials
- prestige collection

## Implementation Milestones

### Phase 0: Project Scaffold

Deliverables:

- git repository initialized
- `.gitignore` committed
- source/reference baseline committed
- Vite + React + TypeScript app
- linting and formatting
- Vitest configured
- Playwright configured
- dependency-boundary checks configured
- base folder structure
- minimal headless engine test
- no gameplay yet

Acceptance criteria:

- `npm install` works
- `npm run dev` starts the desktop app
- `npm test` runs
- Playwright can open the app and capture a screenshot
- architecture boundary violations fail tests or linting

### Phase 0.5: Risk Spike

Deliverables:

- 61x61 ASCII world viewport rendered at 1920x1080 and 3840x2160
- timer/cooldown update simulation without React re-render storms
- miniature event scene with cost, reward, transition, and deterministic RNG branch
- keyboard/focus prototype for buttons, tabs, and world movement
- Canvas space prototype
- DOM space prototype or documented reason to skip it
- decision record for Space rendering approach

Acceptance criteria:

- world map remains readable and stable at 4K
- timer/cooldown updates do not force full-app re-renders
- event runtime model can be tested headlessly
- keyboard focus behavior is workable before full UI build
- Space implementation path is chosen with evidence in `REMAKE/tech-decisions.md`

### Phase 1: Core Engine and State

Deliverables:

- state model
- path-based state API
- command dispatcher
- event bus
- injectable deterministic RNG service
- timer scheduler with controllable test clock
- basic save/load for development use
- notification model
- button cooldown model

Acceptance criteria:

- state mutations match original semantics
- tests can advance timers deterministically
- tests can reproduce random outcomes from a seed
- direct `Math.random()` use outside the RNG service is blocked
- button cooldowns can be rendered from engine state
- save/load round-trip works for current parity state shape

Note: do not implement durable versioning or migrations yet. Save/load uses `adr-remake-dev-save` and is disposable until Post-Parity Phase A.

### Phase 2: Data Port Foundation

Deliverables:

- typed data definitions
- data registries
- generated manifest reader for `DATA/canonical-manifest.json`
- initial parity snapshot tests
- canonical names imported from `DATA/18-canonical-catalogs.md`
- scenario fixture plan for callback-driven data

Acceptance criteria:

- all original core keys are represented
- parity tests catch missing craftables, workers, weapons, perks, landmarks, and event titles
- functions are typed and callable in engine tests
- dynamic costs, availability functions, and side effects have test fixtures for representative cases

### Phase 3: Room Module

Deliverables:

- dark room panel
- fire state
- room temperature state
- stoke fire
- light fire
- builder arrival/progression
- gather wood
- room title changes
- stores display
- room craftables
- room trade goods
- basic notifications

Acceptance criteria:

- a fresh player starts with the same visible information as original
- actions unlock in the same sequence
- craft costs and maximums match original
- stores display categories match original behavior
- no future systems are visible early

### Phase 4: Outside and Village Module

Deliverables:

- outside unlock
- gather wood outside behavior
- trap checking
- trap drop tables
- village population
- huts and worker capacity
- worker assignment UI
- income collection
- village title changes
- mines/building-dependent workers

Acceptance criteria:

- all worker production/consumption rates match original
- population behavior matches original timing
- trap drops match original probabilities
- village UI remains readable at 1080p and 4K

### Phase 5: Event Runtime

Deliverables:

- event pool scheduler
- availability checks
- event panel
- scene text rendering
- scene buttons
- costs/rewards
- notifications
- scene transitions
- delayed choices
- loot handling foundation
- leave/end behavior

Acceptance criteria:

- global, room, outside, and marketing events can trigger
- scene buttons behave according to original definitions
- event text and button labels match original
- event scheduling can be tested with deterministic time/random seeds

### Phase 6: Combat Event Runtime

Deliverables:

- combat panel
- player health
- enemy health
- enemy attacks
- player weapons
- unarmed combat
- weapon cooldowns
- weapon costs
- hit/miss logic
- healing actions
- loot after victory
- player death handling

Acceptance criteria:

- encounter data from `DATA/09-events-encounters.md` works
- damage, hit chance, cooldown, and loot rules match original
- all original weapons work
- combat is testable without UI

### Phase 7: Path and Outfitting

Deliverables:

- dusty path unlock
- outfitting panel
- bag capacity
- item weights
- add/remove supplies
- perks display
- embark behavior
- return outfit behavior

Acceptance criteria:

- capacity upgrades match original
- all weight overrides match original
- outfitting cannot exceed capacity
- embark transitions into world with correct state

### Phase 8: World Exploration

Deliverables:

- world state
- map generation
- terrain generation
- landmarks
- roads
- visibility mask
- ASCII map rendering
- movement
- food/water consumption
- starvation/thirst behavior
- fight chance
- enter landmark/setpiece
- return to village

Acceptance criteria:

- world constants match original
- tile symbols match original
- landmark counts/radii match original
- movement and visibility are keyboard-driven
- world is usable at 1080p and 4K

### Phase 9: Setpieces and Dungeons

Deliverables:

- all setpiece events
- outposts
- caves
- towns
- cities
- houses
- battlefield
- borehole
- mines
- crashed ship discovery
- destroyed village/cache
- blueprint and reward handling

Acceptance criteria:

- all setpiece event keys from original exist
- scene flow matches original
- rewards and world-state side effects match original
- clearing mines unlocks the corresponding village systems

### Phase 10: Ship Module

Deliverables:

- ship unlock
- hull display
- engine/thruster display
- reinforce hull
- upgrade engine
- lift-off button
- ship notifications

Acceptance criteria:

- alien alloy costs match original
- liftoff availability matches original
- ship state persists in current parity save shape

### Phase 11: Fabricator Module

Deliverables:

- fabricator unlock
- fabricator tab placement
- alien craftables
- blueprint requirements
- fabrication costs
- quantity behavior
- blueprint display

Acceptance criteria:

- all craftables from `DATA/06-ship-space-fabricator-data.md` exist
- blueprint-gated items stay hidden/locked according to original rules
- fabricated items appear in stores with original quantities

### Phase 12: Executioner Content

Deliverables:

- executioner world landmark
- ravaged battleship event tree
- executioner enemy model
- special attacks/effects
- engineering/martial/medical/command deck content
- blueprint/reward flow

Acceptance criteria:

- all executioner scenes from `DATA/11-events-executioner.md` are represented
- combat specials behave as close to original as possible
- blueprint rewards integrate with Fabricator

### Phase 13: Space Flight and Ending

Deliverables:

- space panel
- ship movement
- asteroid spawning
- collision
- hull damage
- altitude progression
- title/region changes
- crash/death behavior
- successful escape
- score calculation
- prestige collection behavior

Acceptance criteria:

- hull/thruster effects match original
- asteroid timing/speed matches original
- escape threshold matches original
- ending flow matches original, excluding deferred audio

### Phase 14: Full Parity QA

Deliverables:

- full playthrough checklist
- automated smoke tests for each module
- seeded/randomized engine tests
- behavior-level scenario tests
- discovery parity tests
- screenshot tests at 1366x768, 1920x1080, 2560x1440, and 3840x2160
- keyboard interaction tests
- data parity report
- known deviations report

Acceptance criteria:

- game can be completed from a fresh save
- no critical progression blockers
- all extracted gameplay data is represented or documented as intentionally deferred
- UI remains minimal, stable, and readable across target desktop resolutions
- every open item in `REMAKE/parity-checklist.md` is complete, deferred, or linked to `REMAKE/deviations.md`

## Post-Parity Roadmap

Only after Phase 14 is accepted:

### Post-Parity Phase A: Save Versioning and Migration

- introduce explicit save schema version
- add migration framework
- add backup/restore tools
- add original-save import if desired
- add tests for every migration

Recommendation: do this immediately after parity, before new content, because expansions will need durable saves.

### Post-Parity Phase B: Audio, Music, and Ambience

- implement audio engine
- map existing audio assets
- add user controls
- test browser autoplay constraints
- preserve silence as a valid atmospheric state

Recommendation: audio should be opt-in or subtle by default. It must not undermine the sparse tone.

### Post-Parity Phase C: Mobile Support

- responsive touch layout
- touch-friendly world navigation
- mobile path/outfit controls
- mobile event and combat panels
- orientation handling
- mobile save reliability

Recommendation: mobile should be designed after desktop parity, not bolted on mid-remake.

### Post-Parity Phase D: Localization

- wire locale registry
- implement runtime language selection
- test string coverage
- preserve original translation files

### Post-Parity Phase E: Expansion Framework

- content pack format
- module/plugin registration
- new event pools
- new resources/workers/craftables
- validation tooling for custom content

### Post-Parity Phase F: New Content and Improvements

- only add after the original game is fully playable
- keep new content separated from original data
- mark original vs expansion content clearly in source
- maintain an option to play strict original parity mode

## Testing Strategy

### Unit Tests

Test:

- state path API
- resource mutation
- cooldowns
- timers
- income collection
- craft costs
- availability checks
- combat formulas
- food/water movement consumption
- map generation helpers
- save round-trip for current save shape

### Data Parity Tests

Test:

- exact key lists
- exact constants
- exact labels/text where practical
- exact event scene key coverage
- no missing craftables, weapons, workers, landmarks, perks, or prestige stores
- source baseline checksum drift
- generated manifest compatibility

### Behavior Scenario Tests

Test:

- trap cost after N traps
- hut cost after N huts
- worker income with consumed inputs
- deterministic trap drop seeds
- event reward applied exactly once
- event cost deducted exactly once
- chance branch follows deterministic RNG seed
- combat hit/miss deterministic seed cases
- loot roll deterministic seed cases
- death and outfit return behavior
- mine clearing unlock outcomes
- blueprint redemption into fabricator availability
- lift-off gating
- space escape and prestige flow

### Discovery Parity Tests

Test:

- no outside/path/world/ship/fabricator/space UI visible at start
- no stores/economy preview before original trigger points
- no worker UI before outside/village unlock
- no world map before embark
- no ship UI before ship discovery
- no fabricator UI before executioner/fabricator discovery
- no space UI before lift-off
- no tutorial or accessibility label reveals hidden systems early

### Integration Tests

Test:

- room to outside progression
- outside to path progression
- path to world progression
- world landmark entry
- combat victory and death
- mine clearing to worker unlock
- ship discovery to ship tab
- fabricator unlock and blueprint use
- liftoff to space
- win condition

### Visual Tests

Desktop screenshots:

- 1366x768
- 1920x1080
- 2560x1440
- 3840x2160

States to capture:

- first screen
- room with stores/build buttons
- outside workers
- path outfitting
- world map
- combat
- event panel
- ship
- fabricator
- space

## Performance Requirements

- idle CPU use should be low when no animations are active
- timers should be centralized and testable
- world rendering should not re-render the whole app on every movement
- stores updates should update only affected UI regions
- 4K layout should not require expensive canvas scaling except for space flight if Canvas is used
- memory should remain stable during long idle sessions

## Accessibility Requirements for Desktop Parity

- keyboard navigation for buttons and tabs
- visible focus states
- sufficient contrast in light and dark modes if both are kept
- no text overlap at supported resolutions and browser zoom levels
- semantic buttons for actions
- event panels trap focus while active
- map movement works with arrow keys and WASD if original-compatible

Do not add accessibility text that reveals future mechanics early. Accessibility improvements must preserve discovery.

## Content Expansion Requirements

The architecture must make future content easy without compromising original parity:

- data registries per domain
- event pool registration
- typed resource definitions
- typed craftable definitions
- typed worker definitions
- typed world landmark definitions
- typed module registration
- clear separation between `original` and `expansion` data
- validation tools for missing strings, invalid costs, impossible rewards, broken scene transitions, and unreachable content

Recommendation: use original data as `content/original`. Future additions should live in `content/expansions/<pack-name>`.

Mandatory boundaries:

- `content/original` is the strict parity content root.
- `content/original` becomes immutable after parity except documented bug fixes.
- `content/expansions/*` cannot mutate original data in place.
- expansions register only through explicit extension points.
- strict original mode disables all expansions and is the default through parity.
- every content pack must include validation metadata.

See `REMAKE/content-model.md`.

## License and Attribution

The original project is tracked as MPL-2.0 via `ORIGINAL/LICENSE.md`. The remake must preserve original license notices and track source-derived files.

Phase 0 must verify:

- original license file is retained
- source-derived data/text attribution is documented
- remake license decision is recorded before public distribution
- `ORIGINAL/` is treated as immutable reference source

See `REMAKE/license-attribution.md`.

## Documentation Deliverables

Create and maintain:

- `REMAKE/plan.md` - this plan
- `REMAKE/parity-checklist.md` - exact feature/data checklist
- `REMAKE/tech-decisions.md` - accepted architecture decisions
- `REMAKE/deferred.md` - deferred audio/mobile/save migration/new content notes
- `REMAKE/deviations.md` - any difference from original behavior
- `REMAKE/content-model.md` - how to add future data
- `REMAKE/ui-spec.md` - visual and layout acceptance baseline
- `REMAKE/source-baseline.md` - pinned original source target
- `REMAKE/license-attribution.md` - licensing and attribution handling
- `REMAKE/git-versioning.md` - repository and milestone versioning rules

Timing:

- Phase 0: `tech-decisions.md`, `deferred.md`, `source-baseline.md`, `license-attribution.md`, `ui-spec.md`
- Phase 0/2: `parity-checklist.md`
- Phase 1 onward: `deviations.md`
- Phase 2: `content-model.md`

## Open Questions and Recommendations

### Q0: Should git versioning be used during development?

Decision: yes, immediately. `F:\ADR20` must be a git repository before implementation begins. Use milestone commits and tags so source extraction, planning, parity implementation, and future expansion work can be reviewed and recovered.

### Q1: Should the remake use React or a game framework such as Phaser?

Recommendation: use React plus a headless TypeScript engine. The game is mostly stateful UI, text, timers, and data-driven event flow. A full game framework would add weight without improving most screens. Canvas can still be used for the space sequence if needed.

### Q2: Should original save import be supported?

Recommendation: defer. The user explicitly wants save versioning and migration only after the remake is finished. Implement parity first, then build a migration/import layer deliberately. Pre-parity saves are dev-only and disposable under `adr-remake-dev-save`.

### Q3: Should audio assets be ported early but disabled?

Recommendation: preserve the audio manifest as data, but do not implement playback until after parity. This keeps source coverage without creating browser autoplay, settings, and UX work too early.

### Q4: Should localization be active in the first release?

Recommendation: defer active localization. Preserve extracted locale files and design string IDs so localization can be enabled later, but ship the parity build in the original/default language first. Active localization multiplies UI and QA scope.

### Q5: Should the UI exactly mimic the original CSS?

Recommendation: no. Preserve the minimalist atmosphere and progression, but rebuild the UI with stable modern CSS. Exact pixel matching is less important than preserving restraint, sparse presentation, readable stores, clear cooldowns, and the original discovery curve.

### Q6: Should space flight be DOM or Canvas?

Recommendation: start with Canvas for the remake's internal implementation, while preserving the original visual style. If Canvas makes parity harder, fall back to DOM. The acceptance criteria should be behavior and tone, not implementation method.

### Q7: Should the remake include quality-of-life controls before parity?

Recommendation: include only controls that do not alter progression or reveal hidden systems: keyboard focus, stable layout, readable cooldowns, clear disabled states, and pause-safe event behavior. Defer convenience features like automation, speed controls, content logs, or expanded stats.

### Q8: Should new content hooks be built before original parity?

Recommendation: yes, but only as architecture. Registries and typed content models should support expansion from the start. Actual new content should wait until the strict original game is complete.

### Q9: Should the original executioner/latest web content be included in parity?

Recommendation: yes. The stated goal is the latest web version, and the extracted data includes executioner and fabricator content. Parity means including it.

### Q10: Should the remake preserve original bugs?

Recommendation: preserve behavior that affects balance, progression, or player-facing outcomes unless it is clearly a technical defect that harms stability. Document every fixed bug in `REMAKE/deviations.md`.

## Definition of Done for the First Remake

The first remake means gameplay/UI parity excluding deferred systems. It is finished when:

- a fresh desktop player can complete the game from start to ending
- all original gameplay data from `DATA/` is represented
- all major modules work: room, outside, path, world, events, combat, ship, space, fabricator, executioner
- UI is minimalist, stable, and readable at 1080p through 4K
- no deferred systems have been prematurely introduced
- parity test suite passes
- known deviations are documented
- `REMAKE/parity-checklist.md` is fully resolved
- `DATA/canonical-manifest.json` matches the pinned source baseline
- future content can be added through typed data registries without rewriting core systems
