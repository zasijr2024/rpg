# Parity Checklist

Last updated: 2026-07-08

Purpose: implementation tracker for gameplay/UI parity excluding deferred systems. This checklist is intentionally explicit so "exact same game data" is verifiable instead of aspirational.

Authorities:

- source baseline: `REMAKE/docs/source-baseline.md`
- machine manifest: `DATA/canonical-manifest.json`
- extracted source index: `DATA/00-extraction-index.md`
- original source: `ORIGINAL/`

Status legend:

- `[ ]` not started
- `[~]` in progress
- `[x]` complete
- `[!]` blocked or intentionally deviated; must link to `REMAKE/docs/deviations.md`

## Project Gates

- [x] Git repository initialized.
- [x] Baseline source/reference commit created.
- [x] Planning/docs hardening commit created.
- [x] `DATA/canonical-manifest.json` generated from `ORIGINAL/`.
- [x] Source baseline pinned in `REMAKE/docs/source-baseline.md`.
- [x] License/attribution plan accepted.
- [x] Deferred scope accepted.
- [x] Phase 0.5 risk spike completed before gameplay implementation.
- [!] Debug settings tab is intentionally non-original, visible only with `?debug=1`, and documented in `REMAKE/docs/deviations.md#dev-007-in-app-debug-settings-tab`.

## Source Data Coverage

- [x] Core engine constants represented.
- [x] State categories represented.
- [x] State migration behavior reviewed.
- [x] Scoring formula represented.
- [x] Prestige store map represented.
- [x] Room constants represented.
- [x] Room fire states represented.
- [x] Room craftables represented.
- [x] Room trade goods represented.
- [x] Outside constants represented.
- [x] Worker income definitions represented.
- [x] Trap drop table represented.
- [x] Path constants represented.
- [x] Item weight overrides represented.
- [x] World constants represented.
- [x] World tile constants represented.
- [x] Terrain probabilities represented.
- [x] Landmark definitions represented.
- [x] Weapon definitions represented.
- [x] Ship constants represented.
- [x] Space constants represented.
- [x] Fabricator craftables represented.
- [x] Perk definitions represented.
- [x] Audio manifest stored as deferred data.
- [x] Localization files stored as deferred data.

## Room Parity

- [x] Fresh start shows only original starting information.
- [x] Future tabs are not visible at start.
- [x] Fire can be lit.
- [x] Fire can be stoked.
- [x] Fire cooldown matches original.
- [x] Fire state/title progression matches original.
- [x] Room temperature timing matches original.
- [x] Builder arrival timing matches original.
- [x] Need-wood timing matches original.
- [x] Gather wood behavior matches original.
- [x] Stores panel appears at original trigger point.
- [x] Stores remain visible across implemented Room/Outside locations once revealed.
- [x] Room store categories include original misc and Fabricator item classifications.
- [x] Room store rows use stable original-style ordering.
- [x] Build/craft/buy sections unlock at original trigger points.
- [x] Every room craftable has matching key, name, type, max, messages, cost function, and side effect.
- [x] Every trade good has matching cost and behavior.
- [x] Original disabled/max behavior is preserved.
- [x] Original room notifications are preserved for implemented Phase 3 runtime paths.

## Outside and Village Parity

- [x] Outside unlock condition matches original.
- [x] Outside tab/title progression matches original.
- [x] Original first Outside arrival notification is preserved.
- [x] Built traps are visible in the minimal Outside forest status.
- [x] Gather cooldown matches original.
- [x] Trap checking cooldown matches original.
- [x] Trap drop probabilities match original.
- [x] Population growth timing matches original.
- [x] Hut capacity behavior matches original.
- [x] Worker assignment controls match original behavior.
- [x] Every worker has matching name, delay, production, and consumption.
- [x] Income collection timing matches original.
- [x] Worker unlocks from buildings/mines match original.
- [x] Village title thresholds match original.
- [x] Hut destruction and villager death event side effects match original.

## Event Runtime Parity

