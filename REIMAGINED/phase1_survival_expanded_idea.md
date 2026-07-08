# Reimagined Phase 1: Survival

## Purpose

Phase 1 should make the player survive before they understand the world.

This is not a tutorial chapter. It is an alternate opening contract for a reimagined version of *A Dark Room*: the player wakes in a condition, not in a menu. The first minutes should feel small, bodily, and uncertain. Hunger, thirst, darkness, cold, and fear are the first systems. The player learns by touching them, failing around their edges, and noticing what changes.

The design must preserve the original author's apparent vision:

- start with almost nothing
- let the player act before they understand
- reveal systems only after the player has created a need for them
- keep prose sparse and environmental
- make mechanics carry narrative meaning
- avoid tutorials, lore dumps, visible tech trees, and early genre promises

## Opening

The player begins in darkness.

Suggested title progression:

- `A Dark Cave`
- `A Cave Mouth`
- `A Low Camp`
- `A Smoking Camp`
- `A Sheltered Camp`

The opening should not say "you have amnesia" outright. That is too explicit and too familiar. Use absence instead.

Opening text examples:

- `the darkness is close`
- `stone presses cold against skin`
- `the mouth is somewhere ahead`
- `the stomach knots`
- `the tongue sticks`

Initial visible state should be minimal:

- one location
- one action
- no inventory until the first item exists
- no hunger/thirst bars until they become urgent enough to be noticed
- no map
- no camp panel
- no combat panel
- no objective text

Initial action:

- `feel around`

Possible first outcomes:

- find a loose stone
- find dry roots
- cut skin on rock, revealing vitality only after damage exists
- hear wind from the cave mouth
- find a brittle branch near the entrance

The first action should teach the original ADR contract: act, wait, notice, infer, repeat.

## Core States

Use restrained survival state. Do not open with a dashboard.

### Vitality

Vitality is the early body state. It can later map cleanly to HP once combat formalizes.

Reveal condition:

- first injury
- sickness
- starvation damage
- combat encounter

Text examples:

- `the cut stings`
- `breath comes shallow`
- `standing takes effort`

### Hunger

Hunger should begin as prose pressure, not a visible meter.

Reveal condition:

- after the player spends several actions without food
- after eating something unsafe
- when vitality starts to drop from hunger

Text examples:

- `the stomach knots`
- `hunger sharpens`
- `the body starts taking from itself`

### Thirst

Thirst should be more urgent than hunger. This matches the original world loop, where water is the sharper expedition limiter.

Reveal condition:

- after leaving the cave/camp
- after failed water search
- when thirst begins damaging vitality

Text examples:

- `the tongue sticks`
- `the throat burns`
- `the thirst becomes unbearable`

### Memory

Do not make "memory" a collectible lore system.

Use memory only for practical recognition:

- safe berries
- poisonous berries
- clean water source
- fire-starting pattern
- shelter pattern
- animal signs

Memory should appear as capability, not exposition. The player remembers because an action becomes available, not because a narrator explains their past.

## Phase 1 Loop

The loop should be:

1. notice body need
2. search nearby
3. take a risk
4. learn a local rule
5. convert the rule into a repeatable action
6. build a fragile base
7. push farther from the base

This should feel like the original room/fire opening, but moved into direct survival:

- fire becomes warmth, safety, cooking, and signal
- cave/camp becomes the "room"
- forest becomes the first outside layer
- berries/meat/water become the first store rows
- remembered actions become build/craft/action unlocks

## Foraging

The forest should not start as a general resource node. It should start as danger with food in it.

Initial action after reaching the cave mouth:

- `go outside`

First forest title:

- `A Silent Forest`

First forest text:

- `the sky is grey`
- `branches rub together in the wind`
- `nothing moves`

Initial available forest actions:

- `search`
- later `gather berries`
- later `gather wood`
- later `set snare`
- later `check snares`

### Berries

Berries are a good Phase 1 idea if they teach observation, risk, and memory. They are a bad idea if they become a color-matching tutorial.

Do not show a full berry table. The player should build knowledge one attempt at a time.

Berry properties:

- color
- shape
- smell
- stem/leaf detail
- effect
- remembered status

Example berry types:

