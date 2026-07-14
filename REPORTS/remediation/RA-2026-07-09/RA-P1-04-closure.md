# RA-P1-04 Closure: Background Catch-up Debt

Date: 2026-07-10  
Authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`

## Reopen Decision

The original closure was invalidated by independent review on 2026-07-10. Its tests proved raw `ManualClock` convergence and eventual saved clock time, but not equivalent full-session outcomes or debt survival across a lifecycle boundary.

Two defects were reproduced:

- A five-minute batched session transition reached Builder level 4 with 0 wood, while continuous 250 ms advancement reached the same level with 54 wood. `GameSession.update()` had run only after the full batch, so update-gated progression and the already-running Builder income timer observed different state histories.
- With a ten-second jump and one-second batch limit, stop/restart after the first batch retained only 1000 ms of progress and discarded the remaining 9000 ms. The debt existed only in the running driver and `start()` reset it.

RA-P1-04 was therefore reopened before further remediation work.

## Corrective Implementation

Realtime debt is now represented as validated serializable segments containing elapsed wall time and the time scale active when that time arose. The debt is included in the session lifecycle snapshot and survives autosave, stop/start, page reload, and the existing running in-game Load flow.

Each production driver tick drains no more than ten seconds of wall-time debt. Inside that bound, the manual clock and headless `GameSession` advance in normal 250 ms simulation steps. This preserves update-gated state ordering while bounding synchronous headless work; UI refresh and persistence remain once per outer tick. A five-minute/1200-step diagnostic took about 187 ms on the audit host, so retaining the original five-minute production batch would have replaced the correctness defect with a severe long task.

## Verification

- 9 clock tests cover raw timeout/interval behavior, bounded draining, one-hour convergence, stop/restart retention, serialized time-scale retention, and full-session batch equivalence.
- 6 atomic-save tests include restore while the production driver remains running.
- The reproduced Builder case now ends with level 4 and 54 wood in both batched and continuous execution.
- Twenty diagnostic ten-second headless batches measured about 5.69 ms median and 12.48 ms p95 on the audit host; the rejected five-minute batch measured about 187 ms.
- A fresh-run Chromium 1366 test suspends for one hour, verifies the first ten-second save, reloads the page, restores the remaining debt, and reaches the exact saved hour without direct state mutation.
- The first full integration run correctly failed four existing running LocalStorage-load cases because the initial corrective implementation rejected restore on a live driver. That boundary was fixed; all four focused viewport cases then passed.
- Final gate: 407 unit tests passed; lint, format, and build passed; 266 Playwright tests passed with 110 intentional project skips in 4.4 minutes.

RA-P1-04 is reclosed. `RA-P1-06 Domain UI subscriptions` remains the active package.