- [x] Event pool composition matches original for Phase 5 Global/Room/Outside/Marketing pools.
- [x] Event scheduling range and delay behavior matches original for Phase 5 non-combat event pools.
- [x] Event availability checks match original for Phase 5 non-combat event pools, with the Scout `World.applyMap` button hard-gated until the later World-runtime bridge is wired.
- [x] Scene text rendering preserves original text for Phase 5 non-combat event pools.
- [x] Scene notification behavior matches original for Phase 5 non-combat event pools.
- [x] Button cost validation matches original for Phase 5 non-combat event pools.
- [x] Button reward handling matches original for Phase 5 non-combat event pools.
- [x] `onChoose` behavior matches original for Phase 5 non-combat event pools, with `World.applyMap` protected by an explicit capability check for Phase 8.
- [x] `onLoad` side effects are supported for Phase 5 non-combat event pools.
- [x] Chance-based scene branching matches original semantics for Phase 5 non-combat event pools.
- [x] Delayed scene actions are supported for the original Mysterious Wanderer slices.
- [x] Event lifecycle restore clears owned event, combat, and delayed-action timers before restoring state.
- [x] Passive fresh-run browser scheduling reaches the original Marketing event pool without forced event triggering.
- [x] Loot handling foundation exists through the representative combat/loot slice; full Path capacity and complete encounter coverage remain later phases.
- [x] Combat-shaped scenes can be represented and resolved for every original wilderness encounter definition through the extracted `CombatRuntime` boundary.
- [x] Leave/end behavior matches original for Phase 5 non-combat event pools.
- [!] Event pause/attention behavior reviewed; title blink is intentionally replaced by a focused modal. See `REMAKE/docs/deviations.md#dev-008-focused-event-modal-instead-of-browser-title-blink`.

## Event Content Coverage

