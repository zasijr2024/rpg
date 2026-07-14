# RA-P0-05 Closure: Atomic Death and Cooldown

Closed: 2026-07-09 22:57 +02:00

Source finding: C-03  
Audit authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`  
Baseline revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`  
Implementation state: uncommitted working tree; package SHA pending a user-directed commit

## Scope

Added one atomic death-abort contract for active expeditions and the original 120-second Path embark cooldown. Coordinate-scoped landmark identity and safe-return blueprint redemption remain owned by later packages.

Changed paths:

- `REMAKE/src/engine/world/ExpeditionTransaction.ts`
- `REMAKE/src/engine/world/WorldRuntime.ts`
- `REMAKE/src/engine/combat/CombatRuntime.ts`
- `REMAKE/src/engine/events/EventRuntime.ts`
- `REMAKE/src/engine/path/PathRuntime.ts`
- `REMAKE/src/engine/index.ts`
- `REMAKE/src/ui/PathView.tsx`
- `REMAKE/src/tests/engine/death-rollback.test.ts`
- `REMAKE/src/tests/engine/resource-authority.test.ts`
- `REMAKE/src/tests/e2e/app.spec.ts`
- `REMAKE/docs/status/phase-8-world.md`

## Requirements

- Death restores the embark-time World map, mask, flags, position, and transaction baseline: passed.
- Death closes World, removes the transaction draft, destroys the carried outfit, and returns to Room: passed.
- World survival death, Combat death, and lethal World-event HP costs use the same idempotent boundary: passed.
- Repeated death finalization cannot restart or extend the cooldown: passed.
- Embark remains blocked through 119999 ms and releases at exactly 120000 ms: passed.
- Path renders the remaining cooldown and prevents activation while it is active: passed.
- Fresh-run Old-House mutation is restored after death, cooldown, and re-embark: passed.

## Evidence

- Focused Vitest suites: 240 passed.
- Chromium 1366 fresh-run death rollback contract: passed in 46 seconds.
- Full Vitest gate: 387 passed.
- Build, lint and formatting: passed.
- Full Playwright gate: 249 passed, 83 intentional project skips.

## Residual Risks

- Coordinate-scoped landmark identity remains assigned to `RA-P0-06`.
- Safe-return-only blueprint redemption remains assigned to `RA-P0-07`.
- The aggregate organic P0 contract suite remains assigned to `RA-P0-08`.
- Durable cooldown/save compatibility remains governed by the later save packages.
- The repository was already dirty before this package; no clean-tree or closure-tag claim is made.
