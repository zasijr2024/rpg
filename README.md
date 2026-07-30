# ADR20 Workspace

This workspace contains the original A Dark Room source baseline, extracted data, analysis, remake planning docs, reports, and tooling for the remake.

Start here for every new Codex session. Read `AGENTS.md` before running
commands or editing files:

1. `AGENTS.md`
2. `REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md`
3. `REMAKE/docs/status/phase-14-p14v-02-checkpoint-map-2026-07-30.md`
4. `REMAKE/docs/context.md`
5. `REMAKE/docs/planning.md`
6. `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`
7. `REMAKE/README.md`
8. `REMAKE/docs/plan.md`
9. `DATA/README.md`

Important status:

- Git is initialized.
- `ORIGINAL/` is a pinned submodule at the source baseline commit.
- The active remake implementation branch is `remake/parity`.
- `main` is the stable planning/reference baseline.
- Phase 14 parity remains accepted. Candidate `d3696de` is retained as historical technical evidence, but the 2026-07-30 roast remediation changes require a new clean candidate and candidate-specific corpus/evidence cycle; public Release Candidate sign-off remains on `HOLD`.
- The P14V-02 path audit and maintainer decision are complete: the exact three groups are approved, candidate package version `0.1.0-rc.1` is selected, and the protected worksheet remains excluded. Clean candidate reproduction is next.
- `P14V-2026-07-12` owns evidence-gate hardening, clean/hosted-CI reproduction, policy and human pacing evidence, real screen-reader Space evidence, licensing/product decisions, and final tag verification.

Do not modify `ORIGINAL/` during remake work.
