# P14V-06 Unassisted Human Playtests

Candidate revision: `PENDING_POST_REMEDIATION_FREEZE`
Status: `WAITING_FOR_P14V_02_P14V_03_P14V_05`
Valid sessions: `0`
Required minimum: `5`
Maximum conflict-resolution sample: `8`

The July candidate and artifact below are historical automation evidence. No
human records were collected against them, and schema v3 plus the 2026-07-30
remediation retired that empty cohort. Human collection must wait for a new
clean production revision/artifact, hosted required-check proof, replacement
candidate corpus, and declared cohort/ruleset/mode policy.

## Cohort Identity

| Field                  | Required/recorded value                                              |
| ---------------------- | -------------------------------------------------------------------- |
| Revision               | `PENDING`                                                            |
| Ruleset                | `original`                                                           |
| Mode policy            | `PENDING` (`classic-locked`, `hyper-locked`, or `timeline-recorded`) |
| Cohort ID              | `PENDING`                                                            |
| Production artifact ID | `PENDING`                                                            |
| Operator protocol      | `REMAKE/playtests/README.md`                                         |
| Session schema         | version 3                                                            |
| Session directory      | `REMAKE/playtests/sessions/`                                         |
| Experience eligibility | release floor: `first-time` only                                     |
| Conflict rule          | `PENDING_PREREGISTRATION_BEFORE_SESSION_1`                           |

## Collection Status

No qualifying session records exist. The bare `npm run study:human:gate` is
expected to fail closed because frozen-candidate arguments are absent; this is
not a product failure. After each real session, run `npm run study:human`.
After at least five valid unique first-time records, run:

```text
npm run study:human:gate -- --expected-revision=<C> --expected-artifact-id=<A> --expected-cohort-id=<cohort> --expected-ruleset=<ruleset> --expected-mode-policy=<policy>
```

Retain active/wall distributions here. Internal record consistency without
that external candidate binding cannot close P14V-06.

The old artifact identity remains retained in `P14V-06-production-artifact.json`
as historical evidence only. Before every new session, the operator must run
`npm run artifact:identity -- --dir=<candidate-dist> --expect=<new-artifact-id>`
against the exact `dist/` being served.

## Result

`PENDING` - requires P14V-03/P14V-05 and real unassisted first-time
participants. P14V-06 remains open; P14R-09 closes only when this package
passes.
