# A Dark Room Remake Context

Readiness warning: the current player-facing prototype now reaches a first Path/World slice, but it is still not full remake parity. A fresh browser run can reach Compass, reveal `A Dusty Path`, outfit supplies, embark, move on an original-shaped World map/mask foundation, and return to Path. Phase 7 Path/outfitting scope is finalized, while roads, outposts, mines, Ship, Fabricator, Space, ending, and full fresh-playthrough parity are still open. Existing late-game encounter, setpiece, and executioner coverage is runtime/test-harness scaffolding unless routed through the current player-facing World slice.

Current phase: Phase 6 Combat Event Runtime is finalized for the pragmatic runtime-slice scope, not full event/setpiece/executioner parity. Phase 7 Path and Outfitting is finalized for the Path/outfitting scope as of 2026-07-08, and Phase 8 has started with original World map generation, landmark placement, visibility mask, ship-direction storage, and player-facing movement/return contracts. Combat behavior now lives behind a dedicated `CombatRuntime` boundary, the representative `A Snarling Beast` regression slice is preserved, all original wilderness encounter definitions are represented as combat data, focused executioner/setpiece combat catalogs are available for boundary coverage, the focused 38-key Ravaged Battleship catalog and 49-key setpiece catalog are locked by content coverage, the session can trigger World-selected encounters/setpieces through original terrain/distance and landmark-scene bridges, and combat return markers now resolve to visible room/path recovery. Roads, outpost use, mine unlocks, Ship discovery consequences, Fabricator discovery, Space, exhaustive setpiece scene parity, and exhaustive executioner scene parity remain later-phase work.

Goal: recreate the pinned latest web version of _A Dark Room_ in a modern, stable desktop web stack while preserving the original vision, data, pacing, and minimalist discovery curve. Improvements, optimizations, mobile support, audio, durable save migration, and new content come only after gameplay/UI parity is complete.

## Authorities

- Design authority: `ANALYSE/authors_vision_and_success.md`
- Source baseline: `REMAKE/docs/source-baseline.md`
- Main plan: `REMAKE/docs/plan.md`
- Original extracted data index: `DATA/00-extraction-index.md`
- Canonical generated manifest: `DATA/canonical-manifest.json`
- Original source folder: `ORIGINAL/`
- Planning roast audit that triggered earlier hardening: `REPORTS/remake_context_plan_roast_2026-07-06_18-30-46.md`
- Latest prototype roast audit closed by current hardening: `REPORTS/current_prototype_full_roast_audit_2026-07-07_13-29-37.md`
- Phase 6 readiness roast audit: `REPORTS/current_prototype_readiness_roast_audit_2026-07-07_13-50-16.md`

## Active Scope

- Desktop-only browser remake.
- 1366x768 through 3840x2160 support.
- Exact original gameplay data and behavior where technically possible.
- Modern TypeScript/Vite/React UI over a headless TypeScript game engine.
- Deterministic engine tests, data parity tests, scenario tests, and visual regression tests.
- Dev-only browser save/load during parity, stored under `adr-remake-dev-save`; it now snapshots current session lifecycle state but remains non-durable and migration-free.

## Current Implementation Status

