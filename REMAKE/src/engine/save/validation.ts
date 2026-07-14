import { OUTSIDE_HUT_ROOM } from "../../content/original/outside/outsideData";
import { WORLD_RADIUS } from "../../content/original/world/worldData";
import { MAX_EXACT_SCORE, MAX_STORE, type GameState } from "../state/types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

export function isNullableTimestamp(value: unknown): value is number | null {
  return value === null || isNonNegativeNumber(value);
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

export function isNumericRecord(
  value: unknown,
): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => isFiniteNumber(entry))
  );
}

export function isJsonValue(value: unknown): boolean {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

/**
 * Validates the runtime meaning of a restored state, not merely its JSON
 * shape. The checks intentionally focus on authoritative cross-domain values;
 * unknown legacy flags remain forward-compatible.
 */
export function isSemanticallyValidGameState(
  value: unknown,
): value is GameState {
  if (
    !isRecord(value) ||
    !isNonNegativeNumber(value.version) ||
    ![
      "features",
      "stores",
      "character",
      "income",
      "timers",
      "game",
      "playStats",
      "previous",
      "outfit",
      "config",
      "wait",
      "cooldown",
    ].every((key) => isRecord(value[key]) && isJsonValue(value[key]))
  ) {
    return false;
  }

  const state = value as unknown as GameState;
  if (
    !isBoundedCountRecord(state.stores) ||
    !isBoundedCountRecord(state.outfit) ||
    !isIncomeRecord(state.income) ||
    !isPreviousState(state.previous) ||
    !isScoreState(state.playStats)
  ) {
    return false;
  }

  const game = state.game;
  if (
    !isOptionalBoundedCount(game.population) ||
    !isOptionalBoundedCountRecord(game.workers) ||
    !isOptionalBoundedCountRecord(game.buildings) ||
    !isOptionalBoundedCountRecord(game.stolen) ||
    !isWorkerAllocationValid(game.population, game.workers) ||
    !isPopulationCapacityValid(game.population, game.buildings) ||
    !isWorldState(game.world, game.expedition, state.features) ||
    !isSpaceShipState(game.spaceShip, state.features)
  ) {
    return false;
  }

  return (
    isOptionalBoundedCount(state.character.starved) &&
    isOptionalBoundedCount(state.character.dehydrated)
  );
}

function isBoundedCount(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= MAX_STORE
  );
}

function isOptionalBoundedCount(value: unknown): boolean {
  return value === undefined || isBoundedCount(value);
}

function isBoundedCountRecord(value: unknown): boolean {
  return isRecord(value) && Object.values(value).every(isBoundedCount);
}

function isOptionalBoundedCountRecord(value: unknown): boolean {
  return value === undefined || isBoundedCountRecord(value);
}

function isScore(value: unknown): boolean {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= MAX_EXACT_SCORE
  );
}

function isScoreState(value: Record<string, unknown>): boolean {
  return value.score === undefined || isScore(value.score);
}

function isPreviousState(value: Record<string, unknown>): boolean {
  if (value.score !== undefined && !isScore(value.score)) return false;
  if (value.stores === undefined) return true;
  if (Array.isArray(value.stores)) {
    return value.stores.every(isBoundedCount);
  }
  return isBoundedCountRecord(value.stores);
}

function isIncomeRecord(value: Record<string, unknown>): boolean {
  return Object.values(value).every((entry) => {
    if (!isRecord(entry) || !isFiniteNumber(entry.delay) || entry.delay <= 0) {
      return false;
    }
    if (
      (entry.timeLeft !== undefined && !isNonNegativeNumber(entry.timeLeft)) ||
      !isRecord(entry.stores)
    ) {
      return false;
    }
    return Object.values(entry.stores).every(
      (amount) =>
        isFiniteNumber(amount) &&
        Number.isSafeInteger(amount) &&
        Math.abs(amount) <= MAX_STORE,
    );
  });
}

function isWorkerAllocationValid(
  population: unknown,
  workers: unknown,
): boolean {
  if (!isBoundedCount(population) || !isRecord(workers)) return true;
  let allocated = 0;
  for (const workerCount of Object.values(workers)) {
    if (!isBoundedCount(workerCount)) return false;
    if (workerCount > population - allocated) return false;
    allocated += workerCount;
  }
  return true;
}

