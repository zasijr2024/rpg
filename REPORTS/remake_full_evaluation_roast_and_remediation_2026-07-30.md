# A Dark Room Remake — Full Evaluation, Roast, and Remediation Report

**Audit date:** 2026-07-30
**Audited branch:** `remake/parity`
**Audited revision:** `b0e9222aa3fa2ddebc83761c19536732ba321de8`
**Target:** `REMAKE/` browser game
**Audit mode:** implementation, UI/accessibility, balance/progression, release evidence, and delivery
**Baseline verdict:** **HOLD — Production Beta, not a public Release Candidate**
**Confidence:** **93%**

## 1. Executive verdict

The remake is a complete game, not a façade. Room → Outside → Path → World → late-game branches → Ship → Space → ending is connected. Its deterministic engine, source-parity machinery, build controls, and browser coverage are unusually serious.

It nevertheless was not a credible public Release Candidate at the audited revision.

What broke first was player trust:

1. a damaged primary save could silently start fresh or roll back to an older backup while reporting healthy persistence;
2. a reachable late-game layout allowed `hyper.` to cover most of the World tab at 1366×768;
3. the planned human study could not distinguish active play, passive background progress, closed time, or Classic versus Hyper.

The sharp version: the project built NASA mission control for a minimalist text game—517 unit tests, 2,547 parity requirements, deterministic artifact identity, and three-browser matrices—then let `hyper.` sit on World, let recovery conceal data loss, and reached release deliberation with zero valid human sessions.

No Critical defect was reproduced. Three High findings were verified or directly proven. The Medium findings are individually bounded but collectively block a defensible public-release claim.

## 2. Scorecard

These scores describe the audited baseline, not the remediated tree.

| Surface           |  Score | Confidence  | Judgment                                                               |
| ----------------- | -----: | ----------- | ---------------------------------------------------------------------- |
| Game              | 7.0/10 | Medium      | Complete and coherent; enjoyment is not evidenced                      |
| Code/runtime      | 6.5/10 | High        | Strong deterministic core with unsafe recovery and mutation boundaries |
| UI/UX             | 6.0/10 | High        | Faithful restraint undermined by navigation and focus failures         |
| Balance           | 4.0/10 | Medium-high | Source-faithful, strategically exploitable, waiting-heavy              |
| Progression       | 5.0/10 | Medium      | Reachable end to end; actual player pace remains unknown               |
| Features          | 8.0/10 | High        | Exceptional breadth; a large late branch is optional                   |
| Tests/tooling     | 8.5/10 | High        | Excellent depth with several important promise gaps                    |
| Planning/delivery | 5.0/10 | High        | Honest plans; no human, AT, hosted-CI, or legal sign-off               |

A green average cannot compensate for silent save rollback, so these scores are not averaged into the verdict.

## 3. Context, methodology, and evidence

The product is a desktop-first, source-faithful remake. Sparse disclosure, long-form progression, content data, and many original balance properties are intentional. Mobile/touch redesign, audio, localization expansion, and original-save import were deferred.

The evaluation used four independent lenses:

1. systems, economy, progression, RNG, and dominant strategies;
2. player experience, responsive layout, keyboard use, accessibility, and browser fit;
3. runtime architecture, state, timers, persistence, tests, and CI;
4. product thesis, parity scope, evidence quality, and release readiness.

Reproduced runtime behavior ranked above executable checks, source inspection, documentation, and inference. Inference is labeled as such.

### Baseline verification

| Check                                 | Result                                 |
| ------------------------------------- | -------------------------------------- |
| `npm test`                            | 74 files, 517/517 passed               |
| Lint, format, parity, type fixtures   | Passed                                 |
| Production build and budgets          | Passed                                 |
| Production and full dependency audits | 0 vulnerabilities                      |
| Release E2E                           | 30/30 across Chromium, Firefox, WebKit |
| Production E2E                        | 15/15 across all three engines         |
| Production ending spine               | 1/1 passed                             |
| Production performance                | 1/1 passed                             |
| Desktop parity matrix                 | 400 passed, 148 intentional skips      |
| Human-study summary                   | 0 valid sessions                       |
| Human-study gate                      | Failed at 0/3                          |

