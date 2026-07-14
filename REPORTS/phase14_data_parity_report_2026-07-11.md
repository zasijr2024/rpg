# Phase 14 Data Parity Report

Date: 2026-07-11  
Remake revision inspected: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd` plus the current Phase 14 working tree  
Pinned original revision: `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`  
Scope: the desktop gameplay/UI parity target defined by `REMAKE/docs/plan.md`, excluding only documented deferred or deviated systems.

## Conclusion

`PASS` for the Phase 14 data-parity contract.

All extracted gameplay data is represented in runtime/content modules or preserved in an explicitly deferred manifest. The parser-backed event graph has no missing source identity, title, scene requirement, player-facing source string, or graph edge. `REMAKE/docs/parity-checklist.md` contains no open or partial items; its three `[!]` entries link to accepted deviations.

This report proves representation and deterministic behavior coverage. It does not claim that one controlled fresh-save route measures the distribution of completion time, deaths, or resource outcomes for real players using uncontrolled production RNG.

## Source Authorities

- `ORIGINAL/`: pinned upstream source submodule.
- `DATA/canonical-manifest.json`: generated identity and constant inventory.
- `DATA/parity-graph.json`: TypeScript-AST event requirement graph.
- `REMAKE/src/generated/canonical-manifest.json` and `REMAKE/src/generated/parity-graph.json`: runtime-test mirrors.
- `REMAKE/docs/source-baseline.md`: immutable baseline contract.
- `REMAKE/docs/deferred.md` and `REMAKE/docs/deviations.md`: exclusions and intentional behavior changes.

`npm run parity:check` regenerates the machine artifacts in memory and rejects drift instead of trusting manually maintained counts.

## Exact Event Denominator

The seven pinned source event files contain:

| Measure | Source graph | Runtime representation |
| --- | ---: | --- |
| Source event identities | 48 | Each maps exactly once across 119 routed runtime definitions |
| Canonical scenes | 274 | Every non-Executioner identity is exact; all 103 Executioner scenes are locked separately |
| Buttons | 462 | Represented and included in graph comparison |
| Transitions | 542 | Represented, including chance maps and cross-event handoffs |
| Effects | 869 | Represented through typed effect/capability bridges |
| Rewards | 352 | Represented with one-time application contracts |
| Stable requirements | 2,547 | All present |
| Containment/transition edges | 2,791 | All present |

`REMAKE/src/tests/content/phase-14-event-parity.test.ts` also extracts every translatable source string through the TypeScript compiler AST and recursively inventories runtime event strings and function bodies. The test rejects a missing source string, duplicate/missing identity, count drift, or graph mutation.

## Domain Coverage

| Domain | Representation authority | Behavioral authority | Result |
| --- | --- | --- | --- |
| Core engine, scoring, Hyper, prestige | `src/content/original/core/` | core, clock, score, Hyper, and Space-ending tests | Pass |
| Room and trades | `src/content/original/room/` | Room runtime, command, UI, and fresh-spine contracts | Pass |
| Outside, workers, traps, thieves | `src/content/original/outside/` plus economy domain | cadence, deterministic drops, thief threshold/accounting, event outcomes | Pass |
| Events | 119 routed definitions in `eventData.ts` | parser graph, exact content tests, EventRuntime and browser contracts | Pass |
| Combat | original weapon/enemy definitions | timing, cost, damage, stun, specials, death, victory, loot, restore | Pass |
| Path/outfit | original carryables, weights, upgrades | capacity, atomic reserve/return, keyboard controls, Compass | Pass |
| World | original constants/generator/landmarks | deterministic generation plus a 64-seed production-RNG corpus, movement, survival, roads, landmarks, return | Pass |
| Setpieces | all 13 parser-backed event graphs | exact scene contracts, organic World entry, combat/loot/clear consequences | Pass |
| Executioner | 6 events, 103 scenes, 16 combats | exhaustive routed branches, specials, six Blueprints, deck/Command completion | Pass |
| Ship | original hull/thruster/cooldown constants | discovery, operations, warning, lift-off, crash, save restore | Pass |
| Fabricator | all nine recipes | Blueprint gates, cost/quantity/max, atomic failure, persistence | Pass |
| Space and ending | original movement, debris, altitude, score, prestige data | active-flight save, collision/crash, income pause, escape, both endings, restart | Pass |

## Discovery And Progression

The discovery suite asserts the absence of future systems at each earlier progression boundary. The controlled browser spine then reaches the ending only through visible controls:

1. light fire and reach Builder/Outside;
2. acquire Compass and open Path;
3. outfit and embark;
4. clear generated Iron and Coal Mines;
5. build the deep economy needed for the late game;
6. enter the Ravaged Battleship and acquire a Blueprint;
7. return safely and redeem it in the Fabricator;
8. discover and reinforce the Crashed Ship;
9. accept lift-off, survive Space, and reach the score ending.

The controlled route ends at a simulated `12:16:02`. That number is a regression milestone, not a promise about human play time.

## Deferred Data

Audio and localization inventories remain preserved and test-locked, but playback and active localization are intentionally deferred. Mobile/touch support, original-browser save import, and new content are outside the Phase 14 desktop parity target. Durable remake-save schema, backup recovery, and supported legacy-remake migrations were deliberately pulled forward by the production-readiness program.

## Intentional Deviations

The authoritative report is `REMAKE/docs/deviations.md`. Accepted differences include the modern semantic desktop shell, inline costs, React tabs, development-only deterministic harness, deferred audio playback, bounded open-tab background debt replay, development-only debug settings, and a focused event modal instead of browser-title blinking.

## Verification Authorities

- `npm run parity:check`
- `npm test`
- `npm run gate:parity`
- `npm run gate:beta`
- `npm run test:e2e:release`
- `npm run test:e2e:production`
- `npm audit` and `npm audit --omit=dev`

Final command outcomes are recorded in `REMAKE/docs/status/phase-14-full-parity-qa.md`; release-candidate cleanliness is intentionally evaluated separately from data parity.