function isPopulationCapacityValid(
  population: unknown,
  buildings: unknown,
): boolean {
  if (!isBoundedCount(population) || !isRecord(buildings)) return true;
  const huts = buildings.hut;
  if (huts === undefined) return population === 0;
  return isBoundedCount(huts) && population <= huts * OUTSIDE_HUT_ROOM;
}

function isWorldState(
  worldValue: unknown,
  expeditionValue: unknown,
  features: Record<string, unknown>,
): boolean {
  if (worldValue === undefined) return expeditionValue === undefined;
  if (!isRecord(worldValue)) return false;

  const size = WORLD_RADIUS * 2 + 1;
  const map = worldValue.map;
  const mask = worldValue.mask;
  if (map !== undefined && map !== null && !isGrid(map, size, "string")) {
    return false;
  }
  if (mask !== undefined && mask !== null && !isGrid(mask, size, "boolean")) {
    return false;
  }
  if (
    mask !== undefined &&
    mask !== null &&
    (map === undefined || map === null)
  ) {
    return false;
  }

  if (!isOptionalWorldCoordinate(worldValue.x, size)) return false;
  if (!isOptionalWorldCoordinate(worldValue.y, size)) return false;
  if ((worldValue.x === undefined) !== (worldValue.y === undefined))
    return false;
  if (!isOptionalBoundedCount(worldValue.health)) return false;
  if (!isOptionalBoundedCount(worldValue.water)) return false;
  for (const key of ["foodMove", "waterMove", "fightMove"]) {
    if (!isOptionalBoundedCount(worldValue[key])) return false;
  }
  if (
    worldValue.returnLocation !== undefined &&
    worldValue.returnLocation !== "room" &&
    worldValue.returnLocation !== "path"
  ) {
    return false;
  }

  const shipPosition = worldValue.shipPosition;
  if (shipPosition !== undefined) {
    if (
      !isRecord(shipPosition) ||
      !isWorldRelativeCoordinate(shipPosition.x) ||
      !isWorldRelativeCoordinate(shipPosition.y)
    ) {
      return false;
    }
  }

  if (worldValue.active === undefined) return true;
  if (typeof worldValue.active !== "boolean") return false;
  if (!worldValue.active) return true;
  const locations = isRecord(features.location) ? features.location : {};
  return (
    locations.world === true &&
    map !== undefined &&
    map !== null &&
    isWorldCoordinate(worldValue.x, size) &&
    isWorldCoordinate(worldValue.y, size) &&
    isRecord(expeditionValue) &&
    isRecord(expeditionValue.baselineWorld)
  );
}

function isGrid(
  value: unknown,
  size: number,
  cellType: "string" | "boolean",
): boolean {
  return (
    Array.isArray(value) &&
    value.length === size &&
    value.every(
      (column) =>
        Array.isArray(column) &&
        column.length === size &&
        column.every((cell) => typeof cell === cellType),
    )
  );
}

function isWorldCoordinate(value: unknown, size: number): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < size
  );
}

function isOptionalWorldCoordinate(value: unknown, size: number): boolean {
  return value === undefined || isWorldCoordinate(value, size);
}

function isWorldRelativeCoordinate(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= -WORLD_RADIUS &&
    (value as number) <= WORLD_RADIUS
  );
}

function isSpaceShipState(
  value: unknown,
  features: Record<string, unknown>,
): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  const locations = isRecord(features.location) ? features.location : {};
  return (
    isOptionalBoundedCount(value.hull) &&
    isOptionalBoundedCount(value.thrusters) &&
    (value.awaitingLiftOffConfirmation === undefined ||
      typeof value.awaitingLiftOffConfirmation === "boolean") &&
    (value.seenWarning === undefined ||
      typeof value.seenWarning === "boolean") &&
    (value.seenShip === undefined || typeof value.seenShip === "boolean") &&
    (value.awaitingLiftOffConfirmation !== true || locations.spaceShip === true)
  );
}
