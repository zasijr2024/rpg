# Post-Parity Expansion Ideas Evaluation

Date: 2026-07-08

Scope: evaluate proposed expansion ideas for the finished remake of *A Dark Room*, judge alignment with the original author's apparent vision, and recommend safer changes or stronger alternatives.

Primary local references:

- `ANALYSE/authors_vision_and_success.md`
- `REMAKE/docs/context.md`
- `REMAKE/docs/deferred.md`
- `DATA/01-core-engine-state.md`
- `DATA/03-outside-data.md`
- `DATA/04-path-data.md`
- `DATA/05-world-data.md`
- `DATA/10-events-setpieces.md`
- `DATA/11-events-executioner.md`

## Executive Verdict

The best expansion path is not "add more RPG systems." That is the trap.

The original game works because it starts with almost nothing, reveals systems slowly, and lets mechanics carry story. New content should follow that same shape: the player learns through pressure, consequences, and inference. Every added system should answer a felt problem, not advertise itself as a feature.

Strongest ideas:

- codex of learned knowledge
- optional event information instead of interruptive popups
- new locations and maps
- sparse sidequests and event chains
- weather, exposure, and route pressure
- scars/consequences instead of levels
- multi-step landmarks that change after return visits
- village moral pressure and faction-like consequences without reputation meters
- restrained visual symbols for maps and village state
- visible earned perks
- grounded food and status-effect expansion

Weakest ideas:

- magic as fire/ice/lightning fantasy spells
- enemy rarity tiers with random mods
- player/enemy leveling
- body-part clicking in combat
- replacing text-heavy identity with real images and icon-only UI

Those weak ideas are not automatically impossible, but in their raw form they push the remake away from *A Dark Room* and toward a generic RPG/idler/survival hybrid.

## Design North Star

Use this rule for every expansion decision:

> Knowledge becomes interface.

The player should not be shown future mechanics, skill trees, enemy tiers, recipe lists, or lore databases in advance. The player should discover something, survive it, and only then see the interface change.

Expansion content should preserve:

- one narrow starting focus at a time
- sparse, lowercase, concrete prose
- no tutorial voice
- no feature list visible up front
- resource pressure as story pressure
- moral unease through systems, not speeches
- readable abstraction over literal illustration
- friction where friction creates tension

## Idea Evaluations

### Replace All Resource Labels With Icons

Verdict: weak as stated.

Vision fit: low if labels are removed; medium if icons are supplemental.

Roast: replacing all resource labels with icons misunderstands the game. *A Dark Room* is a language-first interface. Removing words from the resource layer trades clarity and tone for decoration. It also creates an accessibility problem and makes rare resources harder to learn.

Recommendation:

- Keep text labels as the primary representation.
- Add small optional icons beside labels only after the resource has been discovered.
- Use icons as scan aids, not replacements.
- Always keep accessible names and tooltips.
- Do not use icons for mysterious resources before the player understands them.

Better version:

- `wood` stays `wood`, with a small branch icon once discovered.
- `alien alloy` stays text-first until late game, then can get a strange metal glyph.
- In compact panels, icons may appear with hover/focus labels.

Implementation note:

- Treat resource icons as UI metadata outside `src/content/original`.
- Expansion mode can decorate original resources, but strict parity mode should remain text-first.

### Implement Damage Types And Resistances That Fit The Game

Verdict: potentially good, high risk.

Vision fit: medium if grounded; low if exposed as a visible RPG chart.

Roast: "damage types and resistances" sounds like a spreadsheet trying to wear a coat. The original combat is blunt and legible: weapons, cooldowns, hit chance, health, supplies, death. If the expansion adds a full elemental matrix, it will bury tension under math.

Recommendation:

- Use a very small set of grounded types.
- Hide exact resistance numbers.
- Make types matter through enemy description and tool choice, not UI tables.

Recommended types:

- `cut`: blades, teeth, bleeding
- `impact`: fists, clubs, blunt force, machinery
- `pierce`: spear, bayonet, bullets
- `heat`: fire, explosions, burning fuel
- `shock`: energy cells, broken machines, charged weapons
- `toxin`: venom, infection, spoiled food

Avoid:

- fire/ice/lightning spell school UI
- percentage resistance panels
- color-coded weakness icons on every enemy
- loot-grind enemies that exist only to test the system

Better version:

- "the thing's hide turns the blade" implies cut resistance.
- "sparks crawl under its shell" implies shock weakness.
- "bullets flatten against the plates" implies pierce resistance.

### Replace Buildings With Icons / Make The Village Visible

Verdict: good if abstract, bad if it becomes a city-builder.

Vision fit: high if restrained.

Roast: making the village visible can be excellent, but there is a cliff edge here. One step too far and the village becomes a cozy settlement screen, which fights the original's bleak efficiency and moral discomfort.

Recommendation:

- Keep the village representation symbolic and sparse.
- Show structure counts through small marks, silhouettes, or rows.
- Let the village become denser and noisier as it grows.
- Do not show happy animated villagers.
- Do not create decorative building placement.

Better version:

- Huts appear as small dark roof marks.
- Traps appear at the forest edge.
- Smokehouse adds a thin smoke line.
- Steelworks adds haze.
- Armoury adds a hard-edged mark.
- Population pressure changes the title and density.

Implementation note:

- This should be a view layer over `game.buildings`, `game.population`, and `game.workers`.
- It must not change original production rules unless expansion mode is active.

### New Types Of Armor

Verdict: partially already original.

Vision fit: medium to high if designed as tradeoffs.

Source evidence:

- The original already has leather, iron, steel, and kinetic armour in `DATA/04-path-data.md` and `DATA/05-world-data.md`.

Roast: "add leather, iron, steel" is not an expansion idea. It is already the game. Adding more vertical armor tiers would be lazy progression filler.

Recommendation:

- Do not add simple `better armour 1, 2, 3`.
- Add situational protective gear with costs and tradeoffs.
- Make equipment change expedition planning.

Recommended armor/gear expansions:

- `padded coat`: helps cold, weak in combat
- `plated coat`: reduces bullets/piercing, reduces evasion or carry capacity
- `sealed mask`: reduces toxin/infection, costs cloth/charcoal upkeep
- `insulated rig`: protects against shock, heavy
- `scarred leathers`: cheap repairable armor, poor against bullets
- `wanderer shell`: late-game alien material, strong but morally loaded

