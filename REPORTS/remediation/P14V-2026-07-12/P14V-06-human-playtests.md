# P14V-06 Unassisted Human Playtests

Candidate revision: `d3696de28218bb6c7645302398e1a4b5fe7cba18`
Status: `READY_FOR_PLAYTEST_OPERATORS`
Valid sessions: `0`
Required minimum: `3`
Normal target: `5`

P14V-05 has frozen the eligible original-ruleset cohort revision and retained its separate automated corpus. Human collection may now begin under `REMAKE/playtests/README.md`. Automation, developer-guided play, debug/test-harness sessions, duplicate participants, mixed revisions, or invented records do not qualify.

## Cohort Identity

| Field | Required/recorded value |
| --- | --- |
| Revision | `d3696de28218bb6c7645302398e1a4b5fe7cba18` |
| Ruleset | `original` |
| Cohort ID | `PENDING` - one stable de-identified cohort ID chosen before session 1 |
| Production artifact ID | `PENDING` - SHA-256 of the exact served candidate build, reused for the cohort |
| Operator protocol | `REMAKE/playtests/README.md` |
| Session schema | version 2 |
| Session directory | `REMAKE/playtests/sessions/` |

## Collection Status

No qualifying session records exist. `npm run study:human:gate` is therefore expected to fail at 0/3 and must not be treated as a product failure. After each real session, run `npm run study:human`; after at least three valid unique-participant records, run `npm run study:human:gate` and retain the same-revision summary here.

## Result

`PENDING` - requires real unassisted participants. P14V-06 remains open.
