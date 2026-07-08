import { canonicalManifest } from "../manifest/canonicalManifest";

export interface OriginalPathWeightOverride {
  key: string;
  weight: number;
}

export interface OriginalPathCapacityUpgrade {
  key: string;
  bonus: number;
}

export interface OriginalPathCarryable {
  key: string;
  type: "tool" | "weapon";
  desc?: "cured meat heal" | "medicine heal" | "rifle ammo" | "soft red glow";
}

export const DEFAULT_BAG_SPACE = 10;
export const DEFAULT_ITEM_WEIGHT = 1;
export const PATH_STORES_OFFSET = 0;

export const originalPathWeightOverrides: OriginalPathWeightOverride[] = [
  { key: "bone spear", weight: 2 },
  { key: "iron sword", weight: 3 },
  { key: "steel sword", weight: 5 },
  { key: "rifle", weight: 5 },
  { key: "bullets", weight: 0.1 },
  { key: "energy cell", weight: 0.2 },
  { key: "laser rifle", weight: 5 },
  { key: "plasma rifle", weight: 5 },
  { key: "bolas", weight: 0.5 },
];

export const originalPathCapacityUpgrades: OriginalPathCapacityUpgrade[] = [
  { key: "cargo drone", bonus: 100 },
  { key: "convoy", bonus: 60 },
  { key: "wagon", bonus: 30 },
  { key: "rucksack", bonus: 10 },
];

export const originalPathArmourPriority = [
  "kinetic armour",
  "s armour",
  "i armour",
  "l armour",
] as const;

export const originalPathBaseCarryables: OriginalPathCarryable[] = [
  { key: "cured meat", type: "tool", desc: "cured meat heal" },
  { key: "bullets", type: "tool", desc: "rifle ammo" },
  { key: "grenade", type: "weapon" },
  { key: "bolas", type: "weapon" },
  { key: "laser rifle", type: "weapon" },
  { key: "energy cell", type: "tool", desc: "soft red glow" },
  { key: "bayonet", type: "weapon" },
  { key: "charm", type: "tool" },
  { key: "alien alloy", type: "tool" },
  { key: "medicine", type: "tool", desc: "medicine heal" },
];

export function originalPathWeightFor(itemKey: string): number {
  return (
    originalPathWeightOverrides.find((entry) => entry.key === itemKey)
      ?.weight ?? DEFAULT_ITEM_WEIGHT
  );
}

export function originalPathCapacity(
  stores: Partial<Record<string, number>>,
): number {
  const upgrade = originalPathCapacityUpgrades.find(
    (entry) => (stores[entry.key] ?? 0) > 0,
  );
  return DEFAULT_BAG_SPACE + (upgrade?.bonus ?? 0);
}

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const keys = originalPathWeightOverrides.map((entry) => entry.key);
  if (
    keys.join("\u0000") !==
    canonicalManifest.keys.pathWeightOverrides.join("\u0000")
  ) {
    throw new Error(
      "Original path weight keys do not match canonical manifest",
    );
  }
}