The production artifact had 14 files, 614,649 bytes, and identity
`sha256:619c6a8eefc27000a99c621a3bb3e6c656034830f2531eccc7dc1da881060e1e`,
exactly matching the frozen technical candidate. Initial JavaScript was
416,485 bytes raw and 119,177 bytes gzip with eight lazy entries.

The exact checkout's RC gate stopped because `REMAKE/playtests/feedback/` was
untracked. That was administrative, not a game defect. Cleaning it would not
resolve human, assistive-technology, hosted-CI, licensing, or product blockers.

Focused reproductions covered corrupt and semantic-invalid saves, backup
rollback, late-game tab composition, keyboard cooldowns, contrast, 200% World,
blocked converters, hostile state paths, interval cancellation, hull scoring,
500 seeded Space runs, weapon time-to-kill, and optional late-game completion.

Not evidenced: first-time human enjoyment, real Narrator/NVDA/VoiceOver output,
hosted CI on this revision, qualified legal review, organic long-session
abandonment, and unsupported mobile/touch completion.

## 4. Findings

### H-01 — Recovery concealed data loss

**Verified defect — High — Persistence**

A corrupt primary with no backup started empty while persistence reported
`healthy`. A corrupt primary with a valid backup silently restored the older
generation while also reporting `healthy`. The adapter discarded whether load
used quarantine or backup recovery, leaving `GameSession` unable to distinguish
empty from damaged or normal load from rollback. Startup autosave could then
cement the loss.

**Impact:** newest or all visible progress could disappear without explanation.

**Fix:** typed `empty | loaded | recovered-backup |
quarantined-unrecoverable` outcomes; durable warning with reason/raw recovery
data; no replacement autosave before acknowledgement; semantic validation
before rotation; preservation of the last valid generation; validated recovery
import.

**Verification:** JSON, checksum, future-schema, and semantic corruption with
and without backup, asserting exact warning and survival of the last valid save.

### H-02 — Hyper covered the World tab

**Verified defect — High — Navigation**

At 1366×768 with reachable late-game tabs, World occupied approximately
x=1087–1138 while Hyper occupied x=1103–1143. About 68% of World was covered,
hit-testing returned Hyper, and a normal center click failed.

**Fix:** reserve or relocate mode-control space; safe wrapping/scrolling; test
every reachable tab composition at supported widths and 100–200% zoom with
bounding-box, hit-target, and center-click assertions.

### H-03 — The human study could not measure pacing

**Verified evidence defect — High — Progression/release**

The protocol recorded foreground active minutes while an open background tab
continued earning/replaying progress. It recorded neither background/closed
time nor Hyper mode and changes. Identical recorded time could therefore conceal
radically different progress conditions.

**Fix:** schema v3 with wall start/end, foreground-active, background-open,
closed gaps, and timestamped Classic/Hyper history or a locked cohort; summarize
active and wall milestones; retain deaths and abandonment; require at least five
same-revision first-time sessions for release evidence.

### M-01 — Atomic backup could copy semantic corruption twice

**Structural risk with reproduced mechanism — Medium**

Non-finite live values serialized as `null`; envelope/checksum validation could
then rotate them through current and backup. No ordinary-player NaN route was
found, but the safety system failed precisely when another runtime bug would
need it.

**Fix:** finite mutation guards, complete precommit validation, and retention of
the last semantically valid generation.

### M-02 — Converter rates lied

**Verified defect — Medium — Economy UI**

A Trapper with zero meat showed `meat -1/10s` and `bait +1/10s`; after the
interval both remained zero because the blocked job was skipped, while the
positive rate stayed visible.

**Fix:** distinguish effective from nominal rates, identify the missing input,
and aggregate net rates only from executable jobs.

### M-03 — Timed actions discarded keyboard focus

**Verified defect — Medium — Accessibility**

Activating `light fire` or `gather wood` disabled the focused button, moved focus
to `<body>`, and never restored it.

**Fix:** keep the stable control mounted/focusable, use truthful
`aria-disabled`, ignore unavailable activation, and preserve focus.

### M-04 — Notification fading failed contrast

**Verified defect — Medium — Accessibility**

The fourth entry reached approximately `#7c7c7c` on white, 4.17:1, below 4.5:1;
older entries faded further.

**Fix:** a contrast-safe minimum and an axe scenario with a full log.

### M-05 — 200% World hid essential UI

**Verified defect and test gap — Medium — Browser fit**

