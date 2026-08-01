# REMAKE

Purpose: remake implementation, validation, release-control documents, and
planning.

Current readiness:

- Phase 14 desktop gameplay/UI parity is accepted: Room through Ending is connected, player-reachable, source-graph checked, and covered by a fresh-save completion route.
- Historical clean candidate `d3696de` remains evidence for its old revision. Replacement candidate `6de3979` passed the clean Node 24 technical `Release Candidate` gate and reproduced artifact `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`; hosted and human/product evidence remain open.
- Fresh-run proof reaches the ending through generated Mines, player-acquired Blueprint redemption, Fabricator crafting, Ship discovery, lift-off, and Space in Chromium, Firefox, and WebKit while asserting named pacing milestones.
- Parity authority: a reproducible AST parser exposes 2,547 stable original event/scene/button/transition/effect/reward requirements with mutation-sensitive tests.
- Save safety: schema-1 checksummed autosaves retain one committed backup, quarantine corrupt/incompatible data, recover without partial live-state mutation, and migrate supported unversioned remake saves.
- Production performance: versioned bundle budgets are enforced during builds, and served-`dist` browser gates protect startup, long tasks, idle responsiveness, blocked-storage startup, save/reload, and late-game lazy routes.
- Executioner content is finalized against all 798 pinned source requirements, with exhaustive routed branch contracts and organic World/Fabricator consequences.
- Roast remediation: persistence/recovery, runtime-failure containment, transaction safety, accessibility, compact-layout behavior, evidence-schema, CI, and repository licensing/NOTICE controls are implemented and cleanly reproduced. Current `HOLD` reasons are a missing replacement-candidate corpus, hosted CI/required protection, five schema-v3 human sessions, a real-screen-reader Space flight, durable exact-source/legal-owner review, product sign-off, production-host smoke, and final tag authorization/verification.

Start here:

- `../AGENTS.md` - mandatory first read and repository-wide session contract.
- `docs/status/phase-14-post-remediation-next-steps-2026-07-30.md` - active execution sequence, owners, and stop conditions.
- `docs/status/phase-14-p14v-02-checkpoint-map-2026-07-30.md` - exact 122-path ownership audit, protected worksheet, and approved three-checkpoint sequence.
- `../REPORTS/remediation/P14V-2026-07-12/P14V-02-clean-reproduction-2026-07-30-6de3979.md` - current clean candidate, gate, environment, and artifact proof.
- `docs/context.md` - concise current truth and authority index.
- `docs/planning.md` - package-state ledger.
- `../REPORTS/remake_full_evaluation_roast_and_remediation_2026-07-30.md` - current assessment and local integration verification record.
- `docs/status/phase-14-roast-remediation-2026-07-11.md` - completed roast implementation and exact verification.
- `docs/status/phase-14-release-readiness-plan-2026-07-12.md` - P14V evidence and completion contract.
- `docs/release-gates.md` - executable Parity/Beta/Release Candidate definitions.
- `docs/accessibility-screen-reader-runbook.md` - real assistive-technology protocol and current fixture blocker.
- `playtests/README.md` - unassisted cohort contract and current schema-gate blocker.
- `docs/plan.md` - full implementation plan.
- `docs/source-baseline.md` - pinned original web-version target.
- `docs/parity-checklist.md` - implementation tracker.
- `docs/deferred.md` - locked deferred scope.
- `docs/tech-decisions.md` - accepted architecture decisions.
- `docs/ui-spec.md` - desktop/4K UI acceptance baseline.
- `docs/content-model.md` - original vs expansion content rules.
- `docs/deviations.md` - intentional parity deviations log.
- `docs/license-attribution.md` - licensing and attribution requirements.
- `docs/git-versioning.md` - branch, commit, and tag rules.
- `docs/changelog.md` - implementation history.
- `docs/status/phase-14-full-parity-qa.md` - Phase 14 acceptance and exact evidence.

Implementation rule:

Build a new modern headless TypeScript engine and restrained desktop UI. Preserve original data and behavior, not the original jQuery architecture.

Current implementation commands:

```text
npm ci
npm test
npm run build
npm run test:e2e:performance
npm run test:e2e:production
npm run test:e2e:production-spine
npm run test:e2e:release
npm run test:e2e:a11y
npm run test:e2e
npm run study:progression
npm run study:progression:corpus
npm run study:human
npm run study:human:gate
npm run gate:list
npm run gate:parity
npm run gate:beta
npm run gate:rc
npm run closure:status
npm run closure:verify-tag -- <tag>
```

`study:progression:corpus` runs the fixed 32-seed policy diagnostic in deterministic shards and writes one validated P14V-05 artifact. Historical candidates `d3696de` and `6de3979` retain immutable artifacts. Current hosted candidate `275c096` has a separately named artifact with 12 study-policy completions, 20 policy-classified stops, and zero game-defect/unclassified stops; clean local RC, pull-request CI, manual hosted RC, and required ruleset validation also passed with the identical production artifact. This is automation evidence, not a player statistic. The frozen human binding is revision `275c096247e5fe2026e00c1f67eb78cd4668ccaf`, artifact `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`, cohort `p14v-2026-08-01-275c096-original-classic-01`, ruleset `original`, and mode policy `classic-locked`. The fully bound gate remains honestly blocked at 0/5; `closure:verify-tag` fails closed while operator, owner, host, and tag packages remain open.
