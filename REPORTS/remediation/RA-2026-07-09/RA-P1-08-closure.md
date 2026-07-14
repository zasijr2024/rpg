# RA-P1-08 Closure: Compact Accessible World Model

## Scope

Remediate H-04 by removing the 61x61 visual World grid from assistive technology and replacing it with a concise, visibility-safe World read model.

## Delivered

- The visual map stage is `aria-hidden`, so its grid cells and decorative landmark spans do not enter the accessibility tree.
- The parallel World information region names current coordinates/terrain, health/water/food, village distance/direction, available moves, and up to three nearest revealed landmarks.
- The runtime caches the compact model alongside the map-row cache and enumerates landmarks only where the persisted visibility mask is revealed.

## Evidence

- Deterministic `world-snapshot-cache` coverage proves that a visible Cave is included but a hidden Crashed Starship is not.
- Scenario-seeded Chromium coverage verifies the compact region, keyboard-readable landmark list, hidden visual grid, and bounded World accessibility tree.
- The existing Chromium World-layout and World subscription scenarios remain green after the additional accessibility region.
- Full package gate: 411 unit tests, lint, format, build, and 270 Playwright tests with 118 expected skips passed.

## Result

`RA-P1-08` is complete. `RA-P1-09 Focus ownership lifecycle` is now active.
