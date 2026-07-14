# Phase 14 Full Parity QA Status

Status: **accepted on 2026-07-11** against the pinned desktop gameplay/UI parity scope.

Delivery boundary: `Parity Complete` and `Production Beta` executable command suites pass. `Release Candidate` is not claimed: static preflight correctly blocks the current dirty worktree, and no clean closure tag was created.

Product verdict at acceptance: the separate full roast placed Release Candidate on `HOLD` at strong Alpha. Phase acceptance means the defined source parity contract is closed; it did not by itself erase persistence, bundle-headroom, CI, nonvisual-Space, or uncontrolled-pacing risks.

Post-audit addendum: the implementation recommendations named in that roast were remediated later on 2026-07-11. See `phase-14-roast-remediation-2026-07-11.md` for the superseding code/test status. The remaining clean/CI, progression-policy, human, screen-reader, decision, and tag work is ordered in `phase-14-release-readiness-plan-2026-07-12.md`.

## Acceptance Matrix

| Phase 14 criterion                                  | Result                | Evidence                                                                                                                                                                                                                              |
| --------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Game completes from a fresh save                    | Pass                  | Visible-control fresh spine reaches the score ending in Chromium, Firefox, and WebKit.                                                                                                                                                |
| No critical progression blockers                    | Pass                  | Audit-found Ship-flag corruption, missing thieves/Hyper, false Compass heading, Space-income score inflation, and active-flight save rejection were corrected and regression-locked.                                                  |
| All extracted gameplay data represented or deferred | Pass                  | `REPORTS/phase14_data_parity_report_2026-07-11.md`; exact parser/runtime contracts; audio/localization deferred manifests.                                                                                                            |
| Minimal, stable, readable target-desktop UI         | Pass for parity scope | 72 snapshots: 18 states at 1366x768, 1920x1080, 2560x1440, and 3840x2160, including full physical viewport framing, modal/combat shells, midpoint Space, and ending. The roast records the intentionally severe 4K presentation risk. |
| Every parity checklist item resolved                | Pass                  | 284 complete, 3 linked intentional deviations, 0 open, 0 partial.                                                                                                                                                                     |

## Full Playthrough Checklist

The automated fresh-save spine uses visible player controls. Clock and RNG are controlled to make the twelve-hour source-shaped route reproducible; direct state injection is not used for the route.

- [x] Start with only `A Dark Room` and light the fire.
- [x] Reach Builder, Outside, traps, housing, population, and workers.
- [x] Build the economy required for Trading Post, Compass, Path, and Cured Meat.
- [x] Buy Compass, generate the original 61x61 World, outfit, and embark.
- [x] Reach and clear the canonical Iron Mine; return and observe its worker/building consequence.
- [x] Reach and clear the canonical Coal Mine through its source `attack`/`continue` chain.
- [x] Build the late-game economy and return to World.
- [x] Enter the Ravaged Battleship and obtain a player-reachable Blueprint.
- [x] Return safely, redeem the Blueprint, open Fabricator, and fabricate its item.
- [x] Discover the Crashed Ship without corrupting the independent ship-position state.
- [x] Reinforce hull, accept the one-time departure warning, and lift off.
- [x] Complete the sixty-second Space ascent with income suspended.
- [x] Reach and verify run score, total score, prestige carryover, and restart surface.

The pinned pacing trace ends at simulated `12:16:02`. It proves reachability and guards major pacing drift; it is not a measured human completion-time distribution.

## Automated Module Smoke Matrix

| Module          | Primary browser evidence                                   | Headless/content evidence                              |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Room            | `room-contracts.spec.ts`, fresh spine, visual matrix       | Room runtime/selectors/commands                        |
| Outside/Village | `economy-cadence.spec.ts`, `room-contracts.spec.ts`        | Outside runtime, economy cadence, thief regressions    |
| Events          | `event-contracts.spec.ts`, release modal matrix            | EventRuntime families, exact graph and text parity     |
| Combat/Loot     | event, expedition, and World browser contracts             | Combat timing/actions/specials/death/loot/restore      |
| Path/Outfit     | compact-control, room, and World contracts                 | capacity, reserve/return, Compass, atomic resources    |
| World           | `world-contracts.spec.ts`, `landmark-isolation.spec.ts`    | generation, survival, transaction, 64-seed corpus      |
| Setpieces       | expedition resources and organic World traversal           | all 13 canonical parser-backed graphs                  |
| Executioner     | event/World contracts and fresh spine                      | 6 events, 103 scenes, 16 combats, all wing routes      |
| Ship            | `ship-slice.spec.ts`, fresh spine, production bundle       | Ship operations, warning, crash/cooldown, save         |
| Fabricator      | `fabricator-slice.spec.ts`, fresh spine, production bundle | all nine recipes, gates, atomicity, persistence        |
| Space           | `space-ending-slice.spec.ts`, production bundle            | movement, debris, contrast, save, score, prestige      |
| Ending/Restart  | fresh spine and four-target ending visuals                 | both endings, total score, carryover, restart          |
| Save/Recovery   | atomic-save, release reload, production blocked-storage    | schema/checksum/backup/migrations/lifecycle validation |

## Seeded And Randomized Evidence

