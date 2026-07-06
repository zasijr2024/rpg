---
name: roast
description: Adversarial evaluation workflow for project ideas, game concepts, game design foundations, features, prototype scope, tech direction, open-source strategy, funding/distribution, or roadmap decisions. Use when the user asks to roast, pressure-test, stress-test, red-team, evaluate, validate, or brutally assess an idea, feature, core loop, game system, project plan, or says "/roast". Inspect relevant local project context when available, then return a decisive GO / RESHAPE / KILL verdict plus the cheapest validation test.
argument-hint: "[CH80 idea, feature, design, roadmap item, project folder, or document path to roast]"
---

# Roast

Use this skill to pressure-test ideas before the user spends serious time building them.

The critique should be sharp, specific, and useful. Attack the idea, not the user. Do not flatter. Do not hedge into "it depends." The final answer must make a call.

## Operating Rules

- Inspect local project files when the request references a project, folder, document, feature plan, or codebase.
- Prefer `rg` / `rg --files` for discovery.
- Read only the files needed to understand the idea.
- Do not edit files unless the user explicitly asks to update planning docs or artifacts.
- Use web research when current market, platform, competitor, pricing, or distribution facts materially affect the verdict; cite sources.
- Use subagents when a multi-agent tool is available, the request benefits from separate perspectives, and the user has explicitly allowed delegation or subagent use in the current task or project instructions.
- If no multi-agent tool is available, simulate the council as five independent analysis passes.
- Do not lose, overwrite, or silently discard the user's original feature ideas, details, examples, constraints, or edge cases. If a roast recommends reducing scope, preserve omitted parts explicitly as deferred, out-of-scope-now, open ideas, or historical notes when updating docs.
- Keep the final output actionable and skimmable.

## Brief

If the user provides enough context, proceed. Otherwise ask at most 3-5 focused questions:

1. What is the idea, feature, system, or project?
2. Who is it for and on which platform?
3. What must it prove?
4. What constraints matter: timeline, team, budget, tech stack, existing docs/code?
5. What decision is needed: viability, MVP scope, feature inclusion, design quality, tech feasibility, or prioritization?

If the user says "just run it", infer reasonable defaults and continue.

Before the council, restate the brief in one compact paragraph.

## Modes

Choose the matching mode. If unclear, use Game/Product Roast.

- Project Idea Roast: broad project, product, or concept viability.
- Game Design Roast: core loop, progression, combat, economy, UX, systems, feature set.
- Feature Roast: one feature, subsystem, mechanic, or content type.
- Prototype Scope Roast: MVP boundaries, roadmap, build order, validation plan.

## CH80 Defaults

When the request concerns CH80, read `README.md`, `PROTOTYP/core.md`, `PROTOTYP/CHANGELOG.md`, and the relevant file in `PROTOTYP/FEATURES/` first when they exist. Treat the current phase as feature-planning first and implementation second.

Assume these project constraints unless the user says otherwise:

- single-player browser idle game,
- offline progress is not part of the current prototype scope unless a later feature plan explicitly confirms it,
- no multiplayer,
- desktop first for the first prototype phase,
- early 4K layout planning,
- minimal prototype UI,
- no 2D graphics,
- no animations,
- no balancing pass, broad testing, or UI rework until all planned features are implemented.
- original user ideas and details must survive roasting, reshaping, and feature-document cleanup; a smaller prototype cut can defer details, but must not erase them.

For CH80 feature decisions, classify the result as:

- `Prototype now`: small enough, teaches a core lesson, and fits the current phase.
- `Prototype later`: promising but depends on baseline systems not built yet.
- `Reshape first`: good intent, wrong scope, sequencing, or interaction model.
- `Archive`: keep as idea, but do not spend implementation time on it now.

## Subagents

Subagents are required for non-trivial roasts when a multi-agent tool is available and explicit delegation is allowed by the current user request or project instructions. Use them to create independent pressure from distinct perspectives, not to outsource the final judgment.

Rules for subagent use:

- Each subagent receives exactly one explicit perspective/persona before it starts.
- Each subagent gets the same compact brief, relevant project facts, and hard constraints.
- Each subagent focuses only on its own lens and avoids solving the whole roast.
- Ask every subagent for: one-line stance, 3-5 sharpest points, the single most important warning, score from 1-10, and the cheapest test from that persona's perspective.
- The main agent synthesizes the results, resolves contradictions, and writes the final verdict.
- Do not let subagents edit files or planning docs unless the user explicitly asks for saved artifacts.
- Do not spawn subagents for trivial roasts where the overhead is larger than the analysis.
- If subagents disagree, preserve the disagreement in the synthesis when it changes the decision.

Default CH80/game personas:

- Contrarian: failure modes, false assumptions, scope traps, dominant risks. Role file: `agents/contrarian.md`.
- Player Advocate: first-session experience, motivation, clarity, friction, retention. Role file: `agents/player-advocate.md`.
- Systems Designer: loops, incentives, economy, progression, mastery, balance risk. Role file: `agents/systems-designer.md`.
- Production Engineer: implementation cost, data shape, tooling, testing, saves, maintainability. Role file: `agents/production-engineer.md`.
- Market Researcher: category reality, differentiation, audience expectations, distribution and IP risk. Role file: `agents/market-researcher.md`.

