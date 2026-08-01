# P14V-05 Replacement Candidate Progression Corpus

Date completed: 2026-07-30
Status: **DONE - retained 32-seed artifact validated on clean candidate `6de3979`**

This is deterministic study-policy evidence. Its completion rate is not a
player completion rate, and its incomplete runs are not automatically game
defects. P14V-06 owns human pacing evidence; P14V-08 owns the product decision.

## Candidate Binding

- Candidate revision:
  `6de3979955719ffae80dd25a7a429d8f8a595368`
- Candidate artifact:
  `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`
- Starting worktree: clean detached P14V-02 checkout at
  `C:\tmp\adr20-p14v02-6de3979`
- ORIGINAL submodule:
  `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`
- Package version: `0.1.0-rc.1`

## Execution Contract

- Node/npm/platform: Node `v24.18.1`; npm `11.7.0`; `win32` `x64`
- Fixed range: seed indexes `0..31`
- Sharding: eight deterministic four-seed shards with two concurrent jobs
- Exact recorded command:
  `node scripts/progression-corpus.mjs --seeds=32 --start=0 --shard-size=4 --jobs=2 --output=F:/ADR20/REPORTS/remediation/P14V-2026-07-12/P14V-05-progression-32-seed-2026-07-30-6de3979.json`
- Runner exit: `0` after 2,536.9 seconds wall time
- Validation: exact formula/range coverage, no duplicate/missing/extra/mutated
  seeds, classified incomplete outcomes, consistent completion state, and
  milestone bounds
- Focused corpus-tooling verification:
  `node node_modules/vitest/vitest.mjs run src/tests/tooling/progression-corpus.test.ts --reporter=dot`
  passed 3/3

## Retained Artifact

- Path: `P14V-05-progression-32-seed-2026-07-30-6de3979.json`
- Schema/kind: version `1`, `phase14-progression-corpus`
- Size: 518,780 bytes
- SHA-256:
  `8D61EF3E650D915A6C05A6575856657B14AF8FD9D0E052F029B57F84352F2C33`
- Recorded revision:
  `6de3979955719ffae80dd25a7a429d8f8a595368`
- Recorded starting worktree: `clean`
- Coverage: 32 unique deterministic seeds, each present exactly once

The historical 2026-07-14 JSON/Markdown pair for `d3696de` remains unchanged.
This date/SHA-qualified pair is the replacement-candidate evidence and does not
relabel the historical artifact.

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

For the 12 completed runs, simulated completion time ranged from `335918000`
to `759881000` ms, with median `391759000` and p90 `514696000`. All completed
runs reached Executioner, Ship, Space, and the score ending.

Incomplete stage distribution:

- 4 stopped in `first-expedition`, all after four legal Coal Mine attempts;
- 16 stopped in `deep-economy`.

The most frequent retained policy bottlenecks were Battlefield exhaustion after
eight legal attempts (6), Coal Mine exhaustion after four attempts (4), and
Executioner Medical exhaustion after eight attempts (3). Seven other policy
bottlenecks occurred once each: City attempts, a combat polling ceiling,
cured-meat outfit targeting, Executioner Command, Executioner Engineering,
Martial branch attempts, and Sulphur Mine attempts.

## Interpretation And Decision

The corpus validates that the runner covers the exact fixed seed range and that
every incomplete outcome is retained and classified. It found **zero verified
game-origin hard locks, soft locks, corrupt transitions, or unclassified
stops**. It also demonstrates that the deterministic study policy is not
universally completing: 20/32 seeds stop at explicit legal-attempt or policy
ceilings. Those stops limit what automation can say about pacing and must not
be relabelled as player failures or balance defects.

P14V-05 is complete for candidate `6de3979` under the stated exit criterion:
one reproducible retained artifact exists, all 32 exact seeds are present once,
every stop is classified, and no verified game-origin hard/soft lock remains
unresolved. Public sign-off remains `HOLD`. P14V-03 hosted CI and enforced
required-check evidence must still pass on the same candidate before P14V-06
human collection or P14V-07 real-screen-reader work begins.

## Evidence Commit Binding

The JSON and this interpretation were committed in evidence descendant
`1d505dc8069ea55d688ae67d0bdd523908b0bc56`. Its 17-path `C..F` delta is limited
to evidence/status records, and a clean Node 24 rebuild at `F` reproduced the
candidate artifact exactly. P14V-03 is deferred; this corpus remains valid but
does not unlock operator collection by itself.

Finalized local handoff `ca177fee971c71f0cb7a09b571989af3dc1b3849`
extends the candidate lineage to 19 evidence/status paths only. A separate clean
Node 24 build at that checkpoint reproduced the same artifact and retained the
same seven honest closure blockers.