| Berry sign | First text | Effect | Learned action |
| --- | --- | --- | --- |
| red, bitter skin | `bitter red berries stain the fingers` | low nutrition, low vitality recovery | `gather red berries` |
| pale, waxy skin | `pale berries split under pressure` | sickness chance | no repeat action until survived twice |
| black, sweet smell | `dark berries smell almost sweet` | medium nutrition, small thirst cost | `gather dark berries` |
| blue, clustered | `blue berries cling under thorned leaves` | safe, low nutrition, thorn injury chance | `gather blue berries` |

Discovery rules:

- first encounter uses `eat` / `leave`
- eating may reveal food value, sickness, or safety
- safe result once is not full certainty
- repeated safe result unlocks a specific gather action
- sickness should not instantly kill unless the player is already weak
- the action label should stay plain: `gather berries`, or specific only after memory matters

Recommended implementation:

- store `known_foods.<id>.samples`
- store `known_foods.<id>.safeConfidence`
- unlock repeatable action after 2 non-harmful samples or one strong positive result
- keep exact percentages hidden

Notification examples:

- `the berries settle poorly`
- `the sickness passes`
- `the red ones can be eaten`
- `some are left for later`

## Camp

The camp should grow from use, not appear as a named base too early.

Camp starts as:

- cave floor
- mouth of the cave
- cold stones
- a place returned to because outside is worse

Camp unlock sequence:

1. `feel around`
2. `go outside`
3. `search`
4. find dry brush / branch / stone
5. `make spark` or `start fire`
6. `pile branches`
7. `drag brush`
8. `build shelter`

The first shelter should not be a cozy home. It is barely enough:

- `a lean shelter cuts the wind`
- `rain still finds the gaps`
- `something moved outside in the night`

Camp functions:

- safe-ish return point
- fire location
- stores display once items exist
- limited action list
- later crafting/building surface

Camp should not expose future workstations until discovered.

## Fire

Fire must remain central. This is one of the strongest connections to the original opening.

Fire states can echo original ADR:

- dead
- smoking
- flickering
- burning
- roaring

Early fire actions:

- `make spark`
- `feed fire`
- `cook meat`
- `dry berries`
- `boil water`

Fire effects:

- slows cold damage
- reduces night encounter chance
- enables cooked meat
- makes some sickness less likely
- attracts stranger/animal/scavenger events later

Fire should still require attention. It should cool over time. The player should learn that maintenance matters without being told.

## Meat, Butchering, And Cooking

Do not let "butcher and cook meat" arrive as a crafting recipe list. It should be earned through a dead animal, hunger, and discomfort.

Sources:

- trap/snare
- wounded animal event
- combat victory
- carcass found near cave

First carcass text:

- `flies rise from the hide`
- `there is meat, if the hand can do the work`

Initial options:

- `cut meat`
- `leave it`

Requirements:

- loose stone or sharp stone for crude butchering
- fire for cooking
- later knife for better yield
- later smokehouse/smoking rack for preservation

Meat states:

- raw meat
- cooked meat
- dried meat / cured meat
- spoiled meat

Rules:

- raw meat restores hunger but risks sickness
- cooked meat restores hunger/vitality and avoids most sickness
- dried/cured meat becomes expedition food
- spoiled meat can be bait

This creates a natural bridge to original ADR's `meat`, `bait`, and `cured meat`.

## Water

Water should be discovered before it becomes managed.

Sources:

- rain caught in stone
- seep in cave wall
- stream in forest
- dirty pool
- boiled water

Actions:

- `drink`
- `fill hollow`
- `boil water`
- later `make waterskin`

Rules:

- dirty water may cause sickness
- boiled water is safe
- water carrying starts extremely limited
- thirst pressure should push the player out before they feel ready

This should eventually connect to the original water expedition system: waterskin, cask, water tank, and world movement costs.

## Combat

Early combat must remain crude and frightening.

The player does not "choose a class" or get a combat tutorial. Combat appears because something finds them.

Initial enemies:

- starving dog
- small beast
- cave lizard
- scavenger
- wounded animal

Initial player attacks:

- `punch`
- later `kick` only if it has a distinct tactical purpose
- `throw stone`
- later `stab` with spear

Important alignment note:

The original combat fallback is `fists` with verb `punch`. It also has unarmed perks from repeated punching: boxer, martial artist, unarmed master. A reimagined version can add `kick`, but it should not dilute the clean original combat language unless it creates real choice.

