import {
  SHIP_BASE_HULL,
  SHIP_BASE_THRUSTERS,
} from "../../content/original/lateGame/lateGameData";
import type {
  WorldMapGrid,
  WorldMaskGrid,
} from "../../content/original/world/worldData";
import type { Command } from "../commands/CommandBus";
import type { GameEngine } from "../GameEngine";

export interface WorldPersistentReadModel {
  readonly unlocked: boolean;
  readonly danger: boolean;
  readonly starvation: boolean;
  readonly thirst: boolean;
  readonly seenAll: boolean;
  readonly outpostUsed: boolean;
  readonly waterReplenished: boolean;
  readonly executionerCleared: boolean;
  readonly shipCleared: boolean;
  readonly randomEncountersDisabled: boolean;
  readonly shipUnlocked: boolean;
  readonly fabricatorUnlocked: boolean;
  readonly map: WorldMapGrid | null;
  readonly mask: WorldMaskGrid | null;
  readonly shipPosition: Readonly<{ x: number; y: number }> | null;
  readonly stores: Readonly<Record<string, number>>;
  readonly previousStores: Readonly<Record<string, number>>;
  readonly buildings: Readonly<Record<string, number>>;
  readonly perks: Readonly<Record<string, boolean>>;
  readonly flags: Readonly<Record<string, boolean>>;
  readonly resolvedLandmarks: Readonly<Record<string, boolean>>;
  readonly usedOutposts: Readonly<Record<string, boolean>>;
  readonly starved: number;
  readonly dehydrated: number;
}

export type WorldPersistentCommand =
  | Command<"world.begin", Record<string, never>>
  | Command<"world.consumeOutpost", { x: number; y: number }>
  | Command<"world.consumeWaterReplenishment", Record<string, never>>
  | Command<"world.resolveLandmark", { x: number; y: number }>
  | Command<"world.setSeenAll", { value: boolean }>
  | Command<"world.setMap", { value: WorldMapGrid }>
  | Command<"world.setMask", { value: WorldMaskGrid }>
  | Command<"world.setDanger", { value: boolean }>
  | Command<"world.setStarvation", { value: boolean }>
  | Command<"world.setThirst", { value: boolean }>
  | Command<"world.recordExposure", { kind: "starved" | "dehydrated" }>
  | Command<"world.unlockPerk", { perk: "slow metabolism" | "desert rat" }>
  | Command<"world.unlockBuilding", { key: string }>
  | Command<"world.unlockShip", Record<string, never>>
  | Command<"world.unlockFabricator", Record<string, never>>
  | Command<"world.closePathReturn", Record<string, never>>
  | Command<"world.setShipPosition", { x: number; y: number }>;

/** Owns persistent World paths outside the ExpeditionTransaction boundary. */
export class WorldDomainFacade {
  constructor(private readonly engine: Pick<GameEngine, "state">) {}

  read(): WorldPersistentReadModel {
    const world = recordValue(
      this.engine.state.forRuntime("world").get("game.world", true),
    );
    const shipPosition = recordValue(world.shipPosition);
    const legacyShipPosition = recordValue(world.ship);
    const shipX = shipPosition.x ?? legacyShipPosition.x;
    const shipY = shipPosition.y ?? legacyShipPosition.y;
    return Object.freeze({
      unlocked:
        this.engine.state.forRuntime("world").get("features.location.world") ===
        true,
      danger: world.danger === true,
      starvation: world.starvation === true,
      thirst: world.thirst === true,
      seenAll: world.seenAll === true,
      outpostUsed: world.outpostUsed === true,
      waterReplenished: world.waterReplenished === true,
      executionerCleared: world.executioner === true,
      shipCleared: world.ship === true,
      randomEncountersDisabled:
        this.engine.state
          .forRuntime("world")
          .get("config.events.randomDisabled", true) === true ||
        world.encounters === "disabled",
      shipUnlocked:
        this.engine.state
          .forRuntime("world")
          .get("features.location.spaceShip", true) === true,
      fabricatorUnlocked:
        this.engine.state
          .forRuntime("world")
          .get("features.location.fabricator", true) === true,
      map: worldMap(world.map),
      mask: worldMask(world.mask),
      shipPosition:
        typeof shipX === "number" && typeof shipY === "number"
          ? Object.freeze({ x: shipX, y: shipY })
          : null,
      stores: numericRecord(
        this.engine.state.forRuntime("world").get("stores", true),
      ),
      previousStores: numericRecord(
        this.engine.state.forRuntime("world").get("previous.stores", true),
      ),
      buildings: numericRecord(
        this.engine.state.forRuntime("world").get("game.buildings", true),
      ),
      perks: booleanRecord(
        this.engine.state.forRuntime("world").get("character.perks", true),
      ),
      flags: booleanRecord(world),
      resolvedLandmarks: booleanRecord(world.resolvedLandmarks),
      usedOutposts: booleanRecord(world.usedOutposts),
      starved: numberValue(
        this.engine.state.forRuntime("world").get("character.starved", true),
      ),
      dehydrated: numberValue(
        this.engine.state.forRuntime("world").get("character.dehydrated", true),
      ),
    });
  }

