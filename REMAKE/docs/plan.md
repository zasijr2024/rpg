# A Dark Room Remake Plan

Last updated: 2026-07-30

Primary goal: recreate the latest web version of _A Dark Room_ in a modern, stable engine and tech stack while preserving the original vision intact. After the remake reaches full parity, add optimizations, improvements, new features, and expansions step by step.

Design authority: `ANALYSE/authors_vision_and_success.md`

Data authority: `DATA/00-extraction-index.md`

Machine parity authorities: `DATA/canonical-manifest.json` and `DATA/parity-graph.json`

Pinned source baseline: `REMAKE/docs/source-baseline.md`

Original source authority: `ORIGINAL/`

Supporting control documents:

- mandatory session contract: root `AGENTS.md`
- active post-remediation sequence: `REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md`
- package-state ledger: `REMAKE/docs/planning.md`
- deferred scope: `REMAKE/docs/deferred.md`
- parity checklist: `REMAKE/docs/parity-checklist.md`
- technical decisions: `REMAKE/docs/tech-decisions.md`
- UI specification: `REMAKE/docs/ui-spec.md`
- content model: `REMAKE/docs/content-model.md`
- deviations log: `REMAKE/docs/deviations.md`
- license and attribution: `REMAKE/docs/license-attribution.md`
- release-readiness evidence contract: `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`

Current delivery status: all `RA-P0`, `RA-P1`, `RA-P2`, and repository-side `P14R` audit-remediation implementation is complete, and Phase 14 Full Parity QA is accepted. Current candidate `275c096247e5fe2026e00c1f67eb78cd4668ccaf` passed clean Node 24 technical RC, candidate-specific 32-seed corpus, hosted change-lane/full-RC, and enforced required-check validation while reproducing the established artifact. Evidence-gate semantics, schema-v3 collection tooling, historical/current policy diagnostics, and repository-side MPL-2.0/NOTICE artifacts are implemented. Public Release Candidate sign-off is not claimed: five qualifying human sessions and real screen-reader evidence remain at 0/5 and unrun; durable exact-source and required legal/owner review, the final product decision, production-host smoke, and final tag authorization/verification also remain open. New work remains an explicit post-parity package rather than reopening a completed roadmap phase.

## Source Baseline

The first remake targets the local `ORIGINAL/` source pinned in `REMAKE/docs/source-baseline.md`:

- upstream repository: `https://github.com/doublespeakgames/adarkroom`
- source commit: `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`
- extraction date: 2026-07-06
- validation source: `GUIDE/VALIDATION_REPORT.md`

The phrase "latest web version" means this pinned baseline. It must not silently float to a newer upstream revision. Any upstream refresh requires updating `REMAKE/docs/source-baseline.md`, regenerating `DATA/canonical-manifest.json`, and logging the change.

## North Star

The remake must preserve the author's core design goal: the smallest possible interface creating the largest possible sense of discovery. The player should begin with almost nothing, act before they understand, and experience the game expanding through mechanics rather than exposition.

Modernization is allowed only where it strengthens stability, clarity, maintainability, performance, accessibility, or future extensibility without breaking the original pacing, mystery, tone, or sparse presentation.

## Parity Definition

The first completion target is gameplay/UI parity excluding explicitly deferred systems. Parity means original gameplay data, original progression, original scene flow, original formulas, and original player-facing text are represented and testable against the pinned source baseline.

Parity does not include active audio playback, music playback, ambient audio, mobile support, durable save versioning, save migration, original save import, active localization, new content, or balance changes. Those are deferred by `REMAKE/docs/deferred.md`.

The original parity plan treated save/load as disposable development tooling under `adr-remake-dev-save`. The production-readiness override `RA-P2-02` now supports schema-1 envelopes plus the explicit unversioned remake migrations listed in `docs/deferred.md`; original-browser import remains deferred.

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

Initial measurable UI tokens are defined in `REMAKE/docs/ui-spec.md`. Implementation must not rely on eyeballing "4K support"; each major screen needs screenshots at the required desktop resolutions.

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

Discovery parity is mandatory. For every progression stage, tests must verify which systems remain hidden. See `REMAKE/docs/parity-checklist.md`.

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
- Space implementation path is chosen with evidence in `REMAKE/docs/tech-decisions.md`

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

