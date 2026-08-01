# ADR20 Codex Session Guide

This is the first file to read in every Codex session. It applies to the whole
repository unless a nearer `AGENTS.md` adds narrower instructions.

## First 90 Seconds

Inspect the live repository before trusting a prior summary:

```text
git status --short
git diff --stat
git diff --check
git branch --show-current
git rev-parse HEAD
git remote -v
git ls-tree HEAD ORIGINAL
```

Then read these authorities in order:

1. `REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md`
2. `REMAKE/docs/status/phase-14-p14v-02-checkpoint-map-2026-07-30.md`, the
   exact dirty-path and proposed commit map
3. `REMAKE/docs/context.md`, beginning with **Current Authoritative Status**
4. `REMAKE/docs/planning.md`, the package-state ledger
5. `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`, the
   P14V evidence contract
6. `REMAKE/docs/release-gates.md` and `REMAKE/release-gates.json`
7. `REPORTS/remake_full_evaluation_roast_and_remediation_2026-07-30.md`, the
   assessment and local verification record
8. `REPORTS/remediation/P14V-2026-07-12/README.md`, the evidence index

Historical sections preserve project history and can contain superseded
wording. The current-status blocks, active next-steps plan, and package ledger
take precedence. For release work, also run `npm run closure:status` from
`REMAKE/` and report the expected blockers rather than hiding them.

## Current Truth - 2026-08-01

Reverify this snapshot at session start:

- Active branch: `remake/parity`.
- The remediation is organized as three maintainer-approved checkpoints
  descended from `b0e9222aa3fa2ddebc83761c19536732ba321de8`.
- Phase 14 parity and the repository-side findings in the 2026-07-30 roast are
  locally implemented and verified as a Production Beta integration.
- Historical candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18`
  and its diagnostic artifacts remain evidence for that revision only.
- Historical post-remediation candidate `6de3979` and finalized local handoff
  `ca177fe` retain their clean local evidence.
- Current hosted candidate `C2` is
  `275c096247e5fe2026e00c1f67eb78cd4668ccaf`; its clean Node 24 technical RC
  gate passed and artifact `A` remains
  `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`.
- Verified evidence checkpoint `F1` is
  `1d505dc8069ea55d688ae67d0bdd523908b0bc56`. `git diff C..F` contains 17
  evidence/status paths only, and a clean Node 24 `npm ci` plus `npm run build`
  reproduced exactly `A`; Parity, Production Beta, and Technical RC all report
  `READY` there.
- Finalized local handoff checkpoint `H` is
  `ca177fee971c71f0cb7a09b571989af3dc1b3849`. Its full `C..H` delta is 19
  evidence/status paths only; a separate clean Node 24 install/build again
  reproduced exactly `A`, with all three technical gates `READY`.
- The candidate-specific 32-seed P14V-05 corpus passed on `C2`: 12
  study-policy completions, 20 policy-classified stops, and zero game-defect or
  unclassified stops. This is automation evidence, not a player statistic.
- P14V-03 passed on `C2`: pull-request run `30700296963` and manual full-RC
  run `30700299995` succeeded, and active ruleset `20083779` strictly
  requires `Remake CI required` on the default branch with no bypass actor.
- Git remote `origin` is configured as the private repository
  `https://github.com/zasijr2024/rpg.git`; GitHub CLI is authenticated as its
  admin. Remote `remake/parity` and draft PR #1 point to `C2`.
- Public Release Candidate status is `HOLD`.
- P14V-02 Phase 0 is complete: all 122 pre-checkpoint dirty paths were
  classified, the three exact groups were approved, package version
  `0.1.0-rc.1` was selected, and only those groups were authorized for Git
  writes. The protected user worksheet remains excluded.
- The published lineage materializes the 124,776,960-byte AssetRipper
  executable through Git LFS. The workflow-only fixes materialize LFS inputs,
  reproduce canonical CRLF source checkout, and run the visual full-RC gate on
  Windows; the bounded change lane remains on Ubuntu.
- Human release evidence is 0/5 valid schema-v3 sessions.
- Operator binding is frozen as candidate `C2`, artifact `A`, cohort
  `p14v-2026-08-01-275c096-original-classic-01`, ruleset `original`, and
  mode policy `classic-locked`.
- The original source worktree retains its pre-existing evidence/status edits
  and protected untracked worksheet; neither is operator evidence.
- The current P14V-02 record owns the frozen candidate artifact identity. The
  earlier evaluation report's dirty-integration identity happens to match but
  is not the candidate proof.

Update this section whenever an authoritative candidate or gate state changes.

## Repository Boundaries

- `REMAKE/`: active TypeScript/Vite/React remake, tests, and release controls.
- `ORIGINAL/`: immutable source-reference submodule.
- `DATA/`: extracted/generated source and parity authority.
- `ANALYSE/`: authorial and design intent.
- `REPORTS/`: audits, remediation records, and release evidence.
- `REIMAGINED/` and `EXPANSION/`: later ideas, outside current Classic scope.

`ORIGINAL/` must remain pinned at
`1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`. Do not edit it. An intentional
baseline update requires maintainer authorization, regenerated canonical data,
and synchronized baseline documentation.

## Non-Negotiable Rules

- Preserve all existing tracked and untracked work. Inspect ownership before
  touching overlapping files.
- Preserve `REMAKE/playtests/feedback/p14v-local-session-01.md`. It is a
  user-owned, untracked worksheet; do not delete, overwrite, move, or count it
  as a completed schema-v3 session.
- Never use `git reset --hard`, destructive checkout, `git clean`, or bulk
  deletion to make the worktree appear clean.