At 683×384, World entry showed almost only the map. Status began near y=731 and
controls near y=852. Tests asserted DOM visibility, not viewport intersection.

**Fix:** scroll-contained compact map, adjacent/sticky essentials,
focus-without-scroll, and viewport assertions at 100–200%.

### M-06 — Accessibility incompletes were ignored

**Structural risk — Medium**

Several labelled `div` containers produced serious
`aria-prohibited-attr` incomplete results. The gate serialized incompletes but
failed only violations.

**Fix:** semantic containers or valid group roles, plus failure of unexplained
serious/critical incompletes through an explicit allowlist. Real AT verification
remains separate.

### M-07 — State paths accepted garbage and prototype keys

**Verified internal defect — Medium**

Malformed segments were partially accepted and `__proto__` paths could mutate
the object prototype. Production UI did not expose arbitrary paths.

**Fix:** full-string grammar validation; reject `__proto__`, `prototype`, and
`constructor`; negative hostile-path tests.

### M-08 — Command failure could leave partial state

**Structural risk — Medium**

Handlers mutated sequentially; a later throw skipped publication/persistence
without rolling back earlier writes.

**Fix:** atomic command transaction, structured failure reporting, and a
session-preserving root recovery boundary with reload/export controls.

### M-09 — Catch-up could create an autosave storm

**Source-supported inference — Medium**

Ten simulated seconds advanced every 250 ms, while autosave used a ten-second
simulated threshold. One hour of debt implied roughly 360 synchronous storage
rotations.

**Fix:** suppress/coalesce catch-up writes and use wall-time rate limiting. A
validated first-batch checkpoint must preserve serialized undrained debt, all
middle writes must be suppressed, and one final validated flush must commit the
drained state. Measure writes and Long Tasks for one and 24 hours.

### M-10 — Recovery export had no import

**Structural UX defect — Medium**

The app exported a recovery document but could not restore it in a clean
profile.

**Fix:** explicit-confirmation import through schema, checksum, migration, and
semantic validation; prove state/RNG/timer/event round-trip.

### M-11 — PR CI was Chromium-only

**Delivery risk — Medium**

Firefox/WebKit and the complete gate ran only on schedule/manual dispatch;
actions used movable major tags.

**Fix:** bounded Firefox/WebKit smoke on PR/main, reviewed commit-SHA action
pins, and branch-protection requirement.

### M-12 — Classic balance rewards waiting and cheese

**Product decision with verified math — Medium**

- alloy repeatedly bought uncapped hull;
- alloy scored 10 while hull scored 50;
- 25 alloy as hull scored 1,250 versus 290 for one hull plus 24 alloy;
- stationary Space completion was 0/500 at hull 1, 165/500 at hull 10, and
  500/500 at hull 25;
- mastered fists matched plasma-rifle TTK with no ammunition or weight;
- processing could reduce terminal score;
- Hyper doubled pace without a scoring downside.

These are inherited Classic incentives, not remake parity regressions.

**Decision:** keep Classic immutable. Define any tuning as a separately named,
human-evidence-gated experiment with invariants for bounded hull value,
conversion-neutral scoring, weapon tradeoffs, earlier decisions,
background/offline policy, and late-branch purpose.

### M-13 — Reachability was not player pacing

**Unknown/evidence limitation — Medium**

The 12:16:02 route forced favorable travel, combat, and Space RNG. About 69.6%
of simulated time preceded Compass, 87.2% preceded the first expedition, and
only 93.9 simulated minutes followed. Fabricator had about one minute of runway.

**Fix:** name it a controlled reachability trace and never use it as human pace.

### M-14 — A third of parity content was optional

**Product decision — Medium**

Executioner represented 798 of 2,547 requirements (31.3%), yet Ship launch did
not require Fabricator or Executioner.

**Decision:** explicitly call it optional prestige content, or give it earlier
rewards/distinct ending value in a future named mode. Test an organic
no-Executioner ending route.

### L-01 — An interval could not cancel itself

**Verified latent defect — Low**

The clock reinserted an interval unconditionally after its callback.

### L-02 — Hyper ignored Escape

**Verified defect — Low**

The confirmation trapped Tab correctly but did not cancel on Escape and restore
trigger focus.

### L-03 — Main routes lacked root error containment

**Structural risk — Low**

Lazy late routes had recovery UI; Room, Outside, Path, and World could still
replace the game with a blank root after a render fault.

