# Phase 9 Setpieces And Dungeons Status

Status: implementation finalized on 2026-07-11. All 13 parser-backed canonical Setpiece events are represented and covered through their Phase 9 source, runtime, organic World, and player-facing evidence contracts. Repository-wide parity/release status remains `HOLD` for later-phase scope.

Entry decision: `GO` for Phase 9 content breadth. The audit's P0/P1/P2 remediation ledger has no open package IDs, the parser-specific breadth hold is lifted, and the pre-implementation baseline passed the parity artifact check, 460 unit tests, lint, formatting, and the production build. The repository-wide `HOLD` remains a truthful parity/release verdict; it does not block Phase 9 implementation.

## Active Scope

Phase 9 expands original Setpiece content against `DATA/parity-graph.json`. Player-facing Ship/Fabricator work remains Phase 10/11, exhaustive Executioner content remains Phase 12, and full parity QA remains Phase 14.

## Implemented Slice: Canonical Cave

- Added the canonical `setpiece.cave` event mapped to `ADR-EVENT-SETPIECES-CAVE`.
- Ported all 13 original scenes: `start`, `a1`, `a2`, `a3`, `b1`, `b2`, `b3`, `b4`, `c1`, `c2`, `end1`, `end2`, and `end3`.
- Preserved the original Torch costs, chance thresholds, combat definitions, notifications, scene loot, exit choices, and three dungeon rewards.
- Routed organic World Cave entry to the canonical event. Existing focused Cave definitions remain as regression scaffolds while later Phase 9 work migrates remaining Setpieces.
- Added player-facing post-combat scene choices so a won branching Setpiece fight exposes the original `continue` and `leave cave` actions instead of a single generic leave action.
- Kept dungeon clearing coordinate-scoped through the existing Phase 8 transaction/consequence boundary.

## Implemented Slice: Canonical Town

- Added canonical `setpiece.town` mapped to `ADR-EVENT-SETPIECES-TOWN`.
- Ported all 23 original scenes: `start`, `a1`-`a3`, `b1`-`b5`, `c1`-`c6`, `d1`-`d2`, and `end1`-`end6`.
- Preserved the original three-way entry branch, Torch costs, combat stats, notifications, intermediate loot, post-combat choices, and all six dungeon rewards.
- Routed organic World Town entry to the canonical event while retaining focused Town definitions as regression scaffolds.
- Kept Town clearing coordinate-scoped through `game.world.townCleared` and the existing World transaction/consequence boundary.

## Implemented Slice: Canonical City

- Added canonical `setpiece.city` mapped to `ADR-EVENT-SETPIECES-CITY`.
- Ported all 52 original scenes: `start`, `a1`-`a4`, `b1`-`b8`, `c1`-`c13`, `d1`-`d11`, and `end1`-`end15`.
- Preserved the original four-way entry branch, Torch costs, 18 combat placements, notifications, intermediate loot, post-combat choices, and all 15 dungeon rewards.
- Routed organic World City entry to the canonical event while retaining focused City definitions as regression scaffolds.
- Kept City clearing coordinate-scoped through `game.world.cityCleared` and preserved the original global `game.cityCleared` progression flag.

## Implemented Slice: Canonical Old House

- Added canonical `setpiece.house` mapped to `ADR-EVENT-SETPIECES-HOUSE`.
- Ported all four original scenes: `start`, `supplies`, `medicine`, and `occupied`.
- Preserved the original three-way entry thresholds, scene text and notifications, medicine and supply loot tables, water replenishment, visited-landmark effect, and Squatter combat definition.
- Routed organic World House entry to the canonical event and retired the old `setpiece.old-house` scaffold key.
- Kept landmark consumption coordinate-scoped through `game.world.oldHouseVisited` and the existing World transaction/consequence boundary.

## Implemented Slice: Canonical Battlefield

- Confirmed canonical `setpiece.battlefield` against `ADR-EVENT-SETPIECES-BATTLEFIELD` and its sole original `start` scene.
- Preserved the original scene text, visited-landmark effect, leave transition, and all six probabilistic loot entries with their exact minimums, maximums, and chance thresholds.
- Retained organic World Battlefield entry through the canonical key and coordinate-scoped landmark consumption through `game.world.battlefieldVisited` and the existing World consequence boundary.
- Added explicit one-scene source coverage and focused runtime routing/loot assertions; the existing GameSession and Chromium 1366 World contracts cover organic movement, salvage, capacity handling, and consumed-landmark hiding.

## Implemented Slice: Canonical Borehole

- Confirmed canonical `setpiece.borehole` against `ADR-EVENT-SETPIECES-BOREHOLE` and its sole original `start` scene.
- Preserved the exact three-line scene text, visited-landmark effect, guaranteed Alien Alloy loot range of one through three, and leave transition.
- Retained organic World Borehole entry and coordinate-scoped landmark consumption through `game.world.boreholeVisited` and the existing World consequence boundary.
- Aligned the registry with the original Battlefield-before-Borehole source order and added explicit source-scene, focused runtime, organic GameSession, and Chromium 1366 browser assertions.

