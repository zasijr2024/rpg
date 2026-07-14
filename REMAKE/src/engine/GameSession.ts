import {
  RealtimeClockDriver,
  type RealtimeClockDriverLifecycleSnapshot,
} from "./clock";
import {
  createGameEngine,
  isEngineDevSnapshot,
  type GameEngine,
} from "./GameEngine";
import { originalEventDefinitions } from "../content/original/events/eventData";
import {
  SPACE_ASTEROID_END_TOP,
  SPACE_ASTEROID_START_TOP,
  SPACE_ESCAPE_ALTITUDE,
  SPACE_PANEL_SIZE,
  SPACE_SHIP_MAX_POSITION,
  SPACE_SHIP_MIN_POSITION,
} from "../content/original/lateGame/lateGameData";
import {
  EventRuntime,
  type EventPanelSnapshot,
  type EventRuntimeLifecycleSnapshot,
} from "./events/EventRuntime";
import {
  OutsideRuntime,
  type OutsideRuntimeLifecycleSnapshot,
  type OutsideStateSnapshot,
} from "./outside/OutsideRuntime";
import { PathRuntime } from "./path/PathRuntime";
import type { PathStateSnapshot } from "./path/PathRuntime";
import {
  RoomRuntime,
  type RoomRuntimeLifecycleSnapshot,
  type RoomStateSnapshot,
} from "./room/RoomRuntime";
import {
  createDevSaveDocument,
  LocalStorageDevSaveAdapter,
  type DevSaveData,
} from "./save/devSave";
import {
  isFiniteNumber,
  isNonNegativeNumber,
  isNullableTimestamp,
  isNumericRecord,
  isRecord,
  isStringArray,
} from "./save/validation";
import type { GameEngineDevSnapshot } from "./GameEngine";
import {
  WorldRuntime,
  type WorldEncounterContext,
  type WorldMoveDirection,
  type WorldStateSnapshot,
} from "./world/WorldRuntime";
import { ExpeditionTransaction } from "./world/ExpeditionTransaction";
import { ShipRuntime, type ShipStateSnapshot } from "./ship/ShipRuntime";
import {
  FabricatorRuntime,
  type FabricatorStateSnapshot,
} from "./fabricator/FabricatorRuntime";
import {
  SpaceRuntime,
  type SpaceMoveDirection,
  type SpaceRuntimeLifecycleSnapshot,
  type SpaceStateSnapshot,
} from "./space/SpaceRuntime";
import { createInitialState, MAX_EXACT_SCORE, MAX_STORE } from "./state/types";

export type GameLocationKey =
  | "room"
  | "outside"
  | "path"
  | "world"
  | "fabricator"
  | "ship"
  | "space"
  | "settings";

export interface GameDebugSettingsSnapshot {
  hyperMode: boolean;
  speedX10: boolean;
  incomeX10: boolean;
  speedMultiplier: 1 | 2 | 10 | 20;
  incomeMultiplier: 1 | 10;
  nowMs: number;
}

export type GamePersistenceStatus =
  "healthy" | "unavailable" | "recovered" | "disabled";

export interface GamePersistenceSnapshot {
  status: GamePersistenceStatus;
  operation: "read" | "write" | null;
  reason: string | null;
  message: string | null;
  hasInMemorySnapshot: boolean;
  canRetry: boolean;
  canExport: boolean;
}

export const BACKGROUND_TIME_POLICY_NOTIFICATION =
  "time catches up only while this tab remains open; closing the page earns nothing";

export interface GameSessionSnapshot {
  location: GameLocationKey;
  persistence: GamePersistenceSnapshot;
  room: RoomStateSnapshot;
  outside: OutsideStateSnapshot;
  path: PathStateSnapshot;
  world: WorldStateSnapshot;
  fabricator: FabricatorStateSnapshot;
  ship: ShipStateSnapshot;
  space: SpaceStateSnapshot;
  event: EventPanelSnapshot | null;
  settings: GameDebugSettingsSnapshot;
}

export interface GameNavigationSnapshot {
  location: GameLocationKey;
  persistence: GamePersistenceSnapshot;
  backgroundTimePolicyNotice: string | null;
  hyperMode: boolean;
  roomTitle: RoomStateSnapshot["title"];
  outside: Pick<OutsideStateSnapshot, "unlocked" | "title">;
  path: Pick<PathStateSnapshot, "unlocked" | "title">;
  worldActive: boolean;
  fabricator: Pick<FabricatorStateSnapshot, "unlocked" | "title">;
  ship: Pick<ShipStateSnapshot, "unlocked" | "title">;
  spaceActive: boolean;
}

export interface GameUiSnapshotMap {
  navigation: GameNavigationSnapshot;
  room: {
    room: RoomStateSnapshot;
    compassDirection: PathStateSnapshot["compassDirection"];
  };
  outside: {
    outside: OutsideStateSnapshot;
    room: Pick<RoomStateSnapshot, "stores" | "income">;
    compassDirection: PathStateSnapshot["compassDirection"];
  };
  path: {
    path: PathStateSnapshot;
    room: Pick<RoomStateSnapshot, "stores" | "income">;
  };
  world: WorldStateSnapshot;
  fabricator: FabricatorStateSnapshot;
  ship: ShipStateSnapshot;
  space: SpaceStateSnapshot;
  settings: {
    settings: GameDebugSettingsSnapshot;
    location: GameLocationKey;
    room: RoomStateSnapshot;
    outside: OutsideStateSnapshot;
  };
  event: EventPanelSnapshot | null;
}

export type GameUiDomain = keyof GameUiSnapshotMap;

export interface GameUiDiagnostics {
  snapshots: Record<GameUiDomain, number>;
  notifications: Record<GameUiDomain, number>;
  renders: Record<GameUiDomain, number>;
}

