# P14V-02 Workflow-Candidate Clean Reproduction - 275c096

- Date completed: 2026-08-01
- Program: `P14V-2026-07-12`
- Frozen candidate `C2`: `275c096247e5fe2026e00c1f67eb78cd4668ccaf`
- LFS-rewritten production-equivalent base: `fc4a2e8`
- Package version: `0.1.0-rc.1`
- Technical result: **PASS**
- Public Release Candidate status: **HOLD**

This is the clean-candidate record for the hosted workflow repair. The earlier
`6de3979` clean reproduction and its `ca177fe` evidence handoff remain
immutable historical evidence for the pre-LFS local lineage. Tree comparison
between `fc4a2e8` and `6de3979` differs only in `.gitattributes` and the LFS
representation of the AssetRipper executable; the remake production tree is
unchanged. Commits `eca2203`, `091bce0`, and `275c096` change only
`.github/workflows/remake-ci.yml`.

## Clean environment and command

| Field      | Recorded value                                 |
| ---------- | ---------------------------------------------- |
| Worktree   | separate clean worktree `F:\ADR20-P14V-CI-FIX` |
| Revision   | `275c096247e5fe2026e00c1f67eb78cd4668ccaf`     |
| `ORIGINAL` | `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`     |
| Node / npm | `v24.18.1` / `11.7.0`                          |
| Platform   | Windows x64                                    |
| Command    | `npm run gate:rc` from `REMAKE/`               |
| Duration   | 1,541.6 seconds                                |
| Result     | exit `0`; `Technical Release Candidate: PASS`  |

The gate passed parity generation, type boundaries, 77 files / 550 tests,
lint, formatting, build and budgets, dependency audits, 410 desktop parity
executions with 166 intentional skips, production smoke, production spine,
release browsers, accessibility, performance, and the four-seed policy
diagnostic.

## Artifact identity

The gate produced the unchanged canonical artifact:

```text
sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c
```

- Algorithm: `sha256-tree-v1`
- Files: 16
- Bytes: 646,179

This technical pass does not count as hosted, human, real assistive-technology,
owner, production-host, tag, or publication evidence.
