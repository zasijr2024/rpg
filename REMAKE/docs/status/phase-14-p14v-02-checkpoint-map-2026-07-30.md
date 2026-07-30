# P14V-02 Phase 0 Checkpoint Map

- Date: 2026-07-30
- Status: **exact groups approved; checkpoint formation authorized**
- Branch: `remake/parity`
- Integration base: `b0e9222aa3fa2ddebc83761c19536732ba321de8`
- Candidate status: **not frozen**

## Purpose And Authority Boundary

This is the Phase 0 ownership and checkpoint map required by
`phase-14-post-remediation-next-steps-2026-07-30.md`. It explains every dirty
path and proposes a dependency-safe commit sequence. On 2026-07-30, the
maintainer approved all three exact groups, selected `0.1.0-rc.1`, and
authorized staging and committing only their listed paths. No push, pull
request, CI dispatch, tag, or deployment was authorized.

The map is path-complete. It intentionally does not use bulk staging, infer
ownership from timestamps, or classify the user-owned feedback worksheet as
release evidence.

## Reconciled Snapshot

Before this map was created, the audit found:

- 100 modified tracked files;
- 21 untracked files;
- no staged paths;
- no deleted or renamed paths;
- tracked diff: 4,824 insertions and 1,416 deletions;
- no configured Git remote;
- clean `ORIGINAL/` submodule at
  `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`, exactly matching the recorded
  gitlink;
- no untracked `dist`, build, coverage, Playwright report, test result,
  `node_modules`, environment, or log output;
- `git diff --check` passed.

This map is the 22nd untracked file. The final path accounting is therefore:

| Classification              |   Paths |
| --------------------------- | ------: |
| Candidate checkpoint 1      |      71 |
| Candidate checkpoint 2      |      34 |
| Candidate checkpoint 3      |      16 |
| Protected; never bulk-stage |       1 |
| **Total dirty paths**       | **122** |

Every path appears exactly once below. The classification check reported zero
unassigned paths and zero duplicates.

Local integration verification used Node `v25.4.0`, npm `11.7.0`, Windows
`10.0.19045`, and Git `2.54.0.windows.1`. This is integration evidence only;
P14V-02 must reproduce the final checkpoints under Node 24 from a separate
clean checkout.

## Protected Path - Exclude From Candidate Checkpoints

Owner: user/playtest operator
Disposition: preserve untracked; do not edit, move, stage, or count as a session

```text
REMAKE/playtests/feedback/p14v-local-session-01.md
```

The file is an unchecked collection worksheet, not schema-v3 evidence. Its
current SHA-256 is
`E4EF62F1BE0F169C67B61BC4E58465F37AD15F19F5EB4A05920D0117D0EBB0E9`.

## Checkpoint 1 - Product Runtime, Recovery, UI, And Production Boundary

Recommended commit subject:

```text
fix(remake): harden runtime recovery and player operability
```

Why one checkpoint: state transactions, save recovery, catch-up timing,
structured failures, root containment, focus/navigation, accessibility, layout,
lazy-route recovery, and their tests share `GameSession`, `App`, state types,
and production build boundaries. A path-only split would create intermediate
trees whose APIs and imports are not independently verified. Hunk-level surgery
would add risk without improving review ownership.

Scope: 71 paths.

