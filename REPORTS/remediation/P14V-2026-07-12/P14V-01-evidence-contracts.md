# P14V-01 Evidence Contracts

Date: 2026-07-14  
Program: `P14V-2026-07-12`  
Base revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`  
Worktree: **dirty**

Historical checkpoint status: **implementation complete; clean-candidate reproduction remained P14V-02 work at this checkpoint**.

Current synchronization: P14V-02 later committed, scope-reviewed, and reproduced historical production candidate `d3696de` from a separate clean checkout; P14V-04 and P14V-05 also retained diagnostic evidence on that candidate. The 2026-07-30 remediation changed production behavior/tooling, superseded `d3696de` as a candidate, and reopened P14V-02 plus candidate-specific P14V-05. The current candidate-bound human gate, always-reporting required-check, lineage, and tag-handshake contract is recorded separately in `P14V-01-post-remediation-evidence-contract-addendum.md`. The dirty-tree facts below remain the historical P14V-01 execution record and are not current candidate evidence.

This record closes the missing P14V-01 implementation note. It proves that the evidence contracts and their focused tests existed in the working tree at this checkpoint. Because that implementation was not yet committed, this record is not a clean-revision Release Candidate claim and must not be reused as P14V-02, hosted-CI, human-playtest, or real-screen-reader evidence.

## Contract Results

| Contract                             | Implemented behavior                                                                                                                                                                                                                                                                                                                                                                               | Focused evidence                                                                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Technical RC versus product sign-off | `gate:rc` is explicitly the **Technical Release Candidate** gate. `closure:status` and tag verification parse the historical RA ledger plus open P14R/P14V package rows, so public closure fails closed while release evidence is incomplete.                                                                                                                                                      | `release-gates.test.ts` verifies the gate hierarchy and the P14R/P14V open-ID set. At this 2026-07-14 checkpoint, `closure:status` reported `BLOCKED` with ten open IDs.                                                                     |
| Honest progression naming            | `study:progression` prints that it is a policy diagnostic and that classified outcomes are not player-completion evidence. The separate P14V-05 corpus command owns retained fixed-corpus evidence.                                                                                                                                                                                                | Package command and release-gate assertions identify `progression-policy-diagnostic`; no human threshold is attached to it.                                                                                                                  |
| Strict human cohort                  | At this checkpoint, schema version 2 required an exact 40-character revision, cohort/ruleset/artifact identity, consent, unassisted execution, environment, active-play sittings, milestones, structured deaths, bottlenecks, technical exceptions, and exclusions. Schema v3 later superseded it before collection by adding reconciled wall/foreground/background/closed time and mode exposure. | `playtest-summary.test.ts` passed malformed-record, duplicate-participant, mixed-revision, and summary checks. `study:human` honestly reported zero collected sessions.                                                                      |
| Real-time Space fixture              | Development-only `?manualFixture=space-realtime` prepares a Ship-ready state, exposes no `window.__adrTest`, runs the normal session clock, and accepts ordinary keyboard input after lift-off. The frozen `testHarness=1&testSeed=space-slice` route remains automation-only.                                                                                                                     | `manual-space-fixture.spec.ts` passes at 1366x768, 1920x1080, 2560x1440, and 3840x2160. It observes the fixture banner, enabled lift-off control, absent console API, visible flight surface, and advancing altitude after held-arrow input. |

## Execution Record

Run from `REMAKE/` on 2026-07-14, Windows, Node `v25.4.0`:

1. Focused tooling contracts:

   ```text
   npx vitest run src/tests/tooling/release-gates.test.ts src/tests/tooling/playtest-summary.test.ts src/tests/tooling/progression-corpus.test.ts
   ```

   Result: **PASS** — 3 files, 18 tests.

2. Normal-clock manual Space fixture:

   ```text
   npx playwright test src/tests/e2e/manual-space-fixture.spec.ts
   ```

   Result: **PASS** — 4 Chromium viewport projects.

3. Static gate separation:

   ```text
   npm run gate:list
   ```

   Result: Parity Complete `READY`; Production Beta `READY`; Technical Release Candidate `BLOCKED (1)` by the dirty worktree.

4. Phase-aware closure:

   ```text
   npm run closure:status
   ```

   Result: **BLOCKED** at the base revision above. Open IDs: `P14R-06`, `P14R-09`, `P14V-02`, `P14V-03`, `P14V-04`, `P14V-05`, `P14V-06`, `P14V-07`, `P14V-08`, and `P14V-09`.

5. Human collection state:

   ```text
   npm run study:human
   ```

   Result: validator/summarizer ran successfully and reported `0` sessions, `0` completions, and no cohort. This is an honest empty collection state, not human evidence.

## Exit Decision

P14V-01's exit criterion remains met in current tooling: automation states its limits, open Phase 14 evidence blocks closure, schema-v3 invalid or mixed human records fail closed, and the required normal-clock Space observation is runnable without console controls.

At this checkpoint, the next package was P14V-02: review the dirty tree, create coherent commits, and reproduce the resulting exact revision in a separate clean checkout before any candidate-level evidence was claimed. That package later completed historically on `d3696de`; the 2026-07-30 remediation superseded that candidate and reopened P14V-02. See `P14V-02-clean-reproduction.md`.
