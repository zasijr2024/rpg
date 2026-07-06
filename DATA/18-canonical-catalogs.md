# Canonical Names and Content Catalogs

Source-derived quick lookup catalog. The full definitions remain in the area-specific markdown files.

## Craftables, Trade Goods, Weapons, Fabricator Items, Workers

````text
ORIGINAL\script\outside.js:14:		'gatherer': {
ORIGINAL\script\outside.js:21:		'hunter': {
ORIGINAL\script\outside.js:29:		'trapper': {
ORIGINAL\script\outside.js:37:		'tanner': {
ORIGINAL\script\outside.js:45:		'charcutier': {
ORIGINAL\script\outside.js:54:		'iron miner': {
ORIGINAL\script\outside.js:62:		'coal miner': {
ORIGINAL\script\outside.js:70:		'sulphur miner': {
ORIGINAL\script\outside.js:78:		'steelworker': {
ORIGINAL\script\outside.js:87:		'armourer': {
ORIGINAL\script\fabricator.js:8:    'energy blade': {
ORIGINAL\script\fabricator.js:16:    'fluid recycler': {
ORIGINAL\script\fabricator.js:25:    'cargo drone': {
ORIGINAL\script\fabricator.js:34:    'kinetic armour': {
ORIGINAL\script\fabricator.js:44:    'disruptor': {
ORIGINAL\script\fabricator.js:53:    'hypo': {
ORIGINAL\script\fabricator.js:63:    'stim': {
ORIGINAL\script\fabricator.js:72:    'plasma rifle': {
ORIGINAL\script\fabricator.js:81:    'glowstone': {
ORIGINAL\script\world.js:46:    'fists': {
ORIGINAL\script\world.js:52:    'bone spear': {
ORIGINAL\script\world.js:58:    'iron sword': {
ORIGINAL\script\world.js:64:    'steel sword': {
ORIGINAL\script\world.js:70:    'bayonet': {
ORIGINAL\script\world.js:76:    'rifle': {
ORIGINAL\script\world.js:83:    'laser rifle': {
ORIGINAL\script\world.js:90:    'grenade': {
ORIGINAL\script\world.js:97:    'bolas': {
ORIGINAL\script\world.js:104:    'plasma rifle': {
ORIGINAL\script\world.js:111:    'energy blade': {
ORIGINAL\script\world.js:117:    'disruptor': {
ORIGINAL\script\room.js:13:		'trap': {
ORIGINAL\script\room.js:29:		'cart': {
ORIGINAL\script\room.js:43:		'hut': {
ORIGINAL\script\room.js:59:		'lodge': {
ORIGINAL\script\room.js:75:		'trading post': {
ORIGINAL\script\room.js:90:		'tannery': {
ORIGINAL\script\room.js:105:		'smokehouse': {
ORIGINAL\script\room.js:120:		'workshop': {
ORIGINAL\script\room.js:136:		'steelworks': {
ORIGINAL\script\room.js:152:		'armoury': {
ORIGINAL\script\room.js:168:		'torch': {
ORIGINAL\script\room.js:181:		'waterskin': {
ORIGINAL\script\room.js:194:		'cask': {
ORIGINAL\script\room.js:208:		'water tank': {
ORIGINAL\script\room.js:222:		'bone spear': {
ORIGINAL\script\room.js:235:		'rucksack': {
ORIGINAL\script\room.js:248:		'wagon': {
ORIGINAL\script\room.js:262:		'convoy': {
ORIGINAL\script\room.js:277:		'l armour': {
ORIGINAL\script\room.js:290:		'i armour': {
ORIGINAL\script\room.js:303:		's armour': {
ORIGINAL\script\room.js:316:		'iron sword': {
ORIGINAL\script\room.js:330:		'steel sword': {
ORIGINAL\script\room.js:344:		'rifle': {
ORIGINAL\script\room.js:360:		'scales': {
ORIGINAL\script\room.js:367:		'teeth': {
ORIGINAL\script\room.js:374:		'iron': {
ORIGINAL\script\room.js:384:		'coal': {
ORIGINAL\script\room.js:394:		'steel': {
ORIGINAL\script\room.js:405:		'medicine': {
ORIGINAL\script\room.js:414:		'bullets': {
ORIGINAL\script\room.js:423:		'energy cell': {
ORIGINAL\script\room.js:433:		'bolas': {
ORIGINAL\script\room.js:442:		'grenade': {
ORIGINAL\script\room.js:452:		'bayonet': {
ORIGINAL\script\room.js:462:		'alien alloy': {
ORIGINAL\script\room.js:473:		'compass': {
ORIGINAL\script\room.js:488:		'laser rifle': {
````

## World Tiles, Terrain Probabilities, and Landmarks

````text
5:    VILLAGE: 'A',
6:    IRON_MINE: 'I',
7:    COAL_MINE: 'C',
8:    SULPHUR_MINE: 'S',
9:    FOREST: ';',
10:    FIELD: ',',
11:    BARRENS: '.',
12:    ROAD: '#',
13:    HOUSE: 'H',
14:    CAVE: 'V',
15:    TOWN: 'O',
16:    CITY: 'Y',
17:    OUTPOST: 'P',
18:    SHIP: 'W',
19:    BOREHOLE: 'B',
20:    BATTLEFIELD: 'F',
21:    SWAMP: 'M',
22:    CACHE: 'U',
23:    EXECUTIONER: 'X'
25:  TILE_PROBS: {},
134:    World.TILE_PROBS[World.TILE.FOREST] = 0.15;
135:    World.TILE_PROBS[World.TILE.FIELD] = 0.35;
136:    World.TILE_PROBS[World.TILE.BARRENS] = 0.5;
139:    World.LANDMARKS[World.TILE.OUTPOST] = { num: 0, minRadius: 0, maxRadius: 0, scene: 'outpost', label: _('An&nbsp;Outpost') };
140:    World.LANDMARKS[World.TILE.IRON_MINE] = { num: 1, minRadius: 5, maxRadius: 5, scene: 'ironmine', label:  _('Iron&nbsp;Mine') };
141:    World.LANDMARKS[World.TILE.COAL_MINE] = { num: 1, minRadius: 10, maxRadius: 10, scene: 'coalmine', label:  _('Coal&nbsp;Mine') };
142:    World.LANDMARKS[World.TILE.SULPHUR_MINE] = { num: 1, minRadius: 20, maxRadius: 20, scene: 'sulphurmine', label:  _('Sulphur&nbsp;Mine') };
143:    World.LANDMARKS[World.TILE.HOUSE] = { num: 10, minRadius: 0, maxRadius: World.RADIUS * 1.5, scene: 'house', label:  _('An&nbsp;Old&nbsp;House') };
144:    World.LANDMARKS[World.TILE.CAVE] = { num: 5, minRadius: 3, maxRadius: 10, scene: 'cave', label:  _('A&nbsp;Damp&nbsp;Cave') };
145:    World.LANDMARKS[World.TILE.TOWN] = { num: 10, minRadius: 10, maxRadius: 20, scene: 'town', label:  _('An&nbsp;Abandoned&nbsp;Town') };
146:    World.LANDMARKS[World.TILE.CITY] = { num: 20, minRadius: 20, maxRadius: World.RADIUS * 1.5, scene: 'city', label:  _('A&nbsp;Ruined&nbsp;City') };
147:    World.LANDMARKS[World.TILE.SHIP] = { num: 1, minRadius: 28, maxRadius: 28, scene: 'ship', label:  _('A&nbsp;Crashed&nbsp;Starship')};
148:    World.LANDMARKS[World.TILE.BOREHOLE] = { num: 10, minRadius: 15, maxRadius: World.RADIUS * 1.5, scene: 'borehole', label:  _('A&nbsp;Borehole')};
149:    World.LANDMARKS[World.TILE.BATTLEFIELD] = { num: 5, minRadius: 18, maxRadius: World.RADIUS * 1.5, scene: 'battlefield', label:  _('A&nbsp;Battlefield')};
150:    World.LANDMARKS[World.TILE.SWAMP] = { num: 1, minRadius: 15, maxRadius: World.RADIUS * 1.5, scene: 'swamp', label:  _('A&nbsp;Murky&nbsp;Swamp')};
151:    World.LANDMARKS[World.TILE.EXECUTIONER] = { num: 1, minRadius: 28, maxRadius: 28, scene: 'executioner', 'label': _('A&nbsp;Ravaged&nbsp;Battleship')};
155:      World.LANDMARKS[World.TILE.CACHE] = { num: 1, minRadius: 10, maxRadius: World.RADIUS * 1.5, scene: 'cache', label:  _('A&nbsp;Destroyed&nbsp;Village')};
169:      const landmark = World.LANDMARKS[World.TILE.EXECUTIONER]
171:        World.placeLandmark(landmark.minRadius, landmark.maxRadius, World.TILE.EXECUTIONER, map);
192:    World.ship = World.mapSearch(World.TILE.SHIP,$SM.get('game.world.map'),1);
206:    World.state.map[World.curPos[0]][World.curPos[1]] = World.TILE.OUTPOST;
229:             tile === World.TILE.ROAD ||
230:            (tile === World.TILE.OUTPOST && !(x === 0 && y === 0))  || // outposts are connected to roads
231:            tile === World.TILE.VILLAGE // all roads lead home
267:        World.state.map[closestRoad[0] + (xDir*x)][yIntersect] = World.TILE.ROAD;
272:        World.state.map[xIntersect][closestRoad[1] + (yDir*y)] = World.TILE.ROAD;
571:    if(curTile == World.TILE.VILLAGE) {
573:    } else if(curTile === World.TILE.EXECUTIONER) {
577:    } else if(typeof World.LANDMARKS[curTile] != 'undefined') {
578:      if(curTile != World.TILE.OUTPOST || !World.outpostUsed()) {
579:        Events.startEvent(Events.Setpieces[World.LANDMARKS[curTile].scene]);
605:      case World.TILE.FOREST:
607:          case World.TILE.FIELD:
610:          case World.TILE.BARRENS:
615:      case World.TILE.FIELD:
617:          case World.TILE.FOREST:
620:          case World.TILE.BARRENS:
625:      case World.TILE.BARRENS:
627:          case World.TILE.FIELD:
630:          case World.TILE.FOREST:
706:    map[World.RADIUS][World.RADIUS] = World.TILE.VILLAGE;
729:    for(var k in World.LANDMARKS) {
730:      var landmark = World.LANDMARKS[k];
740:    var max = World.LANDMARKS[target].num;
806:    return tile == World.TILE.FOREST || tile == World.TILE.FIELD || tile == World.TILE.BARRENS;
822:      if(adjacent[i] == World.TILE.VILLAGE) {
824:        return World.TILE.FOREST;
832:    for(var t in World.TILE) {
833:      var tile = World.TILE[t];
837:        cur += World.TILE_PROBS[tile] * nonSticky;
862:    return World.TILE.BARRENS;
895:            case World.TILE.VILLAGE:
899:              if(typeof World.LANDMARKS[c] != 'undefined' && (c != World.TILE.OUTPOST || !World.outpostUsed(i, j))) {
900:                mapString += '<span class="landmark">' + c + '<div class="tooltip' + ttClass + '">' + World.LANDMARKS[c].label + '</div></span>';
````

## Event Titles

````text
ORIGINAL\script\events\global.js:6:		title: _('The Thief'),
ORIGINAL\script\events\executioner.js:119:    title: _('A Ravaged Battleship'),
ORIGINAL\script\events\executioner.js:552:    title: _('A Ravaged Battleship'),
ORIGINAL\script\events\executioner.js:599:    title: _('Engineering Wing'),
ORIGINAL\script\events\executioner.js:1039:    title: _('Martial Wing'),
ORIGINAL\script\events\executioner.js:1582:    title: _('Medical Wing'),
ORIGINAL\script\events\executioner.js:2155:    title: _('Command Deck'),
ORIGINAL\script\events\encounters.js:7:		title: _('A Snarling Beast'),
ORIGINAL\script\events\encounters.js:44:	title: _('A Gaunt Man'),
ORIGINAL\script\events\encounters.js:81:	title: _('A Strange Bird'),
ORIGINAL\script\events\encounters.js:118:	title: _('A Two-Headed Creature'),
ORIGINAL\script\events\encounters.js:156:	title: _('A Shivering Man'),
ORIGINAL\script\events\encounters.js:198:		title: _('A Man-Eater'),
ORIGINAL\script\events\encounters.js:235:	title: _('A Scavenger'),
ORIGINAL\script\events\encounters.js:277:	title: _('A Huge Lizard'),
ORIGINAL\script\events\encounters.js:315:		title: _('A Feral Terror'),
ORIGINAL\script\events\encounters.js:352:	title: _('A Soldier'),
ORIGINAL\script\events\encounters.js:395:	title: _('A Sniper'),
ORIGINAL\script\events\marketing.js:9:  title: _('Penrose'),
ORIGINAL\script\events\outside.js:6:	title: _('A Ruined Trap'),
ORIGINAL\script\events\outside.js:70:		title: _('Fire'),
ORIGINAL\script\events\outside.js:97:		title: _('Sickness'),
ORIGINAL\script\events\outside.js:156:		title: _('Plague'),
ORIGINAL\script\events\outside.js:228:		title: _('A Beast Attack'),
ORIGINAL\script\events\outside.js:263:		title: _('A Military Raid'),
ORIGINAL\script\events\room.js:6:		title: _('The Nomad'),
ORIGINAL\script\events\room.js:54:		title: _('Noises'),
ORIGINAL\script\events\room.js:106:		title: _('Noises'),
ORIGINAL\script\events\room.js:193:		title: _('The Beggar'),
ORIGINAL\script\events\room.js:265:		title: _('The Shady Builder'),
ORIGINAL\script\events\room.js:323:		title: _('The Mysterious Wanderer'),
ORIGINAL\script\events\room.js:403:		title: _('The Mysterious Wanderer'),
ORIGINAL\script\events\room.js:483:		title: _('The Scout'),
ORIGINAL\script\events\room.js:526:		title: _('The Master'),
ORIGINAL\script\events\room.js:600:		title: _('The Sick Man'),
ORIGINAL\script\events\setpieces.js:6:		title: _('An Outpost'),
ORIGINAL\script\events\setpieces.js:35:		title: _('A Murky Swamp'),
ORIGINAL\script\events\setpieces.js:93:		title: _('A Damp Cave'),
ORIGINAL\script\events\setpieces.js:525:		title: _('A Deserted Town'),
ORIGINAL\script\events\setpieces.js:1243:		title: _('A Ruined City'),
ORIGINAL\script\events\setpieces.js:2939:		title: _('An Old House'),
ORIGINAL\script\events\setpieces.js:3057:		title: _('A Forgotten Battlefield'),
ORIGINAL\script\events\setpieces.js:3111:		title: _('A Huge Borehole'),
ORIGINAL\script\events\setpieces.js:3141:		title: _('A Crashed Ship'),
ORIGINAL\script\events\setpieces.js:3165:		title: _('The Sulphur Mine'),
ORIGINAL\script\events\setpieces.js:3315:		title: _('The Coal Mine'),
ORIGINAL\script\events\setpieces.js:3458:		title: _('The Iron Mine'),
ORIGINAL\script\events\setpieces.js:3536:		title: _('A Destroyed Village'),
````

## Audio Library Constants

````text
5:    MUSIC_DUSTY_PATH: 'audio/dusty-path.flac',
6:    MUSIC_SILENT_FOREST: 'audio/silent-forest.flac',
7:    MUSIC_LONELY_HUT: 'audio/lonely-hut.flac',
8:    MUSIC_TINY_VILLAGE: 'audio/tiny-village.flac',
9:    MUSIC_MODEST_VILLAGE: 'audio/modest-village.flac',
10:    MUSIC_LARGE_VILLAGE: 'audio/large-village.flac',
11:    MUSIC_RAUCOUS_VILLAGE: 'audio/raucous-village.flac',
12:    MUSIC_FIRE_DEAD: 'audio/fire-dead.flac',
13:    MUSIC_FIRE_SMOLDERING: 'audio/fire-smoldering.flac',
14:    MUSIC_FIRE_FLICKERING: 'audio/fire-flickering.flac',
15:    MUSIC_FIRE_BURNING: 'audio/fire-burning.flac',
16:    MUSIC_FIRE_ROARING: 'audio/fire-roaring.flac',
17:    MUSIC_WORLD: 'audio/world.flac',
18:    MUSIC_SPACE: 'audio/space.flac',
19:    MUSIC_ENDING: 'audio/ending.flac',
20:    MUSIC_SHIP: 'audio/ship.flac',
21:    EVENT_NOMAD: 'audio/event-nomad.flac',
22:    EVENT_NOISES_OUTSIDE: 'audio/event-noises-outside.flac',
23:    EVENT_NOISES_INSIDE: 'audio/event-noises-inside.flac',
24:    EVENT_BEGGAR: 'audio/event-beggar.flac',
25:    EVENT_SHADY_BUILDER: 'audio/event-shady-builder.flac',
26:    EVENT_MYSTERIOUS_WANDERER: 'audio/event-mysterious-wanderer.flac',
27:    EVENT_SCOUT: 'audio/event-scout.flac',
28:    EVENT_WANDERING_MASTER: 'audio/event-wandering-master.flac',
29:    EVENT_SICK_MAN: 'audio/event-sick-man.flac',
30:    EVENT_RUINED_TRAP: 'audio/event-ruined-trap.flac',
31:    EVENT_HUT_FIRE: 'audio/event-hut-fire.flac',
32:    EVENT_SICKNESS: 'audio/event-sickness.flac',
33:    EVENT_PLAGUE: 'audio/event-plague.flac',
34:    EVENT_BEAST_ATTACK: 'audio/event-beast-attack.flac',
35:    EVENT_SOLDIER_ATTACK: 'audio/event-soldier-attack.flac',
36:    EVENT_THIEF: 'audio/event-thief.flac',
37:    LANDMARK_FRIENDLY_OUTPOST: 'audio/landmark-friendly-outpost.flac',
38:    LANDMARK_SWAMP: 'audio/landmark-swamp.flac',
39:    LANDMARK_CAVE: 'audio/landmark-cave.flac',
40:    LANDMARK_TOWN: 'audio/landmark-town.flac',
41:    LANDMARK_CITY: 'audio/landmark-city.flac',
42:    LANDMARK_HOUSE: 'audio/landmark-house.flac',
43:    LANDMARK_BATTLEFIELD: 'audio/landmark-battlefield.flac',
44:    LANDMARK_BOREHOLE: 'audio/landmark-borehole.flac',
45:    LANDMARK_CRASHED_SHIP: 'audio/landmark-crashed-ship.flac',
46:    LANDMARK_SULPHUR_MINE: 'audio/landmark-sulphurmine.flac',
47:    LANDMARK_COAL_MINE: 'audio/landmark-coalmine.flac',
48:    LANDMARK_IRON_MINE: 'audio/landmark-ironmine.flac',
49:    LANDMARK_DESTROYED_VILLAGE: 'audio/landmark-destroyed-village.flac',
50:    ENCOUNTER_TIER_1: 'audio/encounter-tier-1.flac',
51:    ENCOUNTER_TIER_2: 'audio/encounter-tier-2.flac',
52:    ENCOUNTER_TIER_3: 'audio/encounter-tier-3.flac',
53:    LIGHT_FIRE: 'audio/light-fire.flac',
54:    STOKE_FIRE: 'audio/stoke-fire.flac',
55:    BUILD: 'audio/build.flac',
56:    CRAFT: 'audio/craft.flac',
57:    BUY: 'audio/buy.flac',
58:    GATHER_WOOD: 'audio/gather-wood.flac',
59:    CHECK_TRAPS: 'audio/check-traps.flac',
60:    EMBARK: 'audio/embark.flac',
61:    FOOTSTEPS_1: 'audio/footsteps-1.flac',
62:    FOOTSTEPS_2: 'audio/footsteps-2.flac',
63:    FOOTSTEPS_3: 'audio/footsteps-3.flac',
64:    FOOTSTEPS_4: 'audio/footsteps-4.flac',
65:    FOOTSTEPS_5: 'audio/footsteps-5.flac',
66:    FOOTSTEPS_6: 'audio/footsteps-6.flac',
67:    EAT_MEAT: 'audio/eat-meat.flac',
68:    USE_MEDS: 'audio/use-meds.flac',
69:    WEAPON_UNARMED_1: 'audio/weapon-unarmed-1.flac',
70:    WEAPON_UNARMED_2: 'audio/weapon-unarmed-2.flac',
71:    WEAPON_UNARMED_3: 'audio/weapon-unarmed-3.flac',
72:    WEAPON_MELEE_1: 'audio/weapon-melee-1.flac',
73:    WEAPON_MELEE_2: 'audio/weapon-melee-2.flac',
74:    WEAPON_MELEE_3: 'audio/weapon-melee-3.flac',
75:    WEAPON_RANGED_1: 'audio/weapon-ranged-1.flac',
76:    WEAPON_RANGED_2: 'audio/weapon-ranged-2.flac',
77:    WEAPON_RANGED_3: 'audio/weapon-ranged-3.flac',
78:    DEATH: 'audio/death.flac',
79:    REINFORCE_HULL: 'audio/reinforce-hull.flac',
80:    UPGRADE_ENGINE: 'audio/upgrade-engine.flac',
81:    LIFT_OFF: 'audio/lift-off.flac',
82:    ASTEROID_HIT_1: 'audio/asteroid-hit-1.flac',
83:    ASTEROID_HIT_2: 'audio/asteroid-hit-2.flac',
84:    ASTEROID_HIT_3: 'audio/asteroid-hit-3.flac',
85:    ASTEROID_HIT_4: 'audio/asteroid-hit-4.flac',
86:    ASTEROID_HIT_5: 'audio/asteroid-hit-5.flac',
87:    ASTEROID_HIT_6: 'audio/asteroid-hit-6.flac',
88:    ASTEROID_HIT_7: 'audio/asteroid-hit-7.flac',
89:    ASTEROID_HIT_8: 'audio/asteroid-hit-8.flac',
90:    CRASH: 'audio/crash.flac',
````

## Prestige Store Map

````text
12:		{ store: 'wood', type: 'g' },
13:		{ store: 'fur', type: 'g' },
14:		{ store: 'meat', type: 'g' },
15:		{ store: 'iron', type: 'g' },
16:		{ store: 'coal', type: 'g' },
17:		{ store: 'sulphur', type: 'g' },
18:		{ store: 'steel', type: 'g' },
19:		{ store: 'cured meat', type: 'g' },
20:		{ store: 'scales', type: 'g' },
21:		{ store: 'teeth', type: 'g' },
22:		{ store: 'leather', type: 'g' },
23:		{ store: 'bait', type: 'g' },
24:		{ store: 'torch', type: 'g' },
25:		{ store: 'cloth', type: 'g' },
26:		{ store: 'bone spear', type: 'w' },
27:		{ store: 'iron sword', type: 'w' },
28:		{ store: 'steel sword', type: 'w' },
29:		{ store: 'bayonet', type: 'w' },
30:		{ store: 'rifle', type: 'w' },
31:		{ store: 'laser rifle', type: 'w' },
32:		{ store: 'bullets', type: 'a' },
33:		{ store: 'energy cell', type: 'a' },
34:		{ store: 'grenade', type: 'a' },
35:		{ store: 'bolas', type: 'a' }
````

## Path Weight Overrides

````text
6:		'bone spear': 2,
7:		'iron sword': 3,
8:		'steel sword': 5,
9:		'rifle': 5,
10:		'bullets': 0.1,
11:		'energy cell': 0.2,
12:		'laser rifle': 5,
13:    'plasma rifle': 5,
14:		'bolas': 0.5,
````