  dispatch(command: WorldPersistentCommand): void {
    const state = this.engine.state.forRuntime("world");
    switch (command.type) {
      case "world.begin":
        state.set("features.location.world", true);
        state.set("game.world.danger", false);
        state.remove("game.world.usedOutposts");
        state.remove("game.world.outpostUsed");
        state.remove("game.world.dead");
        return;
      case "world.consumeOutpost":
        state.set(
          keyedPath(
            "game.world.usedOutposts",
            coordinateKey(command.payload.x, command.payload.y),
          ),
          true,
          true,
        );
        state.remove("game.world.outpostUsed");
        return;
      case "world.consumeWaterReplenishment":
        state.remove("game.world.waterReplenished");
        return;
      case "world.resolveLandmark":
        state.set(
          keyedPath(
            "game.world.resolvedLandmarks",
            coordinateKey(command.payload.x, command.payload.y),
          ),
          true,
          true,
        );
        return;
      case "world.setSeenAll":
        state.set("game.world.seenAll", command.payload.value);
        return;
      case "world.setMap":
        state.set("game.world.map", command.payload.value, true);
        return;
      case "world.setMask":
        state.set("game.world.mask", command.payload.value, true);
        return;
      case "world.setDanger":
        state.set("game.world.danger", command.payload.value);
        return;
      case "world.setStarvation":
        state.set("game.world.starvation", command.payload.value);
        return;
      case "world.setThirst":
        state.set("game.world.thirst", command.payload.value);
        return;
      case "world.recordExposure":
        state.add(`character.${command.payload.kind}`, 1);
        return;
      case "world.unlockPerk":
        state.set(keyedPath("character.perks", command.payload.perk), true);
        return;
      case "world.unlockBuilding":
        state.set(keyedPath("game.buildings", command.payload.key), 1);
        return;
      case "world.unlockShip":
        state.set("features.location.spaceShip", true);
        state.set("game.spaceShip.hull", SHIP_BASE_HULL);
        state.set("game.spaceShip.thrusters", SHIP_BASE_THRUSTERS);
        return;
      case "world.unlockFabricator":
        state.set("features.location.fabricator", true);
        return;
      case "world.closePathReturn":
        state.set("features.location.path", true);
        state.remove("game.path.pendingReturn");
        return;
      case "world.setShipPosition":
        state.set("game.world.shipPosition.x", command.payload.x, true);
        state.set("game.world.shipPosition.y", command.payload.y, true);
        return;
    }
  }
}

function recordValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numericRecord(value: unknown): Readonly<Record<string, number>> {
  return filteredRecord(
    value,
    (candidate): candidate is number => typeof candidate === "number",
  );
}

function booleanRecord(value: unknown): Readonly<Record<string, boolean>> {
  return filteredRecord(
    value,
    (candidate): candidate is boolean => typeof candidate === "boolean",
  );
}

function filteredRecord<T>(
  value: unknown,
  predicate: (candidate: unknown) => candidate is T,
): Readonly<Record<string, T>> {
  if (!value || typeof value !== "object") return Object.freeze({});
  return Object.freeze(
    Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(
        (entry): entry is [string, T] => predicate(entry[1]),
      ),
    ),
  );
}

function worldMap(value: unknown): WorldMapGrid | null {
  return Array.isArray(value) ? (value as WorldMapGrid) : null;
}

function worldMask(value: unknown): WorldMaskGrid | null {
  return Array.isArray(value) ? (value as WorldMaskGrid) : null;
}

function numberValue(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function coordinateKey(x: number, y: number): string {
  return `${x},${y}`;
}

function keyedPath<const TParent extends string>(
  parent: TParent,
  key: string,
): `${TParent}["${string}"]` {
  if (key.includes('"')) throw new Error("State keys cannot contain quotes");
  return `${parent}["${key}"]`;
}