Current status:

Phase 6 is finalized for the pragmatic Combat Event Runtime slice, not full event/setpiece/executioner parity. `CombatRuntime` owns combat resolution, the event runtime covers all original wilderness encounter definitions, focused setpiece and executioner catalogs are represented and audited, World-selected encounter/setpiece bridges route into focused event slices, session-level combat return markers are consumed into visible room/path recovery, and the final verification matrix passed on 2026-07-08. The finalized focused catalog surface is 38 audited executioner keys and 49 audited setpiece keys. Exhaustive original branch parity for every remaining setpiece/battleship route remains a later-scope parity target and would be a separate 15+ slice effort.

Explicit remaining Phase 6 closure slices:

None for the pragmatic Phase 6 scope.

Latest finalization pass fixed stale World city landmark routes, locked the focused 49-key setpiece catalog in content coverage, ran the full verification matrix, and finalized Phase 6 on 2026-07-08.

Latest setpiece audit locks the focused 49-key setpiece catalog in content coverage and fixes stale World city landmark routes for the old-man cache and medicine variants.

Latest executioner audit locks the focused 38-key Ravaged Battleship catalog in content coverage and defers exhaustive battleship scene parity outside pragmatic Phase 6 closure.

Latest Engineering R&D continuation adds the original alien-alloy healing machine, max-health restoration, workbench fork traversal, hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, and Engineering deck-cleared flag.

Latest runtime continuation adds organic World event selection for original terrain/distance encounter bands, original landmark scene names, executioner first-visit/return routing, session/test-harness commands, and browser coverage for a World-selected combat flow.

Latest Path/World remediation consumes combat `returnLocation` markers into room death recovery or visible Path recovery, adds a player-facing `A Dusty Path` location, outfitting rows, capacity/free-space display, perk display, embark, original-shaped World map/mask generation, food/water consumption, generated landmark scene routing, player-facing World return, organic fresh-room-to-World-return browser coverage, and Path/World visual baselines.

Latest executioner hub continuation chance-maps the antechamber Engineering elevator into assembly, engine-room, and fire-junction focused entry branches, and chance-maps the Martial elevator into the armory, right-corridor, and scrap focused entry branches.

Latest executioner continuation adds the original Engineering engine-room quiet branch, including defence-turret combat, alien-alloy salvage, destroyed-engine text, and R&D handoff.

Latest executioner continuation adds the original Martial training-complex regenerative machine, including alien-alloy cost, max-health restoration, and murderous-robot handoff.

Latest executioner continuation adds the original Medical checkpoint post-turret automated-guardians branch, including quiet-corridor branch selection and gurneys handoff.

Latest executioner continuation adds the original Medical checkpoint gurneys-to-strategy-room branch, including secure-locker loot, noisy-medic combat, quiet-move option, and quadruped rejoin.

Latest executioner continuation adds the original Medical checkpoint post-medic friends/frozen-robots branch before dispatch-bay loot.

Latest runtime continuation adds chance-mapped `nextEvent` support and wires the Medical checkpoint handoff into guarded cold-storage, guarded surgical-tools, and slipped cold-storage focused slices.

Latest executioner continuation adds the original Engineering quiet assembly branch, including assembly-line energy-cell/laser-rifle loot, decrepit-machinery text, mechanical-guard combat, and R&D handoff.

Latest setpiece continuation adds the original City subway beast-rubble route, including lizard combat, beast combat, rubble loot, scavenged torch/cured-meat loot, and a focused subway-beast-rubble clear marker.

Latest Phase 6 continuation connects all focused Medical containment scenes into malformed-experiment cleanup. Guarded-surgical, cold-guard, surgical-explosives, surgical-medic, and cold-storage now hand off to the malformed-experiment event, with cold-storage and surgical-explosives runtime coverage through stim-blueprint loot, Medical deck completion, cleanup text, and exit.

Latest Medical automaton continuation connects automated-guardians, gurneys/friends, strategy-room locker, and frozen-robots checkpoint scenes into the cold-storage route, with frozen-robots runtime coverage through unstable-automaton glowstone-blueprint loot, cold-storage medic fights, malformed-experiment combat, stim-blueprint loot, Medical deck completion, cleanup text, and exit.

