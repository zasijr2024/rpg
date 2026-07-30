# P14V-07 Screen-Reader Evidence

Status: `WAITING_FOR_P14V_02_P14V_03_P14V_05_AND_OPERATOR`
Overall result: `PENDING`

P14V-01 supplied the tested normal-clock, console-free `?manualFixture=space-realtime` Space fixture. Historical candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18` was superseded by the 2026-07-30 remediation before real assistive-technology evidence was collected. Final observations begin only after P14V-02, P14V-03, and replacement-candidate P14V-05 pass, and may be recorded only by a real screen-reader operator against that exact candidate/artifact. The `testHarness=1&testSeed=space-slice` route remains automation-only and cannot satisfy the one-minute flight contract.

## Candidate Environment

| Field                                      | Recorded value                       |
| ------------------------------------------ | ------------------------------------ |
| Git revision                               | `PENDING_POST_REMEDIATION_CANDIDATE` |
| Worktree state                             | `PENDING`                            |
| Build mode and URL per scenario            | `PENDING`                            |
| Real-time Space fixture proof/URL          | `PENDING`                            |
| Operating system                           | `PENDING`                            |
| Browser/version                            | `PENDING`                            |
| Screen reader/version                      | `PENDING`                            |
| Operator                                   | `PENDING`                            |
| Date/time/timezone                         | `PENDING`                            |
| Speech or braille observed                 | `PENDING`                            |
| Method preventing visual Canvas assistance | `PENDING`                            |

## Manual Scenario Record

| Scenario                                | Result    | Actual observations                                                                                                                                                  |
| --------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh Room and live notification        | `PENDING` | `PENDING`                                                                                                                                                            |
| Compact World model                     | `PENDING` | `PENDING`                                                                                                                                                            |
| Combat dialog and focus containment     | `PENDING` | `PENDING`                                                                                                                                                            |
| Nonvisual Space flight and score ending | `PENDING` | Initial feed: `PENDING`; threat: `PENDING`; escape: `PENDING`; duplicate/interrupted output: `PENDING`; ending: `PENDING`; flight playable without Canvas: `PENDING` |

## Automated Companion Evidence

| Check                                     | Exact command/result                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Cross-browser accessibility lane          | Historical `d3696de`: `npm run test:e2e:release` passed 30/30; new candidate result `PENDING`    |
| Served-production active-Space lazy route | Historical `d3696de`: `npm run test:e2e:production` passed 15/15; new candidate result `PENDING` |
| Normal candidate integration gate         | Historical `d3696de`: `npm run gate:rc` passed; new candidate result `PENDING`                   |

## Defects, Retries, And Exceptions

`PENDING`

## Sign-Off

- Operator: `PENDING`
- Evidence review: `PENDING`

This record may be marked `passed` only when every required observation in `REMAKE/docs/accessibility-screen-reader-runbook.md` is recorded and no `PENDING` field remains. P14R-06 closes only with this pass. A behavior/artifact change invalidates the affected evidence and returns the program to P14V-02.
