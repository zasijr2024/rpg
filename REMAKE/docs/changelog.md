# Changelog

All notable remake implementation changes are recorded here.

## 2026-07-08

### Added - Phase 7 Roast Report Recommendations

- Added an active-expedition guard to World home return and regression coverage proving a second inactive return does not duplicate stores.
- Replaced the fixed first World landmark slice with original 61x61 map generation, original terrain stickiness/probabilities, original landmark counts/radii, original visibility mask behavior, and stored ship direction for Compass messaging.
- Added generated-artifact lint ignores, viewport-extreme Compass/Path/World smoke coverage, phase-specific status docs, stale Phase 7 heading cleanup, and an explicit Vite chunk-warning policy.

### Verified - Phase 7 Roast Report Recommendations

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run format:check`
- `npx playwright test`

### Finalized - Phase 7 Path and Outfitting

- Closed Phase 7 for the Path/outfitting scope after the organic Compass reveal guard, original supply/control rendering, carryable ordering/metadata, outfit normalization, upgrade priority, safe-return, repeated-embark, and full carryable-list overflow hardening were all covered.
- Updated project status docs so remaining full World arrival, map generation, ship placement, landmark distribution, and home-return world-state consequences are tracked under Phase 8 instead of Phase 7.

### Verified - Phase 7 Path and Outfitting

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run format:check`
- `npx playwright test`

### Added - Phase 7 Organic Compass Reveal Guard

- Extended the fresh-room-to-Path browser scenario to assert the original `the compass points ...` reveal message after buying the Compass through normal gameplay progression.
- Added an organic Compass store-tooltip guard that verifies the visible store row uses the same original direction message before entering Path.

### Verified - Phase 7 Organic Compass Reveal Guard

- `npx playwright test src/tests/e2e/app.spec.ts -g "plays organically from fresh room to Path" --project=chromium-1920`

### Added - Phase 7 Original Path Control Rendering

- Changed Path supply rows to match the original row value model by showing only the carried outfit count in the row while keeping available store count in the tooltip.
- Replaced Path supply text controls with original-style single/many arrow controls while preserving accessible `+1`, `-1`, `+10`, and `-10` button names.
- Added browser coverage that guards against regressing to `outfit/store` row text while keeping the `+10` control reachable.
- Regenerated and re-verified Path visual baselines at 1366, 1920, 2560, and 3840 widths after the intended control rendering change.

### Verified - Phase 7 Original Path Control Rendering

- `npm run build`
- `npx playwright test src/tests/e2e/app.spec.ts -g "full Path outfitting" --project=chromium-1920`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "path outfitting" --update-snapshots`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "path outfitting"`

### Added - Phase 7 Return and Re-Embark Hardening

- Added session regression coverage for repeated safe expeditions so remaining carried Cured Meat is reserved again on the next embark without duplicating stores.
- Added session regression coverage for the all-food-consumed return case, keeping Path visible but preventing re-embark when no Cured Meat remains.

### Verified - Phase 7 Return and Re-Embark Hardening

- `npm test -- src/tests/engine/game-session.test.ts`

### Added - Phase 7 Path Visual Overflow Hardening

- Added original-style bounded scrolling to the Path play column so a full original carryable outfitting list stays inside the 700px desktop play area without horizontal overflow.
- Added browser coverage for the full Path carryable list, verifying internal vertical scrolling, stable width, and no document-level horizontal overflow.
- Regenerated and re-verified Path visual baselines at 1366, 1920, 2560, and 3840 widths after the intended scroll-container change.

### Verified - Phase 7 Path Visual Overflow Hardening

- `npm run build`
- `npx playwright test src/tests/e2e/app.spec.ts -g "full Path outfitting" --project=chromium-1920`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "path outfitting" --update-snapshots`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "path outfitting"`

### Added - Phase 7 Compass Store Tooltip

- Added original-style Compass store-row tooltip text through the shared stores panel, using the same Path compass direction source as the reveal notification.
- Wired the Compass direction through Room, Outside, and Path stores views so the tooltip stays available wherever the shared stores panel is visible.
- Added browser coverage for the Compass store tooltip direction while preserving store grouping and hidden-upgrade behavior.

### Verified - Phase 7 Compass Store Tooltip

- `npm run build`
- `npx playwright test src/tests/e2e/app.spec.ts -g "groups stores" --project=chromium-1920`

### Added - Phase 7 Outfit Invariant and Control Hardening

- Added Path-side outfit normalization matching original outfitting behavior: carryable outfit counts are clamped to available stores before Path display/actions/embark, while active World expeditions are not clamped.
- Adjusted Path `+10`/`-10` control flags to match original behavior: the many-control is enabled whenever the matching one-step control can act, and the action itself clamps to the available amount.
- Added session regression coverage for overlarge/negative outfit normalization, active-World non-clamping, and many-control one-item edge cases.

### Verified - Phase 7 Outfit Invariant and Control Hardening

- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run build`

### Added - Phase 7 Compass Direction Hardening

- Added the original `World.compassDir` direction formula as `originalWorldCompassDirection` with coverage for axial and diagonal thresholds.
- Added state-driven Path compass direction snapshots from stored ship direction or ship-relative coordinates, with a safe `north` fallback until full Phase 8 ship placement exists.
- Changed successful Compass purchases through the session command boundary to reveal Path and emit `the compass points ...` immediately, while avoiding duplicate reveal notifications when the player later opens Path.

### Verified - Phase 7 Compass Direction Hardening

- `npm test -- src/tests/content/world-data.test.ts src/tests/engine/game-session.test.ts`
- `npm run build`

### Added - Phase 7 Path Upgrade and Reachability Hardening

- Added a Path command-boundary guard so only original carryable supplies can be moved into or out of `outfit`; non-carryable stores such as wood/fur cannot be injected through session commands.
- Centralized original Path armour label, max-health, max-water, carryable, and safe-return helpers so Path and World use the same upgrade priority logic.
- Added session regression coverage for all current capacity, water, and armour upgrade priority cases flowing from Path into World embark state.

### Verified - Phase 7 Path Upgrade and Reachability Hardening

- `npm test -- src/tests/engine/game-session.test.ts`
- `npm test -- src/tests/engine/game-session.test.ts src/tests/engine/combat-runtime.test.ts`
- `npm run build`

### Added - Phase 7 Path Outfitting Hardening

- Added a shared original Path outfit helper for carryable supply metadata, original name ordering, weapon damage/tool description tooltip data, and safe-return filtering.
- Updated the Path snapshot/UI to render supplies in original displayed-name order with original-derived weight, availability, damage, and tool description metadata.
- Changed normal World village return to use the same original safe-return outfit/stores rules already used by combat safe returns, preserving carryable equipment in `outfit` while restoring stores and leaving non-kept loot at home.
- Added session regression coverage for original Path supply order/metadata and safe World return outfit/store invariants.

### Verified - Phase 7 Path Outfitting Hardening

- `npm test -- src/tests/engine/game-session.test.ts src/tests/engine/combat-runtime.test.ts`

### Added - Post-Roast Path/World Player-Facing Remediation

- Implemented `A Dusty Path` as a real player-facing location unlocked by Compass ownership.
- Added Path snapshot/UI coverage for bag capacity, free space, armour, water capacity, carryable supplies, add/remove controls, perks, and embark gating.
- Added embark flow that transfers selected outfit from stores and opens an active World session.
- Added a minimal player-facing World runtime slice with original village position, bounded map coordinates, compact ASCII viewport, movement buttons, keyboard movement, food/water consumption, fixed initial landmark detection, encounter/setpiece bridge handoff, and village return to Path.
- Changed combat safe-return handling so `game.world.returnLocation = "path"` resolves to visible Path recovery instead of leaving only hidden pending state.
- Added Path and World UI components and restrained CSS matching the existing minimal interface.
- Added engine coverage for Compass-to-Path, outfitting, embark, World movement, supply consumption, and return.
- Added an organic Chromium browser smoke test from fresh room progression to Compass, Path, World movement, and return without direct resource injection.
- Added Path and World visual baselines at 1366x768, 1920x1080, 2560x1440, and 3840x2160.
- Tightened readiness docs so Phase 6 is described as a pragmatic runtime slice, while Phase 7/8 are marked as started but not parity-complete.
- Prepared the active docs for Phase 7 hardening by aligning README/status/spec/checklist language around the existing Path foundation, finalized pragmatic Phase 6 scope, and the rule that full World expansion waits behind Path parity.

### Verified - Post-Roast Path/World Player-Facing Remediation

- `npm run build`
- `npx vitest run src/tests/engine/game-session.test.ts src/tests/engine/event-runtime.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "plays organically from fresh room to Path" --project=chromium-1920`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run lint`
- `npm run format:check`

### Updated - Phase 6 Progress Log and Setpiece Coverage

- Finalized Phase 6 for the pragmatic Combat Event Runtime scope after the focused executioner and setpiece audits and full verification matrix passed on 2026-07-08.
- Audited `docs/changelog.md` against the current Phase 6 implementation state after several incremental prompts and filled in missing Phase 6 history.
- Re-evaluated Phase 6 finalization scope after the focused catalog reached 38 executioner keys and 49 setpiece keys: after the organic World selection bridge, browser smoke coverage, session-level World return recovery, focused executioner key-set audit, and focused setpiece key-set audit, pragmatic closure is down to final verification and documentation cleanup; exhaustive original branch parity would be 15+ slices.
- Added an explicit Phase 6 executioner key-set coverage assertion that locks the focused 38-key battleship catalog and makes exhaustive executioner scene parity an intentional later-scope decision instead of an ambiguous remaining Phase 6 gap.
- Added an explicit Phase 6 setpiece key-set coverage assertion that locks the focused 49-key catalog, and fixed the World city landmark bridge to route hospital old-man cache/medicine variants to the existing `setpiece.city-hospital-cache` and `setpiece.city-hospital-medicine` keys.
- Added non-combat scene loot lifecycle support to `EventRuntime`, including deterministic loot rolling, lifecycle snapshot/restore, Path capacity checks, take-one/take-everything actions, and drop-for-loot actions outside combat scenes.
- Added UI and command-boundary support for non-combat scene loot through the event panel without routing those actions through `CombatRuntime`.
- Added browser-level executioner hub coverage for the antechamber `command deck` handoff into Command Deck combat, fleet-beacon loot pickup, and final event closeout through the event panel.
- Expanded focused setpiece coverage with the original Friendly Outpost slice:
  - original `An Outpost` title, text, and notification
  - water-replenishment effect marker and notification
  - cured-meat scene loot
  - headless EventRuntime traversal coverage
- Added the original `A Huge Borehole` setpiece slice with original text, visit marker, guaranteed alien-alloy scene loot, and headless EventRuntime traversal coverage.
- Added the original `A Forgotten Battlefield` setpiece slice with original text, visit marker, salvage scene loot, and headless EventRuntime traversal coverage.
- Added the original `A Crashed Ship` setpiece slice with original text, salvage button, and ship discovery world-state markers.
- Added the original `A Destroyed Village` cache setpiece traversal with original text, notification, underground/take/exit scenes, an explicit collection marker, original prestige-store transfer, and previous-store clearing.
- Expanded focused Old House setpiece coverage from only the squatter combat branch to all three original entry outcomes:
  - `medicine` branch with original medicine cache loot
  - `supplies` branch with water replenishment and cured meat/leather/cloth loot
  - `occupied` squatter combat branch
