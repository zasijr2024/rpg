# REMAKE

Purpose: remake planning, implementation control docs, and future remake source.

Current readiness:

- Phase 14 desktop gameplay/UI parity is accepted: Room through Ending is connected, player-reachable, source-graph checked, and covered by a fresh-save completion route.
- `Parity Complete` and `Production Beta` executable gates pass. The technical `Release Candidate` preflight remains blocked by the dirty worktree; public sign-off additionally follows `P14V-2026-07-12`.
- Fresh-run proof reaches the ending through generated Mines, player-acquired Blueprint redemption, Fabricator crafting, Ship discovery, lift-off, and Space in Chromium, Firefox, and WebKit while asserting named pacing milestones.
- Parity authority: a reproducible AST parser exposes 2,547 stable original event/scene/button/transition/effect/reward requirements with mutation-sensitive tests.
- Save safety: schema-1 checksummed autosaves retain one committed backup, quarantine corrupt/incompatible data, recover without partial live-state mutation, and migrate supported unversioned remake saves.
- Production performance: versioned bundle budgets are enforced during builds, and served-`dist` browser gates protect startup, long tasks, idle responsiveness, blocked-storage startup, save/reload, and late-game lazy routes.
- Executioner content is finalized against all 798 pinned source requirements, with exhaustive routed branch contracts and organic World/Fabricator consequences.
- Roast remediation: persistence failures are visible/recoverable, bundle headroom is restored, CI configuration and lazy-route recovery exist, and nonvisual Space support is implemented. Current `HOLD` reasons are evidence-contract/fixture hardening, a clean reproducible candidate, real hosted CI runs, policy-valid pacing evidence, strict human sessions, a real screen-reader Space flight, the open license/NOTICE decision, product sign-off, and a P14V-aware clean tag.

Start here:

- `docs/context.md` - current scope and authority index.
- `docs/planning.md` - active audit-remediation package ledger.
- `docs/status/phase-14-roast-remediation-2026-07-11.md` - completed roast implementation and exact verification.
- `docs/status/phase-14-release-readiness-plan-2026-07-12.md` - ordered evidence, decision, and tag plan.
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

`study:progression:corpus` runs the fixed 32-seed policy diagnostic in deterministic shards and writes one validated P14V-05 artifact. It refuses a dirty worktree by default; `--allow-dirty` exists only for provisional tooling diagnostics. Current expected blockers: `study:human:gate` fails at 0/3 and recruitment waits for a candidate frozen after P14V-05; `gate:rc` refuses the dirty worktree; `closure:verify-tag` now fails closed while any RA/P14R/P14V package remains open.
