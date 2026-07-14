import {
  originalCalculateScore,
  originalReducedPrestigeStores,
  originalPrestigeStores,
} from "../../content/original";
import {
  originalSpaceAsteroidCountForAltitude,
  originalSpaceAsteroidDuration,
  originalSpaceNextAsteroidDelay,
  originalSpaceShipSpeed,
  originalSpaceTitleForAltitude,
  SHIP_LIFTOFF_COOLDOWN,
  SPACE_ALTITUDE_TICK_INTERVAL,
  SPACE_ASTEROID_END_TOP,
  SPACE_ASTEROID_START_TOP,
  SPACE_ESCAPE_ALTITUDE,
  SPACE_PANEL_SIZE,
  SPACE_SHIP_MAX_POSITION,
  SPACE_SHIP_MIN_POSITION,
  SPACE_SHIP_START_LEFT,
  SPACE_SHIP_START_TOP,
  SPACE_SHIP_TIMER_INTERVAL,
  originalSpaceAsteroids,
} from "../../content/original/lateGame/lateGameData";
import type { GameEngine } from "../GameEngine";
import { readNumber } from "../state/selectors";
import { MAX_EXACT_SCORE } from "../state/types";

export type SpaceFlightPhase = "idle" | "flying" | "ending";
export type SpaceEndingStage = "none" | "fleet" | "scores";
export type SpaceMoveDirection = "north" | "south" | "east" | "west";

export interface SpaceAsteroidSnapshot {
  id: number;
  glyph: string;
  x: number;
  y: number;
  speed: number;
}

export interface SpaceStateSnapshot {
  active: boolean;
  phase: SpaceFlightPhase;
  title: string;
  altitude: number;
  hull: number;
  maxHull: number;
  shipX: number;
  shipY: number;
  asteroids: SpaceAsteroidSnapshot[];
  score: number;
  totalScore: number;
  endingStage: SpaceEndingStage;
}

export interface SpaceRuntimeLifecycleSnapshot {
  phase: SpaceFlightPhase;
  hull: number;
  maxHull: number;
  altitude: number;
  shipX: number;
  shipY: number;
  lastUpdatedAt: number;
  nextAltitudeAt: number | null;
  nextAsteroidAt: number | null;
  asteroids: SpaceAsteroidSnapshot[];
  nextAsteroidId: number;
  score: number;
  totalScore: number;
  endingStage: SpaceEndingStage;
  pendingExit: "crashed" | null;
  heldDirections: SpaceMoveDirection[];
}

const ASTEROID_COLLISION_WIDTH = 20;
const ASTEROID_COLLISION_HEIGHT = 37;
const SPACE_CRASH_COOLDOWN_KEY = "ship.liftOff";

/** Owns the deterministic, serializable gameplay state of the original ascent. */
export class SpaceRuntime {
  private phase: SpaceFlightPhase = "idle";
  private hull = 0;
  private maxHull = 0;
  private altitude = 0;
  private shipX = SPACE_SHIP_START_LEFT;
  private shipY = SPACE_SHIP_START_TOP;
  private lastUpdatedAt = 0;
  private nextAltitudeAt: number | null = null;
  private nextAsteroidAt: number | null = null;
  private asteroids: SpaceAsteroidSnapshot[] = [];
  private nextAsteroidId = 1;
  private score = 0;
  private totalScore = 0;
  private endingStage: SpaceEndingStage = "none";
  private pendingExit: "crashed" | null = null;
  private heldDirections = new Set<SpaceMoveDirection>();

  constructor(private readonly engine: GameEngine) {}

  snapshot(): SpaceStateSnapshot {
    return {
      active: this.phase !== "idle",
      phase: this.phase,
      title: originalSpaceTitleForAltitude(this.altitude),
      altitude: this.altitude,
      hull: this.hull,
      maxHull: this.maxHull,
      shipX: this.shipX,
      shipY: this.shipY,
      asteroids: this.asteroids.map((asteroid) => ({ ...asteroid })),
      score: this.score,
      totalScore: this.totalScore,
      endingStage: this.endingStage,
    };
  }

  startFlight(maxHull: number): boolean {
    if (this.phase !== "idle" || maxHull <= 0) return false;
    const now = this.engine.clock.now();
    this.phase = "flying";
    this.hull = maxHull;
    this.maxHull = maxHull;
    this.altitude = 0;
    this.shipX = SPACE_SHIP_START_LEFT;
    this.shipY = SPACE_SHIP_START_TOP;
    this.lastUpdatedAt = now;
    this.nextAltitudeAt = now + SPACE_ALTITUDE_TICK_INTERVAL;
    this.nextAsteroidAt = now + originalSpaceNextAsteroidDelay(0);
    this.asteroids = [];
    this.nextAsteroidId = 1;
    this.score = 0;
    this.totalScore = 0;
    this.endingStage = "none";
    this.pendingExit = null;
    this.heldDirections.clear();
    this.spawnWave();
    return true;
  }

