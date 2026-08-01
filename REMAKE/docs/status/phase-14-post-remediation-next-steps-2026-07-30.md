# Phase 14 Post-Remediation Next Steps

- Date: 2026-07-30
- Status: **candidate automation complete; operator evidence open; public Release Candidate remains `HOLD`**
- Immediate packages: P14V-06 human cohort and P14V-07 real-screen-reader evidence in parallel on frozen candidate `275c096`

## Authority And Purpose

This document owns the live execution sequence after the 2026-07-30 evaluation
and remediation. It does not replace:

- root `AGENTS.md`, which owns new-session behavior and safety boundaries;
- `REMAKE/docs/context.md`, which owns the concise current truth;
- `REMAKE/docs/planning.md`, which owns package states;
- `phase-14-release-readiness-plan-2026-07-12.md`, which owns P14V evidence and
  completion contracts;
- `REMAKE/docs/release-gates.md`, which owns executable gate semantics; or
- `REPORTS/remake_full_evaluation_roast_and_remediation_2026-07-30.md`, which
  remains the audit and local verification record.

Where an execution detail here conflicts with a P14V exit criterion, the
evidence contract wins and this plan must be corrected. Historical artifacts
remain immutable evidence for their recorded revision.

This plan authorizes documentation updates only. It does **not** authorize
staging, committing, pushing, opening a pull request, dispatching hosted CI,
tagging, publishing, or deploying.

## Current Snapshot

- Branch: `remake/parity`.
- Integration base: `b0e9222aa3fa2ddebc83761c19536732ba321de8`.
- Source worktree: protected user worksheet and pre-existing local evidence edits remain excluded; current evidence work is isolated in a clean candidate worktree.
- Source submodule: `ORIGINAL/` pinned at
  `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`.
- Git remote: authenticated private repository `https://github.com/zasijr2024/rpg.git`.
- Candidate `C2`: `275c096247e5fe2026e00c1f67eb78cd4668ccaf`.
- Artifact `A`: `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c` (`sha256-tree-v1`, 16 files, 646,179 bytes).
- Technical RC: clean Node 24 gate passed on `C2`; artifact identity unchanged.
- Hosted CI: pull-request run `30700296963` and manual full-RC run `30700299995` passed on `C2`.
- Required protection: active strict ruleset `20083779` requires `Remake CI required` on the default branch with no bypass actor.
- Public RC: `HOLD`.
- Historical clean candidate: `d3696de28218bb6c7645302398e1a4b5fe7cba18`.
- Historical P14V-05 corpus: retained for `d3696de`, not current-candidate
  evidence.
- Current P14V-05 corpus: retained for `275c096`; 32/32 seeds classified, 12
  study-policy completions, 20 policy stops, and zero game-defect or
  unclassified stops.
- Frozen operator cohort: `p14v-2026-08-01-275c096-original-classic-01`;
  ruleset `original`; mode policy `classic-locked`.
- Human cohort: 0/5 valid schema-v3 sessions.
- User-owned untracked worksheet:
  `REMAKE/playtests/feedback/p14v-local-session-01.md`; preserve it and do not
  count it as release evidence.

Reverify all snapshot facts before acting. The current local artifact identity
in the July 30 report identifies only the dirty integration build.

## Planning Pressure-Test

The shortest honest path is not "run everything again." It is to spend evidence
in risk order:

```text
0. Reconcile scope and ownership
              |
              v
1. Freeze/reproduce one clean P14V-02 SHA + artifact
              |
       +------+------+
       |             |
       v             v
2a. Hosted CI   2b. New 32-seed corpus
    P14V-03         P14V-05
       |             |
       +------+------+
              |
       +------+------+
       |             |
       v             v
3a. Human 5-8   3b. Real AT flight
    P14V-06         P14V-07
       |             |
       +------+------+
              |
              v
4. Owner/legal/distribution decision P14V-08
              |
              v
5. Production smoke + final gates + P14V-09 authorization
              |
              v
6. Authorized tag -> verify -> publish
```

The four-seed P14V-04 candidate confirmation is already part of `gate:rc` in
step 1. Its method/classification contract remains complete. The 32-seed corpus
is separate from `gate:rc`; because remediation changed behavior and tooling,
P14V-05 is reopened for one replacement-candidate artifact. The 2026-07-14
corpus remains valid historical evidence and must not be overwritten.

Any behavior, dependency, build, or evidence-contract change after candidate
freeze returns the sequence to P14V-02. Later evidence for the replaced SHA is
retained as historical, not carried forward.