### Baseline evidence map

Paths and line numbers below refer to audited revision `b0e9222`; remediation
may move the current working-tree lines.

| Finding            | Primary evidence                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-01 / M-01 / M-10 | `REMAKE/src/engine/save/devSave.ts:42-87,121-140,244-281`; `REMAKE/src/engine/GameSession.ts:464-529,978-997`; `REMAKE/src/tests/e2e/atomic-save.spec.ts:25-60`                                    |
| H-02               | `REMAKE/src/ui/App.tsx:160-184,240-261`; `REMAKE/src/ui/styles/global.css:117-160`; runtime capture `REMAKE/test-results/adr-ui-1366-lategame-tab-overlap.png`                                     |
| H-03               | `REMAKE/playtests/session.schema.json:53-67`; `REMAKE/scripts/summarize-playtests.mjs:20-44,94-119`; `REMAKE/docs/deviations.md:72-82`                                                             |
| M-02               | `REMAKE/src/engine/outside/OutsideRuntime.ts:424-440,495-502`; `REMAKE/src/engine/room/RoomRuntime.ts:553-579`; `REMAKE/src/ui/StoresPanel.tsx:29-38`                                              |
| M-03               | `REMAKE/src/ui/RoomView.tsx:49-75`; `REMAKE/src/ui/OutsideView.tsx:66-96` and keyboard runtime reproduction                                                                                        |
| M-04               | `REMAKE/src/ui/NotificationLog.tsx:9-17`; `REMAKE/src/ui/styles/global.css:1169-1174`; axe runtime result 4.17:1                                                                                   |
| M-05               | `REMAKE/src/ui/WorldView.tsx:24-26`; `REMAKE/src/ui/styles/global.css:1579-1681`; `REMAKE/src/tests/e2e/release-matrix.spec.ts:4-10,125-140`                                                       |
| M-06               | `RoomView.tsx:37`, `WorldView.tsx:91,133`, `EventPanel.tsx:267`, `ShipView.tsx:40`, `SpaceView.tsx:121`; `REMAKE/src/tests/e2e/accessibility-release.spec.ts:29-56`                                |
| M-07               | `REMAKE/src/engine/state/path.ts:3-38` plus direct prototype-pollution reproduction                                                                                                                |
| M-08               | `REMAKE/src/engine/commands/CommandBus.ts:32-40`; `REMAKE/src/engine/GameSession.ts:722-735`; `REMAKE/src/engine/state/StateStore.ts:47-59`                                                        |
| M-09               | `REMAKE/src/engine/clock.ts:142-218`; `REMAKE/src/engine/GameSession.ts:319-327,978-985`; `REMAKE/src/tests/e2e/background-catch-up.spec.ts:29-39`                                                 |
| M-11               | `.github/workflows/remake-ci.yml:33-120`; `REMAKE/src/tests/tooling/ci-workflow.test.ts`                                                                                                           |
| M-12               | `REMAKE/src/content/original/room/roomData.ts:359-364`; `REMAKE/src/engine/ship/ShipRuntime.ts:58-91`; `REMAKE/src/content/original/core/engineData.ts:94-113`; deterministic hull/TTK simulations |
| M-13               | `REMAKE/src/tests/e2e/fresh-save-spine.ts:455-500`; historical `REMAKE/docs/status/fresh-save-pacing.md:5-23`                                                                                      |
| M-14               | `REMAKE/src/generated/parity-graph.json`; `REMAKE/src/engine/world/WorldRuntime.ts:1128-1145`; `REMAKE/src/engine/ship/ShipRuntime.ts:58-60`                                                       |
| L-01               | `REMAKE/src/engine/clock.ts:69-79` plus self-cancelling interval reproduction                                                                                                                      |
| L-02               | `REMAKE/src/ui/App.tsx:644-664` plus keyboard runtime reproduction                                                                                                                                 |
| L-03               | `REMAKE/src/main.tsx:6-9`; `REMAKE/src/ui/App.tsx:395,419-424`                                                                                                                                     |

## 5. Surface evaluations

### Core game

The first slice honors the original: one action, restrained feedback, gradual
disclosure. Automation proves its timing, not whether a newcomer reads the
silence as deliberate instead of a stalled page. The long loop is mechanically
coherent; its weakness is the ratio of passive waiting to new decisions.

