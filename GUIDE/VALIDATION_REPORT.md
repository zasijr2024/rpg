# ADR Guide Validation Report

Validation date: 2026-07-06

Source checked:
- Repository: https://github.com/doublespeakgames/adarkroom
- Local source folder: `F:\ADR20\ORIGINAL`
- Latest upstream branch: `main`
- Latest source commit: `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7` (`Update world.js (#739)`, 2025-05-23)
- Guide commit checked: `ab3c0bdb78ce23818103ecab42a803616702ea0c` (`Add comprehensive developer documentation`, 2026-01-18)
- Guide commit parent: `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`

## Verdict

The guide is up to date by ancestry: it was authored directly on top of the current latest upstream `main` commit.

The guide is not fully valid as implementation documentation. It contains useful high-level orientation, but several examples would fail or mislead a developer if followed literally. The most serious issues are in the resource/craftable example, fishing UI example, worker example, perk example, landmark example, custom module example, and prestige example.

## Saved Guide Files

- `BUILDING_GUIDE.md`
- `DEVELOPER_INDEX.md`

Both files were extracted exactly from commit `ab3c0bdb78ce23818103ecab42a803616702ea0c`.

## What Is Valid

- The repository has no build step for normal play. Opening `index.html` or using the simple dev server is consistent with the source.
- Core modules listed by the guide exist: `engine.js`, `state_manager.js`, `events.js`, `room.js`, `outside.js`, `path.js`, `world.js`, `ship.js`, `space.js`, `fabricator.js`, `prestige.js`, and event files.
- Core APIs named by the guide exist: `Engine.init`, `Engine.travelTo`, `Engine.saveGame`, `Engine.loadGame`, `$SM.set`, `$SM.get`, `$SM.add`, `$SM.setM`, `$SM.addM`, `Button.Button`, `Notifications.notify`, `Header.addLocation`.
- General event structure is mostly accurate: event objects use `title`, `isAvailable`, `scenes`, scene `text`, `notification`, `buttons`, button `cost`, `reward`, `onChoose`, and `nextScene`.
- Combat encounter structure is broadly accurate: combat scenes use `combat`, `enemy`, `enemyName`, `deathMessage`, `chara`, `damage`, `hit`, `attackDelay`, `health`, and `loot`.
- `localStorage.gameState` is the current save location.

## Blocking Issues

### 1. Resource setup is incorrect

The guide tells developers to add resources to a `stores` object in `state_manager.js`. Current `state_manager.js` does not define a static resources object. It only creates top-level categories such as `features`, `stores`, `character`, `income`, `game`, and others.

Current behavior: new resources can be introduced by using `$SM.set`, `$SM.add`, or `$SM.setM` under `stores`.

Impact: the guide points users to a non-existent edit location.

### 2. The `rope` craftable example would be disabled immediately

The guide sets:

```javascript
maximum: 0
```

for `rope`. Current room code computes max state as:

```javascript
var max = $SM.num(k, craftable) + 1 > craftable.maximum;
```

With `maximum: 0`, a player with 0 rope already has `0 + 1 > 0`, so the button is disabled from the start.

Impact: Example 1 does not work as written. For an unlimited tool, omit `maximum`; for a capped craftable, set a positive cap.

### 3. Fishing button container does not exist

The guide appends the fishing button to:

```javascript
appendTo('#outsideButtons')
```

Current `outside.js` appends buttons directly to `div#outsidePanel`. There is no `#outsideButtons` container.

Impact: the button would not appear.

### 4. `stateUpdate` callback shape is wrong

The guide uses:

```javascript
$.Dispatch('stateUpdate').subscribe(function(category) {
  if(category === 'features.fishing') {
```

Current state updates publish an event object:

```javascript
{ category: category, stateName: stateName }
```

Existing modules consume it as `e.category` and `e.stateName`.

Impact: guide callbacks that compare the first argument to a string will not fire correctly.

### 5. Worker example references a missing API

The guide uses:

```javascript
click: Outside.addWorker
```

There is no `Outside.addWorker` in current `outside.js`. Worker assignment is handled by `increaseWorker`, `decreaseWorker`, `makeWorkerRow`, `updateWorkersView`, and `checkWorker`.

Impact: Example 3 fails if copied. A new worker should be added to `Outside._INCOME`, initialized under `game.workers`, and wired through `Outside.checkWorker()` or equivalent UI logic.

### 6. New perk example misses `Engine.Perks`

The guide says perks are automatically displayed from `$SM.get('character.perks')`, so no display changes are needed.

Current `Path.updatePerks()` reads:

```javascript
Engine.Perks[k].desc
```

