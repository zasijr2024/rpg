# Phase 14 Release-Readiness Evidence Plan

- Date: 2026-07-12
- Last reconciled: 2026-08-01
- Program: `P14V-2026-07-12`
- Role: P14V evidence and completion contract
- Active sequence: `phase-14-post-remediation-next-steps-2026-07-30.md`
- Active checkpoint map: `phase-14-p14v-02-checkpoint-map-2026-07-30.md`
- Authorities: root `AGENTS.md`, `phase-14-roast-remediation-2026-07-11.md`, `REPORTS/current_prototype_full_roasting_audit_2026-07-11.md`, `REPORTS/remake_full_evaluation_roast_and_remediation_2026-07-30.md`, and `docs/tech-decisions.md#td-017-original-mode-keeps-source-authentic-balance-rough-edges`

## Objective

Turn the completed Phase 14 implementation into a reproducible, evidence-backed release decision. This program does not reopen parity. Evidence tooling and collection contracts are repository-side work; the remaining candidate cycle must close a post-remediation clean checkpoint, hosted CI/required-check proof, a candidate-specific multi-seed corpus, unassisted playtests, a real nonvisual Space flight, an explicit balance/public-distribution decision, production-host smoke, and non-circular tag authorization/verification.

Current verdict: **HOLD for public Release Candidate sign-off**. Revisions `d3696de` and `6de3979` retain historical evidence. Current candidate `275c096247e5fe2026e00c1f67eb78cd4668ccaf` passed P14V-02's clean Node 24 technical RC gate, P14V-05's separately named 32-seed corpus with zero game-defect or unclassified stops, and P14V-03's hosted change-lane/full-RC plus enforced required context. Artifact `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c` remains identical. No schema-v3 unassisted sessions are recorded, and Space has not been flown end-to-end with a real screen reader on the candidate. Repository-side MPL-2.0, NOTICE, public artifact copies, and source-derived inventory are implemented; the durable exact-source URL, any distribution-specific legal review, product/release-owner sign-off, production-host smoke, and final tag remain external/open.

No commit, push, pull request, workflow dispatch, tag, balance change, or human-evidence claim is authorized by this planning document.

## Evidence Rules

- Every automated result must name the exact Git revision, command, environment, and result.
- `npm run gate:rc` is necessary automated evidence; it is not human pacing or screen-reader evidence.
- The progression bot is a deterministic policy probe, not a human proxy. Its completion rate must never be presented as a player completion rate.
- Human sessions in one decision cohort must use the same production revision. A behavior or balance change starts a new cohort; old sessions remain historical evidence.
- The release floor counts only first-time participants and must be bound to the explicitly frozen revision, canonical `sha256-tree-v1` artifact, cohort, ruleset, and mode policy. Internal consistency or self-reported strings alone are insufficient.
- A real screen-reader observation cannot be filled from axe, ARIA snapshots, source inspection, or a sighted Canvas run.
- Source-authentic friction is a product decision. A verified hard lock, corrupt state, or impossible legal recovery is a defect.
- Any candidate-changing fix invalidates later-stage evidence and returns the program to the clean reproduction gate.
- Historical artifacts remain immutable evidence for their recorded revision. They do not close a replacement candidate's candidate-specific package.
- Candidate `C` and artifact `A` may have a later evidence-only descendant `F` only when `git diff C..F` is limited to evidence/status/session records and a clean rebuild remains exactly `A`. Any product/public/build/configuration/dependency/workflow/runtime/balance or artifact change creates a new candidate.
- A tagged commit cannot contain its own future tag result or its own literal full hash. P14V-09 closes pre-tag authorization; tag creation/verification is the following release operation and produces append-only post-tag evidence.

## Package Order

