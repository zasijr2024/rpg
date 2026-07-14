# RA-P2-03 Closure: Browser And Real Zoom Matrix

Date: 2026-07-10

## Scope

Close M-09 by making the Release Candidate browser suite separate from desktop Chromium parity and exercising the fresh ending spine, save/background reload, modal focus, and World layout in Chromium, Firefox, and WebKit. Mobile remains deferred by scope.

## Implementation

- Added `playwright.release.config.ts` with desktop Chromium, Firefox, and WebKit projects at the physical 1366x768 baseline.
- Pointed `npm run test:e2e:release` at that configuration without changing `test:e2e:parity`.
- Added release-specific save/background, modal-focus, and World contracts. World derives effective CSS viewports for 100, 125, 150, and 200 percent browser zoom instead of using the Chromium-only CSS `zoom` property.
- Attached a full-viewport PNG for every World zoom level and for the fresh-spine ending, save/background, and focus contracts. The existing fresh-spine pacing and landmark attachments run in all three release engines.

## Evidence

- Chromium: release contracts passed; the full fresh ending spine passed in about 1.2 minutes.
- Firefox: release contracts passed; the full fresh ending spine passed in about 2.0 minutes.
- WebKit: release contracts passed; the full fresh ending spine passed in about 4.7 minutes.
- The World matrix verifies rendered map/control availability and document/body horizontal containment at effective 100/125/150/200 percent viewports in every engine.
- Final release command: `npm run test:e2e:release -- --workers=3` passed all 12 executions in 5.2 minutes.
- Build, ESLint, targeted Prettier checks, and the release-gate tooling regression suite passed.

## Residual Risks

- This package proves desktop engines and zoom composition only. Mobile remains explicitly deferred, and assistive-technology evidence belongs to `RA-P2-04`.
- Full-viewport PNGs are Playwright run attachments rather than checked-in golden image diffs; the contract asserts geometry/overflow alongside the artifacts.
- WebKit's full visible-control spine is materially slower than Chromium and Firefox; its release-only timeout is five minutes to preserve the same route rather than reducing coverage.

## Result

`RA-P2-03` is complete. `RA-P2-04 Accessibility release evidence` is active.
