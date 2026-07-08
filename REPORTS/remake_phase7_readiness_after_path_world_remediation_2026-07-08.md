# REMAKE Phase 7+ Readiness Evaluation After Path/World Remediation

Date: 2026-07-08  
Target: `REMAKE/`

## Executive Verdict

The last roast report's critical player-funnel blocker is fixed: the remake no longer stops at Village. A fresh browser progression can now reach Compass, reveal `A Dusty Path`, outfit Cured Meat, embark, move on a World map, and return to Path without direct resource injection.

That makes the project ready to continue Phase 7+ implementation work.

It does not make Phase 7 or Phase 8 complete. The new Path/World work is a foundation slice, not original parity. A further full roasting audit before doing more Phase 7 work would be premature; the next useful audit should happen after Phase 7 Path parity is filled out and before broad Phase 8 expansion claims are made.

## Implemented From Last Report

Implemented:

- Path as a real player-facing location.
- Compass-to-Path reveal.
- Path tab and `PathView`.
- Outfitting rows for carryable supplies.
- Bag capacity/free-space display using original helper data.
- Add/remove controls.
- Perk display from original perk data.
- Embark gating on Cured Meat.
- Embark transfer from stores to outfit.
- World as a real player-facing location.
- Active World state with original village position.
- Compact ASCII World viewport.
- Button and keyboard movement.
- Food and water consumption counters.
- Fixed initial landmark detection and enter bridge.
- World encounter bridge integration from movement.
- Return from World to visible Path.
- Combat safe return now resolves to visible Path instead of hidden pending state.
- Organic browser smoke from fresh room to Path, World movement, and return.
- Path/World visual baselines at 1366, 1920, 2560, and 3840.
- Docs changed to stop overstating Phase 6 readiness.

## Key Code Evidence

- `REMAKE/src/engine/path/PathRuntime.ts`: Path unlock, outfitting, capacity, perks, embark, return marker handling.
- `REMAKE/src/engine/world/WorldRuntime.ts`: active World session, movement, supplies, landmark/encounter routing, return.
- `REMAKE/src/engine/GameSession.ts`: `path` and `world` locations, commands, snapshots, return handling.
- `REMAKE/src/ui/PathView.tsx`: player-facing outfitting UI.
- `REMAKE/src/ui/WorldView.tsx`: player-facing World UI and movement.
- `REMAKE/src/tests/engine/game-session.test.ts`: engine coverage for Compass -> Path -> outfit -> embark -> World -> return.
- `REMAKE/src/tests/e2e/app.spec.ts`: organic browser coverage from fresh room to World return.
- `REMAKE/src/tests/e2e/room-visual.spec.ts`: Path/World visual baselines.

## Checks Run

All passed:

- `npm run build`
- `npm test`: 28 files, 289 tests
- `npm run test:e2e`: 201 passed, 3 intentional skips for the long 1920-only organic test
- `npm run lint`
- `npm run format:check`
- `npm audit --audit-level=moderate`: 0 vulnerabilities

Targeted checks also passed:

- `npx vitest run src/tests/engine/game-session.test.ts src/tests/engine/event-runtime.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "plays organically from fresh room to Path" --project=chromium-1920`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`

## Remaining Gaps

Critical gaps are no longer "the player cannot reach Path." That one is closed.

High remaining gaps:

- Path is not full original parity: original row ordering, tooltips, all capacity-upgrade cases, water/armour edge cases, and exact UI behavior still need hardening.
- World is not full original parity: map generation, roads, original landmark counts/radii, visibility persistence, danger, starvation/dehydration death loops, outpost behavior, mine integration, ship discovery, and executioner/fabricator discovery are still incomplete.
- Late-game setpiece/executioner work is still mostly regression scaffolding until more of World can organically reach it.
- Ship/Fabricator/Space/Ending remain not player-reachable.

Medium remaining gaps:

- The organic browser smoke uses visible debug income and test time advancement, not real-time waiting. That is acceptable for reachability, but it is still a QA route, not a normal-speed playthrough.
- World terrain is deterministic and playable, but not the original generation algorithm.
- Fixed initial landmarks prove the bridge, not original landmark distribution.

## Readiness Decision

Ready to continue Phase 7+: yes.

Ready to declare Phase 7 complete: no.

Ready to declare Phase 8 complete: no.

Ready for another full roasting audit right now: not yet. The right next step is to keep implementing Phase 7 Path parity and early Phase 8 World parity. Run another full roast after:

- Path add/remove/capacity/armour/water/perk behavior has parity tests.
- World map generation and landmark placement are implemented against original data.
- At least one organic no-harness World landmark/setpiece path works from fresh progression.
- Mine clearing or ship discovery is reachable through the World UI.

## Roasting Summary

The previous build had a polished hallway into a locked door. This build opens the door.

Now the problem is different: the room behind it is framed, wired, and test-lit, but not furnished like the original game yet. That is a much better failure mode. Keep building Phase 7/8; do not spend the next cycle re-auditing what is already obviously incomplete by checklist.

