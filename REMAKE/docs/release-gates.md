# Release Gates

Last updated: 2026-07-14

Authority: `REMAKE/release-gates.json`

The project has three cumulative delivery gates. Passing a lower gate never implies that a higher gate is ready, and a representative fresh-save run is evidence for progression reachability rather than proof of exhaustive parity or production readiness.

## Gate Definitions

| Gate                | Meaning                                                                                                                                  | Additional static prerequisites                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Parity Complete`   | The pinned original gameplay and desktop UI scope is complete, explicitly deviated, or deferred, and all parity/integration checks pass. | P0/P1 remediation packages are done; `parity-checklist.md` has no `[ ]` or `[~]` entries; every `[!]` entry links to a real `deviations.md` heading.                                      |
| `Production Beta`   | A Parity Complete build is safe enough for production beta use.                                                                          | `RA-P2-01`, `RA-P2-02`, `RA-P2-05`, `RA-P2-06`, and `RA-P2-07` are done: gate separation, save recovery/migrations, test ownership, production bundle isolation, and performance budgets. |
| `Technical Release Candidate` | A Production Beta build has the configured automated release evidence and is cut from a clean tree; public product sign-off is separate. | `RA-P2-03`, `RA-P2-04`, and `RA-P2-08` are done: release browser/real-zoom matrix, accessibility evidence, and reproducible closure; the Git worktree is clean.                           |

Each gate inherits every prerequisite and command from the gate below it. The runner validates the hierarchy, rejects duplicate command IDs and unknown static checks, performs cheap static preflight checks first, and only launches the expensive command sequence when the preflight is ready.

## Post-Roast Evidence Overlay

The executable `Technical Release Candidate` gate is an automated code and reproducibility gate. The later Phase 14 roast identified evidence that cannot be honestly reduced to that command. Public Release Candidate sign-off additionally follows `status/phase-14-release-readiness-plan-2026-07-12.md`: hosted CI must run on the candidate SHA, the progression policy must be validated before interpreting a fixed 32-seed corpus, at least three strict same-revision unassisted sessions must be recorded (normally continuing to five and up to eight if results conflict), a real screen reader must complete Space and the ending on the normal runtime clock, and the product/release owner must record the original-mode/balance and license/NOTICE decisions.

P14V-01 makes that boundary executable. `gate:rc` is explicitly technical, `study:progression` identifies itself as a policy diagnostic, the version-2 human gate validates one exact cohort, and the manual Space fixture runs the normal clock without a console API. The separate `study:progression:corpus` command owns P14V-05: it shards the fixed corpus, rejects incomplete or inconsistent coverage, emits one versioned aggregate, and refuses a dirty candidate unless a provisional operator explicitly supplies `--allow-dirty`. `closure:verify-tag` fails closed for open RA, P14R, and P14V packages. A green technical gate still must not be reported as human pacing, real assistive-technology, or public-release approval.

## Commands

Run from `REMAKE/`:

```text
npm run gate:list
npm run gate:parity
npm run gate:beta
npm run gate:rc
npm run closure:status
npm run closure:verify-tag -- <tag>
```

`gate:list` reports all three static readiness states without failing merely because work remains. Gate execution exits `0` only when all inherited prerequisites and commands pass, `1` when the gate is blocked or a command fails, and `2` for invalid configuration or invocation. Add `-- --json` for machine-readable output or `-- --dry-run` to list the command plan after a successful static preflight.

Candidate evidence must come from the clean-checkout procedure in `git-versioning.md`: initialize submodules, install from the lockfile with `npm ci`, install the release browsers, and run the gate on the exact reviewed SHA. Passing commands from the current dirty implementation worktree are integration evidence, not a clean candidate claim.

`closure:status` prints program `P14V-2026-07-12`, the exact Git revision, every non-`done` RA/P14R/P14V package ID, current worktree state, and the static result (with blockers) of every release gate. `closure:verify-tag -- <tag>` reads both ledgers and the checklists from the tag itself and fails unless the tag resolves to `HEAD`, the worktree is clean, and the tagged ledgers have zero open IDs.

## Executed Checks

`Parity Complete` runs the reproducible parity artifact check, negative type fixtures, the full unit/content suite, lint, formatting, production build, and the four-project desktop Chromium parity suite. `Production Beta` inherits those checks and adds the production performance lane and production dependency audit. `Release Candidate` inherits both lower gates, requires a clean tree, runs a served-`dist` Chromium/Firefox/WebKit smoke, a build-external complete production spine, the deterministic four-seed progression diagnostic, the separately owned release browser/real-zoom/accessibility suite, and the complete dependency audit. `test:e2e:parity` stays the pinned desktop parity matrix. `test:e2e:production` verifies fresh command/save/reload, blocked-storage startup, pooled-event loading, lazy-route failure recovery, and Fabricator/Ship/active-Space routes against the production bundle in all three engines. `test:e2e:production-spine` restores a save created by the full visible-control route into served `dist` and verifies the ending without shipping the test harness. `test:e2e:release` runs the fresh ending spine, save/background reload, modal isolation/focus, 100/125/150/200-percent effective-viewport World and long-event matrices, and axe WCAG A/AA smokes in all three engines. `test:e2e:a11y` runs the focused Room, World, Combat, and Space scans; recorded real-screen-reader evidence remains separate. `study:progression` is diagnostic and intentionally does not claim a human completion threshold. The longer 32-seed `study:progression:corpus` remains a separately retained P14V artifact rather than silently extending the technical RC gate.

## Current Result

The accepted Phase 14 gate record on 2026-07-11 passed Production Beta with 69 unit/content files and 483 tests, 381 Chromium parity executions, production performance, and zero production vulnerabilities; its served-`dist` matrix passed 9/9 and its release matrix passed 27/27.

The later roast-remediation integration passed 72 files / 508 tests, parity, types, lint, formatting, the tightened production build, 15/15 served-`dist` executions across Chromium/Firefox/WebKit, 1/1 complete production spine, 12/12 focused cross-browser accessibility scans, and both dependency audits with zero vulnerabilities. The original four-seed progression policy completed 0/4 and classified every stop; after policy/runtime corrections, clean candidate `d3696de` reproduced 4/4 with 11 legal deaths and no failures. Neither result is a player statistic; the fixed 32-seed corpus remains separate P14V-05 evidence.

Candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18` passed Parity Complete, Production Beta, and the technical Release Candidate gate from a separate clean checkout on 2026-07-14. The workflow exists locally but has not yet been proven by a hosted GitHub run. Public sign-off remains `HOLD` pending hosted CI, the 32-seed corpus, human and real-screen-reader evidence, licensing/decision work, and the final tag.
