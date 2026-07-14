# Parity Checklist

Last updated: 2026-07-11

Purpose: implementation tracker for gameplay/UI parity excluding deferred systems. This checklist is intentionally explicit so "exact same game data" is verifiable instead of aspirational.

Authorities:

- source baseline: `REMAKE/docs/source-baseline.md`
- machine manifest: `DATA/canonical-manifest.json`
- parser parity graph: `DATA/parity-graph.json`
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
- [x] Parser-backed event/scene/button/transition/effect/reward graph generated with stable requirement IDs and mutation-sensitive verification.
- [x] Source baseline pinned in `REMAKE/docs/source-baseline.md`.
- [x] License/attribution plan accepted.
- [x] Deferred scope accepted.
- [x] Phase 0.5 risk spike completed before gameplay implementation.
- [!] Debug settings tab is intentionally non-original, visible only with `?debug=1`, and documented in `REMAKE/docs/deviations.md#dev-007-in-app-debug-settings-tab`.

## Source Data Coverage

- [x] Core engine constants represented.
- [x] Production Hyper/Classic mode confirms first activation, persists `config.hyperMode`, doubles eligible real-time timers and cooldowns, and leaves Space timing at classic speed.
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
- [x] Post-World stocks above 5,000 organically start thief losses, record actual stolen amounts, and make both restitution and `stealthy` outcomes reachable.
- [x] Worker unlocks from buildings/mines match original.
- [x] Village title thresholds match original.
- [x] Hut destruction and villager death event side effects match original.

## Event Runtime Parity

- [x] Event pool composition matches original for Phase 5 Global/Room/Outside/Marketing pools.
- [x] Event scheduling range and delay behavior matches original for Phase 5 non-combat event pools.
- [x] Event availability checks match original for Phase 5 non-combat event pools, with the Scout `World.applyMap` button guarded by the Phase 8 World-runtime capability bridge.
- [x] Scene text rendering preserves original text for Phase 5 non-combat event pools.
- [x] Scene notification behavior matches original for Phase 5 non-combat event pools.
- [x] Button cost validation matches original for Phase 5 non-combat event pools.
- [x] Button reward handling matches original for Phase 5 non-combat event pools.
- [x] `onChoose` behavior matches original for Phase 5 non-combat event pools, with `World.applyMap` routed into the Phase 8 World mask reveal handler.
- [x] `onLoad` side effects are supported for Phase 5 non-combat event pools.
- [x] Chance-based scene branching matches original semantics for Phase 5 non-combat event pools.
- [x] Delayed scene actions are supported for the original Mysterious Wanderer slices.
- [x] Event lifecycle restore clears owned event, combat, and delayed-action timers before restoring state.
- [x] Passive fresh-run browser scheduling reaches the original Marketing event pool without forced event triggering.
- [x] Loot handling covers combat and scene loot, original rolls, one-time transfer, Path capacity, drop-and-take behavior, safe return, and every canonical encounter family.
- [x] Combat-shaped scenes can be represented and resolved for every original wilderness encounter definition through the extracted `CombatRuntime` boundary.
- [x] Leave/end behavior matches original for Phase 5 non-combat event pools.
- [!] Event pause/attention behavior reviewed; title blink is intentionally replaced by a focused modal. See `REMAKE/docs/deviations.md#dev-008-focused-event-modal-instead-of-browser-title-blink`.

## Event Content Coverage