Candidate lineage uses product candidate `C` and artifact identity `A`.
Evidence collected later may be committed in a final descendant `F` only when
`git diff C..F` is restricted to evidence/status/session records and a clean
rebuild remains exactly `A`. A source, public asset, build/configuration,
dependency, workflow, runtime, balance, or artifact change creates a new
candidate and invalidates downstream evidence. This permits honest evidence
commits without pretending operators used a future commit.

## Phase 0 - Scope And Ownership Reconciliation

- Owner: maintainer with engineering support
- External authority required: no, for read-only inspection and planning
- Engineering status: **read-only audit complete**; the exact path accounting,
  protected worksheet, proposed three-checkpoint sequence, and verification
  scopes are recorded in
  `phase-14-p14v-02-checkpoint-map-2026-07-30.md`
- Human status: **approved 2026-07-30**; all three exact groups, candidate
  package version `0.1.0-rc.1`, and staging/committing only their listed paths
  were authorized; the protected worksheet remains excluded

Actions:

1. Capture `git status --short`, `git diff --stat`, `git diff --check`, current
   branch/HEAD, remote state, and the recorded `ORIGINAL` gitlink.
2. Review every tracked, untracked, deleted, renamed, and submodule path.
3. Classify each path as source baseline, product implementation, tests/fixtures,
   release tooling, current documentation, historical evidence, generated
   output, or user-owned material.
4. Identify overlapping or unexplained edits. Preserve them; do not infer
   ownership from timestamps or formatting.
5. Propose coherent commit groups and their exact file lists. Keep source/data
   baseline, product remediation, test/tooling, legal artifacts, and
   planning/evidence separable where the actual dependency graph permits.
6. Obtain explicit maintainer approval before staging or committing any group.
7. Before freeze, identify the repository admin, host/release operator,
   exact-source strategy, required legal review, human/AT owners, playtest mode
   policy, and whether the package moves from `0.1.0-beta.1` to an authorized RC
   version/tag convention. Any version change belongs in `C`.

Exit criteria:

- zero unexplained dirty paths;
- no modification inside `ORIGINAL/` and the gitlink remains pinned;
- the user-owned playtest worksheet is explicitly protected;
- `git diff --check` passes or every pre-existing exception is recorded;
- every proposed commit has a purpose, exact path list, dependency order, and
  verification scope;
- release version/tag naming and the non-circular tag handshake are approved;
- the maintainer has either approved the checkpoint plan or P14V-02 remains
  paused without pretending the worktree is a candidate.

Stop conditions:

- unknown ownership, unexplained source/submodule movement, or an accidental
  generated artifact;
- a required commit group would mix unrelated user work;
- the diff cannot be made coherent without discarding work.

## Phase 1 - P14V-02 Clean Candidate And Reproduction

- Owner: maintainer and engineering
- External authority required: explicit approval for staging/commits and any
  remote publication

Actions after approval:

1. Create the approved coherent checkpoints; do not amend or rewrite unrelated
   history.
2. Select one exact post-remediation SHA. Do not tag it yet.
3. Build once and record its `sha256-tree-v1` artifact identity.
4. Reproduce from a separate clean worktree or clone:
   - confirm the exact SHA and a clean status;
   - initialize the pinned `ORIGINAL` submodule;
   - use Node 24 and record Node/npm/OS versions;
   - run `npm ci`;
   - install the Chromium, Firefox, and WebKit versions required by Playwright;
   - run `npm run gate:rc` without `--allow-dirty`;
   - run `npm run artifact:identity` and confirm the expected tree identity.
5. Write a new record such as
   `REPORTS/remediation/P14V-2026-07-12/P14V-02-clean-reproduction-<date>-<shortsha>.md`.
   Link it from the P14V index. Do not overwrite the `d3696de` record.

Exit criteria:

- one reviewed SHA and complete artifact identity are frozen;
- separate checkout is clean and resolves to that SHA;
- pinned submodule and lockfile install are verified;
- `gate:rc` completes uninterrupted on all configured lanes;
- its included four-seed policy diagnostic is classified and green;
- the versioned evidence record contains exact commands, environment, duration,
  results, and residual risks.

Failure rule: fix on the working branch, create a new SHA/artifact, and repeat
the entire clean reproduction. A partial pass is diagnostic only.

## Phase 2 - Candidate Automation In Parallel

Start only after P14V-02 freezes one exact candidate.

### P14V-03 Hosted CI

- Owner: maintainer
- External authority required: remote configuration, push/PR or workflow
  dispatch, and branch-protection changes