export interface GameSessionDevSnapshot {
  kind: "session";
  version: 2;
  engine: GameEngineDevSnapshot;
  location: GameLocationKey;
  room: RoomRuntimeLifecycleSnapshot;
  outside: OutsideRuntimeLifecycleSnapshot;
  events: EventRuntimeLifecycleSnapshot;
  space: SpaceRuntimeLifecycleSnapshot;
  clockDriver: RealtimeClockDriverLifecycleSnapshot;
}

const AUTOSAVE_INTERVAL_MS = 10_000;
const UI_DOMAINS: GameUiDomain[] = [
  "navigation",
  "room",
  "outside",
  "path",
  "world",
  "fabricator",
  "ship",
  "space",
  "settings",
  "event",
];

export class GameSession {
  readonly engine: GameEngine;
  readonly room: RoomRuntime;
  readonly outside: OutsideRuntime;
  readonly events: EventRuntime;
  readonly path: PathRuntime;
  readonly expedition: ExpeditionTransaction;
  readonly world: WorldRuntime;
  readonly fabricator: FabricatorRuntime;
  readonly ship: ShipRuntime;
  readonly space: SpaceRuntime;
  private readonly clockDriver: RealtimeClockDriver;
  private location: GameLocationKey = "room";
  private autosaveEnabled = false;
  private lastAutosaveAt = Number.NEGATIVE_INFINITY;
  private lastInMemorySnapshot: DevSaveData | null = null;
  private backgroundTimePolicyNotice: string | null = null;
  private persistenceState: Omit<
    GamePersistenceSnapshot,
    "hasInMemorySnapshot" | "canRetry" | "canExport"
  > = {
    status: "disabled",
    operation: null,
    reason: null,
    message: null,
  };
  private readonly uiListeners = new Map<GameUiDomain, Set<() => void>>();
  private readonly uiSnapshots = new Map<GameUiDomain, unknown>();
  private readonly uiDiagnosticsState: GameUiDiagnostics = {
    snapshots: emptyUiCounter(),
    notifications: emptyUiCounter(),
    renders: emptyUiCounter(),
  };

  constructor(
    engine: GameEngine = createGameEngine({
      saveAdapter:
        typeof window === "undefined"
          ? undefined
          : new LocalStorageDevSaveAdapter(),
    }),
  ) {
    this.engine = engine;
    if (engine.hasDevSaveAdapter()) this.persistenceState.status = "healthy";
    this.space = new SpaceRuntime(engine);
    const incomePaused = () => this.space.snapshot().active;
    this.room = new RoomRuntime(engine, incomePaused);
    this.outside = new OutsideRuntime(engine, incomePaused);
    this.path = new PathRuntime(engine);
    this.expedition = new ExpeditionTransaction(engine);
    this.world = new WorldRuntime(engine, this.expedition);
    this.fabricator = new FabricatorRuntime(engine);
    this.ship = new ShipRuntime(engine);
    this.events = new EventRuntime(
      engine,
      () => this.location,
      {
        killVillagers: (count) => this.outside.killVillagers(count),
        destroyHuts: (count) => this.outside.destroyHuts(count),
      },
      this.world,
      this.expedition,
    );
    this.clockDriver = new RealtimeClockDriver(engine.clock, {
      intervalMs: 250,
      timeScale: () => this.simulationSpeedMultiplier(),
    });
    this.registerGameplayCommands();
    this.room.initialize();
    this.update();
  }

  snapshot(): GameSessionSnapshot {
    return {
      location: this.location,
      persistence: this.persistenceSnapshot(),
      room: this.room.snapshot(),
      outside: this.outside.snapshot(),
      path: this.path.snapshot(),
      world: this.world.snapshot(),
      fabricator: this.fabricator.snapshot(),
      ship: this.ship.snapshot(),
      space: this.space.snapshot(),
      event: this.events.snapshot(),
      settings: this.settingsSnapshot(),
    };
  }

  uiSnapshot<TDomain extends GameUiDomain>(
    domain: TDomain,
  ): GameUiSnapshotMap[TDomain] {
    if (!this.uiSnapshots.has(domain)) {
      this.uiSnapshots.set(domain, this.createUiSnapshot(domain));
      this.uiDiagnosticsState.snapshots[domain] += 1;
    }
    return this.uiSnapshots.get(domain) as GameUiSnapshotMap[TDomain];
  }