- Added focused Swamp setpiece traversal for the charm-gated wanderer scene and `gastronome` perk effect.
- Added focused Cave setpiece traversal through beast and cave-lizard combat scenes.
- Expanded focused Cave setpiece coverage with the original torch-gated camp branch, camp loot table, giant-lizard combat, back-cave supply-cache loot table, and a focused cave camp/cache clear marker.
- Expanded focused Cave setpiece coverage with the original wanderer-body branch, large-beast combat, animal-nest loot table, and a focused cave wanderer/nest clear marker.
- Expanded focused Cave setpiece coverage with the original narrow-passage old-case route, small-beast loot variant, giant-lizard combat, old-case loot table, and a focused cave old-case clear marker.
- Added focused Town and City setpiece traversal through thug and sniper combat scenes.
- Expanded focused Town setpiece coverage with the original torch-gated clinic branch and medicine cache loot.
- Expanded focused Town setpiece coverage with the original clinic madman branch, madman combat loot table, ransacked clinic ending, and a focused clinic-madman clear marker.
- Expanded focused Town setpiece coverage with the original torch-gated schoolhouse branch, rusting-locker loot, thug/scavenger combat chain, scavenger-camp loot table, and a focused schoolhouse clear marker.
- Expanded focused Town setpiece coverage with the original park/vigilante route, beast and vigilante combat, wanderer-rifle loot table, and a focused park-vigilante clear marker.
- Expanded focused Town setpiece coverage with the original caravan/vigilante route, overturned-caravan loot, hidden food-basket loot, trinket loot table, and a focused caravan-vigilante clear marker.
- Expanded focused City setpiece coverage with the original torch-gated hospital branch, operating-theatre scene, stockpile loot table, and city-cleared markers.
- Expanded focused City hospital coverage with the original old-man scalpel combat branch, dried-meat ward loot, medicine-cabinet loot, and a focused medicine-cabinet clear marker.
- Expanded focused City hospital coverage with the original old-man small-cache branch, including alien-alloy/medicine/cured-meat/bolas/fur loot and a focused hospital-cache clear marker.
- Expanded focused City hospital coverage with the original old-man dried-meat branch into the shared operating-theatres aftermath loot and a focused old-man-theatres clear marker.
- Expanded focused City hospital coverage with the original old-man branch into elderly-squatters combat, shared operating-theatres aftermath loot, and a focused old-man-squatters clear marker.
- Expanded focused City setpiece coverage with the original soldier-patrol route, chained soldier combats, intermediate voices scene, supplies loot table, and a focused soldier-patrol clear marker.
- Expanded focused City setpiece coverage with the original subway route, lizard and rat-swarm combats, torch-gated platform investigation, battle-platform supplies loot table, and a focused subway clear marker.
- Expanded focused City setpiece coverage with the original subway scavenged route, lizard and rat-swarm combats, torch-gated platform investigation, scavenged torch/cured-meat loot table, and a focused subway-scavenged clear marker.
- Expanded focused City setpiece coverage with the original subway beast-rubble route, lizard and beast combats, rubble loot table, scavenged torch/cured-meat loot table, and a focused subway-beast-rubble clear marker.
- Expanded focused City setpiece coverage with the original military-camp route, sniper and veteran combats, camp scene, military outpost supplies loot table, and a focused military-camp clear marker.
- Expanded focused City setpiece coverage with the original military-camp supplies route, sniper and veteran combats, body-supplies loot table, and a focused military-camp-supplies clear marker.
- Expanded focused City setpiece coverage with the original shanty-market route, frail-man and youth combats, improvised-shop loot table, canvas-sack loot table, and a focused shanty-market clear marker.
- Expanded focused City setpiece coverage with the original shanty crowd route, frail-man combat, crowd-surge squatters combat, abandoned-belongings loot table, and a focused shanty-crowd clear marker.
- Expanded focused City setpiece coverage with the original shanty crowd sack route, frail-man combat, crowd-surge squatters combat, canvas-sack loot table, and a focused shanty-crowd-sack clear marker.
- Expanded focused City setpiece coverage with the original shanty crowd youth route, frail-man combat, crowd text, youth combat, canvas-sack loot table, and a focused shanty-crowd-youth clear marker.
- Expanded focused City setpiece coverage with the original drying-hut route, street-side cured-meat loot, squatter combat, hut cache loot table, and a focused drying-hut clear marker.
- Expanded focused City setpiece coverage with the original drying-hut sack route, street-side cured-meat loot, squatter combat, canvas-sack loot table, and a focused drying-hut-sack clear marker.
- Expanded focused City setpiece coverage with the original drying-meat youth route, street-side cured-meat loot, youth combat, canvas-sack loot table, and a focused drying-meat-youth clear marker.
- Expanded focused City hospital coverage with the original ward route, lizard-pack combat, operating-theatre aftermath loot table, and a focused hospital-ward clear marker.
- Expanded focused City hospital coverage with the original elderly-squatters ward branch, squatters combat, operating-theatres aftermath loot table, and a focused hospital-squatters clear marker.
- Expanded focused City hospital coverage with the original deformed operating-theatre branch, warped-man equipment loot table, and a focused hospital-deformed clear marker.
- Expanded focused City hospital coverage with the original tentacular-horror operating-theatre branch, tentacles combat, victim-remains loot table, and a focused hospital-tentacles clear marker.
- Expanded focused City setpiece coverage with the original old-tower route, city thug combat, rooftop bird combat, nest loot table, and a focused old-tower clear marker.
- Expanded focused City setpiece coverage with the original old-tower scavenged route, city thug combat, rooftop bird combat, scavenged torch/cured-meat loot table, and a focused old-tower-scavenged clear marker.
- Expanded focused City setpiece coverage with the original old-tower thug rubble route, city thug combat, rubble loot table, scavenged torch/cured-meat loot table, and a focused old-tower-thug-rubble clear marker.
- Expanded focused City setpiece coverage with the original old-tower rubble route, beast-behind-car combat, rubble loot table, scavenged-ending loot table, and a focused old-tower rubble clear marker.
- Expanded focused City setpiece coverage with the original commando-settlement route, masked commando combat, burning-settlement loot table, and a focused commando-settlement clear marker.
- Expanded focused City setpiece coverage with the original commando supplies route, soldier and masked-commando combats, body-supplies loot table, and a focused commando-supplies clear marker.
- Added focused executioner intro traversal through ancient-beast and automated-turret combat.
- Expanded focused executioner intro coverage with the original webbed-corridor branch, knapsack scene loot, chitinous-horror combat, and chitinous-queen combat.
- Expanded focused executioner intro coverage with the original operative ambush, military-camp loot table, researcher combat, and continuation into the shared maintenance/turret/device ending.
- Expanded focused executioner intro coverage with the original barricade weapons loot, wanderer-remains loot, and continuation through ancient-beast combat into the shared maintenance/turret/device ending.
- Added original executioner antechamber hub coverage with `nextEvent` runtime transitions into the focused Engineering, Medical, Martial, and Command Deck slices.
- Expanded the executioner antechamber Engineering elevator handoff from a single hardwired assembly slice into the original-style chance-mapped assembly, engine-room, and fire-junction starting branches.
- Expanded the executioner antechamber Martial elevator handoff from a single hardwired robot slice into the original-style chance-mapped armory, right-corridor, and scrap starting branches.
- Added an organic World event bridge that selects encounter events by original terrain/distance bands, resolves original landmark scene names into focused setpiece/executioner events, exposes the bridge through the session/test harness, and covers a World-selected encounter in Playwright.
- Added session-level World return recovery that consumes combat `returnLocation` markers, records the last room/path return target, keeps death recovery in the room, and records safe-victory return targets. The later Path/World remediation now consumes those targets into visible Path recovery.
- Expanded focused Command Deck executioner coverage with the original bridge approach, mechanical-guard checkpoint, officer's lounge, weapons-cache loot, and handoff into the immortal-wanderer fight.
- Expanded focused Command Deck executioner coverage with the original officer's lounge discarded medical-supplies branch and handoff into the immortal-wanderer fight.
- Expanded focused Engineering Wing executioner coverage with the original assembly-line energy-cell/laser-rifle loot before the unruly-welder/mechanical-guard chain.
- Expanded focused Engineering Wing executioner coverage with the original quiet assembly-room branch, assembly-line energy-cell/laser-rifle loot, decrepit-machinery text, mechanical-guard combat, and R&D handoff.
- Expanded focused Engineering Wing executioner coverage with the original defence-turret engine-room branch, alien-alloy salvage, and mechanical-guard continuation.
- Expanded focused Engineering Wing executioner coverage with the original defence-turret engine-room quiet continuation, alien-alloy salvage, destroyed-engine text, and R&D handoff.
- Expanded focused Engineering Wing executioner coverage with the original fire-junction choice, water extinguish cost, rush-through HP cost, robot-hangar alternate, guard combat, and ransacked guard-post loot.
- Expanded focused Engineering Wing executioner coverage with the original R&D continuation, defence-turret/workbench fork, hypo-blueprint plans loot, and handoff into unstable-prototype combat.
- Expanded focused Engineering Wing R&D coverage with the original alien-alloy healing machine, max-health restoration, workbench fork, hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, and Engineering deck-cleared flag.
- Hardened focused Engineering Wing R&D doorway coverage by connecting assembly, assembly-loot, engine-room, and fire/guard-post approach routes into the R&D/prototype event, with fire/guard-post runtime coverage through hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, Engineering deck-cleared flag, and cleanup text.
- Added original-style special event cost handling for focused `hp` and `water` scene buttons while preserving normal store-cost behavior.
- Added focused executioner Engineering Assembly traversal through unruly-welder and mechanical-guard combat.
- Added focused executioner Medical Checkpoint traversal through defence-turret, mechanical-quadruped, and broken-medic combat.
- Hardened focused Medical Checkpoint coverage with dispatch-bay weapon loot, unstable-automaton explosion combat, glowstone-blueprint loot, and cold-storage handoff.
- Expanded focused Medical Checkpoint coverage with the original post-turret automated-guardians branch into the gurneys corridor.
- Expanded focused Medical Checkpoint coverage with the original gurneys-to-strategy-room branch, secure-locker loot, noisy-medic combat, quiet-move option, and quadruped rejoin.
- Expanded focused Medical Checkpoint coverage with the original post-medic friends/frozen-robots branch before dispatch-bay loot.
- Added chance-mapped `nextEvent` support to `EventRuntime` and wired the Medical checkpoint handoff into the existing guarded cold-storage, guarded surgical-tools, and slipped cold-storage focused slices.
- Expanded focused Martial Wing executioner coverage with the original right-corridor route through turret and quadruped combat, cabin loot, barricade text, and plasma-rifle blueprint documents.
- Expanded focused Martial Wing executioner coverage with the original ruined-defence-turret scrap route, alien-alloy salvage, mechanical-guard and quadruped combat chain, barricade text, and plasma-rifle blueprint documents.
- Expanded focused Martial Wing executioner coverage with the original security-checkpoint route, dead-guards weapon loot, quadruped combat, and training-complex handoff.
- Expanded focused Martial Wing executioner coverage with the original planning-room map-scavenging route, three `applyMap` effects, noisy guard combat, and second guard combat into the training-complex handoff.
- Expanded focused Martial Wing executioner coverage with the original training-complex handoff into murderous-robot combat, disruptor blueprint loot, and Martial deck completion flag.
- Expanded focused Martial Wing training-complex coverage with the original alien-alloy regenerative machine, max-health restoration, and murderous-robot handoff.
- Expanded focused Medical Wing executioner coverage with the original second-checkpoint unnoticed-passage route, cold-storage cured-meat loot, security-drone avoidance text, final medic combat, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original guarded cold-storage route through two mechanical-guard combats, chained medic combats, cold-storage cured-meat loot, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original guarded second-checkpoint route through mechanical-guard combat, medic combat, surgical-tools text, completed-explosives grenade loot, final medic combat, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original gurneys branch where the first broken medic has friends, including chained medic combat, hypo use, dispatch-bay weapon loot, and unstable-automaton handoff.
- Expanded focused Medical Wing executioner coverage with the original automated-guardians avoidance branch, gurneys continuation, strategy-room quiet-movement route, quadruped combat, and unstable-automaton handoff.
- Expanded focused Medical Wing executioner coverage with the original surgical-tools direct-medic branch, chained medic combats, hypo use, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original surgical-tools route, completed-explosives grenade loot, final medic combat, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original strategy-room secure-locker branch, energy-cell/hypo loot, noise-drawn medic combat, quadruped combat, and unstable-automaton handoff.
- Expanded focused Medical Wing executioner coverage with the original frozen medical-robots branch, dispatch-bay weapon loot, unstable-automaton explosion combat, glowstone blueprint loot, and checkpoint handoff.
- Hardened focused Medical Wing automaton checkpoint coverage by connecting automated-guardians, gurneys/friends, strategy-room locker, and frozen-robots checkpoint scenes into the cold-storage route, with frozen-robots runtime coverage through cold-storage medic fights, malformed-experiment victory, stim-blueprint loot, Medical deck-cleared flag, and cleanup text.
- Expanded focused Martial Wing executioner coverage with the original sealed-door grenade blast route, weapon-rack loot, defence-turret combat, sealed-door continuation, plasma-rifle blueprint documents, and training-complex handoff.
- Expanded focused Martial Wing executioner coverage with the original security-checkpoint empty-containment-cells route through sparking power-cable text, quadruped combat, and training-complex handoff.
- Expanded focused Martial Wing executioner coverage with the original scrap-route wall-sensors avoidance branch into quadruped combat, barricade text, and plasma-rifle blueprint documents.
- Expanded focused Martial Wing executioner coverage with the original right-corridor silent-cabins branch, cabin loot, barricade text, and plasma-rifle blueprint documents.
- Hardened focused Medical Wing containment coverage by connecting guarded-surgical and cold-storage containment scenes into the malformed-experiment event, stim-blueprint combat loot, Medical deck-cleared flag, and cleanup text.
- Hardened the remaining focused Medical Wing containment coverage by connecting cold-guard, surgical-explosives, and surgical-medic containment scenes into the malformed-experiment event, with surgical-explosives runtime coverage through stim-blueprint loot, Medical deck-cleared flag, and cleanup text.
- Hardened focused Martial Wing planning-room coverage with the original automated-sentry avoidance branch into the second mechanical-guard combat and training-complex handoff.
- Hardened focused Martial Wing planning-room coverage by connecting the automated-sentry route into the murderous-robot event, disruptor-blueprint combat loot, Martial deck-cleared flag, and cleanup text.
- Hardened focused Martial Wing security empty-cells coverage by connecting the quadruped route into the murderous-robot event, disruptor-blueprint combat loot, Martial deck-cleared flag, and cleanup text.
- Hardened focused Martial Wing security dead-guards coverage by connecting the quadruped route into the murderous-robot event, disruptor-blueprint combat loot, Martial deck-cleared flag, and cleanup text.
- Hardened focused Martial Wing armory coverage by connecting the sealed-door route into the murderous-robot event, disruptor-blueprint combat loot, Martial deck-cleared flag, and cleanup text.
- Hardened focused Command Deck executioner coverage by driving the lounge weapons-cache route through the full immortal-wanderer victory, fleet-beacon loot, and cleared-deck cleanup text.
- Hardened focused Command Deck executioner coverage by driving the lounge medical-supplies route through the full immortal-wanderer victory, fleet-beacon loot, and cleared-deck cleanup text.
- Updated `docs/context.md`, `docs/plan.md`, and `docs/parity-checklist.md` to reflect Outpost, Swamp, Old House, Cave, Town, City, Mines, and focused executioner slices before the later finalization pass.

