# Accessibility Screen-Reader Release Runbook

This runbook records the required `manual-a11y` follow-up for `P14V-07`. The historical `RA-P2-04` record covers Room, World, and Combat on the 2026-07-10 worktree and must not be rewritten as current Space evidence. An accessibility-tree snapshot, axe scan, or DOM assertion does not count as a real screen-reader pass. The operator must hear or read the screen reader's actual output and record it in `REPORTS/remediation/P14V-2026-07-12/P14V-07-screen-reader-evidence.md`.

Fixture status: **ready on frozen candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18`**. `?manualFixture=space-realtime` is development-only, opens a Ship-ready state with a resilient hull, starts the normal session clock, exposes no `__adrTest` API, and is covered by `manual-space-fixture.spec.ts`. Final evidence now waits only for a real screen-reader operator; until that pass is recorded, describe the feed as implemented and automated, **not screen-reader verified**.

## Required Environment

- A real desktop screen reader and a browser supported by it. On the current Windows host, Narrator 10.0.19041.1 is available; NVDA is not installed. One completed Narrator or NVDA pass satisfies the current requirement; claiming both requires two separately recorded passes.
- A production build served locally with `npm run build` followed by `npm run preview -- --host 127.0.0.1 --port 41730 --strictPort` for the fresh Room production smoke.
- A separate deterministic development-fixture session served with `npm run dev -- --host 127.0.0.1 --port 41730 --strictPort` for World and Combat. `testHarness=1` is deliberately compiled out of production; evidence from these URLs must be labelled `development fixture`, never `production build`.
- For Space, open `http://127.0.0.1:41730/?manualFixture=space-realtime`. Its banner identifies the normal-clock, console-free development fixture. The frozen `space-slice` harness remains automation-only and is not acceptable for the flight.
- Browser storage cleared before the fresh-run scenario.
- The Git revision, build mode (`production` or `development fixture`), operating system, browser version, screen-reader name/version, operator, date, and result recorded for every scenario in the evidence report.

## Pass Criteria

Run every scenario using screen-reader navigation and the keyboard only. Record the actual phrases announced where the table asks for them. Every required observation must pass; any workaround, missing announcement, trapped focus, hidden-map leakage, or ambiguous control name is a failure.

### 1. Fresh Room And Live Notification

Open `http://127.0.0.1:41730/` with cleared storage.

1. Read the page from the top. Confirm one `A Dark Room` main landmark, the selected location tab, the room heading/region, fire and room status, the `light fire` button, and the notifications log are discoverable in a coherent order.
2. Activate `light fire`. Confirm focus remains meaningful and the new notification is announced once without moving focus into the log.
3. Record the announced control name and notification phrase.

### 2. Compact World Model

Open `http://127.0.0.1:41730/?testHarness=1&testSeed=world-accessibility`, activate the `world` tab, and navigate by regions/headings/lists and then by controls.

1. Confirm the current World state announces `x 30, y 30; the village`, health/water/food, village distance, allowed moves, and `A Damp Cave: 1 moves east`.
2. Confirm the hidden `A Crashed Starship` and the punctuation cells of the visual map are never announced.
3. Confirm the four direction buttons and `return to village` are named and keyboard operable.
4. Activate `east`; confirm the updated position/state is discoverable and focus remains meaningful.
5. Record the position, landmark, and post-move announcements.

### 3. Combat Dialog And Focus Containment

Open `http://127.0.0.1:41730/?testHarness=1&testSeed=stim-lifecycle`.

1. Confirm the modal dialog is announced with `A Snarling Beast` and initial focus is on `stab`.
2. Navigate all available combat controls. Confirm each has an unambiguous name and state.
3. Activate `stab`. Confirm the disabled/cooldown state and changed combat status are discoverable.
4. Tab and Shift+Tab through the dialog. Confirm focus cannot escape behind the modal and does not disappear.
5. Record the dialog title, initial focus, combat-state announcement, and focus-loop result.

### 4. Nonvisual Space Flight And Ending

At frozen candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18`, start the deterministic development server, open `http://127.0.0.1:41730/?manualFixture=space-realtime`, and confirm the evidence banner states that the normal session clock is running and no console test API is exposed. Do not inspect the Canvas, use a mouse, drive time from the console, or let a facilitator control the game.

1. Confirm `An Old Starship` is open with the fixture-provided hull, then choose `lift off`. The prior-warning state is already seeded, so flight begins directly. Confirm focus enters the `space flight` region and the heading, hull, altitude, four direction controls, and `turn spatial flight feed on` are discoverable.
2. Activate `turn spatial flight feed on`. Confirm it announces exactly one concise initial status containing all of: ship column/row and x/y, nearest-debris direction and pixel distance, and `collision threat`.
3. Steer using only arrow/WASD keys and the spoken feed. Confirm routine position/debris summaries update no more than once per roughly 1.5 seconds, do not interrupt key operation, and report changed ship coordinates. Move toward an announced debris lane: the separate terse `danger, move east/west` alert must fire immediately when the lane becomes unsafe rather than waiting for the routine cadence. Follow that escape and confirm the alert clears; longer `potential`, `high`, or `imminent` wording remains discoverable in the feed.
4. Complete the one-minute ascent using only the feed and keyboard controls. A crash is a scenario failure if the feed omitted a useful warning; a deliberate ignored warning is an operator retry and must be noted.
5. At the score ending, confirm the `the end.` heading, `score for this game`, `total score`, and `restart.` control are announced in a coherent order and remain keyboard operable. If a fleet-beacon save is separately available, also record the `homefleet` heading, narrative order, `wait` control, and transition to scores; this fleet branch is supplemental, not a substitute for the required flight.
6. Record the initial feed phrase, one threat phrase, the escape result, any duplicate/interrupted announcements, ending phrases, and whether the complete flight was playable without the Canvas.

Automated coverage may establish geometry math, semantics, normal-clock fixture behavior, and browser regressions, but it cannot fill any observation in this scenario. A manual pass against the development fixture also does not prove that the production lazy chunk loaded; keep the production route-load test result as a separate evidence line.

## Recording And Closure

Replace every `PENDING` field in the P14V-07 evidence report with an observed value, set the overall result to `passed` or `failed`, and list defects with reproduction steps. Current-candidate accessibility may be represented as fully verified only after:

- all four manual scenarios are repeated on the exact candidate revision and recorded as passed, including one complete normal-clock nonvisual Space flight and score ending;
- `npm run test:e2e:a11y -- --workers=3` passes all twelve release-browser scans;
- the production lazy-route test records that active Space loads from a served production build;
- the normal package integration gates pass; and
- the P14V package ledger, changelog, context, status, and evidence report are updated together.