Judge role file: `agents/judge.md`. The main agent is always the Judge.

## Council

Run the brief through five lenses. Each lens returns a one-line stance, 3-5 sharpest points, the single most important thing the user must hear, and a 1-10 score.

Score meanings:

- `1-3`: serious failure signal.
- `4-6`: possible, but weak or underdefined.
- `7-8`: promising with known risks.
- `9-10`: unusually strong.

### 1. Contrarian: Failure and Assumptions

Assume the idea fails. Find fatal flaws, weak assumptions, hidden dependencies, scope traps, player/user objections, and the fastest path to irrelevance. Identify the load-bearing assumption most likely to be false.

### 2. Player Advocate: Audience and Experience

Think like the target player/user. Would they spend time on this? Would they come back? What is confusing, boring, stressful, tedious, or uncompelling? What moment makes them quit?

Evaluate first minute, first session, return motivation, goal clarity, emotional payoff, UX friction, and accessibility load.

### 3. Systems Designer: Mechanics and Fundamentals

Strip the idea to mechanics. Does the loop work? Are incentives coherent? Does progression create decisions? Are systems interacting or merely stacked? Is there a clean path from simple start to deeper mastery?

Evaluate core loop, progression, economy/resource loop, risk/reward, pacing, build depth, mastery, failure/recovery, and extensibility.

### 4. Production Engineer: Scope and Maintainability

Treat this as something that must ship. Identify implementation cost, architecture risk, testing needs, content burden, tooling needs, data model issues, portability risk, and maintenance traps.

Evaluate MVP complexity, dependencies, UI complexity, saves/migrations, balancing/testability, asset/content needs, platform constraints, open-source readiness, and long-term maintainability.

### 5. Market Researcher: Evidence and Differentiation

Compare the idea against reality. Use current research when useful or requested. Identify competitors, adjacent products/games, user/player expectations, genre conventions, distribution constraints, funding norms, and differentiation gaps.

If web access is unavailable or not used, say so and limit this lens to known references and project-local evidence.

## Judge

The Judge synthesizes the council. Do not average scores. Resolve the tension and make one call.

Always consider:

- player/user value,
- design coherence,
- production feasibility,
- scope discipline,
- differentiation,
- technical risk,
- validation cost,
- fit with user constraints.

For game work, include:

- core loop verdict,
- player motivation verdict,
- scope verdict,
- feature/system risk,
- cheapest playable or paper prototype.

For free/open-source work, include:

- community/maintenance risk,
- funding realism,
- license and asset implications when relevant.

## Output

Use this structure:

```md
## THE VERDICT: GO / RESHAPE / KILL
Confidence: low / medium / high

**The call in one line:** ...

**Why:** ...

**What breaks first:** ...
**What is strongest:** ...

**Council scores:** Contrarian X/10 | Player X/10 | Systems X/10 | Production X/10 | Market X/10

### Council Findings

**Contrarian:** ...
**Player Advocate:** ...
**Systems Designer:** ...
**Production Engineer:** ...
**Market Researcher:** ...

### Design Read

- **Core loop:** ...
- **Player motivation:** ...
- **Scope:** ...
- **Differentiation:** ...
- **Technical risk:** ...

### Cheapest Test

[Smallest 24-72 hour test that validates the riskiest assumption before building the full thing.]

### If RESHAPE

[Concrete change that preserves the upside while removing the fatal flaw.]

### Next Decisions

1. ...
2. ...
3. ...
```

## Verdict Rules

Use `GO` only when the thesis is clear, the audience is specific, the value/core loop is coherent, the MVP is buildable, and the riskiest assumption has a cheap test.

Use `RESHAPE` when the opportunity is real but the current form is bloated, generic, unfocused, or mis-scoped, and a specific pivot can fix it.

Use `KILL` when the loop/value proposition fails, the audience is vague, the feature is mostly complexity, the scope cannot be justified, or the idea depends on expensive assumptions.

## Game Design Checks

When roasting game systems, answer concretely:

- What action does the player repeat?
- Why is that action satisfying?
- What changes over time?
- What decision gets more interesting?
- What feedback shows improvement?
- What becomes automatic, and what remains meaningful?
- What content burden does the system create?
- What is the first boring minute?
- What is the first confusing screen?
- What is the first dominant strategy?

Classify features:

- `Load-bearing`: required for the design thesis.
- `Accelerant`: improves the loop but can ship later.
- `Decoration`: nice, but not structural.
- `Trap`: adds cost, confusion, or balance risk without enough value.

## Rules

- Be direct, not cruel.
- Do not invent evidence.
- Do not over-research when the real issue is design clarity.
- Do not recommend building a full product as the first test.
- Make the cheapest test specific enough to run.
- If local project docs contradict the user's summary, call that out with file references.
- If the user asks to save the roast, write it as a separate analysis document, not into planning decisions unless explicitly requested.