  subscribeUi(domain: GameUiDomain, listener: () => void): () => void {
    const listeners = this.uiListeners.get(domain) ?? new Set<() => void>();
    listeners.add(listener);
    this.uiListeners.set(domain, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.uiListeners.delete(domain);
        this.uiSnapshots.delete(domain);
      }
    };
  }

  recordUiRender(domain: GameUiDomain): void {
    this.uiDiagnosticsState.renders[domain] += 1;
  }

  uiDiagnostics(): GameUiDiagnostics {
    return {
      snapshots: { ...this.uiDiagnosticsState.snapshots },
      notifications: { ...this.uiDiagnosticsState.notifications },
      renders: { ...this.uiDiagnosticsState.renders },
    };
  }

  start(onUpdate: () => void = () => {}): void {
    this.autosaveEnabled = true;
    this.persistAutosave(true);
    this.clockDriver.start(
      () => {
        this.persistAutosave(false);
        this.publishUiChanges();
        onUpdate();
      },
      () => this.update(false),
    );
  }

  stop(): void {
    this.clockDriver.stop();
    this.persistAutosave(true);
    this.autosaveEnabled = false;
  }

  update(publishUi = true): void {
    if (this.location === "room") {
      this.room.onArrival();
    }
    this.room.refreshAvailability();
    this.outside.update();
    if (this.engine.state.get("stores.compass", true) !== 0) {
      this.world.ensureMap();
    }
    this.path.update();
    this.events.update();
    this.space.update();
    this.consumeSpaceExit();
    this.world.applyWaterReplenishmentConsequences();
    this.world.applyOutpostUseConsequences();
    this.world.applyClearedLandmarkConsequences();
    this.consumeWorldReturnLocation();
    this.engine.cooldowns.expireCompleted();
    if (this.location === "outside" && !this.outside.snapshot().unlocked) {
      this.location = "room";
    }
    if (this.location === "path" && !this.path.snapshot().unlocked) {
      this.location = "room";
    }
    if (this.location === "world" && !this.world.snapshot().active) {
      this.location = this.path.snapshot().unlocked ? "path" : "room";
    }
    if (this.location === "ship" && !this.ship.snapshot().unlocked) {
      this.location = "room";
    }
    if (this.location === "space" && !this.space.snapshot().active) {
      this.location = this.ship.snapshot().unlocked ? "ship" : "room";
    }
    if (
      this.location === "fabricator" &&
      !this.fabricator.snapshot().unlocked
    ) {
      this.location = "room";
    }
    if (publishUi) this.publishUiChanges();
  }

  setLocation(location: GameLocationKey): void {
    if (this.events.active()) return;
    if (location === "outside" && !this.outside.snapshot().unlocked) {
      this.location = "room";
      return;
    }
    if (location === "path" && !this.path.snapshot().unlocked) {
      this.location = "room";
      return;
    }
    if (location === "world" && !this.world.snapshot().active) {
      this.location = this.path.snapshot().unlocked ? "path" : "room";
      return;
    }
    if (location === "ship" && !this.ship.snapshot().unlocked) {
      this.location = "room";
      return;
    }
    if (location === "space" && !this.space.snapshot().active) {
      this.location = this.ship.snapshot().unlocked ? "ship" : "room";
      return;
    }
    if (location === "fabricator" && !this.fabricator.snapshot().unlocked) {
      this.location = "room";
      return;
    }
    this.location = location;
    if (location === "room") {
      this.room.onArrival();
    } else if (location === "outside") {
      this.outside.onArrival();
    } else if (location === "path") {
      this.path.onArrival();
    } else if (location === "ship") {
      this.ship.onArrival();
    } else if (location === "fabricator") {
      this.fabricator.onArrival();
    }
    this.update();
  }

  setDebugSpeedX10(enabled: boolean): void {
    this.engine.state.set(
      "config.debug.speedMultiplier",
      enabled ? 10 : 1,
      true,
    );
    this.update();
  }

  setDebugIncomeX10(enabled: boolean): void {
    this.engine.state.set(
      "config.debug.incomeMultiplier",
      enabled ? 10 : 1,
      true,
    );
    this.update();
  }

  setHyperMode(enabled: boolean): void {
    if (this.events.active()) return;
    this.engine.state.set("config.hyperMode", enabled);
    this.update();
    this.persistAutosave(true);
  }

  saveDevState(): boolean {
    let snapshot: GameSessionDevSnapshot;
    try {
      snapshot = this.createDevSnapshot();
    } catch (error) {
      this.markPersistenceUnavailable("write", error);
      return false;
    }
    return this.saveSnapshot(snapshot);
  }

  retryPersistence(): boolean {
    if (!this.engine.hasDevSaveAdapter()) return false;
    if (this.lastInMemorySnapshot !== null) {
      return this.saveSnapshot(this.lastInMemorySnapshot);
    }
    return this.saveDevState();
  }

  exportRecoverySnapshot(): string | null {
    if (this.lastInMemorySnapshot === null) return null;
    return JSON.stringify(
      createDevSaveDocument(this.lastInMemorySnapshot),
      null,
      2,
    );
  }

  dismissBackgroundTimePolicyNotice(): void {
    if (this.backgroundTimePolicyNotice === null) return;
    this.backgroundTimePolicyNotice = null;
    this.publishUiChanges();
  }

  loadDevState(): boolean {
    let loaded: DevSaveData | null;
    try {
      loaded = this.engine.loadDevSnapshot();
    } catch (error) {
      this.captureInMemorySnapshot();
      this.markPersistenceUnavailable("read", error);
      return false;
    }
    if (!loaded) {
      this.markPersistenceHealthy();
      return false;
    }
    const restored = this.restoreDevSnapshot(loaded);
    let recoveredFromBackup = false;
    if (!restored) {
      let recovered: DevSaveData | null;
      try {
        recovered = this.engine.recoverDevSnapshot("invalid-session-snapshot");
      } catch (error) {
        this.captureInMemorySnapshot();
        this.markPersistenceUnavailable("read", error);
        return false;
      }
      if (!recovered || !this.restoreDevSnapshot(recovered)) {
        if (recovered) {
          try {
            this.engine.quarantineDevState("invalid-session-backup-snapshot");
          } catch {
            // The invalid backup is already rejected for this live session.
          }
        }
        this.captureInMemorySnapshot();
        this.markPersistenceRecovered(
          "Saved data was invalid and could not be restored. A fresh run is active; retry saving or export a recovery file before closing.",
          "invalid-save",
        );
        return false;
      }
      recoveredFromBackup = true;
    }
    this.notifyBackgroundTimePolicyOnFirstResume();
    this.update();
    this.captureInMemorySnapshot();
    if (recoveredFromBackup) {
      this.markPersistenceRecovered(
        "The latest save was invalid. The previous saved generation was recovered.",
        "backup-recovered",
      );
    } else {
      this.markPersistenceHealthy();
    }
    return true;
  }

  clearDevState(): boolean {
    try {
      this.engine.clearDevState();
      this.lastInMemorySnapshot = null;
      this.markPersistenceHealthy();
      return true;
    } catch (error) {
      this.captureInMemorySnapshot();
      this.markPersistenceUnavailable("write", error);
      return false;
    }
  }

  restartAfterEnding(): boolean {
    const ending = this.space.snapshot();
    if (ending.phase !== "ending" || ending.endingStage !== "scores") {
      return false;
    }
    const previous = {
      score: this.engine.state.get("previous.score", true),
      stores: this.engine.state.get("previous.stores", true),
    };
    const state = createInitialState();
    state.previous = structuredClone(previous);
    const snapshot = this.engine.createDevSnapshot();
    snapshot.state = state;
    snapshot.cooldowns = [];
    snapshot.notifications = { nextId: 1, items: [] };
    return this.saveSnapshot(snapshot);
  }

  lightFire(): void {
    this.dispatch({ type: "room.lightFire", payload: {} });
  }

  stokeFire(): void {
    this.dispatch({ type: "room.stokeFire", payload: {} });
  }

  build(key: string): void {
    this.dispatch({ type: "room.build", payload: { key } });
  }

  buy(key: string): void {
    this.dispatch({ type: "room.buy", payload: { key } });
  }

  gatherWood(): void {
    this.dispatch({ type: "outside.gatherWood", payload: {} });
  }

  checkTraps(): void {
    this.dispatch({ type: "outside.checkTraps", payload: {} });
  }

  increaseWorker(worker: string, amount: number): void {
    this.dispatch({
      type: "outside.increaseWorker",
      payload: { worker, amount },
    });
  }

  decreaseWorker(worker: string, amount: number): void {
    this.dispatch({
      type: "outside.decreaseWorker",
      payload: { worker, amount },
    });
  }

  increaseSupply(key: string, amount: number): void {
    this.dispatch({ type: "path.increaseSupply", payload: { key, amount } });
  }

  decreaseSupply(key: string, amount: number): void {
    this.dispatch({ type: "path.decreaseSupply", payload: { key, amount } });
  }

  embark(): void {
    this.dispatch({ type: "path.embark", payload: {} });
  }

  moveWorld(direction: WorldMoveDirection): void {
    this.dispatch({ type: "world.move", payload: { direction } });
  }

  enterWorldLandmark(): void {
    this.dispatch({ type: "world.enterLandmark", payload: {} });
  }

  returnFromWorld(): void {
    this.dispatch({ type: "world.returnHome", payload: {} });
  }

  reinforceShipHull(): void {
    this.dispatch({ type: "ship.reinforceHull", payload: {} });
  }

  upgradeShipEngine(): void {
    this.dispatch({ type: "ship.upgradeEngine", payload: {} });
  }

  requestShipLiftOff(): void {
    this.dispatch({ type: "ship.requestLiftOff", payload: {} });
  }

  confirmShipLiftOff(): void {
    this.dispatch({ type: "ship.confirmLiftOff", payload: {} });
  }

  lingerAtShip(): void {
    this.dispatch({ type: "ship.linger", payload: {} });
  }

  moveSpace(direction: SpaceMoveDirection): void {
    this.dispatch({ type: "space.move", payload: { direction } });
  }

  setSpaceMovement(direction: SpaceMoveDirection, active: boolean): void {
    this.dispatch({
      type: "space.setMovement",
      payload: { direction, active },
    });
  }

  continueSpaceEnding(): void {
    this.dispatch({ type: "space.continueEnding", payload: {} });
  }

  fabricate(key: string): void {
    this.dispatch({ type: "fabricator.fabricate", payload: { key } });
  }

  triggerEventForTest(): void {
    this.dispatch({ type: "event.triggerAvailable", payload: {} });
  }

  triggerEventByKeyForTest(key: string): void {
    this.events.triggerByKeyForTest(key);
    this.update();
  }

  triggerWorldEncounter(context: WorldEncounterContext): void {
    this.dispatch({ type: "event.triggerWorldEncounter", payload: context });
  }

  triggerWorldSetpiece(scene: string): void {
    this.dispatch({ type: "event.triggerWorldSetpiece", payload: { scene } });
  }

  chooseEventButton(key: string): void {
    this.dispatch({ type: "event.choose", payload: { key } });
  }

  chooseEventCombatAction(key: string): void {
    this.dispatch({ type: "event.combatAction", payload: { key } });
  }

  chooseEventLootAction(key: string): void {
    this.dispatch({ type: "event.lootAction", payload: { key } });
  }

  advanceForTest(ms: number): void {
    this.engine.clock.advanceBy(ms);
    this.update();
  }

  setStateForTest(path: string, value: unknown): void {
    this.engine.state.set(path, value);
    this.update();
  }

  getStateForTest(path: string): unknown {
    return this.engine.state.get(path);
  }

  setRngSequenceForTest(values: number[]): void {
    let index = 0;
    const next = () => {
      const value = values[Math.min(index, values.length - 1)] ?? 0;
      index += 1;
      return value;
    };
    this.engine.rng.next = next;
    this.engine.rng.nextInt = (maxExclusive) =>
      Math.floor(next() * maxExclusive);
    this.engine.rng.fork = () => this.engine.rng;
  }

  private dispatch(
    command: Parameters<GameEngine["commands"]["dispatch"]>[0],
  ): void {
    if (
      this.events.active() &&
      command.type !== "event.choose" &&
      command.type !== "event.combatAction" &&
      command.type !== "event.lootAction"
    ) {
      return;
    }
    this.engine.commands.dispatch(command);
    this.update();
    this.persistAutosave(true);
  }

  private registerGameplayCommands(): void {
    this.engine.commands.register("room.lightFire", () =>
      this.room.lightFire(),
    );
    this.engine.commands.register("room.stokeFire", () =>
      this.room.stokeFire(),
    );
    this.engine.commands.register("room.build", (command) =>
      this.room.build(command.payload.key),
    );
    this.engine.commands.register("room.buy", (command) => {
      const bought = this.room.buy(command.payload.key);
      if (bought && command.payload.key === "compass") {
        this.world.ensureMap();
        this.path.openFromCompassPurchase();
      }
    });
    this.engine.commands.register("outside.gatherWood", () =>
      this.outside.gatherWood(),
    );
    this.engine.commands.register("outside.checkTraps", () =>
      this.outside.checkTraps(),
    );
    this.engine.commands.register("outside.increaseWorker", (command) =>
      this.outside.increaseWorker(
        command.payload.worker,
        command.payload.amount,
      ),
    );
    this.engine.commands.register("outside.decreaseWorker", (command) =>
      this.outside.decreaseWorker(
        command.payload.worker,
        command.payload.amount,
      ),
    );
    this.engine.commands.register("path.increaseSupply", (command) =>
      this.path.increaseSupply(command.payload.key, command.payload.amount),
    );
    this.engine.commands.register("path.decreaseSupply", (command) =>
      this.path.decreaseSupply(command.payload.key, command.payload.amount),
    );
    this.engine.commands.register("path.embark", () => {
      if (!this.path.embark()) return;
      this.world.embark();
      this.location = "world";
    });
    this.engine.commands.register("world.move", (command) => {
      const outcome = this.world.move(command.payload.direction);
      if (outcome.returnedHome) {
        this.location = "path";
        return;
      }
      if (outcome.setpieceScene) {
        this.events.triggerWorldSetpiece(outcome.setpieceScene);
        return;
      }
      if (
        outcome.encounter &&
        this.events.triggerWorldEncounter(outcome.encounter)
      ) {
        this.update();
      }
    });
    this.engine.commands.register("world.enterLandmark", () => {
      const scene = this.world.enterLandmark();
      if (scene) this.events.triggerWorldSetpiece(scene);
    });
    this.engine.commands.register("world.returnHome", () => {
      if (this.world.returnHome()) this.location = "path";
    });
    this.engine.commands.register("ship.reinforceHull", () =>
      this.ship.reinforceHull(),
    );
    this.engine.commands.register("ship.upgradeEngine", () =>
      this.ship.upgradeEngine(),
    );
    this.engine.commands.register("ship.requestLiftOff", () => {
      if (this.ship.requestLiftOff() === "ready") this.beginSpaceFlight();
    });
    this.engine.commands.register("ship.confirmLiftOff", () => {
      if (this.ship.confirmLiftOff()) this.beginSpaceFlight();
    });
    this.engine.commands.register("ship.linger", () => this.ship.linger());
    this.engine.commands.register("space.move", (command) =>
      this.space.move(command.payload.direction),
    );
    this.engine.commands.register("space.setMovement", (command) =>
      this.space.setMovement(command.payload.direction, command.payload.active),
    );
    this.engine.commands.register("space.continueEnding", () =>
      this.space.continueEnding(),
    );
    this.engine.commands.register("fabricator.fabricate", (command) =>
      this.fabricator.fabricate(command.payload.key),
    );
    this.engine.commands.register("event.triggerAvailable", () =>
      this.events.triggerAvailable(),
    );
    this.engine.commands.register("event.triggerWorldEncounter", (command) =>
      this.events.triggerWorldEncounter(command.payload),
    );
    this.engine.commands.register("event.triggerWorldSetpiece", (command) =>
      this.events.triggerWorldSetpiece(command.payload.scene),
    );
    this.engine.commands.register("event.choose", (command) =>
      this.events.choose(command.payload.key),
    );
    this.engine.commands.register("event.combatAction", (command) =>
      this.events.chooseCombatAction(command.payload.key),
    );
    this.engine.commands.register("event.lootAction", (command) =>
      this.events.chooseLootAction(command.payload.key),
    );
  }

  private publishUiChanges(): void {
    for (const domain of UI_DOMAINS) {
      const listeners = this.uiListeners.get(domain);
      if (!listeners || listeners.size === 0) {
        this.uiSnapshots.delete(domain);
        continue;
      }

      const nextSnapshot = this.createUiSnapshot(domain);
      this.uiDiagnosticsState.snapshots[domain] += 1;
      if (
        this.uiSnapshots.has(domain) &&
        uiSnapshotsEqual(this.uiSnapshots.get(domain), nextSnapshot)
      ) {
        continue;
      }

      this.uiSnapshots.set(domain, nextSnapshot);
      this.uiDiagnosticsState.notifications[domain] += 1;
      for (const listener of [...listeners]) listener();
    }
  }

  private createUiSnapshot(
    domain: GameUiDomain,
  ): GameUiSnapshotMap[GameUiDomain] {
    switch (domain) {
      case "navigation":
        return {
          location: this.location,
          persistence: this.persistenceSnapshot(),
          backgroundTimePolicyNotice: this.backgroundTimePolicyNotice,
          hyperMode: this.hyperMode(),
          roomTitle: this.room.navigationTitle(),
          outside: this.outside.navigationSnapshot(),
          path: this.path.navigationSnapshot(),
          worldActive: this.world.isActive(),
          fabricator: this.fabricator.navigationSnapshot(),
          ship: this.ship.navigationSnapshot(),
          spaceActive: this.space.snapshot().active,
        };
      case "room":
        return {
          room: this.room.snapshot(),
          compassDirection: this.path.compassHeading(),
        };
      case "outside":
        return {
          outside: this.outside.snapshot(),
          room: this.room.storesPanelSnapshot(),
          compassDirection: this.path.compassHeading(),
        };
      case "path":
        return {
          path: this.path.snapshot(),
          room: this.room.storesPanelSnapshot(),
        };
      case "world":
        return this.world.snapshot();
      case "fabricator":
        return this.fabricator.snapshot();
      case "ship":
        return this.ship.snapshot();
      case "space":
        return this.space.snapshot();
      case "settings":
        return {
          settings: this.settingsSnapshot(),
          location: this.location,
          room: this.room.snapshot(),
          outside: this.outside.snapshot(),
        };
      case "event":
        return this.events.snapshot();
    }
  }

  private createDevSnapshot(): GameSessionDevSnapshot {
    return {
      kind: "session",
      version: 2,
      engine: this.engine.createDevSnapshot(),
      location: this.location,
      room: this.room.lifecycleSnapshot(),
      outside: this.outside.lifecycleSnapshot(),
      events: this.events.lifecycleSnapshot(),
      space: this.space.lifecycleSnapshot(),
      clockDriver: this.clockDriver.lifecycleSnapshot(),
    };
  }

  private restoreDevSnapshot(data: DevSaveData): boolean {
    if (isGameSessionDevSnapshot(data)) {
      const previous = this.createDevSnapshot();
      try {
        this.applySessionSnapshot(data);
        return true;
      } catch {
        this.applySessionSnapshot(previous);
        return false;
      }
    }

    const restored = this.engine.restoreDevSnapshot(data);
    if (!restored) return false;
    this.location = "room";
    this.room.restoreLifecycle(null);
    this.outside.restoreLifecycle(null);
    this.events.restoreLifecycle(null);
    this.space.restoreLifecycle(null);
    return true;
  }

  private applySessionSnapshot(data: GameSessionDevSnapshot): void {
    if (!this.engine.restoreDevSnapshot(data.engine)) {
      throw new Error("Invalid engine snapshot");
    }
    this.location = data.location;
    this.clockDriver.restoreLifecycle(data.clockDriver);
    this.room.restoreLifecycle(data.room);
    this.outside.restoreLifecycle(data.outside);
    this.events.restoreLifecycle(data.events);
    this.space.restoreLifecycle(data.space);
  }

  private persistAutosave(force: boolean): void {
    if (!this.autosaveEnabled || !this.engine.hasDevSaveAdapter()) return;
    const now = this.engine.clock.now();
    if (!force && now - this.lastAutosaveAt < AUTOSAVE_INTERVAL_MS) return;
    this.saveDevState();
    // Failed writes are retried on the normal autosave cadence instead of on
    // every 250 ms realtime tick. Player commands still force an immediate try.
    this.lastAutosaveAt = now;
  }

  private saveSnapshot(snapshot: DevSaveData): boolean {
    this.lastInMemorySnapshot = snapshot;
    try {
      this.engine.saveDevSnapshot(snapshot);
      this.markPersistenceHealthy();
      return true;
    } catch (error) {
      this.markPersistenceUnavailable("write", error);
      return false;
    }
  }

  private captureInMemorySnapshot(): void {
    try {
      this.lastInMemorySnapshot = this.createDevSnapshot();
    } catch {
      // A non-serializable injected RNG is test-only and cannot produce a
      // portable recovery document.
    }
  }

  private persistenceSnapshot(): GamePersistenceSnapshot {
    const hasInMemorySnapshot = this.lastInMemorySnapshot !== null;
    const actionable =
      this.persistenceState.status === "unavailable" ||
      this.persistenceState.status === "recovered";
    return {
      ...this.persistenceState,
      hasInMemorySnapshot,
      canRetry: actionable && this.engine.hasDevSaveAdapter(),
      canExport: actionable && hasInMemorySnapshot,
    };
  }

  private markPersistenceHealthy(): void {
    if (!this.engine.hasDevSaveAdapter()) return;
    this.setPersistenceState({
      status: "healthy",
      operation: null,
      reason: null,
      message: null,
    });
  }

  private markPersistenceUnavailable(
    operation: "read" | "write",
    error: unknown,
  ): void {
    const reason = persistenceFailureReason(operation, error);
    const operationText = operation === "read" ? "read" : "write";
    this.setPersistenceState({
      status: "unavailable",
      operation,
      reason,
      message: `Saving unavailable: browser storage could not ${operationText} data (${reason}). This run is held in memory only; retry or export a recovery file before closing.`,
    });
  }

  private markPersistenceRecovered(message: string, reason: string): void {
    this.setPersistenceState({
      status: "recovered",
      operation: "read",
      reason,
      message,
    });
  }

  private setPersistenceState(
    state: Omit<
      GamePersistenceSnapshot,
      "hasInMemorySnapshot" | "canRetry" | "canExport"
    >,
  ): void {
    const previous = this.persistenceSnapshot();
    this.persistenceState = state;
    if (!uiSnapshotsEqual(previous, this.persistenceSnapshot())) {
      this.publishUiChanges();
    }
  }

  private notifyBackgroundTimePolicyOnFirstResume(): void {
    if (this.engine.state.get("config.backgroundTimePolicyNotified") === true) {
      return;
    }
    this.engine.state.set("config.backgroundTimePolicyNotified", true, true);
    this.backgroundTimePolicyNotice = BACKGROUND_TIME_POLICY_NOTIFICATION;
    this.engine.notifications.notify(
      "room",
      BACKGROUND_TIME_POLICY_NOTIFICATION,
    );
  }

  private settingsSnapshot(): GameDebugSettingsSnapshot {
    const incomeMultiplier = this.debugIncomeMultiplier();
    return {
      hyperMode: this.hyperMode(),
      speedX10: this.debugSpeedMultiplier() === 10,
      incomeX10: incomeMultiplier === 10,
      speedMultiplier: this.simulationSpeedMultiplier(),
      incomeMultiplier,
      nowMs: this.engine.clock.now(),
    };
  }

  private debugSpeedMultiplier(): 1 | 10 {
    return this.engine.state.get("config.debug.speedMultiplier", true) === 10
      ? 10
      : 1;
  }

  private hyperMode(): boolean {
    return this.engine.state.get("config.hyperMode") === true;
  }

  private simulationSpeedMultiplier(): 1 | 2 | 10 | 20 {
    const debugMultiplier = this.debugSpeedMultiplier();
    if (this.space.snapshot().active) return debugMultiplier;
    return (debugMultiplier * (this.hyperMode() ? 2 : 1)) as 1 | 2 | 10 | 20;
  }

  private debugIncomeMultiplier(): 1 | 10 {
    return this.engine.state.get("config.debug.incomeMultiplier", true) === 10
      ? 10
      : 1;
  }

  private consumeWorldReturnLocation(): void {
    const returnLocation = this.path.consumeWorldReturnLocation();
    if (!returnLocation) return;
    if (returnLocation === "room") {
      this.location = "room";
    } else if (returnLocation === "path") {
      this.location = "path";
      this.world.finishEventReturnToPath();
    }
  }

  private beginSpaceFlight(): void {
    const { hull } = this.ship.snapshot();
    if (this.space.startFlight(hull)) this.location = "space";
  }

  private consumeSpaceExit(): void {
    if (this.space.consumeExit() !== "crashed") return;
    this.location = "ship";
    this.ship.onArrival();
  }
}