### Verified - Phase 6 Progress Log and Setpiece Coverage

- `npm test -- --run src/tests/content/event-data-coverage.test.ts`
- `npm test -- --run src/tests/engine/event-runtime.test.ts`
- `npm run format:check`
- `npm run check:architecture`
- `npm run build`
- `npm test`
- `npx playwright test src/tests/e2e/app.spec.ts -g "combat" --project=chromium-1366`

## 2026-07-07

### Started - Phase 6 Combat Runtime Boundary

- Extracted representative combat handling from `EventRuntime` into `CombatRuntime`.
- Kept `EventRuntime` responsible for event scheduling, scene loading, modal lifecycle, and non-combat buttons while `CombatRuntime` owns combat state, actions, enemy attack timers, loot, current death effects, and lifecycle snapshots.
- Preserved the existing `A Snarling Beast` event integration as a regression fixture.
- Added direct `CombatRuntime` tests for start/snapshot behavior, attack/cooldown/victory loot, player death callback, and lifecycle restore timing.
- Replaced the placeholder losing-path notification with the original world-death outcome: `the world fades`, outfit state is cleared, death state is marked, and a room-return outcome is exposed for later Path/World runtime wiring.
- Added original Path capacity enforcement to combat loot taking, including the `take all you can` partial-loot path when the current outfit is near capacity.
- Added targeted combat drop-and-take actions so blocked loot can be taken by dropping enough carried outfit weight, preserving the original mechanical behavior behind a flat UI control.
- Moved combat drop-and-take presentation into a loot-row hover/focus menu so blocked loot exposes original-style drop choices without cluttering the primary combat buttons.
- Added original safe-return outfit handling to the combat leave path, returning carried outfit items to stores and leaving non-travel loot at home while preserving travel supplies and weapons in the selected outfit.
- Added original blueprint redemption to the combat safe-return path, converting carried executioner blueprint loot into `character.blueprints` unlock flags before outfit return.
- Split combat victory leave semantics so scene-continuation combat buttons advance through `EventRuntime` without prematurely returning outfit to stores, while true combat exits still use the original safe-return path.
- Added original healing cooldowns for cured meat, medicine, and hypo actions.
- Added late-game combat action coverage for kinetic armour `shield` and carried `stim` boost controls, including cooldowns, shield break-on-hit behavior, stim HP cost, and boosted weapon cooldown timing.
- Added the original one-second post-victory cooldown for combat loot-taking and leave actions.
- Added combat-boundary support for original `atHealth` status triggers and the executioner-style `venomous` damage-over-time effect, including lifecycle snapshot/restore coverage for the owned venom timer.
- Added combat-boundary support for scheduled executioner-style enemy specials, including shield, energised, enraged, and meditation status effects plus lifecycle snapshot/restore for special timers.
- Added combat-boundary support for original delayed explosion-on-defeat combat, including blast death handling, shield interaction, and lifecycle snapshot/restore for pending explosions.
- Added a focused executioner combat catalog for the combat boundary, covering reusable mechanical enemies and representative scene-local combat definitions with status specials, explosion, and blueprint loot while keeping full executioner event scenes out of Phase 6 completion.
- Added a focused executioner event slice for the Command Deck immortal wanderer, routing avoid-repeat rotating shield/enraged/meditation specials through `EventRuntime` and preserving the original post-fight fleet beacon loot surface.
- Added a focused executioner event slice for the Martial Wing murderous robot, routing scheduled energised-special combat through `EventRuntime` and applying the original martial-cleared world-state flag after victory.
- Added a focused executioner event slice for the Engineering Wing unstable prototype, routing scheduled shield-special combat through `EventRuntime` and applying the original engineering-cleared world-state flag after victory.
- Added a focused executioner event slice for the Medical Wing malformed experiment, routing scheduled enraged-special combat through `EventRuntime` and applying the original medical-cleared world-state flag after victory.
- Added a focused executioner event slice for the Medical Wing unstable automaton, routing explosion-on-defeat combat through `EventRuntime` and redeeming glowstone blueprint loot on combat leave.
- Added a focused setpiece combat catalog for the combat boundary, covering cave, town, city, and mine-clearing enemy definitions while keeping full setpiece scene traversal out of Phase 6 completion.
- Added a focused Iron Mine setpiece traversal slice, routing the original beastly matriarch fight through `CombatRuntime` and applying the cleared mine world-state flag after combat victory.
- Added a focused Coal Mine setpiece traversal slice, covering chained man/man/chief combats through `CombatRuntime` and applying the cleared coal mine world-state flag without triggering safe-return outfit handling between combat scenes.
- Added a focused Sulphur Mine setpiece traversal slice, covering chained soldier/soldier/veteran combats through `CombatRuntime` and applying the cleared sulphur mine world-state flag without triggering safe-return outfit handling between combat scenes.
- Ported all 11 original wilderness encounter definitions from `ORIGINAL/script/events/encounters.js` through the event data layer, including enemy stats, ranged flags, notifications, and loot tables. Encounter availability was initially hard-gated until World-owned distance and terrain routing existed; the later World bridge now covers the first player-facing route.

