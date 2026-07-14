# Phase 12 Executioner Content Status

Status: implementation finalized on 2026-07-11. The complete Executioner content graph from the pinned `ORIGINAL/script/events/executioner.js` baseline is represented and executable. Repository-wide parity/release status remains `HOLD` for Phase 13 Space/ending breadth and Phase 14 full parity QA.

Entry decision: `GO`. Phase 11 Fabricator Module is finalized, and its complete recipe/redemption contract supplies the player-facing destination for Executioner Blueprint rewards.

## Finalized Scope

- The Ravaged Battleship World landmark routes first visits into the complete three-family intro and return visits into the gated antechamber.
- The source denominator is locked at 798 requirements: 6 events, 103 scenes, 203 buttons, 226 transitions, 196 effects, and 64 rewards.
- Thirty-eight deterministic content variants represent every original intro, Engineering, Medical, Martial, Command Deck, and cross-event branch while retaining source text, loot, costs, cooldowns, and state effects.
- All 16 Executioner combat definitions are present. The shared combat runtime supports the medic's health-triggered venom, prototype shield, robot energised state, malformed-experiment enrage, immortal-wanderer rotating/repeat-avoiding specials, and unstable-automaton explosion.
- Engineering, Medical, and Martial completion set their original World flags. Completing all three exposes Command Deck; defeating the immortal wanderer awards the Fleet Beacon and converts the Battleship to a road-connected Outpost.
- Hypo, Kinetic Armour, Plasma Rifle, Disruptor, Glowstone, and Stim Blueprints remain expedition loot until safe return, then redeem into Fabricator visibility through the established transaction boundary.

## Acceptance Evidence

- The parser-backed source guard locks the exact Executioner requirement denominator and the six canonical source events/titles.
- The exhaustive content contract validates all 16 combat definitions and all 38 routed definitions against their scene text, buttons, costs, loot, transitions, and effects.
- Five EventRuntime suites exercise every intro and deck branch, including alternate random paths, healing machines, loot handling, combat specials, explosion timing, cleanup, and Blueprint rewards.
- Organic GameSession coverage enters the landmark from World movement, discovers the Fabricator, returns through the antechamber, clears all three wings, gates Command Deck, and converts the final Battleship.
- Chromium coverage proves World tooltip-to-entry behavior, first and return visits, wing/Command gating, visible Command Deck combat, Fleet Beacon loot, safe-return Blueprint redemption, Fabricator crafting, and the connected ending spine.
- Focused Phase 12 verification passes 9 files / 62 tests across the source denominator, content definitions, EventRuntime branches, organic GameSession routes, and Fabricator integration.
- All four Chromium 1366 Executioner browser contracts and the cleared-storage fresh ending spine pass. Final integration passes 64 files / 467 unit tests, parser parity, lint, formatting, the production build, bundle-boundary verification, and performance bundle budgets.

## Remaining Scope

None inside Phase 12. Broader Space/ending parity remains Phase 13, and full parity QA remains Phase 14.