| ID      | Package                                            | Depends on                         | Owner                  | Exit criterion                                                                                                                                                                                                                | Status                                                        |
| ------- | -------------------------------------------------- | ---------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| P14V-00 | Plan and document synchronization                  | none                               | engineering            | This plan, ledgers, runbooks, indexes, and evidence paths agree without claiming missing evidence                                                                                                                             | done                                                          |
| P14V-01 | Honest evidence gates and collection tooling       | P14V-00                            | engineering/release    | Closure recognizes P14R/P14V status; the study is diagnostic; the release floor is bound to one frozen first-time cohort/artifact; required CI always reports; real-time nonvisual Space is runnable without console controls | done                                                          |
| P14V-02 | Scope-safe checkpoint and clean reproduction       | P14V-01                            | maintainer             | Reviewed coherent commits exist on one post-remediation revision; a separate clean checkout with initialized submodules passes `npm ci` and the technical RC gate                                                             | done - `C2=275c096`; artifact unchanged                       |
| P14V-03 | Hosted CI validation                               | P14V-02                            | maintainer/repo admin  | Change-lane and manual full technical-RC workflows pass on the same revision; the stable always-reporting required context is enforced; run/ruleset URLs/IDs are recorded                                                     | done - runs `30700296963` / `30700299995`; ruleset `20083779` |
| P14V-04 | Progression-policy validity                        | P14V-02                            | engineering            | Every current four-seed result is classified; legal death and Workshop recovery are represented; remaining failures distinguish policy, game defect, and source-authentic friction                                            | done - `275c096` reconfirmed 4/4                              |
| P14V-05 | Fixed 32-seed progression corpus                   | P14V-02, P14V-04                   | engineering            | A separately named candidate-specific 32-seed summary records milestones, deaths, combats, events, bottlenecks, and classifications; no verified game-origin hard/soft lock remains                                           | done - `275c096`; 32/32 classified                            |
| P14V-06 | Unassisted production playtests                    | P14V-03, P14V-05                   | playtest operators     | At least 5 valid schema-v3 first-time records are bound to one frozen revision/artifact/cohort/ruleset/mode policy; continue up to 8 only under the preregistered inconsistency rule                                          | open - frozen cohort; 0/5                                     |
| P14V-07 | Real screen-reader Space and ending pass           | P14V-03, P14V-05                   | accessibility operator | All runbook scenarios pass on the candidate revision, including a complete real-time nonvisual Space flight and score ending; the evidence template has no `PENDING` fields                                                   | open - operator required; no valid run                        |
| P14V-08 | Release, balance, and public-distribution decision | P14V-03, P14V-05, P14V-06, P14V-07 | product/release owner  | A dated `GO` or `HOLD` classifies pacing evidence, verifies implemented license/NOTICE artifacts, supplies the durable exact-source URL and required review, and confirms original mode, an experiment, or a defect fix       | HOLD - owner/external prerequisites pending                   |
| P14V-09 | Final candidate and tag authorization              | P14V-08                            | maintainer             | Artifact-identical final evidence descendant, local/hosted gates, production-host smoke, source/license surfaces, immutable tag name/message, and pre-tag manifest are approved                                               | waiting for P14V-08                                           |

Critical path: `P14V-00 -> P14V-01 -> P14V-02 -> {P14V-03, P14V-05} -> {P14V-06, P14V-07} -> P14V-08 -> P14V-09 -> tag/verify/publish`. P14V-03 and P14V-05 run in parallel; scarce human and assistive-technology work starts only after both pass.

## Execution Detail

### P14V-01 - Make The Evidence Contracts Honest

Historical P14V-01 implementation steps, completed before the original candidate freeze and preserved here as the contract:

