# Controlled Reachability Trace

Authority: `RA-P1-14 Fresh-save spine and pacing`

Classification: **deterministic reachability/regression evidence, not pacing evidence**.

## Trace Contract

`src/tests/e2e/fresh-save-spine.spec.ts` starts with cleared browser storage at Chromium 1366x768. It uses visible player actions, a deterministic test clock, and deliberately controlled RNG. It does not call direct state-mutation or forced-event APIs. The route selects a successful World/combat path, so it demonstrates that the connected progression can be reached under those controls; it does not estimate what an unassisted player will experience.

Elapsed values are simulated 1x game time only. They are neither automation wall time, foreground-active human time, background-open time, nor closed-page wall time.

The fixed route builds the early economy, buys the Compass, clears the generated Iron and Coal Mines, produces the original Steelworks/Water Tank/Wagon progression, travels to both generated radius-28 late-game landmarks, acquires and safely redeems a real Executioner Blueprint, crafts at the Fabricator, repairs the Ship, and completes the sixty-second Space ascent.

## Named Trace

| Milestone                | Simulated elapsed | Milliseconds | Original comparison authority                                                                            |
| ------------------------ | ----------------: | -----------: | -------------------------------------------------------------------------------------------------------- |
| Builder arrives          |        `00:00:30` |     `30,000` | Original 30-second builder-state cadence after the fire/temperature reveal                               |
| Outside appears          |        `00:00:50` |     `50,000` | Original Builder/Outside reveal order and delays                                                         |
| Compass purchased        |        `08:32:10` | `30,730,000` | Original worker 10-second cadence plus original buildings, trades, and Compass costs                     |
| First expedition embarks |        `10:42:10` | `38,530,000` | Original Workshop, Waterskin, Rucksack, weapon, and supply costs                                         |
| Fabricator operates      |        `12:15:02` | `44,102,000` | Original mine economy, radius-28 Executioner placement, Blueprint safe return, and one-Alloy recipe cost |
| Ship discovered          |        `12:15:02` | `44,102,000` | Original radius-28 Crashed Ship placement and safe-return unlock; World movement itself has no time cost |
| Ending appears           |        `12:16:02` | `44,162,000` | Original 60-second Space escape threshold                                                                |

The pinned original source contains the progression constants and costs but no canonical full-playthrough timestamp trace. The comparison column therefore identifies source contracts exercised by this one controlled route. `12:16:02` is not a completion-time estimate, a human pacing baseline, or a distribution sample. The exact series is asserted only as a reachability/drift regression and attached as `controlled-reachability-trace.json` with evidence kind `controlled-reachability-trace`.

## Post-Phase 14 Distribution Status

The original real-command policy completed 0/4 fixed production RNG seeds: three runs died during the first expedition and one failed to recover the final Workshop scales. After adding legal death/resource recovery and late-game policy corrections without changing game balance, historical revision `d3696de` reproduced 4/4 with 11 legal deaths and no failures from a separate clean checkout. The command passes when every run is classified, not because a player-completion threshold succeeded. Both results are scripted-policy evidence and must not be described as player completion rates.

The historical P14V-05 corpus on `d3696de` covers 32 exact seeds: 12 study-policy completions, 20 policy-classified stops, zero game-defect stops, and zero unclassified stops. It is diagnostic automation, not player evidence, and remediation requires a separately named replacement-candidate corpus. No qualifying unassisted human sessions exist. P14V-06 requires schema-version-3 first-time records bound to the frozen revision/artifact/cohort/ruleset/mode policy and at least five valid sessions, continuing up to eight only under its preregistered conflict rule. See `../../playtests/README.md`, `phase-14-post-remediation-next-steps-2026-07-30.md`, and `phase-14-release-readiness-plan-2026-07-12.md`.

## Historical RA-P1-14 Evidence

- Focused browser contract: 1 passed at Chromium 1366 in 59 seconds wall time.
- Unit gate: 39 files / 429 tests passed.
- Integration browser gate: 302 passed, 130 expected skips, 4.8 minutes.
- Lint, Prettier check, TypeScript, and Vite build passed at the RA-P1-14 checkpoint. The parity-phase bundle warning was later remediated by the enforced event-catalog split and tighter entry budget; see `phase-14-roast-remediation-2026-07-11.md`.
