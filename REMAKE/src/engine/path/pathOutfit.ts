import type { GameEngine } from "../GameEngine";
import {
  originalFabricatorCraftables,
  originalPathArmourPriority,
  originalPathBaseCarryables,
  originalRoomCraftables,
  originalWorldWeapons,
  WORLD_BASE_HEALTH,
  WORLD_BASE_WATER,
  WORLD_MEAT_HEAL,
  WORLD_MEDS_HEAL,
} from "../../content/original";
import type { WorldWeaponDamage } from "../../content/original/world/worldData";
import { readNumericRecord } from "../state/selectors";

export type PathCarryableType = "tool" | "weapon";

export interface PathCarryableDefinition {
  key: string;
  name: string;
  type: PathCarryableType;
  desc?: string;
  damage?: WorldWeaponDamage;
}

export type PathArmourLabel = "none" | "leather" | "iron" | "steel" | "kinetic";

const BASE_CARRYABLE_DESCRIPTIONS: Record<string, string> = {
  "cured meat": `restores ${WORLD_MEAT_HEAL} hp`,
  bullets: "use with rifle",
  "energy cell": "emits a soft red glow",
  medicine: `restores ${WORLD_MEDS_HEAL} hp`,
};

const ALWAYS_KEPT_ON_SAFE_RETURN = new Set([
  "cured meat",
  "bullets",
  "energy cell",
  "charm",
  "medicine",
  "stim",
  "hypo",
]);

export const originalPathCarryables = buildOriginalPathCarryables();

export function originalPathCanCarry(key: string): boolean {
  return originalPathCarryables.some((carryable) => carryable.key === key);
}

export function originalPathArmour(
  stores: Partial<Record<string, number>>,
): PathArmourLabel {
  const best = originalPathArmourPriority.find((key) => (stores[key] ?? 0) > 0);
  if (best === "kinetic armour") return "kinetic";
  if (best === "s armour") return "steel";
  if (best === "i armour") return "iron";
  if (best === "l armour") return "leather";
  return "none";
}

export function originalPathMaxHealth(
  stores: Partial<Record<string, number>>,
): number {
  const armour = originalPathArmour(stores);
  if (armour === "kinetic") return WORLD_BASE_HEALTH + 75;
  if (armour === "steel") return WORLD_BASE_HEALTH + 35;
  if (armour === "iron") return WORLD_BASE_HEALTH + 15;
  if (armour === "leather") return WORLD_BASE_HEALTH + 5;
  return WORLD_BASE_HEALTH;
}

export function originalPathMaxWater(
  stores: Partial<Record<string, number>>,
): number {
  if ((stores["fluid recycler"] ?? 0) > 0) return WORLD_BASE_WATER + 100;
  if ((stores["water tank"] ?? 0) > 0) return WORLD_BASE_WATER + 50;
  if ((stores.cask ?? 0) > 0) return WORLD_BASE_WATER + 20;
  if ((stores.waterskin ?? 0) > 0) return WORLD_BASE_WATER + 10;
  return WORLD_BASE_WATER;
}

export function originalPathReturnOutfitToStores(engine: GameEngine): void {
  for (const [key, amount] of Object.entries(
    readNumericRecord(engine.state.forRuntime("pathOutfit"), "outfit"),
  )) {
    if (amount <= 0) continue;
    engine.state.forRuntime("pathOutfit").add(`stores["${key}"]`, amount);
    if (originalPathLeaveItAtHome(key)) {
      engine.state.forRuntime("pathOutfit").set(`outfit["${key}"]`, 0);
    }
  }
}

export function originalPathLeaveItAtHome(key: string): boolean {
  if (ALWAYS_KEPT_ON_SAFE_RETURN.has(key)) return false;
  if (originalWorldWeapons.some((weapon) => weapon.key === key)) return false;
  if (originalRoomCraftables.some((craftable) => craftable.key === key)) {
    return false;
  }
  if (originalFabricatorCraftables.some((craftable) => craftable.key === key)) {
    return false;
  }
  return true;
}

function buildOriginalPathCarryables(): readonly PathCarryableDefinition[] {
  const definitions = new Map<string, PathCarryableDefinition>();

  for (const carryable of originalPathBaseCarryables) {
    definitions.set(carryable.key, {
      key: carryable.key,
      name: carryable.key,
      type: carryable.type,
      desc: BASE_CARRYABLE_DESCRIPTIONS[carryable.key],
      damage: weaponDamage(carryable.key),
    });
  }

  for (const craftable of originalRoomCraftables) {
    if (craftable.type !== "tool" && craftable.type !== "weapon") continue;
    definitions.set(craftable.key, {
      key: craftable.key,
      name: craftable.name,
      type: craftable.type,
      damage: weaponDamage(craftable.key),
    });
  }

  for (const craftable of originalFabricatorCraftables) {
    if (craftable.type !== "tool" && craftable.type !== "weapon") continue;
    definitions.set(craftable.key, {
      key: craftable.key,
      name: craftable.name,
      type: craftable.type,
      damage: weaponDamage(craftable.key),
    });
  }

  return [...definitions.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function weaponDamage(key: string): WorldWeaponDamage | undefined {
  return originalWorldWeapons.find((weapon) => weapon.key === key)?.damage;
}
