# Codex Skills

This folder contains project-local skill definitions. The canonical skill is the subfolder containing `SKILL.md`.

## Available Skill

| Skill | Path | Purpose | Triggers |
| --- | --- | --- | --- |
| `roast` | `TOOLS/SKILLS/roast/SKILL.md` | Evidence-driven browsergame planning and implementation audits | `roast`, `/roast`, `audit`, `pressure-test`, `evaluate`, `balance`, `progression`, `UI`, `code review` |

## Browsergame Audit Council

For a non-trivial full audit, use four independent read-only lenses when subagents are authorized:

- Product and Scope: `roast/agents/contrarian.md`
- Player and UI: `roast/agents/player-advocate.md`
- Systems and Balance: `roast/agents/systems-designer.md`
- Code and Runtime: `roast/agents/production-engineer.md`

`roast/agents/market-researcher.md` is an optional specialist when current market, platform, distribution, or IP evidence changes the decision. The main agent follows `roast/agents/judge.md` and owns the final verdict.

When the user explicitly requests GPT-5.6 SOL ULTRA, delegated auditors use model `gpt-5.6-sol` with reasoning effort `ultra`.

`TOOLS/SKILLS/roast.md` is a legacy reference. New work uses `TOOLS/SKILLS/roast/SKILL.md`.