Actions:

- configure the approved remote without rewriting local history;
- run the normal change lane and manually dispatched full technical-RC lane on
  the exact candidate SHA;
- configure branch protection to require the stable `Remake CI required` job;
  it reports on every pull request, succeeds without the expensive lane only
  for paths outside `.github/workflows/remake-ci.yml`, `.gitmodules`, `DATA/`,
  `ORIGINAL/`, and `REMAKE/`, and chains remake-owned changes to the full
  three-engine lane;
- retain run IDs, URLs, workflow revision, artifact identity, and environment;
- require the stable always-reporting `Remake CI required` context in the target
  branch ruleset and retain its ruleset URL/ID; do not require a conditional job
  that can remain pending on out-of-scope pull requests;
- record local/hosted differences rather than waiving them as platform noise.

Exit: both hosted lanes pass on the frozen SHA and required checks are actually
enforced. A local-only pass cannot close P14V-03.

### P14V-05 Replacement Candidate Corpus

- Owner: engineering
- External authority required: none beyond access to the frozen clean checkout

Actions:

- run the fixed 32-seed production-command corpus from the exact clean
  candidate without `--allow-dirty`;
- emit a new versioned JSON artifact, for example
  `P14V-05-progression-32-seed-<date>-<shortsha>.json`, plus a matching
  interpretation record;
- preserve the 2026-07-14 JSON/Markdown pair unchanged;
- report every milestone, legal death, event, combat, bottleneck, policy stop,
  game-defect stop, and unclassified stop;
- link the replacement artifact from the evidence index and package ledger.

Exit: all 32 exact seeds are present once, the artifact validates, no verified
game-origin hard/soft lock remains unresolved, and every stop is classified.
This is policy automation, not a human completion-rate estimate.

Completion 2026-07-30: **PASS** on clean candidate `6de3979`. The formal run
completed in 2,536.9 seconds under Node `v24.18.1` and npm `11.7.0`. Its
date/SHA-qualified JSON contains 12 study-policy completions, 161 legal deaths,
42,692 incidental events, 2,937 combats, 20 policy-classified stops, zero
game-defect stops, and zero unclassified stops. See
`REPORTS/remediation/P14V-2026-07-12/P14V-05-progression-corpus-2026-07-30-6de3979.md`.

Phase 2 exit requires both P14V-03 and P14V-05 green on the same candidate.
Do not spend human or assistive-technology operator time before that point.

Completion 2026-08-01: **PASS** on candidate `275c096`. Pull-request run
`30700296963`, manual full-RC run `30700299995`, and strict required
ruleset `20083779` close P14V-03. The separately retained 32-seed corpus
completed in 2,493.9 seconds with every outcome classified and zero
game-defect/unclassified stops, closing P14V-05 on the same SHA. Phase 2 exit
is met.

## Phase 3 - Operator Evidence In Parallel

Start only after the Phase 2 exit criteria are satisfied.

### P14V-06 Unassisted Human Cohort

Owner: playtest operators and product/release owner

- freeze cohort ID, exact SHA, artifact identity, ruleset, and mode policy;
- serve only the verified production artifact at the normal URL;
- collect at least five unique, first-time, unassisted schema-v3 sessions;
- validate each record and preserve incomplete/abandoned sessions;
- add sessions one at a time up to eight only if outcomes remain materially
  inconsistent;
- stop for data loss or a reproducible blocker; a fix starts a new cohort.

Exit: the fully bound command passes one same-candidate cohort:

```text
npm run study:human:gate -- --expected-revision=<C> --expected-artifact-id=<A> --expected-cohort-id=<cohort> --expected-ruleset=<ruleset> --expected-mode-policy=<policy>
```

The report records results without personal data or an invented success
threshold. The bare gate intentionally exits `2` because it may not infer the
candidate from self-reported session records.

### P14V-07 Real Assistive-Technology Pass

Owner: accessibility operator

- follow `REMAKE/docs/accessibility-screen-reader-runbook.md` on the exact
  candidate;
- repeat Room, World, Combat, and normal-clock Space/ending scenarios;
- hear/read actual output with a real supported desktop screen reader;
- record focus, interruption, danger, recovery, ending, and duplication
  observations; axe/ARIA automation is not a substitute;
- leave no `PENDING` observation fields.

Exit: the required scenarios pass on the candidate or a reproducible defect is
filed. A behavior fix invalidates the affected candidate evidence.

## Phase 4 - P14V-08 Decision And Publication Authority

