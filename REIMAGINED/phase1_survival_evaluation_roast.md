# Phase 1 Survival Evaluation And Roast

## Verdict

The idea has a strong survival hook, but in its raw form it is dangerously close to sanding off what made *A Dark Room* work.

The good part: waking in darkness, not knowing what is safe, learning food through risk, and turning discovered knowledge into actions all fit the original author's core pattern of mystery through systems.

The weak part: "total memory loss," visible hunger/thirst, berry color rules, `GATHER BERRIES appears`, `PUNCH & KICK`, shelter, fire, butcher, cook meat can easily become a generic survival-crafting checklist. That would miss the point. ADR is not beloved because it has wood, meat, traps, and combat. It works because the player does not know what game they are in until the game has already changed shape around them.

## Source Alignment

Local design authority:

- `ANALYSE/authors_vision_and_success.md` defines the core vision as minimalist expansion, player inference, sparse prose, and mechanics as narrative.
- `REMAKE/docs/context.md` states that the remake target is original parity first, with new content deferred.
- `REMAKE/docs/content-model.md` requires expansions to live outside source-derived original content and be disabled by default.
- `REMAKE/docs/deferred.md` explicitly defers new content until after parity.

Original source evidence:

- `DATA/02-room-data.md`: the original opening is fire, temperature, stranger, wood, and builder progression.
- `DATA/03-outside-data.md`: the forest/village layer adds gather wood, traps, workers, meat, fur, bait, and production.
- `DATA/04-path-data.md`: expedition preparation depends on water, cured meat, weight, and embark.
- `DATA/05-world-data.md`: world survival uses food/water movement costs, HP, fights, and `fists` with verb `punch`.
- `DATA/10-events-setpieces.md`: caves already exist later as sparse setpieces with camps, bodies, meat, caches, and cave combat.

Conclusion: this idea can follow the author's vision only as a reimagined optional expansion. It should not replace strict original mode.

## What Works

### Discovery Through Bodily Need

Hunger and thirst can work because they make action necessary before the player understands the system. This matches the original first-button contract: the player acts because the room is dark and cold, not because a quest marker says so.

### Berries As Risk Memory

Berries are promising if each taste teaches a rule and changes future available actions. That is an ADR-shaped mechanic: knowledge becomes interface.

The good version:

- player sees berries
- player risks eating them
- result is ambiguous or costly
- repeated evidence becomes remembered behavior
- a gather action appears only after the player earned trust

The bad version:

- red equals food
- green equals poison
- UI displays berry stats
- player optimizes a visible table

### Camp As Reimagined Room

A cave/camp can be a valid replacement for the room if fire is still the heart of it. The camp should begin as a return point, not as a base-building interface.

### Butchering And Cooking

Meat processing can bridge early survival into ADR's existing meat/cured-meat economy. It also supports moral unease: the player turns dead things into resources because survival asks for it.

## What Does Not Work Yet

### High: "Total Memory Loss" Is Clumsy

ADR's power comes from withholding, not from announcing amnesia. "The player has total memory loss" is a stock plot device that explains the mystery before the mystery has done any work.

Recommendation:

Do not say memory loss. Start with sensory absence. Let the player be ignorant because the interface and world are silent.

Better:

- `the darkness is close`
- `the stomach knots`
- `nothing comes when reaching back`

Even that last line should be used sparingly.

### High: The Cave Opening Risks Breaking The Original Identity

The original is called *A Dark Room*, and its first screen is the game's thesis. Replacing the room with a cave is not a small content tweak. It changes the symbolic center from domestic/liminal shelter to wilderness survival.

That can be interesting, but call it what it is: a reimagining, not preservation.

Recommendation:

Use this only in an expansion pack or alternate mode. Keep strict original mode untouched.

### High: Hunger And Thirst Can Become Bad UI

If hunger and thirst appear as two bars immediately, the game turns into every survival prototype ever made. The original does not front-load meters. It reveals state when state matters.

Recommendation:

Hide hunger/thirst until the player experiences consequences. Start with notification pressure, then reveal compact state only when necessary.

### High: "GATHER BERRIES Appears" Is Too Mechanical If Presented Literally

The concept is good. The presentation is not.

ADR unlocks buttons, but the magic is that the button feels like the world changed, not like a skill-tree node activated. If the game announces "GATHER BERRIES unlocked," it cheapens the discovery.

Recommendation:

Use a quiet notification such as:

- `the red ones can be eaten`

Then add `gather berries` without fanfare.

### Medium: Berry Color Memory Is Too Shallow Alone

Red berry equals good berry is nursery-book design. It is too clean for ADR's bleak uncertainty.

Recommendation:

Use color plus detail:

- red and bitter
- pale and waxy
- dark and sweet-smelling
- blue under thorned leaves

This lets the system feel observed, not gamified.

### Medium: `PUNCH & KICK` Risks Fighting The Original Combat Language

Original world combat gives the unarmed fallback as `fists` with verb `punch`. Repeated punching feeds unarmed perks. Adding kick is not forbidden, but it must create an actual decision.

