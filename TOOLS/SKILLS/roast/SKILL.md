---
name: roast
description: Pressure-test and audit browsergame concepts, plans, prototypes, and implementations across game design, economy and balance, progression, features, UI/UX, code/runtime, persistence, tests, and delivery. Use for roasts, deep evaluations, red-team reviews, roadmap or feature decisions, full project audits, and standalone reports. Supports GPT-5.6 SOL ULTRA multi-agent councils when explicitly requested.
---

# Browsergame Roast

Produce a blunt, evidence-driven decision about a browsergame plan or implementation. Attack the artifact, never the user. Every criticism must identify observable evidence, player or delivery impact, and a concrete way to verify the remedy.

## GPT-5.6 SOL ULTRA Profile

Use the current model by default. If the user explicitly requests `GPT-5.6 SOL ULTRA`, spawn authorized subagents with model `gpt-5.6-sol` and reasoning effort `ultra`. The main agent remains Judge, verifies claims, resolves contradictions, and writes the final verdict.

## Modes

- `Planning Roast`: concept, core loop, scope, feature, roadmap, milestone, or technical direction.
- `Implementation Roast`: playable build, source, content data, UI, architecture, runtime, saves, or tests.
- `Full Project Audit`: planning and implementation across all mandatory surfaces.
- `Focused Audit`: one subsystem such as economy, progression, combat, saves, accessibility, or performance.

## Evidence Standard

Rank evidence from strongest to weakest:

1. Reproduced runtime behavior or deterministic simulation.
2. Build, typecheck, lint, unit/integration, and end-to-end results.
3. Exact source, configuration, data, and file/line references.
4. Plans, specifications, status docs, and prior reports.
5. Explicitly labeled inference.

Classify claims as `Verified defect`, `Structural risk`, `Product decision`, or `Unknown`. Documentation proves intent, not behavior. Code proves implementation shape, not player experience.

## Workflow

1. Establish audience, platform, session shape, design thesis, project phase, constraints, and requested decision.
2. Inspect repository instructions, dirty-worktree state, root docs, package scripts, active plans, status claims, and prior audits.
3. Map entry points, state ownership, content sources, UI composition, persistence, tests, and build/runtime paths.
4. Run feasible baseline checks and inspect the actual browser experience before assigning scores.
5. Delegate distinct read-only audit lenses when subagents are explicitly requested or authorized.
6. Audit all mandatory surfaces; mark unsupported claims `Not evidenced`.
7. Reproduce Critical and High findings where practical.
8. Deduplicate by root cause, resolve conflicts against stronger evidence, and write a standalone report when requested.

## Mandatory Browsergame Surfaces

### Planning and Product Thesis

- Target player, core promise, session cadence, and success criteria.
- Milestone dependency order, vertical-slice logic, measurable exit criteria, and risk retirement.
- Content pipeline, balance workflow, persistence compatibility, accessibility, telemetry, performance, and release work.
- Clear separation of parity, intentional deviations, future ideas, and currently working scope.

Reject roadmap percentages that lack executable completion criteria. A feature list is not a delivery plan.

### Game and Core Loop

- Repeated action, meaningful decision, feedback, tension, recovery, and return motivation.
- First boring minute, first confusing screen, first dominant strategy, and post-novelty loop.
- Automation that removes chores without deleting decisions.

### Economy and Balance

- Faucets, sinks, stocks, caps, conversions, timers, multipliers, and random outcomes.
- Net rates, time-to-goal, expected value, break-even points, runaway ratios, and representative states.
- Boundaries, zero/negative values, overflow/precision, repeated actions, background/offline behavior, dominant strategies, dead upgrades, and waiting walls.
- Explicit distinction between tuning defects and structural economy defects.

### Progression and Pacing

- Unlock graph, prerequisites, power curve, content cadence, failure recovery, and prestige/reset loops.
- First session, early game, midgame transition, late-game promise, content cliffs, soft locks, grind spikes, and irreversible traps.
- Whether progression creates new decisions or only larger numbers.

### Features and Content

- Runtime state: `Working`, `Partial`, `Scaffold`, `Dead`, `Missing`, or `Unverified`.
- Design value: `Load-bearing`, `Accelerant`, `Decoration`, or `Trap`.
- Dead controls, orphaned data, unreachable content, misleading parity claims, and authoring/localization/regression burden.

### UI, UX, Accessibility, and Browser Fit

