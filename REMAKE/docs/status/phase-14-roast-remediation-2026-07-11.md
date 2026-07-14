# Phase 14 Roast Remediation

Date: 2026-07-11  
Authority: `REPORTS/current_prototype_full_roasting_audit_2026-07-11.md`  
Scope: every recommendation left open by the latest full prototype roast

## Outcome

All code, architecture, UI, product-decision, automation, and evidence-capture recommendations are implemented. The work does not fabricate evidence that requires other people: the repository still needs real unassisted human sessions and a recorded Narrator/NVDA Space flight before claiming those two experiences are verified. Release Candidate cleanliness also remains a separate commit/tag operation.

## Recommendation Closure Matrix

| Roast recommendation                        | Implemented result                                                                                                                                                                                                      | Executable evidence                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Make saving failure visible and recoverable | Persistence health is part of session/navigation state. Blocked reads/writes retain a memory snapshot and show a durable warning with retry and recovery export.                                                        | `atomic-save.test.ts`, `semantic-save-validation.test.ts`, `atomic-save.spec.ts`, `production-bundle.spec.ts` |
| Restore bundle headroom                     | The original event catalog is an enforced production chunk; repeated immutable strings are pooled after minification. Entry budget tightened from 600 kB to 480 kB.                                                     | `npm run build`, production pooled-event transition                                                           |
| Validate save meaning, not only shape       | Bounded stores/scores, map dimensions/cells, worker allocation, hut capacity, unlock dependencies, lifecycle/timer/cooldown/notification invariants, and backup recovery validate before live replacement.              | generated/property-style semantic save tests                                                                  |
| Put local gates in CI                       | Pull requests and `main` run clean install, parity, types, unit/content, lint, format, build, audit, and production Chromium smoke. Scheduled/manual CI runs the complete Release Candidate gate.                       | `.github/workflows/remake-ci.yml`, `ci-workflow.test.ts`                                                      |
| Recover failed lazy chunks                  | Fabricator, Ship, and Space use a save-preserving error boundary with safe-location, reload, and fresh-module-URL retry paths.                                                                                          | `lazy-route-recovery.spec.ts` in Chromium, Firefox, WebKit                                                    |
| Make Space nonvisual                        | Optional feed reports ship position, nearest debris bearing/distance, collision lane/urgency, and escape direction with throttled routine and immediate danger announcements.                                           | geometry unit tests, three-browser axe/release coverage, `space-accessibility-layout.spec.ts`                 |
| Make 4K and ending intentional              | True-4K typography/shell/hit-area policy plus a stronger focus-owning homefleet/score ending.                                                                                                                           | regenerated 4K matrix and targeted layout/hierarchy assertions                                                |
| Decide background economics                 | Retain bounded open-tab replay and closed-page no-progress; disclose the rule globally on first resume.                                                                                                                 | clock/economy tests, first-resume notice unit/browser coverage                                                |
| Measure pacing distribution                 | A scheduled multi-seed policy uses real commands, production RNG seeds, timers, maps, events, fights, deaths, and bottleneck reporting. Human records have a de-identified schema, protocol, validator, and summarizer. | `npm run study:progression`, `npm run study:human`                                                            |
| Keep score exact at supported bounds        | Stores cap at `1_000_000_000_000`; maximum score stays safe and one-unit-sensitive; cumulative score saturates without unsafe addition.                                                                                 | exact-boundary and state-store tests                                                                          |
| Exercise complete production progression    | A build-external fixture drives the visible-control fresh spine, explicitly saves it, and restores/verifies the ending in served `dist` with no shipped harness.                                                        | `npm run test:e2e:production-spine`                                                                           |
| Decide source-authentic dominant choices    | Original mode keeps the rough edges. Any rebalance must be a separately named ruleset backed by economy and player evidence.                                                                                            | `docs/tech-decisions.md#td-017-original-mode-keeps-source-authentic-balance-rough-edges`                      |

## Bundle Result

