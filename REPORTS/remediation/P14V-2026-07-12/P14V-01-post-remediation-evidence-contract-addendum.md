# P14V-01 Post-Remediation Evidence-Contract Addendum

- Date: 2026-07-30
- Status: **repository-side contract complete; candidate and hosted execution remain open**
- Integration base: `b0e9222aa3fa2ddebc83761c19536732ba321de8`
- Worktree state: dirty remediation integration; not candidate evidence

## Why This Addendum Exists

The post-remediation planning pressure-test found two fail-closed gaps before a
replacement candidate was frozen:

1. the human release gate could count experienced exploratory participants and
   trusted an internally consistent cohort without binding it to the P14V-02
   candidate; and
2. a path-filtered pull-request workflow could leave a conditional job absent or
   pending if branch protection required the wrong check.

It also found a self-reference problem in the old P14V-09 wording: a tagged
commit cannot record a future tag-verification result or its own literal full
hash. This addendum records the repository-side corrections without claiming a
candidate, hosted run, human session, owner decision, host smoke, or tag.

## Implemented Contracts

### Candidate-Bound Human Release Gate

- `study:human` continues to summarize first-time, familiar, and experienced
  exploratory sessions.
- A `--require` release gate counts only `experienceStatus: first-time`.
- Every gated run requires explicit expected revision, canonical artifact ID,
  cohort ID, ruleset, and mode policy.
- Missing bindings exit `2`; any loaded-record mismatch is rejected.
- Runtime and JSON Schema require artifact IDs matching
  `sha256:[0-9a-f]{64}`.
- Operator docs and type declarations expose the exact invocation.

Authorized candidate invocation shape:

```text
npm run study:human:gate -- --expected-revision=<C> --expected-artifact-id=<A> --expected-cohort-id=<cohort> --expected-ruleset=<ruleset> --expected-mode-policy=<policy>
```

### Always-Reporting Hosted Required Check

- Every pull request triggers the remake workflow.
- A scope job classifies `.github/workflows/remake-ci.yml`, `.gitmodules`,
  `DATA/`, `ORIGINAL/`, and `REMAKE/` changes.
- The full clean-install/production verification job remains conditional and
  includes Chromium, Firefox, and WebKit for in-scope changes.
- Stable job `Remake CI required` always reports on pull requests and fails
  closed when classification fails, an in-scope verification does not succeed,
  or an out-of-scope run is inconsistent.
- The future target branch must require `Remake CI required`, not the
  conditional verification job. Hosted behavior and the branch ruleset remain
  unproven until P14V-03.

### Candidate Lineage And Tag Semantics

- Product candidate `C`/artifact `A` may carry evidence to descendant `F` only
  when the diff is evidence/status/session-only and a clean rebuild remains
  exactly `A`.
- P14V-09 is a pre-tag authorization package. Its embedded manifest identifies
  its revision symbolically through the future annotated tag.
- Tag creation, `closure:verify-tag`, publication, and resolved full SHA are the
  following release operation and append-only post-tag evidence.
- The actual production host must be smoked before tag authorization; no
  nonexistent external-host automation is claimed.

## Verification

Human-gate hardening:

- `node --check scripts\summarize-playtests.mjs` - passed.
- `npx vitest run src\tests\tooling\playtest-summary.test.ts` - 8/8 passed.
- `npx tsc --noEmit --pretty false` - passed.
- focused ESLint and Prettier checks - passed.
- example schema-v3 summary - exit `0`.
- `--help` - exit `0`.
- bare `--require=5` - expected exit `2` for missing candidate binding.
- fully bound empty cohort - expected exit `1` at 0/5 first-time sessions.

Hosted-control hardening:

- `npx vitest run src/tests/tooling/ci-workflow.test.ts` - 4/4 passed.
- focused ESLint and Prettier checks - passed.
- scoped `git diff --check` - passed.

Integrated follow-up:

- `npm test` - 77 files / 550 tests passed.
- full `npm run lint`, `npx tsc --noEmit --pretty false`, and
  `npm run format:check` - passed.
- focused playtest/CI/closure tooling run - 3 files / 24 tests passed.
- `npm run closure:status` - expected `BLOCKED`; nine open IDs, Parity Complete
  and Production Beta `READY`, technical RC `BLOCKED` on the dirty tree.

## Residual Boundary

P14V-01's repository contract is current. P14V-02 remains the immediate
candidate package. P14V-03 still requires an authorized remote, hosted runs,
and an enforced ruleset; P14V-05 requires a replacement-candidate corpus; the
human gate has zero records and must later be invoked with frozen values. No
external action or observation is inferred from these local checks.
