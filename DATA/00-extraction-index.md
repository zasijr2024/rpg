# Original Game Data Extraction Index

This folder extracts the original A Dark Room web game data into separate markdown files for the remake effort described in `REMAKE/context.md`.

The source keeps much of its data as executable JavaScript object literals. These markdown files preserve the original definitions, including callback functions, so formulas, unlock conditions, side effects, and narrative scene flow are not lost during extraction.

Generated on 2026-07-06 from local source folder `ORIGINAL`.

## Files

- [01-core-engine-state.md](01-core-engine-state.md): Core Engine, State, Scoring, Prestige Data
- [02-room-data.md](02-room-data.md): Room Data
- [03-outside-data.md](03-outside-data.md): Outside and Village Data
- [04-path-data.md](04-path-data.md): Path and Outfitting Data
- [05-world-data.md](05-world-data.md): World Map, Exploration, and Combat Data
- [06-ship-space-fabricator-data.md](06-ship-space-fabricator-data.md): Ship, Space, and Fabricator Data
- [07-event-system-data.md](07-event-system-data.md): Event System Runtime Data
- [08-events-global-room-outside-marketing.md](08-events-global-room-outside-marketing.md): Global, Room, Outside, and Marketing Event Data
- [09-events-encounters.md](09-events-encounters.md): Combat Encounter Data
- [10-events-setpieces.md](10-events-setpieces.md): World Setpiece Event Data
- [11-events-executioner.md](11-events-executioner.md): Executioner Event Data
- [12-audio-data.md](12-audio-data.md): Audio Data
- [13-original-docs.md](13-original-docs.md): Original Documentation Data
- [14-assets-inventory.md](14-assets-inventory.md): Asset Inventory
- [15-localization-data.md](15-localization-data.md): Localization Data Index
- [16-entry-ui-support-data.md](16-entry-ui-support-data.md): Entry, UI, and Support Data
- [17-style-data.md](17-style-data.md): Style Data
- [18-canonical-catalogs.md](18-canonical-catalogs.md): Canonical Names and Content Catalogs
- [locales/](locales/): per-locale localization extracts

## Original Source Coverage

Primary gameplay, content, support, style, asset, and localization data sources covered:

- `ORIGINAL/index.html` (119 lines)
- `ORIGINAL/browserWarning.html` (43 lines)
- `ORIGINAL/mobileWarning.html` (57 lines)
- `ORIGINAL/package.json` (16 lines)
- `ORIGINAL/README.md` (42 lines)
- `ORIGINAL/script/engine.js` (834 lines)
- `ORIGINAL/script/state_manager.js` (392 lines)
- `ORIGINAL/script/scoring.js` (28 lines)
- `ORIGINAL/script/prestige.js` (99 lines)
- `ORIGINAL/script/room.js` (1182 lines)
- `ORIGINAL/script/outside.js` (660 lines)
- `ORIGINAL/script/path.js` (331 lines)
- `ORIGINAL/script/world.js` (1014 lines)
- `ORIGINAL/script/ship.js` (176 lines)
- `ORIGINAL/script/space.js` (617 lines)
- `ORIGINAL/script/fabricator.js` (223 lines)
- `ORIGINAL/script/events.js` (1349 lines)
- `ORIGINAL/script/events/global.js` (67 lines)
- `ORIGINAL/script/events/room.js` (682 lines)
- `ORIGINAL/script/events/outside.js` (292 lines)
- `ORIGINAL/script/events/marketing.js` (34 lines)
- `ORIGINAL/script/events/encounters.js` (437 lines)
- `ORIGINAL/script/events/setpieces.js` (3585 lines)
- `ORIGINAL/script/events/executioner.js` (2318 lines)
- `ORIGINAL/script/audioLibrary.js` (91 lines)
- `ORIGINAL/script/audio.js` (268 lines)
- `ORIGINAL/script/Button.js` (120 lines)
- `ORIGINAL/script/header.js` (34 lines)
- `ORIGINAL/script/notifications.js` (78 lines)
- `ORIGINAL/script/localization.js` (68 lines)
- `ORIGINAL/script/dropbox.js` (312 lines)
- `ORIGINAL/css/main.css` (546 lines)
- `ORIGINAL/css/dark.css` (152 lines)
- `ORIGINAL/css/room.css` (52 lines)
- `ORIGINAL/css/outside.css` (52 lines)
- `ORIGINAL/css/path.css` (59 lines)
- `ORIGINAL/css/world.css` (66 lines)
- `ORIGINAL/css/ship.css` (7 lines)
- `ORIGINAL/css/space.css` (154 lines)
- `ORIGINAL/css/fabricator.css` (31 lines)
- `ORIGINAL/doc/Zones.txt` (5 lines)
- `ORIGINAL/doc/translation.txt` (94 lines)
- `ORIGINAL/lang/langs.js` (28 lines)
- `ORIGINAL/lang/adarkroom.pot` (2582 lines)
- `ORIGINAL/lang/babel.cfg` (2 lines)
- `ORIGINAL/lang/main.css` (3 lines)

Binary/non-text assets are covered by `14-assets-inventory.md` rather than embedded directly.

## Notes

- Event data is split by event file because the scene trees are large and internally cross-reference scene keys.
- Localization is split per locale to avoid mixing translated strings with canonical English gameplay data.
- Asset files are inventoried by path and size; binary audio/image payloads are not embedded in markdown.