### Economy and progression

The economy has real faucets, sinks, conversions, caps, and tradeoffs, and its
cadence is well tested. Baseline UI communication was weaker than its math.
Every phase is reachable, but the controlled route is only a legal lower-bound
trace. The retained 32-seed policy corpus completed 12 runs, stopped 20 at
policy ceilings, recorded 161 legal deaths and 2,937 combats, and found no
classified game defect. That is good pressure testing, not player evidence.

### Features

| Feature                      | Baseline state      | Value                  | Main gap                                 |
| ---------------------------- | ------------------- | ---------------------- | ---------------------------------------- |
| Room, Outside, Path          | Working             | Load-bearing           | Newcomer comprehension unknown           |
| World/combat                 | Working             | Load-bearing           | Zoom composition and death-cost evidence |
| Set pieces                   | Working             | Accelerant             | Organic use unknown                      |
| Executioner                  | Working             | Prestige/accelerant    | Optional despite large scope             |
| Fabricator                   | Working             | Accelerant             | Almost no runway in controlled trace     |
| Ship/Space/ending            | Working             | Load-bearing           | Hull/score dominance                     |
| Hyper                        | Working             | Pacing/accessibility   | Unrecorded and dominant                  |
| Save recovery                | Partial             | Load-bearing           | Silent outcomes and no import            |
| Audio                        | Missing by decision | Feedback               | Must be disclosed as silent              |
| Mobile/touch                 | Deferred            | Future platform        | Must not be marketed as supported        |
| Localization/original import | Deferred            | Future reach/migration | Explicitly outside RC                    |

### UI and accessibility

Progressive disclosure is the strongest UI quality. Locked systems stay away,
costs are visible, most dialogs own focus, and the visual language respects the
original instead of becoming a generic dashboard. The failures were mundane but
real: overlap, focus loss, low contrast, invalid labelled groups, and a zoom
test that proved existence rather than usability.

### Code and tooling

The deterministic clock/RNG, domain facades, validators, production boundary,
and contract suite are strong foundations. Incremental repair is clearly
preferable to a rewrite. The main architectural weakness is the untyped
string-path state core and its large raw mutation surface. The right direction
is to constrict it behind typed domains over time.

The test gaps reveal mismatched promises: quarantine mechanics without honest
recovery UI, DOM visibility without viewport usability, axe violations without
serious incompletes, Chromium PR checks despite a cross-browser claim, and
reachability automation used adjacent to pacing decisions.

## 6. Intended versus actual

| Intent                   | Baseline reality                                  |
| ------------------------ | ------------------------------------------------- |
| Durable atomic recovery  | Sophisticated internals; silent reset/rollback    |
| Desktop navigation       | Generally strong; reachable late-game collision   |
| Accessibility gate       | Broad automation; contrast/incomplete gaps        |
| Real zoom                | No overflow; World essentials off-screen          |
| Pacing evidence          | Controlled trace and bot corpus; zero humans      |
| Faithful Classic         | Achieved, including inherited dominant strategies |
| Technical RC             | Most automation green; exact tree dirty           |
| Public distribution      | License/NOTICE and legal decision unresolved      |
| Cross-browser confidence | Local suite green; PR CI Chromium-only            |

## 7. Remediation plan and exit criteria

### P0 — Player trust and evidence integrity

1. Fix save outcomes, semantic commit validation, generation retention, import.
2. Fix late-game navigation composition.
3. Replace the study schema before session one.

Exit: corruption produces a truthful durable warning; last valid state survives
repeated failed saves; import round-trips; tab controls never overlap; study
fixtures distinguish wall, foreground, background, closed, and speed-mode time.

### P1 — Operability and architecture

1. Correct blocked rates, cooldown focus, contrast, semantic groups, and World
   zoom composition.
2. Harden paths and numeric boundaries; add command rollback and root recovery.
3. Coalesce catch-up persistence and fix interval cancellation.
4. Exercise Firefox/WebKit on PRs.

Exit: focused regressions pass; no unexplained serious/critical axe result;
catch-up writes remain bounded; fault injection preserves session state.

### P2 — Public release decision

1. Run at least five first-time same-revision sessions.
2. Complete a real screen-reader pass.
3. obtain hosted CI evidence.
4. inventory derived material, select a license with proper authority/review,
   and ship LICENSE/NOTICE/source-availability information.
