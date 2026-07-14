# Fresh-save Pacing Baseline

Authority: `RA-P1-14 Fresh-save spine and pacing`

## Measurement Contract

`src/tests/e2e/fresh-save-spine.spec.ts` starts with cleared browser storage at Chromium 1366x768. It uses visible player actions, the deterministic test clock, and controlled RNG. It does not call direct state-mutation or forced-event APIs. Elapsed values are simulated 1x game time; UI automation wall time is not included.

The fixed route builds the early economy, buys the Compass, clears the generated Iron and Coal Mines, produces the original Steelworks/Water Tank/Wagon progression, travels to both generated radius-28 late-game landmarks, acquires and safely redeems a real Executioner Blueprint, crafts at the Fabricator, repairs the Ship, and completes the sixty-second Space ascent.

## Named Baseline

| Milestone                | Simulated elapsed | Milliseconds | Original comparison authority                                                                            |
| ------------------------ | ----------------: | -----------: | -------------------------------------------------------------------------------------------------------- |
| Builder arrives          |        `00:00:30` |     `30,000` | Original 30-second builder-state cadence after the fire/temperature reveal                               |
| Outside appears          |        `00:00:50` |     `50,000` | Original Builder/Outside reveal order and delays                                                         |
| Compass purchased        |        `08:32:10` | `30,730,000` | Original worker 10-second cadence plus original buildings, trades, and Compass costs                     |
| First expedition embarks |        `10:42:10` | `38,530,000` | Original Workshop, Waterskin, Rucksack, weapon, and supply costs                                         |
| Fabricator operates      |        `12:15:02` | `44,102,000` | Original mine economy, radius-28 Executioner placement, Blueprint safe return, and one-Alloy recipe cost |
| Ship discovered          |        `12:15:02` | `44,102,000` | Original radius-28 Crashed Ship placement and safe-return unlock; World movement itself has no time cost |
| Ending appears           |        `12:16:02` | `44,162,000` | Original 60-second Space escape threshold                                                                |

The pinned original source contains the pacing constants and progression costs but no canonical full-playthrough timestamp trace. Therefore the comparison column names the original source contracts exercised by the deterministic route; it does not claim that `12:16:02` is a universal human completion time. The exact remake series is asserted as a regression baseline and attached as `fresh-save-pacing.json` by the browser test.

## Post-Phase 14 Distribution Status

The original real-command policy completed 0/4 fixed production RNG seeds: three runs died during the first expedition and one failed to recover the final Workshop scales. After adding legal death/resource recovery and late-game policy corrections without changing game balance, the same dirty-worktree diagnostic provisionally completed 4/4 with 11 legal deaths. The command passes when every run is classified, not because a completion threshold succeeded. Both results are scripted-policy evidence and must not be described as player completion rates.

No qualifying unassisted human sessions exist. `P14V-01` strengthened the cohort schema/gate, the corrected P14V-04 policy awaits clean-candidate reproduction, and the P14V-05 shard/aggregate writer is ready to retain the fixed 32-seed corpus after that freeze. `P14V-06` then collects at least three same-revision sessions, normally continuing to five and up to eight if results conflict. See `phase-14-release-readiness-plan-2026-07-12.md`.

## Historical RA-P1-14 Evidence

- Focused browser contract: 1 passed at Chromium 1366 in 59 seconds wall time.
- Unit gate: 39 files / 429 tests passed.
- Integration browser gate: 302 passed, 130 expected skips, 4.8 minutes.
- Lint, Prettier check, TypeScript, and Vite build passed at the RA-P1-14 checkpoint. The parity-phase bundle warning was later remediated by the enforced event-catalog split and tighter entry budget; see `phase-14-roast-remediation-2026-07-11.md`.
