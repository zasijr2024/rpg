# Phase 13 Space Flight and Ending Status

Status: implementation finalized on 2026-07-11. The pinned `ORIGINAL/script/space.js`, `ORIGINAL/script/scoring.js`, and `ORIGINAL/script/prestige.js` gameplay contract is represented through the ending and next-run prestige handoff. Repository-wide parity/release status remains `HOLD` for Phase 14 full parity QA.

Entry decision: `GO`. Phase 12 Executioner Content is finalized, including the Fleet Beacon reward consumed by the alternate ending, while the finalized Ship module provides the organic lift-off handoff.

## Finalized Scope

- The serializable sixty-second ascent supports held arrow/WASD movement at the original 33 ms frame scale, exact thruster speed, diagonal normalization, and 10–690 playfield bounds.
- Asteroids preserve source glyph probabilities, altitude-dependent wave counts/delays, RNG durations, and the complete `-40` to `740` travel interval. Glyph-footprint collision removes debris and one hull.
- Altitude advances once per second through Troposphere, Stratosphere, Mesosphere, Thermosphere, Exosphere, and Space. The Canvas surface renders the ascent fade and deterministic star field without gameplay RNG contamination.
- Hull depletion returns to Ship and applies the original 120-second lift-off cooldown. Active flights, held controls, debris, timers, and RNG remain validated and serializable.
- Escape calculates the original score from all 24 prestige stores, Alien Alloy, Fleet Beacon, and maximum hull, then persists run and total scores.
- Prestige reduction preserves the source goods/weapon/ammunition random divisors, including the two-roll ammunition curve, and stores the ordered 24-value carryover.
- Fleet Beacon ownership gates the original homefleet outro and `wait` choice before scores. Restart clears run progression while preserving score and reduced stores for the next game's Destroyed Village cache.

## Acceptance Evidence

- Focused SpaceRuntime contracts cover titles, waves, bounds, frame-scaled diagonal movement, scoring, Fleet Beacon gating, randomized store reduction, crash/cooldown, active-flight save restoration, and prestige-preserving restart.
- The Chromium 1366 browser contract reaches Ship through visible controls, reinforces hull, accepts the one-time warning, flies the live Canvas loop, observes the title/altitude transition, and reaches the score ending.
- Existing four-resolution visual baselines cover Ship and Space at 1366, 1920, 2560, and 3840 desktop widths.
- Final verification passes 64 files / 470 unit tests, lint, TypeScript, the production build, lazy-boundary verification, performance bundle budgets, and the focused browser journey.

## Remaining Scope

None inside Phase 13. Audio is explicitly deferred by the parity plan. Repository-wide full parity QA and release closure remain Phase 14.