- Phase 0 scaffold is complete.
- Phase 0.5 risk spike is complete and quarantined behind `?spikes=1`.
- Phase 1 core engine services are complete at scaffold level.
- Phase 2 source data values are complete for core, room, outside, path, world, ship, space, fabricator, audio manifest, and localization inventory.
- Source-derived snapshot parity tests now compare selected original JS tables directly against ported TypeScript data.
- Phase 3 Room runtime exit criteria are met for fresh start, light fire, stoke fire, original stoke cooldown behavior and visible cooldown rendering, scheduled fire cooling, scheduled room warming, scheduled builder progression, need-wood/outside unlock, stores reveal, builder wood income and income display, full room build/craft/buy action handling, original unlock gates, item maximum/disabled handling, Outside gather-wood behavior, minimal Outside forest/trap display, default-entry discovery hygiene, Room viewport checks at 1366, 1920, 2560, and 3840 widths, stable location tabs, bounded notification log rendering, and Phase 3 screenshot regression baselines.
- Latest roast-audit hardening added side-effect-free snapshots, explicit availability refresh, original-style location tabs, elapsed real-time clock driving outside tests, grouped Room stores, visible action costs, test-only time acceleration, broader Phase 3 E2E/visual coverage, notification retention/filtering, exact top-level dependency pins, extracted pure Room selectors, original Outside first-arrival handling, complete Phase 3 store classification, workshop-gating regression coverage, and an engine-side `GameSession` update boundary.
- A non-original debug `settings` tab is available only with `?debug=1`; it exposes default-off `speed x 10`, `income x 10`, dev save/load/clear controls, and compact runtime state info without pre-discovery future-system labels. It is documented as a testing deviation, not gameplay parity. The default entry and `?testHarness=1` stay clean for player-facing and visual parity checks.
- Phase 4 Outside/Village runtime exit criteria are met for trap checking, original trap drops and bait use, population scheduling and hut capacity, building/mine-dependent worker unlocks, worker assignment controls, worker income collection with consumption blocking, village title/legend behavior, hut destruction, villager death side effects, natural Phase 4 browser progression coverage, and 1366/1920/2560/3840 E2E/visual coverage.
- Phase 5 Event Runtime is finalized for `The Thief`, `The Beggar`, `The Nomad`, `Noises` outside/inside, `The Shady Builder`, both `The Mysterious Wanderer` wood/fur variants, `The Scout`, `The Master`, `The Sick Man`, `A Ruined Trap`, `Fire`, `Sickness`, `Plague`, `A Beast Attack`, `A Military Raid`, and `Penrose`. Current non-combat coverage includes scheduling, availability, scene text, scene notification, button cost validation, deterministic chance branching, scene rewards, repeat merchant buttons, button availability, `onChoose`, `onLoad` effects, delayed rewards, Marketing pool scheduling/link metadata, a hard-gated Scout `World.applyMap` bridge that cannot spend resources until the full World map-reveal handler is wired, Outside hut/villager side-effect bridges, modal UI rendering, self-contained lifecycle restore, and headless/e2e coverage. Phase 6 has extracted combat into `CombatRuntime` and now represents all 11 original wilderness encounter definitions plus focused executioner and setpiece combat catalogs, including Outpost replenishment/scene loot, Borehole alien-alloy scene loot, Battlefield salvage scene loot, Crashed Ship salvage discovery, Destroyed Village cache traversal with original prestige-store transfer and previous-store clearing, Swamp charm-gated gastronome, Old House medicine/supplies scene loot and squatter combat, Cave beast/lizard/small-beast/large-beast combat plus camp, wanderer-body, animal-nest, old-case, and back-cave supply-cache loot, Town thug, scavenger, beast, vigilante, and madman combat, Town clinic torch-gated medicine loot, Town clinic madman route into the ransacked clinic ending, Town schoolhouse locker loot and scavenger-camp cache loot, Town park vigilante route and wanderer-rifle loot, Town caravan route with overturned-caravan loot, hidden food-basket loot, vigilante combat, and trinket loot, City old-tower thug/bird route and nest loot, City old-tower beast/rubble route and scavenged loot, City sniper, City soldier patrol chained combat and supplies loot, City commando settlement route with burning-settlement loot, City subway lizard/rat combat, battle-platform supplies loot, beast-behind-car combat, rubble loot, and scavenged loot, City military camp sniper/veteran combat and outpost supplies loot, City shanty-market frail-man/youth combat and shop/canvas-sack loot, City drying-hut cured-meat loot, squatter combat, and hut cache loot, City hospital torch-gated stockpile loot, City hospital ward lizard-pack combat and operating-theatre aftermath loot, City hospital deformed operating-theatre combat and warped-man equipment loot, City hospital tentacles combat and victim-remains loot, City old-man small-cache loot, City old-man combat into dried-meat and medicine-cabinet loot, Sulphur Mine, Coal Mine, and Iron Mine setpiece traversal slices, focused Ravaged Battleship intro ancient-beast/automated-turret chain plus webbed-corridor knapsack and chitinous-horror/chitinous-queen chain plus operative/military-camp/researcher chain plus barricade weapons and wanderer-remains loot chain, original executioner antechamber `nextEvent` hub routing into focused wing slices, Engineering assembly unruly-welder/mechanical-guard chain plus assembly-line energy-cell/laser-rifle loot branch, defence-turret engine-room alien-alloy salvage branch, fire-junction water/HP-cost branch into guard-post loot, and R&D hypo-blueprint branch into unstable-prototype combat, Medical checkpoint defence-turret/mechanical-quadruped/broken-medic chain, automated-guardians/gurneys/quiet-movement branch, gurneys friends/dispatch-bay chained-medic branch, guarded second-checkpoint mechanical-guard/medic/surgical route, guarded cold-storage mechanical-guard/medic chain, cold-storage cured-meat/security-drone/final-medic branch, surgical-tools direct-medic branch, surgical-tools explosives/final-medic branch, strategy-room secure-locker loot/noisy-medic/quadruped branch, frozen-robots dispatch-bay loot branch, and unstable-automaton checkpoint handoff, Martial armory sealed-door grenade-blast branch with weapon loot and turret combat through murderous-robot victory and Martial deck completion, right-corridor turret/quadruped/cabins/plasma-blueprint and silent-cabins branches, scrap/guard/quadruped/plasma-blueprint and wall-sensors branches, security-checkpoint dead-guards and empty-cells branches through quadruped combat plus murderous-robot victory and Martial deck completion, planning-room map-scavenging/noisy-guard and automated-sentry branches, and the automated-sentry route now connects through the training-complex handoff into murderous-robot combat, disruptor-blueprint loot, and Martial deck completion, Command Deck mechanical-guard/lounge/weapons-cache and medical-supplies routes both through immortal-wanderer victory, fleet-beacon loot, and cleared-deck cleanup, Martial Wing murderous robot, Engineering Wing unstable prototype, Medical Wing malformed experiment, and Medical Wing unstable automaton executioner slices, direct combat-boundary coverage for HP/armour formulas, precise/evasive hit formulas, enemy attack timing including fractional-second repeated scheduling, stun suppression/expiry/restore behavior, all original weapon costs/cooldowns/damage or stun effects, cured meat/medicine/hypo healing values and cooldowns, kinetic shield hit reflection and venom-DOT suppression, stim HP cost/cooldown/weapon acceleration with lifecycle restore, `atHealth` status triggers, venomous damage-over-time, scheduled shield/energised/enraged/meditation enemy specials, explosion-on-defeat combat, deterministic combat and non-combat scene loot rolls, focused `hp` and `water` scene-button costs, won-combat lifecycle restore, scene-loot lifecycle restore, restored lethal attack death one-shot behavior, Path capacity-limited loot taking, drop-and-take mechanics with a loot-row hover/focus drop menu, original world-fade death outcome with browser-level room-return coverage, original safe-return outfit handling and blueprint redemption on true combat exits, session-level return marker consumption, scene-continuation combat leave handling, and combat victory/loot/leave flow with post-victory cooldowns. This is not full setpiece scene traversal, exhaustive executioner scene parity, or full original World map parity.
- Phase 6 is finalized for the pragmatic combat/event-runtime scope as of 2026-07-08. Current catalog surface is 38 audited focused executioner keys and 49 audited focused setpiece keys, with broad runtime coverage, an organic World encounter/setpiece selection bridge, and session-level death/safe-return recovery markers. Exhaustive original branch parity for every remaining setpiece/battleship route would be closer to 15+ slices and is later-scope work.
- Latest finalization pass ran the full Phase 6 verification matrix: format, architecture, build, full Vitest, and full Playwright all passed; `.tmp` was absent.
- Latest setpiece audit locks the focused 49-key setpiece catalog in `event-data-coverage` and fixes the World city landmark bridge for the hospital old-man cache and medicine variants.
- Latest executioner audit locks the focused 38-key Ravaged Battleship catalog in `event-data-coverage` and defers exhaustive executioner scene parity outside pragmatic Phase 6 closure.
- Latest Path/World remediation adds a player-facing `A Dusty Path` location, outfitting rows, bag capacity/free-space display, perk display, embark, original-shaped World map/mask generation, generated landmark scene routing, player-facing World return, visible combat-safe-return recovery to Path, organic fresh-room-to-World-return browser coverage, and Path/World 1366/1920/2560/3840 visual baselines.
- Latest Phase 7 hardening adds original Path supply displayed-name ordering, original-derived outfit tooltip metadata, a shared safe-return outfit/stores helper, and normal World village-return coverage for the original safe-return filter.
- Latest Phase 7 continuation adds command-boundary rejection for non-carryable Path supplies and centralizes original armour, max-health, max-water, carryable, and safe-return helper logic for Path and World.
- Latest Phase 7 continuation adds the original compass-direction formula, Path compass-direction snapshots from stored ship direction or ship-relative coordinates, and successful Compass-purchase reveal messaging without duplicate Path-entry notifications.
- Latest Phase 7 continuation adds original-style Path outfit clamping against available stores before display/actions/embark, preserves carried supplies during active World expeditions, and aligns `+10`/`-10` enablement with original one-step control availability.
- Latest Phase 7 continuation wires the shared stores panel Compass tooltip to the same compass-direction source used by Path reveal messaging, including browser coverage for the Room stores row.
- Latest Phase 7 continuation adds bounded Path play-column scrolling for full original carryable lists and refreshes Path visual baselines at 1366, 1920, 2560, and 3840 widths.
- Latest Phase 7 continuation adds repeated-embark and all-food-consumed return regression coverage so Path stores/outfit state cannot duplicate carried supplies and cannot re-enter World without remaining Cured Meat.
- Latest Phase 7 continuation aligns Path outfit row rendering with the original carried-count-only value display and original-style single/many arrow controls, with browser and visual coverage across the Path outfitting surface.
- Latest Phase 7 finalization extends the organic fresh-room-to-Path browser scenario with original Compass reveal-message and store-tooltip assertions, then closes Phase 7 for Path/outfitting scope while leaving full World/ship/map semantics to Phase 8.
- Latest runtime continuation adds the organic World event bridge, including original terrain/distance encounter selection, original landmark scene-to-focused-setpiece routing, executioner first-visit vs antechamber routing, session/test-harness commands, and browser coverage for a World-selected encounter combat flow.
- Latest executioner continuation adds the original Engineering engine-room quiet branch, including defence-turret combat, alien-alloy salvage, destroyed-engine text, and R&D handoff.
- Latest executioner continuation adds the original Martial training-complex regenerative machine, including alien-alloy cost, max-health restoration, and murderous-robot handoff.
- Latest executioner continuation adds the original Medical checkpoint post-turret automated-guardians branch, including quiet-corridor branch selection and gurneys handoff.
- Latest executioner continuation adds the original Medical checkpoint gurneys-to-strategy-room branch, including secure-locker loot, noisy-medic combat, quiet-move option, and quadruped rejoin.
- Latest executioner continuation adds the original Medical checkpoint post-medic friends/frozen-robots branch before dispatch-bay loot.
- Latest runtime continuation adds chance-mapped `nextEvent` support, wires the Medical checkpoint handoff into guarded cold-storage, guarded surgical-tools, and slipped cold-storage focused slices, routes the antechamber Engineering elevator through the original-style assembly/engine-room/fire-junction entry map, and routes the antechamber Martial elevator through the original-style armory/right-corridor/scrap entry map.
- Latest browser executioner continuation covers the antechamber `command deck` `nextEvent` transition through the event panel, then resolves immortal-wanderer combat, fleet-beacon loot pickup, and Command Deck closeout in Playwright.
- Latest executioner continuation adds the original Engineering quiet assembly branch, including assembly-line loot, decrepit-machinery text, mechanical-guard combat, and R&D handoff.
- Latest Engineering R&D continuation adds the original alien-alloy healing machine, max-health restoration, workbench fork traversal, hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, and Engineering deck-cleared flag.
- Latest setpiece continuation adds the original City subway beast-rubble route, including lizard combat, beast combat, rubble loot, scavenged torch/cured-meat loot, and a focused subway-beast-rubble clear marker.
- Latest setpiece continuation adds the original City hospital tentacular-horror operating-theatre branch, including tentacles combat, victim-remains loot, and a focused clear marker.
- Latest setpiece continuation adds the original City old-tower thug rubble route, including city-thug combat, rubble loot, scavenged torch/cured-meat loot, and a focused clear marker.
- Latest setpiece continuation adds the original City drying-hut sack route, including street-side cured-meat loot, squatter combat, canvas-sack loot, and a focused clear marker.
- Latest setpiece continuation adds the original City shanty crowd sack route, including frail-man combat, crowd-surge squatters combat, canvas-sack loot, and a focused clear marker.
- Latest setpiece continuation adds the original City hospital old-man route into elderly-squatters combat and shared operating-theatres aftermath loot, including old-man combat, squatters combat, and a focused clear marker.
- Latest setpiece continuation adds the original City hospital old-man dried-meat route into shared operating-theatres aftermath loot, including old-man combat, dried-meat ward loot, and a focused clear marker.
- Latest setpiece continuation adds the original City commando supplies route, including soldier combat, masked-commando combat, body-supplies loot, and a focused clear marker.
- Latest setpiece continuation adds the original City military-camp supplies route, including sniper combat, veteran combat, body-supplies loot, and a focused clear marker.
- Latest Phase 6 continuation connects all focused Medical containment scenes into the malformed-experiment event. Guarded-surgical, cold-guard, surgical-explosives, surgical-medic, and cold-storage now hand off to malformed-experiment cleanup, with cold-storage and surgical-explosives runtime coverage proving stim-blueprint loot, Medical deck completion, cleanup text, and event exit.
- Latest Medical automaton continuation connects automated-guardians, gurneys/friends, strategy-room locker, and frozen-robots checkpoint scenes into the cold-storage route; frozen-robots now proves unstable-automaton glowstone-blueprint loot through cold-storage medic fights, malformed-experiment victory, stim-blueprint loot, Medical deck completion, cleanup text, and event exit.
- Latest Medical checkpoint continuation adds dispatch-bay weapon loot and unstable-automaton combat to the base checkpoint route, then hands off into the cold-storage route after glowstone-blueprint loot.
- Latest Engineering continuation connects assembly, assembly-loot, engine-room, and fire/guard-post R&D doorway scenes into the R&D/prototype event; the fire/guard-post route now proves guard-post loot, hypo-blueprint loot, unstable-prototype victory, kinetic-armour-blueprint loot, Engineering deck completion, cleanup text, and event exit.
- Latest roast-audit remediation added cross-runtime event effect capability checks, self-contained Event Runtime timer cleanup, organic fresh-run Marketing event E2E coverage, a pinned combat death guardrail test, and documented Phase 6 combat/runtime and Path/World layout constraints.
- Latest UI hardening keeps event dialogs inside the play column, groups stores income rows by source, caps tall Room action columns, improves disabled-control contrast, and adds hover/focus affordance for compact worker arrows.
- Remaining later integration: actual mine-clearing events and setpieces will create the original mine building states once World/Setpieces land; the Outside worker unlock side already responds to those building states.

