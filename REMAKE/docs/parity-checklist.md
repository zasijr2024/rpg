# Parity Checklist

Last updated: 2026-07-06

Purpose: implementation tracker for gameplay/UI parity excluding deferred systems. This checklist is intentionally explicit so "exact same game data" is verifiable instead of aspirational.

Authorities:

- source baseline: `REMAKE/docs/source-baseline.md`
- machine manifest: `DATA/canonical-manifest.json`
- extracted source index: `DATA/00-extraction-index.md`
- original source: `ORIGINAL/`

Status legend:

- `[ ]` not started
- `[~]` in progress
- `[x]` complete
- `[!]` blocked or intentionally deviated; must link to `REMAKE/docs/deviations.md`

## Project Gates

- [ ] Git repository initialized.
- [ ] Baseline source/reference commit created.
- [ ] Planning/docs hardening commit created.
- [ ] `DATA/canonical-manifest.json` generated from `ORIGINAL/`.
- [ ] Source baseline pinned in `REMAKE/docs/source-baseline.md`.
- [ ] License/attribution plan accepted.
- [ ] Deferred scope accepted.
- [ ] Phase 0.5 risk spike completed before gameplay implementation.

## Source Data Coverage

- [ ] Core engine constants represented.
- [ ] State categories represented.
- [ ] State migration behavior reviewed.
- [ ] Scoring formula represented.
- [ ] Prestige store map represented.
- [ ] Room constants represented.
- [ ] Room fire states represented.
- [ ] Room craftables represented.
- [ ] Room trade goods represented.
- [ ] Outside constants represented.
- [ ] Worker income definitions represented.
- [ ] Trap drop table represented.
- [ ] Path constants represented.
- [ ] Item weight overrides represented.
- [ ] World constants represented.
- [ ] World tile constants represented.
- [ ] Terrain probabilities represented.
- [ ] Landmark definitions represented.
- [ ] Weapon definitions represented.
- [ ] Ship constants represented.
- [ ] Space constants represented.
- [ ] Fabricator craftables represented.
- [ ] Perk definitions represented.
- [ ] Audio manifest stored as deferred data.
- [ ] Localization files stored as deferred data.

## Room Parity

- [ ] Fresh start shows only original starting information.
- [ ] Future tabs are not visible at start.
- [ ] Fire can be lit.
- [ ] Fire can be stoked.
- [ ] Fire cooldown matches original.
- [ ] Fire state/title progression matches original.
- [ ] Room temperature timing matches original.
- [ ] Builder arrival timing matches original.
- [ ] Need-wood timing matches original.
- [ ] Gather wood behavior matches original.
- [ ] Stores panel appears at original trigger point.
- [ ] Build/craft/buy sections unlock at original trigger points.
- [ ] Every room craftable has matching key, name, type, max, messages, cost function, and side effect.
- [ ] Every trade good has matching cost and behavior.
- [ ] Original disabled/max behavior is preserved.
- [ ] Original room notifications are preserved.

## Outside and Village Parity

- [ ] Outside unlock condition matches original.
- [ ] Outside tab/title progression matches original.
- [ ] Gather cooldown matches original.
- [ ] Trap checking cooldown matches original.
- [ ] Trap drop probabilities match original.
- [ ] Population growth timing matches original.
- [ ] Hut capacity behavior matches original.
- [ ] Worker assignment controls match original behavior.
- [ ] Every worker has matching name, delay, production, and consumption.
- [ ] Income collection timing matches original.
- [ ] Worker unlocks from buildings/mines match original.
- [ ] Village title thresholds match original.
- [ ] Hut destruction and villager death event side effects match original.

## Event Runtime Parity

- [ ] Event pool composition matches original.
- [ ] Event scheduling range and delay behavior matches original.
- [ ] Event availability checks match original.
- [ ] Scene text rendering preserves original text.
- [ ] Scene notification behavior matches original.
- [ ] Button cost validation matches original.
- [ ] Button reward handling matches original.
- [ ] `onChoose` behavior matches original.
- [ ] Chance-based scene branching matches original semantics.
- [ ] Delayed scene choices match original.
- [ ] Leave/end behavior matches original.
- [ ] Event pause/attention behavior reviewed; deviations logged if modernized.

## Event Content Coverage

- [ ] Global events represented.
- [ ] Room events represented.
- [ ] Outside events represented.
- [ ] Marketing event represented.
- [ ] Encounter events represented.
- [ ] Setpiece events represented.
- [ ] Executioner events represented.
- [ ] All event titles from `DATA/canonical-manifest.json` represented.
- [ ] All event scene keys from generated manifests represented.

## Combat Parity

- [ ] Player health formula matches original.
- [ ] Armour health bonuses match original.
- [ ] Hit chance formula matches original.
- [ ] Enemy attack timing matches original.
- [ ] Weapon cooldowns match original.
- [ ] Weapon costs match original.
- [ ] Weapon damage and special damage values match original.
- [ ] Stun behavior matches original.
- [ ] Healing item effects match original.
- [ ] Loot table rolls match original.
- [ ] Player death behavior matches original.
- [ ] Combat victory flow matches original.
- [ ] Executioner combat specials match original or deviations are logged.