### Verified - Phase 6 Combat Runtime Boundary

- `npm test -- --run src/tests/engine/combat-runtime.test.ts src/tests/engine/event-runtime.test.ts`
- `npm test -- --run src/tests/content/event-data-coverage.test.ts src/tests/engine/event-runtime.test.ts src/tests/engine/combat-runtime.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "combat" --project=chromium-1366`

### Completed - Phase 5 Event Runtime

- Finalized Phase 5 for the original non-combat Global, Room, Outside, and Marketing event pools.
- Confirmed the remaining canonical event families, including encounters, setpieces, and executioner events, belong to later phases rather than the Phase 5 completion boundary.
- Kept the representative `A Snarling Beast` combat slice as the Phase 5 loot/combat foundation for Phase 6 expansion.

### Added - Phase 5 Event Content Expansion Slice

- Expanded original Event Runtime content from 5 representative definitions to 19 definitions, covering all Phase 5 non-combat Global, Room, Outside, and Marketing event pool definitions plus the representative combat encounter.
- Added original Room event slices for:
  - `The Nomad`
  - `Noises` outside
  - `Noises` inside
  - `The Shady Builder`
  - `The Mysterious Wanderer` fur variant
  - `The Scout`
  - `The Master`
  - `The Sick Man`
- Added original Outside event slices for:
  - `A Ruined Trap`
  - `Fire`
  - `Plague`
  - `A Beast Attack`
  - `A Military Raid`
