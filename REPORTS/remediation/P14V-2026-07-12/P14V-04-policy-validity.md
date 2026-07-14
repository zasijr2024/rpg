# P14V-04 Progression Policy Validity

Date: 2026-07-12
Updated: 2026-07-14
Candidate revision: `d3696de28218bb6c7645302398e1a4b5fe7cba18`
Environment: Windows, Node `25.4.0`, npm `11.7.0`, Vitest `4.1.10`
Final clean aggregate command: `npm run study:progression`, invoked by `npm run gate:rc` from `F:\ADR20-P14V-02\REMAKE`

Status: **DONE - policy-valid result reproduced on the exact clean P14V-02 candidate**. This is diagnostic policy evidence, not player completion evidence and not P14V-05's retained 32-seed corpus.

## Before

The original four-seed policy produced 0/4 completions:

|       Seed | Stage            | Result                                       | Classification                                               |
| ---------: | ---------------- | -------------------------------------------- | ------------------------------------------------------------ |
|  346030080 | first expedition | player died in combat                        | policy: healing/defence ordering and no legal death recovery |
| 3000465849 | first expedition | player died in combat                        | policy: healing/defence ordering and no legal death recovery |
| 1359934322 | first expedition | player died in combat                        | policy: healing/defence ordering and no legal death recovery |
| 4014370091 | compass          | Workshop materials unavailable with 7 scales | policy: no trap-backed scale recovery                        |

Aggregate: 3 deaths, 315 incidental events, 13 combats. The probe emitted only aggregate failures and did not retain per-seed checkpoints or an explicit failure class.

## Implemented Policy Corrections

- healing is selected before optional defensive actions;
- Workshop and equipment shortfalls recover through ordinary trap, trade, worker, Room, and Path commands;
- mine and later expedition deaths use the production rollback plus the normal two-minute embark cooldown before retrying;
- the policy earns leather, iron, and steel armour and upgrades weapons before deeper routes;
- the deterministic policy no longer queues or injects RNG outcomes;
- per-seed results now include milestones, decisions, combats, legal recovery attempts, deaths, bottlenecks, and `policy`/`game-defect`/`unclassified` failure classes;
- the probe explores the ordinary Battlefield route but does not assume its randomized cache contains advanced weapons.
- crafting now warms the Room through ordinary fire commands before relying on a visible craft action;
- iron, coal, steel, leather, and wood targets are based on actual purchase totals and post-death reserves instead of fixed production durations;
- late-game preparation now buys the source-authentic convoy and carries only the strongest available melee weapon, leaving capacity for recovery supplies;
- the policy now attempts the ordinary Sulphur Mine before Executioner so its rifle and bayonet progression can be represented without injected loot;
- combat-victory handling drains enabled live actions and stops when the event exposes its next branch, rather than assuming a stale `leave` button.

## After: initial recovery-policy iteration

The same four seeds again produced 0/4 completions, but all four original shallow failures moved or were recovered and every current stop is explicitly classified as policy:

|       Seed | Furthest stage   | Deaths | Current bottleneck                              | Classification |
| ---------: | ---------------- | -----: | ----------------------------------------------- | -------------- |
|  346030080 | deep economy     |      3 | Executioner post-combat continuation handling   | policy         |
| 3000465849 | deep economy     |      2 | steel-sword replacement unavailable after death | policy         |
| 1359934322 | first expedition |      0 | iron-armour material policy unavailable         | policy         |
| 4014370091 | deep economy     |      2 | iron-sword replacement unavailable after death  | policy         |

Aggregate: 7 deaths, 322 incidental events, 58 combats. Three seeds reached deep economy. The formerly Workshop-blocked seed recovered its missing scales and reached deep economy. Ordinary expedition death, rollback, cooldown, re-equipping, and retry are represented in the emitted checkpoints.

### Reserve-policy iteration

A subsequent full four-seed run after resource-targeting and warm-Room handling produced 0/4 completions, 22 deaths, 449 incidental events, and 123 combats. All four seeds reached deep economy. Three stopped after four legal Executioner attempts; one exposed a remaining wood-replacement policy stop. No outcome was classified as a game defect or left unclassified. This run preceded the final wood-order, convoy, and Sulphur-route changes and is retained as an intermediate diagnostic, not the P14V-05 corpus.

The formerly iron-armour-blocked seed (`1359934322`) was then rerun alone after those corrections. It cleared the iron and coal mines, created the convoy and steel equipment through production commands, reached deep economy, and entered the Sulphur Mine. Its current classified stop is attrition across four legal Sulphur Mine attempts with source-authentic steel equipment. This proves the original fixed-duration armour failure is repaired, but it does not yet establish a valid full-cohort result.

### Late-route recovery iteration (2026-07-13)

Focused reruns of fixed seed `346030080` exposed and corrected additional policy defects without changing game balance or injecting outcomes:

- the claimed Battlefield route used tile `B` (Borehole) instead of canonical tile `F`; the corrected route now visits the real randomized Battlefield cache;
- Town and City are traversed through ordinary World movement and production event choices before Battlefield/Sulphur, retaining their actual deterministic-seed loot instead of selecting a branch;
- constrained Battlefield loot now takes compatible ammunition before exchanging low-value cargo space for a usable rifle;
- generic combat preserves scarce ammunition by selecting melee attacks through stable action keys, attacks on weapon-ready ticks, uses meat in cooldown windows, and reserves medicine/hypo for emergency health;
- once rifle and medicine trading are organically revealed, hunter production and normal Trading Post purchases establish explicit ammunition and recovery reserves;
- the Executioner loadout now carries the strongest organically owned supported weapon and replenishes a visible medicine good;
- post-combat scene handling now follows the canonical `continue` transitions, and the policy steps off and re-enters the `X` landmark after taking the first device before entering the antechamber.

Evidence from `PHASE14_STUDY_SEEDS=1`, `PHASE14_STUDY_START=0`, `npm run study:progression`:

| Iteration                                       | Furthest result                        | Key evidence                                                                                                             |
| ----------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| pre-correction baseline                         | Sulphur failure after four attempts    | 5 deaths, 30 combats; no advanced recovery path                                                                          |
| corrected settlement/Battlefield/loadout policy | Sulphur cleared on attempt 1           | ordinary Town yielded medicine; Battlefield yielded a rifle; ordinary trade supplied bullets/medicine; no injected state |
| corrected Executioner combat policy             | both intro combats reachable/clearable | latest completed run stopped after taking the device because the policy had not re-entered the `X` landmark              |

The final landmark re-entry correction passes `npx tsc --noEmit --pretty false` and focused ESLint. Subsequent focused runs confirmed the antechamber return and exposed the later classified policies below. The four-seed after-state remains open and no completion-rate claim is made from these focused runs.

### Executioner recovery iteration (2026-07-13)

The post-re-entry focused runs exposed a sequence of policy assumptions and retained their classified outcomes:

- re-entering the `X` landmark already opens `executioner.antechamber/start`; the policy now asserts that state instead of issuing a nonexistent second `enter` action;
- a lost Battlefield rifle can be rebuilt through the cleared Sulphur Mine's ordinary worker production and the source-authentic Room recipe, so retries now replenish rifle, ammunition, and medicine rather than falling back permanently to a steel sword;
- the randomized Martial selection can yield an armory branch whose grenade action is unavailable; the policy now leaves, re-enters the landmark, and retries Martial through ordinary commands, failing closed after six branch attempts;
- required Martial blueprints and alien alloy now use visible loot-exchange actions when convoy capacity is full, while optional loot may be left behind;
- the diagnostic timeout now scales with the requested seed count because a valid one-seed summary exceeded the previous fixed 240-second ceiling;
- a one-time cured-meat action before the opening attack was tested and rejected: it delayed rifle damage, increased incoming attacks, and regressed the seed to four intro deaths. The attack-first cadence was restored.

Latest retained focused result for seed `346030080` (`PHASE14_STUDY_SEEDS=1`, `PHASE14_STUDY_START=0`): command passed in 559.6 seconds and emitted 0/1 completions, 4 deaths, 873 incidental events, and 50 combats. The seed cleared Sulphur on its first attempt, legally recovered a rifle after death, rerolled an unavailable armory branch to `executioner.martial-scrap-blueprint`, exchanged cargo for its required alloy, and reached the scrap guard combat. It then died in that combat; the remaining retries died in the Executioner intro and the final classified stop was `executioner exhausted four legal attempts`. No game-origin defect or unclassified stop was observed.

This result shows that additional medicine or an opening-heal delay is not the appropriate next policy. The source graph exposes Engineering before Martial and its kinetic-armour progression raises the survivability ceiling. The next bounded change is therefore to split Executioner into safe-return phases: commit the first device, clear Engineering, return and fabricate kinetic armour through ordinary commands, then enter Martial. The 559-second focused runtime also makes a dedicated snapshot/publication performance pass a prerequisite for a practical 32-seed P14V-05 corpus.

### Safe-return and harness iteration (2026-07-13)

The Executioner policy is now split into three independently committed ordinary expeditions:

1. clear the intro, take the first device, and return it to unlock the Fabricator;
2. re-enter the battleship, clear Engineering, return its blueprint/alloy, and fabricate kinetic armour; and
3. re-enter with the higher source-authentic health ceiling before attempting Martial.

The shared wing handler traverses only visible event, combat, loot, and exit actions. It prefers required `continue`/`fight` actions over the Engineering heal machine so it does not spend the alloy reserved for kinetic armour. No state or outcome is injected.

The harness now reads transient domain snapshots instead of constructing the full Room/Outside/Path/World/Fabricator/Ship/Space/Event snapshot on every combat tick and supply adjustment. Outfit changes use the existing bulk amount supported by the production Path command. An opt-in `PHASE14_STUDY_TRACE=1` mode streams exact seed/checkpoint lines without changing the default evidence output or policy.