- [x] Global events represented.
- [x] Room events represented.
- [x] Outside events represented.
- [x] Marketing event represented by the original `Penrose` slice.
- [x] All original wilderness Encounter events are represented and enter organically through original World terrain/distance selection, movement, and persisted map state.
- [x] All 13 parser-backed Setpiece event graphs are represented with their original entry, branching, combat, loot, clearing, and return consequences.
- [x] City shanty crowd branch is represented through focused frail-man combat, crowd-surge squatters combat, abandoned-belongings loot, and a shanty-crowd clear marker.
- [x] City shanty crowd sack branch is represented through focused frail-man combat, crowd-surge squatters combat, canvas-sack loot, and a shanty-crowd-sack clear marker.
- [x] City shanty crowd youth branch is represented through focused frail-man combat, crowd text, youth combat, canvas-sack loot, and a shanty-crowd-youth clear marker.
- [x] City drying-meat youth branch is represented through focused street-side cured-meat loot, youth combat, canvas-sack loot, and a drying-meat-youth clear marker.
- [x] City drying-hut sack branch is represented through focused street-side cured-meat loot, squatter combat, canvas-sack loot, and a drying-hut-sack clear marker.
- [x] City old-tower scavenged branch is represented through focused city thug combat, rooftop bird combat, scavenged torch/cured-meat loot, and an old-tower-scavenged clear marker.
- [x] City old-tower thug-rubble branch is represented through focused city thug combat, rubble loot, scavenged torch/cured-meat loot, and an old-tower-thug-rubble clear marker.
- [x] City subway scavenged branch is represented through focused lizard combat, torch-gated rat-swarm combat, scavenged torch/cured-meat loot, and a subway-scavenged clear marker.
- [x] City subway beast-rubble branch is represented through focused lizard combat, beast combat, rubble loot, scavenged torch/cured-meat loot, and a subway-beast-rubble clear marker.
- [x] City military-camp supplies branch is represented through focused sniper combat, veteran combat, body-supplies loot, and a military-camp-supplies clear marker.
- [x] City commando supplies branch is represented through focused soldier combat, masked-commando combat, body-supplies loot, and a commando-supplies clear marker.
- [x] City hospital elderly-squatters ward branch is represented through focused squatters combat, shared operating-theatres aftermath loot, and a hospital-squatters clear marker.
- [x] City hospital old-man operating-theatres branch is represented through focused old-man combat, dried-meat ward loot, shared operating-theatres aftermath loot, and an old-man-theatres clear marker.
- [x] City hospital old-man squatters branch is represented through focused old-man combat, elderly-squatters combat, shared operating-theatres aftermath loot, and an old-man-squatters clear marker.
- [x] All six Executioner events and their 103 canonical scenes are represented, including every wing route, combat special, Blueprint reward, Command Deck gate, and Battleship-clear consequence.
- [x] All Phase 5 Global/Room/Outside/Marketing event titles from `DATA/canonical-manifest.json` represented.
- [x] Every one of the 48 source event identities and titles in `DATA/canonical-manifest.json` maps exactly once across the 119 runtime definitions.
- [x] Every source event scene requirement in `DATA/parity-graph.json` is represented: 274 scenes, 462 buttons, 542 transitions, 869 effects, 352 rewards, 2,547 requirements, and 2,791 graph edges.

## Combat Parity