If punch and kick are just two low-level attack buttons, it is clutter.

Recommendation:

Keep `punch` as the default. Add `kick` only if it has a distinct rule:

- longer cooldown
- chance to stagger
- lower hit chance
- useful for fleeing

### Medium: "Build Shelter, Make Fire, Butcher, Cook" Is A Checklist

The raw idea reads like a design board, not an ADR sequence. ADR does not say "learn to build a shelter." It creates cold, scarcity, and waiting until shelter is the answer the player invents.

Recommendation:

Make every craft action answer an experienced discomfort:

- cold night unlocks shelter
- raw meat sickness unlocks cooking
- thirst sickness unlocks boiling
- animal signs unlock snares

### Medium: Sickness Needs Teeth But Not Random Cruelty

Random sickness from berries can be good early tension. Random death from trying the only visible food source is cheap.

Recommendation:

Sickness should:

- reduce vitality
- slow actions
- increase thirst
- pass with time, warmth, water, or rest
- become lethal only when layered with existing weakness

### Low: "Crush Damage" Is The Wrong Surface Detail

Damage taxonomy is implementation detail. Showing "crush damage" in Phase 1 would be tone-deaf unless the combat system has multiple damage types that matter immediately.

Recommendation:

Keep early labels human: `punch`, `kick`, `throw stone`, `flee`. Hide damage categories until they carry meaningful equipment or enemy interactions.

## Vision Compliance Checklist

This phase follows ADR's vision only if:

- the first screen has one action
- future systems are hidden
- no explicit tutorial text appears
- the player learns by consequences
- unlocked actions are quiet and contextual
- fire changes the world state
- prose stays short, lowercase, and concrete
- the UI remains austere
- numbers appear only after the player has reason to care
- the camp grows from necessity, not as a base-builder promise
- the wider world is implied before explained

This phase fails ADR's vision if:

- it opens with lore about amnesia
- it shows hunger, thirst, vitality, recipes, map, camp, and combat at once
- berry safety becomes a visible encyclopedia
- crafting becomes a recipe grid
- combat becomes a hotbar
- the game explains goals
- the interface becomes cozy, decorative, or modern survival-game busy

## Recommended Rewrite Of The Idea

Use this as the cleaner design statement:

> Phase 1 begins in a dark cave. The player knows nothing because the world gives nothing. Hunger and thirst appear first as bodily pressure, then as systems. The player reaches the forest, risks unsafe food and water, and slowly learns which signs can be trusted. Knowledge becomes small repeatable actions: gather berries, gather wood, boil water, cook meat. A fire turns the cave mouth into a camp. A rough shelter makes returning possible. Combat is rare, crude, and frightening; fists are the fallback, flight is often wiser. The phase ends when survival stops being immediate panic and becomes preparation for the wider world.

## Expanded Design Recommendation

### Keep The First Ten Minutes Narrow

Do not open with camp management. Open with darkness.

Suggested sequence:

1. `A Dark Cave`
2. `feel around`
3. find stone / hear wind / cut hand
4. `go outside`
5. `search`
6. find berries or water
7. risk sickness or relief
8. return to cave
9. make fire
10. fire unlocks camp identity

### Make Memory Mechanical

Memory should not be backstory.

Use remembered facts:

- `known_foods`
- `known_water_sources`
- `known_fire_method`
- `known_tracks`

The player "remembers" because the action list changes.

### Tie Survival To Original Resources

Bridge early resources into ADR's existing economy:

- branches become wood
- small animals become meat/fur/bait
- cooked meat becomes cured meat later
- bones become bone spear later
- hide becomes leather later
- water carrying becomes waterskin later

This keeps Phase 1 from becoming a disconnected survival minigame.

### Use Fire As The Main Transform

Fire should:

- warm the cave/camp
- reduce sickness risk from cooked food/boiled water
- lower encounter risk
- attract future events
- enable shelter improvement
- echo the original `light fire` / `stoke fire` loop

If fire is just a crafting prerequisite, the design has already lost.

## Implementation Boundaries

Because current repo scope is parity-first, implementation should wait until post-parity expansion support exists.

When implemented:

- place content under an expansion root, not `src/content/original`
- keep strict original mode disabled from loading it
- declare new resources, actions, encounters, and locations through registries
- validate that expansion content does not mutate original keys
- document every intentional deviation from original pacing
- do not add this to the default fresh save until expansion mode exists

## Final Roast

The idea has a real ADR-compatible core, but it is currently wearing the clothes of a generic survival game.

"Player wakes with amnesia, gets hungry, eats berries, builds shelter, punches enemies, cooks meat" is not enough. That version could be any early-access forest survival prototype with the graphics removed.

The ADR version is sharper:

- no amnesia speech
- no tutorial
- no recipe list
- no visible future
- no comfort
- no certainty

Let the player crawl from dark to hunger to fire to camp by inference. Make each new button feel like a scar, not a reward badge.