5. record the Classic/Balanced decision.
6. version, identify, tag, and publish only the reviewed artifact.

Templates and workflows are not substitute evidence. Human sessions, AT use,
hosted execution, legal review, and owner product decisions must not be
fabricated.

## 8. Strengths to preserve

- Complete source-faithful game spine.
- Deterministic clock and RNG.
- Parser-backed parity and mutation-sensitive content contracts.
- Production boundary and deterministic artifact identity.
- Broad local three-browser matrices.
- Sparse progressive disclosure and original visual character.
- Explicit deviations instead of hidden scope cuts.
- Honest documents that say HOLD when evidence is absent.
- Separation of Classic fidelity from future tuning.

## 9. Remediation record

The findings above remain the historical baseline after repairs.

**Implementation state:** maintainer-approved three-checkpoint integration
descended from `b0e9222aa3fa2ddebc83761c19536732ba321de8`; candidate package
version `0.1.0-rc.1`; clean reproduction pending
**Verification date:** 2026-07-30
**Post-remediation verdict:** **HOLD — repository-side remediation locally
verified as a Production Beta integration; not a frozen technical or public
Release Candidate**

| Finding                         | Status                                           | Verification                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-01 save recovery              | Implemented; locally verified                    | Typed `empty/loaded/recovered/quarantined` outcomes, durable raw quarantine, acknowledgement-gated autosave, semantic backup retention, and truthful UI survive reload and failure injection.                                            |
| H-02 World/Hyper collision      | Implemented; locally verified                    | Scrollable collision-proof navigation keeps every late-game tab reachable; focused UI tests and the 100–200% release matrix pass.                                                                                                        |
| H-03 study schema               | Tooling implemented; cohort open                 | Strict schema v3 reconciles time/mode evidence; the release floor counts first-time participants and requires explicit frozen revision/artifact/cohort/ruleset/mode binding. Bare gate exits `2`; fully bound empty cohort fails at 0/5. |
| M-01 semantic save safety       | Implemented; locally verified                    | Semantic validation now precedes primary/backup rotation; invalid generations cannot displace the last valid commit.                                                                                                                     |
| M-02 blocked rates              | Implemented; locally verified                    | Starved converters report paused nominal output and the missing-input reason.                                                                                                                                                            |
| M-03 cooldown focus             | Implemented; locally verified                    | Stable `aria-disabled` controls retain keyboard focus while rejecting activation.                                                                                                                                                        |
| M-04 contrast                   | Implemented; locally verified                    | Notification-age colors meet the tested contrast floor across a full history.                                                                                                                                                            |
| M-05 200% World                 | Implemented; locally verified                    | Compact scroll-contained World composition keeps status, controls, landmarks, and map operable at every release zoom.                                                                                                                    |
| M-06 axe incompletes            | Automation implemented; real AT open             | Semantic grouping is corrected; violations and unexplained serious/critical incompletes fail through a narrow allowlist. Real screen-reader evidence remains P14V-07.                                                                    |
| M-07 state paths                | Implemented; locally verified                    | Full-string parsing rejects malformed paths and `__proto__`/`prototype`/`constructor`, with hostile-path tests.                                                                                                                          |
| M-08 command rollback           | Implemented; locally verified                    | Commands transact through rollback checkpoints, surface structured failures, and retain a reload/export-capable root boundary.                                                                                                           |
| M-09 catch-up writes            | Implemented; locally verified                    | One-hour and 24-hour tests prove start + one debt checkpoint + one final flush, with no middle writes; reload restores and drains the checkpointed debt.                                                                                 |
| M-10 recovery import            | Implemented; locally verified                    | Staged confirm/cancel import validates envelope, checksum, migration, semantics, RNG, timers, and event lifecycle before commit.                                                                                                         |
| M-11 cross-browser PR CI        | Repository side implemented; hosted control open | Immutable action SHAs and the Chromium/Firefox/WebKit served-production change lane are contract-tested. Hosted runs and required branch protection remain external.                                                                     |
| M-12 balance experiment         | Characterized and specified; Classic unchanged   | Classic incentives have executable characterization; a preregistered Balanced Experiment A specification exists. Runtime tuning remains deliberately unimplemented pending human evidence and owner authorization.                       |
| M-13 reachability naming        | Implemented; locally verified                    | The artifact and test are named a controlled reachability trace/policy diagnostic. The current 4/4 result is not presented as player pacing.                                                                                             |
| M-14 optional late-game purpose | Implemented; locally verified                    | Executioner/Fabricator are documented as optional prestige content in Classic, and a no-Executioner/no-Fabricator ending route is tested.                                                                                                |
| L-01 interval cancellation      | Implemented; locally verified                    | A running interval can cancel itself without reinsertion.                                                                                                                                                                                |
| L-02 Hyper Escape               | Implemented; locally verified                    | Escape cancels confirmation and restores trigger focus.                                                                                                                                                                                  |
| L-03 root boundary              | Implemented; locally verified                    | Main routes now have session-preserving root containment with guarded reload/export recovery controls.                                                                                                                                   |