Latest Medical checkpoint continuation adds dispatch-bay weapon loot and unstable-automaton combat to the base checkpoint route, then hands off into the cold-storage route after glowstone-blueprint loot.

Latest Engineering continuation connects assembly, assembly-loot, engine-room, and fire/guard-post R&D doorway scenes into the R&D/prototype event, with fire/guard-post runtime coverage through guard-post loot, hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, Engineering deck completion, cleanup text, and exit.

Readiness-audit constraint:

Phase 6 starts with the combat runtime boundary. Do not expand encounter coverage by adding special cases directly to `EventRuntime`.

Ownership boundary:

- `EventRuntime` owns random event scheduling, scene loading, modal lifecycle, scene text, non-combat event buttons, scene rewards, scene-level effects, and non-combat scene loot lifecycle.
- The combat boundary owns combat phase, player/enemy health, available combat actions, weapon cost/cooldown interpretation, hit/miss/stun logic, enemy attack timers, healing, combat loot rolling/taking, player death, and outfit/return semantics.
- Event scenes may mount combat definitions and receive combat outcomes, but encounter-specific rules should live behind the combat boundary.

Deliverables:

- combat runtime boundary or extracted combat service with headless tests
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
- original outfit/drop/return semantics for death and victory
- lifecycle snapshot/restore for combat state through the boundary
- regression preservation for the existing representative `A Snarling Beast` slice

Acceptance criteria:

- representative encounter data from `DATA/09-events-encounters.md` works through the combat boundary before broad encounter coverage is added
- damage, hit chance, cooldown, and loot rules match original
- all original weapons work
- death/outfit handling matches original or any deviation is documented before additional enemy families are added
- combat lifecycle restore is testable without stale timers or duplicate loot/death effects
- combat is testable without UI
- at least one browser scenario exercises the Phase 6 combat flow through the UI; pure `triggerEventByKey` coverage alone is not sufficient for completion
- `EventRuntime` does not become the permanent home for encounter-specific special cases

### Phase 7: Path and Outfitting

Current status:

Phase 7 is finalized for the Path/outfitting scope as of 2026-07-08. Buying Compass reveals `A Dusty Path`, emits the original `the compass points ...` message, exposes the Compass store tooltip, supplies can be added/removed with original weight/capacity helpers and original-style arrow controls, Cured Meat gates embark, perks render from original perk data, and embark opens the active World slice. Original World arrival, map generation, ship placement, landmark distribution, and home-return world-state consequences are covered by the finalized Phase 8 foundation.

Phase 7 kickoff position:

- Phase 6 is not the next work target unless a regression appears in the finalized pragmatic combat/event-runtime boundary.
- The existing World slice should be kept stable as the embark/return consumer while Path behavior is hardened.
- Phase 7 Path semantics are covered for row ordering, all currently original carryable supplies, water and armour interactions, capacity-upgrade cases, tooltip/original-control behavior, outfit return/drop behavior, and an organic no-resource-injection browser reachability scenario.
- Each Phase 7 change needs source/data evidence, engine/session coverage, and UI or visual coverage when it changes player-facing Path behavior.

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

- compass/Path reveal order matches original
- capacity upgrades match original
- all weight overrides match original
- outfitting cannot exceed capacity
- add/remove behavior preserves stores/outfit invariants for every carryable supply
- water, armour, and perk-dependent Path behavior match original or are explicitly deferred to World/Phase 8 where the original behavior depends on World systems
- embark transitions into the current World consumer with correct Path state
- return from World/combat restores stores/outfit through the original safe-return rules
- Phase 7 visual baselines remain stable at 1366, 1920, 2560, and 3840 widths

### Phase 8: World Exploration

Current status:

