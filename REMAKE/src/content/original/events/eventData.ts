import { originalPrestigeStores } from "../core/prestige";

export const EVENT_TIME_RANGE_MINUTES = [3, 6] as const;

export interface OriginalEventButtonDefinition {
  key: string;
  text: string;
  cost?: Record<string, number>;
  reward?: Record<string, number>;
  notification?: string;
  link?: string;
  available?: (context: OriginalEventEffectContext) => boolean;
  onChoose?: (context: OriginalEventEffectContext) => void;
  nextEvent?: string | Record<number, string>;
  nextScene?: string | Record<number, string>;
}

export interface OriginalDelayedActionDefinition {
  key: string;
  delaySeconds: number;
  chance: number;
  reward: Record<string, number>;
  notification: string;
  source: string;
}

export type OriginalCombatStatus =
  "shield" | "energised" | "venomous" | "enraged" | "meditation";

export interface OriginalCombatSpecialDefinition {
  delaySeconds: number;
  status: OriginalCombatStatus | OriginalCombatStatus[];
  avoidRepeat?: boolean;
}

export interface OriginalCombatDefinition {
  enemy: string;
  enemyName: string;
  deathMessage: string;
  ranged?: boolean;
  chara: string;
  damage: number;
  hit: number;
  attackDelay: number;
  health: number;
  atHealth?: Partial<Record<number, OriginalCombatStatus>>;
  specials?: OriginalCombatSpecialDefinition[];
  explosion?: number;
  loot: Record<string, { min: number; max: number; chance: number }>;
}

export type OriginalLootTable = OriginalCombatDefinition["loot"];

export interface OriginalEventEffectContext {
  readNumber: (path: string) => number;
  readRecord: (path: string) => Record<string, number>;
  setState: (path: string, value: unknown) => void;
  addStores: (stores: Record<string, number>) => void;
  removeIncome: (key: string) => void;
  addPerk: (key: string) => void;
  canApplyMap: () => boolean;
  applyMap: () => void;
  killVillagers: (count: number) => void;
  destroyHuts: (count: number) => number;
  notify: (message: string) => void;
  rng: () => number;
}

export interface OriginalEventSceneDefinition {
  key: string;
  text: string[];
  notification?: string;
  reward?: Record<string, number>;
  loot?: OriginalLootTable;
  onLoad?: (context: OriginalEventEffectContext) => void;
  delayedAction?: OriginalDelayedActionDefinition;
  combat?: OriginalCombatDefinition;
  buttons: OriginalEventButtonDefinition[];
}

export interface OriginalEventDefinition {
  key: string;
  title: string;
  pool:
    | "room"
    | "outside"
    | "global"
    | "marketing"
    | "encounter"
    | "setpiece"
    | "executioner";
  isAvailable: (readNumber: (path: string) => number) => boolean;
  scenes: Record<string, OriginalEventSceneDefinition>;
}

function collectPrestigeStores(context: OriginalEventEffectContext): void {
  const previousStores = context.readRecord("previous.stores");
  if (Object.keys(previousStores).length === 0) return;

  const storesToAdd: Record<string, number> = {};
  originalPrestigeStores.forEach((store, index) => {
    storesToAdd[store.key] = previousStores[String(index)] ?? 0;
  });
  context.addStores(storesToAdd);
  context.setState("previous.stores", []);
}

function worldMaxHealth(context: OriginalEventEffectContext): number {
  if (context.readNumber('stores["kinetic armour"]') > 0) return 85;
  if (context.readNumber('stores["s armour"]') > 0) return 45;
  if (context.readNumber('stores["i armour"]') > 0) return 25;
  if (context.readNumber('stores["l armour"]') > 0) return 15;
  return 10;
}