function isGameSessionDevSnapshot(
  data: DevSaveData,
): data is GameSessionDevSnapshot {
  if (!(
    isRecord(data) &&
    data.kind === "session" &&
    data.version === 2 &&
    isGameLocationKey(data.location) &&
    isEngineDevSnapshot(data.engine) &&
    isRoomLifecycleSnapshot(data.room) &&
    isOutsideLifecycleSnapshot(data.outside) &&
    isEventLifecycleSnapshot(data.events) &&
    isSpaceLifecycleSnapshot(data.space, data.engine.nowMs) &&
    isRealtimeClockDriverLifecycleSnapshot(data.clockDriver)
  )) {
    return false;
  }
  return isSessionDomainInvariantValid(
    data as unknown as GameSessionDevSnapshot,
  );
}

function isRealtimeClockDriverLifecycleSnapshot(
  value: unknown,
): value is RealtimeClockDriverLifecycleSnapshot {
  return (
    isRecord(value) &&
    Array.isArray(value.debt) &&
    value.debt.every(
      (segment) =>
        isRecord(segment) &&
        isNonNegativeNumber(segment.elapsedMs) &&
        segment.elapsedMs <= Number.MAX_SAFE_INTEGER &&
        isNonNegativeNumber(segment.timeScale) &&
        segment.timeScale <= 20,
    )
  );
}