Phase 8 is finalized for the scoped World Exploration foundation as of 2026-07-09. Compass purchase now creates an original-shaped 61x61 World map, original landmark counts/radii, original visibility mask, and stored ship direction; Scout map purchases reveal original radius-5 diamond areas in the persisted World mask, update `seenAll`, and have browser coverage from an active World expedition through visible map reveal, original notification, and fully revealed button hiding; safe village return now also evaluates the persisted mask and commits `seenAll` after normal exploration reveals the last hidden tile; embark activates the original village position, renders the full 61x61 World map through the persisted visibility mask with blank hidden tiles, current-position `@`, original tooltip metadata for the wanderer/village/visible unconsumed landmarks, supports button, pure-UI/browser-covered keyboard, original map-click, and original swipe movement, emits original forest/field/barrens terrain-transition narration into the visible World notification log with browser coverage for Forest to Field to Barrens movement, advances food/water and random-fight ticks only on original travel tiles with browser-covered random-fight delay, encounter start, and fight-move reset, auto-returns safely when movement enters the village tile, auto-enters unconsumed landmark setpieces when movement reaches landmark tiles, can trigger the existing World encounter/setpiece bridge, and can return to Path from the village. The active World slice now also applies original mine-road drawing for cleared mine tiles, marks active cleared mines visited, covers organic Iron/Coal/Sulphur Mine traversal from World movement through setpiece combat into road/visited consequences, carries organic Iron/Coal/Sulphur Mine clearing through road travel back to safe-return building and worker unlock state, covers generated-map Iron/Coal/Sulphur Mine entry and safe return from the Compass-generated World map with browser-covered generated Iron Mine routing from real Compass generation through visible tooltip, entry, and original combat start, has browser coverage for visible Mine tooltip labeling and movement-based Mine setpiece entry plus Coal Mine clear through village safe return into visible `coal miner` unlock, converts cleared Cave/Town/City landmarks and the final cleared Battleship into road-connected Outposts with organic Cave/Town/City clear coverage, focused Command Deck Battleship clear coverage, and immediate converted-Outpost water/use-state/re-entry coverage, marks one-off landmarks visited including organic Borehole Alien Alloy salvage with browser-covered visible label, movement-based entry, loot transfer, and used-entry hiding, Battlefield equipment salvage with browser-covered visible label, movement-based entry, loot transfer, and used-entry hiding, browser-covered Swamp wanderer talk with visible label, Charm gate, safe return, visible `gastronome`, and used-entry hiding, browser-covered Old House occupied entry with combat completion and used-entry hiding, browser-covered Destroyed Village cache entry with prestige-store transfer, `previous.stores` clearing, and used-entry hiding, browser-covered Crashed Ship salvage with visible label, movement-based entry, road drawing, and used-entry hiding, and Old House supplies/water-refill loot, applies active setpiece water replenishment, consumes active Outposts by coordinate once per expedition while routing original Cured Meat supplies into the outfit, has browser coverage for movement-based active Outpost entry, visible water refill, scene loot, used-Outpost entry hiding, preserved non-interactive `P` map glyph, safe return, re-embark, restored Outpost tooltip/entry, and same-Outpost reuse after the expedition reset, commits iron/coal/sulphur mine building unlocks on safe village return, implements the original food/water movement loop for `slow metabolism`, `desert rat`, `gastronome`, starvation/dehydration death, death counters, and survival perk unlocks, has browser coverage for World starvation status and dehydration death through movement into Room return, World-tab closure, and `the world fades`, applies original `FIGHT_DELAY`/`stealthy` random encounter cadence plus danger threshold notifications in the visible World notification log, exposes active danger/starvation/thirst conditions in the World status panel with browser-covered movement-driven danger/safer status and notification transitions, covers organic first-visit Executioner intro reachability from World movement through device discovery with browser-covered Ravaged Battleship label-to-entry, covers organic return-visit Executioner antechamber routing into Engineering/Medical/Martial wing entry events with browser-covered return-visit antechamber entry, visible wing choices, Command Deck gating before and after wing completion, Medical Wing entry, and Command Deck entry, organic Engineering Assembly/R&D clear into the deck flag, organic Medical guardians/strategy/cold-storage clear into the deck flag, organic Martial armory/training-complex clear into the deck flag, focused Command Deck clear and Battleship-to-Outpost conversion, and commits original safe-return Ship/Fabricator discovery state. Phase 8 deliberately stops at those World-side Ship/Fabricator discovery consequences; player-facing Ship controls remain Phase 10 and player-facing Fabricator controls remain Phase 11. Broader Outpost/setpiece content moves to Phase 9, player-facing Ship/Fabricator modules remain Phase 10/11, exhaustive Executioner traversal remains Phase 12, and full original World UI parity QA remains Phase 14.

