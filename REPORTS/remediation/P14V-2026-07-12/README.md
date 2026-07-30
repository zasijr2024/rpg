# P14V-2026-07-12 Evidence Index

- Session authority: root `AGENTS.md`
- Operational authority: `REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md`
- Evidence authority: `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`

Status: the P14V-01 tooling contract is current; its earlier execution record
and P14V-02/P14V-04/P14V-05 artifacts remain historical evidence on candidate
`d3696de28218bb6c7645302398e1a4b5fe7cba18`. The 2026-07-30 remediation requires
a new clean candidate and separately named candidate-specific P14V-05 corpus.
Hosted CI/required protection, schema-v3 human, assistive-technology, final owner
decision, production-host smoke, and tag authorization/verification remain open.

| Package | Required artifact                                                                                       | Current state                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P14V-01 | `P14V-01-evidence-contracts.md` plus `P14V-01-post-remediation-evidence-contract-addendum.md`           | tooling contract current; candidate-bound human gate, always-reporting required check, and tag handshake locally verified                      |
| P14V-02 | `P14V-02-clean-reproduction.md` with exact revision, clean status, environment, and technical RC result | historical pass on `d3696de`; new post-remediation reproduction required                                                                       |
| P14V-03 | `P14V-03-hosted-ci.md` with required-check/ruleset and both hosted workflow URLs/IDs on one SHA         | always-reporting control implemented locally; blocked by no configured Git remote/run/ruleset                                                  |
| P14V-04 | `P14V-04-policy-validity.md` with before/after classification of the original four failures             | method done; historical candidate reproduced 4/4; replacement confirmation runs inside P14V-02                                                 |
| P14V-05 | immutable historical JSON/interpretation plus a new date/SHA-qualified replacement candidate pair       | reopened; historical artifact retained with 0 game-defect/unclassified results, replacement corpus pending                                     |
| P14V-06 | de-identified JSON records under `REMAKE/playtests/sessions/` plus `P14V-06-human-playtests.md`         | schema v3 ready; new candidate/cohort required; 0/5 sessions                                                                                   |
| P14V-07 | `P14V-07-screen-reader-evidence.md`                                                                     | waiting for new candidate and operator evidence                                                                                                |
| P14V-08 | `P14V-08-release-decision.md` with dated `GO` or `HOLD`, license, NOTICE, and mode decision             | interim engineering HOLD; repository license/NOTICE and Classic policy recorded; accountable owner decision and external prerequisites pending |
| P14V-09 | `P14V-09-final-tag.md` with pre-tag authorization manifest and append-only post-tag result              | waiting for P14V-08; no tag authorized or created                                                                                              |

Every artifact must record the exact Git revision it covers. Never combine study or human results across behavior-changing revisions without separating the cohorts.

Candidate `C`/artifact `A` may have an evidence-only descendant `F` only when
the diff is limited to evidence/status/session records and a clean rebuild
remains `A`. P14V-09 closes pre-tag authorization; tag creation,
`closure:verify-tag`, and publication are the following operation and produce
append-only post-tag evidence.