- [x] Combat runtime boundary exists separately from `EventRuntime`, with direct headless tests for start, attack/loot, death callback, and lifecycle restore.
- [x] Player health formula matches original through direct combat-boundary coverage.
- [x] Armour health bonuses match original through direct combat-boundary coverage.
- [x] Player precise and enemy evasive hit chance formulas match original through direct combat-boundary coverage.
- [x] Enemy attack timing, including fractional-second delays and repeated scheduling, matches original through direct combat-boundary coverage.
- [x] Weapon cooldowns match original for every original weapon through direct combat-boundary coverage.
- [x] Weapon costs match original for every original weapon through direct combat-boundary coverage.
- [x] Weapon damage, stun, and enemy-special interactions match the original through deterministic combat-boundary coverage.
- [x] Stun behavior matches original through direct combat-boundary coverage for attack suppression, exact expiry, and lifecycle restore.
- [x] Healing item effects and cooldowns match original for cured meat, medicine, and hypo through direct combat-boundary coverage.
- [x] Kinetic armour shield and stim boost actions match original through direct combat-boundary coverage for hit reflection, venom DOT suppression, HP cost, cooldowns, weapon acceleration, and lifecycle restore.
- [x] Loot rolls, won-combat restore, Path capacity, `take all you can`, drop-and-take behavior, and loot-row interaction match the original across organic World/Path flows.
- [x] Player death closes combat once, notifies `the world fades`, clears `outfit`, records return state, survives lifecycle restore correctly, and returns through the visible World/Room session flow.
- [x] Combat victory restores lifecycle state, gates post-victory actions, transfers loot once, applies safe-return outfit rules, and returns visibly through Path/World.
- [x] All original wilderness encounter enemy stats, ranged flags, notifications, and loot tables are represented.
- [x] Organic encounters and landmarks enter `EventRuntime` through original terrain/distance bands and scene routing; deterministic generation plus a 64-seed randomized corpus verifies map dimensions, landmark distribution, and reachability.
- [x] Setpiece combat and traversal cover every canonical Cave, Old House, Town, City, Outpost, one-off landmark, and Mine route through the shared Event/Combat/World integration.
- [x] Canonical Phase 9 Setpiece traversal covers all 13 parser-backed source events: Outpost, Swamp, Cave, Town, City, Old House, Battlefield, Borehole, Crashed Ship, Sulphur Mine, Coal Mine, Iron Mine, and Destroyed Village Cache. Their complete canonical graphs preserve organic World entry, coordinate-scoped clearing/use/visited state, original chance branches, costs, combat continuations, loot, replenishment, perks, mine road and safe-return worker consequences, prestige-store transfer, and endings.
- [x] City shanty crowd combat is represented with original crowd-surge squatters stats, combat loot, abandoned-belongings loot, and scene-continuation leave semantics.
- [x] City shanty crowd youth combat is represented with original youth stats, combat loot, canvas-sack loot, and scene-continuation leave semantics.
- [x] City drying-meat youth combat is represented with original youth stats, combat loot, canvas-sack loot, and scene-continuation leave semantics.
- [x] City old-tower scavenged combat is represented with original city thug and rooftop bird stats, combat loot, scavenged scene loot, and scene-continuation leave semantics.
- [x] City subway scavenged combat is represented with original lizard and rat-swarm stats, combat loot, scavenged scene loot, and scene-continuation leave semantics.
- [x] City subway beast-rubble combat is represented with original lizard and beast stats, combat loot, rubble scene loot, scavenged scene loot, and scene-continuation leave semantics.
- [x] City military-camp supplies combat is represented with original sniper and veteran stats, combat loot, body-supplies scene loot, and scene-continuation leave semantics.
- [x] City hospital squatters combat is represented with original elderly-squatters stats, combat loot, shared operating-theatres aftermath loot, and scene-continuation leave semantics.
- [x] Executioner combat covers all 16 canonical definitions, health-triggered and scheduled specials, delayed explosion behavior, every wing route, all Blueprint loot, and final Battleship cleanup.
- [x] Engineering quiet assembly branch is represented through original assembly-line loot, decrepit-machinery text, mechanical-guard combat, and R&D handoff.
- [x] Engineering R&D heal-machine/workbench branch is represented through alien-alloy cost, max-health restoration, healed text, workbench text, hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, and Engineering deck-cleared flag.

## Path and Outfitting Parity

Phase 7 completion gate:

- [x] Phase 6 pragmatic combat/event-runtime scope is finalized and not carrying explicit Phase 6 closure work.
- [x] Player-facing Path foundation exists before Phase 7 hardening starts.
- [x] Minimal World embark/return consumer exists so Path return semantics can be tested.
- [x] Organic browser smoke reaches Compass, Path, World movement, and Path return without direct resource injection.
- [x] Full Path/outfitting parity is integrated with the finalized World, Ship, and Fabricator modules.

