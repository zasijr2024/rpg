# REMAKE Context and Plan Roast Audit

Audit timestamp: 2026-07-06 18:30:46 Europe/Berlin

Skill used: local `roasting-audit`

Audited files:

- `REMAKE/context.md`
- `REMAKE/plan.md`
- `ANALYSE/authors_vision_and_success.md`
- `DATA/00-extraction-index.md`
- workspace repository state

## Executive Verdict

The remake plan is directionally good, but it is not yet implementation-safe. It has the right instincts: exact original data, headless TypeScript engine, desktop-first scope, author-vision alignment, deferred audio/mobile/save migrations, and explicit 4K testing. That is the good news.

The bad news: it currently reads like a serious plan written before the dangerous parts were forced into hard, testable contracts. It says "exact parity" many times, but does not yet define enough machinery to prove exact parity. It says "latest web version," but the plan itself does not pin the source commit/version. It says "save versioning later," while also requiring save/load during parity, which is a state-corruption trap unless handled carefully. It says "easy to expand," but the architecture is still abstract enough that a careless implementation could become a React-shaped clone of the old jQuery mess.

The biggest immediate problem: this workspace is not a git repository. For a full remake with extracted source data, generated docs, architecture decisions, and future implementation phases, developing without version control is reckless. Use git before writing the first line of remake code.

## Scope and Methodology

This audit inspected documentation and repository state only. There is no remake implementation yet, so runtime behavior, actual UI, code quality, and tests could not be executed.

Checks run:

- Read `REMAKE/context.md`
- Read `REMAKE/plan.md`
- Read `ANALYSE/authors_vision_and_success.md`
- Read `DATA/00-extraction-index.md`
- Listed workspace folders
- Ran `git status --short`
- Searched key plan sections and line references

Result of git check:

```text
fatal: not a git repository (or any of the parent directories): .git
```

## Critical Findings

### C1. No Git Repository Exists

Evidence:

- `git status --short` fails because `F:\ADR20` is not a git repository.
- The workspace already contains important generated assets: `DATA`, `ANALYSE`, `REMAKE`, `REPORTS`, `ORIGINAL`, `GUIDE`.

Why this is bad:

This project is about to port thousands of lines of behavior, narrative data, event trees, state rules, and UI logic. Without git, every conversion mistake, accidental overwrite, partial refactor, and generated-file churn becomes harder to inspect and recover from. The project is already producing reference documents; losing change history now would be self-inflicted damage.

Recommendation:

Initialize git before implementation begins.

Minimum setup:

- `git init` at `F:\ADR20`
- `.gitignore` for `node_modules`, build outputs, coverage, Playwright reports, temporary files, logs, local env files, and generated caches
- first commit: original extracted/reference state
- second commit: remake planning docs
- future commits by milestone, not by random work session

Recommended branch strategy:

- `main`: stable, documented state
- `remake/parity`: active remake implementation
- short feature branches for risky systems: `engine-state`, `events-runtime`, `world-map`, `combat`, `space`

Use git tags for milestones:

- `data-extraction-complete`
- `plan-approved`
- `phase-0-scaffold`
- `phase-1-core-engine`
- `parity-complete`

### C2. "Exact Original Game Data" Is Declared, But Not Yet Enforced

Evidence:

- `REMAKE/plan.md:21` says to keep exact original game data.
- `REMAKE/plan.md:280` starts a data parity plan.
- `REMAKE/plan.md:317` adds data verification.
- `REMAKE/plan.md:726` lists data parity tests.

Why this is still weak:

The plan says to test key lists and constants, but "exact original game data" is bigger than keys and constants. In A Dark Room, behavior is data: callbacks, random distributions, timers, side effects, scene transitions, loot semantics, state mutation order, unlock conditions, and combat specials. A snapshot test that confirms an event title exists is not parity. It is a polite way of missing the bug.

Recommendation:

Add a real parity contract before implementation:

- Define a source commit hash for `ORIGINAL`.
- Generate structured canonical manifests from `ORIGINAL`, not from hand-copied Markdown.
- Add behavior-level fixtures for representative original flows.
- Use deterministic RNG injection from day one.
- Create scenario tests: "build trap cost after N traps", "clear mine unlocks worker", "death returns outfit", "blueprint redeems into fabricator", "event scene branch applies reward once".

## High Findings

### H1. The Context File Is Too Thin To Govern a Remake

Evidence:

