import { canonicalManifest } from "../manifest/canonicalManifest";

export interface OutsideWorkerIncomeDefinition {
  key: string;
  name: string;
  delay: number;
  stores: Record<string, number>;
}

export interface OutsideTrapDropDefinition {
  rollUnder: number;
  name: string;
  message: string;
}

export interface OutsideVillageTitleThreshold {
  maxHuts: number;
  title: string;
}

export interface OutsidePopulationMessageThreshold {
  maxArrivals: number;
  message: string;
}

export const OUTSIDE_STORES_OFFSET = 0;
export const OUTSIDE_GATHER_DELAY = 60;
export const OUTSIDE_TRAPS_DELAY = 90;
export const OUTSIDE_POP_DELAY_MIN = 0.5;
export const OUTSIDE_POP_DELAY_MAX = 3;
export const OUTSIDE_HUT_ROOM = 4;
export const OUTSIDE_GATHER_WOOD_AMOUNT = 10;
export const OUTSIDE_CART_GATHER_WOOD_AMOUNT = 50;

export const originalOutsideWorkerIncome: OutsideWorkerIncomeDefinition[] = [
  {
    key: "gatherer",
    name: "gatherer",
    delay: 10,
    stores: { wood: 1 }
  },
  {
    key: "hunter",
    name: "hunter",
    delay: 10,
    stores: { fur: 0.5, meat: 0.5 }
  },
  {
    key: "trapper",
    name: "trapper",
    delay: 10,
    stores: { meat: -1, bait: 1 }
  },
  {
    key: "tanner",
    name: "tanner",
    delay: 10,
    stores: { fur: -5, leather: 1 }
  },
  {
    key: "charcutier",
    name: "charcutier",
    delay: 10,
    stores: { meat: -5, wood: -5, "cured meat": 1 }
  },
  {
    key: "iron miner",
    name: "iron miner",
    delay: 10,
    stores: { "cured meat": -1, iron: 1 }
  },
  {
    key: "coal miner",
    name: "coal miner",
    delay: 10,
    stores: { "cured meat": -1, coal: 1 }
  },
  {
    key: "sulphur miner",
    name: "sulphur miner",
    delay: 10,
    stores: { "cured meat": -1, sulphur: 1 }
  },
  {
    key: "steelworker",
    name: "steelworker",
    delay: 10,
    stores: { iron: -1, coal: -1, steel: 1 }
  },
  {
    key: "armourer",
    name: "armourer",
    delay: 10,
    stores: { steel: -1, sulphur: -1, bullets: 1 }
  }
];

export const originalTrapDrops: OutsideTrapDropDefinition[] = [
  { rollUnder: 0.5, name: "fur", message: "scraps of fur" },
  { rollUnder: 0.75, name: "meat", message: "bits of meat" },
  { rollUnder: 0.85, name: "scales", message: "strange scales" },
  { rollUnder: 0.93, name: "teeth", message: "scattered teeth" },
  { rollUnder: 0.995, name: "cloth", message: "tattered cloth" },
  { rollUnder: 1, name: "charm", message: "a crudely made charm" }
];

export const originalOutsideWorkerUnlocks = {
  lodge: ["hunter", "trapper"],
  tannery: ["tanner"],
  smokehouse: ["charcutier"],
  "iron mine": ["iron miner"],
  "coal mine": ["coal miner"],
  "sulphur mine": ["sulphur miner"],
  steelworks: ["steelworker"],
  armoury: ["armourer"]
} as const satisfies Record<string, readonly string[]>;

export const originalVillageTitleThresholds: OutsideVillageTitleThreshold[] = [
  { maxHuts: 0, title: "A Silent Forest" },
  { maxHuts: 1, title: "A Lonely Hut" },
  { maxHuts: 4, title: "A Tiny Village" },
  { maxHuts: 8, title: "A Modest Village" },
  { maxHuts: 14, title: "A Large Village" },
  { maxHuts: Infinity, title: "A Raucous Village" }
];

export const originalPopulationMessageThresholds: OutsidePopulationMessageThreshold[] =
  [
    { maxArrivals: 1, message: "a stranger arrives in the night" },
    {
      maxArrivals: 4,
      message: "a weathered family takes up in one of the huts."
    },
    { maxArrivals: 9, message: "a small group arrives, all dust and bones." },
    {
      maxArrivals: 29,
      message: "a convoy lurches in, equal parts worry and hope."
    },
    { maxArrivals: Infinity, message: "the town's booming. word does get around." }
  ];

export function originalMaxPopulation(huts: number): number {
  return huts * OUTSIDE_HUT_ROOM;
}

export function originalGatherWoodAmount(hasCart: boolean): number {
  return hasCart ? OUTSIDE_CART_GATHER_WOOD_AMOUNT : OUTSIDE_GATHER_WOOD_AMOUNT;
}

export function originalTrapDropCount(traps: number, bait: number): number {
  return traps + Math.min(bait, traps);
}

export function originalBaitUsedForTraps(traps: number, bait: number): number {
  return Math.min(bait, traps);
}

export function originalVillageTitleForHuts(huts: number): string {
  return originalVillageTitleThresholds.find((threshold) => huts <= threshold.maxHuts)
    ?.title as string;
}

export function originalPopulationMessageForArrivals(arrivals: number): string {
  return originalPopulationMessageThresholds.find(
    (threshold) => arrivals <= threshold.maxArrivals
  )?.message as string;
}

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const workerKeys = originalOutsideWorkerIncome.map((worker) => worker.key);
  if (workerKeys.join("\u0000") !== canonicalManifest.keys.workers.join("\u0000")) {
    throw new Error("Original outside worker keys do not match canonical manifest");
  }
}
