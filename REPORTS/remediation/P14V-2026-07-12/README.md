# P14V-2026-07-12 Evidence Index

Program authority: `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`

Status: collection contracts, their consolidated P14V-01 implementation record, and the fixed-corpus runner are implemented; clean-candidate, hosted, corpus, human, assistive-technology, decision, and tag evidence remain pending. This directory must not convert ready tooling into a passed candidate-evidence claim.

| Package | Required artifact                                                                                           | Current state                                   |
| ------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| P14V-01 | `P14V-01-evidence-contracts.md` with gate semantics, human-schema checks, and real-time Space-fixture proof | implemented and recorded against the dirty worktree; clean reproduction belongs to P14V-02 |
| P14V-02 | `P14V-02-clean-reproduction.md` with exact revision, clean status, environment, and technical RC result     | path inventory recorded; ownership, checkpoint, and clean gate pending |
| P14V-03 | `P14V-03-hosted-ci.md` with change-lane and manual technical-RC workflow URLs/IDs on one SHA                | pending                                         |
| P14V-04 | `P14V-04-policy-validity.md` with before/after classification of the original four failures                 | provisional 4/4 in dirty worktree; clean-candidate reproduction pending |
| P14V-05 | `P14V-05-progression-32-seed.json` plus `P14V-05-progression-corpus.md` interpretation                       | fail-closed runner ready; clean 32-seed artifact pending |
| P14V-06 | de-identified JSON records under `REMAKE/playtests/sessions/` plus `P14V-06-human-playtests.md`             | 0 sessions; collection blocked by P14V-05       |
| P14V-07 | `P14V-07-screen-reader-evidence.md`                                                                         | template ready; operator evidence pending        |
| P14V-08 | `P14V-08-release-decision.md` with dated `GO` or `HOLD`, license, NOTICE, and mode decision                 | pending                                         |
| P14V-09 | `P14V-09-final-tag.md` with final SHA, tag, clean gate, hosted run, and P14V-aware verification             | pending                                         |

Every artifact must record the exact Git revision it covers. Never combine study or human results across behavior-changing revisions without separating the cohorts.
