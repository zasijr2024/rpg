# Phase 14 Release-Readiness Evidence Plan

Date: 2026-07-12  
Program: `P14V-2026-07-12`  
Authorities: `phase-14-roast-remediation-2026-07-11.md`, `REPORTS/current_prototype_full_roasting_audit_2026-07-11.md`, and `docs/tech-decisions.md#td-017-original-mode-keeps-source-authentic-balance-rough-edges`

## Objective

Turn the completed Phase 14 implementation into a reproducible, evidence-backed release decision. This program does not reopen parity. It first makes the evidence tooling honest, then closes the remaining delivery and human-evidence gaps: a clean checkpoint, hosted CI proof, a valid multi-seed policy study, unassisted playtests, a real nonvisual Space flight, an explicit balance and public-distribution decision, and a clean Release Candidate tag.

Current verdict: **HOLD for public Release Candidate sign-off**. Candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18` passes the complete technical RC gate from a separate clean checkout, and its corrected four-seed policy diagnostic reproduces 4/4 with no failures. Hosted CI has not yet run, the retained 32-seed corpus is still missing, no unassisted sessions are recorded, and current Space support has not been flown end-to-end with a real screen reader. Closure remains fail-closed for P14R/P14V, and the larger corpus, operator evidence, remake license/NOTICE decision, product sign-off, and final tag remain open.

No commit, push, pull request, workflow dispatch, tag, balance change, or human-evidence claim is authorized by this planning document.

## Evidence Rules

- Every automated result must name the exact Git revision, command, environment, and result.
- `npm run gate:rc` is necessary automated evidence; it is not human pacing or screen-reader evidence.
- The progression bot is a deterministic policy probe, not a human proxy. Its completion rate must never be presented as a player completion rate.
- Human sessions in one decision cohort must use the same production revision. A behavior or balance change starts a new cohort; old sessions remain historical evidence.
- A real screen-reader observation cannot be filled from axe, ARIA snapshots, source inspection, or a sighted Canvas run.
- Source-authentic friction is a product decision. A verified hard lock, corrupt state, or impossible legal recovery is a defect.
- Any candidate-changing fix invalidates later-stage evidence and returns the program to the clean reproduction gate.

## Package Order

| ID      | Package                                            | Depends on                         | Owner                  | Exit criterion                                                                                                                                                                                                                                     | Status                             |
| ------- | -------------------------------------------------- | ---------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| P14V-00 | Plan and document synchronization                  | none                               | engineering            | This plan, ledgers, runbooks, indexes, and evidence paths agree without claiming missing evidence                                                                                                                                                  | done                               |
| P14V-01 | Honest evidence gates and collection tooling       | P14V-00                            | engineering/release    | Closure recognizes P14R/P14V status or explicitly separates technical RC from product sign-off; the study is labelled diagnostic; human records enforce one valid cohort; a real-time nonvisual Space fixture is runnable without console controls | done                               |
| P14V-02 | Scope-safe checkpoint and clean reproduction       | P14V-01                            | maintainer             | Reviewed coherent commits exist on one revision; a separate clean checkout with initialized submodules passes `npm ci` and the technical RC gate                                                                                                   | done - `d3696de`                   |
| P14V-03 | Hosted CI validation                               | P14V-02                            | maintainer             | The change-lane job and manually dispatched full technical-RC job pass on the same revision; run URLs/IDs are recorded                                                                                                                             | pending                            |
| P14V-04 | Progression-policy validity                        | P14V-02                            | engineering            | Every current 0/4 failure is classified; legal death and Workshop recovery are represented; remaining failures distinguish policy, game defect, and source-authentic friction                                                                      | done - clean candidate 4/4         |
| P14V-05 | Fixed 32-seed progression corpus                   | P14V-04                            | engineering            | A versioned, reproducible 32-seed run emits one retained summary with milestones, deaths, combats, events, bottlenecks, and classified failures; no verified game-origin hard/soft lock remains                                                    | runner ready; corpus pending       |
| P14V-06 | Unassisted production playtests                    | P14V-05                            | playtest operators     | At least 3 valid same-revision, unique-participant records pass the strengthened gate; normally continue to 5 and up to 8 if outcomes remain inconsistent                                                                                          | pending                            |
| P14V-07 | Real screen-reader Space and ending pass           | P14V-02                            | accessibility operator | All runbook scenarios pass on the candidate revision, including a complete real-time nonvisual Space flight and score ending; the evidence template has no `PENDING` fields                                                                        | pending                            |
| P14V-08 | Release, balance, and public-distribution decision | P14V-03, P14V-05, P14V-06, P14V-07 | product/release owner  | A dated `GO` or `HOLD` classifies pacing evidence, resolves the remake license, supplies required NOTICE/attribution, and confirms original mode, a separately scoped named mode, or a defect fix                                                  | pending                            |
| P14V-09 | Final clean gate and tag                           | P14V-08                            | maintainer             | All decision-driven changes are re-gated locally and in hosted CI; the exact clean revision is tagged and the P14V-aware tag verification passes                                                                                                   | pending                            |

Critical path: `P14V-00 -> P14V-01 -> P14V-02 -> P14V-04 -> P14V-05 -> P14V-06 -> P14V-08 -> P14V-09`. `P14V-03` and `P14V-07` may run in parallel once `P14V-02` freezes a candidate.

## Execution Detail

### P14V-01 - Make The Evidence Contracts Honest

Before freezing a candidate:

1. Decide and encode whether `gate:rc` means a technical automated RC or full product sign-off. The current closure parser reads historical `RA-*` packages only, so it may approve a final tag while P14R/P14V evidence remains open.
2. Rename or describe the current progression command as a diagnostic. Its exit `0` means every seed produced a classified result, not that progression quality passed.
3. Version the human-session schema and validator before recruitment. Require unique record IDs, one exact revision/ruleset per cohort, first-time/experience status, consent attestation, environment/artifact identity, active-play sittings, structured death events, defined milestones, technical exceptions/exclusions, and completion/abandonment consistency. The gate must reject duplicate or mixed-revision records.
4. Replace the frozen `?testHarness=1&testSeed=space-slice` manual scenario with a development-only real-time fixture that seeds Ship-ready state, starts the normal runtime clock, exposes no `__adrTest` console controls, and permits the full one-minute flight through ordinary keyboard input. Retain served-`dist` Space route loading as separate production evidence.
5. Add focused tooling/browser tests for these contracts and update the runbook and sample record before inviting operators.

Exit rule: the repository can state exactly what automation proves, invalid human records fail closed, and the required Space observation is physically runnable. Until then, do not collect final operator evidence.

### P14V-02 - Scope-Safe Checkpoint And Clean Reproduction

1. Review every tracked, untracked, deleted, and submodule change. Resolve ownership before staging; do not assume all current changes belong to one commit.
2. Group the accepted work into coherent commits. Keep source/data baseline changes, Phase 9-14 parity work, roast remediation, and planning/evidence changes separable where the actual diff permits it.
3. Create a separate clean clone or worktree at the resulting revision, initialize submodules recursively, run `npm ci`, install the three Playwright release browsers, and run `npm run gate:rc` from `REMAKE/`.
4. Record the revision, clean `git status --short`, Node/npm versions, and complete gate result under `REPORTS/remediation/P14V-2026-07-12/`.

Failure rule: fix on the working branch, create a new candidate revision, and repeat the clean-checkout gate. Do not tag the first merely clean revision.

Completed 2026-07-14: candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18` was reproduced from detached worktree `F:\ADR20-P14V-02` with the pinned submodule initialized. `npm ci`, release-browser installation, and `npm run gate:rc` passed; the technical RC gate exited `0` after 1,434.4 seconds. See `REPORTS/remediation/P14V-2026-07-12/P14V-02-clean-reproduction.md`.