1. Decide and encode whether `gate:rc` means a technical automated RC or full product sign-off. The then-current closure parser read historical `RA-*` packages only, so it could approve a final tag while P14R/P14V evidence remained open.
2. Rename or describe the progression command as a diagnostic. Its exit `0` means every seed produced a classified result, not that progression quality passed.
3. Version the human-session schema and validator before recruitment. Schema v3 requires unique record IDs, one exact post-remediation revision/artifact/ruleset/mode policy per cohort, first-time/experience status, consent attestation, wall start/end, reconciled foreground-active/background-open/closed-page time, timestamped Classic/Hyper exposure, active and wall milestones/deaths, technical exceptions/exclusions, and completion/abandonment consistency. The gate rejects duplicate, mixed, or internally unreconciled records.
4. Replace the frozen `?testHarness=1&testSeed=space-slice` manual scenario with a development-only real-time fixture that seeds Ship-ready state, starts the normal runtime clock, exposes no `__adrTest` console controls, and permits the full one-minute flight through ordinary keyboard input. Retain served-`dist` Space route loading as separate production evidence.
5. Add focused tooling/browser tests for these contracts and update the runbook and sample record before inviting operators.
6. Current addendum: bind `study:human:gate` to explicit frozen candidate/cohort inputs, require first-time participants and canonical tree hashes for the release floor, make the required PR context report on every pull request, and define the non-circular pre-tag/post-tag handshake before freezing the replacement candidate.

The 2026-07-30 addendum is implemented and locally verified at
`REPORTS/remediation/P14V-2026-07-12/P14V-01-post-remediation-evidence-contract-addendum.md`.

Historical exit rule: the repository can state exactly what automation proves, invalid human records fail closed, and the required Space observation is physically runnable. Schema v3 later superseded the original collection shape before any human evidence was gathered; current tooling retains the same fail-closed boundary.

### P14V-02 - Scope-Safe Checkpoint And Clean Reproduction

Phase 0 result: the read-only audit is complete in
`phase-14-p14v-02-checkpoint-map-2026-07-30.md`. It accounts for all 122 dirty
paths as three proposed dependency-ordered checkpoints plus one protected
user-owned worksheet. On 2026-07-30 the maintainer approved the exact groups,
selected `0.1.0-rc.1`, and authorized staging/committing only their listed
paths. Separate clean Node 24 reproduction follows checkpoint formation.

1. Review every tracked, untracked, deleted, and submodule change. Resolve ownership before staging; do not assume all current changes belong to one commit.
2. Group the accepted work into coherent commits. Keep source/data baseline changes, Phase 9-14 parity work, roast remediation, and planning/evidence changes separable where the actual diff permits it.
3. Use the authorized candidate package version `0.1.0-rc.1`; it does not grant public `GO` or authorize an RC tag.
4. Create a separate clean clone or worktree at the resulting revision, initialize submodules recursively, run `npm ci` under Node 24, install the three Playwright release browsers, and run `npm run gate:rc` from `REMAKE/`.
5. Record the revision, clean status before/after, Node/npm/OS versions, complete gate result, and `sha256-tree-v1` artifact. Rebuild once and prove the same identity.
6. Create a new versioned P14V-02 record; do not overwrite the historical `P14V-02-clean-reproduction.md`.

Failure rule: fix on the working branch, create a new candidate revision, and repeat the clean-checkout gate. Do not tag the first merely clean revision.

Historical completion 2026-07-14: revision `d3696de28218bb6c7645302398e1a4b5fe7cba18` was reproduced from detached worktree `F:\ADR20-P14V-02` with the pinned submodule initialized. `npm ci`, release-browser installation, and `npm run gate:rc` passed; the technical RC gate exited `0` after 1,434.4 seconds. Later remediation superseded that candidate, so P14V-02 is reopened for a new clean revision/artifact. The old record remains at `REPORTS/remediation/P14V-2026-07-12/P14V-02-clean-reproduction.md` and must not be relabelled as current.

Current completion 2026-07-30: candidate `6de3979955719ffae80dd25a7a429d8f8a595368` passed a clean Node 24 technical RC gate in 1,605.3 seconds with both dependency audits at zero vulnerabilities. Its 16-file, 646,179-byte artifact identity `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c` reproduced after a second build. The separately authorized evidence record is `REPORTS/remediation/P14V-2026-07-12/P14V-02-clean-reproduction-2026-07-30-6de3979.md`.