  move(direction: SpaceMoveDirection): boolean {
    if (this.phase !== "flying") return false;
    const distance = originalSpaceShipSpeed(this.thrusters());
    if (direction === "north") this.shipY -= distance;
    if (direction === "south") this.shipY += distance;
    if (direction === "west") this.shipX -= distance;
    if (direction === "east") this.shipX += distance;
    this.shipX = clamp(
      this.shipX,
      SPACE_SHIP_MIN_POSITION,
      SPACE_SHIP_MAX_POSITION,
    );
    this.shipY = clamp(
      this.shipY,
      SPACE_SHIP_MIN_POSITION,
      SPACE_SHIP_MAX_POSITION,
    );
    return true;
  }

  continueEnding(): boolean {
    if (this.phase !== "ending" || this.endingStage !== "fleet") return false;
    this.endingStage = "scores";
    return true;
  }

  setMovement(direction: SpaceMoveDirection, active: boolean): boolean {
    if (this.phase !== "flying") return false;
    if (active) this.heldDirections.add(direction);
    else this.heldDirections.delete(direction);
    return true;
  }

  update(): void {
    if (this.phase !== "flying") return;
    const now = this.engine.clock.now();
    while (this.phase === "flying" && this.lastUpdatedAt < now) {
      const stepEnd = Math.min(
        this.lastUpdatedAt + SPACE_SHIP_TIMER_INTERVAL,
        now,
      );
      this.advanceMovement(stepEnd - this.lastUpdatedAt);
      this.advanceAsteroids(stepEnd - this.lastUpdatedAt);
      this.lastUpdatedAt = stepEnd;
      this.advanceAltitudeAndWaves();
    }
  }

  consumeExit(): "crashed" | null {
    const exit = this.pendingExit;
    this.pendingExit = null;
    return exit;
  }

  lifecycleSnapshot(): SpaceRuntimeLifecycleSnapshot {
    return {
      phase: this.phase,
      hull: this.hull,
      maxHull: this.maxHull,
      altitude: this.altitude,
      shipX: this.shipX,
      shipY: this.shipY,
      lastUpdatedAt: this.lastUpdatedAt,
      nextAltitudeAt: this.nextAltitudeAt,
      nextAsteroidAt: this.nextAsteroidAt,
      asteroids: this.asteroids.map((asteroid) => ({ ...asteroid })),
      nextAsteroidId: this.nextAsteroidId,
      score: this.score,
      totalScore: this.totalScore,
      endingStage: this.endingStage,
      pendingExit: this.pendingExit,
      heldDirections: [...this.heldDirections],
    };
  }

  restoreLifecycle(snapshot: SpaceRuntimeLifecycleSnapshot | null): void {
    if (!snapshot) {
      this.phase = "idle";
      this.hull = 0;
      this.maxHull = 0;
      this.altitude = 0;
      this.shipX = SPACE_SHIP_START_LEFT;
      this.shipY = SPACE_SHIP_START_TOP;
      this.lastUpdatedAt = this.engine.clock.now();
      this.nextAltitudeAt = null;
      this.nextAsteroidAt = null;
      this.asteroids = [];
      this.nextAsteroidId = 1;
      this.score = 0;
      this.totalScore = 0;
      this.endingStage = "none";
      this.pendingExit = null;
      this.heldDirections.clear();
      return;
    }
    this.phase = snapshot.phase;
    this.hull = snapshot.hull;
    this.maxHull = snapshot.maxHull;
    this.altitude = snapshot.altitude;
    this.shipX = snapshot.shipX;
    this.shipY = snapshot.shipY;
    this.lastUpdatedAt = snapshot.lastUpdatedAt;
    this.nextAltitudeAt = snapshot.nextAltitudeAt;
    this.nextAsteroidAt = snapshot.nextAsteroidAt;
    this.asteroids = snapshot.asteroids.map((asteroid) => ({ ...asteroid }));
    this.nextAsteroidId = snapshot.nextAsteroidId;
    this.score = snapshot.score;
    this.totalScore = snapshot.totalScore;
    this.endingStage =
      snapshot.endingStage ?? (snapshot.phase === "ending" ? "scores" : "none");
    this.pendingExit = snapshot.pendingExit;
    this.heldDirections = new Set(snapshot.heldDirections ?? []);
  }

  private advanceMovement(elapsedMs: number): void {
    let dx =
      Number(this.heldDirections.has("east")) -
      Number(this.heldDirections.has("west"));
    let dy =
      Number(this.heldDirections.has("south")) -
      Number(this.heldDirections.has("north"));
    if (dx === 0 && dy === 0) return;
    if (dx !== 0 && dy !== 0) {
      dx /= Math.sqrt(2);
      dy /= Math.sqrt(2);
    }
    const distance =
      originalSpaceShipSpeed(this.thrusters()) *
      (elapsedMs / SPACE_SHIP_TIMER_INTERVAL);
    this.shipX = clamp(
      this.shipX + dx * distance,
      SPACE_SHIP_MIN_POSITION,
      SPACE_SHIP_MAX_POSITION,
    );
    this.shipY = clamp(
      this.shipY + dy * distance,
      SPACE_SHIP_MIN_POSITION,
      SPACE_SHIP_MAX_POSITION,
    );
  }