## Implemented Slice: Canonical Crashed Ship

- Migrated the complete one-scene Crashed Ship graph from the Phase 8 scaffold key `setpiece.crashed-ship` to canonical `setpiece.ship`, matching `ADR-EVENT-SETPIECES-SHIP`.
- Preserved the exact three-line scene text, the original misspelled `leavel` button key, visible `salvage` label, Ship discovery state, visited-landmark effect, and leave transition.
- Retained organic World Ship entry, original road drawing, and coordinate-scoped landmark consumption through the existing World consequence boundary.
- Added exact one-scene source coverage and strengthened focused EventRuntime, organic GameSession, and Chromium 1366 browser assertions for discovery flags, source text, salvage, road drawing, and consumed-landmark hiding.

## Implemented Slice: Canonical Sulphur Mine

- Closed canonical `setpiece.sulphurmine` against `ADR-EVENT-SETPIECES-SULPHURMINE` and all five original scenes: `start`, `a1`, `a2`, `a3`, and `cleared`.
- Preserved the exact entry text and notifications, two ranged Soldier combats, Veteran combat, loot tables, and the original `attack`, `continue`, and `run` choices.
- Retained organic World entry and coordinate-scoped road drawing, visited state, safe-return sulphur-mine building creation, and sulphur-miner unlock through the existing World transaction/consequence boundary.
- Added exact content coverage, strengthened focused EventRuntime and organic GameSession assertions, and Chromium 1366 traversal through the visible original combat choices and safe-return worker unlock.

## Implemented Slice: Canonical Coal Mine

- Closed canonical `setpiece.coalmine` against `ADR-EVENT-SETPIECES-COALMINE` and all five original scenes: `start`, `a1`, `a2`, `a3`, and `cleared`.
- Preserved the exact entry text and notifications, two Man combats, Chief combat, loot tables, and the original `attack`, `continue`, and `run` choices.
- Retained organic World entry and coordinate-scoped road drawing, visited state, safe-return coal-mine building creation, and coal-miner unlock through the existing World transaction/consequence boundary.
- Added exact content coverage and strengthened focused EventRuntime, organic GameSession, and Chromium 1366 traversal through visible source text, original combat choices, clearing, consumed-landmark hiding, and safe-return worker unlock.

## Implemented Slice: Canonical Iron Mine

- Closed canonical `setpiece.ironmine` against `ADR-EVENT-SETPIECES-IRONMINE` and all three original scenes: `start`, `enter`, and `cleared`.
- Restored the exact `go inside` entry label and one-Torch cost while preserving the source text and notifications, Beastly Matriarch combat, loot table, combat leave transition, and cleared-mine ending.
- Retained organic World entry and coordinate-scoped road drawing, visited state, safe-return iron-mine building creation, and iron-miner unlock through the existing World transaction/consequence boundary.
- Added exact content coverage, strengthened focused EventRuntime and organic GameSession assertions, and added Chromium 1366 generated-map entry plus full clearing, consumed-landmark hiding, safe return, and visible worker-unlock coverage.

## Implemented Slice: Canonical Destroyed Village Cache

- Migrated the complete three-scene graph from the Phase 8 semantic scaffold key `setpiece.destroyed-village` to canonical `setpiece.cache`, matching `ADR-EVENT-SETPIECES-CACHE`.
- Preserved the exact `start`, `underground`, and `exit` source scenes, their text and notification, and the original `enter`, `take`, and `leave` transitions.
- Retained organic World Cache entry, coordinate-scoped visited/consumed state, full previous-run prestige-store transfer, and one-time `previous.stores` clearing through the existing World and event-effect boundaries.
- Added exact scene/button coverage, strengthened focused EventRuntime and organic GameSession assertions, and extended the Chromium 1366 traversal with both canonical cache-state effects.

## Implemented Slice: Canonical Outpost

- Closed canonical `setpiece.outpost` against `ADR-EVENT-SETPIECES-OUTPOST` and its sole original `start` scene.
- Preserved the exact title, scene text and notification, guaranteed five-to-ten Cured Meat loot, `leave` transition, water refill, and `water replenished` notification.
- Tightened the source effect bridge so Outpost use has one semantic path: refill active-expedition water and record the active coordinate in `usedOutposts`, without leaking the unrelated one-shot landmark `waterReplenished` flag.
- Retained organic World entry, hidden tooltip/entry after use, visible `P` glyph, safe-return reset, and same-coordinate reuse after re-embark through the existing World transaction boundary.
- Added exact one-scene content coverage and strengthened focused EventRuntime, organic GameSession, and Chromium 1366 assertions for the canonical effect and coordinate-scoped reuse contract.

## Implemented Slice: Canonical Swamp