- [x] Global events represented.
- [x] Room events represented.
- [x] Outside events represented.
- [x] Marketing event represented by the original `Penrose` slice.
- [~] Encounter events represented as combat data and bridged through original World distance/terrain selection; full World movement and map-state integration remain open for Phase 8.
- [~] Setpiece events partially represented through focused Outpost, Borehole, Battlefield, Crashed Ship, Destroyed Village, Swamp, Old House medicine/supplies/squatter branches, Cave combat/camp/cache/wanderer/nest/old-case branches, Town thug/clinic-medicine/clinic-madman/schoolhouse/park-vigilante/caravan-vigilante branches, City old-tower nest/scavenged/thug-rubble/rubble/sniper/soldier-patrol/commando-settlement/supplies/subway/beast-rubble/military-camp/shanty-market/shanty-crowd/drying-hut/sack/hospital stockpile/hospital ward/hospital deformed/hospital tentacles/hospital old-man cache/theatres/squatters/medicine-cabinet branches, Sulphur Mine, Coal Mine, and Iron Mine traversal slices; broad setpiece scene coverage remains open.
- [~] City shanty crowd branch is represented through focused frail-man combat, crowd-surge squatters combat, abandoned-belongings loot, and a shanty-crowd clear marker.
- [~] City shanty crowd sack branch is represented through focused frail-man combat, crowd-surge squatters combat, canvas-sack loot, and a shanty-crowd-sack clear marker.
- [~] City shanty crowd youth branch is represented through focused frail-man combat, crowd text, youth combat, canvas-sack loot, and a shanty-crowd-youth clear marker.
- [~] City drying-meat youth branch is represented through focused street-side cured-meat loot, youth combat, canvas-sack loot, and a drying-meat-youth clear marker.
- [~] City drying-hut sack branch is represented through focused street-side cured-meat loot, squatter combat, canvas-sack loot, and a drying-hut-sack clear marker.
- [~] City old-tower scavenged branch is represented through focused city thug combat, rooftop bird combat, scavenged torch/cured-meat loot, and an old-tower-scavenged clear marker.
- [~] City old-tower thug-rubble branch is represented through focused city thug combat, rubble loot, scavenged torch/cured-meat loot, and an old-tower-thug-rubble clear marker.
- [~] City subway scavenged branch is represented through focused lizard combat, torch-gated rat-swarm combat, scavenged torch/cured-meat loot, and a subway-scavenged clear marker.
- [~] City subway beast-rubble branch is represented through focused lizard combat, beast combat, rubble loot, scavenged torch/cured-meat loot, and a subway-beast-rubble clear marker.
- [~] City military-camp supplies branch is represented through focused sniper combat, veteran combat, body-supplies loot, and a military-camp-supplies clear marker.
- [~] City commando supplies branch is represented through focused soldier combat, masked-commando combat, body-supplies loot, and a commando-supplies clear marker.
- [~] City hospital elderly-squatters ward branch is represented through focused squatters combat, shared operating-theatres aftermath loot, and a hospital-squatters clear marker.
- [~] City hospital old-man operating-theatres branch is represented through focused old-man combat, dried-meat ward loot, shared operating-theatres aftermath loot, and an old-man-theatres clear marker.
- [~] City hospital old-man squatters branch is represented through focused old-man combat, elderly-squatters combat, shared operating-theatres aftermath loot, and an old-man-squatters clear marker.
- [~] Executioner events are represented through a focused 38-key Ravaged Battleship catalog with exact key-set coverage, including intro ancient-beast/automated-turret, webbed-corridor/chitinous, operative/military-camp/researcher, and barricade/weapons/remains branches, antechamber `nextEvent` hub with browser-level Command Deck handoff coverage, chance-mapped Engineering elevator routing into assembly/engine-room/fire-junction entries, and chance-mapped Martial elevator routing into armory/right-corridor/scrap entries, Engineering assembly loot plus unruly-welder and quiet-machinery branches with R&D handoff, Engineering engine-room defence-turret and alien-alloy salvage branches with both mechanical-guard and quiet destroyed-engine R&D handoffs, Engineering fire-junction water/HP-cost and guard-post loot branch continuing into unstable-prototype victory and cleanup, Engineering R&D heal-machine, workbench, hypo-blueprint, and prototype branch, Medical checkpoint defence-turret branch into both mechanical-quadruped and automated-guardians continuations, Medical checkpoint gurneys branch into both broken-medic and strategy-room/locker continuations, Medical checkpoint post-medic friends/frozen-robots branch, dispatch-bay weapon loot, unstable-automaton combat, glowstone-blueprint loot, and chance-mapped handoff into guarded cold-storage, guarded surgical-tools, or slipped cold-storage focused slices, Medical automated-guardians/gurneys/quiet-movement branch with cold-storage handoff, Medical gurneys friends/dispatch-bay chained-medic branch with cold-storage handoff, Medical guarded second-checkpoint mechanical-guard/medic/surgical branch with containment-to-experiment handoff, Medical guarded cold-storage mechanical-guard/medic chain with containment-to-experiment handoff, Medical cold-storage cured-meat/security-drone/final-medic branch continuing into malformed-experiment victory and cleanup, Medical surgical-tools direct-medic and explosives/final-medic branches with containment-to-experiment handoffs, Medical strategy-room locker/noisy-medic/quadruped branch with cold-storage handoff, Medical frozen-robots dispatch-bay loot and unstable-automaton route continuing through cold-storage and malformed-experiment cleanup, Martial armory sealed-door grenade-blast branch continuing into murderous-robot victory and cleanup, Martial right-corridor/cabins/plasma-blueprint and silent-cabins branches, Martial scrap/guard/quadruped/plasma-blueprint and wall-sensors branches, Martial security-checkpoint dead-guards and empty-cells branches continuing into murderous-robot victory and cleanup, Martial planning-room map-scavenging/noisy-guard and automated-sentry branches with the automated-sentry route continuing into murderous-robot victory and cleanup, Martial training-complex regenerative machine and murderous-robot handoff, Command Deck guard/lounge weapons-cache and medical-supplies routes both into wanderer victory and cleared-deck cleanup, Martial Wing murderous robot, Engineering Wing unstable prototype, Medical Wing malformed experiment, and Medical Wing unstable automaton combat slices; exhaustive battleship scene parity beyond this focused catalog is deferred outside pragmatic Phase 6 closure.
- [x] All Phase 5 Global/Room/Outside/Marketing event titles from `DATA/canonical-manifest.json` represented.
- [ ] All event titles from `DATA/canonical-manifest.json` represented across later Encounter/Setpiece/Executioner phases.
- [ ] All event scene keys from generated manifests represented across later Encounter/Setpiece/Executioner phases.