function isGameLocationKey(value: unknown): value is GameLocationKey {
  return (
    value === "room" ||
    value === "outside" ||
    value === "path" ||
    value === "world" ||
    value === "fabricator" ||
    value === "ship" ||
    value === "space" ||
    value === "settings"
  );
}

function isSpaceLifecycleSnapshot(
  value: unknown,
  nowMs: number,
): value is SpaceRuntimeLifecycleSnapshot {
  if (
    !isRecord(value) ||
    !(
      value.phase === "idle" ||
      value.phase === "flying" ||
      value.phase === "ending"
    ) ||
    !isBoundedLifecycleCount(value.hull) ||
    !isBoundedLifecycleCount(value.maxHull) ||
    !Number.isInteger(value.altitude) ||
    !isNonNegativeNumber(value.altitude) ||
    value.altitude > SPACE_ESCAPE_ALTITUDE ||
    !isFiniteNumber(value.shipX) ||
    value.shipX < SPACE_SHIP_MIN_POSITION ||
    value.shipX > SPACE_SHIP_MAX_POSITION ||
    !isFiniteNumber(value.shipY) ||
    value.shipY < SPACE_SHIP_MIN_POSITION ||
    value.shipY > SPACE_SHIP_MAX_POSITION ||
    !isNonNegativeNumber(value.lastUpdatedAt) ||
    value.lastUpdatedAt > nowMs ||
    !isNullableTimestamp(value.nextAltitudeAt) ||
    !isNullableTimestamp(value.nextAsteroidAt) ||
    !Array.isArray(value.asteroids) ||
    !value.asteroids.every(isSpaceAsteroidSnapshot) ||
    !Number.isSafeInteger(value.nextAsteroidId) ||
    (value.nextAsteroidId as number) < 1 ||
    !isExactScore(value.score) ||
    !isExactScore(value.totalScore) ||
    !(
      value.endingStage === undefined ||
      value.endingStage === "none" ||
      value.endingStage === "fleet" ||
      value.endingStage === "scores"
    ) ||
    !(
      value.heldDirections === undefined ||
      (Array.isArray(value.heldDirections) &&
        value.heldDirections.every(
          (direction) =>
            direction === "north" ||
            direction === "south" ||
            direction === "east" ||
            direction === "west",
        ))
    ) ||
    !(value.pendingExit === null || value.pendingExit === "crashed")
  ) {
    return false;
  }
  const heldDirections = value.heldDirections ?? [];
  const nextAsteroidId = value.nextAsteroidId as number;
  if (new Set(heldDirections).size !== heldDirections.length) return false;
  const asteroidIds = value.asteroids.map((asteroid) => asteroid.id);
  if (
    new Set(asteroidIds).size !== asteroidIds.length ||
    asteroidIds.some((id) => id >= nextAsteroidId)
  ) {
    return false;
  }
  const endingStage =
    value.endingStage ?? (value.phase === "ending" ? "scores" : "none");
  if (value.phase === "flying") {
    return (
      value.hull > 0 &&
      value.hull <= value.maxHull &&
      value.maxHull > 0 &&
      value.altitude < SPACE_ESCAPE_ALTITUDE &&
      value.nextAltitudeAt !== null &&
      value.nextAltitudeAt > value.lastUpdatedAt &&
      value.nextAsteroidAt !== null &&
      value.nextAsteroidAt > value.lastUpdatedAt &&
      value.score === 0 &&
      value.totalScore === 0 &&
      endingStage === "none" &&
      value.pendingExit === null
    );
  }
  if (value.phase === "ending") {
    return (
      value.hull > 0 &&
      value.hull <= value.maxHull &&
      value.maxHull > 0 &&
      value.altitude === SPACE_ESCAPE_ALTITUDE &&
      value.nextAltitudeAt === null &&
      value.nextAsteroidAt === null &&
      value.asteroids.length === 0 &&
      heldDirections.length === 0 &&
      (endingStage === "fleet" || endingStage === "scores") &&
      value.totalScore >= value.score &&
      value.pendingExit === null
    );
  }
  return (
    value.hull <= value.maxHull &&
    value.nextAltitudeAt === null &&
    value.nextAsteroidAt === null &&
    value.asteroids.length === 0 &&
    heldDirections.length === 0 &&
    value.score === 0 &&
    value.totalScore === 0 &&
    endingStage === "none" &&
    (value.pendingExit === null || value.hull === 0)
  );
}