Better rule:

- Armor should answer an environmental or enemy problem the player has already suffered.

### Enemy Rarity Tiers, Rarer Enemies Have More Mods

Verdict: bad fit as stated.

Vision fit: low.

Roast: rarity tiers are ARPG loot-brain. "Rare enemy with three mods" is the sort of system that makes players farm instead of wonder. It also cheapens the original's environmental storytelling by turning threats into colored variants.

Recommendation:

- Do not use common/rare/epic enemy tiers.
- Use rare named encounters, rare conditions, or environmental variants instead.
- Keep rarity narrative, not color-coded.

Better version:

- `the red-eyed thing`: appears only after repeated night travel.
- `the burned soldier`: found near an old battlefield.
- `the silent caravan`: rare road event, no combat unless disturbed.
- `the hollow one`: rare late-game enemy with one strange behavior.

Allowed modifier pattern:

- One meaningful modifier per rare encounter.
- Modifier is implied by text.
- Reward is story, knowledge, route, or scarce resource, not just bigger loot.

### New Types Of Food That Can Be Found And Gathered

Verdict: strong if knowledge-based.

Vision fit: high.

Roast: this is one of the better ideas, but only if it does not become a visible survival-crafting pantry. If the UI lists berries, mushrooms, roots, stew, jerky, tea, soup, and vitamins, the tone dies.

Recommendation:

- Add food as discovered survival knowledge.
- Make early foods uncertain.
- Make repeated use teach the player.
- Keep the number of food types small.

Recommended food types:

- `berries`: low hunger value, chance of sickness until identified
- `roots`: reliable but slow to gather
- `mushrooms`: high risk, possible strong healing or sickness
- `stale rations`: found in ruins, safe but rare
- `salted meat`: upgraded/crafted travel food
- `bitter tea`: weak healing, lowers infection/toxin risk

Bad version:

- visible food stat table
- recipe grid
- brightly colored item rarity
- cooking minigame

Better version:

- First time: `small red berries cling to the thorns.`
- After risk: `the red ones can be eaten.`
- Later action: `gather berries`

### Different Hunger And Healing Values

Verdict: good as a hidden balancing layer; risky as visible stat clutter.

Vision fit: medium.

Roast: different values are useful to design, but showing them too early turns bodily pressure into arithmetic. The original makes hunger and healing matter through movement, supplies, and death. It does not need a nutrition label.

Recommendation:

- Use different values internally.
- Reveal broad qualitative labels later.
- Keep exact values for tooltips only after the player has learned the item.

Possible categories:

- `barely helps`
- `fills the stomach`
- `restores strength`
- `keeps well`
- `sits badly`

Example values:

- berries: small hunger relief, no travel preservation
- roots: moderate hunger relief, heavy
- cured meat: travel staple
- medicine: direct HP recovery
- bitter tea: status relief, weak HP recovery
- hypo: powerful late-game recovery

### Implement Magic: Fire, Ice, Lightning

Verdict: bad fit in fantasy form.

Vision fit: low.

Roast: adding magic is the fastest way to make the game stop being *A Dark Room*. Fire, ice, and lightning spells belong to a different genre promise. The original has alien technology, damaged machinery, strange materials, and ambiguous post-collapse science. Use that.

Recommendation:

- Do not add spellcasting.
- Translate "magic" into unstable technology, environmental hazards, and primitive interpretations.

Better replacements:

- `charged cell`: shock effect, unstable
- `flare charge`: heat/burning effect
- `cold room`: slows movement or causes numbness
- `static rod`: chance to stun machines
- `glowstone`: late-game strange power source
- `broken projector`: frightens or distracts enemies

Design rule:

- If the player would call it magic, the game should never call it magic.

### Expanded Story, New Sidequests

Verdict: strong.

Vision fit: high if sparse.

Roast: "expanded story" is dangerous because most expansions ruin mystery by explaining it. The original story works because it leaves gaps. More story should add implications, not answers.

Recommendation:

- Add short event chains, not quest logs.
- No explicit objective markers.
- No NPC dialogue trees.
- No lore dumps.
- Let sidequests be discovered by revisiting places, carrying certain items, or making hard choices.

Recommended sidequest patterns:

- A signal repeats from the same direction until the player finds a ruined tower.
- A sick child in the village changes medicine pressure.
- A marked road leads to a dry reservoir.
- A broken machine accepts alien alloy but gives no explanation.
- A deserter offers a map, then later appears as a corpse or enemy.

Writing rule:

- One or two short lines per scene beat.
- Leave the worst part implied.

### New Locations And Maps

Verdict: excellent expansion foundation.

Vision fit: high.

Roast: this is the safest place to expand. The original already grows through map landmarks, terrain, setpieces, and distance pressure. More places can preserve the core if they respect scarcity and mystery.

Recommendation:

- Add new landmarks gradually by distance band.
- Use new locations to introduce one mechanic or one moral pressure each.
- Avoid making the map huge just for size.

Recommended locations:

- `A Dry Reservoir`: water promise, poisoned mud, buried bodies
- `A Radio Tower`: signal fragments, map reveal, risk of military attention
- `A Glassed Crater`: alien alloy, heat damage, strange silence
- `A Buried Greenhouse`: food discovery, mold/toxin risk
- `A Collapsed Highway`: vehicle wrecks, fuel, ambushes
- `A Weather Station`: storm warnings, old forecasts, map/weather system
- `A Sealed Bunker`: late-game locked event chain
- `A Black Orchard`: food source that feels wrong

Map recommendation:

- Add a second-region map only after the first world is understood.
- Consider weather overlays before simply increasing map radius.

### Replace Forced Popups With Optional Info That Does Not Interrupt The Player

Verdict: excellent, with exceptions.

Vision fit: high.

Roast: this is one of the cleanest UX ideas. Forced popups are expensive interruptions in a game built around waiting, checking, and noticing. But some events must still stop the player because the interruption is the event.

Recommendation:

- Convert low-stakes notifications into optional log/info entries.
- Keep forced modal treatment for events with choices, costs, danger, or irreversible consequences.
- Use quiet attention signals: log highlight, tab pulse, compact event marker.

