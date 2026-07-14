# P14V-02 Scope Review And Clean Reproduction

Date opened: 2026-07-14  
Program: `P14V-2026-07-12`  
Current base revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`  
Status: **PENDING — path inventory recorded; ownership, commits, and clean reproduction are not complete**

This is a live fail-closed record. Nothing below is a clean-candidate claim until the final execution fields are completed against one committed revision from a separate clean checkout.

## Working-Tree Inventory

Commands run from the repository root:

```text
git status --porcelain=v1
git diff --stat
git diff --check
git ls-files --others --exclude-standard
git submodule status
```

Inventory at opening:

- 105 tracked paths changed: 101 modified and 4 deleted;
- 202 untracked files;
- 307 changed or untracked paths in total;
- tracked diff: 12,685 insertions and 21,574 deletions across 105 paths;
- `git diff --check`: no whitespace errors; Git reported expected LF-to-CRLF checkout warnings on tracked text files;
- `ORIGINAL` submodule status: `-1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`, meaning it is not initialized in this checkout. P14V-02's clean reproduction must initialize submodules recursively.

The four tracked deletions are large former aggregate tests. They have apparent split-suite replacements and must be staged with those replacements, never as isolated deletions:

| Deleted aggregate | Replacement area requiring joint review |
| --- | --- |
| `src/tests/content/event-data-coverage.test.ts` | `src/tests/content/event-data/` plus parser/parity tests |
| `src/tests/engine/event-runtime.test.ts` | `src/tests/engine/event-runtime/` |
| `src/tests/engine/game-session.test.ts` | `src/tests/engine/game-session/` |
| `src/tests/e2e/app.spec.ts` | the expanded contract, slice, accessibility, production, and release E2E suites |

## Scope Buckets

The current work is not safe as one undifferentiated checkpoint. Review and staging should use these ownership boundaries:

1. **Canonical extraction and source data** — `DATA/`, canonical manifests/parity graph, extraction tooling, original content tables, parser coverage, source-baseline documentation, and their generated copies. Generated artifacts must be regenerated and compared in the same checkpoint as their source/tool changes.
2. **Phase 9–13 gameplay parity** — setpieces, Executioner, Ship, Fabricator, Space/ending, resource authority, domain facades, runtime/UI surfaces, and their focused unit/browser tests.
3. **Phase 14 QA and roast remediation** — save recovery, background clock behavior, lazy-route containment, accessibility/Space feed, performance/bundle budgets, production/release Playwright lanes, visual baselines, and corresponding regression tests.
4. **P14V evidence implementation** — phase-aware closure, progression policy/corpus tooling, strict playtest contracts, manual real-time Space fixture, CI workflow, release-gate documentation, and P14V evidence records.
5. **Project documentation and audit evidence** — phase status files, ledgers, changelog, parity/audit reports, remediation closure records, and repository indexes. These must describe the exact code checkpoint they accompany.
6. **Repository audit-skill development** — `TOOLS/SKILLS/roast/**` and its indexes. This is not required to run the remake and should remain a separately owned checkpoint unless the maintainer explicitly decides it belongs in the Phase 14 history.

The 54 modified/untracked visual PNG baselines belong with the UI behavior and visual test that produced them. They require visual-review confirmation; passing snapshot comparisons alone does not establish reviewer ownership.

## Dirty-Tree Preflight

This preflight reduces checkpoint risk but does not satisfy clean reproduction:

- focused P14V tooling contracts: **18/18 passed** across 3 files;
- full unit/content suite: **513/513 passed** across 73 files;
- normal-clock manual Space fixture: **4/4 passed** across the target Chromium viewports;
- static gates: Parity Complete `READY`, Production Beta `READY`, Technical Release Candidate `BLOCKED (1)` by the dirty tree;
- `git diff --check`: passed, with checkout line-ending warnings only.

These results cover the current uncommitted working state. They must be rerun from the clean candidate and cannot be cited as P14V-02 completion.

## Required Maintainer Decisions

- Confirm that the repository audit-skill edits belong in this branch; otherwise preserve them for a separate checkpoint without deleting them.
- Confirm that the three standalone historical audit reports and 25 historical RA closure records belong in the repository history.
- Confirm the four aggregate-test deletions are intentional replacements after reviewing test ownership/coverage.
- Review the 54 visual baselines at all four target viewports.
- Choose coherent commit boundaries. Commit, push, workflow dispatch, and tag creation have not been performed by this implementation pass.

## Clean-Reproduction Record

Complete only after the ownership decisions and coherent commits exist:

| Field | Required value |
| --- | --- |
| Candidate revision | `PENDING` |
| Source checkout status | `PENDING` |
| Separate clean checkout path | `PENDING` |
| Clean checkout `git status --short` | `PENDING` |
| Recursive submodule initialization | `PENDING` |
| Node/npm/OS | `PENDING` |
| `npm ci` | `PENDING` |
| Chromium/Firefox/WebKit installation | `PENDING` |
| `npm run gate:rc` | `PENDING` |
| Technical RC result | `PENDING` |

Exit remains blocked until every field above is populated for the same exact candidate revision and the clean technical RC gate passes.
