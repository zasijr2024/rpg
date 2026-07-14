# P14V-06 Unassisted Human Playtests

Candidate revision: `d3696de28218bb6c7645302398e1a4b5fe7cba18`
Status: `COHORT_AND_ARTIFACT_FROZEN_READY_FOR_PLAYTEST_OPERATORS`
Valid sessions: `0`
Required minimum: `3`
Normal target: `5`

P14V-05 has frozen the eligible original-ruleset cohort revision and retained its separate automated corpus. Human collection may now begin under `REMAKE/playtests/README.md`. Automation, developer-guided play, debug/test-harness sessions, duplicate participants, mixed revisions, or invented records do not qualify.

## Cohort Identity

| Field | Required/recorded value |
| --- | --- |
| Revision | `d3696de28218bb6c7645302398e1a4b5fe7cba18` |
| Ruleset | `original` |
| Cohort ID | `p14v-2026-07-14-d3696de-original-01` |
| Production artifact ID | `sha256:619c6a8eefc27000a99c621a3bb3e6c656034830f2531eccc7dc1da881060e1e` (`sha256-tree-v1`, 14 files, 614,649 bytes) |
| Operator protocol | `REMAKE/playtests/README.md` |
| Session schema | version 2 |
| Session directory | `REMAKE/playtests/sessions/` |

## Collection Status

No qualifying session records exist. `npm run study:human:gate` is therefore expected to fail at 0/3 and must not be treated as a product failure. After each real session, run `npm run study:human`; after at least three valid unique-participant records, run `npm run study:human:gate` and retain the same-revision summary here.

The artifact identity is retained in `P14V-06-production-artifact.json`. It was measured from the clean detached candidate worktree, then measured again after a fresh `npm run build`; both directory identities matched. Before every session, the operator must run `npm run artifact:identity -- --dir=<candidate-dist> --expect=sha256:619c6a8eefc27000a99c621a3bb3e6c656034830f2531eccc7dc1da881060e1e` from the evidence-tooling checkout against the exact `dist/` that will be served.

## Result

`PENDING` - requires real unassisted participants. P14V-06 remains open.