- First-minute comprehension, hierarchy, density, affordance, feedback, errors, locked/disabled/empty/loading states.
- Keyboard access, focus, semantics, labels, contrast, reduced motion, zoom, screen-reader basics, and touch targets.
- Narrow mobile, laptop, desktop, and wide layouts where supported: clipping, overlap, reflow, hover-only behavior, long text, and stable dimensions.
- Background timer throttling, visibility changes, refresh, storage limits, audio policy, and input behavior.

### Code, Runtime, State, and Persistence

- Authoritative state, mutation boundaries, event order, tick ownership, async races, deterministic RNG, timer drift, cleanup, duplicate loops, and unbounded work.
- Save schema versions, migrations, corruption recovery, import/export, atomicity, numeric precision, caps, invariants, and invalid content references.
- Module quality measured by change cost and failure containment, not file count.
- For networked games: authority, authorization, replay/duplication, and trust boundaries.

### Tests, Tooling, and Delivery

- Tests mapped to player-visible risks and state invariants, with controlled clocks and deterministic seeds.
- Real behavior assertions versus smoke tests, snapshots, and implementation-coupled checks.
- Content validation, types, lint, CI parity, production build, bundle/performance budgets, dependency health, save migration, recovery, long-session, responsive, accessibility, and cross-browser coverage.

## Subagent Council

For a full audit use four non-overlapping primary lenses:

1. `Systems and Balance`: loop, economy, progression, pacing, RNG, dominant strategies, content math.
2. `Player and UI`: first session, usability, responsive layout, accessibility, feedback, visual hierarchy, browser fit.
3. `Code and Runtime`: architecture, state, events, timers, saves, performance, tests, tooling.
4. `Product and Scope`: thesis, parity, feature completeness, roadmap, sequencing, delivery risk, documentation truthfulness.

Give all auditors the same project path, scope, constraints, evidence standard, and output schema. Do not ask several agents for the same whole-project review. Add a specialist only for a material extra surface.

Require from each auditor:

- one-line verdict and confidence;
- up to 10 severity-ranked findings;
- severity, category, evidence, impact, recommendation, and verification test per finding;
- 0-10 category score with rationale;
- strongest aspect, most dangerous unknown, and three priority actions;
- checks run and surfaces not verified.

Subagents remain read-only. The Judge verifies consequential claims, records meaningful disagreement, and never averages scores into the verdict.

## Severity, Scores, and Verdict

- `Critical`: state loss/corruption, broken core loop, exploitable trust failure, or material unplayability.
- `High`: major player, balance, progression, fidelity, architecture, or delivery failure blocking a credible next phase or release.
- `Medium`: real defect or debt with contained impact or workaround.
- `Low`: polish, clarity, consistency, naming, or future-proofing.

Score requested categories from 0-10 with confidence: `0-2` absent/broken, `3-4` severe gaps, `5-6` functional but fragile or shallow, `7-8` solid, `9` release-grade evidence, `10` exceptional and comprehensively verified.

Choose exactly one verdict:

- `GO`: ready for the named next step.
- `RESHAPE`: valuable, but scope, sequence, design, or architecture must change first.
- `HOLD`: direction may be sound, but a concrete blocker or missing validation prevents commitment.
- `KILL`: this version's thesis or cost/value case fails.

For implementations also assign readiness: `Not playable`, `Prototype`, `Vertical slice`, `Alpha`, `Beta`, or `Release candidate`.

## Report Contract

For a saved audit, write standalone Markdown containing:

1. Title, date, target revision, scope, executive verdict, readiness, confidence, and what breaks first.
2. Scorecard for Game, Code, UI/UX, Balance, Progression, Features, Tests/Tooling, and Planning/Delivery.
3. Methodology, commands, runtime scenarios, evidence sources, and limitations.
4. Findings ordered globally by severity, each with evidence, impact, remediation, and verification.
5. Dedicated game, balance, progression, feature, UI, and code/runtime/test evaluations.
6. Feature-state and intended-versus-actual matrices.
7. `P0 now`, `P1 next`, and `P2 later` actions with dependencies and exit criteria.
8. Strengths worth preserving, residual risks, and unverified surfaces.

Keep the roast sharp in verdicts and finding titles. Keep the technical body precise.

## Rules

- Do not invent behavior, metrics, source fidelity, or market evidence.
- Prefer root causes over symptom volume.
- Do not reward code, test, documentation, or feature counts without checking what they prove.
- A passing build does not prove a good game; polish does not prove completeness.
- Do not recommend a rewrite without proving why incremental repair is less viable.
- Make the cheapest useful validation or remediation step executable.
- Preserve valuable ideas as deferred when recommending scope cuts.