- Added the original `Penrose` marketing event slice, including Marketing pool scheduling, the one-shot `marketing.penrose` flag, and link metadata for the external button.
- Added runtime support for original-style non-ending merchant buttons, button availability checks, and button `onChoose` handlers.
- Added a Scout `World.applyMap` effect bridge so Phase 5 validates event costs, notifications, and button behavior while the full map reveal algorithm remains owned by the World runtime capability boundary.
- Added event side-effect bridge support for Outside hut destruction so events reuse `OutsideRuntime` village/death behavior.
- Added a test-only config gate for passive random event scheduling so deterministic long-progression specs can opt out without disabling manual event triggers.
- Reviewed original event attention behavior and documented the intentional focused-modal replacement for browser title blinking in `REMAKE/docs/deviations.md#dev-008-focused-event-modal-instead-of-browser-title-blink`.

### Hardened - Latest Roast Audit Remediation

- Changed the Scout `buy map` event bridge from silent optional no-op behavior to an explicit `canApplyMap` capability gate, hiding the button and preventing resource spend until the full World map reveal handler is wired.
- Made `EventRuntime.restoreLifecycle()` clear its own scheduled event, enemy attack, and delayed-action timers before applying restored state.
- Added unit coverage for unwired Scout map behavior, lifecycle timer cleanup, and the current representative combat death path.
- Added a fresh-run browser scenario that reaches the original `Penrose` Marketing event through passive scheduling without forced event triggering or injected stores.
- Documented Phase 6 combat boundary constraints, death/outfit-return sequencing, and Path/World layout contracts in the technical and UI specs.

### Verified - Phase 5 Event Content Expansion Slice

- `npm run format:check`
- `npm run lint`
- `npx prettier --write src/content/original/events/eventData.ts src/engine/events/EventRuntime.ts src/ui/EventPanel.tsx src/tests/engine/event-runtime.test.ts src/tests/content/event-data-coverage.test.ts`
- `npm test -- src/tests/engine/event-runtime.test.ts src/tests/content/event-data-coverage.test.ts`
- `npm test`
- `npm run check:architecture`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 5 Combat Runtime Slice

- Expanded the production Event Runtime from combat-shaped snapshots to a playable representative combat slice using the original `A Snarling Beast` encounter.
- Added original-derived combat handling for player/max HP, armour HP bonuses, hit chance, enemy attack timing, weapon costs, weapon cooldowns, weapon damage, stun, healing items, deterministic loot rolls, victory state, loot taking, and leave flow.
- Routed combat actions through the `GameSession` command boundary and rendered compact combat HP/loot/action controls inside the existing event modal.
- Preserved Event Runtime lifecycle snapshots for active combat state and enemy attack timing.

### Verified - Phase 5 Combat Runtime Slice

- `npm run lint`
- `npm run format:check`
- `npm test`
- `npm test -- src/tests/engine/event-runtime.test.ts`
- `npm run build`
- `npm run test:e2e -- src/tests/e2e/app.spec.ts`
- `npm run test:e2e`

### Changed - Debug Settings Opt-In

- Changed the non-original debug `settings` tab from default-visible tooling to explicit opt-in tooling behind `?debug=1`.
- Kept debug toggles default-off after opt-in.
- Kept `?testHarness=1` clean by default so deterministic visual baselines no longer need `debug=0`.
- Updated E2E coverage so normal `/` and `?debug=0` stay free of debug UI, while `?debug=1` exposes dev save/load and multipliers.

### Verified - Debug Settings Opt-In

- `npm run format`
- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm test`
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts`
- `npm run test:e2e`

### Changed - Final UI Hardening Before Next Phase

- Anchored Event Runtime dialogs to the active play column so events no longer overlap the stores column on desktop.
- Capped tall Room build/craft/buy action columns with compact internal scrolling.
- Grouped stores income rows by source and compacted income cadence text to reduce duplicate worker rows in the stores panel.
- Strengthened disabled button contrast while keeping inactive controls visibly unavailable.
- Added worker-control hover/focus affordance without expanding the original-near compact arrow layout.
- Switched Room visual parity baselines to a clean debug-free entry while preserving debug tooling for manual parity work.

### Verified - Final UI Hardening Before Next Phase

- `npm run format`
- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm test`
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run test:e2e`

### Added - Latest Audit Remediation

- Promoted dev save/load from state-only storage to a session lifecycle snapshot:
  - engine state
  - manual clock time
  - active cooldowns
  - notifications
  - Room timers
  - Outside timers
  - active/pending Event Runtime state
- Added resume-regression coverage for builder progression, population growth, active event state, and delayed event actions.
- Added a clean parity entry check for the then-default-visible debug tooling; this was superseded later the same day by the `?debug=1` opt-in change.
- Removed pre-discovery `outside` and `wood` rows from debug info until those concepts are visible in the run.
- Expanded Event Runtime coverage with original-sourced slices for:
  - `The Thief` global event with `onLoad` side effects
  - `Sickness` outside event with villager death side effect hook
  - `The Mysterious Wanderer` delayed reward action
  - `A Snarling Beast` combat-shaped encounter snapshot
- Added manifest-aware event coverage tests so partial event coverage remains explicit.
- Made the event panel a modal dialog with initial focus and keyboard focus containment.
- Added browser zoom/long event text overflow coverage.
- Enlarged worker-control hit boxes while keeping compact arrow styling.
- Added executable lint/format scripts and TypeScript-aware ESLint config.
- Removed unused `zustand`.