Current hosted-candidate completion 2026-08-01: candidate `275c096247e5fe2026e00c1f67eb78cd4668ccaf` passed a clean Node 24 technical RC gate in 1,541.6 seconds and reproduced the same 16-file, 646,179-byte artifact. See `REPORTS/remediation/P14V-2026-07-12/P14V-02-clean-reproduction-2026-08-01-275c096.md`.

### P14V-03 - Hosted CI Validation

1. Push the reviewed branch and open a pull request only when the maintainer authorizes those external actions.
2. Confirm `Clean install and production verification` passes from GitHub's checkout, including submodules, `npm ci`, parity, types, unit/content, lint, format, build/budgets, dependency audit, and bounded served-production smoke in Chromium, Firefox, and WebKit.
3. Manually dispatch `Scheduled cross-browser Release Candidate gate` for the same SHA rather than waiting for the weekly schedule.
4. Require the stable `Remake CI required` context in the target branch protection/ruleset. It must report for every pull request while the expensive remake verification remains scope-gated.
5. Record workflow URLs/IDs, SHA, attempts, failures/retries, and branch-protection/ruleset URL or ID in the evidence directory.

Failure rule: a local/hosted mismatch is a release blocker. Correct the workflow or product, then return to `P14V-02` (or P14V-01 if evidence semantics changed); do not waive it as an environment quirk without a documented root cause.

Completion 2026-08-01: pull-request run `30700296963` and manually dispatched full-RC run `30700299995` passed on `275c096`. Active strict default-branch ruleset `20083779` requires `Remake CI required` with no bypass actor. Failures and workflow-only remediations are retained in `REPORTS/remediation/P14V-2026-07-12/P14V-03-hosted-ci.md`.

### P14V-04 And P14V-05 - Pacing Diagnosis Before Tuning

The original fixed four-seed result was 0/4: three first-expedition deaths and one Workshop recovery failure. The corrected policy completes 4/4 without changing game balance or injecting state/outcomes. Historical revision `d3696de` reproduced that result inside its clean technical RC gate, closing P14V-04 for that diagnostic artifact:

1. Add decision/checkpoint evidence sufficient to distinguish an invalid bot choice, missing legal recovery, deterministic game defect, and source-authentic slow economy.
2. Make the policy respond to ordinary death and resource shortfall using only production commands. It may not inject state, force events, or cherry-pick RNG.
3. Re-run the original four seeds and retain before/after classifications.
4. Run a fixed 32-seed corpus. The existing `PHASE14_STUDY_SEEDS` and `PHASE14_STUDY_START` controls may be sharded, but one deterministic aggregate artifact must own the result.
5. Report completion and milestone distributions, deaths, events, combats, stage failures, and bottlenecks. Do not invent a completion-rate threshold after seeing the data.

The P14V-05 runner is implemented as `npm run study:progression:corpus`. It executes deterministic shards, validates the fixed formula and exact requested coverage, rejects duplicate/missing/extra/mutated seeds and unclassified stops, and writes one schema-versioned JSON artifact with the revision, starting worktree state, Node/npm/platform environment, command, distributions, failures, bottlenecks, and ordered per-seed evidence. Formal execution refuses a dirty worktree; `--allow-dirty` is reserved for provisional tooling diagnostics and cannot satisfy P14V-05.

Clean-candidate aggregate (2026-07-14): the `npm run study:progression` stage of `npm run gate:rc` completed 4/4 seeds with 11 legal deaths, 6,748 incidental events, 439 combats, no failures, and completion-time distribution min `335918000`, median `435625000`, p90/max `514696000` simulated ms. This remains diagnostic policy evidence, not player completion evidence and not the retained P14V-05 corpus.

