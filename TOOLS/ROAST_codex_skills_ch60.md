# Roast: Codex-Skills und externe Agent-Upgrades fuer CH60

Stand: 2026-06-28.

## Brief

CH60 ist ein Desktop-Web-Incremental-Prototyp mit bewusst engem Clicker-Heroes-nahen Coreloop. M1 und M2 sind laut lokaler Simulation bestanden, M3 ist Prestige/Souls und Save/Load. Bewertet wird, welche Codex-Skills und Agent-Workflows die weitere Projektarbeit beschleunigen, ohne Scope-Creep, Kontextmuell oder falsche Automatisierung zu erzeugen.

## THE VERDICT: RESHAPE

Confidence: high

**The call in one line:** Skills sind fuer CH60 wertvoll, aber nur als kleine, harte Gate-Workflows; ein grosser "AI business partner"-Stack wuerde das Projekt eher zerfasern.

**Why:** CH60 hat kein Tooling-Problem, sondern ein Scope-Disziplin- und Validierungsproblem. Genau dafuer helfen `roast`, Milestone-Runner, Balance-Roast, Handoff und spaeter Playwright. Dagegen erzeugen zu viele installierte Skills, Subagents und Goal-Loops neue Koordinationskosten.

**What breaks first:** Der Agent arbeitet formal viel, aber am falschen Gate: UI, Deployment, Figma, Community, Monetarisierung oder Phase-1-Features, bevor M3-M6 den Core beweisen.

**What is strongest:** Die Kombination aus lokalem Meilensteinplan, Simulation, `npm run verify`, Roast-Gates und spaeter Playwright ergibt eine sehr robuste Entwicklungsmaschine.

**Council scores:** Contrarian 6/10 | Player 7/10 | Systems 8/10 | Production 8/10 | Market 6/10

### Council Findings

**Contrarian:** Das groesste Risiko ist Skill-Sammeln als Produktivitaetsersatz. Ein Skill, der keine konkrete CH60-Entscheidung verbessert oder keine wiederholte Arbeit stabilisiert, ist Ballast. Besonders gefaehrlich: Deploy-, Figma-, Notion-, Linear- und Subagent-Workflows, bevor der Core spielbar ist.

**Player Advocate:** Spieler profitieren von Skills nur indirekt. Relevant ist, ob Skills zu besseren Zahlen, weniger Bugs, klarerer UI und schnellerer Validierung fuehren. `playwright`, Balance-Roast und Milestone-Runner sind sichtbar wertvoll. Skill-Sammeln selbst bringt dem Spieler nichts.

**Systems Designer:** Der beste Skill-Stack ist ein Gate-System: planen, implementieren, verifizieren, auswerten, roasten, handoff. Die Skills sollten die bestehende Spielsystem-Disziplin spiegeln: kein neues System ohne Entscheidung, kein Feature ohne Simulation, kein Save ohne Migration.

**Production Engineer:** Eigene Skills lohnen sich, weil CH60 klare wiederholbare Pflichten hat. Aber sie muessen knapp sein. Zu lange Skills kosten Kontext und machen Codex unpraeziser. Deterministische Checks gehoeren in Skripte, Tests oder Hooks, nicht in lange Prosatexte.

**Market Researcher:** Die externe Claude-Idee "money-making partner" ist als Marketingrahmen schwach fuer CH60. Die uebertragbare Substanz ist nicht Geld, sondern Anti-Sycophancy, Validierung, Context-Handoff und parallele Analyse. Open Source/free als Ziel bedeutet zusaetzlich: Funding- und Community-Workflows erst nach spielbarer Demo.

### Design Read

- **Core loop:** Der Skill-Stack soll M3-M6 schuetzen, nicht neue Features anziehen.
- **Player motivation:** Indirekt stark, wenn Balance- und UI-Checks Spielerfriktion frueh finden.
- **Scope:** Nur drei eigene Skills sofort: `session-handoff-codex`, `ch60-milestone-runner`, `ch60-balance-roast`.
- **Differentiation:** Skills differenzieren nicht das Spiel, sondern die Arbeitsweise. Differenzierung entsteht spaeter aus C&H, Bossmods, Soul-Upgrades, Relikten und klarer Desktop-UI.
- **Technical risk:** Niedrig, solange Skills instruktional bleiben. Mittel, wenn Hooks/Subagents automatische Edits erzwingen.

### Cheapest Test

24-72 Stunden:

1. Nutze `ch60-milestone-runner` fuer genau einen M3-Arbeitsschritt: Prestige/Souls oder Save-Schema.
2. Fuehre `npm run verify` in `F:\CH60\PROTOTYP\SIMULATION` aus.
3. Lasse `ch60-balance-roast` den neuen Report gegen M3-Gates bewerten.
4. Erzeuge danach ein `session-handoff-codex`-Handoff.

Der Test ist bestanden, wenn der naechste Agent aus dem Handoff ohne Rueckfragen erkennt:

- was geaendert wurde,
- welche Dateien wichtig sind,
- welche Commands gruen waren,
- ob M3 weitergehen darf,
- welche Scope-Grenzen weiter gesperrt bleiben.

### If RESHAPE

Baue keinen allgemeinen "Agent-Business-Partner". Baue ein kleines CH60-Agentensystem:

1. `roast` fuer Entscheidungstore.
2. `ch60-milestone-runner` fuer Umsetzung entlang M0-M6.
3. `ch60-balance-roast` fuer Reports und Zielkorridore.
4. `session-handoff-codex` fuer Kontextwechsel.
5. Ab M4 `playwright` plus Screenshot-Workflow.

### Next Decisions

1. Sollen die drei Entwurfs-Skills aus `TOOLS\SKILLS` nach `.agents\skills` kopiert und damit repo-aktiv gemacht werden?
2. Soll ein `AGENTS.md` fuer CH60 angelegt werden, das M0-M6-Gates und `npm run verify` dauerhaft vorgibt?
3. Soll vor M4 der kuratierte `playwright`-Skill installiert werden?