```text
REMAKE/docs/source-derived-inventory.md
REMAKE/LICENSE
REMAKE/NOTICE.md
REMAKE/public/LICENSE.txt
REMAKE/public/NOTICE.txt
REMAKE/scripts/verify-production-bundle.mjs
REMAKE/src/engine/clock.ts
REMAKE/src/engine/combat/CombatDomain.ts
REMAKE/src/engine/commands/CommandBus.ts
REMAKE/src/engine/events/EventRuntime.ts
REMAKE/src/engine/fabricator/FabricatorRuntime.ts
REMAKE/src/engine/GameEngine.ts
REMAKE/src/engine/GameSession.ts
REMAKE/src/engine/index.ts
REMAKE/src/engine/outside/EconomyDomain.ts
REMAKE/src/engine/path/pathOutfit.ts
REMAKE/src/engine/path/PathRuntime.ts
REMAKE/src/engine/room/RoomRuntime.ts
REMAKE/src/engine/save/devSave.ts
REMAKE/src/engine/save/validation.ts
REMAKE/src/engine/ship/ShipRuntime.ts
REMAKE/src/engine/space/SpaceRuntime.ts
REMAKE/src/engine/state/path.ts
REMAKE/src/engine/state/selectors.ts
REMAKE/src/engine/state/StateStore.ts
REMAKE/src/engine/state/types.ts
REMAKE/src/engine/world/ExpeditionTransaction.ts
REMAKE/src/engine/world/WorldDomain.ts
REMAKE/src/main.tsx
REMAKE/src/tests/architecture-boundaries.test.ts
REMAKE/src/tests/e2e/accessibility-release.spec.ts
REMAKE/src/tests/e2e/atomic-save.spec.ts
REMAKE/src/tests/e2e/background-catch-up.spec.ts
REMAKE/src/tests/e2e/fresh-save-spine.spec.ts
REMAKE/src/tests/e2e/fresh-save-spine.ts
REMAKE/src/tests/e2e/lazy-route-recovery.spec.ts
REMAKE/src/tests/e2e/player-ui-remediations.spec.ts
REMAKE/src/tests/e2e/production-bundle.spec.ts
REMAKE/src/tests/e2e/production-complete-spine.spec.ts
REMAKE/src/tests/e2e/release-matrix.spec.ts
REMAKE/src/tests/e2e/space-ending-slice.spec.ts
REMAKE/src/tests/e2e/world-layout.spec.ts
REMAKE/src/tests/engine/atomic-save.test.ts
REMAKE/src/tests/engine/clock.test.ts
REMAKE/src/tests/engine/command-bus.test.ts
REMAKE/src/tests/engine/save-recovery-migrations.test.ts
REMAKE/src/tests/engine/semantic-save-validation.test.ts
REMAKE/src/tests/engine/state-store.test.ts
REMAKE/src/tests/tooling/bundle-config.test.ts
REMAKE/src/tests/type-fixtures/domain-facades.invalid.ts
REMAKE/src/tests/ui/player-ui-remediations.test.tsx
REMAKE/src/ui/App.tsx
REMAKE/src/ui/EventPanel.tsx
REMAKE/src/ui/LegalFooter.tsx
REMAKE/src/ui/OutsideView.tsx
REMAKE/src/ui/PersistenceWarning.tsx
REMAKE/src/ui/RecoveryImport.tsx
REMAKE/src/ui/RoomView.tsx
REMAKE/src/ui/RuntimeFailureWarning.tsx
REMAKE/src/ui/SessionErrorBoundary.tsx
REMAKE/src/ui/SettingsView.tsx
REMAKE/src/ui/ShipView.tsx
REMAKE/src/ui/SpaceEnding.tsx
REMAKE/src/ui/SpaceView.tsx
REMAKE/src/ui/SpikeLab.tsx
REMAKE/src/ui/StoresPanel.tsx
REMAKE/src/ui/styles/global.css
REMAKE/src/ui/styles/settings.css
REMAKE/src/ui/WorldView.tsx
REMAKE/vite.config.ts
REMAKE/vitest.progression.config.ts
```

Review focus:

- recovery never conceals loss or overwrites quarantine evidence;
- commands and expedition mutations roll back atomically;
- timers, catch-up debt, and runtime ownership cannot duplicate work;
- state paths reject malformed/prototype keys;
- World/Hyper navigation, focus, contrast, zoom, and real-time Space semantics
  remain Classic-compatible;
- production build contains legal surfaces and fresh query-suffixed lazy-route
  recovery, but no dev/test surfaces.

Required verification after this checkpoint is formed: parity generation,
negative type fixtures, full unit/content suite, lint, source formatting,
production build/budgets, production smoke/spine/performance, release/a11y
matrix, and desktop parity matrix.

The source and public MPL license copies are byte-identical at SHA-256
`D7FC444CAE8DA4B95B9D0356B145DFC530D45B16965DA953FA02DBB9CE004572`.
The full source NOTICE and concise public NOTICE intentionally differ.

## Checkpoint 2 - Evidence Contracts, CI, Policy, And Release Control

Recommended commit subject:

```text
chore(release): make candidate evidence and hosted controls fail closed
```

Why one checkpoint: the workflow tests, human schema/parser, package command,
closure parser expectations, P14V ledger states, and evidence templates are one
contract. Splitting code from the ledger would make at least one intermediate
tree lie about what the executable gates enforce.

Scope: 34 paths.