### P14V-03 - Hosted CI Validation

1. Push the reviewed branch and open a pull request only when the maintainer authorizes those external actions.
2. Confirm `Clean install and production verification` passes from GitHub's checkout, including submodules, `npm ci`, parity, types, unit/content, lint, format, build/budgets, dependency audit, and production Chromium smoke.
3. Manually dispatch `Scheduled cross-browser Release Candidate gate` for the same SHA rather than waiting for the weekly schedule.
4. Record workflow URLs/IDs, SHA, attempts, and failures/retries in the evidence directory.

Failure rule: a local/hosted mismatch is a release blocker. Correct the workflow or product, then return to `P14V-02` (or P14V-01 if evidence semantics changed); do not waive it as an environment quirk without a documented root cause.

### P14V-04 And P14V-05 - Pacing Diagnosis Before Tuning

The original fixed four-seed result was 0/4: three first-expedition deaths and one Workshop recovery failure. The corrected policy completes 4/4 without changing game balance or injecting state/outcomes. Candidate `d3696de` reproduced that result inside the clean technical RC gate, closing P14V-04:

1. Add decision/checkpoint evidence sufficient to distinguish an invalid bot choice, missing legal recovery, deterministic game defect, and source-authentic slow economy.
2. Make the policy respond to ordinary death and resource shortfall using only production commands. It may not inject state, force events, or cherry-pick RNG.
3. Re-run the original four seeds and retain before/after classifications.
4. Run a fixed 32-seed corpus. The existing `PHASE14_STUDY_SEEDS` and `PHASE14_STUDY_START` controls may be sharded, but one deterministic aggregate artifact must own the result.
5. Report completion and milestone distributions, deaths, events, combats, stage failures, and bottlenecks. Do not invent a completion-rate threshold after seeing the data.

