# P14V-08 Release, Balance, And Public-Distribution Decision

Candidate revision: `PENDING_POST_REMEDIATION_FREEZE`
Status: `HOLD_EXTERNAL_EVIDENCE_AND_OWNER_SIGN_OFF`
Evidence-status date: `2026-07-30`
Final decision date: `PENDING`
Decision owner: `PENDING`

## Prerequisites

| Package                         | State                                                               |
| ------------------------------- | ------------------------------------------------------------------- |
| P14V-03 hosted CI               | blocked: no configured remote or hosted run evidence                |
| P14V-05 fixed corpus            | historical artifact retained; replacement candidate corpus reopened |
| P14V-06 unassisted playtests    | open: 0/5 schema-v3 sessions; new cohort required                   |
| P14V-07 real screen-reader pass | open: operator evidence pending                                     |

## Required Decision Fields

- Public decision: `HOLD` (interim engineering/evidence verdict; accountable owner decision pending)
- Automated-policy interpretation: historical diagnostic evidence only; not a player completion rate
- Human pacing/comprehension interpretation: `PENDING`
- Real assistive-technology interpretation: `PENDING`
- Original-mode/balance policy: repository policy keeps Classic source-authentic; Balanced Experiment A is proposed and evidence-gated, not release scope; final owner approval remains pending
- Remake-code license: repository choice `MPL-2.0`; durable source URL and any required qualified review remain pending
- NOTICE/attribution artifact: implemented in source and production-public files
- Exact corresponding-source URL: `PENDING`
- Distribution-specific dependency/media/legal review: `PENDING`
- Authorized production host and rollback owner: `PENDING`
- Repository-proposed release scope and known limitations: desktop, silent Classic beta; mobile/touch, audio, localization expansion, and original-save import remain deferred; final owner approval remains pending

The historical technical RC pass and automated corpus do not authorize the
post-remediation tree or public distribution. This record remains `HOLD` until
a new candidate passes clean local and hosted gates, its replacement corpus and
five valid first-time human sessions exist, the real assistive-technology pass
exists, the corresponding source has a durable public URL, and an accountable
owner signs the final decision. The historical corpus is context only.