A new `angler` perk must be added to `Engine.Perks` with at least `name`, `desc`, and usually `notify`. Otherwise the perk display can throw when `Engine.Perks.angler` is undefined.

Impact: Example 4 is incomplete and can break the Path perk UI.

### 7. Landmark example uses the wrong data shape

The guide presents:

```javascript
World.LANDMARKS = [
  {
    scene: 'fishingVillage',
    tile: 'V'
  }
]
```

Current `world.js` uses a tile-keyed object populated inside `World.init()`:

```javascript
World.LANDMARKS[World.TILE.CAVE] = { ... };
```

Map generation iterates `for (var k in World.LANDMARKS)` and uses `k` as the tile value. A `tile` property inside the landmark object is ignored.

Impact: Example 5 is structurally wrong. It should add a new `World.TILE` constant and assign `World.LANDMARKS[World.TILE.X] = { ... }`. Also, the guide's suggested tile `V` is already used by caves.

### 8. Custom module example omits required integration details

The custom `Harbor` module example creates a local `panel` variable but does not assign `Harbor.panel`. `Engine.travelTo(module)` requires `module.panel` before it calls `module.onArrival()`.

The example also uses `#locationSlider .headerButton` in `setTitle()`, but header buttons live under `div#header`, not inside `#locationSlider`.

Impact: Example 7 is not a reliable module template.

### 9. Prestige example targets the wrong function

The guide says to modify `Prestige.get()` to add retained rope. Current prestige retained stores are produced by `Prestige.getStores(true)` using `Prestige.storesMap`. `Prestige.get()` only returns already saved `previous.stores` and `previous.score`.

Impact: Example 8 would not add rope to newly generated prestige rewards. The correct extension point is `Prestige.storesMap` and, if needed, the save/collect mapping logic.

## Stale Or Incorrect Reference Data

The guide contains many hard-coded line counts and ranges that are stale against current source:

- `engine.js`: guide says 943 lines; current is 834.
- `state_manager.js`: guide says 440 lines; current is 392.
- `events.js`: guide says 1,488 lines; current is 1,349.
- `Button.js`: guide says 132 lines; current is 120.
- `room.js`: guide says 1,259 lines; current is 1,182.
- `outside.js`: guide says 665 lines; current is 660.
- `path.js`: guide says 341 lines; current is 331.
- `world.js`: guide says 1,109 lines; current is 1,014.
- `space.js`: guide says 631 lines; current is 617.
- `fabricator.js`: guide says `1-400+`; current is 223.
- `events/executioner.js`: guide says 2,343 lines; current is 2,318.
- `world.js:1600-1800` for weapons is impossible because current `world.js` has 1,014 lines. `World.Weapons` is currently near the top of the file.

These do not all break the concepts, but they make the guide unreliable as a reference.

## Lower-Severity Issues

- The developer index says the state structure includes a literal `State = { version: 1.3, ... }`. Current `State` is created at runtime by `Engine.loadGame()` or reset logic, then categories are created by `$SM.init()`.
- The developer index says "Auto-Save: Every state change persists to localStorage". This is mostly true for normal `$SM.set`, `$SM.add`, `$SM.setM`, and `$SM.addM` calls, but those APIs also accept `noEvent` and some code paths save separately.
- The guide's "unlock all locations" debug command sets `features.location.spaceShip` directly. On a fresh runtime, this alone does not initialize `game.spaceShip`; `Ship.init()` normally sets hull/thrusters.
- The custom module example adds only a script tag. A complete module normally also needs CSS if it has custom layout, a persistent panel assigned to the module, tab navigation considerations, initialization from saved state in `Engine.init()`, and possibly keyboard/arrival behavior.

## Recommended Fixes Before Use

1. Remove hard-coded line numbers or regenerate them from the current source.
2. Rewrite resource guidance to explain dynamic `stores` state instead of editing `state_manager.js`.
3. Fix craftable examples to follow current `Room.Craftables` semantics, especially `maximum`.
4. Change all `stateUpdate` examples to accept `e` and inspect `e.category` / `e.stateName`.
5. Replace the worker example with the actual `Outside._INCOME` plus `checkWorker()` pattern.
6. Add `Engine.Perks` registration to the perk example.
7. Rewrite the landmark example around `World.TILE` and `World.LANDMARKS[tile]`.
8. Rewrite the module example to set `Harbor.panel`, call `Engine.updateSlider()`, and add reload initialization.
9. Rewrite prestige guidance around `Prestige.storesMap`.

## Final Assessment

Use the guide only as a rough orientation document in its current form. It is current relative to upstream `main`, but it is not accurate enough to serve as a step-by-step implementation guide without corrections.
