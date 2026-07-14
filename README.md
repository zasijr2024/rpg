# ADR20 Workspace

This workspace contains the original A Dark Room source baseline, extracted data, analysis, remake planning docs, reports, and tooling for the remake.

Start here for a new Codex session:

1. `REMAKE/README.md`
2. `REMAKE/docs/context.md`
3. `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`
4. `REMAKE/docs/plan.md`
5. `REMAKE/docs/parity-checklist.md`
6. `DATA/README.md`

Important status:

- Git is initialized.
- `ORIGINAL/` is a pinned submodule at the source baseline commit.
- The active remake implementation branch is `remake/parity`.
- `main` is the stable planning/reference baseline.
- Phase 14 parity and every code-level recommendation in the latest roast are implemented; candidate `d3696de` passes the clean technical Release Candidate gate, but no hosted result, public sign-off, or tag is claimed.
- `P14V-2026-07-12` owns evidence-gate hardening, clean/hosted-CI reproduction, policy and human pacing evidence, real screen-reader Space evidence, licensing/product decisions, and final tag verification.

Do not modify `ORIGINAL/` during remake work.