- `REMAKE/context.md:1` says to recreate the latest web version while preserving vision.
- `REMAKE/context.md:2` says to add improvements later.

Why this is bad:

Those two bullets are true, but too small to serve as project context. The actual operating rules now live in `REMAKE/plan.md` and `ANALYSE/authors_vision_and_success.md`. If someone opens only `context.md`, they miss the real constraints: no audio/mobile/save migration yet, exact data parity, desktop 4K, and author-vision authority.

Recommendation:

Replace `REMAKE/context.md` with a short authoritative index:

- project goal
- current phase
- design authority link
- data authority link
- plan link
- explicit deferred scope
- current decision log location

### H2. The Plan Does Not Pin "Latest Web Version" To an Immutable Source

Evidence:

- `REMAKE/plan.md:5` says latest web version.
- `DATA/00-extraction-index.md` says extraction came from local `ORIGINAL`.
- The plan does not name the upstream commit, archive hash, or local source checksum.

Why this is bad:

"Latest" is not a stable build target. If upstream changes tomorrow, "latest web version" changes meaning. The earlier validation report mentions an upstream commit, but the plan does not bind itself to that. A parity project without a pinned source is how you get endless arguments about whether a mismatch is a bug or a moving target.

Recommendation:

Add a `Source Baseline` section to `REMAKE/plan.md`:

- upstream repository URL
- commit hash
- extraction date
- local folder path
- whether executioner/fabricator/audio additions are included
- checksum manifest for original source files if practical

### H3. Save Versioning Is Deferred, But Save/Load Still Exists

Evidence:

- `REMAKE/plan.md:27` forbids save versioning/migration until after remake completion.
- `REMAKE/plan.md:47` says a simple development save/load system is still needed.
- `REMAKE/plan.md:115` includes save/load serialization for the parity build.
- `REMAKE/plan.md:373` requires save/load round-trip.

Why this is risky:

This is a reasonable compromise, but it is also a trap. If developers persist real player saves during parity without a schema/version boundary, those saves become undocumented legacy baggage the moment Phase 14 ends. "We will migrate later" only works if the pre-migration state is intentionally disposable or clearly labeled.

Recommendation:

Add this rule:

During parity, saves are dev-only and may be invalidated at any time. The UI should clearly label them as non-durable until post-parity save versioning exists.

Also add:

- a namespaced localStorage key such as `adr-remake-dev-save`
- export/import debug save buttons only in dev mode
- no promise of save compatibility before Post-Parity Phase A

### H4. The Plan Is Long, But Missing the First Hard Artifact: `parity-checklist.md`

Evidence:

- `REMAKE/plan.md:810` lists documentation deliverables.
- `REMAKE/plan.md:815` says `REMAKE/parity-checklist.md` should exist.
- It does not exist yet.

Why this matters:

The plan is 652 lines. That is fine as a strategy document, but implementation needs a checklist that can be mechanically worked through. Without it, Phase 14 becomes a vague ceremony where everyone hopes the game "feels complete."

Recommendation:

Create `REMAKE/parity-checklist.md` before Phase 0 or during Phase 0. It should be generated from `DATA/18-canonical-catalogs.md` and original source manifests:

- every craftable
- every trade good
- every worker
- every resource behavior
- every event
- every setpiece scene
- every encounter
- every world tile
- every landmark
- every weapon
- every perk
- every ending/prestige behavior

### H5. Data Extraction Markdown Is Useful For Humans, Bad As the Machine Canonical Source

Evidence:

- `DATA/00-extraction-index.md` states the source data is preserved in markdown files.
- `REMAKE/plan.md:286-301` uses those markdown files as working references.
- `REMAKE/plan.md:303` correctly says original JavaScript remains final authority if ambiguous.

Why this is fragile:

Markdown is not a great source for automated parity. It wraps JavaScript in fences and mixes explanations with source. That is useful for reading, but brittle for tooling. If the implementation team ports from Markdown manually, errors will creep in quietly.

Recommendation:

Use Markdown as documentation, not the canonical machine source. Add a `TOOLS` extraction script that emits JSON/TS manifests where possible and reports function-bearing definitions separately.

### H6. The Tech Stack Recommendation Is Plausible, But Not Proven By a Spike

Evidence:

- `REMAKE/plan.md:55-68` chooses TypeScript, Vite, React, Zustand, Vitest, Playwright.
- `REMAKE/plan.md:823-825` recommends React plus a headless engine over Phaser.

