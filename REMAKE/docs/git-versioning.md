# Git Versioning Plan

Last updated: 2026-07-06

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
- `remake/parity`: active parity implementation
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

## Tags

Recommended milestone tags:

- `data-extraction-complete`
- `plan-approved`
- `phase-0-scaffold`
- `phase-1-core-engine`
- `phase-2-data-foundation`
- `parity-complete`

## Source Protection

`ORIGINAL/` is reference source. Do not edit it during remake implementation. If the upstream baseline changes intentionally, update `REMAKE/docs/source-baseline.md`, regenerate `DATA/canonical-manifest.json`, and commit that as a source-baseline change.

`ORIGINAL/` is tracked as a git submodule pinned to `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`. Clones must initialize submodules to restore the original source tree:

```text
git submodule update --init --recursive
```

