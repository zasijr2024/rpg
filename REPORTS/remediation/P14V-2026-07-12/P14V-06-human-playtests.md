# P14V-06 Unassisted Human Playtests

Candidate revision: `275c096247e5fe2026e00c1f67eb78cd4668ccaf`
Status: `OPEN_FOR_OPERATOR_COLLECTION`
Valid sessions: `0`
Required minimum: `5`
Maximum conflict-resolution sample: `8`

The July candidates remain historical automation evidence and collected no
human records. Candidate automation and hosted controls now pass on the frozen
August binding below. No human result is inferred from those automated gates.

## Cohort Identity

| Field                  | Required/recorded value                                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revision               | `275c096247e5fe2026e00c1f67eb78cd4668ccaf`                                                                                                                                                                            |
| Ruleset                | `original`                                                                                                                                                                                                            |
| Mode policy            | `classic-locked`                                                                                                                                                                                                      |
| Cohort ID              | `p14v-2026-08-01-275c096-original-classic-01`                                                                                                                                                                         |
| Production artifact ID | `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`                                                                                                                                             |
| Operator protocol      | `REMAKE/playtests/README.md`                                                                                                                                                                                          |
| Session schema         | version 3                                                                                                                                                                                                             |
| Session directory      | `REMAKE/playtests/sessions/`                                                                                                                                                                                          |
| Experience eligibility | release floor: `first-time` only                                                                                                                                                                                      |
| Conflict rule          | At five valid first-time sessions, add one at a time up to eight while completion/abandonment is split 2/3 or no primary bottleneck appears in at least three records; stop when neither condition holds or at eight. |

## Collection Status

No qualifying session records exist. The bare `npm run study:human:gate` is
expected to fail closed because frozen-candidate arguments are absent; this is
not a product failure. After each real session, run `npm run study:human`.
After at least five valid unique first-time records, run:

```text
npm run study:human:gate -- --expected-revision=275c096247e5fe2026e00c1f67eb78cd4668ccaf --expected-artifact-id=sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c --expected-cohort-id=p14v-2026-08-01-275c096-original-classic-01 --expected-ruleset=original --expected-mode-policy=classic-locked
```

Retain active/wall distributions here. Internal record consistency without
that external candidate binding cannot close P14V-06.

The old artifact identity remains retained in `P14V-06-production-artifact.json`
as historical evidence only. The current identity is retained in
`P14V-06-production-artifact-2026-08-01-275c096.json`. Before every new
session, the operator must run
`npm run artifact:identity -- --dir=<candidate-dist> --expect=sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`
against the exact `dist/` being served.

## Result

`PENDING` - requires real unassisted first-time participants. P14V-06 remains
open at 0/5; P14R-09 closes only when this package passes.