## Combat Parity

- [x] Combat runtime boundary exists separately from `EventRuntime`, with direct headless tests for start, attack/loot, death callback, and lifecycle restore.
- [x] Player health formula matches original through direct combat-boundary coverage.
- [x] Armour health bonuses match original through direct combat-boundary coverage.
- [x] Player precise and enemy evasive hit chance formulas match original through direct combat-boundary coverage.
- [x] Enemy attack timing, including fractional-second delays and repeated scheduling, matches original through direct combat-boundary coverage.
- [x] Weapon cooldowns match original for every original weapon through direct combat-boundary coverage.
- [x] Weapon costs match original for every original weapon through direct combat-boundary coverage.
- [~] Weapon damage and stun values match original for every original weapon through direct combat-boundary coverage; broader enemy special damage interactions remain open.
- [x] Stun behavior matches original through direct combat-boundary coverage for attack suppression, exact expiry, and lifecycle restore.
- [x] Healing item effects and cooldowns match original for cured meat, medicine, and hypo through direct combat-boundary coverage.
- [x] Kinetic armour shield and stim boost actions match original through direct combat-boundary coverage for hit reflection, venom DOT suppression, HP cost, cooldowns, weapon acceleration, and lifecycle restore.
- [~] Loot table rolls, won-combat lifecycle restore, Path capacity-limited `take all you can` behavior, drop-and-take mechanics, and loot-row hover/focus drop-menu presentation match original for representative combat slices; broader World/Path integration remains open.
- [~] Player death closes the representative combat slice, notifies `the world fades`, clears `outfit`, marks death/room-return state, fires once after restored lethal attack timing, and is consumed by `GameSession` back into visible room state; broader World-death parity remains open.
- [~] Combat victory flow, including won-combat restore, post-victory take/leave cooldowns, one-time loot transfer, original safe-return outfit handling, and `GameSession` visible Path return handling, matches original for representative combat slices; broader Path/World parity remains open.
- [x] All original wilderness encounter enemy stats, ranged flags, notifications, and loot tables are represented.
- [~] Organic World encounter and landmark selection is bridged into `EventRuntime` through original terrain/distance encounter bands, original landmark scene-name routing, executioner first-visit/return routing, session/test-harness commands, browser smoke coverage, and session-level combat return marker consumption; full original World generation, landmark distribution, and map parity remain open.
- [~] Setpiece combat data is supported through a focused 49-key catalog with exact key-set coverage for cave, old house, town, city, and mine-clearing enemies; focused Outpost replenishment/scene loot, Borehole alien-alloy scene loot, Battlefield salvage scene loot, Crashed Ship salvage discovery, Destroyed Village cache traversal with prestige-store transfer, Swamp charm-gated gastronome, Old House medicine/supplies scene loot and squatter combat, Cave beast/lizard/small-beast/large-beast/giant-lizard combat plus camp, wanderer-body, animal-nest, old-case loot, and back-cave supply-cache loot, Town thug/scavenger/beast/vigilante/madman combat plus clinic medicine, clinic ransacked ending, schoolhouse locker, scavenger-camp cache, wanderer-rifle loot, overturned-caravan loot, food-basket loot, and trinket loot, City old-tower thug/bird combat and nest/scavenged loot, old-tower thug/beast rubble branches, sniper combat, soldier-patrol chained combat and supplies loot, commando-settlement combat and burning-settlement loot, commando-supplies soldier/commando combat and body-supplies loot, subway lizard/rat combat, battle-platform supplies loot, subway beast combat, rubble loot, and scavenged loot, military-camp sniper/veteran combat and outpost supplies loot, shanty-market frail-man/youth combat and shop/canvas-sack loot, shanty-crowd frail-man/squatters combat and belongings/canvas-sack loot, drying-hut cured-meat loot, squatter combat, hut cache loot, and canvas-sack branch, hospital stockpile loot, hospital ward lizard-pack combat and operating-theatre aftermath loot, hospital deformed operating-theatre combat and warped-man equipment loot, hospital tentacles combat and victim-remains loot, hospital old-man small-cache loot, old-man dried-meat operating-theatres branch, old-man squatters operating-theatres branch, and old-man medicine-cabinet branch, Sulphur Mine, Coal Mine, and Iron Mine traversal slices run through EventRuntime, the mine traversals apply cleared world-state flags, and World city landmark routing now targets existing hospital old-man cache/medicine setpiece keys; exhaustive setpiece scene parity and full mine/world UI integration remain later-scope work.
- [~] City shanty crowd combat is represented with original crowd-surge squatters stats, combat loot, abandoned-belongings loot, and scene-continuation leave semantics.
- [~] City shanty crowd youth combat is represented with original youth stats, combat loot, canvas-sack loot, and scene-continuation leave semantics.
- [~] City drying-meat youth combat is represented with original youth stats, combat loot, canvas-sack loot, and scene-continuation leave semantics.
- [~] City old-tower scavenged combat is represented with original city thug and rooftop bird stats, combat loot, scavenged scene loot, and scene-continuation leave semantics.
- [~] City subway scavenged combat is represented with original lizard and rat-swarm stats, combat loot, scavenged scene loot, and scene-continuation leave semantics.
- [~] City subway beast-rubble combat is represented with original lizard and beast stats, combat loot, rubble scene loot, scavenged scene loot, and scene-continuation leave semantics.
- [~] City military-camp supplies combat is represented with original sniper and veteran stats, combat loot, body-supplies scene loot, and scene-continuation leave semantics.
- [~] City hospital squatters combat is represented with original elderly-squatters stats, combat loot, shared operating-theatres aftermath loot, and scene-continuation leave semantics.
- [~] Executioner combat data and specials are supported through the focused 38-key combat-boundary catalog plus Ravaged Battleship intro beast/turret, chitinous horror/queen, operative, and researcher combats, antechamber hub event transitions with chance-mapped Engineering elevator routing into assembly/engine-room/fire-junction entries and chance-mapped Martial elevator routing into armory/right-corridor/scrap entries, Engineering assembly welder/guard with R&D handoff, Engineering engine-room defence-turret/guard plus alien-alloy salvage with both guard and quiet destroyed-engine R&D handoffs, Engineering fire-junction guard plus guard-post loot into unstable-prototype combat with hypo-blueprint and kinetic-armour-blueprint loot plus deck-cleared flag, Engineering R&D turret/prototype plus hypo-blueprint loot, Medical checkpoint turret route into both quadruped and automated-guardians branches, Medical checkpoint gurneys route into both medic and strategy-room/locker branches, Medical checkpoint post-medic friends/frozen-robots branch, dispatch-bay loot, unstable-automaton explosion combat, glowstone-blueprint loot, and chance-mapped handoff into guarded cold-storage, guarded surgical-tools, or slipped cold-storage focused slices, Medical automated-guardians quiet branch into quadruped/automaton and cold-storage handoff, Medical gurneys chained-medic branch with hypo use and cold-storage handoff, Medical guarded checkpoint guard/medic chain with containment-to-experiment handoff, Medical guarded cold-storage guard/medic chain with containment-to-experiment handoff, Medical cold-storage final-medic chain into malformed-experiment combat with stim-blueprint loot and deck-cleared flag, Medical surgical-tools direct medic and final-medic chains with containment-to-experiment handoffs, Medical surgical-tools explosives route into malformed-experiment combat with stim-blueprint loot and deck-cleared flag, Medical strategy-room noisy-medic/quadruped/automaton chain with cold-storage handoff, Medical frozen-robots medic and unstable-automaton explosion chain through glowstone-blueprint loot, cold-storage medic fights, malformed-experiment combat, stim-blueprint loot, and deck-cleared flag, Martial armory grenade-cost route through weapon loot and defence-turret combat into murderous-robot combat with disruptor-blueprint loot and deck-cleared flag, Martial right-corridor turret/quadruped plus cabin and plasma-blueprint loot and silent-cabins branch, Martial scrap guard/quadruped plus plasma-blueprint loot and wall-sensors avoidance into quadruped combat, Martial security-checkpoint dead-guards and empty-cells branches into quadruped and murderous-robot combat with disruptor-blueprint loot and deck-cleared flag, Martial planning-room map-scavenging/noisy-guard and automated-sentry branches into the second guard chain, automated-sentry continuation into murderous-robot combat with disruptor-blueprint loot and deck-cleared flag, Martial training-complex heal-machine into murderous-robot combat plus deck-cleared flag, Command Deck guard/wanderer victory with fleet-beacon loot and cleanup, Martial Wing robot, Engineering Wing prototype, Medical Wing experiment, and Medical Wing automaton event slices with `atHealth` status triggers, venomous damage-over-time, scheduled shield/energised/enraged/meditation enemy specials, delayed explosion-on-defeat combat, and representative blueprint loot; exhaustive executioner scene coverage remains a later-scope parity target.
- [~] Engineering quiet assembly branch is represented through original assembly-line loot, decrepit-machinery text, mechanical-guard combat, and R&D handoff.
- [~] Engineering R&D heal-machine/workbench branch is represented through alien-alloy cost, max-health restoration, healed text, workbench text, hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, and Engineering deck-cleared flag.