```text
.github/workflows/remake-ci.yml
REMAKE/docs/accessibility-screen-reader-runbook.md
REMAKE/docs/deferred.md
REMAKE/docs/license-attribution.md
REMAKE/docs/planning.md
REMAKE/docs/release-gates.md
REMAKE/docs/status/balanced-mode-experiment-spec.md
REMAKE/docs/status/controlled-reachability-trace.md
REMAKE/docs/status/fresh-save-pacing.md
REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md
REMAKE/docs/tech-decisions.md
REMAKE/package.json
REMAKE/package-lock.json
REMAKE/playtests/README.md
REMAKE/playtests/session.example.json
REMAKE/playtests/session.schema.json
REMAKE/playtests/sessions/README.md
REMAKE/scripts/summarize-playtests.d.mts
REMAKE/scripts/summarize-playtests.mjs
REMAKE/src/tests/engine/classic-balance-characterization.test.ts
REMAKE/src/tests/tooling/ci-workflow.test.ts
REMAKE/src/tests/tooling/playtest-summary.test.ts
REMAKE/src/tests/tooling/release-gates.test.ts
REPORTS/remediation/P14V-2026-07-12/P14V-01-evidence-contracts.md
REPORTS/remediation/P14V-2026-07-12/P14V-01-post-remediation-evidence-contract-addendum.md
REPORTS/remediation/P14V-2026-07-12/P14V-02-clean-reproduction.md
REPORTS/remediation/P14V-2026-07-12/P14V-03-hosted-ci.md
REPORTS/remediation/P14V-2026-07-12/P14V-04-policy-validity.md
REPORTS/remediation/P14V-2026-07-12/P14V-05-progression-corpus.md
REPORTS/remediation/P14V-2026-07-12/P14V-06-human-playtests.md
REPORTS/remediation/P14V-2026-07-12/P14V-07-screen-reader-evidence.md
REPORTS/remediation/P14V-2026-07-12/P14V-08-release-decision.md
REPORTS/remediation/P14V-2026-07-12/P14V-09-final-tag.md
REPORTS/remediation/P14V-2026-07-12/README.md
```

Review focus:

- only first-time sessions count toward a fully candidate-bound human gate;
- canonical artifact IDs and all five expected cohort fields fail closed;
- `Remake CI required` always reports and chains in-scope work to the full
  three-engine lane;
- historical `d3696de` policy/corpus evidence remains immutable;
- replacement P14V-05 is open, automated policy is not player pacing, Classic
  remains unchanged, and Balanced Experiment A remains proposal-only;
- P14V-09 uses a non-circular pre-tag authorization/post-tag evidence model.

Required verification: human-gate syntax/help/schema checks, fully bound empty
cohort failure, focused playtest/CI/release-gate suites, full unit suite,
TypeScript, lint, formatting, and `closure:status` with the expected nine open
IDs.

Recorded human decision: candidate package version is `0.1.0-rc.1`. Changing
the version after operator evidence would change artifact `A` and restart the
candidate cycle. This RC package version does not itself grant public `GO` or
authorize an RC tag; all documents keep public status on `HOLD`.

## Checkpoint 3 - Session Contract, Current Handoff, And Audit Record

Recommended commit subject:

```text
docs: establish the post-remediation candidate handoff
```

Scope: 16 paths.

```text
AGENTS.md
README.md
REMAKE/docs/changelog.md
REMAKE/docs/context.md
REMAKE/docs/git-versioning.md
REMAKE/docs/parity-checklist.md
REMAKE/docs/plan.md
REMAKE/docs/README.md
REMAKE/docs/status/audit-remediation-2026-07-09.md
REMAKE/docs/status/phase-14-full-parity-qa.md
REMAKE/docs/status/phase-14-p14v-02-checkpoint-map-2026-07-30.md
REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md
REMAKE/docs/status/phase-14-roast-remediation-2026-07-11.md
REMAKE/README.md
REPORTS/README.md
REPORTS/remake_full_evaluation_roast_and_remediation_2026-07-30.md
```

Review focus:

- root `AGENTS.md` remains the first read;
- authority order, current status, nine open IDs, and immediate action agree;
- historical audit facts are not rewritten as current candidate evidence;
- exact commands/results retain their environment and dirty-tree labels;
- no document grants Git, hosted, human, legal, publication, or tag authority.

Required verification: Markdown formatting, authority-routing checks,
stale-status scan, `git diff --check`, zero staged paths, and final
`closure:status`.

## Dependency Order And Freeze Rule

Use this order if the maintainer authorizes the exact groups:

```text
Checkpoint 1 -> Checkpoint 2 -> Checkpoint 3 -> separate clean P14V-02 reproduction
```

Do not freeze or identify candidate `C` before all three checkpoints exist and
the package-version decision is reflected in checkpoint 2. Do not call an
intermediate commit a candidate. After checkpoint 3, create a separate clean
worktree/clone at the final SHA, use Node 24, initialize `ORIGINAL`, run
`npm ci`, install all three Playwright browsers, execute `npm run gate:rc`, and
record/reconfirm the complete artifact identity.

## Phase 0 Exit And Human Intervention

Read-only Phase 0 engineering work is complete:

- every dirty path is classified once;
- no unexplained source/submodule/generated-output path remains;
- the protected worksheet is isolated by exact path and hash;
- commit purposes, path lists, order, review focus, and verification scopes are
  explicit;
- no work had been staged or committed before the maintainer decision.

The maintainer recorded all three required decisions on 2026-07-30:

1. approved the three checkpoint path lists exactly as written;
2. selected pre-freeze package version `0.1.0-rc.1`;
3. authorized staging and committing only the approved groups while excluding
   `REMAKE/playtests/feedback/p14v-local-session-01.md`.

Form the checkpoints in the recorded order, then reproduce the final SHA and
artifact from a separate clean Node 24 checkout. Public RC remains `HOLD`.
