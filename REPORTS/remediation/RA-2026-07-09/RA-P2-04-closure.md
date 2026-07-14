# RA-P2-04 Closure: Accessibility Release Evidence

Date: 2026-07-10

## Result

- Overall result: `passed`
- Package state: `done`
- Automated accessibility and real screen-reader evidence are both complete.

## Automated Evidence

- Command: `npm run test:e2e:a11y -- --workers=3`
- Result: 9 passed in 17.9 seconds on 2026-07-10.
- Matrix: Room/live log, compact World model, and active combat dialog in desktop Chromium, Firefox, and WebKit at 1366x768.
- Standard: axe-core WCAG 2.0 A/AA, WCAG 2.1 A/AA, and WCAG 2.2 AA rule tags.
- Result detail: zero violations in all nine scans. Each execution attaches a JSON report containing engine/environment metadata, passed rules, incomplete checks, and violations.
- Integration checkpoint: 43 unit-test files / 455 tests, lint, build, and 7 release-gate tooling tests passed. The complete `test:e2e:release -- --workers=3` matrix passed all 21 executions in 5.3 minutes.

## Manual Environment

| Field                             | Recorded value                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Git revision                      | `8b0938e963ba19df82779431f5aeaa4ff8ec06dd` plus the active remediation worktree                           |
| Operator                          | Oliver                                                                                                    |
| Date/time/timezone                | 2026-07-10 21:47 +02:00                                                                                   |
| Operating system                  | Windows 10 Pro 22H2, OS Build 19045.6456                                                                  |
| Browser/version                   | Microsoft Edge 150.0.4078.48, Official build, 64-bit                                                      |
| Screen reader/version             | Windows 10 Narrator; no version exposed in its UI. Host `Narrator.exe` product/file version: 10.0.19041.1 |
| Speech or braille output observed | Speech output observed by the operator                                                                    |

The operating-system values were supplied with a Windows About screenshot. The operator performed the real Narrator pass; executable metadata is recorded only to identify the installed Narrator build.

## Manual Scenario Record

The operator followed `REMAKE/docs/accessibility-screen-reader-runbook.md` and confirmed that all planned announcements and focus transitions occurred. A verbatim speech transcript was not captured.

| Scenario                            | Result   | Recorded observation                                                                                                                                                            |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh Room and live notification    | `passed` | Main/tab/region order, `light fire`, the single live notification, and retained meaningful focus were announced and behaved as specified.                                       |
| Compact World model                 | `passed` | Position/resources/moves and Damp Cave were announced; the hidden Ship and visual-grid punctuation were not announced; named controls and post-move focus behaved as specified. |
| Combat dialog and focus containment | `passed` | Dialog/title, initial `stab` focus, control/combat states, and the closed Tab/Shift+Tab focus loop behaved as specified.                                                        |

## Defects And Exceptions

No accessibility defects or other anomalies were observed during the manual pass.

## Sign-Off

- Operator result: `passed` - Oliver, 2026-07-10 21:47 +02:00
- Evidence and implementation review: Codex, 2026-07-10

`RA-P2-04` is complete. `RA-P2-05 Test ownership split` is active.

## 2026-07-12 Forward Link

This historical closure covers the three scenarios recorded above; it does not claim a Space flight. The later nonvisual Space implementation and current-candidate operator requirement are tracked by `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`, with observations reserved for `REPORTS/remediation/P14V-2026-07-12/P14V-07-screen-reader-evidence.md` after the normal-clock manual fixture exists.
