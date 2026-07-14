# P14V-03 Hosted CI Validation

Candidate revision: `d3696de28218bb6c7645302398e1a4b5fe7cba18`
Status: `BLOCKED_NO_CONFIGURED_REMOTE`

The local workflow exists at `.github/workflows/remake-ci.yml` and defines both required jobs:

- `Clean install and production verification` for pull requests and pushes to `main`;
- `Scheduled cross-browser Release Candidate gate` for schedule or manual `workflow_dispatch` events.

## Hosted Evidence

| Field | Recorded value |
| --- | --- |
| Git remote | none; `git remote -v` and remote configuration returned no entries on the 2026-07-14 initial check or post-P14V-06 recheck |
| GitHub CLI | unavailable on the current host (`gh` is not installed); secondary to the missing authorized repository target |
| Action-version preflight | `actions/checkout@v6` and `actions/setup-node@v6` match their current official major examples; the frozen workflow's `actions/upload-artifact@v4` predates the current Node-24-based major and remains a hosted compatibility risk, not a locally proven failure |
| Candidate hosted SHA | `PENDING` |
| Change-lane run URL/ID | `PENDING` |
| Change-lane result | `PENDING` |
| Manual technical-RC run URL/ID | `PENDING` |
| Manual technical-RC result | `PENDING` |
| Retry/root-cause record | `PENDING` |

No branch was pushed, pull request opened, or workflow dispatched. Those are external mutations and also require a configured repository destination. The local `.github/workflows/remake-ci.yml` recheck confirms that `workflow_dispatch`, the change lane, and the three-browser `npm run gate:rc` job remain defined; only hosted execution can establish that the workflow and its action versions are valid on the target service. To close P14V-03, identify the authorized GitHub repository, configure its remote, provide an authenticated dispatch path (installing/authenticating `gh` if the web or connector path is not used), publish the exact candidate revision, run both workflow paths on that same SHA, and record their URLs and results here. If an action-version incompatibility appears, update the workflow and follow the plan's failure rule back through clean-candidate reproduction rather than waiving it as an environment quirk. A run on a different behavior revision does not satisfy this package.