### Verified - Latest Audit Remediation

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`

### Added - Current Game Audit Remediation

- Wired browser dev save/load/clear through `LocalStorageDevSaveAdapter` under `adr-remake-dev-save`.
- Initially enabled the non-original debug settings tab by default during parity work; this was superseded later the same day by the `?debug=1` opt-in change.
- Added dev save/load e2e coverage with page reload persistence.
- Moved Room and Outside UI actions behind `GameSession` command methods instead of passing runtime classes into React views.
- Added the first production Event Runtime vertical slice using the original `The Beggar` Room event:
  - event scheduling range
  - availability check
  - scene text and notification
  - button costs
  - deterministic chance scene branching
  - scene rewards
  - leave/end flow
- Added sparse event panel UI and event runtime unit/e2e coverage.
- Added a natural Phase 4 browser progression test from fresh start through hut/lodge/population/worker assignment without direct state injection.
- Added Phase 4 Outside worker visual baselines across the desktop viewport matrix.
- Added an architecture-boundary test preventing UI components from importing mutable runtime classes directly.
- Updated status/checklist/deviation docs to distinguish data-only coverage, partial event runtime coverage, and parity-work debug tooling.

### Verified - Current Game Audit Remediation

- `npm run build`
- `npx vitest run src/tests/engine/event-runtime.test.ts src/tests/engine/game-engine.test.ts src/tests/architecture-boundaries.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`

### Fixed - Cooldown and Worker Control Layout

- Fixed action buttons so cooldown text is absolutely positioned inside a fixed-size button instead of changing button dimensions or wrapping labels.
- Widened Outside action buttons so labels and cooldown seconds stay readable together.
- Matched cooldown text styling to the disabled button text instead of rendering it darker.
- Added E2E regression coverage that verifies Outside action button size and neighboring button position stay stable during cooldown.
- Increased worker-control hit area height, separated up/down arrow placement, and removed disabled arrows' inner cutout so zero-worker jobs no longer show an extra triangle artifact.
- Refreshed affected firelit visual baselines.

### Verified - Cooldown and Worker Control Layout

- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npm run build`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm test`
- `npm run test:e2e`

## 2026-07-06

### Changed - Original-Near UI Layout Polish

- Moved the shell closer to the original `A Dark Room` layout:
  - 920px wrapper with 220px left notification reserve and 700px location area
  - Times-style serif typography instead of monospace
  - header tabs as original text links with separators
  - Room actions in compact build/craft/buy columns instead of wide cards
  - Outside village/stores/workers positioned like original panels
  - worker +/- controls rendered as compact arrow buttons
- Refreshed visual regression baselines for the original-near layout.

### Verified - Original-Near UI Layout Polish

- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npm test -- src/tests/engine/outside-runtime.test.ts src/tests/engine/room-runtime.test.ts`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run build`
- `npm test`
- `npm run test:e2e`

### Added - Phase 4 Outside and Village Runtime

- Implemented original Outside trap checking with 90s cooldown, baited drop count, bait consumption, trap drop table rolls, and original notification phrasing.
- Added original population scheduling from hut capacity, including arrival counts, village title changes, and population notifications.
- Added building/mine-dependent worker unlocks, worker assignment controls, gatherer accounting, and worker income collection with original consumption blocking.
- Added original hut destruction and villager death side effects, including worker reassignment trimming and returned victim counts for future event hooks.
- Expanded the Outside UI with `check traps`, village/forest legend switching, population display, and worker rows with +/- and +/-10 controls.
- Added deterministic Phase 4 engine tests for trap drops, population growth, worker assignment, worker income, debug income multiplier behavior, hut destruction, and villager deaths.
- Added E2E coverage for the Phase 4 Outside UI and refreshed Outside visual baselines for the now-visible trap control.

### Verified - Phase 4 Outside and Village Runtime

- `npm test -- src/tests/engine/outside-runtime.test.ts src/tests/content/outside-data.test.ts`
- `npm test -- src/tests/engine/outside-runtime.test.ts`
- `npm run build`
- `npm test`
- `npx playwright test src/tests/e2e/room-visual.spec.ts:62 --update-snapshots`
- `npm run test:e2e`

### Added - Debug Settings Tab

- Added a visible `settings` tab with default-off debug toggles:
  - `speed x 10`
  - `income x 10`
- Wired `speed x 10` into the realtime clock driver so cooldowns and scheduled timers advance faster automatically while enabled.
- Wired `income x 10` into passive Room builder income and income row display while leaving manual gather actions unchanged.
- Added compact debug info for current game time, active location, multipliers, Room state, Outside unlock state, and wood.
- Documented the tab as an intentional non-original debug/testing deviation.
- Updated full-shell visual baselines for the additional tab.

### Verified - Debug Settings Tab

- `npx vitest run src/tests/engine/clock.test.ts src/tests/engine/room-runtime.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm test`
- `npm run build`
- `npm run test:e2e`

### Changed - Phase 3 UI Parity Polish

- Removed redundant visible Room/Outside headings below the location tabs.
- Anchored the app shell at the top so tab switches no longer vertically recenter the page.
- Reused the Room stores panel on Outside so wood and other visible stores remain inspectable after switching locations, matching the original moving `storesContainer` behavior.
- Added a minimal Outside forest status panel for built traps, while leaving trap checking, population growth, workers, and full village controls to Phase 4.
- Changed notification rendering to newest-first with a bounded faded log area instead of unbounded downward growth.
- Expanded E2E coverage for stable tab switching, Outside store visibility, and trap/forest display.
- Updated visual baselines for the heading removal, top anchoring, bounded notification log, Outside stores, and trap forest state.

### Verified - Phase 3 UI Parity Polish

- `npm test`
- `npm run build`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run test:e2e`

### Completed - Phase 3 Completion Audit Remediation

- Added `GameSession` as the engine-side runtime boundary for:
  - update lifecycle
  - elapsed realtime clock ownership
  - active location state
  - arrival lifecycle
  - test-only deterministic state/time hooks
- Added original Outside first-arrival behavior:
  - `game.outside.seenForest`
  - `the sky is grey and the wind blows relentlessly`
- Extended Room store classification to original misc items and Fabricator craftable item types.
- Sorted Room store rows by original-style stable key order.
- Fixed workshop craftable visibility so existing store items do not bypass workshop gating.
- Added explicit realtime catch-up capping to prevent unbounded timer drains after paused/background tabs.
- Added Outside notification rendering.
- Added unit/E2E/visual coverage for the newly closed audit gaps.
- Updated `deviations.md` with current intentional parity deviations.

### Verified - Phase 3 Completion Audit Remediation

