# P14V-08 Release, Balance, And Public-Distribution Decision

Candidate revision: `275c096247e5fe2026e00c1f67eb78cd4668ccaf`
Status: `HOLD_EXTERNAL_EVIDENCE_AND_OWNER_SIGN_OFF`
Evidence-status date: `2026-08-01`
Final decision date: `PENDING`
Decision owner: `PENDING`

## Prerequisites

| Package                         | State                                                                    |
| ------------------------------- | ------------------------------------------------------------------------ |
| P14V-03 hosted CI               | done: both hosted lanes and strict required ruleset pass on candidate    |
| P14V-05 fixed corpus            | done: 32/32 classified on candidate; zero game-defect/unclassified stops |
| P14V-06 unassisted playtests    | open: frozen schema-v3 cohort; 0/5 sessions                              |
| P14V-07 real screen-reader pass | open: operator evidence pending                                          |

## Required Decision Fields

- Public decision: `HOLD` (interim engineering/evidence verdict; accountable owner decision pending)
- Automated-policy interpretation: candidate-specific 32-seed diagnostic passed with every outcome classified; not a player completion rate
- Human pacing/comprehension interpretation: `PENDING`
- Real assistive-technology interpretation: `PENDING`
- Original-mode/balance policy: repository policy keeps Classic source-authentic; Balanced Experiment A is proposed and evidence-gated, not release scope; final owner approval remains pending
- Remake-code license: repository choice `MPL-2.0`; durable source URL and any required qualified review remain pending
- NOTICE/attribution artifact: implemented in source and production-public files
- Exact corresponding-source URL: `PENDING`
- Distribution-specific dependency/media/legal review: `PENDING`
- Authorized production host and rollback owner: `PENDING`
- Repository-proposed release scope and known limitations: desktop, silent Classic beta; mobile/touch, audio, localization expansion, and original-save import remain deferred; final owner approval remains pending

The current clean local/hosted technical gates and automated corpus do not
authorize public distribution. This record remains `HOLD` until five valid
first-time human sessions exist, the real assistive-technology pass exists, the
corresponding source has a durable public URL, and an accountable owner signs
the final decision.
