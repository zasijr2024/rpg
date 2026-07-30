# Git Versioning Plan

Last updated: 2026-07-30

Decision: use git immediately for the remake.

## Repository Root

Initialize git at:

```text
F:\ADR20
```

## Tracked Project Areas

Track:

- `ORIGINAL/` as immutable source/reference material
- `DATA/` extracted and generated data references
- `ANALYSE/`
- `GUIDE/`
- `REMAKE/`
- `REPORTS/`
- `TOOLS/`
- future remake source code

Do not track:

- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- `playwright-report/`
- `test-results/`
- env files
- logs
- temporary files
- generated caches

## Branches

- `main`: stable documented baseline
- `remake/parity`: current parity/remediation worktree
- a reviewed release-readiness branch or pull request: recommended for the P14V clean/CI evidence; name it when the maintainer authorizes publication to the remote
- short-lived risk branches:
  - `engine-state`
  - `events-runtime`
  - `world-map`
  - `combat`
  - `space`

## Commit Strategy

Use intentional commits:

1. reference/source/data baseline
2. planning and audit hardening
3. scaffold
4. one commit or small series per phase

Avoid mixed commits that combine unrelated data changes, architecture changes, and UI work.

For the current post-Phase 14 checkpoint, first review every tracked, untracked, deleted, and submodule change. Do not bulk-stage a worktree with unknown ownership. Keep source/data baseline changes, parity implementation, roast remediation, and planning/evidence changes separable where the actual diff permits it. The maintainer must authorize commit/push actions.

Follow `status/phase-14-post-remediation-next-steps-2026-07-30.md`. No planning
document authorizes staging, commits, pushes, pull requests, workflow dispatch,
branch-protection changes, deployments, or tags.

## Tags

Recommended milestone tags:

- `data-extraction-complete`
- `plan-approved`
- `phase-0-scaffold`
- `phase-1-core-engine`
- `phase-2-data-foundation`
- `parity-complete`

Post-Phase 14 tags:

- an optional annotated implementation checkpoint may use a name such as `phase-14-implementation-checkpoint-1`, but it must state that human/public-release evidence is pending;
- candidate package version `0.1.0-rc.1` is authorized for the replacement P14V-02 checkpoint; this package version does not grant public `GO` or authorize an RC tag;
- do not use `release-candidate`, `v*-rc.*`, or closure language until `P14V-08` records `GO` and P14V-09's final candidate/tag manifest is authorized;
- never move a published checkpoint or release tag; create a new increment after candidate-changing fixes.

## Candidate Reproduction

`P14V-02` freezes a reviewed SHA, then validates it from a separate clean clone or worktree:

```text
git submodule update --init --recursive
cd REMAKE
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run gate:rc
```

Record the exact SHA, clean `git status --short`, Node/npm versions, commands, and results. `P14V-03` must then prove both hosted workflow lanes on that same SHA. A candidate-changing fix creates a new SHA and repeats the clean and hosted checks.

Call the product candidate `C` and its complete production-tree identity `A`.
Human and assistive-technology evidence may later be committed in an
evidence-only descendant `F` only if `git diff C..F` contains evidence,
status, or session records and a clean rebuild still equals `A`. Any source,
public asset, package/dependency, build configuration, workflow, runtime,
balance, or artifact change creates a new candidate and repeats downstream
evidence.

The target branch must require the stable always-reporting `Remake CI required`
context. Record the branch-protection/ruleset URL or ID and prove both an
out-of-scope success and an in-scope candidate that cannot pass without the
full three-engine lane.

The `closure:verify-tag` parser reads the historical RA ledger plus P14R/P14V status from the tagged revision and fails closed while any owned package remains open. The executable RC gate remains technical; zero open package IDs are additionally required for Phase 14 product closure.

Avoid self-referential tag evidence. P14V-09 is the pre-tag authorization
package: its final manifest records exact `A`, approved tag name/message,
gate/host evidence, and “revision: the commit containing this manifest, resolved
by the annotated tag.” Once that package is `done`, create the authorized local
annotated tag, run `closure:verify-tag -- <tag>`, publish only after `PASS`, and
retain the resolved full SHA/tag result in append-only post-tag evidence. A
tagged commit cannot contain the result of a future tag operation or its own
literal full hash.

## Source Protection

`ORIGINAL/` is reference source. Do not edit it during remake implementation. If the upstream baseline changes intentionally, update `REMAKE/docs/source-baseline.md`, regenerate `DATA/canonical-manifest.json`, and commit that as a source-baseline change.

`ORIGINAL/` is tracked as a git submodule pinned to `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`. Clones must initialize submodules to restore the original source tree:

```text
git submodule update --init --recursive
```
