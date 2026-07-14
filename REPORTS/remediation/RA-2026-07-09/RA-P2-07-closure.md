# RA-P2-07 Closure: Performance Budgets

## Scope

Make bundle size, startup responsiveness, long tasks, and idle responsiveness measurable production regressions that fail CI.

## Delivered

- Added `REMAKE/performance-budgets.json` as a versioned, explicit budget authority.
- Production builds run `scripts/verify-performance-budgets.mjs` after the production-boundary verifier. It reads Vite's manifest, measures raw and gzip asset sizes, and fails on an initial/total JavaScript, CSS, or lazy-entry regression.
- Added `npm run test:e2e:performance`, which serves the compiled production bundle and measures Chromium startup, Long Tasks, and idle timer delay. The test attaches the sampled metrics as JSON.
- Added the production performance run to the Production Beta gate, so it cannot be bypassed by a passing development-server browser suite.

## Budgets And Baseline

| Surface | Budget | Observed baseline |
| --- | ---: | ---: |
| Initial JavaScript | 600,000 B raw / 150,000 B gzip | 569,316 B / 136,506 B gzip |
| All JavaScript | 610,000 B raw / 155,000 B gzip | 575,100 B / 138,757 B gzip |
| All CSS | 24,000 B raw / 6,000 B gzip | 17,797 B / 4,026 B gzip |
| Each lazy entry | 4,000 B raw / 2,000 B gzip | 1,417–2,224 B raw |
| Startup | 4,000 ms | focused Chromium gate passed |
| Individual / cumulative Long Tasks | 250 ms / 500 ms | focused Chromium gate passed |
| Idle Long Task / timer delay | 100 ms / 150 ms | focused Chromium gate passed |

## Verification

- `npm run build`: passed; production-boundary and bundle-performance verifiers passed.
- `npm run test:e2e:performance`: passed in desktop Chromium against the production preview server.
- `npm test`: 63 files / 457 tests passed.

`RA-P2-07` is complete. `RA-P2-08 Reproducible phase closure` is active.