- Closed canonical `setpiece.swamp` against `ADR-EVENT-SETPIECES-SWAMP` and all three original scenes: `start`, `cabin`, and `talk`.
- Preserved the exact title, scene text, entry notification, `enter`/`talk`/`leave` transitions, one-Charm talk cost, `gastronome` perk reward, and visited-landmark effect.
- Retained organic World entry and coordinate-scoped visited/consumed state through `game.world.swampVisited`, `resolvedLandmarks`, and the existing World transaction boundary.
- Added exact three-scene content coverage and strengthened focused EventRuntime, organic GameSession, and Chromium 1366 assertions for carried-Charm consumption, the complete wanderer route, perk acquisition, and consumed-landmark hiding.
- Added an explicit inventory contract proving all 13 parser-backed canonical Setpiece event keys are represented.

## Evidence

- `npm run parity:check`
- `npm test` before implementation: 63 files / 460 tests passed.
- `npm run lint`, `npm run format:check`, and `npm run build` before implementation passed.
- Focused content/engine/UI run: 4 files / 38 tests passed.
- `npx tsc --noEmit` passed.
- `npx playwright test src/tests/e2e/expedition-resources.spec.ts --project=chromium-1366`: 4 passed, including organic World Cave entry and visible post-combat branching.
- Final integration: 63 files / 460 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Town focused content/engine/World run: 3 files / 30 tests passed.
- Town Chromium 1366 expedition-resource browser run: 5 passed, including organic entry and visible schoolhouse combat branching.
- Town final integration: 63 files / 461 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- City focused content/organic-World run: 2 files / 21 tests passed.
- City Chromium 1366 expedition-resource browser run: 6 passed, including organic entry and visible tower-combat branching.
- City final integration: 63 files / 461 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Old House focused content/engine/organic-World run: 4 files / 40 tests passed.
- Old House Chromium 1366 World contract: 1 passed, covering visible organic entry, occupied combat, and consumed-landmark hiding.
- Old House final integration: 63 files / 462 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Battlefield focused content/runtime coverage: 3 files / 32 tests passed.
- Battlefield Chromium 1366 World contract: 1 passed, covering organic entry, visible source text, salvage, and consumed-landmark hiding.
- Battlefield final integration: 63 files / 463 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Borehole focused content/engine/organic-World run: 4 files / 42 tests passed.
- Borehole Chromium 1366 World contract: 1 passed, covering organic entry, exact source text, deterministic Alien Alloy salvage, visited state, transfer to outfit, and consumed-landmark hiding.
- Borehole final integration: 63 files / 463 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Crashed Ship focused content/engine/organic-World run: 4 files / 42 tests passed.
- Crashed Ship Chromium 1366 World contract: 1 passed, covering canonical routing, exact source text, discovery flags, salvage, road drawing, and consumed-landmark hiding.
- Crashed Ship final integration: 63 files / 463 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Sulphur Mine focused content/engine/organic-World run: 3 files / 31 tests passed.
- Sulphur Mine Chromium 1366 World contract: 1 passed, covering organic entry, source text, original post-combat choices, all three combats, clearing, consumed-landmark hiding, safe return, and visible sulphur-miner unlock.
- Sulphur Mine final integration: 63 files / 463 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Coal Mine focused content/engine/organic-World run: 3 files / 24 tests passed.
- Coal Mine Chromium 1366 World contract: 1 passed, covering organic entry, source text, original post-combat choices, all three combats, clearing, consumed-landmark hiding, safe return, and visible coal-miner unlock.
- Coal Mine final integration: 63 files / 463 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Iron Mine focused content/engine/organic-World run: 3 files / 24 tests passed.
- Iron Mine Chromium 1366 World contracts: 2 passed, covering generated-map entry, exact source text and Torch cost, full combat clearing, consumed-landmark hiding, safe return, and visible iron-miner unlock.
- Iron Mine final integration: 63 files / 463 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Destroyed Village focused content/engine/organic-World run: 3 files / 29 tests passed.
- Destroyed Village Chromium 1366 World contract: 1 passed, covering canonical organic routing, exact source traversal, prestige-store transfer and clearing, state effects, and consumed-landmark hiding.
- Destroyed Village final integration: 63 files / 463 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Outpost focused content/engine/organic-World run: 3 files / 32 tests passed.
- Outpost Chromium 1366 World contracts: 2 passed, covering organic canonical entry, exact source text, water refill, coordinate-scoped used state, hidden repeat entry with preserved glyph, safe-return reset, and reuse after re-embark.
- Outpost final integration: 63 files / 464 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.
- Swamp focused content/engine/organic-World run: 3 files / 31 tests passed.
- Swamp Chromium 1366 World contract: 1 passed, covering organic canonical entry, complete source traversal, carried-Charm consumption, `gastronome`, coordinate-scoped visited state, consumed-landmark hiding, safe return, and visible perk display.
- Phase 9 final integration: 63 files / 466 unit tests, parity check, lint, formatting, production build, bundle boundary, and performance bundle budgets passed.

## Remaining Slices

None. All 13 canonical Phase 9 Setpiece events are implemented and the final integration gate is green. The next roadmap work is outside Phase 9.