## Path and Outfitting Parity

- [ ] Path unlock condition matches original.
- [ ] Compass behavior matches original.
- [ ] Bag base capacity matches original.
- [ ] Capacity upgrades match original.
- [ ] Weight overrides match original.
- [ ] Default item weight behavior matches original.
- [ ] Outfit add/remove behavior matches original.
- [ ] Free space calculation matches original.
- [ ] Perk display uses original perk data.
- [ ] Embark transfers state correctly.
- [ ] Returning from world restores outfit/stores correctly.

## World Parity

- [ ] World map dimensions match original.
- [ ] Village position matches original.
- [ ] Terrain generation matches original probabilities and stickiness.
- [ ] Landmark placement respects original counts and radii.
- [ ] Roads are generated as original.
- [ ] Visibility mask/light radius matches original.
- [ ] Movement keys match original.
- [ ] Food consumption per movement matches original.
- [ ] Water consumption per movement matches original.
- [ ] Starvation behavior matches original.
- [ ] Thirst behavior matches original.
- [ ] Fight chance and fight delay match original.
- [ ] Landmark entry behavior matches original.
- [ ] Outpost use behavior matches original.
- [ ] Mine clearing unlocks original worker/building outcomes.
- [ ] Ship discovery unlocks ship as original.
- [ ] Fabricator/executioner discovery unlocks as original latest web content.

## Ship, Fabricator, Space, Ending Parity

- [ ] Ship unlock matches original.
- [ ] Hull reinforcement cost matches original.
- [ ] Engine upgrade cost matches original.
- [ ] Lift-off gating matches original.
- [ ] Fabricator unlock matches original.
- [ ] Every fabricator craftable has matching cost, type, quantity, blueprint gate, and message.
- [ ] Blueprint redemption matches original.
- [ ] Space ship movement speed formula matches original.
- [ ] Asteroid spawn timing matches original.
- [ ] Asteroid speed/randomness matches original.
- [ ] Collision/hull loss matches original.
- [ ] Altitude progression and title changes match original.
- [ ] Crash behavior matches original.
- [ ] Escape threshold and win flow match original.
- [ ] Score calculation matches original.
- [ ] Prestige collection behavior matches original.

## Discovery Parity Tests

These tests protect the original reveal curve.

- [ ] Start: no outside/path/world/ship/fabricator/space UI visible.
- [ ] Before wood: no stores panel if original does not show it.
- [ ] Before builder state: no craft/build economy visible.
- [ ] Before outside unlock: no village/worker UI visible.
- [ ] Before compass/path unlock: no outfitting or world map visible.
- [ ] Before embark: no world map visible.
- [ ] Before ship discovery: no ship UI visible.
- [ ] Before executioner/fabricator discovery: no fabricator UI visible.
- [ ] Before lift-off: no space UI visible.
- [ ] No tutorial text reveals hidden systems early.
- [ ] No layout affordance hints at future tabs before original unlocks.

## UI and 4K Parity

- [ ] First screen matches minimalist intent.
- [ ] Room state readable at 1366x768, 1920x1080, 2560x1440, 3840x2160.
- [ ] Outside worker table readable at all target resolutions.
- [ ] Path outfitting readable at all target resolutions.
- [ ] World map grid stable at all target resolutions.
- [ ] Event panel line length controlled.
- [ ] Combat panel does not overlap.
- [ ] Ship/fabricator controls stable.
- [ ] Space playfield correctly framed.
- [ ] Browser zoom 100%, 125%, 150%, 200% checked.

## Test Coverage Gates

- [ ] State path API tests.
- [ ] Deterministic RNG tests.
- [ ] Timer scheduler tests.
- [ ] Resource mutation tests.
- [ ] Data key parity tests.
- [ ] Data constant parity tests.
- [ ] Behavior scenario tests.
- [ ] Discovery parity tests.
- [ ] Full playthrough smoke test.
- [ ] Visual screenshots for required states/resolutions.

## Required Scenario Tests

- [ ] Trap cost after N traps.
- [ ] Hut cost after N huts.
- [ ] Worker income with positive and negative stores.
- [ ] Trap drop deterministic seed cases.
- [ ] Event reward applied exactly once.
- [ ] Event cost deducted exactly once.
- [ ] Chance branch follows deterministic RNG seed.
- [ ] Combat hit/miss deterministic seed cases.
- [ ] Loot roll deterministic seed cases.
- [ ] Death returns player to correct state.
- [ ] Death/outfit handling matches original.
- [ ] Clear iron mine unlocks iron miner outcome.
- [ ] Clear coal mine unlocks coal miner outcome.
- [ ] Clear sulphur mine unlocks sulphur miner outcome.
- [ ] Blueprint redeems into fabricator availability.
- [ ] Lift-off fails/succeeds under original hull rules.
- [ ] Space escape triggers ending/prestige behavior.