Retained historical P14V-05 corpus (2026-07-14): the exact old candidate completed the eight-shard 32-seed command in 2,424.8 seconds. The artifact records 12 study-policy completions, 161 legal deaths, 42,692 incidental events, 2,937 combats, 20 policy-classified stops, zero game-defect stops, and zero unclassified stops. The diagnostic completion rate is not a player completion rate. See `REPORTS/remediation/P14V-2026-07-12/P14V-05-progression-corpus.md`.

Replacement-candidate result (2026-07-30): clean candidate `6de3979` completed the formal eight-shard command without `--allow-dirty` in 2,536.9 seconds. The date/SHA-qualified artifact records 12 study-policy completions, 161 legal deaths, 42,692 incidental events, 2,937 combats, 20 policy-classified stops, zero game-defect stops, and zero unclassified stops. All 32 exact seeds are present once, and the historical pair remains unchanged. See `REPORTS/remediation/P14V-2026-07-12/P14V-05-progression-corpus-2026-07-30-6de3979.md`.

Hosted-candidate result (2026-08-01): clean candidate `275c096` completed the formal corpus in 2,493.9 seconds with the same classified totals and no game-defect or unclassified stop. The retained JSON SHA-256 is `EAE43D923FAD5F5F83FF165668135CAFC6D54622238823CD5D5D0C91BCE40564`. See `REPORTS/remediation/P14V-2026-07-12/P14V-05-progression-corpus-2026-08-01-275c096.md`.

Go/no-go rule: any reproducible game-origin hard lock, impossible recovery, or corrupt transition is `HOLD` and a defect. Policy failure is repaired in the study. Source-authentic grind or dominant strategy is carried into `P14V-08` and does not silently mutate original mode.

### P14V-06 - Human Evidence

After P14V-03 and P14V-05 pass, use `playtests/README.md` and schema v3. Five unique first-time, same-cohort sessions are the release-evidence floor; preregister the meaning of material inconsistency before session one, then add sessions one at a time up to eight only when that rule is met.

Historical operator preparation completed 2026-07-14 for cohort `p14v-2026-07-14-d3696de-original-01`, but that version-2 cohort predates the remediation/schema-v3 contract and is retired without collecting release evidence. Current binding is revision `275c096247e5fe2026e00c1f67eb78cd4668ccaf`, artifact `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`, cohort `p14v-2026-08-01-275c096-original-classic-01`, ruleset `original`, and mode policy `classic-locked`; `artifact:identity` must match before each session. The package remains at 0/5.

- Serve only the production build and normal URL; no debug mode, test harness, route hints, or optimal worker/map advice.
- Record timestamped foreground-active and wall milestones/deaths, reconciled background-open and closed-page time, mode exposure, completion/abandonment, and participant-language bottlenecks without personal data.
- Validate after each record with `npm run study:human`; close the minimum gate with `npm run study:human:gate`.
- Invoke the release gate with explicit `--expected-revision`,
  `--expected-artifact-id`, `--expected-cohort-id`, `--expected-ruleset`, and
  `--expected-mode-policy`. A bare gate exits `2` rather than inferring its
  candidate from session records.
- Preserve incomplete and abandoned sessions. They are evidence, not failed test data to discard.

Go/no-go rule: a repeated verified blocker pauses the cohort for diagnosis. Any behavior-changing fix creates a new revision cohort. There is no automatic human completion-rate threshold in this phase; `P14V-08` owns the product interpretation.

### P14V-07 - Real Assistive-Technology Evidence

After P14V-03 and P14V-05 pass, follow `docs/accessibility-screen-reader-runbook.md` on the candidate revision with at least one real supported desktop screen reader. Narrator is available on the current host; an NVDA second pass is recommended but is not a substitute for completing the required scenario.