## Next Phase Instructions

Proceed with Phase 8 World hardening from the finalized pragmatic Phase 6 combat/event-runtime boundary, finalized Phase 7 Path/outfitting scope, and the first player-facing World slice. Full World map parity, exhaustive setpiece scene parity, and exhaustive executioner scene parity remain open unless explicitly reopened.

Required post-Phase 6 order:

- Keep `CombatRuntime` as the combat boundary before adding broad encounter/setpiece/executioner coverage. `EventRuntime` should own scheduling, scene loading, modal lifecycle, non-combat buttons, scene-level rewards/effects, and non-combat scene loot lifecycle; the combat boundary should own combat state, actions, timers, combat loot, death, and outfit/return semantics.
- Preserve the existing representative `A Snarling Beast` slice as a regression fixture while expanding boundary behavior.
- Keep the World event bridge limited to original terrain/distance and landmark-scene inputs while Phase 8 expands the current World slice from original map/mask generation into roads, outposts, mines, Ship/Fabricator discovery consequences, and movement parity. Direct `triggerByKeyForTest` coverage remains allowed for data/runtime regression only, not as organic World parity.
- Do not add every encounter directly into `EventRuntime`; new encounter families need tests against the combat boundary rather than only event-panel trigger tests.
- Keep Path/World dependencies explicit. If a combat rule depends on carrying capacity, outfit return, map position, or World recovery state, model the contract deliberately instead of faking it with ad hoc state writes.
- Preserve browser smoke coverage for at least one World-selected Phase 6 flow; direct `triggerEventByKey` tests are not enough by themselves.