- [x] Path unlock condition is player-facing through Compass purchase and `A Dusty Path` tab reveal, with organic browser coverage for the original reveal message.
- [x] Compass behavior opens Path on successful purchase, emits `the compass points ...`, and shows the Compass store tooltip from original direction formula or stored ship direction; original ship placement direction is covered by the finalized Phase 8 World foundation.
- [x] Bag base capacity uses the original `DEFAULT_BAG_SPACE`.
- [x] Capacity upgrades use the original helper data and session coverage verifies the original rucksack/wagon/convoy/cargo-drone priority.
- [x] Weight overrides use the original path weight data.
- [x] Default item weight behavior matches the original fallback.
- [x] Outfit add/remove behavior is player-facing for original carryable supplies with original displayed-name ordering, tooltip metadata, store/outfit clamping, original many-control enablement, command-boundary rejection of non-carryable stores, original carried-count row values, and original-style single/many arrow controls.
- [x] Free space calculation uses original weight/capacity helpers.
- [x] Path armour and water rows use original upgrade priority, and World embark uses the same max-health/max-water helper values.
- [x] Perk display uses original perk data.
- [x] Embark transfers selected outfit from stores, opens World, and repeated safe expeditions re-reserve the remaining outfit without duplicating stores.
- [x] Returning from combat or World restores outfit/stores with the original safe-return filter, lands in visible Path state, blocks foodless re-embark, and commits discovery, buildings, Blueprints, Ship, and Fabricator consequences.

## World Parity

- [x] World map dimensions use the original 61x61 bounds in the runtime and player-facing map surface.
- [x] Village position matches original.
- [x] Terrain generation uses the original ring fill, probability, and stickiness model through deterministic engine RNG.
- [x] Landmark placement uses original landmark counts and radii, with bounded fallback only for degenerate deterministic RNG.
- [x] Roads use the original Mine-clear, Crashed Ship, cleared Cave/Town/City-to-Outpost, and final Battleship-clear algorithms, with deterministic and browser traversal coverage.
- [x] Visibility mask/light radius uses the original diamond uncover behavior and is persisted in World state.
- [x] World map rendering now exposes the full original 61x61 map through the persisted visibility mask, preserves hidden tiles as blank space, renders the current position as `@`, normalizes visited landmark glyphs to their first character, and exposes original tooltip metadata for the current wanderer, village, and visible unconsumed landmarks.
- [x] Scout map purchases reveal original radius-5 diamond mask areas, safe village return tests normal exploration mask completion, `game.world.seenAll` updates after full reveal, and browser coverage proves active-World Scout map purchase, visible map reveal, original notification, and fully revealed button hiding.
- [x] Movement buttons, pure-UI/browser-covered original keyboard movement, original map-click quadrant movement, and original swipe movement exist with browser-covered visible original forest/field/barrens terrain-transition narration and village-tile auto-return.
- [x] Food consumption per movement uses original travel-tile-only gating, Cured Meat cadence, `slow metabolism`, Cured Meat healing, `gastronome`, starvation notification, starvation status display, starvation death, death counter, and tenth-death perk unlock, with browser coverage for starvation status, Room return, World-tab closure, and `the world fades`.
- [x] Water consumption per movement uses original travel-tile-only gating, water cadence, `desert rat`, thirst notification, thirst status display, dehydration death, death counter, and tenth-death perk unlock, with browser coverage for dehydration death, Room return, World-tab closure, and `the world fades`.
- [x] Starvation can kill during World travel and return the player to the room through the original world-fade outcome.
- [x] Thirst can kill during World travel and return the player to the room through the original world-fade outcome.
- [x] Fight chance routes into the existing World encounter bridge with original travel-tile-only gating, fight delay, and `stealthy` chance behavior, with browser coverage for movement-delayed encounter start and fight-move reset.
- [x] Danger state uses original distance/armour thresholds, visible original notifications, and visible World status display, with browser coverage for movement-driven danger and safer status plus notification transitions.
- [x] Every generated landmark enters its canonical scene graph organically, persists coordinate-scoped visited/cleared state, applies original rewards and consequences, and converts eligible cleared landmarks to road-connected Outposts.
- [x] Outposts auto-enter, replenish water, expose original loot, persist expedition-scoped use state, block repeat use, reset after safe return, and work immediately when created from cleared landmarks.
- [x] Organic Iron, Coal, and Sulphur Mine traversal applies canonical combat/clear state, draws roads, marks tiles visited, and unlocks the original buildings and workers on safe return.
- [x] World Exploration is finalized for original generation, movement, visibility, survival, encounters, complete landmark graphs, roads, Outposts, mine consequences, Battleship traversal, and Ship/Fabricator discoveries.
- [x] Safe World return after Crashed Ship clearing unlocks the finalized player-facing Ship module and initializes original hull/thrusters without overwriting the independent ship-position state.
- [x] Safe World return after Executioner discovery unlocks the finalized player-facing Fabricator module and emits the original builder notification.

