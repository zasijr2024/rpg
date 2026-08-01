# P14V-2026-07-12 Evidence Index

- Session authority: root `AGENTS.md`
- Operational authority: `REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md`
- Evidence authority: `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`

Status: the P14V-01 tooling contract is current. Historical candidate
`6de3979955719ffae80dd25a7a429d8f8a595368` and handoff `ca177fe` retain
their local evidence. Current hosted candidate
`275c096247e5fe2026e00c1f67eb78cd4668ccaf` passed P14V-02, P14V-03, and
P14V-05 with artifact
`sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`.
Evidence descendant `1d505dc8069ea55d688ae67d0bdd523908b0bc56` is
17 evidence/status paths ahead of the candidate and cleanly rebuilds the same
artifact with all three technical gates `READY`.
Finalized local handoff `ca177fee971c71f0cb7a09b571989af3dc1b3849`
extends that lineage to 19 evidence/status paths and independently reproduces
the same artifact with all three technical gates `READY`.
Candidates `d3696de` and `6de3979` retain historical corpora. Candidate
`275c096` has a separately named 32-seed corpus with every stop classified
and zero game-defect or unclassified stops. Hosted CI and required protection
passed; schema-v3 human, assistive-technology, final owner decision,
production-host smoke, and tag authorization/verification remain open.

| Package | Required artifact                                                                                         | Current state                                                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P14V-01 | `P14V-01-evidence-contracts.md` plus `P14V-01-post-remediation-evidence-contract-addendum.md`             | tooling contract current; candidate-bound human gate, always-reporting required check, and tag handshake locally verified                      |
| P14V-02 | historical records plus `P14V-02-clean-reproduction-2026-08-01-275c096.md`                                | done; clean Node 24 pass on `C2=275c096`; artifact unchanged                                                                                   |
| P14V-03 | `P14V-03-hosted-ci.md` with required-check/ruleset and both hosted workflow URLs/IDs on one SHA           | done; runs `30700296963` / `30700299995`; active strict ruleset `20083779`                                                                     |
| P14V-04 | `P14V-04-policy-validity.md` with before/after classification of the original four failures               | done; `275c096` reconfirmed 4/4 with zero policy/game-defect/unclassified failures                                                             |
| P14V-05 | immutable historical pairs plus `P14V-05-progression-{32-seed,corpus}-2026-08-01-275c096.*`               | done on clean `275c096`: 32/32 classified; zero game-defect/unclassified stops                                                                 |
| P14V-06 | `P14V-06-production-artifact-2026-08-01-275c096.json`, human record, and de-identified session JSON files | open; frozen cohort `p14v-2026-08-01-275c096-original-classic-01`; 0/5                                                                         |
| P14V-07 | `P14V-07-screen-reader-evidence.md`                                                                       | open; candidate frozen; no valid real-AT run                                                                                                   |
| P14V-08 | `P14V-08-release-decision.md` with dated `GO` or `HOLD`, license, NOTICE, and mode decision               | interim engineering HOLD; repository license/NOTICE and Classic policy recorded; accountable owner decision and external prerequisites pending |
| P14V-09 | `P14V-09-final-tag.md` with pre-tag authorization manifest and append-only post-tag result                | waiting for P14V-08; no tag authorized or created                                                                                              |

Every artifact must record the exact Git revision it covers. Never combine study or human results across behavior-changing revisions without separating the cohorts.

Candidate `C`/artifact `A` may have an evidence-only descendant `F` only when
the diff is limited to evidence/status/session records and a clean rebuild
remains `A`. P14V-09 closes pre-tag authorization; tag creation,
`closure:verify-tag`, and publication are the following operation and produce
append-only post-tag evidence.