Phase 8 closure guardrails:

- Preserve the finalized Path/outfitting contracts: Compass reveal, outfit reservation, safe return, capacity, water, armour, and repeated embark behavior must not regress while World expands.
- Treat original map/mask/landmark generation, full mask-rendered 61x61 World map output, original map tooltip metadata including browser-covered Mine, Borehole, Battlefield, Swamp, Old House, Destroyed Village, Crashed Ship, and Ravaged Battleship label-to-entry behavior, original map-click movement, original swipe movement, browser-covered Scout map-reveal purchases and fully revealed button hiding, safe-return map-completion checks, browser-covered terrain-transition narration, travel-tile supply/fight gating including browser-covered random-fight cadence, village-tile auto-return, unconsumed-landmark auto-entry, current road/visited landmark consequences, organic and browser-covered Borehole/Battlefield salvage, organic and browser-covered Swamp wanderer perk unlock, organic Old House supplies/water refill with browser-covered occupied entry, organic and browser-covered Destroyed Village cache collection, browser-covered Crashed Ship discovery, organic Iron/Coal/Sulphur Mine clear traversal and browser-covered Coal Mine safe-return worker unlock, generated-map Iron/Coal/Sulphur Mine reachability with browser-covered generated Iron Mine routing, organic Cave/Town/City/Battleship clear-to-Outpost traversal, converted-Outpost water/use-state behavior, browser-covered active per-expedition Outpost water/supplies/re-entry/glyph-preservation behavior, organic Executioner intro/wing-entry/Engineering-clear/Medical-clear/Martial-clear/Command Deck reachability with browser-covered return-visit antechamber, wing-entry gating, and Command Deck gating/entry, safe-return mine-building, browser-covered food death/status return, water death/perk, danger/starvation/thirst condition status, fight-delay, and safe-return Ship/Fabricator discovery contracts as the finalized Phase 8 baseline. Do not pull player-facing Ship/Fabricator module UI, broad Phase 9 setpiece work, exhaustive Phase 12 Executioner work, or Phase 14 full-parity QA back into Phase 8.
- Keep phase-specific notes in `docs/status/phase-8-world.md` instead of bloating this plan section.

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

Current status: implementation finalized on 2026-07-11. All 13 parser-backed canonical Setpiece events are represented with original scene flow, rewards, World-state consequences, organic entry, and player-facing evidence; see `docs/status/phase-9-setpieces.md`. The repository-wide parity/release verdict remains `HOLD` for later-phase scope.

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

Scope note: Phase 8 only unlocks Ship discovery state from World safe return and initializes the original base hull/thrusters. The player-facing Ship tab, controls, costs, and lift-off gating belong here.

Current status: finalized on 2026-07-11. The audit-remediation thin slices `RA-P1-11` and `RA-P1-13` implement the guarded Ship tab, hull/engine display, original arrival notification, exact one-Alien-Alloy operations, isolated UI domain, validated save persistence, original hull-gated lift-off, one-time departure warning, post-crash cooldown, and live Space handoff. `RA-P1-14` proves fresh-save Ship reachability inside the complete deterministic ending route. See `docs/status/phase-10-ship.md` for completion evidence.

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

Scope note: Phase 8 only unlocks Fabricator discovery state from the Executioner flag and emits the original builder notification on safe return. The player-facing Fabricator tab, craftables, blueprint gates, quantities, and fabrication costs belong here.

Current status: finalized on 2026-07-11. The audit-remediation thin slice `RA-P1-12` implements the guarded Fabricator tab, original arrival notification, all nine original recipes, redeemed-Blueprint visibility, exact costs, Upgrade maxima, original quantities, visible store results, isolated UI domain, and validated save persistence. `RA-P1-14` proves representative fresh-save Blueprint acquisition, safe-return redemption, and Fabricator use inside the complete deterministic ending route; exhaustive Blueprint acquisition breadth remains Phase 12 scope. See `docs/status/phase-11-fabricator.md` for completion evidence.

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

