import { RealtimeClockDriver } from "./clock";
import { createGameEngine, type GameEngine } from "./GameEngine";
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
import { LocalStorageDevSaveAdapter, type DevSaveData } from "./save/devSave";
import type { GameEngineDevSnapshot } from "./GameEngine";
import {
  WorldRuntime,
  type WorldEncounterContext,
  type WorldMoveDirection,
  type WorldStateSnapshot,
} from "./world/WorldRuntime";

export type GameLocationKey =
  "room" | "outside" | "path" | "world" | "settings";

export interface GameDebugSettingsSnapshot {
  speedX10: boolean;
  incomeX10: boolean;
  speedMultiplier: 1 | 10;
  incomeMultiplier: 1 | 10;
  nowMs: number;
}

export interface GameSessionSnapshot {
  location: GameLocationKey;
  room: RoomStateSnapshot;
  outside: OutsideStateSnapshot;
  path: PathStateSnapshot;
  world: WorldStateSnapshot;
  event: EventPanelSnapshot | null;
  settings: GameDebugSettingsSnapshot;
}

export interface GameSessionDevSnapshot {
  kind: "session";
  version: 1;
  engine: GameEngineDevSnapshot;
  location: GameLocationKey;
  room: RoomRuntimeLifecycleSnapshot;
  outside: OutsideRuntimeLifecycleSnapshot;
  events: EventRuntimeLifecycleSnapshot;
}

export class GameSession {
  readonly engine: GameEngine;
  readonly room: RoomRuntime;
  readonly outside: OutsideRuntime;
  readonly events: EventRuntime;
  readonly path: PathRuntime;
  readonly world: WorldRuntime;
  private readonly clockDriver: RealtimeClockDriver;
  private location: GameLocationKey = "room";

  constructor(
    engine: GameEngine = createGameEngine({
      saveAdapter:
        typeof window === "undefined"
          ? undefined
          : new LocalStorageDevSaveAdapter(),
    }),
  ) {
    this.engine = engine;
    this.room = new RoomRuntime(engine);
    this.outside = new OutsideRuntime(engine);
    this.path = new PathRuntime(engine);
    this.world = new WorldRuntime(engine);
    this.events = new EventRuntime(
      engine,
      () => this.location,
      {
        killVillagers: (count) => this.outside.killVillagers(count),
        destroyHuts: (count) => this.outside.destroyHuts(count),
      },
      this.world,
    );
    this.clockDriver = new RealtimeClockDriver(engine.clock, {
      intervalMs: 250,
      timeScale: () => this.debugSpeedMultiplier(),
    });
    this.registerGameplayCommands();
    this.room.initialize();
    this.update();
  }

  snapshot(): GameSessionSnapshot {
    return {
      location: this.location,
      room: this.room.snapshot(),
      outside: this.outside.snapshot(),
      path: this.path.snapshot(),
      world: this.world.snapshot(),
      event: this.events.snapshot(),
      settings: this.settingsSnapshot(),
    };
  }

  start(onUpdate: () => void): void {
    this.clockDriver.start(() => {
      this.update();
      onUpdate();
    });
  }

  stop(): void {
    this.clockDriver.stop();
  }

  update(): void {
    if (this.location === "room") {
      this.room.onArrival();
    }
    this.room.refreshAvailability();
    this.outside.update();
    this.path.update();
    this.events.update();
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
  }

  setLocation(location: GameLocationKey): void {
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
    this.location = location;
    if (location === "room") {
      this.room.onArrival();
    } else if (location === "outside") {
      this.outside.onArrival();
    } else if (location === "path") {
      this.path.onArrival();
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

  saveDevState(): void {
    this.engine.saveDevSnapshot(this.createDevSnapshot());
  }

  loadDevState(): boolean {
    const loaded = this.engine.loadDevSnapshot();
    if (!loaded) return false;
    const restored = this.restoreDevSnapshot(loaded);
    if (!restored) return false;
    this.update();
    return true;
  }

  clearDevState(): void {
    this.engine.clearDevState();
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

  private dispatch(
    command: Parameters<GameEngine["commands"]["dispatch"]>[0],
  ): void {
    this.engine.commands.dispatch(command);
    this.update();
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

  private createDevSnapshot(): GameSessionDevSnapshot {
    return {
      kind: "session",
      version: 1,
      engine: this.engine.createDevSnapshot(),
      location: this.location,
      room: this.room.lifecycleSnapshot(),
      outside: this.outside.lifecycleSnapshot(),
      events: this.events.lifecycleSnapshot(),
    };
  }

  private restoreDevSnapshot(data: DevSaveData): boolean {
    if (isGameSessionDevSnapshot(data)) {
      if (!this.engine.restoreDevSnapshot(data.engine)) return false;
      this.location = data.location;
      this.room.restoreLifecycle(data.room);
      this.outside.restoreLifecycle(data.outside);
      this.events.restoreLifecycle(data.events);
      return true;
    }

    const restored = this.engine.restoreDevSnapshot(data);
    if (!restored) return false;
    this.location = "room";
    this.room.restoreLifecycle(null);
    this.outside.restoreLifecycle(null);
    this.events.restoreLifecycle(null);
    return true;
  }

  private settingsSnapshot(): GameDebugSettingsSnapshot {
    const speedMultiplier = this.debugSpeedMultiplier();
    const incomeMultiplier = this.debugIncomeMultiplier();
    return {
      speedX10: speedMultiplier === 10,
      incomeX10: incomeMultiplier === 10,
      speedMultiplier,
      incomeMultiplier,
      nowMs: this.engine.clock.now(),
    };
  }

  private debugSpeedMultiplier(): 1 | 10 {
    return this.engine.state.get("config.debug.speedMultiplier", true) === 10
      ? 10
      : 1;
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
}

function isGameSessionDevSnapshot(
  data: DevSaveData,
): data is GameSessionDevSnapshot {
  return (
    data !== null &&
    typeof data === "object" &&
    (data as { kind?: unknown }).kind === "session" &&
    (data as { version?: unknown }).version === 1 &&
    isGameLocationKey((data as { location?: unknown }).location) &&
    typeof (data as { engine?: unknown }).engine === "object"
  );
}

function isGameLocationKey(value: unknown): value is GameLocationKey {
  return (
    value === "room" ||
    value === "outside" ||
    value === "path" ||
    value === "world" ||
    value === "settings"
  );
}