- Deterministic RNG owns events, combat rolls, loot, map generation, Space debris, and prestige.
- `phase-14-randomized-world.test.ts` runs 64 production seeds and verifies exact dimensions, village placement, every unconditional landmark count, and reachability.
- Trap, population, event branches, combat hit/stun/heal, loot, setpiece branches, Executioner specials, debris, and prestige have deterministic seed cases.
- The event parser graph is mutation-sensitive rather than count-only.
- At Phase 14 acceptance, no multi-seed full-game policy distribution existed. The later roast remediation added a real-command diagnostic whose original policy completed 0/4; subsequent P14V policy/runtime corrections provisionally complete the same four seeds in the dirty worktree. Clean-candidate reproduction and the fixed 32-seed corpus remain required, and neither automated result is human evidence.

## Behavior And Discovery Evidence

- Every reward and cost is one-shot across scene, combat, loot, restore, and session boundaries.
- World death/rollback, safe return, Blueprint redemption, mine consequences, landmark isolation, Outpost reset, Ship/Fabricator discovery, Space crash, and ending restart are scenario-covered.
- The discovery suite asserts that Outside, Path, World, Ship, Fabricator, Space, tutorial hints, and future tabs remain absent before their original unlocks.
- Modal background pointer and command access are blocked; the underlying surface is inert and removed from the accessibility tree while a dialog owns focus.

## Keyboard And Accessibility Evidence

- Semantic location tabs support arrow-key roving selection.
- Compact worker/outfit steppers support grouped arrow-key behavior and recover a tab stop when previously disabled controls become available.
- Event and combat dialogs trap Tab/Shift+Tab/Enter correctly through cooldown and close.
- World supports arrow/WASD movement; Space has browser-level held-arrow movement evidence plus visible direction controls.
- Axe WCAG A/AA scans pass for Room, compact World, and Combat in Chromium, Firefox, and WebKit. Recorded Windows Narrator/Edge evidence covers those same surfaces.
- Post-roast status: an optional nonvisual spatial feed and immediate hazard alerts are implemented and automated, but a real operator has not yet completed the full Space flight and ending. That experience remains unverified, not missing or silently claimed.

## Visual Evidence

`room-visual.spec.ts` owns 72 approved PNG baselines:

- 18 states per target at 1366x768, 1920x1080, 2560x1440, and 3840x2160;
- full-viewport desktop framing at every target;
- Room, Outside, Path, World, Ship, Fabricator, Space start/midpoint, event, combat, and score ending;
- separate release checks for 100%, 125%, 150%, and 200% effective desktop zoom, including the longest Executioner event.

## Data And Deviations

- Data report: `REPORTS/phase14_data_parity_report_2026-07-11.md`.
- Known deviations: `REMAKE/docs/deviations.md`.
- Full product roast: `REPORTS/current_prototype_full_roasting_audit_2026-07-11.md`.
- Deferred scope: `REMAKE/docs/deferred.md`.

## Phase 14 Defects Corrected

- restored organic thief start/accounting and reachable restitution/`stealthy` outcomes;
- implemented production Hyper/Classic x2 with confirmation and persistence;
- suspended all passive income during Space;
- generated World before any Nomad Compass heading;
- separated ship coordinates from the canonical Crashed Ship clear flag;
- accepted the real `-40..740` asteroid domain in active-flight save validation;
- contained blocked-storage startup instead of blanking the application;
- guarded modal background commands/pointers and restored compact-stepper tab order;
- guaranteed Space glyph contrast through the midpoint;
- corrected source-exact Executioner text and locked every event string/graph edge;
- made the Windows/Node 25 gate runner execute configured npm commands instead of falsely reporting an immediate failure;
- added a true production-`dist` cross-browser lane outside the shipped harness.

## Final Execution Record

Run from `REMAKE/` on 2026-07-11:

- `npm run gate:beta`: **PASS**
  - parity artifact generation/check: passed;
  - negative type fixtures: passed;
  - unit/content: 69 files, 483 tests passed;
  - lint and format: passed;
  - production build/bundle/performance budgets: passed;
  - Chromium parity matrix: 381 passed, 139 expected skips across 520 enumerated executions;
  - production performance browser: 1 passed;
  - production dependency audit: 0 vulnerabilities.
- `npm run test:e2e:production`: **9 passed** across Chromium, Firefox, and WebKit against served `dist`.
- `npm run test:e2e:release`: **27 passed** across Chromium, Firefox, and WebKit, including three full fresh-save endings.
- `npm audit`: **0 vulnerabilities** including development dependencies.
- `npm run gate:list`: Parity Complete `READY`; Production Beta `READY`; Release Candidate `BLOCKED (1)`.
- `npm run gate:rc`: correctly refused execution because tracked/untracked changes are present.
- `npm run closure:status`: no phase-owned open IDs; current revision `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`; worktree dirty.

## Closure Decision

Phase 14 is complete for the declared desktop parity scope. The high-priority persistence warning and every other code-level roast recommendation are now implemented. Public Release Candidate sign-off follows the separate `P14V-2026-07-12` validation plan: clean reproduction, hosted CI, policy-valid distribution evidence, unassisted sessions, a real screen-reader Space/ending pass, an explicit balance decision, and a verified clean tag.
