# P14V-02 Post-Remediation Clean Reproduction - 6de3979

- Date completed: 2026-07-30
- Program: `P14V-2026-07-12`
- Candidate `C`: `6de3979955719ffae80dd25a7a429d8f8a595368`
- Package version: `0.1.0-rc.1`
- Technical result: **PASS**
- Public Release Candidate status: **HOLD**

This record closes the technical clean-reproduction work for the
post-remediation candidate. It does not prove hosted CI or required branch
protection, provide the replacement 32-seed corpus, count as human or real
assistive-technology evidence, grant a public-distribution decision, authorize
a tag, or authorize publication.

The historical `P14V-02-clean-reproduction.md` remains immutable evidence for
candidate `d3696de`. This record does not relabel or overwrite it.

## Approved Checkpoint Lineage

The maintainer approved the exact three groups in
`REMAKE/docs/status/phase-14-p14v-02-checkpoint-map-2026-07-30.md`, selected
`0.1.0-rc.1`, and authorized only their listed Git writes while excluding the
protected playtest worksheet.

The approved checkpoints were formed with exact staged-path equality checks:

| Revision                                   | Subject                                                                   | Paths |
| ------------------------------------------ | ------------------------------------------------------------------------- | ----: |
| `acce5353ffe8512950be9390d8c56b225b0878a8` | `fix(remake): harden runtime recovery and player operability`             |    71 |
| `80d6bb65ed876f8ba7fc5376ce209df1d3a11dd8` | `chore(release): make candidate evidence and hosted controls fail closed` |    34 |
| `0f55d71de5aca811a8053fdf54fe7a8e785a0d3b` | `docs: establish the post-remediation candidate handoff`                  |    16 |

The only remaining source-worktree path was the protected untracked worksheet
`REMAKE/playtests/feedback/p14v-local-session-01.md`, unchanged at SHA-256
`E4EF62F1BE0F169C67B61BC4E58465F37AD15F19F5EB4A05920D0117D0EBB0E9`.

## Fail-Closed Candidate Iterations

Clean reproduction exposed two advisories published against the locked
dependency versions. Both were fixed before accepting a candidate:

1. `0f55d71de5aca811a8053fdf54fe7a8e785a0d3b` passed parity generation,
   type boundaries, 77 files / 550 tests, lint, formatting, build, 410 desktop
   parity executions, and performance, then correctly failed the production
   audit on `postcss <=8.5.17` (`GHSA-r28c-9q8g-f849`).
2. `73cb05cb7810bc13f69602be2c457be6c2f94776` updated PostCSS `8.5.16` to
   `8.5.25` and NanoID `3.3.15` to `3.3.16`. Its clean gate passed every
   functional, browser, progression, and production-audit check, then correctly
   failed the complete audit on `brace-expansion <=5.0.7`
   (`GHSA-mh99-v99m-4gvg`).
3. `6de3979955719ffae80dd25a7a429d8f8a595368` updated brace-expansion
   `5.0.7` to `5.0.9`. A fresh locked install and the complete clean technical
   RC gate then reported zero vulnerabilities and passed.

The two advisory fixes changed only `REMAKE/package-lock.json`, an approved
Group 2 path. Each exact lockfile result was first resolved and audited in an
isolated temporary probe, then committed with a one-path staged equality guard.

## Clean Environment

| Field                       | Recorded value                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Candidate revision          | `6de3979955719ffae80dd25a7a429d8f8a595368`                                                                                          |
| Candidate checkout          | detached worktree `C:\tmp\adr20-p14v02-6de3979`                                                                                     |
| Candidate status            | empty before dependency installation, before gate, and after gate/rebuild                                                           |
| Source branch               | `remake/parity` at the same revision                                                                                                |
| Recursive submodule         | clean `ORIGINAL` at `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`                                                                      |
| Declared submodule URL      | `https://github.com/doublespeakgames/adarkroom.git`                                                                                 |
| Submodule initialization    | recursive local-mirror clone from the already verified `F:/ADR20/ORIGINAL` object store after an earlier upstream attempt timed out |
| Node                        | `v24.18.1`                                                                                                                          |
| npm                         | `11.7.0`                                                                                                                            |
| Playwright                  | `1.61.1`; Chromium, Firefox, and WebKit install command passed                                                                      |
| OS                          | Microsoft Windows NT `10.0.19045.0`                                                                                                 |
| Git                         | `2.54.0.windows.1`                                                                                                                  |
| Package version             | `0.1.0-rc.1`                                                                                                                        |
| `package-lock.json` SHA-256 | `2FF0E8F0932C367647D36E5A4373F7E9A8C5B43204BE7E47ACECF9026FC39A51`                                                                  |
| `npm ci`                    | 180 packages installed; 181 audited; zero vulnerabilities                                                                           |

