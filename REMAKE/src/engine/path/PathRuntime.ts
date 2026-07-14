import type { GameEngine } from "../GameEngine";
import {
  originalPerks,
  type OriginalPerkDefinition,
} from "../../content/original/core/perks";
import {
  originalPathCapacity,
  originalPathWeightFor,
} from "../../content/original/path/pathWeights";
import {
  originalWorldCompassDirection,
  type WorldCompassDirection,
} from "../../content/original/world/worldData";
import type { CooldownSnapshot } from "../cooldowns/CooldownManager";
import {
  readBoolean,
  readNumber,
  readNumericRecord,
  readStringUnion,
} from "../state/selectors";
import {
  originalPathArmour,
  originalPathCanCarry,
  originalPathCarryables,
  originalPathMaxWater,
  type PathArmourLabel,
  type PathCarryableType,
} from "./pathOutfit";
import type { WorldWeaponDamage } from "../../content/original/world/worldData";
import { EXPEDITION_EMBARK_COOLDOWN_KEY } from "../world/ExpeditionTransaction";

export type PathReturnDestination = "room" | "path";

export interface PathSupplySnapshot {
  key: string;
  name: string;
  type: PathCarryableType;
  desc?: string;
  damage?: WorldWeaponDamage;
  store: number;
  outfit: number;
  weight: number;
  canIncrease: boolean;
  canDecrease: boolean;
  canIncreaseMany: boolean;
  canDecreaseMany: boolean;
}

export interface PathPerkSnapshot {
  key: string;
  name: string;
  desc: string;
}

export interface PathStateSnapshot {
  unlocked: boolean;
  title: "A Dusty Path";
  capacity: number;
  used: number;
  free: number;
  armour: PathArmourLabel;
  water: number;
  compassDirection: WorldCompassDirection;
  supplies: PathSupplySnapshot[];
  perks: PathPerkSnapshot[];
  canEmbark: boolean;
  embarkCooldown: CooldownSnapshot;
  pendingReturn: boolean;
}

export class PathRuntime {
  constructor(private readonly engine: GameEngine) {}

  update(): void {
    if (this.unlocked()) {
      this.engine.state.set("features.location.path", true, true);
      this.normalizeOutfitForPath();
    }
  }

  onArrival(): void {
    if (!this.unlocked()) return;
    this.engine.state.set("features.location.path", true);
    this.normalizeOutfitForPath();
    if (!readBoolean(this.engine.state, "game.path.seen")) {
      this.notifyCompassDirection();
    }
  }

  openFromCompassPurchase(): void {
    this.engine.state.set("features.location.path", true);
    if (!readBoolean(this.engine.state, "game.path.seen")) {
      this.notifyCompassDirection();
    }
  }

  snapshot(): PathStateSnapshot {
    const stores = readNumericRecord(this.engine.state, "stores");
    const outfit = readNumericRecord(this.engine.state, "outfit");
    const capacity = originalPathCapacity(stores);
    const used = this.outfitWeight(outfit);
    const free = Math.max(0, capacity - used);
    const embarkCooldown = this.engine.cooldowns.snapshot(
      EXPEDITION_EMBARK_COOLDOWN_KEY,
    );
    return {
      unlocked: this.unlocked(),
      title: "A Dusty Path",
      capacity,
      used,
      free,
      armour: originalPathArmour(stores),
      water: originalPathMaxWater(stores),
      compassDirection: this.compassDirection(),
      supplies: this.supplyRows(stores, outfit, free),
      perks: this.perkRows(),
      canEmbark:
        (outfit["cured meat"] ?? 0) > 0 &&
        !readBoolean(this.engine.state, "game.world.active") &&
        !embarkCooldown.active,
      embarkCooldown,
      pendingReturn: readBoolean(this.engine.state, "game.path.pendingReturn"),
    };
  }

  navigationSnapshot(): Pick<PathStateSnapshot, "unlocked" | "title"> {
    return {
      unlocked: this.unlocked(),
      title: "A Dusty Path",
    };
  }

  compassHeading(): WorldCompassDirection {
    return this.compassDirection();
  }

  increaseSupply(key: string, amount: number): boolean {
    if (!this.unlocked()) return false;
    if (!originalPathCanCarry(key)) return false;
    this.normalizeOutfitForPath();
    const stores = readNumericRecord(this.engine.state, "stores");
    const outfit = readNumericRecord(this.engine.state, "outfit");
    const available = Math.floor((stores[key] ?? 0) - (outfit[key] ?? 0));
    if (available <= 0) return false;
    const weight = originalPathWeightFor(key);
    const free = Math.max(
      0,
      originalPathCapacity(stores) - this.outfitWeight(outfit),
    );
    const byWeight =
      weight <= 0 ? available : Math.floor((free + 1e-9) / weight);
    const delta = Math.min(amount, available, byWeight);
    if (delta <= 0) return false;
    this.engine.state.add(`outfit["${key}"]`, delta);
    return true;
  }

