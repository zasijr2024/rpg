import type { GameEngine } from "../GameEngine";
import { WORLD_DEATH_COOLDOWN } from "../../content/original/world/worldData";
import { originalPathReturnOutfitToStores } from "../path/pathOutfit";
import { readBoolean, readNumber, readNumericRecord } from "../state/selectors";

export type ExpeditionCadence = "food" | "water" | "fight";

export interface ExpeditionPosition {
  x: number;
  y: number;
}

export interface ExpeditionStartState {
  position: ExpeditionPosition;
  health: number;
  water: number;
}

export interface ExpeditionStateSnapshot {
  active: boolean;
  position: ExpeditionPosition;
  health: number;
  water: number;
  inventory: Record<string, number>;
  cadence: Record<ExpeditionCadence, number>;
  hasDraft: boolean;
}

const DRAFT_PATH = "game.expedition.baselineWorld";
const WORLD_PATH = "game.world";
export const EXPEDITION_EMBARK_COOLDOWN_KEY = "path.embark";
export const EXPEDITION_DEATH_NOTIFICATION = "the world fades";
export const EXPEDITION_BLUEPRINT_REDEMPTIONS = [
  ["hypo blueprint", "hypo"],
  ["kinetic armour blueprint", "kinetic armour"],
  ["disruptor blueprint", "disruptor"],
  ["plasma rifle blueprint", "plasma rifle"],
  ["stim blueprint", "stim"],
  ["glowstone blueprint", "glowstone"],
] as const;

export class ExpeditionTransaction {
  constructor(private readonly engine: GameEngine) {}

  begin(state: ExpeditionStartState): void {
    if (this.active()) {
      throw new Error("Cannot begin an expedition while one is active");
    }

    this.engine.state.set(DRAFT_PATH, this.worldState(), true);
    this.engine.state.set("game.world.active", true);
    this.setPosition(state.position);
    this.setHealth(state.health, state.health);
    this.setWater(state.water, state.water);
    this.setCadence("food", 0);
    this.setCadence("water", 0);
    this.setCadence("fight", 0);
  }

  snapshot(): ExpeditionStateSnapshot {
    return {
      active: this.active(),
      position: this.position(),
      health: this.health(),
      water: this.water(),
      inventory: this.inventory(),
      cadence: {
        food: this.cadence("food"),
        water: this.cadence("water"),
        fight: this.cadence("fight"),
      },
      hasDraft: this.hasDraft(),
    };
  }

  active(): boolean {
    return readBoolean(this.engine.state, "game.world.active");
  }

  position(fallback: ExpeditionPosition = { x: 0, y: 0 }): ExpeditionPosition {
    return {
      x: readNumber(this.engine.state, "game.world.x", fallback.x),
      y: readNumber(this.engine.state, "game.world.y", fallback.y),
    };
  }

  setPosition(position: ExpeditionPosition): void {
    this.engine.state.set("game.world.x", position.x);
    this.engine.state.set("game.world.y", position.y);
  }

  health(fallback = 0): number {
    return readNumber(this.engine.state, "game.world.health", fallback);
  }

  setHealth(value: number, maximum: number): void {
    this.engine.state.set(
      "game.world.health",
      Math.max(0, Math.min(maximum, value)),
    );
  }

  addHealth(amount: number): void {
    this.engine.state.set(
      "game.world.health",
      Math.max(0, this.health() + amount),
    );
  }

  water(fallback = 0): number {
    return readNumber(this.engine.state, "game.world.water", fallback);
  }

  setWater(value: number, maximum: number): void {
    this.engine.state.set(
      "game.world.water",
      Math.max(0, Math.min(maximum, value)),
    );
  }

  addWater(amount: number): void {
    this.engine.state.set(
      "game.world.water",
      Math.max(0, this.water() + amount),
    );
  }

  inventory(): Record<string, number> {
    return readNumericRecord(this.engine.state, "outfit");
  }

  inventoryQuantity(key: string): number {
    return readNumber(this.engine.state, `outfit["${key}"]`);
  }

  addInventory(key: string, amount: number): void {
    this.engine.state.add(`outfit["${key}"]`, amount);
  }

  clearInventory(): void {
    this.engine.state.remove("outfit");
  }

  returnInventoryToStores(): void {
    originalPathReturnOutfitToStores(this.engine);
  }

  redeemBlueprints(): boolean {
    let redeemed = false;
    for (const [blueprint, item] of EXPEDITION_BLUEPRINT_REDEMPTIONS) {
      if (this.inventoryQuantity(blueprint) <= 0) continue;
      this.engine.state.set(`character.blueprints["${item}"]`, true);
      this.engine.state.remove(`outfit["${blueprint}"]`);
      redeemed = true;
    }
    return redeemed;
  }

  cadence(kind: ExpeditionCadence): number {
    return readNumber(this.engine.state, this.cadencePath(kind));
  }

  setCadence(kind: ExpeditionCadence, value: number): void {
    this.engine.state.set(this.cadencePath(kind), Math.max(0, value));
  }

  commit(): boolean {
    if (!this.active()) return false;
    this.engine.state.remove("game.expedition", true);
    this.engine.state.set("game.world.active", false);
    return true;
  }

  rollback(): boolean {
    const baseline = this.engine.state.get(DRAFT_PATH);
    if (!isRecord(baseline)) return false;

    this.engine.state.set(WORLD_PATH, structuredClone(baseline), true);
    this.engine.state.remove("game.expedition", true);
    this.engine.state.set("game.world.active", false);
    return true;
  }

  abortOnDeath(): boolean {
    if (readBoolean(this.engine.state, "game.world.dead")) return false;

    if (!this.rollback()) {
      this.engine.state.remove("game.expedition", true);
      this.engine.state.set("game.world.active", false);
    }
    this.clearInventory();
    this.engine.state.set("character.dead", true);
    this.engine.state.set("game.world.dead", true);
    this.engine.state.set("game.world.returnLocation", "room");
    this.engine.cooldowns.start(
      EXPEDITION_EMBARK_COOLDOWN_KEY,
      WORLD_DEATH_COOLDOWN * 1000,
    );
    return true;
  }

  private hasDraft(): boolean {
    return isRecord(this.engine.state.get(DRAFT_PATH));
  }

  private worldState(): Record<string, unknown> {
    const state = this.engine.state.get(WORLD_PATH);
    return isRecord(state) ? structuredClone(state) : {};
  }

  private cadencePath(kind: ExpeditionCadence): string {
    return `game.world.${kind}Move`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