The local-mirror submodule initialization proves the exact pinned content and a
clean recursive checkout. It does not prove current reachability of the
declared GitHub URL; durable exact-source/public-distribution review remains a
P14V-08 input.

## Final Technical RC Gate

Command, run from the clean candidate's `REMAKE/` directory with the Node 24
binary first on `PATH`:

```text
npm run gate:rc
```

Result: exit `0` in 1,605.3 seconds. Final executable verdict:
`Technical Release Candidate: PASS`.

| Gate item                              | Result                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Parity artifacts                       | passed                                                                                                                                |
| Negative type boundaries               | passed                                                                                                                                |
| Unit/content suite                     | 77 files / 550 tests passed                                                                                                           |
| Lint and source formatting             | passed                                                                                                                                |
| Production build/boundary/budgets      | passed                                                                                                                                |
| Desktop Chromium parity                | 410 passed / 166 intentional skips across 1366, 1920, 2560, and 3840 projects                                                         |
| Production performance                 | 1/1 passed                                                                                                                            |
| Production dependency audit            | zero vulnerabilities                                                                                                                  |
| Served-production smoke                | 15/15 passed across Chromium, Firefox, and WebKit                                                                                     |
| Build-external production ending spine | 1/1 passed                                                                                                                            |
| Four-seed progression diagnostic       | 4/4 classified completions; 11 legal deaths; 6,748 incidental events; 439 combats; zero policy, game-defect, or unclassified failures |
| Release real-zoom/accessibility matrix | 33/33 passed across Chromium, Firefox, and WebKit                                                                                     |
| Complete dependency audit              | zero vulnerabilities                                                                                                                  |

The progression result is deterministic automation evidence, not a human
completion rate or pacing statistic.

The full temporary gate log is
`C:\tmp\p14v02-6de3979-gate.log`: 342,404 bytes, SHA-256
`08D0817596466C8B9624098E5C1525F8EFBC410937B7E1181B3466E095186E89`.
It is session-local supporting output, not a portable repository artifact.

## Artifact Reproduction

The gate's production build produced:

```text
sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c
```

- Algorithm: `sha256-tree-v1`
- Files: 16
- Bytes: 646,179
- Initial JavaScript: 436,405 B / 123,783 B gzip
- Lazy entries: 8

`npm run artifact:identity` recorded that value, `npm run build` rebuilt the
candidate, and a second `npm run artifact:identity` returned the identical
value. The worktree and submodule remained clean afterward.

## Evidence Descendant Verification

Verified evidence checkpoint `F1` is
`1d505dc8069ea55d688ae67d0bdd523908b0bc56`. Its `C..F` delta contains exactly
17 evidence/status paths and no source, public asset, dependency, workflow,
build, runtime, or balance change.

A separate detached worktree at
`C:\tmp\adr20-p14v05-evidence-1d505dc` initialized the pinned ORIGINAL
submodule, used Node `v24.18.1` and npm `11.7.0`, completed `npm ci` with zero
vulnerabilities, and passed `npm run build`. `npm run artifact:identity`
returned exactly:

```text
sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c
```

`npm run closure:status` on that clean worktree reported Parity Complete,
Production Beta, and Technical Release Candidate `READY`; phase closure remained
blocked by seven honest P14R/P14V evidence packages.

Finalized local handoff checkpoint `H` is
`ca177fee971c71f0cb7a09b571989af3dc1b3849`. Its full `C..H` delta contains 19
evidence/status paths only. A second detached worktree at
`C:\tmp\adr20-final-handoff-ca177fe` initialized the same pinned submodule,
used Node `v24.18.1` and npm `11.7.0`, completed `npm ci` with zero
vulnerabilities, passed `npm run build`, and reproduced exactly the same
16-file, 646,179-byte artifact. `npm run closure:status` again reported all
three technical gates `READY` and the same seven open evidence packages.

## Exit And Next Gates

P14V-02's technical exit criteria are met for candidate `C` and artifact `A`
above. The candidate is frozen unless a source, public asset, dependency,
workflow, build, runtime, or balance change creates a replacement candidate.

P14V-05 is complete on this candidate. P14V-03 hosted CI and
required-branch-control proof is deferred after authenticated GitHub preflight
found an oversized tracked blob and unavailable private-repository rulesets.
Human playtests and real screen-reader collection remain unopened while that
automated prerequisite is deferred. Public Release Candidate status remains
`HOLD`.