The P14V-05 runner is implemented as `npm run study:progression:corpus`. It executes deterministic shards, validates the fixed formula and exact requested coverage, rejects duplicate/missing/extra/mutated seeds and unclassified stops, and writes one schema-versioned JSON artifact with the revision, starting worktree state, Node/npm/platform environment, command, distributions, failures, bottlenecks, and ordered per-seed evidence. Formal execution refuses a dirty worktree; `--allow-dirty` is reserved for provisional tooling diagnostics and cannot satisfy P14V-05.

Clean-candidate aggregate (2026-07-14): the `npm run study:progression` stage of `npm run gate:rc` completed 4/4 seeds with 11 legal deaths, 6,748 incidental events, 439 combats, no failures, and completion-time distribution min `335918000`, median `435625000`, p90/max `514696000` simulated ms. This remains diagnostic policy evidence, not player completion evidence and not the retained P14V-05 corpus.

Go/no-go rule: any reproducible game-origin hard lock, impossible recovery, or corrupt transition is `HOLD` and a defect. Policy failure is repaired in the study. Source-authentic grind or dominant strategy is carried into `P14V-08` and does not silently mutate original mode.

### P14V-06 - Human Evidence

Use the P14V-01-upgraded `playtests/README.md` and session schema. Three sessions are the repository minimum and yield preliminary evidence. Normally continue to five unique first-time participants; add sessions one at a time up to eight if completion, abandonment, or bottleneck outcomes remain materially inconsistent.

- Serve only the production build and normal URL; no debug mode, test harness, route hints, or optimal worker/map advice.
- Record milestone minutes, deaths, completion/abandonment, and participant-language bottlenecks without personal data.
- Validate after each record with `npm run study:human`; close the minimum gate with `npm run study:human:gate`.
- Preserve incomplete and abandoned sessions. They are evidence, not failed test data to discard.

Go/no-go rule: a repeated verified blocker pauses the cohort for diagnosis. Any behavior-changing fix creates a new revision cohort. There is no automatic human completion-rate threshold in this phase; `P14V-08` owns the product interpretation.

### P14V-07 - Real Assistive-Technology Evidence

After P14V-01 supplies the real-time fixture, follow `docs/accessibility-screen-reader-runbook.md` on the candidate revision with at least one real supported desktop screen reader. Narrator is available on the current host; an NVDA second pass is recommended but is not a substitute for completing the required scenario.

- Repeat Room, World, Combat, and Space/ending on the candidate revision; the 2026-07-10 Room/World/Combat record remains historical evidence for an older worktree.
- Complete the one-minute flight without inspecting the Canvas or using a mouse.
- Record actual initial feed, danger, recovery, ending, focus, duplication, and interruption observations in `REPORTS/remediation/P14V-2026-07-12/P14V-07-screen-reader-evidence.md`.
- Re-run the automated cross-browser accessibility lane and retain the served-production Space lazy-route result separately.

Any missing warning, unusable flight, trapped/lost focus, or ambiguous ending is a defect. Fixing it creates a new candidate and repeats affected evidence.

### P14V-08 And P14V-09 - Decide, Reproduce, Tag

Classify each material result before changing rules:

| Finding class                                                        | Required decision                                                                             |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Remake defect or impossible legal recovery                           | Fix the default ruleset and repeat affected gates/evidence                                    |
| Study-policy defect                                                  | Fix the policy; do not change the game                                                        |
| Source-authentic rough edge with tolerable human evidence            | Preserve original mode and document the tradeoff                                              |
| Source-authentic rough edge judged unsuitable for a broader audience | Preserve original mode; scope a separately named, save-compatible balanced mode as later work |

The decision record must state `GO` or `HOLD`, the exact revision/evidence set, residual risks, and whether any follow-up mode is merely proposed or actually in release scope. A named balanced mode is not automatically authorized by adverse pacing evidence.

Public distribution also requires the open remake-license decision to be resolved, MPL-2.0/source-derived obligations to be reviewed, and the required NOTICE/attribution artifact to exist. An engineering-green candidate without those artifacts is not approved for public distribution.

After the decision, repeat the clean technical RC gate, hosted manual workflow, document synchronization, and dependency audit on the final SHA. Only then create the chosen RC tag and verify it with the P14V-aware tag check established in P14V-01. The current historical-only `closure:verify-tag` output is not sufficient until that work is complete.

## Completion Definition

The program is complete only when:

- evidence tooling and closure semantics fail closed for open P14R/P14V, mixed cohorts, and the real-time Space requirement;
- a clean exact revision passes local and hosted technical Release Candidate gates;
- the policy-valid 32-seed report contains no unresolved game-origin hard/soft lock;
- at least three valid human sessions exist, normally expanded to five and up to eight when results remain inconsistent;
- a real screen reader completes Space and the score ending on the candidate revision;
- the product/release owner records the original-mode/balance decision and closes the license/NOTICE requirements; and
- the P14V-aware clean tag verification passes with all documents pointing to the same evidence.

Until then, the honest label is: **Phase 14 parity and roast implementation complete; Release Candidate evidence in progress**.
