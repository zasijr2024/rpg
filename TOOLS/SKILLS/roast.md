---
name: roast
description: Use when the user asks to roast, pressure-test, stress-test, red-team, evaluate, validate, or brutally assess a project idea, game concept, game design foundation, feature, prototype plan, monetization/distribution model, scope, roadmap, or says "/roast". Adapted for Codex 5.5 High style work: inspect local project context when relevant, reason like a senior product/game/engineering reviewer, and return one decisive GO / RESHAPE / KILL verdict plus the cheapest validation test.
argument-hint: "[idea, feature, design, project folder, or document path to roast]"
---

# Roast Skill for Codex 5.5 High

## What this does

`/roast` is an adversarial evaluation workflow for project ideas, game design foundations, and feature decisions. It is not a vibe check and not encouragement. It is a structured teardown that tries to find the fastest way the idea fails, then turns that into an actionable decision.

Use it before spending serious time on:

- a new project idea,
- a game concept,
- a core loop,
- a game feature,
- a prototype scope,
- a tech/architecture direction,
- an open-source/community strategy,
- a funding/distribution plan,
- a roadmap decision.

The output is a decisive verdict:

- `GO`: strong enough to build or test next.
- `RESHAPE`: worth pursuing only after a concrete change.
- `KILL`: do not build this version.

The skill is deliberately sharp. It should be direct and specific, but never insulting. Attack the idea, not the user.

## Codex Operating Rules

Codex should use its project-agent strengths:

- If the roast references files, folders, or an active repo, inspect the relevant local context first.
- Prefer `rg` / `rg --files` for project discovery.
- Read the smallest set of files needed to understand the idea.
- Do not edit files unless the user explicitly asks to update planning docs or artifacts.
- If current market/platform/competitor facts matter, use web research and cite sources.
- If no multi-agent tool is available, simulate the council as five independent analysis passes in one response.
- If multi-agent tools are available, they may be used, but the Judge must still synthesize the final answer.
- Keep the final answer actionable. The roast is valuable only if it changes what the user does next.

## Step 1: Get the Brief

If the user provides enough context, proceed. If not, ask at most 3-5 focused questions in one batch.

Ask only for missing information that materially affects the verdict:

1. **What is it?** One or two sentences describing the idea, feature, or system.
2. **Who is it for?** Target player/user, platform, and use case.
3. **What must it prove?** Core success metric or design thesis.
4. **Constraints?** Timeline, team size, budget, tech stack, existing docs/code.
5. **Decision needed?** Idea viability, MVP scope, feature inclusion, design quality, tech feasibility, or prioritization.

If the user says "just run it", infer reasonable defaults and continue.

Before the council, restate the brief as a compact paragraph. That paragraph is the shared context for every persona.

## Step 2: Choose Roast Mode

Pick the mode that matches the request. If unclear, use `Game/Product Roast`.

### Mode A: Project Idea Roast

Use for broad project or product ideas.

Primary questions:

- Is this worth building?
- What is the target audience and why would they care?
- What is the smallest proof?
- What kills it fastest?
- Is the scope aligned with the user's edge?

### Mode B: Game Design Roast

Use for game concepts, mechanics, core loops, progression, systems, combat, economy, UX, or feature sets.

Primary questions:

- Is the core loop legible and repeatable?
- Where is the player motivation?
- What creates skill, mastery, tension, surprise, or optimization?
- What becomes boring after 10 minutes, 2 hours, and 20 hours?
- What systems are load-bearing and which are decorative?

### Mode C: Feature Roast

Use for one feature or subsystem.

Primary questions:

- Does this feature strengthen the core loop?
- Is it worth its complexity?
- What new UI, balancing, save, testing, and content burden does it add?
- Can it be cut without harming the product thesis?
- What is the cheapest prototype of the feature?

### Mode D: Prototype Scope Roast

Use for MVP/prototype planning.

Primary questions:

- What is the single thesis the prototype must prove?
- What is essential vs. tempting?
- What should be explicitly excluded?
- Can this be built in the stated time?
- What validation artifact should exist after the prototype?

## Step 3: Convene the Council

Run the idea through these five lenses. Each lens must return:

- one-line stance,
- 3-5 sharpest points,
- single most important thing the user must hear,
- score from 1-10 for that dimension.

Scores mean:

- `1-3`: serious failure signal.
- `4-6`: possible, but weak or underdefined.
- `7-8`: promising with known risks.
- `9-10`: unusually strong.

### 1. The Contrarian: Failure and Assumptions