## Ship, Fabricator, Space, Ending Parity

- [x] Phase 12 Executioner Content is finalized against the pinned 798-requirement source graph: 6 events, 103 scenes, 203 buttons, 226 transitions, 196 effects, and 64 rewards are represented by the deterministic routed content variants and their exhaustive contracts.
- [x] All 16 Executioner combat definitions, including health-triggered venom, timed shield/energised/enraged/meditation specials, repeat avoidance, and unstable-automaton explosion behavior, are implemented through the shared combat runtime.
- [x] Engineering, Medical, Martial, and Command Deck traversal preserves original gating, loot, healing machines, completion flags, final Battleship-to-Outpost conversion, and all six Blueprint rewards through Fabricator redemption.
- [x] Phase 10 Ship Module is finalized for organic discovery handoff, guarded player-facing navigation, hull/engine display, exact Alien Alloy operations, original arrival notification, validated persistence, hull-gated lift-off, one-time departure warning, linger behavior, post-crash cooldown, and live Space handoff.
- [x] Phase 11 Fabricator Module is finalized for guarded player-facing navigation, original tab placement and notification, the complete nine-recipe contract, redeemed-Blueprint visibility, hidden Blueprint gates, exact costs, quantities and Upgrade caps, visible store results, atomic failure, and validated persistence.
- [x] Ship unlock state matches original World safe-return discovery and exposes the guarded player-facing Ship location.
- [x] Hull reinforcement cost matches original.
- [x] Engine upgrade cost matches original.
- [x] Lift-off gating matches the original positive-hull rule, one-time warning, linger branch, and post-crash cooldown.
- [x] Fabricator unlock state matches original Executioner safe-return discovery and exposes the guarded player-facing Fabricator location.
- [x] Every fabricator craftable has matching cost, type, quantity, blueprint gate, and message in the thin playable slice.
- [x] Blueprint redemption matches original and drives Fabricator recipe visibility after safe return.
- [x] A cleared-storage browser run acquires a Blueprint through the generated Executioner route, redeems it on safe return, and uses the resulting Fabricator recipe without direct state injection or forced events.
- [x] Space ship movement speed formula matches original and is bounded to the original playfield coordinates.
- [x] Asteroid spawn timing uses the original altitude-dependent delay and wave-count formulas in the serializable loop, including the source `-40` to `740` travel interval.
- [x] Asteroid speed/randomness uses the original duration formula and engine-owned serializable RNG.
- [x] Collision uses the source glyph footprint against the ship point, removes debris, and loses one hull in the live loop.
- [x] Altitude progresses once per second through the original title thresholds.
- [x] Crash returns to Ship and starts the original 120-second cooldown; audio remains explicitly deferred.
- [x] The original altitude-60 escape threshold reaches the score ending.
- [x] Room, Builder, worker, and thief income remains suspended throughout active Space flight so ending score and prestige cannot inflate during ascent.
- [x] Score calculation uses the original prestige-store factors plus Alien Alloy, Fleet Beacon, and Ship hull bonuses.
- [x] Total score and the source-randomized 24-store prestige carryover persist at ending; restart clears the run while preserving prestige for the next World cache.
- [x] Fleet Beacon ownership presents the original alternate-ending text and wait gate before the score/restart surface.

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
- [x] Event panels maintain bounded line length, stores-column separation, backdrop isolation, and focus containment across production Room, World, Setpiece, Executioner, and ending surfaces at all four desktop targets.
- [x] Stores income rows are grouped by source to keep worker production readable in dense Room/Village states.
- [x] Long Room build/craft/buy columns are capped before they dominate the room layout.
- [x] Disabled action buttons and worker controls have clear inactive/hover/focus states.
- [x] Combat panels remain contained and non-overlapping across event-modal combat snapshots at all four desktop targets.
- [x] Ship and Fabricator controls, including lift-off, are stable at all target desktop resolutions.
- [x] The thin Canvas Space playfield is correctly framed at all four desktop targets.
- [x] Browser zoom and long-text regression coverage spans 100%, 125%, 150%, and 200% effective zoom plus all four target desktop resolutions without horizontal overflow or lost controls.

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
- [x] Data-key parity tests exhaustively compare extracted source identities, event keys, scenes, buttons, transitions, effects, rewards, requirements, and graph edges.
- [x] Data-constant parity tests lock original economy, combat, World, Ship, Fabricator, Space, scoring, and prestige constants.
- [x] Behavior scenarios cover discovery, economy, events, combat, World, Setpieces, Executioner, Ship, Fabricator, Space, ending, persistence, accessibility, and guarded modal input.
- [x] Discovery parity tests.
- [x] Organic browser smoke from fresh room to Compass, Path, embark, World movement, and Path return without resource injection.
- [x] A controlled-clock/RNG fresh-save playthrough reaches the score ending through visible controls and asserted pacing milestones; exhaustive source-graph parity is separately locked, while this single route is not presented as a human pacing distribution.
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
- [x] Combat loss integrates with Path/World rollback, outfit loss, Room return, death notification, and embark cooldown.
- [x] Top-level dependency versions are pinned exactly.

