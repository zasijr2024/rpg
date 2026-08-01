# P14V-03 Hosted CI Validation

- Date completed: 2026-08-01
- Candidate revision: `275c096247e5fe2026e00c1f67eb78cd4668ccaf`
- Repository: `zasijr2024/rpg`
- Pull request: [#1](https://github.com/zasijr2024/rpg/pull/1)
- Status: **PASS**

Historical revision `d3696de` had no hosted run. The first publication attempt
for the post-remediation lineage failed closed on GitHub's 100 MB blob limit.
The published remote lineage uses Git LFS for the 124,776,960-byte AssetRipper
executable; `fc4a2e8` and local candidate `6de3979` otherwise differ only in
`.gitattributes` and that executable's LFS representation.

## Enforced required context

Repository ruleset
[P14V required pull-request validation](https://github.com/zasijr2024/rpg/rules/20083779)
is active on the default branch. It requires strict successful status context
`Remake CI required`, blocks deletion and non-fast-forward updates, has no
bypass actors, and reports that the authenticated maintainer cannot bypass it.

## Final hosted evidence

| Field                    | Recorded value                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| Workflow revision        | `275c096247e5fe2026e00c1f67eb78cd4668ccaf`                                                 |
| Pull-request change lane | [run 30700296963](https://github.com/zasijr2024/rpg/actions/runs/30700296963), **SUCCESS** |
| Required context         | `Remake CI required`, **SUCCESS**                                                          |
| Manual full technical RC | [run 30700299995](https://github.com/zasijr2024/rpg/actions/runs/30700299995), **SUCCESS** |
| Hosted Node target       | Node 24                                                                                    |
| Required ruleset         | ID `20083779`, active, strict, default branch                                              |

The pull-request run passed classification, clean install, parity artifacts,
type boundaries, 77 files / 550 tests, lint, formatting, build and budgets,
dependency audit, and bounded production smoke in Chromium, Firefox, and
WebKit. The manual run passed the same change lane plus the complete clean-tree
release-candidate gate on `windows-latest`.

The always-run release-evidence uploader found no `playwright-report` or
`test-results` directories after the clean pass and, by its explicit
`if-no-files-found: ignore` policy, retained no failure artifact. The workflow
logs and run identities remain the hosted evidence.

## Retry and root-cause record

1. Runs `30587879143` and `30587896837` failed because checkout left the
   tracked LFS object as a pointer; the required reporter also inherited the
   `REMAKE` working directory before checkout.
2. Commit `eca2203` enabled LFS checkout and rooted the reporter. Runs
   `30664476790` and `30664480747` then failed parity because Linux checkout
   normalized the pinned original source to LF.
3. Commit `091bce0` configured canonical CRLF checkout. Pull-request run
   `30668777468` passed, while dispatch run `30668782676` exposed the
   Windows-only visual baseline contract on Ubuntu.
4. Commit `275c096` kept the bounded change lane on Ubuntu and moved the full
   visual RC gate to Windows. Both final runs passed on the same SHA.

P14V-03 is closed for this candidate. This record does not claim human,
assistive-technology, product-owner, production-host, tag, or publication
evidence.