Mandate:

> Assume this fails. Find the fatal flaws, weak assumptions, hidden dependencies, scope traps, player objections, and the fastest path to irrelevance. Do not soften the critique. Identify the one load-bearing assumption most likely to be false.

Evaluate:

- why players/users ignore it,
- why the feature adds noise,
- why the scope explodes,
- why the core loop may not carry,
- why the creator may be overestimating their edge.

### 2. The Player Advocate: Audience and Experience

Mandate:

> Think like the target player/user, not the creator. Would I actually spend time on this? Would I come back? What is confusing, boring, stressful, tedious, or uncompelling? What moment would make me quit?

Evaluate:

- first 60 seconds,
- first session,
- return motivation,
- clarity of goals,
- emotional payoff,
- friction and confusion,
- accessibility and UX load.

### 3. The Systems Designer: Game/Mechanic Fundamentals

Mandate:

> Strip the idea to mechanics. Does the loop work? Are the incentives coherent? Does progression create meaningful decisions? Are systems interacting or merely stacked? Is there a clean path from simple start to deeper mastery?

Evaluate:

- core loop,
- progression loop,
- economy/resource loop,
- risk/reward,
- pacing,
- build depth,
- mastery,
- failure/recovery,
- extensibility.

### 4. The Production Engineer: Scope, Tech, and Maintainability

Mandate:

> Treat this as something that must actually ship. Identify implementation cost, architecture risks, testing needs, content burden, tooling needs, data model issues, portability risks, and maintenance traps.

Evaluate:

- MVP complexity,
- technical dependencies,
- UI complexity,
- save/data migration,
- balancing/testability,
- asset/content requirements,
- platform constraints,
- open-source readiness,
- long-term maintainability.

### 5. The Market and Reference Researcher: Evidence and Differentiation

Mandate:

> Compare the idea against reality. Use current research when useful or requested. Identify competitors, adjacent games/products, player expectations, genre conventions, distribution constraints, pricing/funding norms, and differentiation gaps.

Evaluate:

- direct competitors,
- comparable mechanics/features,
- audience demand signals,
- genre expectations,
- discoverability,
- distribution fit,
- funding model fit,
- open-source/community fit,
- what the market already punishes.

If web access is unavailable or not used, say so and limit this lens to known references and project-local evidence.

## Step 4: Judge Synthesis

The Judge is the main Codex response. It must not merely average scores. It resolves the tension between the five lenses and makes one call.

The Judge should explicitly consider:

- player value,
- design coherence,
- production feasibility,
- scope discipline,
- differentiation,
- technical risk,
- validation cost,
- fit with the user's stated constraints.

For game projects, always include:

- core loop verdict,
- player motivation verdict,
- scope verdict,
- feature/system risk,
- cheapest playable or paper prototype.

For open-source/free projects, include:

- community/maintenance risk,
- funding realism,
- license/asset implications when relevant.

## Output Format

Use this structure unless the user asks for another format:

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

[The smallest 24-72 hour test that validates the riskiest assumption before building the full thing.]

### If RESHAPE

[The concrete change that preserves the upside while removing the fatal flaw.]

### Next Decisions

1. ...
2. ...
3. ...
```

## Verdict Guidance

Use `GO` only when:

- the thesis is clear,
- the target user/player is specific,
- the core loop or value loop is coherent,
- the MVP is buildable,
- the riskiest assumption has a cheap test.

Use `RESHAPE` when:

- the opportunity is real but the current form is bloated, generic, unfocused, or mis-scoped,
- a specific pivot can fix the flaw,
- the user should not build the current version.

Use `KILL` when:

- the core loop does not work,
- the audience/value proposition is too vague,
- the feature is mostly complexity,
- the scope cannot be justified,
- the idea depends on assumptions that are expensive to validate.

## Special Guidance for Game Design

When roasting game systems, do not stop at "fun" or "not fun". Be concrete:

- What action does the player repeat?
- Why is that action satisfying?
- What changes over time?
- What decision gets more interesting?
- What feedback tells the player they are improving?
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
- Do not flatter the idea.
- Do not invent evidence. If using market evidence, cite sources.
- Do not over-research when the real issue is design clarity.
- Do not recommend building a full product as the first test.
- The cheapest test must be specific enough to run.
- The final verdict must be one of `GO`, `RESHAPE`, or `KILL`.
- If local project docs contradict the user's summary, call that out with file references.
- If the user asks to save the roast, write it as a separate analysis document, not into planning decisions unless explicitly requested.