## Required Scenario Tests

- [x] Trap cost after N traps.
- [x] Hut cost after N huts.
- [x] Complete Phase 3 UI progression through fire, outside unlock, gather wood, trap, and cart.
- [x] Worker income with positive and negative stores.
- [x] Trap drop deterministic seed cases.
- [x] Hut destruction and villager death side-effect cases.
- [x] Natural Phase 4 browser progression through fire, outside, traps, cart, hut, lodge, population, worker assignment, and worker income UI without direct state injection.
- [x] Event rewards are applied exactly once across deterministic scene, combat, loot, restore, and organic session boundaries.
- [x] Event costs are deducted exactly once across deterministic scene, combat, restore, and organic session boundaries.
- [x] Chance branches follow deterministic engine RNG across event, Setpiece, Executioner, loot, World-generation, and prestige scenarios.
- [x] Combat hit/stun/heal-cooldown deterministic seed cases.
- [x] Loot roll, won-combat restore, capacity-limited take, and drop-and-take deterministic seed cases.
- [x] World starvation/thirst conditions render in the World status panel, and starvation/thirst death returns to the visible room state, notifies `the world fades`, and clears/consumes return markers; browser coverage proves the starvation branch from real World movement.
- [x] Combat death clears `outfit`, records World/Room return state, survives restore one-shot, and is consumed by the organic visible World-to-Room flow.
- [x] Clearing the Iron Mine sets canonical World state through organic traversal, road/visited consequences, and safe-return building/worker unlocks.
- [x] Clearing the Coal Mine sets canonical World state through organic traversal, road/visited consequences, and safe-return building/worker unlocks.
- [x] Clearing the Sulphur Mine sets canonical World state through organic traversal, road/visited consequences, and safe-return building/worker unlocks.
- [x] Blueprint loot redeems into `character.blueprints` on combat safe return and drives the Fabricator availability UI, including the RA-P1-14 fresh-save Executioner acquisition route.
- [x] Fresh browser progression can reach Path, outfit Cured Meat, embark to World, move, and return to Path without direct resource injection.
- [x] Lift-off fails/succeeds under original hull rules and exposes the original one-time confirmation choice.
- [x] Space escape triggers the ending, persists run and total score exactly once, and applies deterministic seeded/randomized 24-store prestige carryover.