function isSpaceAsteroidSnapshot(value: unknown): boolean {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.id) &&
    (value.id as number) >= 1 &&
    typeof value.glyph === "string" &&
    isNonNegativeNumber(value.x) &&
    value.x < SPACE_PANEL_SIZE &&
    isFiniteNumber(value.y) &&
    value.y >= SPACE_ASTEROID_START_TOP &&
    value.y <= SPACE_ASTEROID_END_TOP &&
    isFiniteNumber(value.speed) &&
    value.speed > 0
  );
}

function isRoomLifecycleSnapshot(
  value: unknown,
): value is RoomRuntimeLifecycleSnapshot {
  return (
    isRecord(value) &&
    value.initialized === true &&
    isNullableTimestamp(value.fireTimerDueAt) &&
    isNullableTimestamp(value.tempTimerDueAt) &&
    isNullableTimestamp(value.builderTimerDueAt) &&
    isNullableTimestamp(value.needWoodTimerDueAt) &&
    isNullableTimestamp(value.incomeTimerDueAt)
  );
}

function isOutsideLifecycleSnapshot(
  value: unknown,
): value is OutsideRuntimeLifecycleSnapshot {
  return (
    isRecord(value) &&
    isNullableTimestamp(value.populationTimerDueAt) &&
    isNullableTimestamp(value.incomeTimerDueAt)
  );
}