Suggested categories:

- Ambient info: never modal
- Resource updates: never modal
- New discovery: soft prompt
- Moral choice: modal
- Combat ambush: modal or combat takeover
- Death/critical danger: modal or full transition

Implementation note:

- This fits the existing remake deviation that already avoids browser title flashing and uses focused event dialogs.

### Leveling System For Player And Enemies

Verdict: bad fit.

Vision fit: low.

Roast: levels are blunt, explicit, and generic. The original progression is not "you are level 8 now." It is "you can travel farther because you built, learned, suffered, and carried better things." Adding levels risks flattening the whole game into normal RPG math.

Recommendation:

- Do not add player levels.
- Do not add enemy levels.
- Use earned perks, scars, equipment, route knowledge, and world state.

Better replacements:

- `scars`: permanent consequences that may help and hurt
- `habits`: perks learned from repeated behavior
- `reputation`: village reactions based on choices
- `fear`: some encounters become avoidable after enough experience
- `route memory`: known paths reduce risk or improve travel efficiency

Enemy scaling recommendation:

- Enemies should be harder because of distance, terrain, location, faction, and preparation, not because they have a number over their head.

### Skills And Perks Are Visible, Plus New Ones

Verdict: good if earned-only.

Vision fit: high for earned perks, low for visible future skill trees.

Source evidence:

- The original already has perks such as `boxer`, `martial artist`, `unarmed master`, `barbarian`, `slow metabolism`, `desert rat`, `evasive`, `precise`, `scout`, `stealthy`, and `gastronome`.

Roast: visible perks are good. A visible skill tree is not. If the player can see locked perks before learning them, the game starts making promises instead of discoveries.

Recommendation:

- Show only earned perks.
- Add a codex/memory entry when a perk is learned.
- Do not show locked perk silhouettes.
- Keep descriptions short and slightly indirect.

Recommended new perks:

- `forager`: safer wild food gathering
- `hard stomach`: lower sickness chance
- `trailwise`: lower chance of losing direction in storms
- `steady hands`: better use of fragile devices
- `field medic`: medicine restores slightly more
- `quiet step`: lowers encounter chance near ruins
- `firekeeper`: fire/camp actions last longer

Avoid:

- `+5 percent critical chance` style descriptions
- perk points
- respecs
- level-gated perk rows

### Replace ASCII Map Art With Symbolized Tiles In Color

Verdict: good if restrained.

Vision fit: medium to high.

Roast: the original ASCII map is iconic because it abstracts the world. Replacing it with decorative tiles can shrink the player's imagination. But a modern remake can improve readability without turning the map into cartoon terrain.

Recommendation:

- Keep the grid abstraction.
- Use restrained color and symbolic glyphs.
- Support text/ASCII fallback.
- Reveal legend entries only after discovery.

Recommended tile treatment:

- village: small house/settlement glyph
- forest: muted tree glyph
- field: pale grass glyph
- barrens: dot/sand glyph
- road: line glyph
- cave: dark opening glyph
- town/city: broken structure glyph
- ship: angular wreck glyph
- outpost: small safe mark

Avoid:

- bright saturated terrain
- detailed illustrated tiles
- animated decorative map effects
- fully revealed legend at game start

### In Combat Mode Replace Enemies With Real Images / Shapes

Verdict: shapes maybe; real images no.

Vision fit: low for real images, medium for abstract shapes.

Roast: real enemy images would damage the game. The original lets the player's imagination fill the horror. A literal beast picture will either look cheap, too specific, or tonally wrong. It also makes the interface less timeless.

Recommendation:

- Use abstract silhouettes, glyphs, or simple hostile forms.
- Let the text name the threat.
- Use motion, spacing, and damage feedback sparingly.
- Keep enemies symbolic, not illustrative.

Better version:

- A beast is a jagged dark shape.
- A soldier is a rigid mark with a rifle line.
- A machine is angular and cold.
- The immortal wanderer is almost the player glyph, but wrong.

Avoid:

- stock monster art
- realistic portraits
- full combat sprites
- visible HP bars that dominate the event text

### Additional Map Navigation: Click Tile, Character Moves There With Intelligent Pathfinding

Verdict: good accessibility feature, high design risk.

Vision fit: medium.

Roast: pathfinding can quietly ruin exploration if it turns travel into automation. In *A Dark Room*, each movement matters because food, water, danger, and distance matter. Clicking a destination must not erase that pressure.

Recommendation:

- Allow click-to-move only to visible/revealed tiles.
- Move one tile at a time internally.
- Spend food and water per step.
- Trigger fights, events, danger checks, and death normally.
- Stop when something happens.
- Show projected travel cost only after the player understands supplies.

Required behavior:

- path cannot pass through unrevealed tiles
- path stops on landmarks
- path stops when supplies become dangerous
- player can cancel movement
- keyboard/manual movement remains primary

Better version:

- click adjacent tile: immediate move
- click distant revealed tile: preview route, then step automatically with interruptions

### Expanded Combat: Click Area Of Enemy For Better Hit/Crit/Status Chance

Verdict: bad fit as stated.

Vision fit: low.

Roast: body-part clicking is too literal and too twitchy. It turns combat into a small targeting minigame, which fights the original's cooldown/resource tension. It also demands enemy art detail that the game should avoid.

Recommendation:

- Do not use body-part clicking.
- Add tactical choices through verbs, weapons, stance, supplies, and risk.

Better combat expansion:

- `press`: faster aggression, more incoming risk
- `guard`: reduce incoming damage, slower attacks
- `aim`: longer cooldown, higher hit chance
- `disable`: consumes special item, chance to stun machine
- `flee`: survival choice, possible supply loss
- `use fire`: scares beasts, costs torch/fuel

Status chance should come from:

- weapon type
- enemy type
- preparation
- environment
- learned perk

Not from clicking a rendered ankle.

### Implement Status Effects: Bleeding, Burning, Stunned, Shocked, Etc.

Verdict: good if sparse.

Vision fit: medium to high.

Source evidence:

- The original already includes `stunned` behavior through bolas/disruptor style combat.
- Late-game executioner content already uses statuses/specials such as venomous, shield, energised/enraged/meditation style behavior in the remake data.

