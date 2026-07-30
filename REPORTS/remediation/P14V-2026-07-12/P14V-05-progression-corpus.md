# P14V-05 Fixed Progression Corpus

Date completed: 2026-07-14
Historical status: **DONE - retained 32-seed artifact validated on historical clean candidate `d3696de`**

This is deterministic study-policy evidence. Its completion rate is not a player completion rate, and its incomplete runs are not automatically game defects. P14V-06 owns human pacing evidence; P14V-08 owns the product decision.

## Execution Contract

- Candidate revision: `d3696de28218bb6c7645302398e1a4b5fe7cba18`
- Starting worktree: clean detached P14V-02 checkout at `F:\ADR20-P14V-02`
- Node/npm/platform: Node `v25.4.0`; npm `11.7.0`; `win32` `x64`
- Fixed range: seed indexes `0..31`
- Sharding: eight deterministic four-seed shards with two concurrent jobs
- Exact recorded command: `node scripts/progression-corpus.mjs --seeds=32 --start=0 --shard-size=4 --jobs=2 --output=F:/ADR20/REPORTS/remediation/P14V-2026-07-12/P14V-05-progression-32-seed.json`
- Runner exit: `0` after 2,424.8 seconds wall time
- Validation: exact formula/range coverage, no duplicate/missing/extra/mutated seeds, classified incomplete outcomes, consistent completion state, and milestone bounds

## Retained Artifact

- Path: `P14V-05-progression-32-seed.json`
- Schema/kind: version `1`, `phase14-progression-corpus`
- Size: 518,760 bytes
- SHA-256: `437ECB9DB037A9126563F98B6D7455874D08C416FE56E807911161B18B68B7AD`
- Corpus-tooling verification: `npx vitest run src/tests/tooling/progression-corpus.test.ts --reporter=dot` passed 3/3

## Aggregate Result

| Measure                           | Result |
| --------------------------------- | -----: |
| Seeds                             |     32 |
| Study-policy completions          |     12 |
| Diagnostic completion rate        |  0.375 |
| Legal deaths                      |    161 |
| Incidental events                 | 42,692 |
| Combats                           |  2,937 |
| Policy-classified incomplete runs |     20 |
| Game-defect-classified runs       |      0 |
| Unclassified runs                 |      0 |

For the 12 completed runs, simulated completion time ranged from `335918000` to `759881000` ms, with median `391759000` and p90 `514696000`. All completed runs reached Executioner, Ship, Space, and the score ending.

Incomplete stage distribution:

- 4 stopped in `first-expedition`, all after four legal Coal Mine attempts;
- 16 stopped in `deep-economy`.

The most frequent retained policy bottlenecks were Battlefield exhaustion after eight legal attempts (6), Coal Mine exhaustion after four attempts (4), and Executioner Medical exhaustion after eight attempts (3). Seven other policy bottlenecks occurred once each: City attempts, a combat polling ceiling, cured-meat outfit targeting, Executioner Command, Executioner Engineering, Martial branch attempts, and Sulphur Mine attempts.

## Interpretation And Decision

The corpus validates that the runner covers the exact fixed seed range and that every incomplete outcome is retained and classified. It found **zero verified game-origin hard locks, soft locks, corrupt transitions, or unclassified stops**. It also demonstrates that the deterministic study policy is not universally completing: 20/32 seeds stop at explicit legal-attempt or policy ceilings. Those stops limit what automation can say about pacing and must not be re-labelled as player failures or balance defects.

P14V-05 is complete for its historical artifact under the stated exit criterion: one reproducible retained artifact exists and no verified game-origin hard/soft lock remained unresolved in that corpus. Public sign-off remains `HOLD`. The current package is reopened for a separately named replacement-candidate JSON/interpretation pair; do not overwrite this historical artifact. P14V-06 waits for replacement P14V-02, hosted P14V-03, and candidate-specific P14V-05 before freezing its schema-v3 cohort. P14V-08 must interpret future human evidence independently of either bot completion rate.

The earlier one-seed dirty-worktree smoke remains tooling-only and is not included in this corpus.
