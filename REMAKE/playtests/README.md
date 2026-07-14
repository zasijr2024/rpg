# Unassisted Human Playtest Evidence

This folder is the authority for the human-session evidence requested by the Phase 14 roast and `P14V-06`. Automation, developer-guided runs, and sessions using `?debug=1` or `?testHarness=1` do not qualify.

Collection tooling status: **ready**. Schema version 2 and the cohort validator reject duplicate session/participant IDs, mixed cohort identity, revision, ruleset or artifact, invalid active-play totals, inconsistent milestones, exclusions, and contradictory completion/abandonment records. Collection still waits for P14V-05 to freeze the candidate cohort revision and progression corpus.

## Cohort Contract

- Use one exact clean production revision, original ruleset, and artifact identity for the cohort.
- Use a fresh browser profile and cleared storage for every participant.
- Recruit unique first-time participants by default. Record only a de-identified unique session ID and an experience category; do not store names or contact details.
- Three valid sessions are the minimum and must be reported as preliminary. Normally continue to five; add sessions one at a time up to eight only when completion, abandonment, or bottleneck outcomes remain materially inconsistent.
- A behavior or balance change starts a new cohort. Do not merge incompatible revisions in one summary.
- Stop the cohort immediately for data loss or a reproducible progression blocker, diagnose it, and start a new revision cohort after a fix.

`npm run study:human:gate` is a record-validity/minimum-count check. It is not proof of satisfaction, a population completion rate, or release quality.

## Protocol

1. Serve a clean production build and record its exact revision, artifact identity, ruleset, browser, OS, and collection operator.
2. Give exactly one neutral sentence: **“A Dark Room is a minimalist text survival game.”** Do not explain controls, optimal workers, map routes, late-game goals, or the ending.
3. Permit technical assistance only for browser/host failures and record it. Gameplay guidance invalidates the session.
4. Record active foreground play across sittings; exclude breaks and closed-page time. Record each sitting's active minutes.
5. Record first reach of these defined milestones:
   - `opening`: Outside first becomes available;
   - `compass`: Compass is acquired;
   - `firstExpedition`: the first expedition successfully embarks;
   - `deepEconomy`: Iron and Coal production are both unlocked;
   - `executioner`: the Ravaged Battleship/Executioner is first entered;
   - `ship`: An Old Starship first becomes available;
   - `space`: confirmed lift-off enters Space;
   - completion: the score ending appears.
6. Record every death with active minute, phase, and observed cause. Record completion or the actual abandonment/stopping point; do not discard incomplete sessions.
7. At completion or stopping, ask only: “What made you wait or feel stuck?”, “Where did you consider stopping?”, and “What did you think you were trying to achieve?” Preserve participant wording separately from normalized bottleneck categories.
8. Record consent attestation, technical incidents, exclusions, and whether the session remained unassisted. Do not store names, email addresses, recordings, or other personal data in this repository.
9. Copy `session.example.json` as the version-2 starting point and store one JSON document per qualifying session under `playtests/sessions/`. The gate rejects duplicate session or participant IDs and mixed cohort/revision/ruleset/artifact identity.
10. Run `npm run study:human` after each record and `npm run study:human:gate` once at least three qualifying sessions exist. Retain the final same-revision summary under `REPORTS/remediation/P14V-2026-07-12/`.

Until real qualifying records exist, documentation must continue to label human pacing, comprehension, and enjoyment as unverified.