Why this is incomplete:

The recommendation is probably right, but the highest-risk UI pieces are not ordinary React screens: world map rendering, combat timing, event flow, and space flight. The plan says Canvas for space "if needed," but there is no technical spike milestone to validate the approach.

Recommendation:

Add a Phase 0.5 risk spike:

- render a 61x61 ASCII world viewport at 4K
- simulate timer/cooldown updates without React re-render storms
- run a miniature event scene with costs/rewards
- test keyboard input and focus behavior
- prototype space movement/collision in Canvas or DOM and choose one

## Medium Findings

### M1. The Plan Says "Easy To Expand" But Does Not Define Content Pack Boundaries Enough

Evidence:

- `REMAKE/plan.md:29` says data-driven and easy to expand.
- `REMAKE/plan.md:693-700` mentions expansion framework.
- `REMAKE/plan.md:796-807` lists content expansion requirements.

Issue:

The plan lists the right nouns but not enough rules. Future content can easily contaminate original parity unless there is a strict content namespace and a strict original mode.

Recommendation:

Define:

- `content/original` is immutable after parity except bug fixes.
- `content/expansions/*` cannot mutate original data directly.
- expansions register additive content through explicit extension points.
- strict-original mode disables all expansions.
- every content pack has validation and dependency metadata.

### M2. The Plan Does Not Define RNG Determinism Explicitly

Evidence:

- `REMAKE/plan.md:393` mentions deterministic time/random seeds for events.
- RNG is not promoted to a core architecture requirement.

Issue:

A Dark Room relies on random events, trap drops, world generation, combat hits, loot, and map placement. If RNG is not injectable and seedable at the engine level, parity tests will be weaker and debugging will be miserable.

Recommendation:

Make deterministic RNG a Phase 1 deliverable, not a testing footnote.

### M3. The "Modern UI" Boundary Is Still Subjective

Evidence:

- `REMAKE/plan.md:253-278` lists UI improvement rules.
- It forbids many bad ideas, which is good.

Issue:

"Minimalist but optimized and improved" can still drift into over-designed UI. The plan needs a visual acceptance artifact before implementation: screenshots or wireframes for key states.

Recommendation:

Create `REMAKE/ui-spec.md` with reference states:

- first screen
- room with stores
- outside village
- path
- world
- event
- combat
- ship
- fabricator
- space

Use original screenshots if available, plus remake wireframes.

### M4. Legal and License Handling Is Absent

Evidence:

- The plan references `ORIGINAL/` as source authority.
- The original repo is MPL-2.0, but `REMAKE/plan.md` does not mention license obligations.

Issue:

This is a remake using original code/data/text. Exact data parity means license and attribution cannot be hand-waved.

Recommendation:

Add a `License and Attribution` section:

- identify original license
- preserve notices
- track modified source-derived files
- decide license for remake code
- document how original text/data is attributed

### M5. "Latest Web Version" Includes Audio Data, But Audio Is Deferred

Evidence:

- `DATA/12-audio-data.md` exists.
- `REMAKE/plan.md:27` defers audio.
- `REMAKE/plan.md:156` stores audio/localization data but does not implement.

Issue:

This is acceptable because the user explicitly deferred audio, but the definition of parity must state that gameplay parity excludes audio playback. Otherwise "latest web version" and "deferred audio" conflict.

Recommendation:

Rename the first milestone from "full parity" to "gameplay/UI parity excluding deferred systems," or explicitly define parity exclusions.

## Low Findings

### L1. `REMAKE/context.md` Has Typos and Weak Formatting

Evidence:

- `REMAKE/context.md` uses "webversion" and two bare hyphen lines.

Issue:

Tiny, but this is the front door to the project. It should not look like a scratchpad once planning starts.

Recommendation:

Replace it with a compact project index.

### L2. The Plan Mentions Future Docs But Does Not State Owners or Timing

Evidence:

- `REMAKE/plan.md:810-819` lists documentation deliverables.

Issue:

Docs without timing become shelfware.

Recommendation:

Tie each doc to a phase:

- `tech-decisions.md`: Phase 0
- `parity-checklist.md`: Phase 0/2
- `deferred.md`: Phase 0
- `content-model.md`: Phase 2
- `deviations.md`: starts Phase 1 and is updated continuously

## Game Design Evaluation

The plan is strongest where it defends the game's essence:

- `REMAKE/plan.md:21-29` captures exact data, sparse text, moral ambiguity, hidden genre shifts, and desktop-first scope.
- `REMAKE/plan.md:267-278` correctly bans tutorials, future previews, decorative effects, lore panels, and dashboard-style redesign.
- `ANALYSE/authors_vision_and_success.md` is a useful design authority and should stay active during implementation reviews.

The roast:

The plan knows the game should be mysterious, but it still risks building a development process that treats mystery as vibes instead of testable pacing. The first hour of A Dark Room is a carefully staged starvation diet of information. If the remake team adds one "helpful" affordance per phase, the final result will be a clean, modern UI that murdered the original reveal structure.

Concrete fix:

Add "discovery parity tests." For each phase of progression, define what must not be visible yet.

## UI Evaluation

The desktop and 4K requirements are sensible:

- `REMAKE/plan.md:224-246` covers 1366x768 through 3840x2160.
- `REMAKE/plan.md:235-244` calls out line length, grid proportions, zoom, and keyboard input.

The roast:

"4K support" is not a design by itself. A 4K screen can make minimalist UI look either elegant or abandoned. The plan says constrained width and scaling variables, but it does not yet define target line lengths, panel widths, map cell sizes, or screenshot baselines. Without those, implementation will devolve into eyeballing.

Concrete fix:

Add measurable UI tokens:

- max reading width in `ch`
- minimum map cell size
- max event panel width
- stores panel width rules
- button min/max widths
- supported browser zoom matrix

## Architecture and Test Evaluation

The proposed architecture is sane:

- React UI
- headless TypeScript engine
- typed data modules
- deterministic tests
- Playwright screenshots

The roast:

The plan correctly says "do not put gameplay logic in React components" at `REMAKE/plan.md:61` and `REMAKE/plan.md:201`. Good. But unless this becomes an enforced lint/test boundary, it is just a sentence waiting to be ignored under deadline pressure.

Concrete fix:

Enforce boundaries:

- `src/engine` cannot import `react`
- `src/data` cannot import UI code
- `src/ui` can dispatch commands but cannot mutate state directly
- add dependency-boundary lint rules or architecture tests

## Git Versioning Evaluation

Yes, use git versioning. Not later. Now.

Recommendation:

Initialize git at `F:\ADR20`, unless there is an external reason to keep `ORIGINAL` outside the repo. The repo should include:

- `REMAKE`
- `ANALYSE`
- `DATA`
- `REPORTS`
- `GUIDE`
- `ORIGINAL` if license/storage policy allows tracking the reference source
- future source code
- tooling scripts

Do not include:

- `node_modules`
- `dist`
- coverage
- Playwright traces/videos/screenshots except intentional golden screenshots
- temporary generated scratch files
- local environment files

Recommended first commits:

1. `chore: add original source and extracted data references`
2. `docs: add remake vision analysis and plan`
3. `docs: add roast audit report`
4. `chore: scaffold remake app`

Why git matters here:

- protects against accidental edits to extracted data
- makes source-derived changes reviewable
- gives clean checkpoints for each phase
- allows comparing behavior changes against parity goals
- makes future expansion work branchable
- supports tags for milestone baselines

Minimum `.gitignore`:

```gitignore
node_modules/
dist/
build/
coverage/
playwright-report/
test-results/
.env
.env.*
*.log
*.tmp
.vite/
```

One warning: if `ORIGINAL` is tracked, preserve its license and avoid silently modifying it. Treat it as vendor/reference source. Put remake code elsewhere.

## Prioritized Next Actions

1. Initialize git and make a baseline commit.
2. Rewrite `REMAKE/context.md` as a project index.
3. Add a pinned source baseline section to `REMAKE/plan.md`.
4. Create `REMAKE/parity-checklist.md` from extracted data.
5. Create `REMAKE/deferred.md` to lock audio/mobile/save migration scope.
6. Add a Phase 0.5 risk spike to the plan.
7. Define deterministic RNG as a Phase 1 requirement.
8. Define license/attribution handling.
9. Create `REMAKE/ui-spec.md` before UI implementation.
10. Add architecture boundary rules before code grows.

## Residual Risk

Because there is no implementation yet, this audit could not verify:

- actual runtime behavior
- UI rendering
- save/load behavior
- performance
- accessibility
- test quality
- data conversion correctness

The plan is a strong starting document, but the project is not ready for implementation until the source baseline, git, parity checklist, and risk spike are in place.