  decreaseSupply(key: string, amount: number): boolean {
    if (!this.unlocked()) return false;
    if (!originalPathCanCarry(key)) return false;
    this.normalizeOutfitForPath();
    const current = readNumber(this.engine.state, `outfit["${key}"]`);
    const delta = Math.min(amount, current);
    if (delta <= 0) return false;
    this.engine.state.add(`outfit["${key}"]`, -delta);
    return true;
  }

  embark(): boolean {
    this.normalizeOutfitForPath();
    const snapshot = this.snapshot();
    if (!snapshot.canEmbark) return false;
    for (const supply of snapshot.supplies) {
      if (supply.outfit <= 0) continue;
      this.engine.state.add(`stores["${supply.key}"]`, -supply.outfit);
    }
    this.engine.state.remove("game.path.pendingReturn");
    this.engine.notifications.notify(
      "path",
      "a strange world stretches before you",
    );
    return true;
  }

  consumeWorldReturnLocation(): PathReturnDestination | null {
    const returnLocation = readStringUnion(
      this.engine.state,
      "game.world.returnLocation",
      ["room", "path"] as const,
    );
    if (!returnLocation) return null;

    this.engine.state.set("game.world.lastReturnLocation", returnLocation);
    this.engine.state.remove("game.world.returnLocation");

    if (returnLocation === "room") {
      this.engine.state.remove("game.path.pendingReturn");
      return "room";
    }

    this.engine.state.set("features.location.path", true);
    this.engine.state.set("game.path.pendingReturn", true);
    return "path";
  }

  private unlocked(): boolean {
    return (
      readBoolean(this.engine.state, "features.location.path") ||
      readNumber(this.engine.state, 'stores["compass"]') > 0 ||
      readNumber(this.engine.state, "stores.compass") > 0
    );
  }

  private supplyRows(
    stores: Record<string, number>,
    outfit: Record<string, number>,
    free: number,
  ): PathSupplySnapshot[] {
    return originalPathCarryables
      .filter(
        (carryable) =>
          (stores[carryable.key] ?? 0) > 0 || (outfit[carryable.key] ?? 0) > 0,
      )
      .map((carryable) => {
        const store = stores[carryable.key] ?? 0;
        const carried = outfit[carryable.key] ?? 0;
        const weight = originalPathWeightFor(carryable.key);
        const canFitOne = weight <= 0 || weight <= free + 1e-9;
        const canIncrease = carried < store && canFitOne;
        return {
          key: carryable.key,
          name: carryable.name,
          type: carryable.type,
          desc: carryable.desc,
          damage: carryable.damage,
          store,
          outfit: carried,
          weight,
          canIncrease,
          canDecrease: carried > 0,
          canIncreaseMany: canIncrease,
          canDecreaseMany: carried > 0,
        };
      });
  }

  private perkRows(): PathPerkSnapshot[] {
    return originalPerks
      .filter((perk) => this.hasPerk(perk))
      .map((perk) => ({
        key: perk.key,
        name: perk.name,
        desc: perk.desc,
      }));
  }

  private hasPerk(perk: OriginalPerkDefinition): boolean {
    return readBoolean(this.engine.state, `character.perks["${perk.key}"]`);
  }

  private normalizeOutfitForPath(): void {
    if (readBoolean(this.engine.state, "game.world.active")) return;

    for (const carryable of originalPathCarryables) {
      const carried = this.numberOrNull(`outfit["${carryable.key}"]`);
      if (carried === null) continue;

      const store = this.numberOrNull(`stores["${carryable.key}"]`);
      if (store === null) {
        if (carried < 0) {
          this.engine.state.set(`outfit["${carryable.key}"]`, 0, true);
        }
        continue;
      }

      const clamped = Math.max(0, Math.min(carried, store));
      if (clamped !== carried) {
        this.engine.state.set(`outfit["${carryable.key}"]`, clamped, true);
      }
    }
  }

  private compassDirection(): WorldCompassDirection {
    const storedDirection = readStringUnion(
      this.engine.state,
      "game.world.shipDirection",
      [
        "north",
        "south",
        "east",
        "west",
        "northeast",
        "northwest",
        "southeast",
        "southwest",
      ] as const,
    );
    if (storedDirection) return storedDirection;

    const shipX =
      this.numberOrNull("game.world.shipPosition.x") ??
      this.numberOrNull("game.world.ship.x");
    const shipY =
      this.numberOrNull("game.world.shipPosition.y") ??
      this.numberOrNull("game.world.ship.y");
    if (shipX !== null && shipY !== null) {
      return originalWorldCompassDirection({ x: shipX, y: shipY });
    }

    return "north";
  }

  private notifyCompassDirection(): void {
    this.engine.state.set("game.path.seen", true);
    this.engine.notifications.notify(
      "room",
      `the compass points ${this.compassDirection()}`,
    );
  }

  private numberOrNull(path: string): number | null {
    const value = this.engine.state.get(path);
    return typeof value === "number" ? value : null;
  }

  private outfitWeight(outfit: Record<string, number>): number {
    return Object.entries(outfit).reduce(
      (total, [key, amount]) => total + originalPathWeightFor(key) * amount,
      0,
    );
  }
}
