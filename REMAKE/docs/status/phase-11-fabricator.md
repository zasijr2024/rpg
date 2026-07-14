# Phase 11 Fabricator Module Status

Status: implementation finalized on 2026-07-11. The player-facing Fabricator module matches the original `ORIGINAL/script/fabricator.js` gameplay contract for discovery, tab placement, recipes, Blueprint visibility, costs, quantities, Upgrade caps, notifications, stores, and persistence. Repository-wide parity/release status remains `HOLD` for later-phase scope.

Entry decision: `GO`. Phase 10 Ship Module is finalized. The existing remediation slices `RA-P1-12` and `RA-P1-14` supplied the connected Fabricator baseline and organic Blueprint route; Phase 11 verified and promoted that baseline against all roadmap acceptance criteria.

## Finalized Scope

- Executioner discovery and safe World return reveal the guarded `A Whirring Fabricator` location in its original position before Ship, without exposing it early.
- The Fabricator displays the original first-arrival notification, redeemed Blueprints, available recipes, exact costs, quantity labels, visible stores, and fabrication messages.
- All nine source recipes are represented exactly: Energy Blade, Fluid Recycler, Cargo Drone, Kinetic Armour, Disruptor, Hypo, Stim, Plasma Rifle, and Glowstone.
- Energy Blade, Fluid Recycler, and Cargo Drone are available without Blueprints. The remaining six recipes stay hidden until their matching redeemed Blueprint exists.
- Every recipe spends Alien Alloy atomically. Hypo produces the original quantity of five; all other recipes produce one. Fluid Recycler, Cargo Drone, and Kinetic Armour respect their original maximum of one.
- Fabricator unlock state, redeemed Blueprints, crafted stores, and active location round-trip through the validated save shape.
- Fabricator remains an isolated lazy UI/domain boundary.

## Acceptance Evidence

- The original-data test now asserts the complete ordered nine-recipe contract, including every key, display name, type, message, cost, Blueprint requirement, maximum, and quantity.
- Runtime/session coverage proves guarded navigation, one-time notification, hidden Blueprint recipes, exact spending and quantities, maximum and affordability rejection without mutation, visible stores, and save/load restoration.
- Scenario-seeded Chromium 1366 coverage proves safe-return unlock, tab placement, Blueprint display, hidden unrelated recipes, Hypo quantity five, store mutation, and fabrication notification through visible controls.
- The cleared-storage Chromium 1366 spine organically acquires a Plasma Rifle Blueprint from the generated Executioner route, safely redeems it, opens Fabricator, crafts the recipe, and continues through Ship and the ending without browser-side state injection.
- The fresh-save spine was updated from obsolete Phase 8/early-Phase 9 mine choices to the finalized canonical Iron and Coal Mine controls, restoring the repository's connected ending proof.
- Phase 11 focused verification passed 3 files / 34 unit tests and both Chromium 1366 Fabricator/fresh-save browser journeys.
- Final integration passed 63 files / 466 unit tests, parser parity, lint, formatting, the production build, bundle-boundary verification, and performance bundle budgets.

## Remaining Scope

None inside Phase 11. Exhaustive Executioner and Blueprint acquisition breadth remains Phase 12, broader Space/ending parity remains Phase 13, and full parity QA remains Phase 14.