const originalEncounterDefinitions: OriginalEventDefinition[] = [
  createCombatEncounter({
    key: "encounter.snarling-beast",
    title: "A Snarling Beast",
    notification: "a snarling beast leaps out of the underbrush",
    combat: {
      enemy: "snarling beast",
      enemyName: "snarling beast",
      deathMessage: "the snarling beast is dead",
      chara: "R",
      damage: 1,
      hit: 0.8,
      attackDelay: 1,
      health: 5,
      loot: {
        fur: { min: 1, max: 3, chance: 1 },
        meat: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 3, chance: 0.8 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.gaunt-man",
    title: "A Gaunt Man",
    notification: "a gaunt man approaches, a crazed look in his eye",
    combat: {
      enemy: "gaunt man",
      enemyName: "gaunt man",
      deathMessage: "the gaunt man is dead",
      chara: "E",
      damage: 2,
      hit: 0.8,
      attackDelay: 2,
      health: 6,
      loot: {
        cloth: { min: 1, max: 3, chance: 0.8 },
        teeth: { min: 1, max: 2, chance: 0.8 },
        leather: { min: 1, max: 2, chance: 0.5 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.strange-bird",
    title: "A Strange Bird",
    notification: "a strange looking bird speeds across the plains",
    combat: {
      enemy: "strange bird",
      enemyName: "strange bird",
      deathMessage: "the strange bird is dead",
      chara: "R",
      damage: 3,
      hit: 0.8,
      attackDelay: 2,
      health: 4,
      loot: {
        scales: { min: 1, max: 3, chance: 0.8 },
        teeth: { min: 1, max: 2, chance: 0.5 },
        meat: { min: 1, max: 3, chance: 0.8 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.two-headed-creature",
    title: "A Two-Headed Creature",
    notification: "a two-headed creature appears, the smaller head trembling",
    combat: {
      enemy: "two-headed creature",
      enemyName: "two-headed creature",
      deathMessage: "the two creatures are dead",
      chara: "K",
      damage: 2,
      hit: 0.5,
      attackDelay: 3,
      health: 10,
      loot: {
        fur: { min: 2, max: 4, chance: 1 },
        teeth: { min: 2, max: 3, chance: 0.8 },
        meat: { min: 2, max: 3, chance: 0.8 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.shivering-man",
    title: "A Shivering Man",
    notification:
      "a shivering man approaches and attacks with surprising strength",
    combat: {
      enemy: "shivering man",
      enemyName: "shivering man",
      deathMessage: "the shivering man is dead",
      chara: "E",
      damage: 5,
      hit: 0.5,
      attackDelay: 1,
      health: 20,
      loot: {
        cloth: { min: 1, max: 1, chance: 0.2 },
        teeth: { min: 1, max: 2, chance: 0.8 },
        leather: { min: 1, max: 1, chance: 0.2 },
        medicine: { min: 1, max: 3, chance: 0.7 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.man-eater",
    title: "A Man-Eater",
    notification: "a large creature attacks, claws freshly bloodied",
    combat: {
      enemy: "man-eater",
      enemyName: "man-eater",
      deathMessage: "the man-eater is dead",
      chara: "T",
      damage: 3,
      hit: 0.8,
      attackDelay: 1,
      health: 25,
      loot: {
        fur: { min: 5, max: 10, chance: 1 },
        meat: { min: 5, max: 10, chance: 1 },
        teeth: { min: 5, max: 10, chance: 0.8 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.scavenger",
    title: "A Scavenger",
    notification: "a scavenger draws close, hoping for an easy score",
    combat: {
      enemy: "scavenger",
      enemyName: "scavenger",
      deathMessage: "the scavenger is dead",
      chara: "E",
      damage: 4,
      hit: 0.8,
      attackDelay: 2,
      health: 30,
      loot: {
        cloth: { min: 5, max: 10, chance: 0.8 },
        leather: { min: 5, max: 10, chance: 0.8 },
        iron: { min: 1, max: 5, chance: 0.5 },
        medicine: { min: 1, max: 2, chance: 0.1 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.huge-lizard",
    title: "A Huge Lizard",
    notification: "the grass thrashes wildly as a huge lizard pushes through",
    combat: {
      enemy: "lizard",
      enemyName: "lizard",
      deathMessage: "the lizard is dead",
      chara: "T",
      damage: 5,
      hit: 0.8,
      attackDelay: 2,
      health: 20,
      loot: {
        scales: { min: 5, max: 10, chance: 0.8 },
        teeth: { min: 5, max: 10, chance: 0.5 },
        meat: { min: 5, max: 10, chance: 0.8 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.feral-terror",
    title: "A Feral Terror",
    notification: "a beast, wilder than imagining, erupts out of the foliage",
    combat: {
      enemy: "feral terror",
      enemyName: "feral terror",
      deathMessage: "the feral terror is dead",
      chara: "T",
      damage: 6,
      hit: 0.8,
      attackDelay: 1,
      health: 45,
      loot: {
        fur: { min: 5, max: 10, chance: 1 },
        meat: { min: 5, max: 10, chance: 1 },
        teeth: { min: 5, max: 10, chance: 0.8 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.soldier",
    title: "A Soldier",
    notification: "a soldier opens fire from across the desert",
    combat: {
      enemy: "soldier",
      enemyName: "soldier",
      deathMessage: "the soldier is dead",
      ranged: true,
      chara: "D",
      damage: 8,
      hit: 0.8,
      attackDelay: 2,
      health: 50,
      loot: {
        cloth: { min: 5, max: 10, chance: 0.8 },
        bullets: { min: 1, max: 5, chance: 0.5 },
        rifle: { min: 1, max: 1, chance: 0.2 },
        medicine: { min: 1, max: 2, chance: 0.1 },
      },
    },
  }),
  createCombatEncounter({
    key: "encounter.sniper",
    title: "A Sniper",
    notification: "a shot rings out, from somewhere in the long grass",
    combat: {
      enemy: "sniper",
      enemyName: "sniper",
      deathMessage: "the sniper is dead",
      chara: "D",
      damage: 15,
      hit: 0.8,
      attackDelay: 4,
      health: 30,
      ranged: true,
      loot: {
        cloth: { min: 5, max: 10, chance: 0.8 },
        bullets: { min: 1, max: 5, chance: 0.5 },
        rifle: { min: 1, max: 1, chance: 0.2 },
        medicine: { min: 1, max: 2, chance: 0.1 },
      },
    },
  }),
];

export const originalSetpieceCombatDefinitions: Record<
  string,
  OriginalCombatDefinition
> = {
  "cave-beast": {
    enemy: "beast",
    enemyName: "beast",
    deathMessage: "the beast is dead",
    chara: "R",
    damage: 1,
    hit: 0.8,
    attackDelay: 1,
    health: 5,
    loot: {
      fur: { min: 1, max: 10, chance: 1 },
      teeth: { min: 1, max: 5, chance: 0.8 },
    },
  },
  "cave-small-beast": {
    enemy: "beast",
    enemyName: "beast",
    deathMessage: "the beast is dead",
    chara: "R",
    damage: 1,
    hit: 0.8,
    attackDelay: 1,
    health: 5,
    loot: {
      fur: { min: 1, max: 3, chance: 1 },
      teeth: { min: 1, max: 2, chance: 0.8 },
    },
  },
  "cave-large-beast": {
    enemy: "beast",
    enemyName: "beast",
    deathMessage: "the beast is dead",
    chara: "R",
    damage: 3,
    hit: 0.8,
    attackDelay: 2,
    health: 10,
    loot: {
      fur: { min: 1, max: 3, chance: 1 },
      teeth: { min: 1, max: 3, chance: 1 },
    },
  },
  "cave-lizard": {
    enemy: "cave lizard",
    enemyName: "cave lizard",
    deathMessage: "the cave lizard is dead",
    chara: "R",
    damage: 3,
    hit: 0.8,
    attackDelay: 2,
    health: 6,
    loot: {
      scales: { min: 1, max: 3, chance: 1 },
      teeth: { min: 1, max: 2, chance: 0.8 },
    },
  },
  "cave-giant-lizard": {
    enemy: "lizard",
    enemyName: "lizard",
    deathMessage: "the lizard is dead",
    chara: "T",
    damage: 4,
    hit: 0.8,
    attackDelay: 2,
    health: 10,
    loot: {
      scales: { min: 1, max: 3, chance: 1 },
      teeth: { min: 1, max: 3, chance: 1 },
    },
  },
  "town-thug": {
    enemy: "thug",
    enemyName: "thug",
    deathMessage: "the thug is dead",
    chara: "E",
    damage: 4,
    hit: 0.8,
    attackDelay: 2,
    health: 30,
    loot: {
      cloth: { min: 5, max: 10, chance: 0.8 },
      leather: { min: 5, max: 10, chance: 0.8 },
      "cured meat": { min: 1, max: 5, chance: 0.5 },
    },
  },
  "town-scavenger": {
    enemy: "scavenger",
    enemyName: "scavenger",
    deathMessage: "the scavenger is dead",
    chara: "E",
    damage: 5,
    hit: 0.8,
    attackDelay: 2,
    health: 30,
    loot: {
      "cured meat": { min: 1, max: 5, chance: 1 },
      leather: { min: 5, max: 10, chance: 0.8 },
      "steel sword": { min: 1, max: 1, chance: 0.5 },
    },
  },
  "town-beast": {
    enemy: "beast",
    enemyName: "beast",
    deathMessage: "the beast is dead",
    chara: "R",
    damage: 3,
    hit: 0.8,
    attackDelay: 1,
    health: 25,
    loot: {
      teeth: { min: 1, max: 5, chance: 1 },
      fur: { min: 5, max: 10, chance: 1 },
    },
  },
  "town-vigilante": {
    enemy: "vigilante",
    enemyName: "vigilante",
    deathMessage: "the vigilante is dead",
    chara: "D",
    damage: 6,
    hit: 0.8,
    attackDelay: 2,
    health: 30,
    loot: {
      "cured meat": { min: 1, max: 5, chance: 1 },
      leather: { min: 5, max: 10, chance: 0.8 },
      "steel sword": { min: 1, max: 1, chance: 0.5 },
    },
  },
  "town-madman": {
    enemy: "madman",
    enemyName: "madman",
    deathMessage: "the madman is dead",
    chara: "E",
    damage: 6,
    hit: 0.3,
    attackDelay: 1,
    health: 10,
    loot: {
      cloth: { min: 2, max: 4, chance: 0.3 },
      "cured meat": { min: 1, max: 5, chance: 0.9 },
      medicine: { min: 1, max: 2, chance: 0.4 },
    },
  },
  "house-squatter": {
    enemy: "squatter",
    enemyName: "squatter",
    deathMessage: "the squatter is dead",
    chara: "E",
    damage: 3,
    hit: 0.8,
    attackDelay: 2,
    health: 10,
    loot: {
      "cured meat": { min: 1, max: 10, chance: 0.8 },
      leather: { min: 1, max: 10, chance: 0.2 },
      cloth: { min: 1, max: 10, chance: 0.5 },
    },
  },
  "city-sniper": {
    enemy: "sniper",
    enemyName: "sniper",
    deathMessage: "the sniper is dead",
    ranged: true,
    chara: "D",
    damage: 15,
    hit: 0.8,
    attackDelay: 4,
    health: 30,
    loot: {
      "cured meat": { min: 1, max: 5, chance: 0.8 },
      bullets: { min: 1, max: 5, chance: 0.5 },
      rifle: { min: 1, max: 1, chance: 0.2 },
    },
  },
  "city-soldier": {
    enemy: "soldier",
    enemyName: "soldier",
    deathMessage: "the soldier is dead",
    ranged: true,
    chara: "D",
    damage: 8,
    hit: 0.8,
    attackDelay: 2,
    health: 50,
    loot: {
      "cured meat": { min: 1, max: 5, chance: 0.8 },
      bullets: { min: 1, max: 5, chance: 0.5 },
      rifle: { min: 1, max: 1, chance: 0.2 },
    },
  },
  "city-commando": {
    enemy: "commando",
    enemyName: "commando",
    deathMessage: "the commando is dead",
    ranged: true,
    chara: "D",
    damage: 3,
    hit: 0.9,
    attackDelay: 2,
    health: 55,
    loot: {
      rifle: { min: 1, max: 1, chance: 0.5 },
      bullets: { min: 1, max: 5, chance: 0.8 },
      "cured meat": { min: 1, max: 5, chance: 0.8 },
    },
  },
  "city-thug": {
    enemy: "thug",
    enemyName: "thug",
    deathMessage: "the thug is dead",
    chara: "E",
    damage: 3,
    hit: 0.8,
    attackDelay: 2,
    health: 30,
    loot: {
      "steel sword": { min: 1, max: 1, chance: 0.5 },
      "cured meat": { min: 1, max: 3, chance: 0.5 },
      cloth: { min: 1, max: 5, chance: 0.8 },
    },
  },
  "city-bird": {
    enemy: "bird",
    enemyName: "bird",
    deathMessage: "the bird is dead",
    chara: "R",
    damage: 5,
    hit: 0.7,
    attackDelay: 1,
    health: 45,
    loot: {
      meat: { min: 5, max: 10, chance: 0.8 },
    },
  },
  "city-beast": {
    enemy: "beast",
    enemyName: "beast",
    deathMessage: "the beast is dead",
    chara: "R",
    damage: 2,
    hit: 0.8,
    attackDelay: 1,
    health: 30,
    loot: {
      meat: { min: 1, max: 5, chance: 0.8 },
      fur: { min: 1, max: 5, chance: 0.8 },
      teeth: { min: 1, max: 5, chance: 0.5 },
    },
  },
  "city-old-man": {
    enemy: "old man",
    enemyName: "old man",
    deathMessage: "the old man is dead",
    chara: "E",
    damage: 3,
    hit: 0.5,
    attackDelay: 2,
    health: 10,
    loot: {
      "cured meat": { min: 1, max: 3, chance: 0.5 },
      cloth: { min: 1, max: 5, chance: 0.8 },
      medicine: { min: 1, max: 2, chance: 0.5 },
    },
  },
  "city-lizard": {
    enemy: "lizard",
    enemyName: "lizard",
    deathMessage: "the lizard is dead",
    chara: "R",
    damage: 5,
    hit: 0.8,
    attackDelay: 2,
    health: 20,
    loot: {
      scales: { min: 5, max: 10, chance: 0.8 },
      teeth: { min: 5, max: 10, chance: 0.5 },
      meat: { min: 5, max: 10, chance: 0.8 },
    },
  },
  "city-lizards": {
    enemy: "lizards",
    enemyName: "lizards",
    deathMessage: "the lizards are dead",
    chara: "RRR",
    damage: 4,
    hit: 0.7,
    attackDelay: 0.7,
    health: 30,
    loot: {
      meat: { min: 3, max: 8, chance: 1 },
      teeth: { min: 2, max: 4, chance: 1 },
      scales: { min: 3, max: 5, chance: 1 },
    },
  },
  "city-squatters": {
    enemy: "squatters",
    enemyName: "squatters",
    deathMessage: "the squatters are dead",
    chara: "EEE",
    damage: 2,
    hit: 0.7,
    attackDelay: 0.5,
    health: 40,
    loot: {
      "cured meat": { min: 1, max: 3, chance: 0.5 },
      cloth: { min: 3, max: 8, chance: 0.8 },
      medicine: { min: 1, max: 3, chance: 0.3 },
    },
  },
  "city-crowd-squatters": {
    enemy: "squatters",
    enemyName: "squatters",
    deathMessage: "the squatters are dead",
    chara: "EEE",
    damage: 2,
    hit: 0.7,
    attackDelay: 0.5,
    health: 40,
    loot: {
      cloth: { min: 1, max: 5, chance: 0.8 },
      teeth: { min: 1, max: 5, chance: 0.5 },
    },
  },
  "city-deformed": {
    enemy: "deformed",
    enemyName: "deformed",
    deathMessage: "the deformed is dead",
    chara: "T",
    damage: 8,
    hit: 0.6,
    attackDelay: 2,
    health: 40,
    loot: {
      cloth: { min: 1, max: 5, chance: 0.8 },
      teeth: { min: 2, max: 2, chance: 1 },
      steel: { min: 1, max: 3, chance: 0.6 },
      scales: { min: 2, max: 3, chance: 0.1 },
    },
  },
  "city-tentacles": {
    enemy: "tentacles",
    enemyName: "tentacles",
    deathMessage: "the tentacles are dead",
    chara: "TTT",
    damage: 2,
    hit: 0.6,
    attackDelay: 0.5,
    health: 60,
    loot: {
      meat: { min: 10, max: 20, chance: 1 },
    },
  },
  "city-rats": {
    enemy: "rats",
    enemyName: "rats",
    deathMessage: "the rats are dead",
    chara: "RRR",
    damage: 1,
    hit: 0.8,
    attackDelay: 0.25,
    health: 60,
    loot: {
      fur: { min: 5, max: 10, chance: 0.8 },
      teeth: { min: 5, max: 10, chance: 0.5 },
    },
  },
  "city-veteran": {
    enemy: "veteran",
    enemyName: "veteran",
    deathMessage: "the veteran is dead",
    chara: "D",
    damage: 6,
    hit: 0.8,
    attackDelay: 2,
    health: 45,
    loot: {
      bayonet: { min: 1, max: 1, chance: 0.5 },
      "cured meat": { min: 1, max: 5, chance: 0.8 },
    },
  },
  "city-frail-man": {
    enemy: "frail man",
    enemyName: "frail man",
    deathMessage: "the frail man is dead",
    chara: "E",
    damage: 1,
    hit: 0.8,
    attackDelay: 2,
    health: 10,
    loot: {
      "cured meat": { min: 1, max: 5, chance: 0.8 },
      cloth: { min: 1, max: 5, chance: 0.5 },
      leather: { min: 1, max: 1, chance: 0.2 },
      medicine: { min: 1, max: 3, chance: 0.05 },
    },
  },
  "city-youth": {
    enemy: "youth",
    enemyName: "youth",
    deathMessage: "the youth is dead",
    chara: "E",
    damage: 2,
    hit: 0.7,
    attackDelay: 1,
    health: 45,
    loot: {
      cloth: { min: 1, max: 5, chance: 0.8 },
      teeth: { min: 1, max: 5, chance: 0.5 },
    },
  },
  "city-squatter": {
    enemy: "squatter",
    enemyName: "squatter",
    deathMessage: "the squatter is dead",
    chara: "E",
    damage: 3,
    hit: 0.8,
    attackDelay: 2,
    health: 20,
    loot: {
      cloth: { min: 1, max: 5, chance: 0.8 },
      teeth: { min: 1, max: 5, chance: 0.5 },
    },
  },
  "sulphurmine-veteran": {
    enemy: "veteran",
    enemyName: "veteran",
    deathMessage: "the veteran is dead",
    chara: "D",
    damage: 10,
    hit: 0.8,
    attackDelay: 2,
    health: 65,
    loot: {
      bayonet: { min: 1, max: 1, chance: 0.5 },
      "cured meat": { min: 1, max: 5, chance: 0.8 },
    },
  },
  "coalmine-man": {
    enemy: "man",
    enemyName: "man",
    deathMessage: "the man is dead",
    chara: "E",
    damage: 3,
    hit: 0.8,
    attackDelay: 2,
    health: 10,
    loot: {
      "cured meat": { min: 1, max: 5, chance: 0.8 },
      cloth: { min: 1, max: 5, chance: 0.8 },
    },
  },
  "coalmine-chief": {
    enemy: "chief",
    enemyName: "chief",
    deathMessage: "the chief is dead",
    chara: "D",
    damage: 5,
    hit: 0.8,
    attackDelay: 2,
    health: 20,
    loot: {
      "cured meat": { min: 5, max: 10, chance: 1 },
      cloth: { min: 5, max: 10, chance: 0.8 },
      iron: { min: 1, max: 5, chance: 0.8 },
    },
  },
  "ironmine-matriarch": {
    enemy: "beastly matriarch",
    enemyName: "beastly matriarch",
    deathMessage: "the beastly matriarch is dead",
    chara: "T",
    damage: 4,
    hit: 0.8,
    attackDelay: 2,
    health: 10,
    loot: {
      teeth: { min: 5, max: 10, chance: 1 },
      scales: { min: 5, max: 10, chance: 0.8 },
      cloth: { min: 5, max: 10, chance: 0.5 },
    },
  },
};

export const originalExecutionerCombatDefinitions: Record<
  string,
  OriginalCombatDefinition
> = {
  "mechanical-guard": {
    enemy: "mechanical guard",
    enemyName: "mechanical guard",
    deathMessage: "the mechanical guard is dead",
    ranged: true,
    chara: "G",
    damage: 10,
    hit: 0.8,
    attackDelay: 2,
    health: 60,
    loot: {
      "energy cell": { min: 1, max: 5, chance: 0.8 },
      "laser rifle": { min: 1, max: 1, chance: 0.8 },
      "alien alloy": { min: 1, max: 1, chance: 0.2 },
    },
  },
  "mechanical-quadruped": {
    enemy: "mechanical quadruped",
    enemyName: "mechanical quadruped",
    deathMessage: "the mechanical quadruped is dead",
    chara: "Q",
    damage: 8,
    hit: 0.8,
    attackDelay: 1,
    health: 70,
    loot: {
      "alien alloy": { min: 2, max: 4, chance: 0.2 },
    },
  },
  "broken-medic": {
    enemy: "broken medic",
    enemyName: "broken medic",
    deathMessage: "the broken medic is dead",
    chara: "M",
    damage: 15,
    hit: 0.8,
    attackDelay: 3,
    health: 80,
    atHealth: {
      40: "venomous",
    },
    loot: {
      "alien alloy": { min: 1, max: 2, chance: 1 },
      hypo: { min: 1, max: 4, chance: 0.2 },
    },
  },
  "defence-turret": {
    enemy: "defence turret",
    enemyName: "defence turret",
    deathMessage: "the defence turret is destroyed",
    ranged: true,
    chara: "T",
    damage: 25,
    hit: 0.8,
    attackDelay: 4,
    health: 50,
    loot: {
      "energy cell": { min: 1, max: 5, chance: 0.8 },
      "alien alloy": { min: 1, max: 1, chance: 0.8 },
      "laser rifle": { min: 1, max: 1, chance: 0.2 },
    },
  },
  "ancient-beast": {
    enemy: "ancient beast",
    enemyName: "ancient beast",
    deathMessage: "the ancient beast is dead",
    chara: "A",
    damage: 6,
    hit: 0.8,
    attackDelay: 1,
    health: 60,
    loot: {
      fur: { min: 5, max: 10, chance: 1 },
      meat: { min: 5, max: 10, chance: 1 },
      teeth: { min: 5, max: 10, chance: 0.8 },
    },
  },
  "automated-turret": {
    enemy: "automated turret",
    enemyName: "automated turret",
    deathMessage: "the automated turret is destroyed",
    ranged: true,
    chara: "T",
    damage: 10,
    hit: 0.8,
    attackDelay: 2.5,
    health: 60,
    loot: {
      "energy cell": { min: 1, max: 5, chance: 0.8 },
      "laser rifle": { min: 1, max: 1, chance: 0.2 },
    },
  },
  "chitinous-horror": {
    enemy: "chitinous horror",
    enemyName: "chitinous horror",
    deathMessage: "the chitinous horror is dead",
    chara: "H",
    damage: 1,
    hit: 0.7,
    attackDelay: 0.25,
    health: 60,
    loot: {
      meat: { min: 5, max: 10, chance: 0.8 },
      scales: { min: 5, max: 10, chance: 0.5 },
    },
  },
  "chitinous-queen": {
    enemy: "chitinous queen",
    enemyName: "chitinous queen",
    deathMessage: "the chitinous queen is dead",
    chara: "Q",
    damage: 1,
    hit: 0.7,
    attackDelay: 0.25,
    health: 70,
    loot: {
      meat: { min: 8, max: 12, chance: 0.8 },
      scales: { min: 8, max: 12, chance: 0.5 },
    },
  },
  operative: {
    enemy: "operative",
    enemyName: "operative",
    deathMessage: "the operative is dead",
    chara: "O",
    damage: 8,
    hit: 0.8,
    attackDelay: 2,
    health: 60,
    loot: {
      bayonet: { min: 1, max: 1, chance: 0.5 },
      bullets: { min: 1, max: 5, chance: 0.8 },
      "cured meat": { min: 1, max: 5, chance: 0.8 },
    },
  },
  researcher: {
    enemy: "researcher",
    enemyName: "researcher",
    deathMessage: "the researcher is dead",
    chara: "R",
    damage: 1,
    hit: 0.8,
    attackDelay: 2,
    health: 20,
    loot: {
      torch: { min: 1, max: 3, chance: 0.8 },
      cloth: { min: 1, max: 5, chance: 0.8 },
      "cured meat": { min: 1, max: 5, chance: 0.8 },
    },
  },
  "unruly-welder": {
    enemy: "unruly welder",
    enemyName: "unruly welder",
    deathMessage: "the unruly welder is destroyed",
    chara: "W",
    damage: 13,
    hit: 0.8,
    attackDelay: 2,
    health: 50,
    loot: {
      "energy cell": { min: 1, max: 5, chance: 0.8 },
      "alien alloy": { min: 1, max: 1, chance: 0.2 },
    },
  },
  "unstable-prototype": {
    enemy: "unstable prototype",
    enemyName: "unstable prototype",
    deathMessage: "the unstable prototype is destroyed",
    chara: "P",
    damage: 5,
    hit: 0.8,
    attackDelay: 2,
    health: 150,
    specials: [{ delaySeconds: 5, status: "shield" }],
    loot: {
      "alien alloy": { min: 1, max: 3, chance: 1 },
      "kinetic armour blueprint": { min: 1, max: 1, chance: 1 },
    },
  },
  "murderous-robot": {
    enemy: "murderous robot",
    enemyName: "murderous robot",
    deathMessage: "the murderous robot is destroyed",
    chara: "M",
    damage: 10,
    hit: 0.8,
    attackDelay: 3,
    health: 250,
    specials: [{ delaySeconds: 13, status: "energised" }],
    loot: {
      "alien alloy": { min: 1, max: 3, chance: 1 },
      "disruptor blueprint": { min: 1, max: 1, chance: 1 },
    },
  },
  "unstable-automaton": {
    enemy: "unstable automaton",
    enemyName: "unstable automaton",
    deathMessage: "the unstable automaton is destroyed",
    chara: "A",
    damage: 10,
    hit: 0.7,
    attackDelay: 2,
    health: 100,
    explosion: 30,
    loot: {
      "glowstone blueprint": { min: 1, max: 1, chance: 1 },
    },
  },
  "malformed-experiment": {
    enemy: "malformed experiment",
    enemyName: "malformed experiment",
    deathMessage: "the malformed experiment is dead",
    chara: "E",
    damage: 5,
    hit: 0.8,
    attackDelay: 2,
    health: 200,
    specials: [{ delaySeconds: 16, status: "enraged" }],
    loot: {
      "stim blueprint": { min: 1, max: 1, chance: 1 },
    },
  },
  "immortal-wanderer": {
    enemy: "immortal wanderer",
    enemyName: "immortal wanderer",
    deathMessage: "the immortal wanderer is defeated",
    chara: "@",
    damage: 12,
    hit: 0.8,
    attackDelay: 2,
    health: 500,
    specials: [
      {
        delaySeconds: 7,
        status: ["shield", "enraged", "meditation"],
        avoidRepeat: true,
      },
    ],
    loot: {
      "fleet beacon": { min: 1, max: 1, chance: 1 },
    },
  },
};

const originalSetpieceDefinitions: OriginalEventDefinition[] = [
  {
    key: "setpiece.outpost",
    title: "An Outpost",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: ["a safe place in the wilds."],
        notification: "a safe place in the wilds.",
        onLoad: (context) => {
          context.setState("game.world.outpostUsed", true);
          context.setState("game.world.waterReplenished", true);
          context.notify("water replenished");
        },
        loot: {
          "cured meat": { min: 5, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.swamp",
    title: "A Murky Swamp",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "rotting reeds rise out of the swampy earth.",
          "a lone frog sits in the muck, silently.",
        ],
        notification: "a swamp festers in the stagnant air.",
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "cabin" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      cabin: {
        key: "cabin",
        text: [
          "deep in the swamp is a moss-covered cabin.",
          "an old wanderer sits inside, in a seeming trance.",
        ],
        buttons: [
          {
            key: "talk",
            text: "talk",
            cost: { charm: 1 },
            nextScene: { 1: "talk" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      talk: {
        key: "talk",
        text: [
          "the wanderer takes the charm and nods slowly.",
          "he speaks of once leading the great fleets to fresh worlds.",
          "unfathomable destruction to fuel wanderer hungers.",
          "his time here, now, is his penance.",
        ],
        onLoad: (context) => {
          context.addPerk("gastronome");
          context.setState("game.world.swampVisited", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.old-house",
    title: "An Old House",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "an old house remains here, once white siding yellowed and peeling.",
          "the door hangs open.",
        ],
        notification:
          "the remains of an old house stand as a monument to simpler times",
        buttons: [
          {
            key: "enter",
            text: "go inside",
            nextScene: { 0.25: "medicine", 0.5: "supplies", 1: "occupied" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      supplies: {
        key: "supplies",
        text: [
          "the house is abandoned, but not yet picked over.",
          "still a few drops of water in the old well.",
        ],
        onLoad: (context) => {
          context.setState("game.world.oldHouseVisited", true);
          context.setState("game.world.waterReplenished", true);
          context.notify("water replenished");
        },
        loot: {
          "cured meat": { min: 1, max: 10, chance: 0.8 },
          leather: { min: 1, max: 10, chance: 0.2 },
          cloth: { min: 1, max: 10, chance: 0.5 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      medicine: {
        key: "medicine",
        text: [
          "the house has been ransacked.",
          "but there is a cache of medicine under the floorboards.",
        ],
        onLoad: (context) => {
          context.setState("game.world.oldHouseVisited", true);
        },
        loot: {
          medicine: { min: 2, max: 5, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      occupied: {
        key: "occupied",
        text: [],
        notification: "a man charges down the hall, a rusty blade in his hand",
        onLoad: (context) => {
          context.setState("game.world.oldHouseVisited", true);
        },
        combat: originalSetpieceCombatDefinitions["house-squatter"],
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.borehole",
    title: "A Huge Borehole",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a huge hole is cut deep into the earth, evidence of the past harvest.",
          "they took what they came for, and left.",
          "castoff from the mammoth drills can still be found by the edges of the precipice.",
        ],
        onLoad: (context) => {
          context.setState("game.world.boreholeVisited", true);
        },
        loot: {
          "alien alloy": { min: 1, max: 3, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.battlefield",
    title: "A Forgotten Battlefield",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battle was fought here, long ago.",
          "battered technology from both sides lays dormant on the blasted landscape.",
        ],
        onLoad: (context) => {
          context.setState("game.world.battlefieldVisited", true);
        },
        loot: {
          rifle: { min: 1, max: 3, chance: 0.5 },
          bullets: { min: 5, max: 20, chance: 0.8 },
          "laser rifle": { min: 1, max: 3, chance: 0.3 },
          "energy cell": { min: 5, max: 10, chance: 0.5 },
          grenade: { min: 1, max: 5, chance: 0.5 },
          "alien alloy": { min: 1, max: 1, chance: 0.3 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.crashed-ship",
    title: "A Crashed Ship",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the familiar curves of a wanderer vessel rise up out of the dust and ash. ",
          "lucky that the natives can't work the mechanisms.",
          "with a little effort, it might fly again.",
        ],
        onLoad: (context) => {
          context.setState("game.world.ship", true);
          context.setState("game.world.crashedShipVisited", true);
        },
        buttons: [
          {
            key: "leavel",
            text: "salvage",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.destroyed-village",
    title: "A Destroyed Village",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a destroyed village lies in the dust.",
          "charred bodies litter the ground.",
        ],
        notification:
          "the metallic tang of wanderer afterburner hangs in the air.",
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "underground" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      underground: {
        key: "underground",
        text: [
          "a shack stands at the center of the village.",
          "there are still supplies inside.",
        ],
        buttons: [
          {
            key: "take",
            text: "take",
            nextScene: { 1: "exit" },
          },
        ],
      },
      exit: {
        key: "exit",
        text: [
          "all the work of a previous generation is here.",
          "ripe for the picking.",
        ],
        onLoad: (context) => {
          context.setState("game.world.destroyedVillageVisited", true);
          context.setState("game.world.cacheCollected", true);
          collectPrestigeStores(context);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.cave-depths",
    title: "A Damp Cave",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the mouth of the cave is wide and dark.",
          "can't see what's inside.",
        ],
        notification: "the earth here is split, as if bearing an ancient wound",
        buttons: [
          {
            key: "enter",
            text: "go inside",
            nextScene: { 1: "beast" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      beast: {
        key: "beast",
        text: [],
        notification: "a startled beast defends its home",
        combat: originalSetpieceCombatDefinitions["cave-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "narrow" },
          },
        ],
      },
      narrow: {
        key: "narrow",
        text: [
          "the cave narrows a few feet in.",
          "the walls are moist and moss-covered",
        ],
        buttons: [
          {
            key: "continue",
            text: "squeeze",
            nextScene: { 1: "lizard" },
          },
          {
            key: "leave",
            text: "leave cave",
            nextScene: "end",
          },
        ],
      },
      lizard: {
        key: "lizard",
        text: [],
        notification: "a cave lizard attacks",
        combat: originalSetpieceCombatDefinitions["cave-lizard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the torch sputters and dies in the damp air",
          "the darkness is absolute",
        ],
        notification: "the torch goes out",
        buttons: [
          {
            key: "leave",
            text: "leave cave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.cave-camp-cache",
    title: "A Damp Cave",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the mouth of the cave is wide and dark.",
          "can't see what's inside.",
        ],
        notification: "the earth here is split, as if bearing an ancient wound",
        buttons: [
          {
            key: "enter",
            text: "go inside",
            cost: { torch: 1 },
            nextScene: { 1: "camp" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      camp: {
        key: "camp",
        text: [
          "the remains of an old camp sits just inside the cave.",
          "bedrolls, torn and blackened, lay beneath a thin layer of dust.",
        ],
        loot: {
          "cured meat": { min: 1, max: 5, chance: 1 },
          torch: { min: 1, max: 5, chance: 0.5 },
          leather: { min: 1, max: 5, chance: 0.3 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "lizard" },
          },
          {
            key: "leave",
            text: "leave cave",
            nextScene: "end",
          },
        ],
      },
      lizard: {
        key: "lizard",
        text: [],
        notification: "a giant lizard shambles forward",
        combat: originalSetpieceCombatDefinitions["cave-giant-lizard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "supply-cache" },
          },
        ],
      },
      "supply-cache": {
        key: "supply-cache",
        text: ["a small supply cache is hidden at the back of the cave."],
        onLoad: (context) => {
          context.setState("game.world.caveCampCacheCleared", true);
        },
        loot: {
          cloth: { min: 5, max: 10, chance: 1 },
          leather: { min: 5, max: 10, chance: 1 },
          iron: { min: 5, max: 10, chance: 1 },
          "cured meat": { min: 5, max: 10, chance: 1 },
          steel: { min: 5, max: 10, chance: 0.5 },
          bolas: { min: 1, max: 3, chance: 0.3 },
          medicine: { min: 1, max: 4, chance: 0.15 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave cave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.cave-wanderer-nest",
    title: "A Damp Cave",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the mouth of the cave is wide and dark.",
          "can't see what's inside.",
        ],
        notification: "the earth here is split, as if bearing an ancient wound",
        buttons: [
          {
            key: "enter",
            text: "go inside",
            cost: { torch: 1 },
            nextScene: { 1: "beast" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      beast: {
        key: "beast",
        text: [],
        notification: "a startled beast defends its home",
        combat: originalSetpieceCombatDefinitions["cave-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "wanderer-body" },
          },
        ],
      },
      "wanderer-body": {
        key: "wanderer-body",
        text: [
          "the body of a wanderer lies in a small cavern.",
          "rot's been to work on it, and some of the pieces are missing.",
          "can't tell what left it here.",
        ],
        loot: {
          "iron sword": { min: 1, max: 1, chance: 1 },
          "cured meat": { min: 1, max: 5, chance: 0.8 },
          torch: { min: 1, max: 3, chance: 0.5 },
          medicine: { min: 1, max: 2, chance: 0.1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "large-beast" },
          },
          {
            key: "leave",
            text: "leave cave",
            nextScene: "end",
          },
        ],
      },
      "large-beast": {
        key: "large-beast",
        text: [],
        notification: "a large beast charges out of the dark",
        combat: originalSetpieceCombatDefinitions["cave-large-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "nest" },
          },
        ],
      },
      nest: {
        key: "nest",
        text: ["the nest of a large animal lies at the back of the cave."],
        onLoad: (context) => {
          context.setState("game.world.caveWandererNestCleared", true);
        },
        loot: {
          meat: { min: 5, max: 10, chance: 1 },
          fur: { min: 5, max: 10, chance: 1 },
          scales: { min: 5, max: 10, chance: 1 },
          teeth: { min: 5, max: 10, chance: 1 },
          cloth: { min: 5, max: 10, chance: 0.5 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave cave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.cave-old-case",
    title: "A Damp Cave",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the mouth of the cave is wide and dark.",
          "can't see what's inside.",
        ],
        notification: "the earth here is split, as if bearing an ancient wound",
        buttons: [
          {
            key: "enter",
            text: "go inside",
            cost: { torch: 1 },
            nextScene: { 1: "narrow" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      narrow: {
        key: "narrow",
        text: [
          "the cave narrows a few feet in.",
          "the walls are moist and moss-covered",
        ],
        buttons: [
          {
            key: "continue",
            text: "squeeze",
            nextScene: { 1: "beast" },
          },
          {
            key: "leave",
            text: "leave cave",
            nextScene: "end",
          },
        ],
      },
      beast: {
        key: "beast",
        text: [],
        notification: "a startled beast defends its home",
        combat: originalSetpieceCombatDefinitions["cave-small-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "lizard" },
          },
        ],
      },
      lizard: {
        key: "lizard",
        text: [],
        notification: "a giant lizard shambles forward",
        combat: originalSetpieceCombatDefinitions["cave-giant-lizard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "old-case" },
          },
        ],
      },
      "old-case": {
        key: "old-case",
        text: [
          "an old case is wedged behind a rock, covered in a thick layer of dust.",
        ],
        onLoad: (context) => {
          context.setState("game.world.caveOldCaseCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 1, chance: 1 },
          bolas: { min: 1, max: 3, chance: 0.5 },
          medicine: { min: 1, max: 3, chance: 0.3 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave cave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.town-thug",
    title: "A Deserted Town",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a small suburb lays ahead, empty houses scorched and peeling.",
          "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
        ],
        notification: "the town lies abandoned, its citizens long dead",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "ambush" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      ambush: {
        key: "ambush",
        text: [],
        notification: "ambushed on the street.",
        combat: originalSetpieceCombatDefinitions["town-thug"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "where the windows of the schoolhouse aren't shattered, they're blackened with soot.",
          "the double doors creak endlessly in the wind.",
        ],
        buttons: [
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.town-schoolhouse",
    title: "A Deserted Town",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a small suburb lays ahead, empty houses scorched and peeling.",
          "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
        ],
        notification: "the town lies abandoned, its citizens long dead",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "schoolhouse" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      schoolhouse: {
        key: "schoolhouse",
        text: [
          "where the windows of the schoolhouse aren't shattered, they're blackened with soot.",
          "the double doors creak endlessly in the wind.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "locker" },
          },
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
      locker: {
        key: "locker",
        text: ["a small cache of supplies is tucked inside a rusting locker."],
        loot: {
          "cured meat": { min: 1, max: 5, chance: 1 },
          torch: { min: 1, max: 3, chance: 0.8 },
          bullets: { min: 1, max: 5, chance: 0.3 },
          medicine: { min: 1, max: 3, chance: 0.05 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "thug" },
          },
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
      thug: {
        key: "thug",
        text: [],
        notification: "a thug moves out of the shadows.",
        combat: originalSetpieceCombatDefinitions["town-thug"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "scavenger" },
          },
        ],
      },
      scavenger: {
        key: "scavenger",
        text: [],
        notification:
          "a panicked scavenger bursts through the door, screaming.",
        combat: originalSetpieceCombatDefinitions["town-scavenger"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "camp" },
          },
        ],
      },
      camp: {
        key: "camp",
        text: [
          "scavenger had a small camp in the school.",
          "collected scraps spread across the floor like they fell from heaven.",
        ],
        onLoad: (context) => {
          context.setState("game.world.townSchoolhouseCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 1, chance: 1 },
          steel: { min: 5, max: 10, chance: 1 },
          "cured meat": { min: 5, max: 10, chance: 1 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          medicine: { min: 1, max: 2, chance: 0.3 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.town-park-vigilante",
    title: "A Deserted Town",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a small suburb lays ahead, empty houses scorched and peeling.",
          "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
        ],
        notification: "the town lies abandoned, its citizens long dead",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "ambush" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      ambush: {
        key: "ambush",
        text: [],
        notification: "ambushed on the street.",
        combat: originalSetpieceCombatDefinitions["town-thug"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "park" },
          },
        ],
      },
      park: {
        key: "park",
        text: [],
        notification: "a beast stands alone in an overgrown park.",
        combat: originalSetpieceCombatDefinitions["town-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "commotion" },
          },
        ],
      },
      commotion: {
        key: "commotion",
        text: [
          "something's causing a commotion a ways down the road.",
          "a fight, maybe.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "vigilante" },
          },
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
      vigilante: {
        key: "vigilante",
        text: [],
        notification:
          "a man stands over a dead wanderer. notices he's not alone.",
        combat: originalSetpieceCombatDefinitions["town-vigilante"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "wanderer-rifle" },
          },
        ],
      },
      "wanderer-rifle": {
        key: "wanderer-rifle",
        text: [
          "beneath the wanderer's rags, clutched in one of its many hands, a glint of steel.",
          "worth killing for, it seems.",
        ],
        onLoad: (context) => {
          context.setState("game.world.townParkVigilanteCleared", true);
        },
        loot: {
          rifle: { min: 1, max: 1, chance: 1 },
          bullets: { min: 1, max: 5, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.town-caravan-vigilante",
    title: "A Deserted Town",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a small suburb lays ahead, empty houses scorched and peeling.",
          "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
        ],
        notification: "the town lies abandoned, its citizens long dead",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "ambush" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      ambush: {
        key: "ambush",
        text: [],
        notification: "ambushed on the street.",
        combat: originalSetpieceCombatDefinitions["town-thug"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "caravan" },
          },
        ],
      },
      caravan: {
        key: "caravan",
        text: [
          "an overturned caravan is spread across the pockmarked street.",
          "it's been picked over by scavengers, but there's still some things worth taking.",
        ],
        loot: {
          "cured meat": { min: 1, max: 5, chance: 0.8 },
          torch: { min: 1, max: 3, chance: 0.5 },
          bullets: { min: 1, max: 5, chance: 0.3 },
          medicine: { min: 1, max: 3, chance: 0.1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "food-basket" },
          },
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
      "food-basket": {
        key: "food-basket",
        text: [
          "a small basket of food is hidden under a park bench, with a note attached.",
          "can't read the words.",
        ],
        loot: {
          "cured meat": { min: 1, max: 5, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "vigilante" },
          },
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
      vigilante: {
        key: "vigilante",
        text: [],
        notification:
          "a man stands over a dead wanderer. notices he's not alone.",
        combat: originalSetpieceCombatDefinitions["town-vigilante"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "trinkets" },
          },
        ],
      },
      trinkets: {
        key: "trinkets",
        text: [
          "eye for an eye seems fair.",
          "always worked before, at least.",
          "picking the bones finds some useful trinkets.",
        ],
        onLoad: (context) => {
          context.setState("game.world.townCaravanVigilanteCleared", true);
        },
        loot: {
          "cured meat": { min: 5, max: 10, chance: 1 },
          iron: { min: 5, max: 10, chance: 1 },
          torch: { min: 1, max: 5, chance: 1 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          medicine: { min: 1, max: 2, chance: 0.1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.town-clinic",
    title: "A Deserted Town",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a small suburb lays ahead, empty houses scorched and peeling.",
          "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
        ],
        notification: "the town lies abandoned, its citizens long dead",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "clinic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      clinic: {
        key: "clinic",
        text: [
          "a squat building up ahead.",
          "a green cross barely visible behind grimy windows.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "medicine" },
          },
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
      medicine: {
        key: "medicine",
        text: ["some medicine abandoned in the drawers."],
        onLoad: (context) => {
          context.setState("game.world.townClinicCleared", true);
        },
        loot: {
          medicine: { min: 2, max: 5, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.town-clinic-madman",
    title: "A Deserted Town",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a small suburb lays ahead, empty houses scorched and peeling.",
          "broken streetlights stand, rusting. light hasn't graced this place in a long time.",
        ],
        notification: "the town lies abandoned, its citizens long dead",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "clinic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      clinic: {
        key: "clinic",
        text: [
          "a squat building up ahead.",
          "a green cross barely visible behind grimy windows.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "madman" },
          },
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
      madman: {
        key: "madman",
        text: [],
        notification: "a madman attacks, screeching.",
        combat: originalSetpieceCombatDefinitions["town-madman"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "ransacked" },
          },
        ],
      },
      ransacked: {
        key: "ransacked",
        text: [
          "the clinic has been ransacked.",
          "only dust and stains remain.",
        ],
        onLoad: (context) => {
          context.setState("game.world.townClinicMadmanCleared", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave town",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-old-tower",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "empty-streets" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "empty-streets": {
        key: "empty-streets",
        text: [
          "the streets are empty.",
          "the air is filled with dust, driven relentlessly by the hard winds.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "tower" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      tower: {
        key: "tower",
        text: [
          "the old tower seems mostly intact.",
          "the shell of a burned out car blocks the entrance.",
          "most of the windows at ground level are busted anyway.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "thug" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      thug: {
        key: "thug",
        text: [],
        notification: "a thug is waiting on the other side of the wall.",
        combat: originalSetpieceCombatDefinitions["city-thug"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "bird" },
          },
        ],
      },
      bird: {
        key: "bird",
        text: [],
        notification: "a large bird nests at the top of the stairs.",
        combat: originalSetpieceCombatDefinitions["city-bird"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "nest" },
          },
        ],
      },
      nest: {
        key: "nest",
        text: [
          "bird must have liked shiney things.",
          "some good stuff woven into its nest.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityOldTowerCleared", true);
        },
        loot: {
          bullets: { min: 5, max: 10, chance: 0.8 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          "alien alloy": { min: 1, max: 1, chance: 0.5 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-old-tower-scavenged",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "empty-streets" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "empty-streets": {
        key: "empty-streets",
        text: [
          "the streets are empty.",
          "the air is filled with dust, driven relentlessly by the hard winds.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "tower" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      tower: {
        key: "tower",
        text: [
          "the old tower seems mostly intact.",
          "the shell of a burned out car blocks the entrance.",
          "most of the windows at ground level are busted anyway.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "thug" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      thug: {
        key: "thug",
        text: [],
        notification: "a thug is waiting on the other side of the wall.",
        combat: originalSetpieceCombatDefinitions["city-thug"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "bird" },
          },
        ],
      },
      bird: {
        key: "bird",
        text: [],
        notification: "a large bird nests at the top of the stairs.",
        combat: originalSetpieceCombatDefinitions["city-bird"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "scavenged" },
          },
        ],
      },
      scavenged: {
        key: "scavenged",
        text: [
          "not much here.",
          "scavengers must have gotten to this place already.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityOldTowerScavengedCleared", true);
        },
        loot: {
          torch: { min: 1, max: 5, chance: 0.8 },
          "cured meat": { min: 1, max: 5, chance: 0.5 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-old-tower-thug-rubble",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "empty-streets" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "empty-streets": {
        key: "empty-streets",
        text: [
          "the streets are empty.",
          "the air is filled with dust, driven relentlessly by the hard winds.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "tower" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      tower: {
        key: "tower",
        text: [
          "the old tower seems mostly intact.",
          "the shell of a burned out car blocks the entrance.",
          "most of the windows at ground level are busted anyway.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "thug" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      thug: {
        key: "thug",
        text: [],
        notification: "a thug is waiting on the other side of the wall.",
        combat: originalSetpieceCombatDefinitions["city-thug"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "rubble" },
          },
        ],
      },
      rubble: {
        key: "rubble",
        text: [
          "the debris is denser here.",
          "maybe some useful stuff in the rubble.",
        ],
        loot: {
          bullets: { min: 1, max: 5, chance: 0.5 },
          steel: { min: 1, max: 10, chance: 0.8 },
          "alien alloy": { min: 1, max: 1, chance: 0.01 },
          cloth: { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "scavenged" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      scavenged: {
        key: "scavenged",
        text: [
          "not much here.",
          "scavengers must have gotten to this place already.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityOldTowerThugRubbleCleared", true);
        },
        loot: {
          torch: { min: 1, max: 5, chance: 0.8 },
          "cured meat": { min: 1, max: 5, chance: 0.5 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-old-tower-rubble",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "empty-streets" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "empty-streets": {
        key: "empty-streets",
        text: [
          "the streets are empty.",
          "the air is filled with dust, driven relentlessly by the hard winds.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "tower" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      tower: {
        key: "tower",
        text: [
          "the old tower seems mostly intact.",
          "the shell of a burned out car blocks the entrance.",
          "most of the windows at ground level are busted anyway.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "beast" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      beast: {
        key: "beast",
        text: [],
        notification: "a snarling beast jumps out from behind a car.",
        combat: originalSetpieceCombatDefinitions["city-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "rubble" },
          },
        ],
      },
      rubble: {
        key: "rubble",
        text: [
          "the debris is denser here.",
          "maybe some useful stuff in the rubble.",
        ],
        loot: {
          bullets: { min: 1, max: 5, chance: 0.5 },
          steel: { min: 1, max: 10, chance: 0.8 },
          "alien alloy": { min: 1, max: 1, chance: 0.01 },
          cloth: { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "scavenged" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      scavenged: {
        key: "scavenged",
        text: [
          "not much here.",
          "scavengers must have gotten to this place already.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityOldTowerRubbleCleared", true);
        },
        loot: {
          torch: { min: 1, max: 5, chance: 0.8 },
          "cured meat": { min: 1, max: 5, chance: 0.5 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-sniper",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "street" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      street: {
        key: "street",
        text: [
          "orange traffic cones are set across the street, faded and cracked.",
          "lights flash through the alleys between buildings.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "sniper" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      sniper: {
        key: "sniper",
        text: [],
        notification: "the shot echoes in the empty street.",
        combat: originalSetpieceCombatDefinitions["city-sniper"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "street above the subway platform is blown away.",
          "lets some light down into the dusty haze.",
          "a sound comes from the tunnel, just ahead.",
        ],
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "corridors" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      corridors: {
        key: "corridors",
        text: [
          "empty corridors.",
          "the place has been swept clean by scavengers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "operating-theatre" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "operating-theatre": {
        key: "operating-theatre",
        text: [
          "someone has locked and barricaded the door to this operating theatre.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "stockpile" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      stockpile: {
        key: "stockpile",
        text: ["someone had been stockpiling loot here."],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityHospitalCleared", true);
        },
        loot: {
          "energy cell": { min: 1, max: 3, chance: 0.2 },
          medicine: { min: 3, max: 10, chance: 0.5 },
          bullets: { min: 2, max: 8, chance: 1 },
          torch: { min: 1, max: 3, chance: 0.5 },
          grenade: { min: 1, max: 1, chance: 0.5 },
          "alien alloy": { min: 1, max: 2, chance: 0.8 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-soldier-patrol",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "checkpoint" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "orange traffic cones are set across the street, faded and cracked.",
          "lights flash through the alleys between buildings.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "soldier" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      soldier: {
        key: "soldier",
        text: [],
        notification:
          "the soldier steps out from between the buildings, rifle raised.",
        combat: originalSetpieceCombatDefinitions["city-soldier"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "voices" },
          },
        ],
      },
      voices: {
        key: "voices",
        text: [
          "more voices can be heard ahead.",
          "they must be here for a reason.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "second-soldier" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "second-soldier": {
        key: "second-soldier",
        text: [],
        notification: "a second soldier opens fire.",
        combat: originalSetpieceCombatDefinitions["city-soldier"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "supplies" },
          },
        ],
      },
      supplies: {
        key: "supplies",
        text: [
          "searching the bodies yields a few supplies.",
          "more soldiers will be on their way.",
          "time to move on.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.citySoldierPatrolCleared", true);
        },
        loot: {
          rifle: { min: 1, max: 1, chance: 1 },
          bullets: { min: 1, max: 10, chance: 1 },
          "cured meat": { min: 1, max: 5, chance: 0.8 },
          medicine: { min: 1, max: 4, chance: 0.1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-commando-settlement",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "checkpoint" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "orange traffic cones are set across the street, faded and cracked.",
          "lights flash through the alleys between buildings.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "soldier" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      soldier: {
        key: "soldier",
        text: [],
        notification:
          "the soldier steps out from between the buildings, rifle raised.",
        combat: originalSetpieceCombatDefinitions["city-soldier"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "gunfire" },
          },
        ],
      },
      gunfire: {
        key: "gunfire",
        text: [
          "the sound of gunfire carries on the wind.",
          "the street ahead glows with firelight.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "commando" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      commando: {
        key: "commando",
        text: [],
        notification: "a masked soldier rounds the corner, gun drawn",
        combat: originalSetpieceCombatDefinitions["city-commando"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "burning-settlement" },
          },
        ],
      },
      "burning-settlement": {
        key: "burning-settlement",
        text: [
          "the small settlement has clearly been burning a while.",
          "the bodies of the wanderers that lived here are still visible in the flames.",
          "still time to rescue a few supplies.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityCommandoSettlementCleared", true);
        },
        loot: {
          "laser rifle": { min: 1, max: 1, chance: 0.5 },
          "energy cell": { min: 1, max: 5, chance: 0.5 },
          "cured meat": { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-subway",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "empty-streets" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "empty-streets": {
        key: "empty-streets",
        text: [
          "the streets are empty.",
          "the air is filled with dust, driven relentlessly by the hard winds.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "lizard" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      lizard: {
        key: "lizard",
        text: [],
        notification:
          "a huge lizard scrambles up out of the darkness of an old metro station.",
        combat: originalSetpieceCombatDefinitions["city-lizard"],
        buttons: [
          {
            key: "leave",
            text: "descend",
            nextScene: { 1: "subway-platform" },
          },
        ],
      },
      "subway-platform": {
        key: "subway-platform",
        text: [
          "street above the subway platform is blown away.",
          "lets some light down into the dusty haze.",
          "a sound comes from the tunnel, just ahead.",
        ],
        buttons: [
          {
            key: "enter",
            text: "investigate",
            cost: { torch: 1 },
            nextScene: { 1: "rats" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      rats: {
        key: "rats",
        text: [],
        notification: "a swarm of rats rushes up the tunnel.",
        combat: originalSetpieceCombatDefinitions["city-rats"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "battle-platform" },
          },
        ],
      },
      "battle-platform": {
        key: "battle-platform",
        text: [
          "the tunnel opens up at another platform.",
          "the walls are scorched from an old battle.",
          "bodies and supplies from both sides litter the ground.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.citySubwayCleared", true);
        },
        loot: {
          rifle: { min: 1, max: 1, chance: 0.8 },
          bullets: { min: 1, max: 5, chance: 0.8 },
          "laser rifle": { min: 1, max: 1, chance: 0.3 },
          "energy cell": { min: 1, max: 5, chance: 0.3 },
          "alien alloy": { min: 1, max: 1, chance: 0.3 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-subway-beast-rubble",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "empty-streets" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "empty-streets": {
        key: "empty-streets",
        text: [
          "the streets are empty.",
          "the air is filled with dust, driven relentlessly by the hard winds.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "lizard" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      lizard: {
        key: "lizard",
        text: [],
        notification:
          "a huge lizard scrambles up out of the darkness of an old metro station.",
        combat: originalSetpieceCombatDefinitions["city-lizard"],
        buttons: [
          {
            key: "leave",
            text: "descend",
            nextScene: { 1: "beast" },
          },
        ],
      },
      beast: {
        key: "beast",
        text: [],
        notification: "a snarling beast jumps out from behind a car.",
        combat: originalSetpieceCombatDefinitions["city-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "rubble" },
          },
        ],
      },
      rubble: {
        key: "rubble",
        text: [
          "the debris is denser here.",
          "maybe some useful stuff in the rubble.",
        ],
        loot: {
          bullets: { min: 1, max: 5, chance: 0.5 },
          steel: { min: 1, max: 10, chance: 0.8 },
          "alien alloy": { min: 1, max: 1, chance: 0.01 },
          cloth: { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "scavenged" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      scavenged: {
        key: "scavenged",
        text: [
          "not much here.",
          "scavengers must have gotten to this place already.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.citySubwayBeastRubbleCleared", true);
        },
        loot: {
          torch: { min: 1, max: 5, chance: 0.8 },
          "cured meat": { min: 1, max: 5, chance: 0.5 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-commando-supplies",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "checkpoint" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "orange traffic cones are set across the street, faded and cracked.",
          "lights flash through the alleys between buildings.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "soldier" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      soldier: {
        key: "soldier",
        text: [],
        notification:
          "the soldier steps out from between the buildings, rifle raised.",
        combat: originalSetpieceCombatDefinitions["city-soldier"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "gunfire" },
          },
        ],
      },
      gunfire: {
        key: "gunfire",
        text: [
          "the sound of gunfire carries on the wind.",
          "the street ahead glows with firelight.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "commando" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      commando: {
        key: "commando",
        text: [],
        notification: "a masked soldier rounds the corner, gun drawn",
        combat: originalSetpieceCombatDefinitions["city-commando"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "supplies" },
          },
        ],
      },
      supplies: {
        key: "supplies",
        text: [
          "searching the bodies yields a few supplies.",
          "more soldiers will be on their way.",
          "time to move on.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityCommandoSuppliesCleared", true);
        },
        loot: {
          rifle: { min: 1, max: 1, chance: 1 },
          bullets: { min: 1, max: 10, chance: 1 },
          "cured meat": { min: 1, max: 5, chance: 0.8 },
          medicine: { min: 1, max: 4, chance: 0.1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-military-camp",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "checkpoint" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "orange traffic cones are set across the street, faded and cracked.",
          "lights flash through the alleys between buildings.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "sniper" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      sniper: {
        key: "sniper",
        text: [],
        notification: "the shot echoes in the empty street.",
        combat: originalSetpieceCombatDefinitions["city-sniper"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "camp" },
          },
        ],
      },
      camp: {
        key: "camp",
        text: [
          "looks like a camp of sorts up ahead.",
          "rusted chainlink is pulled across an alleyway.",
          "fires burn in the courtyard beyond.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "veteran" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      veteran: {
        key: "veteran",
        text: [],
        notification: "a large man attacks, waving a bayonet.",
        combat: originalSetpieceCombatDefinitions["city-veteran"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "outpost" },
          },
        ],
      },
      outpost: {
        key: "outpost",
        text: [
          "the small military outpost is well supplied.",
          "arms and munitions, relics from the war, are neatly arranged on the store-room floor.",
          "just as deadly now as they were then.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityMilitaryCampCleared", true);
        },
        loot: {
          rifle: { min: 1, max: 1, chance: 1 },
          bullets: { min: 1, max: 10, chance: 1 },
          grenade: { min: 1, max: 5, chance: 0.8 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-military-camp-supplies",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "checkpoint" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "orange traffic cones are set across the street, faded and cracked.",
          "lights flash through the alleys between buildings.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "sniper" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      sniper: {
        key: "sniper",
        text: [],
        notification: "the shot echoes in the empty street.",
        combat: originalSetpieceCombatDefinitions["city-sniper"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "camp" },
          },
        ],
      },
      camp: {
        key: "camp",
        text: [
          "looks like a camp of sorts up ahead.",
          "rusted chainlink is pulled across an alleyway.",
          "fires burn in the courtyard beyond.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "veteran" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      veteran: {
        key: "veteran",
        text: [],
        notification: "a large man attacks, waving a bayonet.",
        combat: originalSetpieceCombatDefinitions["city-veteran"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "supplies" },
          },
        ],
      },
      supplies: {
        key: "supplies",
        text: [
          "searching the bodies yields a few supplies.",
          "more soldiers will be on their way.",
          "time to move on.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityMilitaryCampSuppliesCleared", true);
        },
        loot: {
          rifle: { min: 1, max: 1, chance: 1 },
          bullets: { min: 1, max: 10, chance: 1 },
          "cured meat": { min: 1, max: 5, chance: 0.8 },
          medicine: { min: 1, max: 4, chance: 0.1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-subway-scavenged",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "empty-streets" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "empty-streets": {
        key: "empty-streets",
        text: [
          "the streets are empty.",
          "the air is filled with dust, driven relentlessly by the hard winds.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "lizard" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      lizard: {
        key: "lizard",
        text: [],
        notification:
          "a huge lizard scrambles up out of the darkness of an old metro station.",
        combat: originalSetpieceCombatDefinitions["city-lizard"],
        buttons: [
          {
            key: "leave",
            text: "descend",
            nextScene: { 1: "subway-platform" },
          },
        ],
      },
      "subway-platform": {
        key: "subway-platform",
        text: [
          "street above the subway platform is blown away.",
          "lets some light down into the dusty haze.",
          "a sound comes from the tunnel, just ahead.",
        ],
        buttons: [
          {
            key: "enter",
            text: "investigate",
            cost: { torch: 1 },
            nextScene: { 1: "rats" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      rats: {
        key: "rats",
        text: [],
        notification: "a swarm of rats rushes up the tunnel.",
        combat: originalSetpieceCombatDefinitions["city-rats"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "scavenged" },
          },
        ],
      },
      scavenged: {
        key: "scavenged",
        text: [
          "not much here.",
          "scavengers must have gotten to this place already.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.citySubwayScavengedCleared", true);
        },
        loot: {
          torch: { min: 1, max: 5, chance: 0.8 },
          "cured meat": { min: 1, max: 5, chance: 0.5 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-shanty-market",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "shanty-town" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "shanty-town": {
        key: "shanty-town",
        text: [
          "a large shanty town sprawls across the streets.",
          "faces, darkened by soot and blood, stare out from crooked huts.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "frail-man" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "frail-man": {
        key: "frail-man",
        text: [],
        notification: "a frail man stands defiantly, blocking the path.",
        combat: originalSetpieceCombatDefinitions["city-frail-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "shop" },
          },
        ],
      },
      shop: {
        key: "shop",
        text: [
          "an improvised shop is set up on the sidewalk.",
          "the owner stands by, stoic.",
        ],
        loot: {
          "steel sword": { min: 1, max: 1, chance: 0.8 },
          rifle: { min: 1, max: 1, chance: 0.5 },
          bullets: { min: 1, max: 8, chance: 0.25 },
          "alien alloy": { min: 1, max: 1, chance: 0.01 },
          medicine: { min: 1, max: 4, chance: 0.5 },
        },
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "youth" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      youth: {
        key: "youth",
        text: [],
        notification: "a youth lashes out with a tree branch.",
        combat: originalSetpieceCombatDefinitions["city-youth"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "canvas-sack" },
          },
        ],
      },
      "canvas-sack": {
        key: "canvas-sack",
        text: [
          "the young settler was carrying a canvas sack.",
          "it contains travelling gear, and a few trinkets.",
          "there's nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityShantyMarketCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 1, chance: 0.8 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          "cured meat": { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-drying-hut",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "shanty-town" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "shanty-town": {
        key: "shanty-town",
        text: [
          "a large shanty town sprawls across the streets.",
          "faces, darkened by soot and blood, stare out from crooked huts.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "broken-people" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "broken-people": {
        key: "broken-people",
        text: [
          "nothing but downcast eyes.",
          "the people here were broken a long time ago.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "drying-meat" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "drying-meat": {
        key: "drying-meat",
        text: [
          "strips of meat hang drying by the side of the street.",
          "the people back away, avoiding eye contact.",
        ],
        loot: {
          "cured meat": { min: 5, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "squatter" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      squatter: {
        key: "squatter",
        text: [],
        notification: "a squatter stands firmly in the doorway of a small hut.",
        combat: originalSetpieceCombatDefinitions["city-squatter"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "hut" },
          },
        ],
      },
      hut: {
        key: "hut",
        text: [
          "inside the hut, a child cries.",
          "a few belongings rest against the walls.",
          "there's nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityDryingHutCleared", true);
        },
        loot: {
          rifle: { min: 1, max: 1, chance: 0.8 },
          bullets: { min: 1, max: 5, chance: 0.8 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          "alien alloy": { min: 1, max: 1, chance: 0.2 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-drying-hut-sack",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "shanty-town" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "shanty-town": {
        key: "shanty-town",
        text: [
          "a large shanty town sprawls across the streets.",
          "faces, darkened by soot and blood, stare out from crooked huts.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "broken-people" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "broken-people": {
        key: "broken-people",
        text: [
          "nothing but downcast eyes.",
          "the people here were broken a long time ago.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "drying-meat" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "drying-meat": {
        key: "drying-meat",
        text: [
          "strips of meat hang drying by the side of the street.",
          "the people back away, avoiding eye contact.",
        ],
        loot: {
          "cured meat": { min: 5, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "squatter" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      squatter: {
        key: "squatter",
        text: [],
        notification: "a squatter stands firmly in the doorway of a small hut.",
        combat: originalSetpieceCombatDefinitions["city-squatter"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "canvas-sack" },
          },
        ],
      },
      "canvas-sack": {
        key: "canvas-sack",
        text: [
          "the young settler was carrying a canvas sack.",
          "it contains travelling gear, and a few trinkets.",
          "there's nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityDryingHutSackCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 1, chance: 0.8 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          "cured meat": { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-shanty-crowd",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "shanty-town" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "shanty-town": {
        key: "shanty-town",
        text: [
          "a large shanty town sprawls across the streets.",
          "faces, darkened by soot and blood, stare out from crooked huts.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "frail-man" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "frail-man": {
        key: "frail-man",
        text: [],
        notification: "a frail man stands defiantly, blocking the path.",
        combat: originalSetpieceCombatDefinitions["city-frail-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "crowd" },
          },
        ],
      },
      crowd: {
        key: "crowd",
        text: [
          "more squatters are crowding around now.",
          "someone throws a stone.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "squatters" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      squatters: {
        key: "squatters",
        text: [],
        notification: "the crowd surges forward.",
        combat: originalSetpieceCombatDefinitions["city-crowd-squatters"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "belongings" },
          },
        ],
      },
      belongings: {
        key: "belongings",
        text: [
          "the remaining settlers flee from the violence, their belongings forgotten.",
          "there's not much, but some useful things can still be found.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityShantyCrowdCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 1, chance: 0.8 },
          "energy cell": { min: 1, max: 5, chance: 0.5 },
          "cured meat": { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-shanty-crowd-sack",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "shanty-town" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "shanty-town": {
        key: "shanty-town",
        text: [
          "a large shanty town sprawls across the streets.",
          "faces, darkened by soot and blood, stare out from crooked huts.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "frail-man" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "frail-man": {
        key: "frail-man",
        text: [],
        notification: "a frail man stands defiantly, blocking the path.",
        combat: originalSetpieceCombatDefinitions["city-frail-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "crowd" },
          },
        ],
      },
      crowd: {
        key: "crowd",
        text: [
          "more squatters are crowding around now.",
          "someone throws a stone.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "squatters" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      squatters: {
        key: "squatters",
        text: [],
        notification: "the crowd surges forward.",
        combat: originalSetpieceCombatDefinitions["city-crowd-squatters"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "canvas-sack" },
          },
        ],
      },
      "canvas-sack": {
        key: "canvas-sack",
        text: [
          "the young settler was carrying a canvas sack.",
          "it contains travelling gear, and a few trinkets.",
          "there's nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityShantyCrowdSackCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 1, chance: 0.8 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          "cured meat": { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-drying-meat-youth",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "shanty-town" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "shanty-town": {
        key: "shanty-town",
        text: [
          "a large shanty town sprawls across the streets.",
          "faces, darkened by soot and blood, stare out from crooked huts.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "broken-people" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "broken-people": {
        key: "broken-people",
        text: [
          "nothing but downcast eyes.",
          "the people here were broken a long time ago.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "drying-meat" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "drying-meat": {
        key: "drying-meat",
        text: [
          "strips of meat hang drying by the side of the street.",
          "the people back away, avoiding eye contact.",
        ],
        loot: {
          "cured meat": { min: 5, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "youth" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      youth: {
        key: "youth",
        text: [],
        notification: "a youth lashes out with a tree branch.",
        combat: originalSetpieceCombatDefinitions["city-youth"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "canvas-sack" },
          },
        ],
      },
      "canvas-sack": {
        key: "canvas-sack",
        text: [
          "the young settler was carrying a canvas sack.",
          "it contains travelling gear, and a few trinkets.",
          "there's nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityDryingMeatYouthCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 1, chance: 0.8 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          "cured meat": { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-shanty-crowd-youth",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "shanty-town" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "shanty-town": {
        key: "shanty-town",
        text: [
          "a large shanty town sprawls across the streets.",
          "faces, darkened by soot and blood, stare out from crooked huts.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "frail-man" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "frail-man": {
        key: "frail-man",
        text: [],
        notification: "a frail man stands defiantly, blocking the path.",
        combat: originalSetpieceCombatDefinitions["city-frail-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "crowd" },
          },
        ],
      },
      crowd: {
        key: "crowd",
        text: [
          "more squatters are crowding around now.",
          "someone throws a stone.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "youth" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      youth: {
        key: "youth",
        text: [],
        notification: "a youth lashes out with a tree branch.",
        combat: originalSetpieceCombatDefinitions["city-youth"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "canvas-sack" },
          },
        ],
      },
      "canvas-sack": {
        key: "canvas-sack",
        text: [
          "the young settler was carrying a canvas sack.",
          "it contains travelling gear, and a few trinkets.",
          "there's nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityShantyCrowdYouthCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 1, chance: 0.8 },
          bolas: { min: 1, max: 5, chance: 0.5 },
          "cured meat": { min: 1, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital-medicine",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "old-man" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "old-man": {
        key: "old-man",
        text: [],
        notification: "an old man bursts through a door, wielding a scalpel.",
        combat: originalSetpieceCombatDefinitions["city-old-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "dried-meat" },
          },
        ],
      },
      "dried-meat": {
        key: "dried-meat",
        text: ["strips of meat are hung up to dry in this ward."],
        loot: {
          "cured meat": { min: 3, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "medicine-cabinet" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "medicine-cabinet": {
        key: "medicine-cabinet",
        text: [
          "a pristine medicine cabinet at the end of a hallway.",
          "the rest of the hospital is empty.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityHospitalMedicineCleared", true);
        },
        loot: {
          "energy cell": { min: 1, max: 1, chance: 0.2 },
          medicine: { min: 3, max: 10, chance: 1 },
          teeth: { min: 1, max: 2, chance: 0.2 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital-cache",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "old-man" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "old-man": {
        key: "old-man",
        text: [],
        notification: "an old man bursts through a door, wielding a scalpel.",
        combat: originalSetpieceCombatDefinitions["city-old-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cache" },
          },
        ],
      },
      cache: {
        key: "cache",
        text: ["the old man had a small cache of interesting items."],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityHospitalCacheCleared", true);
        },
        loot: {
          "alien alloy": { min: 1, max: 1, chance: 0.8 },
          medicine: { min: 1, max: 4, chance: 1 },
          "cured meat": { min: 3, max: 7, chance: 1 },
          bolas: { min: 1, max: 3, chance: 0.5 },
          fur: { min: 1, max: 5, chance: 0.8 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital-old-man-theatres",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "old-man" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "old-man": {
        key: "old-man",
        text: [],
        notification: "an old man bursts through a door, wielding a scalpel.",
        combat: originalSetpieceCombatDefinitions["city-old-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "dried-meat" },
          },
        ],
      },
      "dried-meat": {
        key: "dried-meat",
        text: ["strips of meat are hung up to dry in this ward."],
        loot: {
          "cured meat": { min: 3, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "operating-theatres" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "operating-theatres": {
        key: "operating-theatres",
        text: [
          "the stench of rot and death fills the operating theatres.",
          "a few items are scattered on the ground.",
          "there is nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState(
            "game.world.cityHospitalOldManTheatresCleared",
            true,
          );
        },
        loot: {
          "energy cell": { min: 1, max: 1, chance: 0.3 },
          medicine: { min: 1, max: 5, chance: 0.3 },
          teeth: { min: 3, max: 8, chance: 1 },
          scales: { min: 4, max: 7, chance: 0.9 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital-old-man-squatters",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "old-man" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "old-man": {
        key: "old-man",
        text: [],
        notification: "an old man bursts through a door, wielding a scalpel.",
        combat: originalSetpieceCombatDefinitions["city-old-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "squatters" },
          },
        ],
      },
      squatters: {
        key: "squatters",
        text: [],
        notification:
          "a tribe of elderly squatters is camped out in this ward.",
        combat: originalSetpieceCombatDefinitions["city-squatters"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "operating-theatres" },
          },
        ],
      },
      "operating-theatres": {
        key: "operating-theatres",
        text: [
          "the stench of rot and death fills the operating theatres.",
          "a few items are scattered on the ground.",
          "there is nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState(
            "game.world.cityHospitalOldManSquattersCleared",
            true,
          );
        },
        loot: {
          "energy cell": { min: 1, max: 1, chance: 0.3 },
          medicine: { min: 1, max: 5, chance: 0.3 },
          teeth: { min: 3, max: 8, chance: 1 },
          scales: { min: 4, max: 7, chance: 0.9 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital-ward",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "corridors" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      corridors: {
        key: "corridors",
        text: [
          "empty corridors.",
          "the place has been swept clean by scavengers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "lizards" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      lizards: {
        key: "lizards",
        text: [],
        notification: "a pack of lizards rounds the corner.",
        combat: originalSetpieceCombatDefinitions["city-lizards"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "operating-theatres" },
          },
        ],
      },
      "operating-theatres": {
        key: "operating-theatres",
        text: [
          "the stench of rot and death fills the operating theatres.",
          "a few items are scattered on the ground.",
          "there is nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityHospitalWardCleared", true);
        },
        loot: {
          "energy cell": { min: 1, max: 1, chance: 0.3 },
          medicine: { min: 1, max: 5, chance: 0.3 },
          teeth: { min: 3, max: 8, chance: 1 },
          scales: { min: 4, max: 7, chance: 0.9 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital-squatters",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "corridors" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      corridors: {
        key: "corridors",
        text: [
          "empty corridors.",
          "the place has been swept clean by scavengers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "squatters" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      squatters: {
        key: "squatters",
        text: [],
        notification:
          "a tribe of elderly squatters is camped out in this ward.",
        combat: originalSetpieceCombatDefinitions["city-squatters"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "operating-theatres" },
          },
        ],
      },
      "operating-theatres": {
        key: "operating-theatres",
        text: [
          "the stench of rot and death fills the operating theatres.",
          "a few items are scattered on the ground.",
          "there is nothing else here.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityHospitalSquattersCleared", true);
        },
        loot: {
          "energy cell": { min: 1, max: 1, chance: 0.3 },
          medicine: { min: 1, max: 5, chance: 0.3 },
          teeth: { min: 3, max: 8, chance: 1 },
          scales: { min: 4, max: 7, chance: 0.9 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital-deformed",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "corridors" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      corridors: {
        key: "corridors",
        text: [
          "empty corridors.",
          "the place has been swept clean by scavengers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "operating-theatre" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "operating-theatre": {
        key: "operating-theatre",
        text: [
          "someone has locked and barricaded the door to this operating theatre.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "deformed" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      deformed: {
        key: "deformed",
        text: [],
        notification: "behind the door, a deformed figure awakes and attacks.",
        combat: originalSetpieceCombatDefinitions["city-deformed"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "equipment" },
          },
        ],
      },
      equipment: {
        key: "equipment",
        text: [
          "the warped man lies dead.",
          "the operating theatre has a lot of curious equipment.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityHospitalDeformedCleared", true);
        },
        loot: {
          "energy cell": { min: 2, max: 5, chance: 0.8 },
          medicine: { min: 3, max: 12, chance: 1 },
          cloth: { min: 1, max: 3, chance: 0.5 },
          steel: { min: 2, max: 3, chance: 0.3 },
          "alien alloy": { min: 1, max: 1, chance: 0.3 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.city-hospital-tentacles",
    title: "A Ruined City",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a battered highway sign stands guard at the entrance to this once-great city.",
          "the towers that haven't crumbled jut from the landscape like the ribcage of some ancient beast.",
          "might be things worth having still inside.",
        ],
        notification: "the towers of a decaying city dominate the skyline",
        buttons: [
          {
            key: "enter",
            text: "explore",
            nextScene: { 1: "hospital" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      hospital: {
        key: "hospital",
        text: ["the shell of an abandoned hospital looms ahead."],
        buttons: [
          {
            key: "enter",
            text: "enter",
            cost: { torch: 1 },
            nextScene: { 1: "corridors" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      corridors: {
        key: "corridors",
        text: [
          "empty corridors.",
          "the place has been swept clean by scavengers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "operating-theatre" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      "operating-theatre": {
        key: "operating-theatre",
        text: [
          "someone has locked and barricaded the door to this operating theatre.",
        ],
        buttons: [
          {
            key: "enter",
            text: "continue",
            nextScene: { 1: "tentacles" },
          },
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
      tentacles: {
        key: "tentacles",
        text: [],
        notification:
          "as soon as the door is open a little bit, hundreds of tentacles erupt.",
        combat: originalSetpieceCombatDefinitions["city-tentacles"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "victims" },
          },
        ],
      },
      victims: {
        key: "victims",
        text: [
          "the tentacular horror is defeated.",
          "inside, the remains of its victims are everywhere.",
        ],
        onLoad: (context) => {
          context.setState("game.cityCleared", true);
          context.setState("game.world.cityHospitalTentaclesCleared", true);
        },
        loot: {
          "steel sword": { min: 1, max: 3, chance: 0.5 },
          rifle: { min: 1, max: 2, chance: 0.3 },
          teeth: { min: 2, max: 8, chance: 1 },
          cloth: { min: 3, max: 6, chance: 0.5 },
          "alien alloy": { min: 1, max: 1, chance: 0.1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave city",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.sulphurmine",
    title: "The Sulphur Mine",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the military is already set up at the mine's entrance.",
          "soldiers patrol the perimeter, rifles slung over their shoulders.",
        ],
        notification: "a military perimeter is set up around the mine.",
        buttons: [
          {
            key: "enter",
            text: "attack",
            nextScene: { 1: "a1" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      a1: {
        key: "a1",
        text: [],
        notification: "a soldier, alerted, opens fire.",
        combat: originalSetpieceCombatDefinitions["city-soldier"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "a2" },
          },
        ],
      },
      a2: {
        key: "a2",
        text: [],
        notification: "a second soldier joins the fight.",
        combat: originalSetpieceCombatDefinitions["city-soldier"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "a3" },
          },
        ],
      },
      a3: {
        key: "a3",
        text: [],
        notification: "a grizzled soldier attacks, waving a bayonet.",
        combat: originalSetpieceCombatDefinitions["sulphurmine-veteran"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the military presence has been cleared.",
          "the mine is now safe for workers.",
        ],
        notification: "the sulphur mine is clear of dangers",
        onLoad: (context) => {
          context.setState("game.world.sulphurmine", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.coalmine",
    title: "The Coal Mine",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "camp fires burn by the entrance to the mine.",
          "men mill about, weapons at the ready.",
        ],
        notification: "this old mine is not abandoned",
        buttons: [
          {
            key: "enter",
            text: "attack",
            nextScene: { 1: "a1" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      a1: {
        key: "a1",
        text: [],
        notification: "a man joins the fight",
        combat: originalSetpieceCombatDefinitions["coalmine-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "a2" },
          },
        ],
      },
      a2: {
        key: "a2",
        text: [],
        notification: "a man joins the fight",
        combat: originalSetpieceCombatDefinitions["coalmine-man"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "a3" },
          },
        ],
      },
      a3: {
        key: "a3",
        text: [],
        notification: "only the chief remains.",
        combat: originalSetpieceCombatDefinitions["coalmine-chief"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the camp is still, save for the crackling of the fires.",
          "the mine is now safe for workers.",
        ],
        notification: "the coal mine is clear of dangers",
        onLoad: (context) => {
          context.setState("game.world.coalmine", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "setpiece.ironmine",
    title: "The Iron Mine",
    pool: "setpiece",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "an old iron mine sits here, tools abandoned and left to rust.",
          "bleached bones are strewn about the entrance. many, deeply scored with jagged grooves.",
          "feral howls echo out of the darkness.",
        ],
        notification: "the path leads to an abandoned mine",
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "enter" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      enter: {
        key: "enter",
        text: [],
        notification:
          "a large creature lunges, muscles rippling in the torchlight",
        combat: originalSetpieceCombatDefinitions["ironmine-matriarch"],
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: ["the beast is dead.", "the mine is now safe for workers."],
        notification: "the iron mine is clear of dangers",
        onLoad: (context) => {
          context.setState("game.world.ironmine", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
];

const originalExecutionerDefinitions: OriginalEventDefinition[] = [
  {
    key: "executioner.intro-defences",
    title: "A Ravaged Battleship",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        notification: "the remains of a huge ship are embedded in the earth.",
        text: [
          "the remains of a massive battleship lie here, like a silent sealed city.",
          "it lists to the side in a deep crevasse, cut when it fell from the sky.",
          "the hatches are all sealed, but the hull is blown out just above the dirt, providing an entrance.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "corridor" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      corridor: {
        key: "corridor",
        text: [
          "the interior of the ship is cold and dark. what little light there is only accentuates its harsh angles.",
          "the walls hum faintly.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "beast-approach" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "beast-approach": {
        key: "beast-approach",
        text: [
          "the partially devoured remains of several wanderers are piled before a dark corridor.",
          "shuffling noises can be heard from within.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "beast" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      beast: {
        key: "beast",
        text: [],
        notification: "an ancient beast has made these ruins its home.",
        combat: originalExecutionerCombatDefinitions["ancient-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "maintenance-panel" },
          },
        ],
      },
      "maintenance-panel": {
        key: "maintenance-panel",
        text: [
          "a maintenance panel is embedded in the wall next to a large sealed door.",
          "perhaps the ship's systems are still operational.",
        ],
        buttons: [
          {
            key: "power",
            text: "power cycle",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification:
          "as the lights come online, so too do the defence systems.",
        combat: originalExecutionerCombatDefinitions["automated-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "device" },
          },
        ],
      },
      device: {
        key: "device",
        text: [
          "beyond the bulkhead is a small antechamber, seemingly untouched by scavengers.",
          "a large hatch grinds open, and the wind rushes in.",
          "a strange device sits on the floor. looks important.",
        ],
        onLoad: (context) => {
          context.setState("game.world.executioner", true);
        },
        buttons: [
          {
            key: "leave",
            text: "take device and leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.command-wanderer",
    title: "Command Deck",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
          "in a flash, the figure is standing.",
        ],
        buttons: [
          {
            key: "approach",
            text: "approach",
            nextScene: { 1: "observe" },
          },
        ],
      },
      observe: {
        key: "observe",
        text: [
          "wanderer form, but not quite flesh. not quite metal either. a crystal set into its chest pulses with light.",
          "it says it saw the rebellion coming. said it made arrangements.",
          "says it can't die.",
        ],
        buttons: [
          {
            key: "observe",
            text: "observe",
            nextScene: { 1: "wanderer" },
          },
        ],
      },
      wanderer: {
        key: "wanderer",
        text: [],
        notification: "the immortal wanderer attacks.",
        combat: originalExecutionerCombatDefinitions["immortal-wanderer"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the crystal pulses brightly, then goes dark. the assailant shimmers as its shape becomes less defined.",
          "then it is gone.",
          "time to get out of here.",
        ],
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.command-lounge-cache",
    title: "Command Deck",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the path to the command bridge is wide, walls adorned with decorative shields.",
          "fighting hadn't reached here, it seems.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "lounge" },
          },
        ],
      },
      lounge: {
        key: "lounge",
        text: [
          "detour through the officer's lounge.",
          "might be something useful here.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "weapons-cache" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "weapons-cache": {
        key: "weapons-cache",
        text: ["small weapons cache in a cabinet.", "lucky."],
        loot: {
          "energy cell": { min: 3, max: 10, chance: 1 },
          grenade: { min: 1, max: 5, chance: 0.8 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "command-deck" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "command-deck": {
        key: "command-deck",
        text: [
          "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
          "in a flash, the figure is standing.",
        ],
        buttons: [
          {
            key: "approach",
            text: "approach",
            nextScene: { 1: "observe" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      observe: {
        key: "observe",
        text: [
          "wanderer form, but not quite flesh. not quite metal either. a crystal set into its chest pulses with light.",
          "it says it saw the rebellion coming. said it made arrangements.",
          "says it can't die.",
        ],
        buttons: [
          {
            key: "observe",
            text: "observe",
            nextScene: { 1: "wanderer" },
          },
        ],
      },
      wanderer: {
        key: "wanderer",
        text: [],
        notification: "the immortal wanderer attacks.",
        combat: originalExecutionerCombatDefinitions["immortal-wanderer"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the crystal pulses brightly, then goes dark. the assailant shimmers as its shape becomes less defined.",
          "then it is gone.",
          "time to get out of here.",
        ],
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.command-lounge-medicine",
    title: "Command Deck",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the path to the command bridge is wide, walls adorned with decorative shields.",
          "fighting hadn't reached here, it seems.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "lounge" },
          },
        ],
      },
      lounge: {
        key: "lounge",
        text: [
          "detour through the officer's lounge.",
          "might be something useful here.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "medical-supplies" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "medical-supplies": {
        key: "medical-supplies",
        text: ["found some medical supplies in a discarded bag."],
        loot: {
          hypo: { min: 1, max: 3, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "command-deck" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "command-deck": {
        key: "command-deck",
        text: [
          "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
          "in a flash, the figure is standing.",
        ],
        buttons: [
          {
            key: "approach",
            text: "approach",
            nextScene: { 1: "observe" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      observe: {
        key: "observe",
        text: [
          "wanderer form, but not quite flesh. not quite metal either. a crystal set into its chest pulses with light.",
          "it says it saw the rebellion coming. said it made arrangements.",
          "says it can't die.",
        ],
        buttons: [
          {
            key: "observe",
            text: "observe",
            nextScene: { 1: "wanderer" },
          },
        ],
      },
      wanderer: {
        key: "wanderer",
        text: [],
        notification: "the immortal wanderer attacks.",
        combat: originalExecutionerCombatDefinitions["immortal-wanderer"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the crystal pulses brightly, then goes dark. the assailant shimmers as its shape becomes less defined.",
          "then it is gone.",
          "time to get out of here.",
        ],
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.antechamber",
    title: "A Ravaged Battleship",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "a large hatch opens into a wide corridor.",
          "the corridor leads to a bank of elevators, which appear to be functional.",
        ],
        buttons: [
          {
            key: "engineering",
            text: "engineering",
            available: (context) =>
              context.readNumber("game.world.engineering") < 1,
            nextEvent: {
              0.3: "executioner.engineering-assembly-loot",
              0.7: "executioner.engineering-engine-room",
              1: "executioner.engineering-fire-guard-post",
            },
          },
          {
            key: "medical",
            text: "medical",
            available: (context) =>
              context.readNumber("game.world.medical") < 1,
            nextEvent: "executioner.medical-checkpoint",
          },
          {
            key: "martial",
            text: "martial",
            available: (context) =>
              context.readNumber("game.world.martial") < 1,
            nextEvent: {
              0.3: "executioner.martial-armory-blast",
              0.6: "executioner.martial-right-cabins-blueprint",
              1: "executioner.martial-scrap-blueprint",
            },
          },
          {
            key: "command",
            text: "command deck",
            available: (context) =>
              context.readNumber("game.world.engineering") >= 1 &&
              context.readNumber("game.world.medical") >= 1 &&
              context.readNumber("game.world.martial") >= 1,
            nextEvent: "executioner.command-wanderer",
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.intro-webs",
    title: "A Ravaged Battleship",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        notification: "the remains of a huge ship are embedded in the earth.",
        text: [
          "the remains of a massive battleship lie here, like a silent sealed city.",
          "it lists to the side in a deep crevasse, cut when it fell from the sky.",
          "the hatches are all sealed, but the hull is blown out just above the dirt, providing an entrance.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "corridor" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      corridor: {
        key: "corridor",
        text: [
          "the interior of the ship is cold and dark. what little light there is only accentuates its harsh angles.",
          "the walls hum faintly.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "webbing" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      webbing: {
        key: "webbing",
        text: [
          "thick, sticky webbing covers the walls of the corridor.",
          "deeper into the ship, the darkness seems almost to writhe.",
          "a small knapsack hangs from a cluster of webs, a few feet from the floor.",
        ],
        loot: {
          "cured meat": { min: 1, max: 5, chance: 0.8 },
          bullets: { min: 1, max: 5, chance: 0.5 },
          "energy cell": { min: 1, max: 5, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "horror" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      horror: {
        key: "horror",
        text: [],
        notification:
          "a huge arthropod lunges from the shadows, its mandibles thrashing.",
        combat: originalExecutionerCombatDefinitions["chitinous-horror"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "queen" },
          },
        ],
      },
      queen: {
        key: "queen",
        text: [],
        notification: "the webs part, and a grotesque insect lurches forward.",
        combat: originalExecutionerCombatDefinitions["chitinous-queen"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "maintenance-panel" },
          },
        ],
      },
      "maintenance-panel": {
        key: "maintenance-panel",
        text: [
          "a maintenance panel is embedded in the wall next to a large sealed door.",
          "perhaps the ship's systems are still operational.",
        ],
        buttons: [
          {
            key: "power",
            text: "power cycle",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification:
          "as the lights come online, so too do the defence systems.",
        combat: originalExecutionerCombatDefinitions["automated-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "device" },
          },
        ],
      },
      device: {
        key: "device",
        text: [
          "beyond the bulkhead is a small antechamber, seemingly untouched by scavengers.",
          "a large hatch grinds open, and the wind rushes in.",
          "a strange device sits on the floor. looks important.",
        ],
        onLoad: (context) => {
          context.setState("game.world.executioner", true);
        },
        buttons: [
          {
            key: "leave",
            text: "take device and leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.intro-military-camp",
    title: "A Ravaged Battleship",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        notification: "the remains of a huge ship are embedded in the earth.",
        text: [
          "the remains of a massive battleship lie here, like a silent sealed city.",
          "it lists to the side in a deep crevasse, cut when it fell from the sky.",
          "the hatches are all sealed, but the hull is blown out just above the dirt, providing an entrance.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "corridor" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      corridor: {
        key: "corridor",
        text: [
          "the interior of the ship is cold and dark. what little light there is only accentuates its harsh angles.",
          "the walls hum faintly.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "operative" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      operative: {
        key: "operative",
        text: [],
        notification: "an operative waits in ambush around the corner.",
        combat: originalExecutionerCombatDefinitions["operative"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "camp" },
          },
        ],
      },
      camp: {
        key: "camp",
        text: [
          "the military has set up a small camp just inside the ship.",
          "crude attempts have been made to cut into the walls.",
          "scraps of copper wire litter the floor.",
          "two bedrolls are wedged into a corner.",
        ],
        loot: {
          "cured meat": { min: 1, max: 5, chance: 1 },
          torch: { min: 1, max: 3, chance: 0.8 },
          bullets: { min: 1, max: 5, chance: 0.5 },
          "alien alloy": { min: 1, max: 2, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "researcher" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      researcher: {
        key: "researcher",
        text: [],
        notification: "a dusty researcher clumsily hides in the shadows.",
        combat: originalExecutionerCombatDefinitions["researcher"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "maintenance-panel" },
          },
        ],
      },
      "maintenance-panel": {
        key: "maintenance-panel",
        text: [
          "a maintenance panel is embedded in the wall next to a large sealed door.",
          "perhaps the ship's systems are still operational.",
        ],
        buttons: [
          {
            key: "power",
            text: "power cycle",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification:
          "as the lights come online, so too do the defence systems.",
        combat: originalExecutionerCombatDefinitions["automated-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "device" },
          },
        ],
      },
      device: {
        key: "device",
        text: [
          "beyond the bulkhead is a small antechamber, seemingly untouched by scavengers.",
          "a large hatch grinds open, and the wind rushes in.",
          "a strange device sits on the floor. looks important.",
        ],
        onLoad: (context) => {
          context.setState("game.world.executioner", true);
        },
        buttons: [
          {
            key: "leave",
            text: "take device and leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.intro-barricade",
    title: "A Ravaged Battleship",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        notification: "the remains of a huge ship are embedded in the earth.",
        text: [
          "the remains of a massive battleship lie here, like a silent sealed city.",
          "it lists to the side in a deep crevasse, cut when it fell from the sky.",
          "the hatches are all sealed, but the hull is blown out just above the dirt, providing an entrance.",
        ],
        buttons: [
          {
            key: "enter",
            text: "enter",
            nextScene: { 1: "corridor" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      corridor: {
        key: "corridor",
        text: [
          "the interior of the ship is cold and dark. what little light there is only accentuates its harsh angles.",
          "the walls hum faintly.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "barricade" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      barricade: {
        key: "barricade",
        text: [
          "debris is stacked in the corridor, forming a low barricade.",
          "the walls are scorched and melted.",
          "behind the barricade, a few weapons lay abandoned.",
        ],
        loot: {
          "laser rifle": { min: 1, max: 3, chance: 1 },
          "energy cell": { min: 1, max: 5, chance: 0.8 },
          "plasma rifle": { min: 1, max: 1, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "wanderer-remains" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "wanderer-remains": {
        key: "wanderer-remains",
        text: [
          "the partially devoured remains of several wanderers are piled before a dark corridor.",
          "shuffling noises can be heard from within.",
        ],
        loot: {
          "energy cell": { min: 1, max: 5, chance: 0.5 },
          cloth: { min: 1, max: 5, chance: 0.8 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "beast" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      beast: {
        key: "beast",
        text: [],
        notification: "an ancient beast has made these ruins its home.",
        combat: originalExecutionerCombatDefinitions["ancient-beast"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "maintenance-panel" },
          },
        ],
      },
      "maintenance-panel": {
        key: "maintenance-panel",
        text: [
          "a maintenance panel is embedded in the wall next to a large sealed door.",
          "perhaps the ship's systems are still operational.",
        ],
        buttons: [
          {
            key: "power",
            text: "power cycle",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification:
          "as the lights come online, so too do the defence systems.",
        combat: originalExecutionerCombatDefinitions["automated-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "device" },
          },
        ],
      },
      device: {
        key: "device",
        text: [
          "beyond the bulkhead is a small antechamber, seemingly untouched by scavengers.",
          "a large hatch grinds open, and the wind rushes in.",
          "a strange device sits on the floor. looks important.",
        ],
        onLoad: (context) => {
          context.setState("game.world.executioner", true);
        },
        buttons: [
          {
            key: "leave",
            text: "take device and leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.engineering-assembly",
    title: "Engineering Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
          "emergency lighting flickers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "assembly" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      assembly: {
        key: "assembly",
        text: [
          "an automated assembly line performs its empty routines, long since deprived of materials.",
          "its final works lie forgotten, covered by a thin layer of dust.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "welder" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      welder: {
        key: "welder",
        text: [],
        notification: "assembly arms spin wildly out of control.",
        combat: originalExecutionerCombatDefinitions["unruly-welder"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "guard" },
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
          "one machine thrums with power, and might still work.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.engineering-rd-blueprint",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.engineering-assembly-loot",
    title: "Engineering Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
          "emergency lighting flickers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "assembly" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      assembly: {
        key: "assembly",
        text: [
          "an automated assembly line performs its empty routines, long since deprived of materials.",
          "its final works lie forgotten, covered by a thin layer of dust.",
        ],
        loot: {
          "energy cell": { min: 1, max: 5, chance: 0.8 },
          "laser rifle": { min: 1, max: 1, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "welder" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      welder: {
        key: "welder",
        text: [],
        notification: "assembly arms spin wildly out of control.",
        combat: originalExecutionerCombatDefinitions["unruly-welder"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "guard" },
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
          "one machine thrums with power, and might still work.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.engineering-rd-blueprint",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.engineering-assembly-quiet",
    title: "Engineering Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
          "emergency lighting flickers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "assembly" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      assembly: {
        key: "assembly",
        text: [
          "an automated assembly line performs its empty routines, long since deprived of materials.",
          "its final works lie forgotten, covered by a thin layer of dust.",
        ],
        loot: {
          "energy cell": { min: 1, max: 5, chance: 0.8 },
          "laser rifle": { min: 1, max: 1, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "machinery" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      machinery: {
        key: "machinery",
        text: [
          "assembly arms spark and jitter.",
          "a cacophony of decrepit machinery fills the room.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
          "one machine thrums with power, and might still work.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.engineering-rd-blueprint",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.engineering-engine-room",
    title: "Engineering Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
          "emergency lighting flickers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification: "one of the defence turrets still works.",
        combat: originalExecutionerCombatDefinitions["defence-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "engine-room" },
          },
        ],
      },
      "engine-room": {
        key: "engine-room",
        text: [
          "must have been the engine room, once. the massive machines now stand inert, twisted and scorched by explosions.",
          "the destruction is uniform and precise.",
          "bits of them can be scavenged.",
        ],
        loot: {
          "alien alloy": { min: 2, max: 5, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
          "one machine thrums with power, and might still work.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.engineering-rd-blueprint",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.engineering-engine-room-quiet",
    title: "Engineering Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
          "emergency lighting flickers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification: "one of the defence turrets still works.",
        combat: originalExecutionerCombatDefinitions["defence-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "engine-room" },
          },
        ],
      },
      "engine-room": {
        key: "engine-room",
        text: [
          "must have been the engine room, once. the massive machines now stand inert, twisted and scorched by explosions.",
          "the destruction is uniform and precise.",
          "bits of them can be scavenged.",
        ],
        loot: {
          "alien alloy": { min: 2, max: 5, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "destroyed-engines" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "destroyed-engines": {
        key: "destroyed-engines",
        text: [
          "none of the ship's engines escaped the destruction.",
          "it's no mystery why she no longer flies.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
          "one machine thrums with power, and might still work.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.engineering-rd-blueprint",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.engineering-fire-guard-post",
    title: "Engineering Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
          "emergency lighting flickers.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "fire-junction" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "fire-junction": {
        key: "fire-junction",
        text: [
          "sparks cascade from a reactivated power junction, and catch.",
          "the flames fill the corridor.",
        ],
        buttons: [
          {
            key: "water",
            text: "extinguish",
            cost: { water: 5 },
            nextScene: { 0.5: "guard", 1: "robot-hangar" },
          },
          {
            key: "run",
            text: "rush through",
            cost: { hp: 10 },
            nextScene: { 0.5: "guard", 1: "robot-hangar" },
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "guard-post" },
          },
        ],
      },
      "robot-hangar": {
        key: "robot-hangar",
        text: [
          "rows of inert security robots hang suspended from the ceiling.",
          "wires run overhead, corroded and useless.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guard-post" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "guard-post": {
        key: "guard-post",
        text: [
          "more signs of past combat down the hall. guard post is ransacked.",
          "still, some things can be found.",
        ],
        loot: {
          "energy cell": { min: 1, max: 5, chance: 0.8 },
          "laser rifle": { min: 1, max: 1, chance: 0.7 },
          grenade: { min: 1, max: 3, chance: 0.6 },
          "plasma rifle": { min: 1, max: 1, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
          "one machine thrums with power, and might still work.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.engineering-rd-blueprint",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.engineering-rd-blueprint",
    title: "Engineering Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
          "one machine thrums with power, and might still work.",
        ],
        buttons: [
          {
            key: "use",
            text: "use machine",
            cost: { "alien alloy": 1 },
            onChoose: (context) => {
              context.setState("character.health", worldMaxHealth(context));
            },
            nextScene: "healed",
          },
          {
            key: "continue",
            text: "continue",
            nextScene: { 0.5: "turret", 1: "workbenches" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      healed: {
        key: "healed",
        text: [
          "step inside, and the machine whirs. muscle and bone reknit. good as new.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 0.5: "turret", 1: "workbenches" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification: "one of the defence turrets still works.",
        combat: originalExecutionerCombatDefinitions["defence-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "plans" },
          },
        ],
      },
      workbenches: {
        key: "workbenches",
        text: [
          "the machines here look unfinished, abandoned by their creator. wires and other scrap are scattered about the work benches.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "plans" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      plans: {
        key: "plans",
        text: [
          "experimental plans cover one wall, held by an unseen force.",
          "this one looks useful.",
        ],
        loot: {
          "hypo blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "prototype-intro" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "prototype-intro": {
        key: "prototype-intro",
        text: ["clattering metal and old servos. something is coming..."],
        buttons: [
          {
            key: "fight",
            text: "fight",
            nextScene: { 1: "prototype" },
          },
        ],
      },
      prototype: {
        key: "prototype",
        text: [],
        notification: "an unfinished automaton whirs to life.",
        combat: originalExecutionerCombatDefinitions["unstable-prototype"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "at the back of the workshop, elevator doors twitch and buzz.",
          "looks like a way out of here.",
        ],
        onLoad: (context) => {
          context.setState("game.world.engineering", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-checkpoint",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "elevator doors open to an empty corridor.",
          "a few dusty corpses can be seen further down, but this deck appears to have been spared most of the combat.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification: "one of the defence turrets still works.",
        combat: originalExecutionerCombatDefinitions["defence-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "quiet-corridor" },
          },
        ],
      },
      "quiet-corridor": {
        key: "quiet-corridor",
        text: [
          "past the checkpoint, the corridor is undamaged save for sporadic graffiti.",
          "there was no fighting here.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 0.5: "quadruped", 1: "guardians" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guardians: {
        key: "guardians",
        text: [
          "automated guardians still stalk the halls, unaware that their masters have long gone.",
          "clumsy machines, and easily avoided.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "gurneys" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      quadruped: {
        key: "quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "gurneys" },
          },
        ],
      },
      gurneys: {
        key: "gurneys",
        text: [
          "medical gurneys are fixed to grooves running down the corridor walls.",
          "the automated patient transport system now sits motionless.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 0.5: "medic", 1: "strategy-room" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "strategy-room": {
        key: "strategy-room",
        text: [
          "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
          "a secure locker is set into one wall.",
        ],
        buttons: [
          {
            key: "force",
            text: "force locker",
            nextScene: { 1: "locker" },
          },
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "quiet-move" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      locker: {
        key: "locker",
        text: ["hinges rusted through. no challenge."],
        loot: {
          "energy cell": { min: 5, max: 10, chance: 1 },
          hypo: { min: 1, max: 3, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "noisy-medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "quiet-move": {
        key: "quiet-move",
        text: [
          "better to move without drawing attention.",
          "noises can be heard from the corridor outside.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "strategy-quadruped" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "noisy-medic": {
        key: "noisy-medic",
        text: [],
        notification: "the noise draws attention.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "strategy-quadruped" },
          },
        ],
      },
      "strategy-quadruped": {
        key: "strategy-quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "automaton" },
          },
        ],
      },
      medic: {
        key: "medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 0.5: "friends", 1: "frozen-robots" },
          },
        ],
      },
      friends: {
        key: "friends",
        text: [],
        notification: "it had friends.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      "frozen-robots": {
        key: "frozen-robots",
        text: [
          "more medical robots stand frozen, attached by a network of wires.",
          "they take no notice of the intrusion.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "weapons are strewn about the medical dispatch bay. must have been used as a muster point.",
          "more strange graffiti adorns the walls.",
        ],
        loot: {
          "laser rifle": { min: 1, max: 1, chance: 1 },
          "energy cell": { min: 3, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "automaton" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      automaton: {
        key: "automaton",
        text: [],
        notification: "something's wrong with this robot.",
        combat: originalExecutionerCombatDefinitions["unstable-automaton"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "checkpoint" },
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "another checkpoint ahead, fitted with heavy doors.",
          "security is even tighter here.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: {
              0.25: "executioner.medical-cold-guard",
              0.5: "executioner.medical-guarded-surgical",
              1: "executioner.medical-cold-storage",
            },
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-guardians-quiet",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "past the checkpoint, the corridor is undamaged save for sporadic graffiti.",
          "there was no fighting here.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guardians" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guardians: {
        key: "guardians",
        text: [
          "automated guardians still stalk the halls, unaware that their masters have long gone.",
          "clumsy machines, and easily avoided.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "gurneys" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      gurneys: {
        key: "gurneys",
        text: [
          "medical gurneys are fixed to grooves running down the corridor walls.",
          "the automated patient transport system now sits motionless.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "strategy-room" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "strategy-room": {
        key: "strategy-room",
        text: [
          "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
          "a secure locker is set into one wall.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "quiet-move" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "quiet-move": {
        key: "quiet-move",
        text: [
          "better to move without drawing attention.",
          "noises can be heard from the corridor outside.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "quadruped" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      quadruped: {
        key: "quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "automaton" },
          },
        ],
      },
      automaton: {
        key: "automaton",
        text: [],
        notification: "something's wrong with this robot.",
        combat: originalExecutionerCombatDefinitions["unstable-automaton"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "checkpoint" },
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "another checkpoint ahead, fitted with heavy doors.",
          "security is even tighter here.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-cold-storage",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-friends-dispatch",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "medical gurneys are fixed to grooves running down the corridor walls.",
          "the automated patient transport system now sits motionless.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      medic: {
        key: "medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "friends" },
          },
        ],
      },
      friends: {
        key: "friends",
        text: [],
        notification: "it had friends.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "dispatch-bay" },
          },
        ],
      },
      "dispatch-bay": {
        key: "dispatch-bay",
        text: [
          "weapons are strewn about the medical dispatch bay. must have been used as a muster point.",
          "more strange graffiti adorns the walls.",
        ],
        loot: {
          "laser rifle": { min: 1, max: 1, chance: 1 },
          "energy cell": { min: 3, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "automaton" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      automaton: {
        key: "automaton",
        text: [],
        notification: "something's wrong with this robot.",
        combat: originalExecutionerCombatDefinitions["unstable-automaton"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "checkpoint" },
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "another checkpoint ahead, fitted with heavy doors.",
          "security is even tighter here.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-cold-storage",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-guarded-surgical",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "another checkpoint ahead, fitted with heavy doors.",
          "security is even tighter here.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "medic" },
          },
        ],
      },
      medic: {
        key: "medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "surgical-tools" },
          },
        ],
      },
      "surgical-tools": {
        key: "surgical-tools",
        text: [
          "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
          "strange.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "explosives" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      explosives: {
        key: "explosives",
        text: [
          "the air in this room has a metallic tinge. floor is covered in dark powder.",
          "some completed explosives in the corner.",
        ],
        loot: {
          grenade: { min: 3, max: 8, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "final-medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "final-medic": {
        key: "final-medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "containment" },
          },
        ],
      },
      containment: {
        key: "containment",
        text: [
          "containment cells arranged at the back of the room, all open.",
          "something moving up ahead.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-experiment",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-cold-guard",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "another checkpoint ahead, fitted with heavy doors.",
          "security is even tighter here.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "medic" },
          },
        ],
      },
      medic: {
        key: "medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cold-storage" },
          },
        ],
      },
      "cold-storage": {
        key: "cold-storage",
        text: [
          "the air is cooler here. low cabinets ring the room, doors dusted with frost.",
          "samples of something biological inside.",
        ],
        loot: {
          "cured meat": { min: 5, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "second-guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "second-guard": {
        key: "second-guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "final-medic" },
          },
        ],
      },
      "final-medic": {
        key: "final-medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "containment" },
          },
        ],
      },
      containment: {
        key: "containment",
        text: [
          "containment cells arranged at the back of the room, all open.",
          "something moving up ahead.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-experiment",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-surgical-explosives",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
          "strange.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "explosives" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      explosives: {
        key: "explosives",
        text: [
          "the air in this room has a metallic tinge. floor is covered in dark powder.",
          "some completed explosives in the corner.",
        ],
        loot: {
          grenade: { min: 3, max: 8, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "final-medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "final-medic": {
        key: "final-medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "containment" },
          },
        ],
      },
      containment: {
        key: "containment",
        text: [
          "containment cells arranged at the back of the room, all open.",
          "something moving up ahead.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-experiment",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-surgical-medic",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
          "strange.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      medic: {
        key: "medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "final-medic" },
          },
        ],
      },
      "final-medic": {
        key: "final-medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "containment" },
          },
        ],
      },
      containment: {
        key: "containment",
        text: [
          "containment cells arranged at the back of the room, all open.",
          "something moving up ahead.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-experiment",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-cold-storage",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "another checkpoint ahead, fitted with heavy doors.",
          "security is even tighter here.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "slipped" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      slipped: {
        key: "slipped",
        text: [
          "slipped through unnoticed.",
          "air whistles as the doors open. this section must have lower pressure than the rest of the ship.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      medic: {
        key: "medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cold-storage" },
          },
        ],
      },
      "cold-storage": {
        key: "cold-storage",
        text: [
          "the air is cooler here. low cabinets ring the room, doors dusted with frost.",
          "samples of something biological inside.",
        ],
        loot: {
          "cured meat": { min: 5, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "drones" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      drones: {
        key: "drones",
        text: [
          "security drones still patrol the hallways.",
          "predictable paths.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "final-medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "final-medic": {
        key: "final-medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "containment" },
          },
        ],
      },
      containment: {
        key: "containment",
        text: [
          "containment cells arranged at the back of the room, all open.",
          "something moving up ahead.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-experiment",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-locker-quadruped",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
          "a secure locker is set into one wall.",
        ],
        buttons: [
          {
            key: "force",
            text: "force locker",
            nextScene: { 1: "locker" },
          },
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "quiet-move" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      locker: {
        key: "locker",
        text: ["hinges rusted through. no challenge."],
        loot: {
          "energy cell": { min: 5, max: 10, chance: 1 },
          hypo: { min: 1, max: 3, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "noisy-medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "quiet-move": {
        key: "quiet-move",
        text: [
          "better to move without drawing attention.",
          "noises can be heard from the corridor outside.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "quadruped" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "noisy-medic": {
        key: "noisy-medic",
        text: [],
        notification: "the noise draws attention.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "quadruped" },
          },
        ],
      },
      quadruped: {
        key: "quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "automaton" },
          },
        ],
      },
      automaton: {
        key: "automaton",
        text: [],
        notification: "something's wrong with this robot.",
        combat: originalExecutionerCombatDefinitions["unstable-automaton"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "checkpoint" },
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "another checkpoint ahead, fitted with heavy doors.",
          "security is even tighter here.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-cold-storage",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-frozen-automaton",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "medical gurneys are fixed to grooves running down the corridor walls.",
          "the automated patient transport system now sits motionless.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "medic" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      medic: {
        key: "medic",
        text: [],
        notification: "a medical drone wheels out of control.",
        combat: originalExecutionerCombatDefinitions["broken-medic"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "frozen-robots" },
          },
        ],
      },
      "frozen-robots": {
        key: "frozen-robots",
        text: [
          "more medical robots stand frozen, attached by a network of wires.",
          "they take no notice of the intrusion.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "dispatch-bay" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "dispatch-bay": {
        key: "dispatch-bay",
        text: [
          "weapons are strewn about the medical dispatch bay. must have been used as a muster point.",
          "more strange graffiti adorns the walls.",
        ],
        loot: {
          "laser rifle": { min: 1, max: 1, chance: 1 },
          "energy cell": { min: 3, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "automaton" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      automaton: {
        key: "automaton",
        text: [],
        notification: "something's wrong with this robot.",
        combat: originalExecutionerCombatDefinitions["unstable-automaton"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "checkpoint" },
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "another checkpoint ahead, fitted with heavy doors.",
          "security is even tighter here.",
        ],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextEvent: "executioner.medical-cold-storage",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-armory-blast",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
          "looks like they tried to barricade the elevators.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "branch" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      branch: {
        key: "branch",
        text: [
          "further along, the corridor branches.",
          "the door to the left is sealed and refuses to open.",
        ],
        buttons: [
          {
            key: "blast",
            text: "blast door",
            cost: { grenade: 1 },
            nextScene: { 1: "armory" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      armory: {
        key: "armory",
        text: [
          "the blast throws the door inwards.",
          "through the bulkhead is a large room, walls lined with weapon racks. fighting seems to have passed it by.",
        ],
        loot: {
          "energy blade": { min: 2, max: 5, chance: 1 },
          "laser rifle": { min: 2, max: 5, chance: 1 },
          "energy cell": { min: 5, max: 20, chance: 1 },
          grenade: { min: 1, max: 5, chance: 0.8 },
          "plasma rifle": { min: 1, max: 1, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification: "one of the defence turrets still works.",
        combat: originalExecutionerCombatDefinitions["defence-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "sealed-door" },
          },
        ],
      },
      "sealed-door": {
        key: "sealed-door",
        text: [
          "another door at the end of the hall, sealed from this side.",
          "should be able to open it.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "barricade" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      barricade: {
        key: "barricade",
        text: [
          "large barricades bisect the corridor, scorched by weapons fire.",
          "bodies litter the ground on either side.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "documents" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      documents: {
        key: "documents",
        text: [
          "documents are scattered down the hall, most charred and curled.",
          "this one looks interesting.",
        ],
        loot: {
          "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "training-complex" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "training-complex": {
        key: "training-complex",
        text: [
          "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
          "a regenerative machine hums uncannily by one of the courses.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextEvent: "executioner.martial-training-robot",
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-right-cabins-blueprint",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
          "looks like they tried to barricade the elevators.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "branch" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      branch: {
        key: "branch",
        text: [
          "further along, the corridor branches.",
          "the door to the left is sealed and refuses to open.",
        ],
        buttons: [
          {
            key: "right",
            text: "continue right",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification: "one of the defence turrets still works.",
        combat: originalExecutionerCombatDefinitions["defence-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "quadruped" },
          },
        ],
      },
      quadruped: {
        key: "quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cabins" },
          },
        ],
      },
      cabins: {
        key: "cabins",
        text: [
          "crew cabins flank the hall, devoid of life.",
          "a few useful items can be scavenged.",
        ],
        loot: {
          "energy cell": { min: 1, max: 5, chance: 1 },
          "energy blade": { min: 1, max: 1, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "barricade" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      barricade: {
        key: "barricade",
        text: [
          "large barricades bisect the corridor, scorched by weapons fire.",
          "bodies litter the ground on either side.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "documents" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      documents: {
        key: "documents",
        text: [
          "documents are scattered down the hall, most charred and curled.",
          "this one looks interesting.",
        ],
        loot: {
          "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-scrap-blueprint",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
          "looks like they tried to barricade the elevators.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "branch" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      branch: {
        key: "branch",
        text: [
          "further along, the corridor branches.",
          "the door to the left is sealed and refuses to open.",
        ],
        buttons: [
          {
            key: "right",
            text: "continue right",
            nextScene: { 1: "scrap" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      scrap: {
        key: "scrap",
        text: [
          "ruined defence turrets flank the corridor.",
          "could put the scrap to good use.",
        ],
        loot: {
          "alien alloy": { min: 1, max: 3, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      guard: {
        key: "guard",
        text: [],
        notification: "tripped a motion sensor.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "quadruped" },
          },
        ],
      },
      quadruped: {
        key: "quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "barricade" },
          },
        ],
      },
      barricade: {
        key: "barricade",
        text: [
          "large barricades bisect the corridor, scorched by weapons fire.",
          "bodies litter the ground on either side.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "documents" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      documents: {
        key: "documents",
        text: [
          "documents are scattered down the hall, most charred and curled.",
          "this one looks interesting.",
        ],
        loot: {
          "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-right-silent-cabins",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
          "looks like they tried to barricade the elevators.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "branch" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      branch: {
        key: "branch",
        text: [
          "further along, the corridor branches.",
          "the door to the left is sealed and refuses to open.",
        ],
        buttons: [
          {
            key: "right",
            text: "continue right",
            nextScene: { 1: "turret" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      turret: {
        key: "turret",
        text: [],
        notification: "one of the defence turrets still works.",
        combat: originalExecutionerCombatDefinitions["defence-turret"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "silent-corridor" },
          },
        ],
      },
      "silent-corridor": {
        key: "silent-corridor",
        text: ["the corridor is eerily silent."],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "cabins" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      cabins: {
        key: "cabins",
        text: [
          "crew cabins flank the hall, devoid of life.",
          "a few useful items can be scavenged.",
        ],
        loot: {
          "energy cell": { min: 1, max: 5, chance: 1 },
          "energy blade": { min: 1, max: 1, chance: 0.2 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "barricade" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      barricade: {
        key: "barricade",
        text: [
          "large barricades bisect the corridor, scorched by weapons fire.",
          "bodies litter the ground on either side.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "documents" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      documents: {
        key: "documents",
        text: [
          "documents are scattered down the hall, most charred and curled.",
          "this one looks interesting.",
        ],
        loot: {
          "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-security-checkpoint",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "documents are scattered down the hall, most charred and curled.",
          "this one looks interesting.",
        ],
        loot: {
          "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "checkpoint" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "the corridor passes through a security checkpoint. the defences are blown apart, ragged edges scorched by laser fire.",
          "past the checkpoint, banks of containment cells can be seen.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "dead-guards" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "dead-guards": {
        key: "dead-guards",
        text: [
          "the guards died at their posts, shot through with superheated plasma.",
          "their weapons lie on the floor beside them.",
        ],
        loot: {
          "laser rifle": { min: 2, max: 2, chance: 1 },
          "energy cell": { min: 5, max: 10, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "quadruped" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      quadruped: {
        key: "quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "training-complex" },
          },
        ],
      },
      "training-complex": {
        key: "training-complex",
        text: [
          "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
          "a regenerative machine hums uncannily by one of the courses.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextEvent: "executioner.martial-training-robot",
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-scrap-sensors",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
          "looks like they tried to barricade the elevators.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "branch" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      branch: {
        key: "branch",
        text: [
          "further along, the corridor branches.",
          "the door to the left is sealed and refuses to open.",
        ],
        buttons: [
          {
            key: "right",
            text: "continue right",
            nextScene: { 1: "scrap" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      scrap: {
        key: "scrap",
        text: [
          "ruined defence turrets flank the corridor.",
          "could put the scrap to good use.",
        ],
        loot: {
          "alien alloy": { min: 1, max: 3, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "sensors" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      sensors: {
        key: "sensors",
        text: [
          "small sensors in the walls still look to be operational.",
          "easily avoided.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "quadruped" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      quadruped: {
        key: "quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "barricade" },
          },
        ],
      },
      barricade: {
        key: "barricade",
        text: [
          "large barricades bisect the corridor, scorched by weapons fire.",
          "bodies litter the ground on either side.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "documents" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      documents: {
        key: "documents",
        text: [
          "documents are scattered down the hall, most charred and curled.",
          "this one looks interesting.",
        ],
        loot: {
          "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-security-empty-cells",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "documents are scattered down the hall, most charred and curled.",
          "this one looks interesting.",
        ],
        loot: {
          "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "checkpoint" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      checkpoint: {
        key: "checkpoint",
        text: [
          "the corridor passes through a security checkpoint. the defences are blown apart, ragged edges scorched by laser fire.",
          "past the checkpoint, banks of containment cells can be seen.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "empty-cells" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "empty-cells": {
        key: "empty-cells",
        text: [
          "the cells are all empty.",
          "power cables running across the ceiling are split in several places, sparking occasionally.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "quadruped" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      quadruped: {
        key: "quadruped",
        text: [],
        notification: "a mobile defence platform trundles around the corner.",
        combat: originalExecutionerCombatDefinitions["mechanical-quadruped"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "training-complex" },
          },
        ],
      },
      "training-complex": {
        key: "training-complex",
        text: [
          "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
          "a regenerative machine hums uncannily by one of the courses.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextEvent: "executioner.martial-training-robot",
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-planning-room-maps",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "documents are scattered down the hall, most charred and curled.",
          "this one looks interesting.",
        ],
        loot: {
          "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
        },
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "planning-room" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "planning-room": {
        key: "planning-room",
        text: [
          "the next door leads to a ransacked planning room.",
          "maps of the surface can still be found amongst the debris.",
        ],
        buttons: [
          {
            key: "scavenge",
            text: "scavenge maps",
            onChoose: (context) => {
              context.applyMap();
              context.applyMap();
              context.applyMap();
            },
            nextScene: { 1: "noisy-guard" },
          },
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "sentry" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "noisy-guard": {
        key: "noisy-guard",
        text: [],
        notification: "drew some attention with all that noise.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "second-guard" },
          },
        ],
      },
      sentry: {
        key: "sentry",
        text: [
          "slipped past an automated sentry.",
          "if only they'd been destroyed along with everything else.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "second-guard" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "second-guard": {
        key: "second-guard",
        text: [],
        notification: "ran straight into another one.",
        combat: originalExecutionerCombatDefinitions["mechanical-guard"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "training-complex" },
          },
        ],
      },
      "training-complex": {
        key: "training-complex",
        text: [
          "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
          "a regenerative machine hums uncannily by one of the courses.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextEvent: "executioner.martial-training-robot",
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-training-robot",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
          "a regenerative machine hums uncannily by one of the courses.",
        ],
        buttons: [
          {
            key: "use",
            text: "use machine",
            cost: { "alien alloy": 1 },
            onChoose: (context) => {
              context.setState("character.health", worldMaxHealth(context));
            },
            nextScene: { 1: "robot-intro" },
          },
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "robot-intro" },
          },
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      "robot-intro": {
        key: "robot-intro",
        text: [
          "motion from the centre of the yard.",
          "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
        ],
        buttons: [
          {
            key: "engage",
            text: "engage",
            nextScene: { 1: "robot" },
          },
        ],
      },
      robot: {
        key: "robot",
        text: [],
        notification: "the machine attacks, blades whirling.",
        combat: originalExecutionerCombatDefinitions["murderous-robot"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the ruins of the sparring machine clatter to the ground.",
          "picked this deck clean.",
        ],
        onLoad: (context) => {
          context.setState("game.world.martial", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.martial-robot",
    title: "Martial Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "motion from the centre of the yard.",
          "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
        ],
        buttons: [
          {
            key: "engage",
            text: "engage",
            nextScene: { 1: "robot" },
          },
        ],
      },
      robot: {
        key: "robot",
        text: [],
        notification: "the machine attacks, blades whirling.",
        combat: originalExecutionerCombatDefinitions["murderous-robot"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the ruins of the sparring machine clatter to the ground.",
          "picked this deck clean.",
        ],
        onLoad: (context) => {
          context.setState("game.world.martial", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.engineering-prototype",
    title: "Engineering Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: ["clattering metal and old servos. something is coming..."],
        buttons: [
          {
            key: "fight",
            text: "fight",
            nextScene: { 1: "prototype" },
          },
        ],
      },
      prototype: {
        key: "prototype",
        text: [],
        notification: "an unfinished automaton whirs to life.",
        combat: originalExecutionerCombatDefinitions["unstable-prototype"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "at the back of the workshop, elevator doors twitch and buzz.",
          "looks like a way out of here.",
        ],
        onLoad: (context) => {
          context.setState("game.world.engineering", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.medical-experiment",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [
          "containment cells arranged at the back of the room, all open.",
          "something moving up ahead.",
        ],
        buttons: [
          {
            key: "continue",
            text: "continue",
            nextScene: { 1: "experiment" },
          },
        ],
      },
      experiment: {
        key: "experiment",
        text: [],
        notification: "a mutated beast leaps from its cell.",
        combat: originalExecutionerCombatDefinitions["malformed-experiment"],
        buttons: [
          {
            key: "leave",
            text: "continue",
            nextScene: { 1: "cleared" },
          },
        ],
      },
      cleared: {
        key: "cleared",
        text: [
          "the creature's tortured breathing ceases.",
          "nothing more here.",
        ],
        onLoad: (context) => {
          context.setState("game.world.medical", true);
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "executioner.unstable-automaton",
    title: "Medical Wing",
    pool: "executioner",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [],
        notification: "something's wrong with this robot.",
        combat: originalExecutionerCombatDefinitions["unstable-automaton"],
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
];

export const originalEventDefinitions: OriginalEventDefinition[] = [
  {
    key: "global.thief",
    title: "The Thief",
    pool: "global",
    isAvailable: (readNumber) => readNumber("game.thieves") === 1,
    scenes: {
      start: {
        key: "start",
        text: [
          "the villagers haul a filthy man out of the store room.",
          "say his folk have been skimming the supplies.",
          "say he should be strung up as an example.",
        ],
        notification: "a thief is caught",
        buttons: [
          {
            key: "kill",
            text: "hang him",
            nextScene: { 1: "hang" },
          },
          {
            key: "spare",
            text: "spare him",
            nextScene: { 1: "spare" },
          },
        ],
      },
      hang: {
        key: "hang",
        text: [
          "the villagers hang the thief high in front of the store room.",
          "the point is made. in the next few days, the missing supplies are returned.",
        ],
        onLoad: (context) => {
          context.setState("game.thieves", 2);
          context.removeIncome("thieves");
          context.addStores(context.readRecord("game.stolen"));
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      spare: {
        key: "spare",
        text: [
          "the man says he's grateful. says he won't come around any more.",
          "shares what he knows about sneaking before he goes.",
        ],
        onLoad: (context) => {
          context.setState("game.thieves", 2);
          context.removeIncome("thieves");
          context.addPerk("stealthy");
        },
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.beggar",
    title: "The Beggar",
    pool: "room",
    isAvailable: (readNumber) => readNumber("stores.fur") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "a beggar arrives.",
          "asks for any spare furs to keep him warm at night.",
        ],
        notification: "a beggar arrives",
        buttons: [
          {
            key: "50furs",
            text: "give 50",
            cost: { fur: 50 },
            nextScene: { 0.5: "scales", 0.8: "teeth", 1: "cloth" },
          },
          {
            key: "100furs",
            text: "give 100",
            cost: { fur: 100 },
            nextScene: { 0.5: "teeth", 0.8: "scales", 1: "cloth" },
          },
          {
            key: "deny",
            text: "turn him away",
            nextScene: "end",
          },
        ],
      },
      scales: {
        key: "scales",
        reward: { scales: 20 },
        text: [
          "the beggar expresses his thanks.",
          "leaves a pile of small scales behind.",
        ],
        buttons: [
          {
            key: "leave",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
      teeth: {
        key: "teeth",
        reward: { teeth: 20 },
        text: [
          "the beggar expresses his thanks.",
          "leaves a pile of small teeth behind.",
        ],
        buttons: [
          {
            key: "leave",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
      cloth: {
        key: "cloth",
        reward: { cloth: 20 },
        text: [
          "the beggar expresses his thanks.",
          "leaves some scraps of cloth behind.",
        ],
        buttons: [
          {
            key: "leave",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.nomad",
    title: "The Nomad",
    pool: "room",
    isAvailable: (readNumber) => readNumber("stores.fur") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "a nomad shuffles into view, laden with makeshift bags bound with rough twine.",
          "won't say from where he came, but it's clear that he's not staying.",
        ],
        notification: "a nomad arrives, looking to trade",
        buttons: [
          {
            key: "buyScales",
            text: "buy scales",
            cost: { fur: 100 },
            reward: { scales: 1 },
          },
          {
            key: "buyTeeth",
            text: "buy teeth",
            cost: { fur: 200 },
            reward: { teeth: 1 },
          },
          {
            key: "buyBait",
            text: "buy bait",
            cost: { fur: 5 },
            reward: { bait: 1 },
            notification: "traps are more effective with bait.",
          },
          {
            key: "buyCompass",
            text: "buy compass",
            cost: { fur: 300, scales: 15, teeth: 5 },
            reward: { compass: 1 },
            notification:
              "the old compass is dented and dusty, but it looks to work.",
            available: (context) => context.readNumber("stores.compass") < 1,
          },
          {
            key: "goodbye",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.noises-outside",
    title: "Noises",
    pool: "room",
    isAvailable: (readNumber) => readNumber("stores.wood") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "through the walls, shuffling noises can be heard.",
          "can't tell what they're up to.",
        ],
        notification: "strange noises can be heard through the walls",
        buttons: [
          {
            key: "investigate",
            text: "investigate",
            nextScene: { 0.3: "stuff", 1: "nothing" },
          },
          {
            key: "ignore",
            text: "ignore them",
            nextScene: "end",
          },
        ],
      },
      nothing: {
        key: "nothing",
        text: ["vague shapes move, just out of sight.", "the sounds stop."],
        buttons: [
          {
            key: "backinside",
            text: "go back inside",
            nextScene: "end",
          },
        ],
      },
      stuff: {
        key: "stuff",
        reward: { wood: 100, fur: 10 },
        text: [
          "a bundle of sticks lies just beyond the threshold, wrapped in coarse furs.",
          "the night is silent.",
        ],
        buttons: [
          {
            key: "backinside",
            text: "go back inside",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.noises-inside",
    title: "Noises",
    pool: "room",
    isAvailable: (readNumber) => readNumber("stores.wood") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "scratching noises can be heard from the store room.",
          "something's in there.",
        ],
        notification: "something's in the store room",
        buttons: [
          {
            key: "investigate",
            text: "investigate",
            nextScene: { 0.5: "scales", 0.8: "teeth", 1: "cloth" },
          },
          {
            key: "ignore",
            text: "ignore them",
            nextScene: "end",
          },
        ],
      },
      scales: {
        key: "scales",
        text: [
          "some wood is missing.",
          "the ground is littered with small scales",
        ],
        onLoad: (context) => applyNoisesInsideTrade(context, "scales"),
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      teeth: {
        key: "teeth",
        text: [
          "some wood is missing.",
          "the ground is littered with small teeth",
        ],
        onLoad: (context) => applyNoisesInsideTrade(context, "teeth"),
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
      cloth: {
        key: "cloth",
        text: [
          "some wood is missing.",
          "the ground is littered with scraps of cloth",
        ],
        onLoad: (context) => applyNoisesInsideTrade(context, "cloth"),
        buttons: [
          {
            key: "leave",
            text: "leave",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.shady-builder",
    title: "The Shady Builder",
    pool: "room",
    isAvailable: (readNumber) =>
      readNumber('game.buildings["hut"]') >= 5 &&
      readNumber('game.buildings["hut"]') < 20,
    scenes: {
      start: {
        key: "start",
        text: [
          "a shady builder passes through",
          "says he can build you a hut for less wood",
        ],
        notification: "a shady builder passes through",
        buttons: [
          {
            key: "build",
            text: "300 wood",
            cost: { wood: 300 },
            nextScene: { 0.6: "steal", 1: "build" },
          },
          {
            key: "deny",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
      steal: {
        key: "steal",
        text: ["the shady builder has made off with your wood"],
        notification: "the shady builder has made off with your wood",
        buttons: [
          {
            key: "end",
            text: "go home",
            nextScene: "end",
          },
        ],
      },
      build: {
        key: "build",
        text: ["the shady builder builds a hut"],
        notification: "the shady builder builds a hut",
        onLoad: (context) => {
          const huts = context.readNumber('game.buildings["hut"]');
          if (huts < 20) {
            context.setState('game.buildings["hut"]', huts + 1);
          }
        },
        buttons: [
          {
            key: "end",
            text: "go home",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.mysterious-wanderer.wood",
    title: "The Mysterious Wanderer",
    pool: "room",
    isAvailable: (readNumber) => readNumber("stores.wood") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "a wanderer arrives with an empty cart. says if he leaves with wood, he'll be back with more.",
          "builder's not sure he's to be trusted.",
        ],
        notification: "a mysterious wanderer arrives",
        buttons: [
          {
            key: "wood100",
            text: "give 100",
            cost: { wood: 100 },
            nextScene: { 1: "wood100" },
          },
          {
            key: "wood500",
            text: "give 500",
            cost: { wood: 500 },
            nextScene: { 1: "wood500" },
          },
          {
            key: "deny",
            text: "turn him away",
            nextScene: "end",
          },
        ],
      },
      wood100: {
        key: "wood100",
        text: ["the wanderer leaves, cart loaded with wood"],
        delayedAction: {
          key: "wandererWood100",
          delaySeconds: 60,
          chance: 0.5,
          reward: { wood: 300 },
          notification:
            "the mysterious wanderer returns, cart piled high with wood.",
          source: "room",
        },
        buttons: [
          {
            key: "leave",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
      wood500: {
        key: "wood500",
        text: ["the wanderer leaves, cart loaded with wood"],
        delayedAction: {
          key: "wandererWood500",
          delaySeconds: 60,
          chance: 0.3,
          reward: { wood: 1500 },
          notification:
            "the mysterious wanderer returns, cart piled high with wood.",
          source: "room",
        },
        buttons: [
          {
            key: "leave",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.mysterious-wanderer.fur",
    title: "The Mysterious Wanderer",
    pool: "room",
    isAvailable: (readNumber) => readNumber("stores.fur") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "a wanderer arrives with an empty cart. says if she leaves with furs, she'll be back with more.",
          "builder's not sure she's to be trusted.",
        ],
        notification: "a mysterious wanderer arrives",
        buttons: [
          {
            key: "fur100",
            text: "give 100",
            cost: { fur: 100 },
            nextScene: { 1: "fur100" },
          },
          {
            key: "fur500",
            text: "give 500",
            cost: { fur: 500 },
            nextScene: { 1: "fur500" },
          },
          {
            key: "deny",
            text: "turn her away",
            nextScene: "end",
          },
        ],
      },
      fur100: {
        key: "fur100",
        text: ["the wanderer leaves, cart loaded with furs"],
        delayedAction: {
          key: "wandererFur100",
          delaySeconds: 60,
          chance: 0.5,
          reward: { fur: 300 },
          notification:
            "the mysterious wanderer returns, cart piled high with furs.",
          source: "room",
        },
        buttons: [
          {
            key: "leave",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
      fur500: {
        key: "fur500",
        text: ["the wanderer leaves, cart loaded with furs"],
        delayedAction: {
          key: "wandererFur500",
          delaySeconds: 60,
          chance: 0.3,
          reward: { fur: 1500 },
          notification:
            "the mysterious wanderer returns, cart piled high with furs.",
          source: "room",
        },
        buttons: [
          {
            key: "leave",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.master",
    title: "The Master",
    pool: "room",
    isAvailable: (readNumber) => readNumber("features.location.world") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "an old wanderer arrives.",
          "he smiles warmly and asks for lodgings for the night.",
        ],
        notification: "an old wanderer arrives",
        buttons: [
          {
            key: "agree",
            text: "agree",
            cost: {
              "cured meat": 100,
              fur: 100,
              torch: 1,
            },
            nextScene: { 1: "agree" },
          },
          {
            key: "deny",
            text: "turn him away",
            nextScene: "end",
          },
        ],
      },
      agree: {
        key: "agree",
        text: ["in exchange, the wanderer offers his wisdom."],
        buttons: [
          {
            key: "evasion",
            text: "evasion",
            available: (context) =>
              context.readNumber('character.perks["evasive"]') < 1,
            onChoose: (context) => context.addPerk("evasive"),
            nextScene: "end",
          },
          {
            key: "precision",
            text: "precision",
            available: (context) =>
              context.readNumber('character.perks["precise"]') < 1,
            onChoose: (context) => context.addPerk("precise"),
            nextScene: "end",
          },
          {
            key: "force",
            text: "force",
            available: (context) =>
              context.readNumber('character.perks["barbarian"]') < 1,
            onChoose: (context) => context.addPerk("barbarian"),
            nextScene: "end",
          },
          {
            key: "nothing",
            text: "nothing",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.scout",
    title: "The Scout",
    pool: "room",
    isAvailable: (readNumber) => readNumber("features.location.world") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "the scout says she's been all over.",
          "willing to talk about it, for a price.",
        ],
        notification: "a scout stops for the night",
        buttons: [
          {
            key: "buyMap",
            text: "buy map",
            cost: { fur: 200, scales: 10 },
            available: (context) =>
              context.readNumber("game.world.seenAll") < 1 &&
              context.canApplyMap(),
            notification: "the map uncovers a bit of the world",
            onChoose: (context) => context.applyMap(),
          },
          {
            key: "learn",
            text: "learn scouting",
            cost: { fur: 1000, scales: 50, teeth: 20 },
            available: (context) =>
              context.readNumber('character.perks["scout"]') < 1,
            onChoose: (context) => context.addPerk("scout"),
          },
          {
            key: "leave",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "room.sick-man",
    title: "The Sick Man",
    pool: "room",
    isAvailable: (readNumber) => readNumber("stores.medicine") > 0,
    scenes: {
      start: {
        key: "start",
        text: ["a man hobbles up, coughing.", "he begs for medicine."],
        notification: "a sick man hobbles up",
        buttons: [
          {
            key: "help",
            text: "give 1 medicine",
            cost: { medicine: 1 },
            notification: "the man swallows the medicine eagerly",
            nextScene: {
              0.1: "alloy",
              0.3: "cells",
              0.5: "scales",
              1: "nothing",
            },
          },
          {
            key: "ignore",
            text: "tell him to leave",
            nextScene: "end",
          },
        ],
      },
      alloy: {
        key: "alloy",
        text: [
          "the man is thankful.",
          "he leaves a reward.",
          "some weird metal he picked up on his travels.",
        ],
        reward: { "alien alloy": 1 },
        buttons: [
          {
            key: "bye",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
      cells: {
        key: "cells",
        text: [
          "the man is thankful.",
          "he leaves a reward.",
          "some weird glowing boxes he picked up on his travels.",
        ],
        reward: { "energy cell": 3 },
        buttons: [
          {
            key: "bye",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
      scales: {
        key: "scales",
        text: [
          "the man is thankful.",
          "he leaves a reward.",
          "all he has are some scales.",
        ],
        reward: { scales: 5 },
        buttons: [
          {
            key: "bye",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
      nothing: {
        key: "nothing",
        text: ["the man expresses his thanks and hobbles off."],
        buttons: [
          {
            key: "bye",
            text: "say goodbye",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "outside.ruined-trap",
    title: "A Ruined Trap",
    pool: "outside",
    isAvailable: (readNumber) => readNumber('game.buildings["trap"]') > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "some of the traps have been torn apart.",
          "large prints lead away, into the forest.",
        ],
        onLoad: (context) => {
          const traps = context.readNumber('game.buildings["trap"]');
          const wrecked = Math.floor(context.rng() * traps) + 1;
          context.setState(
            'game.buildings["trap"]',
            Math.max(0, traps - wrecked),
          );
        },
        notification: "some traps have been destroyed",
        buttons: [
          {
            key: "track",
            text: "track them",
            nextScene: { 0.5: "nothing", 1: "catch" },
          },
          {
            key: "ignore",
            text: "ignore them",
            nextScene: "end",
          },
        ],
      },
      nothing: {
        key: "nothing",
        text: [
          "the tracks disappear after just a few minutes.",
          "the forest is silent.",
        ],
        notification: "nothing was found",
        buttons: [
          {
            key: "end",
            text: "go home",
            nextScene: "end",
          },
        ],
      },
      catch: {
        key: "catch",
        text: [
          "not far from the village lies a large beast, its fur matted with blood.",
          "it puts up little resistance before the knife.",
        ],
        notification: "there was a beast. it's dead now",
        reward: {
          fur: 100,
          meat: 100,
          teeth: 10,
        },
        buttons: [
          {
            key: "end",
            text: "go home",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "outside.hut-fire",
    title: "Fire",
    pool: "outside",
    isAvailable: (readNumber) =>
      readNumber('game.buildings["hut"]') > 0 &&
      readNumber("game.population") > 50,
    scenes: {
      start: {
        key: "start",
        text: [
          "a fire rampages through one of the huts, destroying it.",
          "all residents in the hut perished in the fire.",
        ],
        notification: "a fire has started",
        onLoad: (context) => {
          context.destroyHuts(1);
        },
        buttons: [
          {
            key: "mourn",
            text: "mourn",
            notification: "some villagers have died",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "outside.sickness",
    title: "Sickness",
    pool: "outside",
    isAvailable: (readNumber) =>
      readNumber("game.population") > 10 &&
      readNumber("game.population") < 50 &&
      readNumber("stores.medicine") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "a sickness is spreading through the village.",
          "medicine is needed immediately.",
        ],
        notification: "some villagers are ill",
        buttons: [
          {
            key: "heal",
            text: "1 medicine",
            cost: { medicine: 1 },
            nextScene: { 1: "healed" },
          },
          {
            key: "ignore",
            text: "ignore it",
            nextScene: { 1: "death" },
          },
        ],
      },
      healed: {
        key: "healed",
        text: ["the sickness is cured in time."],
        notification: "sufferers are healed",
        buttons: [
          {
            key: "end",
            text: "go home",
            nextScene: "end",
          },
        ],
      },
      death: {
        key: "death",
        text: [
          "the sickness spreads through the village.",
          "the days are spent with burials.",
          "the nights are rent with screams.",
        ],
        notification: "sufferers are left to die",
        onLoad: (context) => {
          const killed =
            Math.floor(
              context.rng() *
                Math.floor(context.readNumber("game.population") / 2),
            ) + 1;
          context.killVillagers(killed);
        },
        buttons: [
          {
            key: "end",
            text: "go home",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "outside.plague",
    title: "Plague",
    pool: "outside",
    isAvailable: (readNumber) =>
      readNumber("game.population") > 50 && readNumber("stores.medicine") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "a terrible plague is fast spreading through the village.",
          "medicine is needed immediately.",
        ],
        notification: "a plague afflicts the village",
        buttons: [
          {
            key: "buyMedicine",
            text: "buy medicine",
            cost: { scales: 70, teeth: 50 },
            reward: { medicine: 1 },
          },
          {
            key: "heal",
            text: "5 medicine",
            cost: { medicine: 5 },
            nextScene: { 1: "healed" },
          },
          {
            key: "ignore",
            text: "do nothing",
            nextScene: { 1: "death" },
          },
        ],
      },
      healed: {
        key: "healed",
        text: [
          "the plague is kept from spreading.",
          "only a few die.",
          "the rest bury them.",
        ],
        notification: "epidemic is eradicated eventually",
        onLoad: (context) => {
          const killed = Math.floor(context.rng() * 5) + 2;
          context.killVillagers(killed);
        },
        buttons: [
          {
            key: "end",
            text: "go home",
            nextScene: "end",
          },
        ],
      },
      death: {
        key: "death",
        text: [
          "the plague rips through the village.",
          "the nights are rent with screams.",
          "the only hope is a quick death.",
        ],
        notification: "population is almost exterminated",
        onLoad: (context) => {
          const killed = Math.floor(context.rng() * 80) + 10;
          context.killVillagers(killed);
        },
        buttons: [
          {
            key: "end",
            text: "go home",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "outside.beast-attack",
    title: "A Beast Attack",
    pool: "outside",
    isAvailable: (readNumber) => readNumber("game.population") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "a pack of snarling beasts pours out of the trees.",
          "the fight is short and bloody, but the beasts are repelled.",
          "the villagers retreat to mourn the dead.",
        ],
        notification: "wild beasts attack the villagers",
        onLoad: (context) => {
          const killed = Math.floor(context.rng() * 10) + 1;
          context.killVillagers(killed);
        },
        reward: {
          fur: 100,
          meat: 100,
          teeth: 10,
        },
        buttons: [
          {
            key: "end",
            text: "go home",
            notification: "predators become prey. price is unfair",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "outside.military-raid",
    title: "A Military Raid",
    pool: "outside",
    isAvailable: (readNumber) =>
      readNumber("game.population") > 0 && readNumber("game.cityCleared") > 0,
    scenes: {
      start: {
        key: "start",
        text: [
          "a gunshot rings through the trees.",
          "well armed men charge out of the forest, firing into the crowd.",
          "after a skirmish they are driven away, but not without losses.",
        ],
        notification: "troops storm the village",
        onLoad: (context) => {
          const killed = Math.floor(context.rng() * 40) + 1;
          context.killVillagers(killed);
        },
        reward: {
          bullets: 10,
          "cured meat": 50,
        },
        buttons: [
          {
            key: "end",
            text: "go home",
            notification: "warfare is bloodthirsty",
            nextScene: "end",
          },
        ],
      },
    },
  },
  {
    key: "marketing.penrose",
    title: "Penrose",
    pool: "marketing",
    isAvailable: (readNumber) => readNumber("marketing.penrose") < 1,
    scenes: {
      start: {
        key: "start",
        text: [
          "a strange thrumming, pounding and crashing. visions of people and places, of a huge machine and twisting curves.",
          "inviting. it would be so easy to give in, completely.",
        ],
        notification:
          "a strange thrumming, pounding and crashing. and then gone.",
        buttons: [
          {
            key: "give in",
            text: "give in",
            link: "https://penrose.doublespeakgames.com/?utm_source=adarkroom&utm_medium=crosspromote&utm_campaign=event",
            onChoose: (context) => {
              context.setState("marketing.penrose", true);
            },
          },
          {
            key: "ignore",
            text: "ignore it",
            nextScene: "end",
          },
        ],
      },
    },
  },
  ...originalEncounterDefinitions,
  ...originalSetpieceDefinitions,
  ...originalExecutionerDefinitions,
];

function createCombatEncounter(options: {
  key: string;
  title: string;
  notification: string;
  combat: OriginalCombatDefinition;
}): OriginalEventDefinition {
  return {
    key: options.key,
    title: options.title,
    pool: "encounter",
    isAvailable: () => false,
    scenes: {
      start: {
        key: "start",
        text: [],
        notification: options.notification,
        combat: options.combat,
        buttons: [],
      },
    },
  };
}

function applyNoisesInsideTrade(
  context: OriginalEventEffectContext,
  rewardKey: "scales" | "teeth" | "cloth",
): void {
  let wood = Math.floor(context.readNumber("stores.wood") * 0.1);
  if (wood === 0) wood = 1;
  let reward = Math.floor(wood / 5);
  if (reward === 0) reward = 1;
  context.addStores({ wood: -wood, [rewardKey]: reward });
}