Roast: status effects are promising because they extend existing combat language. The danger is turning every fight into icon management.

Recommendation:

- Keep status count small.
- Use plain-language feedback.
- Make statuses rare and memorable.
- Let statuses emerge from specific enemies, weapons, or places.

Recommended statuses:

- `bleeding`: loses HP over time until bandaged or combat ends
- `burning`: damage over time, can scare some enemies, risks supplies
- `stunned`: cannot act briefly
- `shocked`: delayed action/cooldown disruption, stronger against machines
- `poisoned`: expedition pressure, worsens with movement
- `infected`: post-combat consequence unless treated
- `frozen/numb`: slower actions in cold locations

Avoid:

- stacking five status icons on every fight
- exact percentage tooltips up front
- universal resist/weakness UI

### Implement A Codex With Important Learned Stuff

Verdict: excellent.

Vision fit: very high if discovery-gated.

Roast: this is probably the best idea in the list. It supports mystery without forcing popups or tutorials. But it must be a memory of what happened, not a wiki for what might happen.

Recommendation:

- Add codex entries only after discovery.
- Keep entries short, fragmentary, and incomplete.
- Organize by what the player has learned, not by game systems.
- Do not show undiscovered categories.

Recommended sections:

- `places`
- `signs`
- `people`
- `things`
- `wounds`
- `machines`
- `food`
- `the village`

Example entries:

- `red berries`: `safe enough. bitter.`
- `old roads`: `lead home, sometimes.`
- `the builder`: `knows more than she says.`
- `boreholes`: `they took what they came for.`
- `burning`: `spreads fast. hurts faster.`
- `wanderer ships`: `not all wrecks are dead.`

Implementation rule:

- The codex should be event-driven from discovered facts.
- It should never contain future recipes, locked enemies, hidden locations, or system tutorials.

## Stronger Original Expansion Ideas

### Scars Instead Of Levels

Replace XP with consequences.

Examples:

- Starve repeatedly: gain `hollow`, food lasts longer but healing weakens.
- Survive thirst repeatedly: gain `dry mouth`, water lasts longer but max HP drops slightly during expeditions.
- Flee many fights: gain `quick feet`, better escape odds.
- Survive burning: gain `steady through smoke`, less panic from fire events.
- Kill many people: village events grow colder.

Why it fits:

- It lets behavior become character without a level number.
- It carries moral and survival memory.

### Weather And Exposure

Add weather as expedition pressure after the player understands world travel.

Examples:

- dust storm: reduced visibility, pathfinding uncertainty
- cold night: increased food use, requires coat/fire
- dry wind: increased water use
- ashfall: strange late-game region effect

Why it fits:

- The original world is already harsh.
- Weather makes preparation matter without adding generic levels.

### Knowledge-Based Foraging

Make food discovery a memory system.

Examples:

- berries become safer after repeated identification
- mushrooms require a learned sign
- roots require a tool
- bitter tea reduces toxin risk

Why it fits:

- The player learns the world by surviving mistakes.

### Settlement Moral Pressure

Expand the village without making it cozy.

Examples:

- more huts increase production and disease risk
- guards reduce theft but increase cruelty
- rationing preserves food but lowers arrivals
- punishment recovers stolen goods but changes event tone

Why it fits:

- The original already turns survival into uncomfortable efficiency.

### Rare Named Encounters

Replace rarity tiers with memorable one-off or low-frequency encounters.

Examples:

- `the burned soldier`
- `the child in the hut`
- `the glass-eyed beast`
- `the quiet caravan`
- `the machine that waits`

Why it fits:

- Mystery beats color-coded enemy farming.

### Second-Region Expansion

After the original ending or after late-game world mastery, unlock an optional second region.

Possible region identities:

- salt flats
- frozen basin
- dead coast
- orbital debris field on the ground
- old capital ruins

Rules:

- Do not reveal it early.
- Do not make it a bigger version of the same map.
- Give it one new pressure system and one new narrative question.

## More Strong Playtime-Lengthening Ideas

The correct way to lengthen *A Dark Room* is not to make numbers bigger or timers longer. That is fake playtime. It is padding, and players can smell it.

Good lengthening comes from:

- new uncertainty
- new route planning
- new consequences
- new discoveries that reframe old systems
- new optional risks with meaningful rewards
- new endings or aftermaths that preserve ambiguity

Bad lengthening comes from:

- grind walls
- larger resource costs with no new decision
- enemies with more HP only
- map radius inflation
- daily chores
- achievements disguised as content
- quest logs full of errands

### 1. Returning Landmarks That Change Over Time

Verdict: excellent.

Vision fit: very high.

Playtime value: high, because it reuses existing places with new meaning instead of bloating the map.

Roast: one-and-done landmarks waste the strongest part of the world map. If every place is just a loot box with prose, the expansion will feel broad and shallow.

Recommendation:

- Let some landmarks change after days pass, after the player takes something, or after village state changes.
- Do not mark them with quest icons.
- Let the player notice through changed text, altered tile state, or a new event when passing nearby.

Examples:

- An old house is empty first, occupied later, burned out later still.
- A battlefield attracts scavengers after the player loots it.
- A borehole becomes unsafe after rain or ashfall.
- A cave cleared of beasts becomes a shelter, then a hiding place for someone else.
- A radio tower begins broadcasting only after power is restored elsewhere.

Implementation note:

- Store landmark memory as expansion state keyed by map coordinate and scene id.
- Keep original strict-mode setpieces unchanged.

### 2. Multi-Stage Expedition Chains

Verdict: excellent.

Vision fit: high.

Playtime value: very high, if chains are short and dangerous.

Roast: the game does not need fetch quests. It needs trails of implication. "Bring 10 iron to NPC" is dead design. "A wire leads under the dust, then disappears into a sealed station" is closer.

Recommendation:

- Build 3-5 step chains that begin as environmental clues.
- Avoid quest names and objective text.
- Let chains span multiple expeditions and require preparation.

Example chain:

1. Find a repeating signal at the edge of the map.
2. Discover a dead relay tower.
3. Find a maintenance bunker with a power cell socket.
4. Restore power and reveal a distant landmark.
5. Reach the landmark and learn something that changes the ending context.

