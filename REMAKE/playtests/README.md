# Unassisted Human Playtest Evidence

This folder is the authority for the human-session evidence requested by the Phase 14 roast and `P14V-06`. Automation, developer-guided runs, and sessions using `?debug=1` or `?testHarness=1` do not qualify.

Collection contract: **schema version 3, before any human evidence is collected**. Version 2 did not distinguish wall time, foreground-active time, background-open production, closed-page gaps, or Classic/Hyper exposure and therefore cannot support a release pacing claim. No version-2 record qualifies for the release-decision cohort.

Historical candidates are not eligible for the schema-v3 cohort. The frozen collection binding is revision `275c096247e5fe2026e00c1f67eb78cd4668ccaf`, artifact `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`, cohort `p14v-2026-08-01-275c096-original-classic-01`, ruleset `original`, and mode policy `classic-locked`. Verify the exact served `dist/` with `npm run artifact:identity -- --dir=<candidate-dist> --expect=sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c` before every session.

## Cohort Contract

- Use one exact clean production revision, ruleset, mode policy, and artifact identity for the cohort.
- Use a fresh browser profile and cleared storage for every participant.
- Recruit unique first-time participants for release evidence. Record only de-identified IDs and an experience category; do not store names or contact details.
- Five valid same-cohort sessions are the minimum release-evidence sample. At five, add one session at a time up to eight while completion/abandonment is split 2/3 or no primary bottleneck appears in at least three records; stop when neither condition holds or at eight. This rule is frozen before session one.
- Choose one mode policy before collection:
  - `classic-locked`: Classic for the entire session, represented by one `classic` entry at `wallStartedAt`;
  - `hyper-locked`: Hyper for the entire session, represented by one `hyper` entry at `wallStartedAt`;
  - `timeline-recorded`: record the timestamp of the initial mode and every Classic/Hyper transition.
- Never mix mode policies in one cohort. A transition in a locked session disqualifies it from that locked cohort; do not relabel it after seeing the outcome.
- A behavior or balance change starts a new cohort. Do not merge incompatible revisions in one summary.
- Stop the cohort immediately for data loss or a reproducible progression blocker, diagnose it, and start a new revision cohort after a fix.

`npm run study:human` may summarize `first-time`, `familiar`, and `experienced` sessions from one candidate identity for exploratory analysis. Only `first-time` participants count toward the release floor. `npm run study:human:gate` enforces at least five and fails unless the operator supplies the exact frozen revision, artifact, cohort, ruleset, and mode policy; it rejects any loaded-record mismatch instead of inferring the candidate from the records.

Inspect the complete CLI with `node scripts/summarize-playtests.mjs --help`. Run the frozen-candidate gate by replacing every uppercase placeholder in this command:

```text
npm run study:human:gate -- --expected-revision=275c096247e5fe2026e00c1f67eb78cd4668ccaf --expected-artifact-id=sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c --expected-cohort-id=p14v-2026-08-01-275c096-original-classic-01 --expected-ruleset=original --expected-mode-policy=classic-locked
```

The gate is a record-validity, candidate-binding, and minimum-count check. It is not proof of satisfaction, a population completion rate, or release quality.

## Time Definitions

- `wallStartedAt` is when the first production page opens; `wallEndedAt` is when the final page-open sitting ends.
- A sitting is one continuous page-open interval. Its timestamps define its duration.
- `foregroundActiveMinutes` counts page-open time while the game is the foreground page, including production waits. If the participant walks away while leaving the game foregrounded, that time still counts because the game continues running.
- `backgroundOpenMinutes` counts page-open time while the document is hidden or backgrounded. The game may catch up that time.
- `closedPageGaps` explicitly bridge every sitting. Closed-page time earns no current Classic progress but remains part of wall elapsed time.
- Every page-open minute must be classified as foreground-active or background-open. Foreground + background-open + closed-page minutes must equal timestamp-derived wall time.
- Every milestone and death records an exact timestamp, cumulative foreground-active minute, and wall minute. The validator derives wall minute from `wallStartedAt` and rejects mismatches.

## Protocol

1. Serve the frozen production build only after its directory identity matches the recorded artifact ID. Record the exact revision, artifact identity, ruleset, mode policy, browser, OS, and collection operator.
2. Give exactly one neutral sentence: **“A Dark Room is a minimalist text survival game.”** Do not explain controls, optimal workers, map routes, late-game goals, or the ending.
3. Permit technical assistance only for browser/host failures and record it. Gameplay guidance invalidates the session.
4. Start the wall clock when the production page first opens. For every sitting, record page-open start/end and split that duration into foreground-active and background-open minutes. Record every closed-page interval between sittings.
5. For `timeline-recorded`, timestamp the starting Classic/Hyper state and every transition. For a locked cohort, verify that no transition occurred.
6. Record first reach of these defined milestones with `reachedAt`, cumulative foreground-active minute, and wall minute:
   - `opening`: Outside first becomes available;
   - `compass`: Compass is acquired;
   - `firstExpedition`: the first expedition successfully embarks;
   - `deepEconomy`: Iron and Coal production are both unlocked;
   - `executioner`: the Ravaged Battleship/Executioner is first entered;
   - `ship`: An Old Starship first becomes available;
   - `space`: confirmed lift-off enters Space;
   - `completion`: the score ending appears.
7. Record every death with timestamp, foreground-active minute, wall minute, phase, and observed cause. Record completion or the actual abandonment/stopping point; do not discard incomplete sessions.
8. At completion or stopping, ask only: “What made you wait or feel stuck?”, “Where did you consider stopping?”, and “What did you think you were trying to achieve?” Preserve participant wording separately from normalized bottleneck categories.
9. Record consent attestation, technical incidents, exclusions, and whether the session remained unassisted. Do not store names, email addresses, recordings, or other personal data in this repository.
10. Copy `session.example.json` as the version-3 starting point, replace its all-zero artifact placeholder with the verified identity, and store one JSON document per session under `playtests/sessions/`. Run `npm run study:human` after every record. Run the fully bound `npm run study:human:gate -- ...` command above only after at least five qualifying first-time sessions exist.

Until five real qualifying records exist, documentation must continue to label human pacing, comprehension, and enjoyment as unverified. Active and wall distributions must always be reported together; neither may be substituted for the other.
