import { ManualClock } from "./clock";
import { CommandBus, type Command } from "./commands/CommandBus";
import { CooldownManager } from "./cooldowns/CooldownManager";
import { EventBus } from "./events/EventBus";
import { NotificationCenter } from "./notifications/NotificationCenter";
import { createDefaultRng, type Rng } from "./rng";
import type { DevSaveAdapter } from "./save/devSave";
import { StateStore } from "./state/StateStore";
import { createInitialState } from "./state/types";

const SOURCE_COMMIT = "1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7";

export interface GameEngineSnapshot {
  sourceCommit: string;
  saveScope: string;
  rngKind: string;
  nowMs: number;
}

export interface GameEngineOptions {
  rng?: Rng;
  clock?: ManualClock;
  state?: StateStore;
  saveAdapter?: DevSaveAdapter;
}

export type GameCommand =
  | Command<"state.set", { path: string; value: unknown }>
  | Command<"state.add", { path: string; amount: number }>
  | Command<"notify", { source: string; message: string }>
  | Command<"cooldown.start", { key: string; durationMs: number }>;

export interface GameEvents {
  notification: ReturnType<NotificationCenter["notify"]>;
  command: GameCommand;
}

export class GameEngine {
  readonly rng: Rng;
  readonly clock: ManualClock;
  state: StateStore;
  readonly commands = new CommandBus<GameCommand>();
  readonly events = new EventBus<GameEvents>();
  readonly notifications: NotificationCenter;
  readonly cooldowns: CooldownManager;
  private readonly saveAdapter?: DevSaveAdapter;

  constructor(options: GameEngineOptions = {}) {
    this.rng = options.rng ?? createDefaultRng();
    this.clock = options.clock ?? new ManualClock();
    this.state = options.state ?? new StateStore(createInitialState());
    this.saveAdapter = options.saveAdapter;
    this.notifications = new NotificationCenter(() => this.clock.now());
    this.cooldowns = new CooldownManager(this.clock);
    this.registerCoreCommands();
  }

  getSnapshot(): GameEngineSnapshot {
    return {
      sourceCommit: SOURCE_COMMIT,
      saveScope: "dev-only disposable save",
      rngKind: "seeded deterministic",
      nowMs: this.clock.now()
    };
  }

  saveDevState(): void {
    if (!this.saveAdapter) {
      throw new Error("No dev save adapter configured");
    }
    this.saveAdapter.save(this.state.snapshot());
  }

  loadDevState(): boolean {
    if (!this.saveAdapter) {
      throw new Error("No dev save adapter configured");
    }
    const loaded = this.saveAdapter.load();
    if (!loaded) return false;
    this.replaceState(new StateStore(loaded));
    return true;
  }

  private replaceState(state: StateStore): void {
    this.state = state;
  }

  private registerCoreCommands(): void {
    this.commands.register("state.set", (command) => {
      this.state.set(command.payload.path, command.payload.value);
      this.events.publish("command", command);
    });

    this.commands.register("state.add", (command) => {
      this.state.add(command.payload.path, command.payload.amount);
      this.events.publish("command", command);
    });

    this.commands.register("notify", (command) => {
      const notification = this.notifications.notify(
        command.payload.source,
        command.payload.message
      );
      this.events.publish("notification", notification);
      this.events.publish("command", command);
    });

    this.commands.register("cooldown.start", (command) => {
      this.cooldowns.start(command.payload.key, command.payload.durationMs);
      this.events.publish("command", command);
    });
  }
}

export function createGameEngine(options?: GameEngineOptions): GameEngine {
  return new GameEngine(options);
}
