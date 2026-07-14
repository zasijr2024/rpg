# RA-P1-14 Closure: Fresh-save Spine and Pacing

## Scope

Close H-07 by connecting the existing player-facing slices into one deterministic browser run from cleared storage through the ending, without direct state mutation or forced events, and record named milestone pacing.

## Delivered

- A Chromium 1366 fresh run uses visible controls to build the Room/Outside economy, buy the Compass, clear generated Iron and Coal Mines, operate mine workers and Steelworks, craft Water Tank/Wagon expedition upgrades, and reach both original radius-28 late-game landmarks.
- The route completes the first Executioner visit, returns through the antechamber and Martial branch, acquires a Plasma Rifle Blueprint plus Alien Alloy from live combat loot, safely returns to redeem it, and visibly crafts the recipe at the Fabricator.
- The same run discovers the Crashed Ship, safely returns, reinforces its hull with earned Alien Alloy, confirms lift-off, completes the live Space ascent, and reaches the score ending.
- Repeated visible landmarks use unique React keys, removing the runtime warnings exposed by the long generated-map route.

## Evidence Boundary

- The test begins after clearing browser storage and does not apply a declarative state seed.
- Allowed controls: deterministic clock advancement, deterministic RNG, and read-only generated-map inspection for route planning/evidence.
- Forbidden controls are not called: `setState`, `triggerEvent`, `triggerEventByKey`, `triggerWorldEncounter`, and `triggerWorldSetpiece`.
- The fixed pacing series is asserted and attached by the test; methodology and the original-source comparison boundary are recorded in `REMAKE/docs/status/fresh-save-pacing.md`.

## Pacing Baseline

| Milestone | Simulated elapsed |
| --- | ---: |
| Builder | `00:00:30` |
| Outside | `00:00:50` |
| Compass | `08:32:10` |
| First expedition | `10:42:10` |
| Fabricator | `12:15:02` |
| Ship | `12:15:02` |
| Ending | `12:16:02` |

## Verification

- `npx playwright test src/tests/e2e/fresh-save-spine.spec.ts --project=chromium-1366 --reporter=line`: 1 passed in 59 seconds.
- `npm test`: 39 files, 429 tests passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run build`: TypeScript and Vite passed; the documented parity-phase chunk warning remains.
- `npm run test:e2e`: 302 passed, 130 expected skips, 4.8 minutes.

## Revision And Tree State

- Branch: `remake/parity`
- Base revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`
- The working tree was already dirty from the active remediation series. At closure it contains the prior package changes plus this package; no unrelated changes were reverted or overwritten.

## Residual Risks

- This is a representative completion spine, not exhaustive late-game setpiece, Executioner, Space-animation/audio, prestige carryover, or full parity coverage.
- The pinned original provides the pacing constants and costs but no canonical full-playthrough timestamp trace. The asserted 12:16:02 result is a deterministic regression baseline for this route, not a universal human completion time.
- `RA-P1-15` still owns the parser-backed parity graph required before Phase 9/12 breadth resumes.

## Result

`RA-P1-14` is complete. `RA-P1-15 Parser parity graph` is active.