## Path and Outfitting Parity

Phase 7 completion gate:

- [x] Phase 6 pragmatic combat/event-runtime scope is finalized and not carrying explicit Phase 6 closure work.
- [x] Player-facing Path foundation exists before Phase 7 hardening starts.
- [x] Minimal World embark/return consumer exists so Path return semantics can be tested.
- [x] Organic browser smoke reaches Compass, Path, World movement, and Path return without direct resource injection.
- [x] Full Phase 7 Path parity is complete for the Path/outfitting scope; remaining World/ship/map expansion is tracked under Phase 8.

- [x] Path unlock condition is player-facing through Compass purchase and `A Dusty Path` tab reveal, with organic browser coverage for the original reveal message.
- [x] Compass behavior opens Path on successful purchase, emits `the compass points ...`, and shows the Compass store tooltip from original direction formula or stored ship direction; full original ship placement remains Phase 8 World scope.
- [x] Bag base capacity uses the original `DEFAULT_BAG_SPACE`.
- [x] Capacity upgrades use the original helper data and session coverage verifies the original rucksack/wagon/convoy/cargo-drone priority.
- [x] Weight overrides use the original path weight data.
- [x] Default item weight behavior matches the original fallback.
- [x] Outfit add/remove behavior is player-facing for original carryable supplies with original displayed-name ordering, tooltip metadata, store/outfit clamping, original many-control enablement, command-boundary rejection of non-carryable stores, original carried-count row values, and original-style single/many arrow controls.
- [x] Free space calculation uses original weight/capacity helpers.
- [x] Path armour and water rows use original upgrade priority, and World embark uses the same max-health/max-water helper values.
- [x] Perk display uses original perk data.
- [x] Embark transfers selected outfit from stores, opens the first World slice, and repeated safe expeditions re-reserve the remaining outfit without duplicating stores; full original World arrival semantics remain Phase 8 scope.
- [x] Returning from combat or the current World village slice restores outfit/stores with the original safe-return filter, lands in visible Path state, and blocks re-embark when all carried Cured Meat was consumed; broader World home-return discovery/building/blueprint parity remains Phase 8 scope.