### Integrated verification

| Check                             | Post-remediation result                                                                                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit/content/tooling              | 77 files, 550 tests passed after the final config and evidence-contract guards                                                                                                                  |
| Types, lint, format, parity graph | Passed                                                                                                                                                                                          |
| Production build                  | Passed boundary and unchanged budgets; initial JS 436,405 B / 123,783 B gzip; all JS 601,417 B / 154,676 B gzip; CSS 23,614 B / 5,367 B gzip; 8 lazy entries                                    |
| Served production                 | 15/15 across Chromium, Firefox, WebKit                                                                                                                                                          |
| External production ending spine  | 1/1 passed                                                                                                                                                                                      |
| Release browser/zoom/a11y matrix  | 33/33 across Chromium, Firefox, WebKit                                                                                                                                                          |
| Focused accessibility             | 15/15 across Chromium, Firefox, WebKit                                                                                                                                                          |
| Production performance            | 1/1 passed                                                                                                                                                                                      |
| Desktop parity matrix             | 410 passed, 166 intentional skips                                                                                                                                                               |
| Four-seed policy diagnostic       | 4/4 classified completions; 11 legal deaths; 6,748 incidental events; 439 combats; zero policy/game-defect/unclassified failures                                                                |
| Dependency audits                 | Production and complete audits: 0 vulnerabilities                                                                                                                                               |
| Human evidence                    | Summary: 0 valid; bare release gate: expected missing-binding exit `2`; fully bound release gate: expected fail at 0/5                                                                          |
| Artifact identity                 | `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`; 16 files; 646,179 bytes                                                                                              |
| Closure status                    | `BLOCKED`: dirty tree plus nine open P14R/P14V packages after honestly reopening candidate-specific P14V-05; Parity Complete and Production Beta report `READY`, technical RC reports `BLOCKED` |

`gate:rc` was not claimed from the implementation tree: its clean-tree
preflight is intentionally unsatisfied. The component commands above are local
integration evidence only.

### Residual and external gates

The live execution sequence is
`REMAKE/docs/status/phase-14-post-remediation-next-steps-2026-07-30.md`; this
report remains the audit and local verification record. New sessions begin with
root `AGENTS.md`.

The exact checkpoint ownership map is
`REMAKE/docs/status/phase-14-p14v-02-checkpoint-map-2026-07-30.md`. The
maintainer approved all three groups and the `0.1.0-rc.1` package version while
excluding the protected playtest worksheet. This approval does not authorize a
push, tag, deployment, or public release claim.

1. Freeze and reproduce a clean post-remediation P14V-02 candidate and exact
   artifact.
2. Run hosted CI on that SHA, enforce the always-reporting protected check, and
   retain a separately named candidate-specific P14V-05 32-seed corpus.
3. Only after both automated lanes pass, collect at least five schema-v3
   first-time unassisted same-candidate sessions; current
   count is 0/5.
4. Complete the normal-clock Space and ending route with a real screen reader.
5. Publish a durable exact-source URL, complete any distribution-specific legal
   review, and obtain the product/release owner's Classic/Balanced and public
   distribution decision.
6. Prove the final evidence-only descendant remains artifact-identical, smoke
   the actual production host including query-suffixed lazy-route recovery,
   authorize the pre-tag manifest, then create/verify/publish the tag through
   the non-circular post-tag handshake.

Typed/cached runtime scopes now constrain root ownership, but dynamic nested
leaves remain runtime-validated `unknown`. That is a bounded architectural
follow-up, not a claim that the string-path core has become fully statically
typed.
