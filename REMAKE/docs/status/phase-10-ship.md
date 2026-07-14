# Phase 10 Ship Module Status

Status: implementation finalized on 2026-07-11. The player-facing Ship module matches the original `ORIGINAL/script/ship.js` gameplay contract for discovery, display, upgrades, lift-off gating, notifications, and persisted state. Repository-wide parity/release status remains `HOLD` for later-phase scope.

Entry decision: `GO`. Phase 9 Setpieces and Dungeons is finalized, and its canonical Crashed Ship route preserves organic World discovery and safe-return unlock behavior. The existing remediation slices `RA-P1-11`, `RA-P1-13`, and `RA-P1-14` supplied the connected implementation baseline; Phase 10 verified and promoted that baseline against the roadmap acceptance criteria.

## Finalized Scope

- Organic Crashed Ship discovery remains owned by the Phase 9 Setpiece route, while safe World return unlocks the guarded `An Old Starship` location and initializes hull `0` plus engine/thrusters `1` without overwriting later upgrades.
- The Ship surface displays current hull, engine/thrusters, Alien Alloy stores, exact one-Alien-Alloy reinforcement and engine-upgrade costs, and the original first-arrival notification.
- Hull reinforcement and engine upgrades spend atomically, persist in the validated save shape, and emit the original insufficient-alloy notification without partial mutation.
- Lift-off is disabled at zero hull, enabled at positive hull, presents the original one-time `Ready to Leave?` warning with `lift off` and `linger`, and hands confirmed or subsequent departures to the live Space runtime.
- A crash returns to Ship and applies the original 120-second lift-off cooldown. The cooldown read model keeps the visible lift-off control disabled until it expires.
- Ship is an isolated lazy UI/domain boundary and remains hidden before discovery.

## Acceptance Evidence

- Original data contract: `SHIP_ALLOY_PER_HULL = 1`, `SHIP_ALLOY_PER_THRUSTER = 1`, `SHIP_BASE_HULL = 0`, `SHIP_BASE_THRUSTERS = 1`, and `SHIP_LIFTOFF_COOLDOWN = 120` are covered by content tests.
- Runtime/session coverage proves guarded navigation, one-time arrival notification, exact costs, insufficient-resource atomicity, lift-off warning/linger behavior, positive-hull gating, crash cooldown, and save/load restoration.
- Organic Chromium 1366 coverage travels through Borehole salvage and canonical Crashed Ship discovery, safely returns, opens the newly revealed Ship tab, reinforces the hull, and observes the original display and notification behavior.
- Connected Chromium 1366 coverage uses visible Ship controls to enter the live Space loop and reach the ending.
- Phase 10 focused verification passed 3 files / 31 unit tests and both Chromium 1366 Ship/Space browser journeys.
- Final integration passed 63 files / 466 unit tests, parser parity, lint, formatting, the production build, bundle-boundary verification, and performance bundle budgets.

## Remaining Scope

None inside Phase 10. Fabricator UI remains Phase 11, exhaustive Executioner content remains Phase 12, broader Space/ending parity remains Phase 13, and full parity QA remains Phase 14.
