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
- Phase 14 parity remains accepted. Candidates `d3696de` and `6de3979` retain their historical evidence. Current hosted candidate `275c096247e5fe2026e00c1f67eb78cd4668ccaf` passed clean local technical RC reproduction, its 32-seed corpus, both hosted workflow lanes, and enforced required-check validation with unchanged artifact `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`. Public Release Candidate sign-off remains on `HOLD`.
- Evidence descendant `1d505dc8069ea55d688ae67d0bdd523908b0bc56` contains only 17 evidence/status paths beyond the candidate and cleanly rebuilds the identical artifact.
- Finalized local handoff `ca177fee971c71f0cb7a09b571989af3dc1b3849` extends that lineage to 19 evidence/status paths and independently reproduces the same artifact.
- P14V-02, P14V-03, and P14V-05 are complete on `275c096`. The next release
  packages are the frozen schema-v3 human cohort and real-screen-reader
  Space/ending pass; neither has collected operator evidence yet.
- `P14V-2026-07-12` owns evidence-gate hardening, clean/hosted-CI reproduction, policy and human pacing evidence, real screen-reader Space evidence, licensing/product decisions, and final tag verification.

Do not modify `ORIGINAL/` during remake work.