Reward types:

- map knowledge
- new codex facts
- new route
- one situational tool
- altered village/event behavior

### 3. Weather Forecasting As Earned Knowledge

Verdict: very strong.

Vision fit: high.

Playtime value: high, because it changes route timing and preparation without adding generic levels.

Roast: random weather with no warning is just punishment. Full forecast UI from the start is also wrong. The player should learn to read signs, then later build tools that make those signs clearer.

Recommendation:

- Start weather as notifications and consequences.
- Later unlock rough signs through codex entries.
- Later still, a weather station or barometer can reveal short forecasts.

Weather types:

- dry wind: water drains faster
- cold night: food drains faster, unprotected health risk
- dust storm: visibility shrinks, pathfinding becomes unsafe
- black rain: toxin/infection risk, refills some water with danger
- still air: lower encounter chance, but smoke and disease linger

Good UI:

- `the wind tastes of dust`
- `clouds bruise the horizon`
- `the air is too still`

Bad UI:

- `dust storm: -35% visibility, +20% thirst`

### 4. Road And Route Building

Verdict: strong if limited.

Vision fit: high.

Playtime value: high, because it gives long-term world goals without becoming city-builder placement.

Roast: freeform road building would turn the world into a management sim. But hard-earned routes between dangerous points fit the original's expedition logic.

Recommendation:

- Let cleared landmarks, outposts, and mines create route segments.
- Let the player invest resources to improve only discovered routes.
- Improved routes reduce risk, not eliminate it.

Possible upgrades:

- `marked trail`: less chance of getting lost in storms
- `supply cache`: one-time emergency food/water
- `watch post`: lower ambush chance nearby, costs population
- `wagon track`: lower carry penalty on known roads

Moral pressure:

- Road work consumes villagers or resources.
- Far routes create deaths, disappearances, or raids.

### 5. Camps Beyond The Village

Verdict: strong.

Vision fit: high if fragile.

Playtime value: high, because it extends exploration without simply increasing inventory size.

Roast: permanent cozy bases would be wrong. Outland camps should feel temporary, exposed, and expensive.

Recommendation:

- Allow a few fragile camps at specific landmark types.
- Camps can store limited supplies, shelter from weather, or extend expeditions.
- Camps can be raided, spoiled, abandoned, or found by others.

Camp types:

- cave camp: protects from cold, risk of beasts
- road cache: stores food/water, risk of theft
- watch fire: lowers night encounters, consumes wood
- hidden lean-to: one safe rest, then gone

Rule:

- Camps should reduce one risk while creating another.

### 6. Supply Spoilage And Preservation

Verdict: good with restraint.

Vision fit: medium to high.

Playtime value: medium, because it adds preparation depth.

Roast: spoilage can become miserable bookkeeping. If every food item has a freshness timer, the game becomes inventory tax.

Recommendation:

- Use spoilage only for wild/uncured foods.
- Keep cured meat reliable.
- Introduce preservation as a reason to value smokehouse/salt/drying.

Good version:

- berries and raw meat do not travel well
- salted meat travels farther but costs salt/wood/time
- spoiled food can be eaten in desperation with sickness risk

Bad version:

- 14 food items with individual expiration counters

### 7. Disease Pressure In The Village

Verdict: strong but dangerous.

Vision fit: high.

Playtime value: high, because it deepens the settlement moral layer.

Roast: disease can become either a cheap random villager-killer or a boring maintenance meter. It has to be tied to choices.

Recommendation:

- Disease risk grows with population density, poor food, bad water, and certain expeditions.
- The player can reduce risk through costly choices.
- Do not show a clean "disease meter" early.

Choices:

- isolate the sick: saves many, harms few
- spend medicine: protects village, weakens expeditions
- burn huts: brutal but effective
- ignore it: production continues, losses later

Why it fits:

- The original already includes sickness/plague events.
- Expansion can make those events feel connected to the player's economy.

### 8. Village Roles With Moral Tradeoffs

Verdict: strong.

Vision fit: high.

Playtime value: high, because it adds long-term economic decisions.

Roast: adding 20 worker jobs would be a spreadsheet. Add a few roles that make the village uglier or more fragile.

Recommended roles:

- `watcher`: lowers theft/raid risk, consumes cured meat
- `scout`: reveals distant signs slowly, sometimes dies
- `herbalist`: improves medicine/foraging, consumes roots/mushrooms
- `gravekeeper`: lowers disease after deaths, reveals grim codex entries
- `runner`: carries messages/supplies to camps, can vanish
- `quartermaster`: reduces waste, increases resentment

Avoid:

- production chains for their own sake
- worker upgrade trees
- visible morale meters with clean bonuses

### 9. Faction Pressure Without Faction UI

Verdict: strong.

Vision fit: high if invisible.

Playtime value: high, because it creates repeated consequences.

Roast: a reputation panel would be too gamey. The player should feel the world responding, not watch meters move.

Possible factions/groups:

- scavengers
- soldiers/deserters
- wanderer remnants
- village hardliners
- sick/refugee groups
- machine systems

Recommendation:

- Track hidden stances based on player actions.
- Express consequences through events, prices, ambushes, aid, and changed text.
- Never show `scavengers: hostile +25`.

Examples:

- Spare scavengers often and some later avoid combat.
- Execute thieves and the village becomes more efficient but colder.
- Trade with deserters and soldiers appear more often near roads.

### 10. Ambiguous Endgame Aftermath

Verdict: excellent.

Vision fit: very high.

Playtime value: high to very high, especially for post-ending expansion.

Roast: a clean "after the ending, here is more content" mode can ruin the finality. The expansion should feel like an echo, a consequence, or a second interpretation.

Recommendation:

- Add optional aftermath content only after original completion.
- Keep it separate from strict original ending.
- Do not overexplain the world.

Possible aftermath routes:

- return to a changed world after failed escape
- recover a signal from the ship before leaving
- discover evidence of earlier wanderer cycles
- use prestige cache to find a destroyed previous village
- choose whether to leave with or without the village's fate resolved

Good reward:

- new ending variation, not a better sword.

### 11. Prestige With Memory, Not Power Creep

Verdict: strong if subtle.

Vision fit: high.

Playtime value: very high for repeat play.