- Initial JavaScript: 416,217 B raw / 119,037 B gzip against 480,000 / 125,000.
- All JavaScript: 587,897 B against 610,000.
- Event catalog: 151,593 B.
- Every primary/retry lazy entry remains below 4,000 B.

The budget moved from a 59-byte hostage margin to more than 64 kB of raw entry headroom while tightening, not inflating, the limit.

## Evidence That Still Requires People

1. `playtests/README.md` requires at least three de-identified, genuinely unassisted production sessions. No such sessions are claimed in this implementation pass.
2. `docs/accessibility-screen-reader-runbook.md` requires an operator to complete and record a full Space flight and ending with Narrator or NVDA. Automated semantics and axe scans are evidence of implementation, not proof of screen-reader playability.

P14V-01 replaced the count-oriented version-1 human schema/gate with a strict same-revision cohort contract and added a normal-clock, console-free manual fixture alongside the frozen automation-only `space-slice` harness. Final collection still waits for the candidate and corpus gates; no operator outcome is inferred from the tooling.

Until those records exist, describe uncontrolled human pacing and real-screen-reader Space as **implemented but not human-verified**.

## Release-Readiness Handoff

Execution now moves to `phase-14-release-readiness-plan-2026-07-12.md` under program `P14V-2026-07-12`. The order is:

1. make the evidence contracts honest: Phase 14-aware closure, diagnostic study naming, a strict same-revision human cohort, and a normal-clock manual Space fixture;
2. create a scope-reviewed checkpoint and reproduce the technical RC gate from a separate clean checkout;
3. prove the change lane and manually dispatched full technical-RC lane in hosted GitHub Actions on that same SHA;
4. repair and classify the current brittle progression policy before retaining a fixed 32-seed corpus;
5. collect at least three same-revision unassisted production sessions, normally continuing to five and up to eight if results remain inconsistent, while a real operator independently repeats the complete screen-reader runbook including Space and the ending;
6. record the source-authentic balance/release decision, close the remake-license and NOTICE requirements, then re-run the clean local/hosted gates and tag the exact approved revision.

The current automated RC command is necessary but does not close the human or assistive-technology packages, and the historical closure parser does not yet understand P14R/P14V status. Evidence artifacts belong under `REPORTS/remediation/P14V-2026-07-12/`.

## Integration Verification

- `npm test`: **72 files / 508 tests passed**.
- `npm run lint`, `npm run format:check`, `npm run typecheck:fixtures`, and `npm run parity:check`: **passed**.
- `npm run build`: **passed**, including event-catalog/retry-boundary verification and all bundle/performance-file budgets.
- `npm run test:e2e:production -- --workers=1`: **15/15 passed** across Chromium, Firefox, and WebKit.
- `npm run test:e2e:production-spine`: **1/1 passed** after driving the full visible-control route and restoring its ending save in served `dist`.
- Focused Space evidence: **14/14 unit/runtime**, **12/12 cross-browser accessibility**, **18/18 regenerated 4K visual cases**, plus affected lower-resolution baselines.
- `npm run study:progression`: **passed and reported honestly**. The fixed four-seed policy completed 0/4, recorded 3 deaths, 315 incidental events, and 13 combats; three seeds died during the first expedition and one failed to recover the last Workshop scales after eight additional economy hours. This is evidence that the selected policy is brittle, not a claim that player completion rate is zero.
- `npm run study:human`: **0 sessions recorded**. The human distribution remains unverified until operators add real records.

The production spine itself found two false semantic rejections that short save smokes missed. Builder income is timer-owned and may omit worker `timeLeft`; Ship direction stores signed `-30..30` coordinates relative to the village. Both legitimate completed-run shapes now restore and are regression-tested.

Static Phase 14 closure remains blocked while the worktree is dirty by design. No clean closure tag is claimed. `P14V-01 Honest evidence gates and collection tooling` is complete; the next package is the maintainer-owned P14V-02 scope-safe checkpoint and clean reproduction. This implementation pass did not commit, push, dispatch CI, or tag.