Phase 8 entry guardrails:

- Do not reopen Phase 6 unless a new regression breaks the finalized combat/event-runtime boundary.
- Do not reopen Phase 7 unless a new regression breaks the finalized Path/outfitting boundary.
- Preserve the organic fresh-room-to-Path-to-World-return browser smoke while hardening World.
- Treat the current original World map/mask/landmark foundation as the Phase 8 baseline, not as full World parity.
- Any new World behavior must be backed by original source/data references, an engine/session test, and at least one UI, smoke, or visual guard when the player-facing surface changes.
- See `REMAKE/docs/status/phase-7-path.md` and `REMAKE/docs/status/phase-8-world.md` for phase-specific status instead of growing this context file.

## Deferred Scope

The following are intentionally deferred until after gameplay/UI parity:

- music
- sound effects
- ambient audio
- mobile/touch support
- durable save versioning
- save migrations
- original save import
- active localization
- new content
- balance changes
- tutorialization

See `REMAKE/docs/deferred.md` for the locked deferred-scope contract.

## Ongoing Implementation Rules

- Keep default entry free of spike-only future systems and non-original debug UI.
- Keep `REMAKE/docs/parity-checklist.md` as behavior truth: data-only coverage does not make runtime parity complete.
- Preserve `REMAKE/docs/ui-spec.md` as the visual acceptance baseline.
- Update `REMAKE/docs/deviations.md` whenever parity is intentionally broken.
- Keep `TOOLS/extract_adr_canonical_manifests.ps1` able to regenerate `DATA/canonical-manifest.json`.
- Keep StateStore semantics aligned with original update paths and store clamping.
