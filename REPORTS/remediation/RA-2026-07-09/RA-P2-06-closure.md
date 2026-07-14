# RA-P2-06 Closure: Production Bundle Boundary

## Scope

Compile-time exclude test harnesses and quarantined spikes from production, and introduce intentional lazy boundaries for player-facing late game.

## Delivered

- Vite sets `__ADR_DEV_SURFACES__` from the serve/build command. Dev retains deterministic Playwright seeds, `window.__adrTest`, debug Settings, and `?spikes=1`; production substitutes `false` before tree-shaking.
- Spike Lab and its spike-only CSS load dynamically only in dev. Production has no manifest entry for `src/testing`, `src/spikes`, `SpikeLab`, or `SettingsView`.
- Fabricator, Ship, and Space views use React lazy loading and appear as three dynamic entries in the production manifest.
- Space reacquires its focus owner after the async component mount, preserving its keyboard focus contract.
- `npm run build` now emits `dist/.vite/manifest.json` and runs `scripts/verify-production-bundle.mjs`. The verifier rejects forbidden source entries/asset markers and non-dynamic late-game views.

## Verification

- Production output: 17.79 kB CSS; 1.41 kB Fabricator, 2.14 kB Space, and 2.22 kB Ship lazy chunks; 569.31 kB main JS.
- `npm run parity:check` and `npm run typecheck:fixtures`: passed.
- `npm test`: 63 files / 457 tests passed.
- `npm run lint` and `npm run format:check`: passed.
- `npm run build`: TypeScript, Vite, and the production-bundle verifier passed.
- `npm run test:e2e -- --workers=3`: 330 passed with 130 intentional skips after focused correction of the four Space visual baselines exposed by the first integration run.

## Scope Boundary

The remaining main-chunk warning is not hidden or reclassified. Measured bundle, startup, long-task, and long-idle budgets belong to `RA-P2-07`.

`RA-P2-06` is complete. `RA-P2-07 Performance budgets` is active.
