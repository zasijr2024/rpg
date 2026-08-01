# P14V-07 Screen-Reader Evidence

Status: `OPEN_FOR_REAL_AT_OPERATOR`
Overall result: `PENDING`

P14V-01 supplied the tested normal-clock, console-free `?manualFixture=space-realtime` Space fixture. Historical candidates collected no qualifying real assistive-technology evidence. P14V-02, P14V-03, and P14V-05 now pass on `275c096`; final observations may be recorded only by a real screen-reader operator against that exact candidate/artifact. The `testHarness=1&testSeed=space-slice` route remains automation-only and cannot satisfy the one-minute flight contract.

## Candidate Environment

| Field                                      | Recorded value                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Git revision                               | `275c096247e5fe2026e00c1f67eb78cd4668ccaf`                                |
| Production artifact                        | `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c` |
| Worktree state                             | clean candidate required                                                  |
| Build mode and URL per scenario            | `PENDING`                                                                 |
| Real-time Space fixture proof/URL          | `PENDING`                                                                 |
| Operating system                           | `PENDING`                                                                 |
| Browser/version                            | `PENDING`                                                                 |
| Screen reader/version                      | `PENDING`                                                                 |
| Operator                                   | `PENDING`                                                                 |
| Date/time/timezone                         | `PENDING`                                                                 |
| Speech or braille observed                 | `PENDING`                                                                 |
| Method preventing visual Canvas assistance | `PENDING`                                                                 |

## Manual Scenario Record

| Scenario                                | Result    | Actual observations                                                                                                                                                  |
| --------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh Room and live notification        | `PENDING` | `PENDING`                                                                                                                                                            |
| Compact World model                     | `PENDING` | `PENDING`                                                                                                                                                            |
| Combat dialog and focus containment     | `PENDING` | `PENDING`                                                                                                                                                            |
| Nonvisual Space flight and score ending | `PENDING` | Initial feed: `PENDING`; threat: `PENDING`; escape: `PENDING`; duplicate/interrupted output: `PENDING`; ending: `PENDING`; flight playable without Canvas: `PENDING` |

## Automated Companion Evidence

| Check                                     | Exact command/result                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| Cross-browser accessibility lane          | `275c096`: release/a11y lanes passed inside clean local and hosted full-RC gates |
| Served-production active-Space lazy route | `275c096`: production smoke passed across Chromium, Firefox, and WebKit          |
| Normal candidate integration gate         | `275c096`: local `npm run gate:rc` and hosted full-RC run `30700299995` passed   |

## Defects, Retries, And Exceptions

`PENDING`

## Sign-Off

- Operator: `PENDING`
- Evidence review: `PENDING`

This record may be marked `passed` only when every required observation in `REMAKE/docs/accessibility-screen-reader-runbook.md` is recorded and no `PENDING` field remains. P14R-06 closes only with this pass. A behavior/artifact change invalidates the affected evidence and returns the program to P14V-02.
