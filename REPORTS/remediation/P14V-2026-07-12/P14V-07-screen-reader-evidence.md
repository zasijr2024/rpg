# P14V-07 Screen-Reader Evidence

Status: `WAITING_FOR_SCREEN_READER_OPERATOR`
Overall result: `PENDING`

P14V-01 supplied the tested normal-clock, console-free `?manualFixture=space-realtime` Space fixture, and P14V-02 froze candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18`. Final observations may now be recorded only by a real screen-reader operator against that candidate. The frozen `testHarness=1&testSeed=space-slice` route remains automation-only and cannot satisfy the one-minute flight contract.

## Candidate Environment

| Field                                      | Recorded value |
| ------------------------------------------ | -------------- |
| Git revision                               | `d3696de28218bb6c7645302398e1a4b5fe7cba18` |
| Worktree state                             | clean detached P14V-02 candidate checkout |
| Build mode and URL per scenario            | `PENDING`      |
| Real-time Space fixture proof/URL          | `PENDING`      |
| Operating system                           | `PENDING`      |
| Browser/version                            | `PENDING`      |
| Screen reader/version                      | `PENDING`      |
| Operator                                   | `PENDING`      |
| Date/time/timezone                         | `PENDING`      |
| Speech or braille observed                 | `PENDING`      |
| Method preventing visual Canvas assistance | `PENDING`      |

## Manual Scenario Record

| Scenario                                | Result    | Actual observations                                                                                                                                                  |
| --------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh Room and live notification        | `PENDING` | `PENDING`                                                                                                                                                            |
| Compact World model                     | `PENDING` | `PENDING`                                                                                                                                                            |
| Combat dialog and focus containment     | `PENDING` | `PENDING`                                                                                                                                                            |
| Nonvisual Space flight and score ending | `PENDING` | Initial feed: `PENDING`; threat: `PENDING`; escape: `PENDING`; duplicate/interrupted output: `PENDING`; ending: `PENDING`; flight playable without Canvas: `PENDING` |

## Automated Companion Evidence

| Check                                     | Exact command/result |
| ----------------------------------------- | -------------------- |
| Cross-browser accessibility lane          | `npm run test:e2e:release`: 30/30 passed across Chromium, Firefox, and WebKit inside the clean RC gate |
| Served-production active-Space lazy route | `npm run test:e2e:production`: 15/15 passed, including active-Space loading across all three engines |
| Normal candidate integration gate         | `npm run gate:rc`: exit `0`; `Technical Release Candidate: PASS` |

## Defects, Retries, And Exceptions

`PENDING`

## Sign-Off

- Operator: `PENDING`
- Evidence review: `PENDING`

This record may be marked `passed` only when every required observation in `REMAKE/docs/accessibility-screen-reader-runbook.md` is recorded and no `PENDING` field remains.