- `npm test`
- `npm run build`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run test:e2e`

### Completed - Latest Prototype Roast Audit Suggestions

- Made Room, Outside, and cooldown snapshots side-effect free.
- Moved Room unlock side effects behind explicit availability refresh.
- Added original-style Room/Outside location tabs instead of stacked sections.
- Replaced fixed React clock ticking with an elapsed real-time driver while keeping manual time for tests.
- Rendered Room stores in resources/special and weapons groups while hiding original hidden store types.
- Made build/craft/buy costs visible in the UI.
- Added a test-only acceleration harness and full Phase 3 UI progression E2E coverage.
- Expanded visual baselines to stores, build, craft/buy, and outside gather states with frozen test time.
- Added notification retention and source filtering.
- Pinned top-level dependency versions exactly.
- Extracted pure Room selector/economy calculations from `RoomRuntime`.

### Verified - Latest Prototype Roast Audit Suggestions

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Completed - Phase 3 Room Runtime

- Added final Room edge-case coverage for:
  - fire title transition from firelit back to dark as the fire cools
  - idempotent outside unlock notifications
  - maxed craftable notification behavior
  - original hut dynamic runtime cost after existing huts
  - outside title thresholds from original hut counts
- Added Room visual regression baselines for fresh and firelit states across all required desktop viewport projects.
- Updated `REMAKE/docs/context.md` to mark Phase 3 complete and identify Phase 4 Outside/Village as the next implementation area.
- Updated `REMAKE/docs/parity-checklist.md` for completed Phase 3 Room parity gates and remaining post-Phase-3 systems.

### Verified - Completed Phase 3 Room Runtime

- `npm test`
- `npm run build`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run test:e2e`

### Added - Phase 3 Cooldown Rendering and Viewport Matrix Slice

- Added visible cooldown countdown text and progress fill for Room fire and Outside gather buttons.
- Stabilized button dimensions so cooldown labels do not resize the Room layout.
- Expanded Playwright projects to the required desktop viewport matrix:
  - 1366x768
  - 1920x1080
  - 2560x1440
  - 3840x2160
- Added Room layout checks to prevent horizontal overflow at all target widths.
- Expanded discovery assertions for hidden craft, buy, outside, worker, outfitting, path, ship, and fabricator affordances before original unlocks.

### Verified - Phase 3 Cooldown Rendering and Viewport Matrix Slice

- `npm run build`
- `npm test`
- `npm run test:e2e`

### Added - Phase 3 Outside Gather and Income Slice

- Added headless `OutsideRuntime` for the original outside unlock boundary.
- Added original gather-wood behavior:
  - hidden before outside unlock
  - 60 second cooldown
  - 10 wood normally
  - 50 wood with cart
  - original gather notification
- Added minimal Outside UI that appears only after the original need-wood unlock.
- Added Room income snapshots and UI rows using the original `+N per Ds` wording.
- Added discovery coverage to keep the forest/gather controls hidden at fresh start.
- Added Outside runtime tests for unlock initialization, cooldown behavior, and cart gather amount.

### Verified - Phase 3 Outside Gather and Income Slice

- `npm test`
- `npm run build`
- `npm run test:e2e -- src/tests/e2e/app.spec.ts`

### Added - Phase 3 Room Economy Runtime Slice

- Generalized Room action snapshots into build, craft, and buy groups.
- Added full room craft/build handling for all original craftable item types:
  - buildings increment `game.buildings`
  - tools, weapons, and upgrades increment `stores`
  - original cost, maximum, and cold-builder checks are enforced
- Added Room trade-good buying after trading-post unlock with original seen-good/compass gates.
- Added store-row snapshots so all visible positive stores render, not only wood.
- Promoted the builder through the active Room UI tick so the single-panel remake reaches the helper state without requiring tab travel.
- Expanded Room runtime tests for workshop crafting, trade-good buying, and maximum/disabled behavior.

### Verified - Phase 3 Room Economy Runtime Slice

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 3 Room Runtime Timer and Builder Slice

- Added scheduled Room timers for original fire cooling, room warming, builder progression, need-wood unlock, and builder wood income.
- Added original stoke cooldown state to the Room snapshot and disabled the active fire button while cooling down.
- Added need-wood outside unlock behavior with the original wood seed and notifications.
- Added builder helper promotion and first original building unlock/build flow for Room buildings.
- Added Room UI rendering for post-builder build buttons while keeping economy controls hidden before the original trigger.
- Expanded Room runtime tests for timer scheduling, cooldown behavior, outside unlock, first building unlocks, and dynamic building costs.

### Verified - Phase 3 Room Runtime Timer and Builder Slice

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 3 Initial Room Runtime Vertical Slice

- Added headless `RoomRuntime` owned by the engine layer.
- Added original fresh-room initialization:
  - room feature enabled
  - builder level `-1`
  - fire `dead`
  - temperature `freezing`
- Added original-compatible `light fire` behavior for the initial no-wood state.
- Added `stoke fire` behavior with original no-wood semantics.
- Added fire title/state snapshot rendering for `A Dark Room` and `A Firelit Room`.
- Added temperature adjustment helper moving room temperature toward fire level.
- Added first builder progression helper and original fire/builder notifications.
- Replaced default scaffold UI with a minimal Room view.
- Kept Phase 0.5 spike UI available only via `?spikes=1`.
- Added Room runtime unit tests and Room E2E smoke tests at desktop and 4K projects.

### Verified - Phase 3 Initial Room Runtime Vertical Slice

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Changed - Audit Hardening After Full Roast

- Fixed `StateStore` update events to emit the original-style full `stateName` path while keeping category separate.
- Fixed store clamping so both dot and bracket `stores` paths clamp through `set()` and `add()`.
- Added missing original state categories to the initial state shape:
  - `timers`
  - `wait`
  - `cooldown`
- Replaced duplicated engine source commit metadata with the canonical source baseline export.
- Quarantined Phase 0.5 spike UI behind `?spikes=1` so the default entry no longer exposes future `world` or `space` affordances.
- Added E2E coverage that default entry hides spike-only future systems.
- Expanded architecture-boundary tests for:
  - original content independence from UI and expansion content
  - UI not importing low-level state mutation modules directly
- Added source-derived snapshot parity tests that evaluate selected original JavaScript files directly and compare normalized original data against ported TypeScript data.
- Updated `REMAKE/docs/context.md` to reflect the current Phase 2 completion and Phase 3 readiness state.
- Tightened `REMAKE/docs/parity-checklist.md` so data-only coverage does not mark runtime parity as in progress.

### Verified - Audit Hardening After Full Roast

- `npm test`
- `npm run build`
- `npm run test:e2e`

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