## World Parity

- [~] World map dimensions use the original 61x61 bounds internally, but the production viewport is a compact first slice.
- [x] Village position matches original.
- [x] Terrain generation uses the original ring fill, probability, and stickiness model through deterministic engine RNG.
- [x] Landmark placement uses original landmark counts and radii, with bounded fallback only for degenerate deterministic RNG.
- [ ] Roads are generated as original.
- [x] Visibility mask/light radius uses the original diamond uncover behavior and is persisted in World state.
- [~] Movement buttons and keyboard movement exist; full original click/swipe/key parity remains open.
- [~] Food consumption per movement is represented for Cured Meat; full original starvation/perk behavior remains open.
- [~] Water consumption per movement is represented; full original thirst/perk behavior remains open.
- [~] Starvation notification exists; original death/perk loop remains open.
- [~] Thirst notification exists; original death/perk loop remains open.
- [~] Fight chance routes into the existing World encounter bridge; original fight delay and danger behavior remain open.
- [~] Landmark entry routes generated original landmark scene names into the setpiece bridge; full visited-state, road, outpost, mine, and discovery consequences remain open.
- [ ] Outpost use behavior matches original.
- [ ] Mine clearing unlocks original worker/building outcomes.
- [ ] Ship discovery unlocks ship as original; current Phase 8 foundation only stores generated ship direction for Compass messaging.
- [ ] Fabricator/executioner discovery unlocks as original latest web content.

