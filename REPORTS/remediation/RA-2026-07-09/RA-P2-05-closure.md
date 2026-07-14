# RA-P2-05 Closure: Test Ownership Split

## Scope

Split test ownership along product-domain contracts and make browser evidence classification mechanically mandatory. No production behavior changed.

## Delivered

- Replaced the cross-domain `app.spec.ts` browser monolith with Room/Outside, Event/Combat, and World contract files.
- Split EventRuntime, GameSession, and event-data coverage into named Engine and Content domain-contract directories.
- Added `test-ownership.test.ts`, which rejects restored monolith paths, expected-domain omissions, test sources over 2,600 lines, and any E2E title without an approved evidence label.
- Classified every Playwright contract as `fresh-run`, `scenario-seeded`, `headless`, `browser`, `visual`, or `manual-a11y`.

## Verification

- `npm test`: 63 files / 457 tests passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run build`: passed; the pre-existing production chunk-size warning remains owned by `RA-P2-06/07`.
- `npm run test:e2e -- --workers=3`: 330 passed, 130 intentional skips, 4.1 minutes.

## Scope Boundary

This package establishes ownership and evidence classification only. Compile-time production-bundle exclusion, lazy loading, and performance budgets remain owned by `RA-P2-06` and `RA-P2-07`.

`RA-P2-05` is complete. `RA-P2-06 Production bundle boundary` is active.