  private advanceAsteroids(elapsedMs: number): void {
    const survivors: SpaceAsteroidSnapshot[] = [];
    for (const asteroid of this.asteroids) {
      const previousY = asteroid.y;
      const nextY = previousY + asteroid.speed * elapsedMs;
      const crossesShip =
        previousY <= this.shipY &&
        nextY + ASTEROID_COLLISION_HEIGHT >= this.shipY;
      const overlapsShipX =
        asteroid.x <= this.shipX &&
        asteroid.x + ASTEROID_COLLISION_WIDTH >= this.shipX;
      if (crossesShip && overlapsShipX) {
        this.hull -= 1;
        if (this.hull <= 0) {
          this.crash();
          return;
        }
        continue;
      }
      asteroid.y = nextY;
      if (asteroid.y <= SPACE_ASTEROID_END_TOP) survivors.push(asteroid);
    }
    this.asteroids = survivors;
  }

  private advanceAltitudeAndWaves(): void {
    while (
      this.nextAltitudeAt !== null &&
      this.lastUpdatedAt >= this.nextAltitudeAt &&
      this.phase === "flying"
    ) {
      this.altitude += 1;
      this.nextAltitudeAt += SPACE_ALTITUDE_TICK_INTERVAL;
      if (this.altitude >= SPACE_ESCAPE_ALTITUDE) {
        this.finish();
        return;
      }
    }
    while (
      this.nextAsteroidAt !== null &&
      this.lastUpdatedAt >= this.nextAsteroidAt &&
      this.phase === "flying"
    ) {
      this.spawnWave();
      this.nextAsteroidAt += originalSpaceNextAsteroidDelay(this.altitude);
    }
  }

  private spawnWave(): void {
    const count = originalSpaceAsteroidCountForAltitude(this.altitude);
    for (let index = 0; index < count; index += 1) {
      const glyphRoll = this.engine.rng.next();
      const glyph =
        originalSpaceAsteroids.find(({ rollUnder }) => glyphRoll < rollUnder)
          ?.glyph ?? "H";
      const x = Math.floor(this.engine.rng.next() * SPACE_PANEL_SIZE);
      const duration = originalSpaceAsteroidDuration(this.engine.rng.next());
      this.asteroids.push({
        id: this.nextAsteroidId,
        glyph,
        x,
        y: SPACE_ASTEROID_START_TOP,
        speed: (SPACE_ASTEROID_END_TOP - SPACE_ASTEROID_START_TOP) / duration,
      });
      this.nextAsteroidId += 1;
    }
  }

  private crash(): void {
    this.phase = "idle";
    this.asteroids = [];
    this.nextAltitudeAt = null;
    this.nextAsteroidAt = null;
    this.pendingExit = "crashed";
    this.heldDirections.clear();
    this.engine.cooldowns.start(
      SPACE_CRASH_COOLDOWN_KEY,
      SHIP_LIFTOFF_COOLDOWN * 1000,
    );
  }

  private finish(): void {
    this.phase = "ending";
    this.asteroids = [];
    this.nextAltitudeAt = null;
    this.nextAsteroidAt = null;
    this.heldDirections.clear();
    const prestigeStores = originalPrestigeStores.map(({ key }) =>
      this.storeAmount(key),
    );
    const stores = {
      "alien alloy": this.storeAmount("alien alloy"),
      "fleet beacon": this.storeAmount("fleet beacon"),
    };
    this.score = originalCalculateScore(prestigeStores, stores, this.maxHull);
    this.totalScore = boundedExactScoreTotal(this.previousScore(), this.score);
    this.engine.state.set("playStats.score", this.score);
    this.engine.state.set("previous.score", this.totalScore);
    const storeRecord = Object.fromEntries(
      originalPrestigeStores.map(({ key }) => [key, this.storeAmount(key)]),
    );
    this.engine.state.set(
      "previous.stores",
      originalReducedPrestigeStores(storeRecord, this.engine.rng),
      true,
    );
    this.endingStage =
      this.storeAmount("fleet beacon") > 0 ? "fleet" : "scores";
  }

  private storeAmount(key: string): number {
    return readNumber(this.engine.state, `stores["${key}"]`, 0);
  }

  private previousScore(): number {
    return readNumber(this.engine.state, "previous.score", 0);
  }

  private thrusters(): number {
    const value = this.engine.state.get("game.spaceShip.thrusters");
    return typeof value === "number" ? value : 1;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function boundedExactScoreTotal(
  previousScore: number,
  currentScore: number,
): number {
  if (
    !Number.isSafeInteger(previousScore) ||
    previousScore < 0 ||
    !Number.isSafeInteger(currentScore) ||
    currentScore < 0
  ) {
    throw new Error("Scores must be non-negative safe integers");
  }
  if (previousScore > MAX_EXACT_SCORE - currentScore) {
    return MAX_EXACT_SCORE;
  }
  return previousScore + currentScore;
}