Roast: New Game Plus can easily become a victory lap that kills scarcity. If the player starts rich, the first hour dies.

Recommendation:

- Let prestige preserve fragments, not strength.
- Preserve codex echoes, scars, strange dreams, or one damaged item.
- Keep early scarcity intact.

Possible prestige memories:

- a half-remembered map direction
- a recurring phrase in the codex
- one previous cache, dangerous to retrieve
- altered opening text after completion
- the builder reacts differently once, then refuses to explain

Avoid:

- permanent stat boosts
- starting resources
- unlocked future tabs

### 12. Optional Hard Routes Through The Same Content

Verdict: good.

Vision fit: medium to high.

Playtime value: high for skilled players without bloating first playthrough.

Roast: difficulty modes in menus are boring. The game can make hardship a choice inside the world.

Examples:

- travel at night to avoid soldiers but risk beasts
- cross barrens directly to save food but burn water
- enter caves without torches
- press deeper into a landmark instead of leaving with loot
- choose not to build certain village structures to avoid consequences

Recommendation:

- Make hard routes opt-in through action choices.
- Reward with story, shortcuts, or rare tools.
- Do not require hard routes for normal completion.

### 13. Landmark Depth: "Go Deeper" Choices

Verdict: excellent.

Vision fit: high.

Playtime value: high, because it adds risk/reward without new global systems.

Roast: the original setpieces already branch, but expansion can make the decision to continue feel heavier. Do not turn every landmark into a dungeon crawl.

Recommendation:

- At some landmarks, offer `leave` or one more step.
- Each deeper step increases danger or consumes supplies.
- Some deeper paths permanently change the landmark.

Examples:

- Old mine: `descend`
- Hospital: `open the sealed ward`
- Crater: `cross the glass`
- Reservoir: `go below`
- Ship debris: `cut through`

Rule:

- The player should often leave and wonder if they should have stayed.

### 14. Expedition Injuries That Persist Temporarily

Verdict: strong if rare.

Vision fit: high.

Playtime value: medium to high.

Roast: permanent punishment can feel unfair. Temporary injuries create planning consequences without save-ruining the player.

Injuries:

- `limping`: movement costs more food briefly
- `burned`: healing weaker until treated
- `shaking`: hit chance reduced until rest
- `fevered`: water use higher
- `cut deep`: bleeding risk in next combat

Recommendation:

- Injuries should result from specific events or risky choices.
- Always provide recovery routes: rest, medicine, time, warmth, or rare treatment.

### 15. Rest And Nightfall

Verdict: good but easy to overbuild.

Vision fit: medium to high.

Playtime value: medium.

Roast: a day/night simulator would be too much. A simple nightfall pressure could work.

Recommendation:

- Add time-of-day only in expansion world travel, not room/village core.
- Night affects encounter type, temperature, and visibility.
- Rest costs supplies and carries risk.

Good text:

- `the light thins`
- `night gathers in the hollows`
- `something moves beyond the fire`

Bad UI:

- clock widget, calendar, sleep schedule

### 16. Ruin Mapping And Partial Maps

Verdict: very strong.

Vision fit: high.

Playtime value: high, because it creates exploration goals.

Roast: buying a complete map is boring. Finding partial, unreliable maps is much better.

Recommendation:

- Let old maps reveal fragments, not exact full layouts.
- Some maps are wrong or outdated.
- Combine scraps in the codex to infer a destination.

Examples:

- schoolhouse wall map reveals a road segment
- military chart marks mine patrols
- weather station chart hints at a safe route
- dead wanderer's notes reveal a ship direction

### 17. Soundless Signal System

Verdict: strong.

Vision fit: high.

Playtime value: medium to high.

Roast: if implemented as an audio gimmick, it risks being inaccessible and outside current deferred audio. As text/system, it works.

Recommendation:

- Use textual signal fragments, compass interference, and event timing.
- Signals can lead to landmarks, warnings, or false hope.

Examples:

- `the compass shivers`
- `the signal repeats at dusk`
- `three clicks. a pause. three clicks.`

Reward:

- new map clue, not a quest marker.

### 18. The Builder's Hidden Knowledge

Verdict: excellent.

Vision fit: very high.

Playtime value: high through slow character recontextualization.

Roast: giving the builder dialogue trees would ruin her. She should remain useful, evasive, and unsettling.

Recommendation:

- Add rare builder reactions to specific discoveries.
- Keep lines short.
- Let her actions imply knowledge before her words do.

Examples:

- She recognizes alien alloy too quickly.
- She refuses to touch something from a medical wing.
- She changes the fire after certain events.
- She hides or uses a device when the player returns.

Bad version:

- builder backstory monologue
- affection system
- companion quest

### 19. Resource Substitution Under Scarcity

Verdict: good.

Vision fit: medium to high.

Playtime value: medium, because it deepens crafting decisions.

Roast: substitution can become a crafting table mess. Use it only where scarcity creates a memorable compromise.

Examples:

- burn furniture for wood, permanently losing hut capacity or comfort
- use cloth instead of leather for weak repairs
- use teeth/bone where iron is lacking, with worse durability
- use alien alloy for a crude fix, wasting a precious late-game resource

Recommendation:

- Substitutions should be worse, costly, or morally ugly.
- The UI should not show every substitute recipe up front.

### 20. Equipment Wear For Special Gear Only

Verdict: cautious.

Vision fit: medium.

Playtime value: medium.

Roast: durability systems are usually chores. Do not put durability on every sword. That is not depth; it is friction pretending to be design.

Recommendation:

- Apply wear only to powerful, unusual, or improvised gear.
- Use condition states, not exact durability numbers.

Good:

- `sealed mask cracked`
- `static rod spent`
- `plated coat bent`

Bad:

- `iron sword durability 73/100`

### 21. Dangerous Knowledge

Verdict: excellent.

Vision fit: very high.

Playtime value: high, because it makes codex expansion matter.

Roast: a codex that only helps is safe and boring. Some knowledge should invite worse choices.

Recommendation:

- Some codex facts unlock actions that are useful but dangerous.
- Knowledge can make the player complicit.

Examples:

- learning how to make stronger traps increases meat but worsens beast attacks
- learning old military signals can redirect patrols toward others
- learning wanderer tech improves gear but changes ending text
- learning plague handling enables brutal village actions