- Do not bulk-stage this worktree. Classify every path before proposing commit
  groups.
- Do not stage, commit, amend, rebase, push, open a pull request, dispatch CI,
  tag, publish, or deploy without explicit maintainer authorization for that
  action. A code or documentation request is not Git/release authorization.
- Do not fabricate human, assistive-technology, hosted-CI, legal, publication,
  production-host, owner-decision, or tag evidence.
- Do not raise bundle, performance, accessibility, policy, or evidence budgets
  merely to obtain a green result.
- Do not ship development fixtures, debug surfaces, test harnesses, or direct
  state-injection APIs in the production bundle.
- Preserve Classic behavior. Balanced Experiment A is a preregistered proposal,
  not release scope; implementing it requires an explicit product decision.
- Keep deferred scope deferred: mobile, audio, localization, new content, and
  original-browser save import are not current release-readiness fixes.
- Do not place personal information in playtest or accessibility records.

## Evidence Boundaries

Never collapse distinct evidence classes:

- A dirty-tree pass is integration evidence, not clean-candidate evidence.
- `gate:rc` is a technical automated gate, not public-release approval.
- The controlled fresh-save spine proves reachability, not human pacing.
- Four-seed and 32-seed runs are policy diagnostics, not player completion
  rates.
- Axe, ARIA snapshots, and source inspection are not real screen-reader
  evidence.
- Repository license and NOTICE files do not grant publication authority.
- A behavior, dependency, build, or evidence-contract change invalidates
  downstream candidate evidence and returns the program to P14V-02.
- Never rewrite historical evidence to make an old candidate appear current.

Every retained candidate result must record the exact revision, clean/dirty
state, Node/npm/platform environment, exact command, result, and artifact
identity where applicable. Hosted CI targets Node 24; label local runs on other
versions accurately.

## Change Workflow

1. Run the read-only orientation checks above.
2. Identify the owning package and authoritative documents.
3. Inspect overlapping work before editing.
4. Make the smallest coherent change that satisfies the task.
5. Add or update focused deterministic coverage when behavior changes.
6. Run focused checks, then the appropriate integration tier.
7. Review `git status`, `git diff`, and `git diff --check`.
8. Synchronize current-status documents without changing historical facts.
9. Report files changed, exact commands/results, expected blockers, and work
   that still needs human or maintainer authority.

Avoid a repository-wide write formatter until overlap is understood. Prefer
`npm run format:check`, then format only intended files.

## Verification Commands

Run these from `REMAKE/`.

Normal implementation integration:

```text
npm run parity:check
npm run typecheck:fixtures
npm test
npm run lint
npm run format:check
npm run build
```

Add browser lanes owned by the change:

```text
npm run test:e2e:production
npm run test:e2e:production-spine
npm run test:e2e:performance
npm run test:e2e:release
npm run test:e2e:a11y
npm run test:e2e:parity
```

Use focused Vitest or Playwright files first while diagnosing. Do not update
visual baselines unless the visual change is intentional and reviewed.

Expected fail-closed states in the current dirty integration:

- Bare `npm run study:human:gate` exits `2` because frozen-candidate bindings
  are mandatory. The fully bound command fails at 0/5 until one valid
  first-time schema-v3 cohort reaches at least five sessions.
- `npm run gate:rc` refuses a dirty tree.
- `npm run study:progression:corpus` refuses formal evidence collection from a
  dirty tree.
- `npm run closure:status` remains blocked while the tree is dirty or P14R/P14V
  packages are open.

Do not weaken those safeguards to make the integration look ready.

## Release Critical Path

The active sequence and stop conditions live in
`REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md`.
In summary:

1. Reconcile ownership and scope for every dirty path.
2. With explicit authorization, form coherent checkpoints and reproduce
   P14V-02 from a separate clean checkout on one exact SHA/artifact.
3. Run hosted P14V-03 and the replacement candidate-specific P14V-05 32-seed
   corpus in parallel. The four-seed P14V-04 confirmation runs inside
   `gate:rc`.
4. Only after those automated results are green, run P14V-06's 5-8 unassisted
   sessions and P14V-07's real screen-reader Space/ending pass in parallel.
5. Obtain P14V-08's dated product/release-owner and public-distribution
   decision, including durable exact-source and required legal review.
6. Prove the evidence-only final descendant is artifact-identical, smoke the
   actual production host, and complete P14V-09's pre-tag authorization.
7. As a separate authorized operation, create the local annotated tag, verify
   it, publish only after `PASS`, and retain append-only post-tag evidence.

Any candidate-changing fix loops back to step 2 and invalidates downstream
candidate evidence. No step here grants permission for an external action.

## Documentation Synchronization

When current status, evidence, or release planning changes, review all affected
authorities together:

- `AGENTS.md`
- `README.md`
- `REMAKE/README.md`
- `REMAKE/docs/README.md`
- `REMAKE/docs/context.md`
- `REMAKE/docs/plan.md`
- `REMAKE/docs/planning.md`
- `REMAKE/docs/changelog.md`
- `REMAKE/docs/release-gates.md`
- `REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md`
- `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`
- `REPORTS/remediation/P14V-2026-07-12/README.md`
- the affected candidate evidence record

Keep the July 30 roast as an audit/verification record, not a live task board.
The honest current label is:

**Candidate `275c096` has clean local RC, candidate-specific corpus, hosted
change-lane/full-RC, and enforced required-check evidence; operator packages
P14V-06/P14V-07 are open at 0/5 and no real-AT run, and public RC remains on
`HOLD`.**