Owner: accountable product/release owner, with the legal review they require

Inputs:

- exact candidate SHA/artifact and P14V-02 record;
- hosted P14V-03 runs and enforced checks;
- candidate-specific P14V-05 corpus;
- P14V-06 human cohort and P14V-07 real-AT evidence;
- shipped MPL-2.0/NOTICE/source-derived inventory;
- durable public URL for the exact corresponding source;
- distribution-specific dependency/media and required legal review.

Decision:

- record a dated `GO` or `HOLD` with accountable owner, evidence set, residual
  risks, and exact release mode;
- Classic remains the release ruleset unless a separately authorized experiment
  is explicitly scoped;
- Balanced Experiment A must not be smuggled into Classic as a "fix."

Exit: all decision fields are complete and publication authority is explicit.
Repository files alone cannot close this phase.

## Phase 5 - Production Smoke, Final Gates, And P14V-09

- Owner: maintainer
- External authority required: deployment, hosted runs, and tag creation

Actions after P14V-08 `GO`:

1. Apply any decision-driven change; if anything candidate-affecting changes,
   return to P14V-02 and repeat downstream evidence.
2. Form final evidence-only descendant `F`; prove `git diff C..F` is within the
   allowed evidence boundary and a clean rebuild still equals `A`.
3. On `F`, repeat the clean local technical RC gate and dependency audits.
4. Repeat the required hosted lanes on `F`.
5. Deploy only with explicit authorization and smoke the actual production
   host: exact artifact/source/license surfaces, fresh load/save/reload, late
   lazy routes, and forced chunk abort followed by query-suffixed retry. Treat
   this as manual/operator evidence unless a parameterized host command is
   implemented before candidate freeze.
6. Synchronize current status, evidence links, version, source URL, and release
   notes in the allowed evidence boundary.
7. Complete P14V-09's pre-tag manifest with exact artifact `A`, authorized tag
   name/message, gate/host results, and the symbolic revision "the commit
   containing this manifest, resolved by the annotated tag." Mark P14V-09 done
   only after this authorization is complete.
8. Create the authorized local annotated tag, run
   `npm run closure:verify-tag -- <tag>`, and publish only after `PASS`.
9. Retain the resolved full SHA/tag/publication result as append-only post-tag
   evidence. The tagged commit cannot contain its own future verification
   result or literal self-hash.

Exit criteria:

- final local and hosted gates are green on artifact-identical descendant `F`;
- production-host smoke passes;
- P14R-09 closes with P14V-06 and P14R-06 closes with P14V-07; the pre-tag
  package ledger has zero open P14R/P14V IDs;
- the tag resolves to HEAD, the tree is clean, and tag verification passes;
- every public artifact points to the exact corresponding source and evidence.

## Authority Matrix

| Action                                  | Responsible party           | Current state                    |
| --------------------------------------- | --------------------------- | -------------------------------- |
| Read-only diff/ownership audit          | engineering + maintainer    | complete; checkpoint map written |
| Stage/commit checkpoint groups          | maintainer                  | exact groups approved 2026-07-30 |
| Configure remote, push, PR, dispatch CI | maintainer                  | complete on `275c096`            |
| Run clean local reproduction/corpus     | engineering                 | P14V-02 and P14V-05 passed       |
| Configure required checks               | maintainer                  | active ruleset `20083779`        |
| Recruit/run human sessions              | playtest/product owner      | open; frozen cohort at 0/5       |
| Run real screen reader                  | accessibility operator      | open; no valid candidate run     |
| Exact-source/legal/public decision      | product/release owner       | external inputs open             |
| Deploy and production smoke             | maintainer/release operator | waits for P14V-08 `GO`           |
| Authorize final tag manifest            | maintainer                  | waits for all gates/host smoke   |
| Create/verify/publish tag               | maintainer                  | separate operation after P14V-09 |

## Immediate Next Action

Do not add more product features. P14V-02, P14V-03, and P14V-05 passed on
candidate `275c096` without changing artifact `A`; their separately named
evidence does not overwrite the `d3696de` or `6de3979` records. Any
candidate-changing edit restarts P14V-02 and invalidates downstream operator
evidence.

Run P14V-06 and P14V-07 in parallel using the frozen candidate, artifact,
cohort, ruleset, and mode policy. Human and real-screen-reader observations
must come from actual operators and cannot be inferred from automation. Honest
handoff: **candidate automation and enforced hosted controls pass; operator
packages are open at 0/5 and no valid real-AT run; public RC remains on HOLD.**
