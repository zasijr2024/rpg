# P14V-2026-07-12 Evidence Index

Program authority: `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`

Status: P14V-01, P14V-02, P14V-04, and P14V-05 are complete on candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18`; hosted CI, human, assistive-technology, decision, and tag evidence remain pending.

| Package | Required artifact                                                                                           | Current state                                   |
| ------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| P14V-01 | `P14V-01-evidence-contracts.md` with gate semantics, human-schema checks, and real-time Space-fixture proof | done; historical dirty-tree execution is superseded for candidate cleanliness by completed P14V-02 |
| P14V-02 | `P14V-02-clean-reproduction.md` with exact revision, clean status, environment, and technical RC result     | done; clean technical RC passed on `d3696de` |
| P14V-03 | `P14V-03-hosted-ci.md` with change-lane and manual technical-RC workflow URLs/IDs on one SHA                | blocked; no configured Git remote               |
| P14V-04 | `P14V-04-policy-validity.md` with before/after classification of the original four failures                 | done; clean candidate reproduced 4/4 with no failures |
| P14V-05 | `P14V-05-progression-32-seed.json` plus `P14V-05-progression-corpus.md` interpretation                       | done; 32-seed artifact retained with 0 game-defect/unclassified results |
| P14V-06 | de-identified JSON records under `REMAKE/playtests/sessions/` plus `P14V-06-human-playtests.md`             | cohort/artifact frozen; ready for operators; 0/3 minimum sessions |
| P14V-07 | `P14V-07-screen-reader-evidence.md`                                                                         | template ready; operator evidence pending        |
| P14V-08 | `P14V-08-release-decision.md` with dated `GO` or `HOLD`, license, NOTICE, and mode decision                 | HOLD; prerequisites and owner decision pending  |
| P14V-09 | `P14V-09-final-tag.md` with final SHA, tag, clean gate, hosted run, and P14V-aware verification             | waiting for P14V-08; no tag created             |

Every artifact must record the exact Git revision it covers. Never combine study or human results across behavior-changing revisions without separating the cohorts.