function isSessionDomainInvariantValid(data: GameSessionDevSnapshot): boolean {
  const features = data.engine.state.features;
  const locations = isRecord(features.location) ? features.location : {};
  const game = data.engine.state.game;
  const world = isRecord(game.world) ? game.world : {};

  if (
    locations.outside !== true &&
    (data.outside.populationTimerDueAt !== null ||
      data.outside.incomeTimerDueAt !== null)
  ) {
    return false;
  }

  if (data.location === "outside" && locations.outside !== true) return false;
  if (data.location === "path" && locations.path !== true) return false;
  if (data.location === "fabricator" && locations.fabricator !== true) {
    return false;
  }
  if (data.location === "ship" && locations.spaceShip !== true) return false;
  if (
    data.location === "world" &&
    (locations.world !== true || world.active !== true)
  ) {
    return false;
  }
  if (
    data.location === "space" &&
    (locations.spaceShip !== true || data.space.phase === "idle")
  ) {
    return false;
  }
  return data.space.phase === "idle" || data.location === "space";
}

function isBoundedLifecycleCount(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= MAX_STORE
  );
}

function isExactScore(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= MAX_EXACT_SCORE
  );
}

function isEventLifecycleSnapshot(
  value: unknown,
): value is EventRuntimeLifecycleSnapshot {
  if (
    !isRecord(value) ||
    !isNullableTimestamp(value.eventTimerDueAt) ||
    !isNullableString(value.activeEventKey) ||
    !isNullableString(value.activeSceneKey) ||
    !isStringArray(value.loadedSceneRewards) ||
    !isStringArray(value.loadedSceneEffects) ||
    !(value.sceneLoot === null || isNumericRecord(value.sceneLoot)) ||
    !Array.isArray(value.pendingDelayedActions) ||
    !value.pendingDelayedActions.every(isPendingDelayedAction) ||
    !(value.combat === null || isCombatLifecycleSnapshot(value.combat))
  ) {
    return false;
  }

  if (
    (value.activeEventKey === null) !== (value.activeSceneKey === null) ||
    (value.activeEventKey === null && value.combat !== null)
  ) {
    return false;
  }
  if (value.activeEventKey === null || value.activeSceneKey === null)
    return true;
  const event = originalEventDefinitions.find(
    (entry) => entry.key === value.activeEventKey,
  );
  const scene = event?.scenes[value.activeSceneKey];
  return (
    scene !== undefined && (value.combat === null || scene.combat !== undefined)
  );
}

