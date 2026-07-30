# REMAKE Docs

This folder contains the planning and control documents for the A Dark Room remake.

Current readiness:

- Phase 14 Full Parity QA is accepted for the pinned desktop gameplay/UI scope; see `status/phase-14-full-parity-qa.md`.
- The connected visible-control route runs from fresh Room through World, canonical Mines, Executioner Blueprint, Fabricator, Ship, Space, and score ending in Chromium, Firefox, and WebKit.
- Historical candidate `d3696de` passed Parity Complete, Production Beta, and the technical Release Candidate gate, and its P14V-05 32-seed corpus is retained for that revision. Current remediation requires a new clean candidate and candidate-specific corpus; public sign-off still requires hosted CI/required protection, five schema-v3 human sessions, real-screen-reader evidence, exact-source/legal-owner and product decisions, production-host smoke, and final tag authorization/verification.
- The scripted ending is controlled reachability evidence, not pacing evidence; see `status/controlled-reachability-trace.md` for the deterministic milestone trace, the original 0/4 and historical clean-candidate 4/4 policy diagnostics, and the retained 32-seed P14V corpus. None is a player completion rate.
- Parser-backed parity measurement now exposes 2,547 stable event/scene/button/transition/effect/reward requirements in `DATA/parity-graph.json`.
- Executioner parity is finalized against its complete 798-requirement source graph, with organic World entry/clear consequences and exhaustive headless branch contracts.
- Phase 14 closes the declared parity scope with 284 completed checklist items, 3 linked deviations, and no open/partial items.
- The repository-side remediation from the 2026-07-30 evaluation is organized as an approved three-checkpoint integration; see `../../REPORTS/remake_full_evaluation_roast_and_remediation_2026-07-30.md` for verification status. Candidate `d3696de` and its corpus remain historical; a replacement clean candidate must be frozen before human or real assistive-technology collection begins.
- P14V-02's audit classified all 122 pre-checkpoint dirty paths exactly once. The approved sequence, `0.1.0-rc.1` choice, and protected user worksheet are recorded in `status/phase-14-p14v-02-checkpoint-map-2026-07-30.md`; separate clean reproduction is next.

Recommended reading order:

1. `../../AGENTS.md`
2. `status/phase-14-post-remediation-next-steps-2026-07-30.md`
3. `status/phase-14-p14v-02-checkpoint-map-2026-07-30.md`
4. `context.md`
5. `planning.md`
6. `../../REPORTS/remake_full_evaluation_roast_and_remediation_2026-07-30.md`
7. `status/phase-14-release-readiness-plan-2026-07-12.md`
8. `release-gates.md`
9. `plan.md`
10. `parity-checklist.md`
11. `status/phase-14-full-parity-qa.md`
12. `status/phase-14-roast-remediation-2026-07-11.md`
13. `accessibility-screen-reader-runbook.md`
14. `../playtests/README.md`
15. `source-baseline.md`
16. `status/audit-remediation-2026-07-09.md` (historical audit ledger)
17. `status/phase-7-path.md`
18. `status/phase-8-world.md`
19. `status/phase-9-setpieces.md`
20. `status/phase-10-ship.md`
21. `status/phase-11-fabricator.md`
22. `status/phase-12-executioner.md`
23. `status/phase-13-space-ending.md`
24. `deferred.md`
25. `tech-decisions.md`
26. `ui-spec.md`
27. `content-model.md`
28. `deviations.md`
29. `license-attribution.md`
30. `git-versioning.md`
31. `changelog.md`

Current implementation stance:

- New modern engine: yes.
- Original architecture clone: no.
- Original data/behavior parity: yes.
- Desktop first, including 4K: yes.
- Debug settings tab: hidden by default, opt-in with `?debug=1`, default-off toggles, lifecycle dev save/load, and documented as non-original tooling.
- Clean visual baselines: use `?testHarness=1` without `debug=1`; manual parity/dev work may opt into the debug tab.
- Current UI hardening: event dialogs stay in the play column, store income rows group by source, tall Room action columns scroll internally, and disabled/worker controls have stronger affordance.
- Phases 9 through 14 are finalized: canonical Setpieces, Ship, Fabricator, exhaustive Executioner content, Space, both endings, data/discovery/visual/keyboard QA, and fresh-save completion form the accepted parity baseline.
- Audio/mobile/original-browser save import/new content: deferred; schema-1 remake-save recovery and supported legacy-remake migrations are implemented.