Current status: finalized on 2026-07-11. The complete pinned Executioner source denominator is locked at 6 events, 103 scenes, 203 buttons, 226 transitions, 196 effects, and 64 rewards. The remake represents that graph as 38 deterministic routed variants with all 16 Executioner combat definitions, original deck gating and completion consequences, special statuses/explosion behavior, all six Blueprint rewards, Fabricator redemption, organic World traversal, and browser-visible entry/Command Deck coverage. See `docs/status/phase-12-executioner.md` for completion evidence.

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

Current status: finalized on 2026-07-11. The deterministic, serializable Canvas ascent now preserves frame-scaled cardinal/diagonal movement, exact thruster scaling and bounds, source asteroid start/end travel, altitude-dependent waves, glyph-footprint collisions, hull/crash behavior, title regions, the sixty-second escape, score persistence, randomized prestige-store carryover, Fleet Beacon ending, and prestige-preserving restart. Audio remains explicitly deferred.

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

Status: accepted 2026-07-11. See `REMAKE/docs/status/phase-14-full-parity-qa.md`, `REMAKE/docs/status/phase-14-roast-remediation-2026-07-11.md`, `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`, `REPORTS/phase14_data_parity_report_2026-07-11.md`, and `REPORTS/current_prototype_full_roasting_audit_2026-07-11.md`.

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
- every open item in `REMAKE/docs/parity-checklist.md` is complete, deferred, or linked to `REMAKE/docs/deviations.md`

## Post-Parity Roadmap

Only after Phase 14 is accepted:

### Active Post-Parity Program: Release-Readiness Validation

Program `P14V-2026-07-12` is the immediate priority before feature expansion:

- reconcile ownership for every dirty path and, only with explicit maintainer authorization, create coherent reviewed checkpoints;
- reproduce one exact post-remediation SHA/artifact from a separate clean checkout with the technical RC gate;
- prove the hosted change/manual lanes and required branch-protection context on that SHA while independently retaining a new candidate-specific 32-seed corpus;
- only after those automated results are green, collect at least five strict schema-v3 first-time unassisted sessions and a real-screen-reader Space/ending pass, in parallel;
- preserve Classic while the evidence is interpreted, close the durable exact-source/legal/publication inputs, and record the dated product/release-owner `GO` or `HOLD`;
- prove an artifact-identical final evidence descendant, smoke the actual production host, authorize the immutable tag manifest, then create/verify/publish the tag through the non-circular post-tag handshake.

See `REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md` for the live sequence and `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md` for exit criteria. Feature phases A-G do not outrank this release-evidence program.

### Post-Parity Phase A: Save Evolution And Original Import

Schema-1 checksummed saves under stable key `adr-remake-save`, one-time migration from legacy namespace `adr-remake-dev-save`, semantically valid backup rotation, durable raw quarantine, typed recovery outcomes, acknowledgement-gated autosave, supported legacy-remake payload migrations, visible persistence health/retry, and validated recovery export/import were pulled forward and are already implemented.

- preserve and extend the implemented visible/recoverable persistence contract;
- extend semantic/domain validation whenever new persisted state is added;
- keep recovery export and staged import compatible with every supported schema;
- add original-browser save import if desired;
- add tests for every new schema or migration.

Recommendation: the silent-storage blocker is closed; evolve save formats only through versioned migrations and retain the current recovery evidence.

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

See `REMAKE/docs/content-model.md`.

### Post-Parity Phase G: Release Hardening and Bundle Optimization

- Implemented: the original event catalog is an enforced production chunk, repeated immutable strings are pooled, and Fabricator/Ship/Space retain primary and fresh-retry lazy boundaries.
- Implemented: the initial-entry budget is tightened to 480,000 B raw / 125,000 B gzip without increasing aggregate budgets; the historical 2026-07-11 integration build emitted 416,217 B raw / 119,037 B gzip. Current measurements belong in the 2026-07-30 remediation record and must not overwrite that historical result.
- Implemented: save-preserving lazy-route recovery and build-external complete production progression are cross-browser/production tested.
- Remaining: prove the workflow in hosted CI on a clean candidate and keep future measured chunk changes within the executable budgets.

