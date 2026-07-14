import { canonicalManifest } from "../manifest/canonicalManifest";

export type OriginalPrestigeStoreType = "g" | "w" | "a";

export interface OriginalPrestigeStoreDefinition {
  key: string;
  type: OriginalPrestigeStoreType;
}

export interface OriginalPrestigeRng {
  next(): number;
}

export const originalPrestigeStores: OriginalPrestigeStoreDefinition[] = [
  { key: "wood", type: "g" },
  { key: "fur", type: "g" },
  { key: "meat", type: "g" },
  { key: "iron", type: "g" },
  { key: "coal", type: "g" },
  { key: "sulphur", type: "g" },
  { key: "steel", type: "g" },
  { key: "cured meat", type: "g" },
  { key: "scales", type: "g" },
  { key: "teeth", type: "g" },
  { key: "leather", type: "g" },
  { key: "bait", type: "g" },
  { key: "torch", type: "g" },
  { key: "cloth", type: "g" },
  { key: "bone spear", type: "w" },
  { key: "iron sword", type: "w" },
  { key: "steel sword", type: "w" },
  { key: "bayonet", type: "w" },
  { key: "rifle", type: "w" },
  { key: "laser rifle", type: "w" },
  { key: "bullets", type: "a" },
  { key: "energy cell", type: "a" },
  { key: "grenade", type: "a" },
  { key: "bolas", type: "a" },
];

/** Preserves Prestige.randGen, including its unusual two-roll ammo curve. */
export function originalPrestigeDivisor(
  type: OriginalPrestigeStoreType,
  rng: OriginalPrestigeRng,
): number {
  let amount: number;
  if (type === "g") amount = Math.floor(rng.next() * 10);
  else if (type === "w") amount = Math.floor(Math.floor(rng.next() * 10) / 2);
  else amount = Math.ceil(rng.next() * 10 * Math.ceil(rng.next() * 10));
  return amount === 0 ? 1 : amount;
}

export function originalReducedPrestigeStores(
  stores: Readonly<Record<string, number>>,
  rng: OriginalPrestigeRng,
): number[] {
  return originalPrestigeStores.map(({ key, type }) =>
    Math.floor((stores[key] ?? 0) / originalPrestigeDivisor(type, rng)),
  );
}

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const keys = originalPrestigeStores.map((store) => store.key);
  if (
    keys.join("\u0000") !== canonicalManifest.keys.prestigeStores.join("\u0000")
  ) {
    throw new Error(
      "Original prestige store keys do not match canonical manifest",
    );
  }
}