First focused result after that split (`PHASE14_STUDY_SEEDS=1`, `PHASE14_STUDY_START=0`): the command passed in 477.5 seconds and emitted 0/1 completions, 2 deaths, 761 incidental events, and 48 combats. It legally committed the first device on attempt 2 and entered Engineering. The final classified stop, `engineering route exceeded 240 decisions`, exposed a handler defect: a won combat with a visible continuation button was repeatedly re-observed instead of advancing the scene. This was a policy-loop failure, not a game defect.

That won-combat transition is corrected. A subsequent full focused rerun did not return after the 600-second per-seed allowance and was terminated without a final JSON summary. It is not retained as outcome evidence and makes no claim that Engineering, kinetic armour, or Martial completed. It does establish that the current end-to-end probe remains too opaque and too slow for P14V-05 despite the snapshot improvement; the live checkpoint mode is now the required next diagnostic before another full rerun.

No result observed in these historical iterations was classified as a game-origin hard lock, corrupt transition, or impossible legal recovery. At that point the final Sulphur/Executioner recovery policy and full four-seed rerun were still required; the following after-state records their completion.

## Final Four-Seed After-State (2026-07-14)

The policy now completes the entire production-command route rather than treating the first three Executioner wings as completion. It commits the device, Engineering, Martial, and Medical phases through safe returns; fabricates the source-authentic kinetic armour, plasma rifle, disruptor, and hypos when their ordinary blueprints/resources are available; clears the Command Deck's 500-HP immortal wanderer; returns the fleet beacon; prepares the ship; and reaches the Space ending.

The final corrections were policy/runtime corrections rather than balance changes:

- worker income collection uses one coherent economy read per tick and no longer rebuilds every income definition each second, making long legal production windows practical while preserving worker order and cadence;
- independent ready weapons are issued independently, with reusable disruptor stun preferred over consumable bolas;
- enemy shield and meditation states use status-aware ordering, and kinetic shielding is used whenever ready so reflected damage and ordinary hits have legal counterplay;
- plasma weapons are carried only with energy cells, ranged phases retain rifle and melee fallbacks, and the Command loadout reserves 100 bullets, three grenades, strong recovery, and sufficient return food;
- won Command combat exits through its cooldown-gated combat action before asserting the canonical `cleared` scene and `game.world.executionerCleared` state;
- ship preparation clears stale expedition cargo and packs recovery/food within the production capacity model.

Final aggregate result:

| Measure                          |         Result |
| -------------------------------- | -------------: |
| Seeds                            |              4 |
| Completed                        |              4 |
| Completion rate                  |           1.00 |
| Legal deaths                     |             11 |
| Incidental events                |          6,748 |
| Combats                          |            439 |
| Classified/unclassified failures |          0 / 0 |
| Completion min                   | 335,918,000 ms |
| Completion median                | 435,625,000 ms |
| Completion p90 / max             | 514,696,000 ms |

The original aggregate command exited `0` after 686.74 seconds wall time. All four seeds reached `executioner`, `ship`, `space`, and `complete`; no result reported a bottleneck or failure class. The run contains legal deaths and ordinary rollback/retry evidence, including the formerly Workshop-blocked seed's trap-backed scale recovery.

Post-run verification on the same dirty worktree:

- `npx tsc --noEmit`: passed;
- `npx eslint src/tests/engine/progression-distribution.test.ts src/engine/outside/OutsideRuntime.ts`: passed;
- `npx vitest run src/tests/engine/economy-cadence.test.ts src/tests/engine/outside-runtime.test.ts src/tests/engine/event-runtime/executioner-command.test.ts --reporter=dot`: 3 files and 26 tests passed.

## Clean-Candidate Reproduction (2026-07-14)

The exact P14V-02 candidate reproduced the same result from the separate clean checkout as part of the uninterrupted technical RC gate:

- revision: `d3696de28218bb6c7645302398e1a4b5fe7cba18`;
- source state: detached clean checkout with the pinned `ORIGINAL` submodule initialized;
- command: `npm run gate:rc`, including its `npm run study:progression` stage;
- Vitest result: 1 file and 1 test passed; study body `658609ms`, stage duration `660.11s`;
- aggregate: 4 seeds, 4 completed, completion rate 1.00, 11 legal deaths, 6,748 incidental events, 439 combats, 0 classified failures, and 0 unclassified failures;
- milestones: every seed reached `executioner`, `ship`, `space`, and `complete`;
- enclosing technical RC gate: exit `0`, `Technical Release Candidate: PASS`.

This clean reproduction closes P14V-04. It does not establish a player completion rate or product pacing decision. Those claims remain owned by P14V-06 and P14V-08.

## Next Work

1. P14V-05 subsequently retained the fixed 32-seed artifact on this revision; see `P14V-05-progression-corpus.md`.
2. Keep human completion, pacing, and balance claims out of this diagnostic; those remain P14V-06/P14V-08 evidence and decisions.