### 22. "Leave It Alone" As A Real Option

Verdict: excellent.

Vision fit: very high.

Playtime value: medium, but strong for replayability.

Roast: games often pretend choices matter while every button is just a different reward. Sometimes the right ADR choice is not touching the thing.

Recommendation:

- Add scenes where taking loot creates later consequences.
- Make restraint visible only much later.

Examples:

- take medicine from a house, later find dead occupants
- strip a battlefield, later scavengers attack more often
- activate a machine, later signals draw danger
- spare a hostile group, later they leave supplies without meeting the player

### 23. Regional Scarcity Variation

Verdict: strong.

Vision fit: high.

Playtime value: high across repeat play or second regions.

Roast: randomizing everything would hurt authored pacing. But controlled scarcity variants can make expeditions feel less solved.

Recommendation:

- Use curated world conditions per expansion run or region.
- Do not randomize the opening.

Examples:

- dry world: water harder, roots more valuable
- overgrown world: food easier, beasts worse
- ash world: visibility worse, alien material more common
- occupied world: soldiers more common, roads safer but morally loaded

Use case:

- optional post-completion mode or expansion region, not strict original.

### 24. Outpost Choices

Verdict: strong.

Vision fit: high.

Playtime value: medium to high.

Roast: outposts are currently mostly relief. Expansion can make relief more interesting without removing their role.

Recommendation:

- Some outposts can be repaired, abandoned, trapped, or occupied.
- Keep them rare and valuable.

Choices:

- refill and leave
- stock it for later
- fortify it, costing material
- shelter strangers there, changing future encounters
- strip it, gaining supplies but losing safety

Rule:

- Never make every outpost a menu of chores.

### 25. Long-Distance Signals And Compass Lies

Verdict: excellent.

Vision fit: high.

Playtime value: high, because it creates mystery navigation.

Roast: the compass pointing directly to the next content blob is too clean. Let the expansion make navigation uncertain again.

Recommendation:

- Add interference zones where compass direction becomes unreliable.
- Let certain signals pull the compass away from the ship.
- Require the player to compare signs, landmarks, and codex notes.

Examples:

- near the crater, compass points inward
- near battleship debris, compass shakes
- in storms, compass direction lags
- after finding a beacon, compass alternates between home and signal

### 26. Ethical Production Upgrades

Verdict: strong.

Vision fit: very high.

Playtime value: high, because it extends village optimization with discomfort.

Roast: pure production upgrades are boring. The original's economy is strongest when efficiency starts to feel suspect.

Possible upgrades:

- ration office: lowers food use, lowers arrival rate
- guard post: lowers theft, increases violent events
- infirmary: lowers plague death, consumes medicine
- work bell: increases production, increases sickness/unrest
- burial ground: reduces disease, consumes labor
- prison hut: stops thieves, changes builder/village text

Recommendation:

- Never label them as good/evil.
- Let the player infer the cost.

### 27. Expedition Companions As Disposable Roles, Not Party Members

Verdict: risky but strong if bleak.

Vision fit: medium to high.

Playtime value: high if rare.

Roast: companion characters with banter would be poison. But nameless helpers who carry, scout, or die can fit the village economy's moral pressure.

Recommendation:

- Add optional expedition roles after the village is large.
- They are not named party members.
- Losing them affects population and events.

Roles:

- porter: more carry capacity, consumes food/water
- guide: lower lost/storm risk, can flee
- guard: helps first ambush, can die
- medic: uses medicine automatically, consumes supplies

Moral consequence:

- The village notices losses.
- The builder may comment once, coldly.

### 28. Rumor System

Verdict: strong.

Vision fit: high.

Playtime value: medium to high.

Roast: rumors must not become a quest board. A board full of tasks would be a modern UI infection.

Recommendation:

- Rumors arrive as short notifications from villagers, scouts, traders, or refugees.
- They are unreliable.
- They hint at world changes or rare landmarks.

Examples:

- `someone saw lights past the old road`
- `the hunters won't go east`
- `a child hums a tune no one taught her`
- `the scout marks a place, then scratches it out`

### 29. Locked Knowledge Doors

Verdict: good.

Vision fit: high.

Playtime value: medium to high.

Roast: keycards and colored locks are too literal. Better: some actions only make sense once the player has learned enough.

Recommendation:

- Unlock actions through codex facts, items, and prior events.
- Do not announce requirements as checklists.

Examples:

- `read the marks` appears after finding two matching symbols.
- `cut the power` appears after seeing the machine pattern elsewhere.
- `boil the black water` appears after sickness and fire knowledge.
- `answer the signal` appears after collecting fragments.

### 30. Alternative Ship Preparation Paths

Verdict: strong.

Vision fit: high.

Playtime value: high, because it extends late-game planning without changing the ending too early.

Roast: do not add ten ship stats. The ship should remain mysterious and functional, not become a garage simulator.

Recommendation:

- Add optional preparation paths that change escape difficulty or ending texture.
- Keep hull/thrusters recognizable.

Options:

- reinforce hull through old military plating
- improve navigation through signal tower chain
- install strange beacon from battleship
- lighten ship by leaving supplies/people behind
- overfuel engines with unstable cells

Consequences:

- easier escape but harsher ending text
- safer launch but more village cost
- alternate epilogue line, not a clean "best ending"

### 31. Failed Expedition Recovery

Verdict: excellent.

Vision fit: very high.

Playtime value: high, because death becomes more narratively loaded.

Roast: death currently has strong consequence, but expansion can make near-failure and recovery more memorable. Do not soften death into a checkpoint.

Recommendation:

- After death or collapse, sometimes a recovery event occurs.
- The village may retrieve part of the outfit at a cost.
- A later landmark may contain the lost pack or body traces.

Rules:

- Never guarantee recovery.
- Recovery should cost time, population, supplies, or future risk.
- It should make death heavier, not lighter.

### 32. World Wounds

Verdict: excellent.

Vision fit: very high.

Playtime value: high, because player actions alter the map.

Roast: a static map full of consumed points can feel like a checklist. Let the world scar.

Examples:

- cleared mines draw roads and later raids
- overhunted forest becomes quieter and trap yields fall
- burned village tile becomes a warning landmark
- activated machines create interference zones
- stripped battlefields attract desperate people

Recommendation:

- Use visible but subtle tile state changes.
- Make consequences delayed.
- Do not explain the full causal chain.

### 33. Silent Achievements As World Changes

Verdict: good if invisible.

Vision fit: medium to high.

Playtime value: medium for completionist players.

Roast: visible achievements would be tonal junk. But world acknowledgements can serve the same replay function.

Recommendation:

- No achievement popup.
- Let rare accomplishments alter titles, codex entries, or ending lines.

Examples:

- seeing every map tile creates one quiet codex line
- returning without killing in a region changes a later encounter
- saving many villagers changes final village description
- never using alien tech changes ship/fabricator text

### 34. Expansion Endings Based On What Was Learned, Not Points

Verdict: excellent.

Vision fit: very high.

Playtime value: high for replayability.

Roast: multiple endings can become checklist bait. Avoid "good/bad/true ending" labels.

Recommendation:

- Ending variations should be subtle, text-driven, and based on discovered facts/actions.
- Never show a completion meter.

Possible ending axes:

- how much the player learned about wanderers
- what happened to the village
- whether the player used the fabricator heavily
- whether the player followed signal chains
- whether the player sacrificed safety for others

### 35. Modest Procedural Event Pools

Verdict: cautious.

Vision fit: medium if curated.

Playtime value: high for longevity.

Roast: procedural content is often just bland remixing. ADR needs authored implication. Random sentence soup would be embarrassing.

Recommendation:

- Use procedural assembly only inside strict templates.
- Keep event text authored.
- Randomize order, location, and small outcomes, not core meaning.

Good procedural use:

- which old house variant appears
- which rumor points toward which discovered region
- which weather pattern dominates this run
- which rare named encounter appears

Bad procedural use:

- generated lore paragraphs
- randomized enemy mod stacks
- infinite generic dungeons

### 36. Themed Expansion Packs

Verdict: excellent production strategy.

Vision fit: high if each pack has one thesis.

Playtime value: very high over time.

Roast: one giant expansion with every system will collapse under its own appetite. Smaller packs preserve tone and allow validation.

Recommended packs:

- `Ashfall`: weather, ash storms, sealed masks, glassed crater
- `Old Roads`: route building, partial maps, caravans, outposts
- `Black Orchard`: foraging, sickness, food memory, village disease
- `Signals`: radio tower, compass lies, signal chains, alternate ship prep
- `Afterburn`: post-ending echoes, prestige memory, destroyed villages
- `Deep Wards`: hospital/medical wing expansion, infection, ethical production

Rule:

- Each pack should add one pressure system, one content family, and one narrative question.

## Playtime-Lengthening Strategy

Recommended structure:

1. First post-parity expansion should be small: codex, optional info, earned map symbols, a few returning landmarks.
2. Second expansion should deepen world travel: weather, route pressure, camps, partial maps.
3. Third expansion should deepen village consequences: disease, roles, ethical production.
4. Fourth expansion should add late-game/ending material: signals, compass interference, ship preparation, subtle ending variations.
5. Only after those should a second-region map be considered.

Do not start with the second region. That is the tempting mistake. A second map is expensive and can still feel empty if the existing world has not been made deeper first.

Best playtime-per-complexity ideas:

- returning landmarks
- go-deeper choices
- partial maps
- codex-gated actions
- weather/exposure
- village roles with moral pressure
- rare named encounters
- route caches/camps
- subtle ending variations

Worst playtime-per-complexity ideas:

- full leveling
- full rarity system
- huge second map first
- durability on everything
- freeform base building
- tactical body targeting
- generic procedural dungeons

## Recommended Priority

### Tier 1: Do First

These fit the author's vision and are relatively safe:

1. Codex of learned facts.
2. Optional, non-interruptive event info for low-stakes events.
3. Restrained map symbols and color.
4. Earned-only perk visibility improvements.
5. New sparse landmarks and sidequest chains.
6. Returning landmark states.
7. Go-deeper landmark choices.
8. Partial maps and codex-gated actions.
9. Rare named encounters.

### Tier 2: Do Carefully

These can work but need strong limits:

1. Food variety and foraging memory.
2. Status effects.
3. Damage/resistance tags.
4. Abstract village visualization.
5. Click-to-move pathfinding.
6. Situational armor/gear.
7. Weather and exposure.
8. Camps and route caches.
9. Village disease and moral production roles.
10. Hidden faction pressure.
11. Alternative ship preparation.
12. Subtle ending variations.

### Tier 3: Rework Before Considering

These are not ready in their proposed form:

1. Magic.
2. Enemy rarity tiers.
3. Player/enemy leveling.
4. Body-part targeting.
5. Real enemy images.
6. Icon-only resources.
7. Huge second-region map as the first expansion.
8. Full durability system.
9. Generic procedural dungeons.
10. Visible reputation meters.

## Post-Parity Implementation Boundaries

Do not implement expansion content until parity is complete.

When expansion work begins:

- Keep strict original mode untouched.
- Put new content under an expansion namespace/root.
- Do not mutate source-derived original content in place.
- Gate expansion mode explicitly.
- Add tests proving original fresh start remains clean.
- Add tests proving original resource, map, combat, and event data remain unchanged in strict mode.
- Document every intentional deviation.
- Avoid showing future expansion systems on a new save.

Suggested expansion architecture:

- `expansionContentRegistry`
- `expansionFeatureFlags`
- `codexFactRegistry`
- `expandedEncounterModifiers` only for curated encounters, not random tier rolls
- `expandedWorldLandmarks`
- `expandedStatusEffects`
- `expandedFoodRules`

## Final Roast

The list has a real expansion hiding inside it, but it is buried under standard RPG instincts.

The good expansion is:

- more places
- more consequences
- more learned knowledge
- more quiet dread
- better readability
- less interruption
- systems that appear because the player earned them

The bad expansion is:

- magic schools
- enemy tiers
- XP levels
- crit-click body parts
- icon soup
- monster pictures
- visible stat tables everywhere

The remake should not ask, "What features can we add?"

It should ask, "What can the player learn the hard way, and how should the interface remember it?"