## Ship, Fabricator, Space, Ending Parity

- [ ] Ship unlock matches original.
- [ ] Hull reinforcement cost matches original.
- [ ] Engine upgrade cost matches original.
- [ ] Lift-off gating matches original.
- [ ] Fabricator unlock matches original.
- [ ] Every fabricator craftable has matching cost, type, quantity, blueprint gate, and message.
- [ ] Blueprint redemption matches original.
- [ ] Space ship movement speed formula matches original.
- [ ] Asteroid spawn timing matches original.
- [ ] Asteroid speed/randomness matches original.
- [ ] Collision/hull loss matches original.
- [ ] Altitude progression and title changes match original.
- [ ] Crash behavior matches original.
- [ ] Escape threshold and win flow match original.
- [ ] Score calculation matches original.
- [ ] Prestige collection behavior matches original.

## Discovery Parity Tests

These tests protect the original reveal curve.

- [x] Start: no outside/path/world/ship/fabricator/space UI visible.
- [x] Before wood: no stores panel if original does not show it.
- [x] Before builder state: no craft/build economy visible.
- [x] Before outside unlock: no village/worker UI visible.
- [x] Before compass/path unlock: no outfitting or world map visible.
- [x] Before embark: no world map visible.
- [x] Before ship discovery: no ship UI visible.
- [x] Before executioner/fabricator discovery: no fabricator UI visible.
- [x] Before lift-off: no space UI visible.
- [x] No tutorial text reveals hidden systems early.
- [x] No layout affordance hints at future tabs before original unlocks.

## UI and 4K Parity

- [x] First screen matches minimalist intent.
- [x] Room state readable at 1366x768, 1920x1080, 2560x1440, 3840x2160.
- [x] Implemented Room/Outside location tabs stay vertically anchored during tab switches.
- [x] Implemented notification logs are bounded and fade older messages instead of growing indefinitely.
- [!] Debug settings tab is readable at target desktop widths behind `?debug=1` but is tooling, not original UI parity. See `REMAKE/docs/deviations.md#dev-007-in-app-debug-settings-tab`.
- [x] Clean Room/Outside visual baselines use `?testHarness=1` without `debug=1` so debug tooling is excluded.
- [x] Outside worker table readable at all target resolutions.
- [x] Path outfitting readable at all target resolutions for the first player-facing slice, including bounded full-carryable-list scrolling without horizontal overflow.
- [x] World map grid stable at all target resolutions for the first player-facing slice.
- [~] Event panel line length, desktop stores-column separation, and focus containment controlled for representative production slices.
- [x] Stores income rows are grouped by source to keep worker production readable in dense Room/Village states.
- [x] Long Room build/craft/buy columns are capped before they dominate the room layout.
- [x] Disabled action buttons and worker controls have clear inactive/hover/focus states.
- [~] Combat panel does not overlap for the representative event-modal combat slice.
- [ ] Ship/fabricator controls stable.
- [ ] Space playfield correctly framed.
- [~] Browser zoom/long-text overflow has regression coverage for current Room/Event surfaces; full matrix remains open.

## Test Coverage Gates