Recommended early combat:

- `punch`: low damage, short cooldown, trains unarmed progression
- `kick`: slightly higher damage, longer cooldown, small chance to stagger, risk of miss
- `throw stone`: limited by stones, can interrupt or startle
- `flee`: always visible, not always safe

Flee outcomes:

- return to cave/camp injured
- drop carried food
- enemy follows to camp
- escape cleanly if fire is burning

Notifications:

- `the beast recoils`
- `the kick glances off bone`
- `running tears the breath away`
- `the thing stops at the firelight`

## Discovery And Unlocks

Unlocks must appear as consequences, not menu categories.

Examples:

| Trigger | Unlock |
| --- | --- |
| find branch twice | `gather wood` |
| taste safe berries twice | `gather berries` |
| suffer sickness from food/water | `boil water` / caution text |
| bring raw meat to fire | `cook meat` |
| fail to sleep in cold | `build shelter` |
| see animal tracks | `set snare` |
| catch animal | `check snares`, `cut meat` |
| repeated punching | unarmed perk text |

Avoid:

- recipe book
- survival codex
- explicit tutorial popups
- UI labels for future systems
- visible percentages
- quest log

## Minimal Resource Set

Start with only what the player has touched.

Early possible stores:

- stone
- branch
- wood
- berries
- raw meat
- cooked meat
- water
- hide
- bone
- sickness

Later bridge resources:

- fur
- meat
- bait
- cured meat
- teeth
- scales
- cloth

Do not introduce all of these in Phase 1. Phase 1 should make resources feel found, not catalogued.

## Suggested Phase 1 Beats

### Beat 1: Dark

Visible:

- title: `A Dark Cave`
- action: `feel around`

Goal:

- establish uncertainty
- reveal body pressure
- find first usable object

### Beat 2: Mouth

Visible:

- `go outside`
- maybe `feel around`

Goal:

- discover forest
- introduce hunger/thirst
- find berries or water with risk

### Beat 3: First Rule

Visible:

- `eat`
- `leave`
- maybe `drink`

Goal:

- player learns that not all survival actions are safe
- successful food/water creates memory

### Beat 4: Return

Visible:

- cave/camp grows slightly
- stores appear after first item

Goal:

- reinforce base as refuge
- create repeated route between camp and forest

### Beat 5: Fire

Visible:

- `make spark`
- `feed fire`

Goal:

- connect to original ADR heart
- fire changes safety, temperature, food, and night

### Beat 6: Shelter

Visible:

- `build shelter`

Goal:

- camp becomes an authored version of the original room
- survival becomes preparation

### Beat 7: Meat

Visible:

- `set snare`
- `check snare`
- `cut meat`
- `cook meat`

Goal:

- bridge from immediate hunger to stored expedition food
- introduce moral discomfort through utility, not speech

### Beat 8: First Stranger Or Sign

Visible:

- event, not system

Goal:

- imply the wider world
- avoid explaining who the player is
- begin transition toward settlement/exploration

## Tone Rules

Use lowercase, fragmentary, concrete language.

Good:

- `the red ones can be eaten`
- `smoke clings to the roof of the mouth`
- `the shelter holds, mostly`
- `something is watching from the trees`

Bad:

- `You have unlocked the berry gathering skill.`
- `Due to your amnesia, you cannot remember which berries are safe.`
- `Craft a shelter to increase your survival rating.`
- `Objective complete: establish camp.`

## Compatibility With Original ADR

This phase should be an optional reimagined opening, not a mutation of strict original mode.

Original-aligned anchors:

- darkness as first condition
- fire as first transformative system
- sparse text
- hidden mechanics
- gradual reveal of actions
- forest as first expansion
- traps/snares leading to meat/fur/bait
- unarmed combat with punch as fallback
- hunger/thirst leading into expedition pressure
- camp eventually becoming the functional equivalent of the room/village seed

Major intentional deviations:

- starts in a cave rather than a room
- hunger/thirst appear before the world-map expedition layer
- player discovers food safety through foraging
- shelter construction precedes builder/village economy
- early combat may appear before formal path/world unlock

These deviations are acceptable only if expansion mode is clearly separated from original parity.

