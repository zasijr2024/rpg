# P14V-2026-07-12 Evidence Index

Program authority: `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`

Status: P14V-01 evidence contracts, P14V-02 clean reproduction, and P14V-04 policy validity are complete on candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18`; hosted CI, the 32-seed corpus, human, assistive-technology, decision, and tag evidence remain pending.

| Package | Required artifact                                                                                           | Current state                                   |
| ------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| P14V-01 | `P14V-01-evidence-contracts.md` with gate semantics, human-schema checks, and real-time Space-fixture proof | implemented and recorded against the dirty worktree; clean reproduction belongs to P14V-02 |
| P14V-02 | `P14V-02-clean-reproduction.md` with exact revision, clean status, environment, and technical RC result     | done; clean technical RC passed on `d3696de` |
| P14V-03 | `P14V-03-hosted-ci.md` with change-lane and manual technical-RC workflow URLs/IDs on one SHA                | pending                                         |
| P14V-04 | `P14V-04-policy-validity.md` with before/after classification of the original four failures                 | done; clean candidate reproduced 4/4 with no failures |
| P14V-05 | `P14V-05-progression-32-seed.json` plus `P14V-05-progression-corpus.md` interpretation                       | fail-closed runner ready; clean 32-seed artifact pending |
| P14V-06 | de-identified JSON records under `REMAKE/playtests/sessions/` plus `P14V-06-human-playtests.md`             | 0 sessions; collection blocked by P14V-05       |
| P14V-07 | `P14V-07-screen-reader-evidence.md`                                                                         | template ready; operator evidence pending        |
| P14V-08 | `P14V-08-release-decision.md` with dated `GO` or `HOLD`, license, NOTICE, and mode decision                 | pending                                         |
| P14V-09 | `P14V-09-final-tag.md` with final SHA, tag, clean gate, hosted run, and P14V-aware verification             | pending                                         |

Every artifact must record the exact Git revision it covers. Never combine study or human results across behavior-changing revisions without separating the cohorts.
