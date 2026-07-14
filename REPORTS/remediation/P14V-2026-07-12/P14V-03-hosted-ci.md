# P14V-03 Hosted CI Validation

Candidate revision: `d3696de28218bb6c7645302398e1a4b5fe7cba18`
Status: `BLOCKED_NO_CONFIGURED_REMOTE`

The local workflow exists at `.github/workflows/remake-ci.yml` and defines both required jobs:

- `Clean install and production verification` for pull requests and pushes to `main`;
- `Scheduled cross-browser Release Candidate gate` for schedule or manual `workflow_dispatch` events.

## Hosted Evidence

| Field | Recorded value |
| --- | --- |
| Git remote | none; `git remote -v` returned no entries on 2026-07-14 |
| Candidate hosted SHA | `PENDING` |
| Change-lane run URL/ID | `PENDING` |
| Change-lane result | `PENDING` |
| Manual technical-RC run URL/ID | `PENDING` |
| Manual technical-RC result | `PENDING` |
| Retry/root-cause record | `PENDING` |

No branch was pushed, pull request opened, or workflow dispatched. Those are external mutations and also require a configured repository destination. To close P14V-03, configure/identify the authorized GitHub repository, publish the exact candidate revision, run both workflow paths on that same SHA, and record their URLs and results here. A run on a different behavior revision does not satisfy this package.
