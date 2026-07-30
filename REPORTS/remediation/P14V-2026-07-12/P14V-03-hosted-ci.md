# P14V-03 Hosted CI Validation

Candidate revision: `PENDING_POST_REMEDIATION_CANDIDATE`
Status: `BLOCKED_NO_CONFIGURED_REMOTE_OR_CANDIDATE`

Historical note: revision `d3696de28218bb6c7645302398e1a4b5fe7cba18` had no hosted run and was superseded by the 2026-07-30 remediation. It cannot close this package.

The local workflow exists at `.github/workflows/remake-ci.yml` and defines these job contracts:

- `Remake CI required`, an always-present pull-request sentinel intended for branch protection;
- `Clean install and production verification`, conditional on remake-owned pull-request paths and used for matching pushes to `main`;
- `Scheduled cross-browser Release Candidate gate` for schedule or manual `workflow_dispatch` events.

## Hosted Evidence

| Field                          | Recorded value                                                                                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Git remote                     | none; `git remote -v` and remote configuration returned no entries on the 2026-07-14 initial check, the post-P14V-06 recheck, or the 2026-07-30 remediation recheck                                                                                          |
| GitHub CLI                     | unavailable on the current host (`gh` is not installed); secondary to the missing authorized repository target                                                                                                                                               |
| Action-version preflight       | Local workflow pins immutable full SHAs for `actions/checkout` v6.0.2, `actions/setup-node` v6.4.0, and `actions/upload-artifact` v4.6.2; the tooling contract verifies those pins and the three-engine change lane, while hosted execution remains unproven |
| Protected required check       | `PENDING`; configure branch protection to require `Remake CI required`, then prove an out-of-scope pull request reports success and an in-scope candidate cannot pass it without the full verification lane                                                  |
| Candidate hosted SHA           | `PENDING`                                                                                                                                                                                                                                                    |
| Change-lane run URL/ID         | `PENDING`                                                                                                                                                                                                                                                    |
| Change-lane result             | `PENDING`                                                                                                                                                                                                                                                    |
| Manual technical-RC run URL/ID | `PENDING`                                                                                                                                                                                                                                                    |
| Manual technical-RC result     | `PENDING`                                                                                                                                                                                                                                                    |
| Retry/root-cause record        | `PENDING`                                                                                                                                                                                                                                                    |

No branch was pushed, pull request opened, workflow dispatched, or branch-protection rule changed. Those are external mutations and also require a configured repository destination. The local workflow now runs on every pull request, classifies remake-owned paths, always reports the stable `Remake CI required` sentinel, installs Chromium/Firefox/WebKit for in-scope changes, runs the bounded served-production smoke across all three engines, and retains the scheduled/manual three-browser `npm run gate:rc` job. The sentinel fails closed when classification fails or an in-scope verification job does not succeed; an out-of-scope pull request can succeed only when the expensive job is actually skipped. Only hosted execution can validate that configuration on the target service. To close P14V-03, first freeze and reproduce the new candidate, identify the authorized GitHub repository, configure its remote and authenticated dispatch path, publish that exact revision, require `Remake CI required`, prove both out-of-scope and in-scope pull-request behavior, run the manual technical-RC workflow on the same SHA, and record their URLs/results here. A run on a different behavior revision does not satisfy this package.
