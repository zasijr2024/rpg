# REMAKE Docs

This folder contains the planning and control documents for the A Dark Room remake.

Current readiness:

- Phase 14 Full Parity QA is accepted for the pinned desktop gameplay/UI scope; see `status/phase-14-full-parity-qa.md`.
- The connected visible-control route runs from fresh Room through World, canonical Mines, Executioner Blueprint, Fabricator, Ship, Space, and score ending in Chromium, Firefox, and WebKit.
- Parity Complete, Production Beta, and the technical Release Candidate gate pass on clean candidate `d3696de`; public sign-off additionally requires the remaining hosted-CI, corpus, human, real-screen-reader, licensing/decision, and tag packages in `P14V-2026-07-12`.
- Fresh-run pacing evidence is reproducible but controlled; see `status/fresh-save-pacing.md` for the deterministic milestone trace, the original 0/4 and clean-candidate 4/4 policy diagnostics, and the retained 32-seed P14V corpus. None is a player completion rate.
- Parser-backed parity measurement now exposes 2,547 stable event/scene/button/transition/effect/reward requirements in `DATA/parity-graph.json`.
- Executioner parity is finalized against its complete 798-requirement source graph, with organic World entry/clear consequences and exhaustive headless branch contracts.
- Phase 14 closes the declared parity scope with 284 completed checklist items, 3 linked deviations, and no open/partial items.
- All code-level recommendations from the latest roast are implemented; see `status/phase-14-roast-remediation-2026-07-11.md`. The candidate and corpus are frozen; final playtest and real assistive-technology evidence now wait for human operators.

Recommended reading order:

1. `context.md`
2. `planning.md`
3. `status/audit-remediation-2026-07-09.md`
4. `source-baseline.md`
5. `release-gates.md`
6. `plan.md`
7. `parity-checklist.md`
8. `status/phase-7-path.md`
9. `status/phase-8-world.md`
10. `status/phase-9-setpieces.md`
11. `status/phase-10-ship.md`
12. `status/phase-11-fabricator.md`
13. `status/phase-12-executioner.md`
14. `status/phase-13-space-ending.md`
15. `status/phase-14-full-parity-qa.md`
16. `status/phase-14-roast-remediation-2026-07-11.md`
17. `status/phase-14-release-readiness-plan-2026-07-12.md`
18. `accessibility-screen-reader-runbook.md`
19. `../playtests/README.md`
20. `deferred.md`
21. `tech-decisions.md`
22. `ui-spec.md`
23. `content-model.md`
24. `deviations.md`
25. `license-attribution.md`
26. `git-versioning.md`
27. `changelog.md`

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