- Repeat Room, World, Combat, and Space/ending on the candidate revision; the 2026-07-10 Room/World/Combat record remains historical evidence for an older worktree.
- Complete the one-minute flight without inspecting the Canvas or using a mouse.
- Record actual initial feed, danger, recovery, ending, focus, duplication, and interruption observations in `REPORTS/remediation/P14V-2026-07-12/P14V-07-screen-reader-evidence.md`.
- Re-run the automated cross-browser accessibility lane and retain the served-production Space lazy-route result separately.

Any missing warning, unusable flight, trapped/lost focus, or ambiguous ending is a defect. Fixing it creates a new candidate and repeats affected evidence.

### P14V-08 And P14V-09 - Decide, Reproduce, Authorize, Then Tag

Classify each material result before changing rules:

| Finding class                                                        | Required decision                                                                             |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Remake defect or impossible legal recovery                           | Fix the default ruleset and repeat affected gates/evidence                                    |
| Study-policy defect                                                  | Fix the policy; do not change the game                                                        |
| Source-authentic rough edge with tolerable human evidence            | Preserve original mode and document the tradeoff                                              |
| Source-authentic rough edge judged unsuitable for a broader audience | Preserve original mode; scope a separately named, save-compatible balanced mode as later work |

The decision record must state `GO` or `HOLD`, the exact revision/evidence set, residual risks, and whether any follow-up mode is merely proposed or actually in release scope. A named balanced mode is not automatically authorized by adverse pacing evidence.

Repository-side licensing is implemented: `LICENSE`, `NOTICE.md`, production `LICENSE.txt`/`NOTICE.txt`, and the conservative source-derived inventory exist under the MPL-2.0 decision. Public distribution still requires a durable URL for the exact corresponding source revision, placement of that URL alongside the executable, distribution-specific dependency/media review, any qualified legal review the owner requires, and a dated product/release-owner decision. An engineering-green candidate does not grant publication authority.

After the decision, form a final evidence-only descendant `F` of product candidate `C`. Prove the diff is restricted to evidence/status/session records and a clean rebuild still equals artifact `A`; otherwise return to P14V-02. Repeat the clean technical RC gate, hosted manual workflow, and dependency audit on `F`. Deploy only with explicit authority and smoke the actual production host: exact artifact/source/license surfaces, fresh load/save/reload, late lazy routes, and forced chunk abort followed by query-suffixed retry. Record this as manual/operator evidence unless a real parameterized host command is implemented before freeze.

Resolve the tag circularity in two phases. The final pre-tag manifest embedded in `F` states "revision: the commit containing this manifest, resolved by the annotated tag," exact artifact `A`, approved tag name/message, gate/host results, and P14V-08 authorization. Mark P14V-09 `done` only when that pre-tag authorization is complete. Then create the authorized local annotated tag, run `closure:verify-tag -- <tag>`, publish only after `PASS`, and retain the resolved full SHA/tag result in an append-only post-tag evidence record. Never claim the tagged commit knew the outcome of a future operation.

## Completion Definition

The program is complete only when:

- evidence tooling and closure semantics fail closed for open P14R/P14V, mixed cohorts, and the real-time Space requirement;
- a clean exact revision passes local and hosted technical Release Candidate gates;
- the replacement candidate's policy-valid 32-seed report contains no unresolved game-origin hard/soft lock;
- at least five valid schema-v3 human sessions exist in one post-remediation cohort, expanded up to eight when results remain inconsistent;
- a real screen reader completes Space and the score ending on the candidate revision;
- the product/release owner records the original-mode/balance decision, verifies repository license/NOTICE artifacts, and closes the exact-source URL and any external legal-review requirements; and
- P14V-09's artifact-identical final manifest, actual-host smoke, and tag authorization are complete; and
- the following local tag verification passes before publication, with resolved tag/SHA retained as post-tag evidence.

Until then, the honest label is: **Phase 14 parity and repository-side roast remediation implemented in an uncommitted Production Beta integration; clean Release Candidate evidence remains open**.
