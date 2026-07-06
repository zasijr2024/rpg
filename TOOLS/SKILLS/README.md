# Codex Skills

Dieser Ordner enthaelt lokale Skill-Definitionen fuer CH80. Kanonisch ist jeweils der Unterordner mit `SKILL.md`.

## Verfuegbare Skills

| Skill | Pfad | Zweck | Trigger |
| --- | --- | --- | --- |
| `roast` | `TOOLS/SKILLS/roast/SKILL.md` | Harte Evaluation von Game-Design, Features, Scope, Roadmap und Architekturentscheidungen | `roast`, `/roast`, `pressure-test`, `stress-test`, `red-team`, `evaluate`, `validate`, `evaluieren`, `bewerten`, `entscheiden` |

## Roast-Subagents

Der `roast`-Skill nutzt bei nicht-trivialen Roasts Subagents, sofern Multi-Agent-Tools verfuegbar sind. Die Rollen liegen unter `TOOLS/SKILLS/roast/agents/`:

- `contrarian.md`
- `player-advocate.md`
- `systems-designer.md`
- `production-engineer.md`
- `market-researcher.md`
- `judge.md`

Der Hauptagent bleibt immer Judge: Subagents liefern getrennte Perspektiven, aber der Hauptagent synthetisiert das finale `GO` / `RESHAPE` / `KILL` Urteil.

## Hinweis zur Installation

Fuer diese Repo verdrahtet `AGENTS.md` den Skill explizit. Wenn der Skill ausserhalb dieser Repo automatisch in Codex verfuegbar sein soll, muss der Ordner `TOOLS/SKILLS/roast/` in den globalen Codex-Skill-Pfad kopiert werden.

`TOOLS/SKILLS/roast.md` ist ein aelterer Skill-Entwurf und bleibt nur als Referenz erhalten. Fuer neue Arbeit gilt `TOOLS/SKILLS/roast/SKILL.md`.