Recommendation: preserve the measured boundary and budget checks. Do not reopen bundle architecture without a real startup/cache benefit and the same production recovery evidence.

## License and Attribution

The original project is tracked as MPL-2.0 via `ORIGINAL/LICENSE.md`. The remake must preserve original license notices and track source-derived files.

Phase 0 must verify:

- original license file is retained
- source-derived data/text attribution is documented
- remake license decision is recorded before public distribution
- `ORIGINAL/` is treated as immutable reference source

Current status: the original license is preserved, new remake code uses MPL-2.0, and `LICENSE`, `NOTICE.md`, production `LICENSE.txt`/`NOTICE.txt`, and the source-derived inventory are implemented. Before public distribution, `P14V-08` must still publish the exact corresponding source revision at a durable URL, verify its placement alongside the executable, complete any distribution-specific dependency/media and qualified legal review, and record accountable owner sign-off. A technical RC result alone is insufficient.

See `REMAKE/docs/license-attribution.md`.

## Documentation Deliverables

Create and maintain:

- `REMAKE/docs/plan.md` - this plan
- `REMAKE/docs/parity-checklist.md` - exact feature/data checklist
- `REMAKE/docs/tech-decisions.md` - accepted architecture decisions
- `REMAKE/docs/deferred.md` - deferred audio/mobile/original-save-import/new-content notes
- `REMAKE/docs/deviations.md` - any difference from original behavior
- `REMAKE/docs/content-model.md` - how to add future data
- `REMAKE/docs/ui-spec.md` - visual and layout acceptance baseline
- `REMAKE/docs/source-baseline.md` - pinned original source target
- `REMAKE/docs/license-attribution.md` - licensing and attribution handling
- `REMAKE/docs/git-versioning.md` - repository and milestone versioning rules
- `REMAKE/docs/changelog.md` - implementation history and verification log

Timing:

- Phase 0: `tech-decisions.md`, `deferred.md`, `source-baseline.md`, `license-attribution.md`, `ui-spec.md`
- Phase 0/2: `parity-checklist.md`
- Phase 1 onward: `deviations.md`
- Phase 2: `content-model.md`

## Open Questions and Recommendations

### Q0: Should git versioning be used during development?

Decision: yes. `F:\ADR20` is expected to stay under git versioning throughout implementation. Use milestone commits and tags so source extraction, planning, parity implementation, and future expansion work can be reviewed and recovered.

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

Recommendation: include only controls that do not alter progression or reveal hidden systems: keyboard focus, stable layout, readable cooldowns, clear disabled states, and pause-safe event behavior. Defer player-facing convenience features like automation, content logs, or expanded stats.

Current exception: an opt-in `settings` tab behind `?debug=1` provides default-off `speed x 10` and `income x 10` debug toggles plus dev save controls for parity testing. This is not original behavior and is tracked as `DEV-007` in `REMAKE/docs/deviations.md`; it must not be treated as player-facing parity design. Visual parity baselines use `?testHarness=1` without `debug=1` to keep debug tooling out of screenshots.

### Q8: Should new content hooks be built before original parity?

Recommendation: yes, but only as architecture. Registries and typed content models should support expansion from the start. Actual new content should wait until the strict original game is complete.

### Q9: Should the original executioner/latest web content be included in parity?

Recommendation: yes. The stated goal is the latest web version, and the extracted data includes executioner and fabricator content. Parity means including it.

### Q10: Should the remake preserve original bugs?

Recommendation: preserve behavior that affects balance, progression, or player-facing outcomes unless it is clearly a technical defect that harms stability. Document every fixed bug in `REMAKE/docs/deviations.md`.

## Definition of Done for the First Remake

The first remake means gameplay/UI parity excluding deferred systems. It is finished when:

- a fresh desktop player can complete the game from start to ending
- all original gameplay data from `DATA/` is represented
- all major modules work: room, outside, path, world, events, combat, ship, space, fabricator, executioner
- UI is minimalist, stable, and readable at 1080p through 4K
- no deferred systems have been prematurely introduced
- parity test suite passes
- known deviations are documented
- `REMAKE/docs/parity-checklist.md` is fully resolved
- `DATA/canonical-manifest.json` matches the pinned source baseline
- future content can be added through typed data registries without rewriting core systems