- [x] State path API tests.
- [x] Deterministic RNG tests.
- [x] Timer scheduler tests.
- [x] Resource mutation tests.
- [x] Command dispatcher tests.
- [x] Event bus tests.
- [x] Notification model tests.
- [x] Button cooldown model tests.
- [x] Browser dev save/load lifecycle round-trip tests.
- [~] Data key parity tests.
- [~] Data constant parity tests.
- [~] Behavior scenario tests.
- [x] Discovery parity tests.
- [x] Organic browser smoke from fresh room to Compass, Path, embark, World movement, and Path return without resource injection.
- [ ] Full playthrough smoke test.
- [x] Visual screenshots for implemented Phase 3 states/resolutions.
- [x] Visual screenshots for implemented Phase 4 Outside worker state/resolutions.
- [x] Visual screenshots for implemented Path/World foundation slices/resolutions.
- [x] Debug settings default-off and multiplier behavior tests.

## Architecture Hardening Gates

- [x] Room snapshots are side-effect free.
- [x] Outside snapshots are side-effect free.
- [x] Cooldown snapshots are side-effect free.
- [x] Availability unlock side effects run through an explicit refresh method.
- [x] Production time advances by elapsed wall time instead of fixed React interval ticks.
- [x] Runtime update lifecycle is owned by an engine-side session boundary instead of ad hoc React refresh logic.
- [x] Dev save/load snapshots engine state, clock, cooldowns, notifications, Room timers, Outside timers, and Event Runtime lifecycle.
- [x] Room store selectors and action option calculations are extracted from `RoomRuntime`.
- [x] Notification history has retention and source filtering.
- [x] Debug realtime speed multiplier is isolated in the clock/session layer and defaults off.
- [x] Debug income multiplier is isolated to passive income and defaults off.
- [x] Debug settings tab is hidden on the default entry and visible only with `?debug=1`.
- [x] Gameplay UI actions dispatch through the session command boundary instead of receiving runtime classes directly.
- [x] Combat actions, enemy attack timers, loot, and current death effects are owned by `CombatRuntime` instead of `EventRuntime`.
- [x] Combat losing path exposes an explicit room-return death outcome for later Path/World runtime integration.
- [x] Top-level dependency versions are pinned exactly.

## Required Scenario Tests

- [x] Trap cost after N traps.
- [x] Hut cost after N huts.
- [x] Complete Phase 3 UI progression through fire, outside unlock, gather wood, trap, and cart.
- [x] Worker income with positive and negative stores.
- [x] Trap drop deterministic seed cases.
- [x] Hut destruction and villager death side-effect cases.
- [x] Natural Phase 4 browser progression through fire, outside, traps, cart, hut, lodge, population, worker assignment, and worker income UI without direct state injection.
- [~] Event reward applied exactly once for the initial production Room-event slice.
- [~] Event cost deducted exactly once for the initial production Room-event slice.
- [~] Chance branch follows deterministic RNG seed for the initial production Room-event slice.
- [x] Combat hit/stun/heal-cooldown deterministic seed cases.
- [x] Loot roll, won-combat restore, capacity-limited take, and drop-and-take deterministic seed cases.
- [~] Combat death returns the current event-modal UI to the visible room state, notifies `the world fades`, and clears the consumed `game.world.returnLocation` marker; broader World-death parity remains open.
- [~] Combat death/outfit handling clears `outfit`, marks room-return state, records `game.world.lastReturnLocation`, and remains one-shot after lifecycle restore in the combat boundary; broader World-death parity remains open.
- [~] Clear iron mine sets the original world iron-mine cleared flag through focused setpiece traversal; worker/building unlock integration remains open.
- [~] Clear coal mine sets the original world coal-mine cleared flag through focused setpiece traversal; worker/building unlock integration remains open.
- [~] Clear sulphur mine sets the original world sulphur-mine cleared flag through focused setpiece traversal; worker/building unlock integration remains open.
- [~] Blueprint loot redeems into `character.blueprints` on combat safe return; full Fabricator availability UI remains open.
- [x] Fresh browser progression can reach Path, outfit Cured Meat, embark to World, move, and return to Path without direct resource injection.
- [ ] Lift-off fails/succeeds under original hull rules.
- [ ] Space escape triggers ending/prestige behavior.