function isPendingDelayedAction(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isNonNegativeNumber(value.dueAt) &&
    isNumericRecord(value.reward) &&
    typeof value.notification === "string" &&
    typeof value.source === "string"
  );
}

function isCombatLifecycleSnapshot(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value.phase === "fighting" ||
      value.phase === "exploding" ||
      value.phase === "won") &&
    isFiniteNumber(value.enemyHp) &&
    isNonNegativeNumber(value.enemyMaxHp) &&
    isNumericRecord(value.loot) &&
    typeof value.lootTaken === "boolean" &&
    isNullableTimestamp(value.enemyStunnedUntil) &&
    isNullableTimestamp(value.enemyAttackDueAt) &&
    isNullableTimestamp(value.enemyExplosionDueAt) &&
    isNullableString(value.enemyStatus) &&
    isNullableTimestamp(value.enemyStatusExpiresAt) &&
    isNumericRecord(value.enemySpecialDueAts) &&
    isFiniteNumber(value.enemyMeditateDamage) &&
    isNullableString(value.lastSpecialStatus) &&
    isFiniteNumber(value.playerDotDamage) &&
    isNullableTimestamp(value.playerDotDueAt) &&
    typeof value.playerShielded === "boolean" &&
    typeof value.playerBoosted === "boolean" &&
    isNullableTimestamp(value.playerBoostExpiresAt)
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function persistenceFailureReason(
  operation: "read" | "write",
  error: unknown,
): string {
  const name =
    isRecord(error) && typeof error.name === "string" ? error.name : "";
  if (name === "SecurityError") return "storage-blocked";
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return "quota-exceeded";
  }
  return `${operation}-failed`;
}

function emptyUiCounter(): Record<GameUiDomain, number> {
  return {
    navigation: 0,
    room: 0,
    outside: 0,
    path: 0,
    world: 0,
    fabricator: 0,
    ship: 0,
    space: 0,
    settings: 0,
    event: 0,
  };
}

function uiSnapshotsEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    typeof left !== "object" ||
    left === null ||
    typeof right !== "object" ||
    right === null
  ) {
    return false;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    return left.every((value, index) => uiSnapshotsEqual(value, right[index]));
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(rightRecord, key) &&
      uiSnapshotsEqual(leftRecord[key], rightRecord[key]),
  );
}
