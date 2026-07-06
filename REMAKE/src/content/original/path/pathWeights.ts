import { canonicalManifest } from "../manifest/canonicalManifest";

export interface OriginalPathWeightOverride {
  key: string;
  weight: number;
}

export const DEFAULT_BAG_SPACE = 10;
export const DEFAULT_ITEM_WEIGHT = 1;

export const originalPathWeightOverrides: OriginalPathWeightOverride[] = [
  { key: "bone spear", weight: 2 },
  { key: "iron sword", weight: 3 },
  { key: "steel sword", weight: 5 },
  { key: "rifle", weight: 5 },
  { key: "bullets", weight: 0.1 },
  { key: "energy cell", weight: 0.2 },
  { key: "laser rifle", weight: 5 },
  { key: "plasma rifle", weight: 5 },
  { key: "bolas", weight: 0.5 }
];

export function originalPathWeightFor(itemKey: string): number {
  return (
    originalPathWeightOverrides.find((entry) => entry.key === itemKey)?.weight ??
    DEFAULT_ITEM_WEIGHT
  );
}

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const keys = originalPathWeightOverrides.map((entry) => entry.key);
  if (
    keys.join("\u0000") !==
    canonicalManifest.keys.pathWeightOverrides.join("\u0000")
  ) {
    throw new Error("Original path weight keys do not match canonical manifest");
  }
}
