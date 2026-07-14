# RA-P2-01 Closure: Release Gate Separation

## Scope

Close M-05's planning defect by separating `Parity Complete`, `Production Beta`, and `Release Candidate` into distinct executable gates without claiming that still-pending production work is complete.

## Delivered

- `REMAKE/release-gates.json` is the versioned machine authority for the three cumulative gates.
- `scripts/release-gates.mjs` resolves inheritance, validates configuration, reads the remediation ledger and parity/deviation authorities, checks Release Candidate repository cleanliness, and executes each inherited command exactly once.
- `gate:list`, `gate:parity`, `gate:beta`, and `gate:rc` provide human-readable output; `--json` exposes machine-readable results and `--dry-run` exposes a ready gate's command plan.
- Static blockers stop expensive test execution. Exit code `0` means a gate passed, `1` means evidence is blocked or a command failed, and `2` means invocation/configuration is invalid.

## Gate Ownership

- `Parity Complete` owns pinned-original gameplay/UI completion, linked deviations, reproducible parity artifacts, compiler fixtures, unit/content tests, lint, formatting, production build, and the desktop browser matrix.
- `Production Beta` inherits Parity and additionally requires P2 save recovery/migrations, test ownership, production bundle isolation, performance budgets, and a production dependency audit.
- `Release Candidate` inherits Beta and additionally requires browser/real-zoom release evidence, accessibility evidence, reproducible closure, a clean Git tree, and the complete dependency audit.

## Deterministic Evidence

- Focused tooling tests cover hierarchy/order, cycles, missing parents, duplicate command IDs, unknown static checks, package-status parsing including annotated `done` states, parity checklist counts, deviation-link validation, Beta/RC package separation, and RC-only clean-tree enforcement.
- `npm run gate:list` reports all three gates blocked without returning a failing inspection command.
- `npm run gate:parity -- --dry-run` exits `1` before expensive commands and reports the actual current denominator: 2 open and 56 partial parity checklist entries.
- Beta and RC additionally expose only their owned pending package blockers; RC also reports the current dirty worktree.
- `npm run parity:check`, negative type fixtures, lint, formatting, and the production build passed; the known production chunk warning remains owned by `RA-P2-06/07`.
- Full integration: 42 unit-test files / 446 tests passed; 302 Playwright tests passed with 130 expected skips in 5.0 minutes.

## Revision And Tree State

- Branch: `remake/parity`
- Base revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`
- The working tree was already dirty from the active remediation series. This package preserved prior changes and added only its gate authority, runner, tests, commands, and required documentation.

## Residual Risks

- The gates are intentionally blocked today: exhaustive parity breadth and P2 production evidence remain incomplete.
- Package completion remains controlled by `docs/planning.md`; `RA-P2-08` will add the final revision/open-ID/closure artifact rather than duplicating that future scope here.
- Save recovery/migrations, cross-browser/real-zoom evidence, accessibility evidence, production-bundle isolation, and performance budgets remain owned by their explicit P2 packages.

## Result

`RA-P2-01` is complete. The three delivery claims are now distinct, executable, cumulative, and non-green until their actual evidence exists. `RA-P2-02 Save backup, recovery and migration tests` is active.
