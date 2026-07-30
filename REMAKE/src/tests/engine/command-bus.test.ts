import { describe, expect, it } from "vitest";
import {
  CommandBus,
  createGameEngine,
  GameSession,
  MemoryDevSaveAdapter,
  type Command,
} from "../../engine";

type TestCommand = Command<"add", { amount: number }>;

describe("CommandBus", () => {
  it("dispatches commands to registered handlers", () => {
    const bus = new CommandBus<TestCommand>();
    let total = 0;

    bus.register("add", (command) => {
      total += command.payload.amount;
    });
    bus.dispatch({ type: "add", payload: { amount: 5 } });

    expect(total).toBe(5);
  });

  it("throws when no command handler is registered", () => {
    const bus = new CommandBus<TestCommand>();

    expect(() => bus.dispatch({ type: "add", payload: { amount: 5 } })).toThrow(
      /No command handler/,
    );
  });

  it("rolls back all earlier handlers when a later handler fails", () => {
    const bus = new CommandBus<TestCommand>();
    let total = 2;
    bus.setTransaction({
      begin: () => total,
      rollback: (checkpoint) => {
        total = checkpoint as number;
      },
    });
    bus.register("add", ({ payload }) => {
      total += payload.amount;
    });
    bus.register("add", () => {
      throw new Error("handler failed");
    });

    expect(() => bus.dispatch({ type: "add", payload: { amount: 5 } })).toThrow(
      "handler failed",
    );
    expect(total).toBe(2);
  });

  it("contains a session command failure, reports it, saves rollback state, and keeps time live", () => {
    const adapter = new MemoryDevSaveAdapter();
    const engine = createGameEngine({ saveAdapter: adapter, rngSeed: 17 });
    const session = new GameSession(engine);
    const removeFailure = engine.commands.register("room.lightFire", () => {
      throw new Error("injected action failure");
    });
    session.start();

    expect(() => session.lightFire()).not.toThrow();
    expect(session.snapshot().room.title).toBe("A Dark Room");
    expect(session.uiSnapshot("navigation").runtimeFailure).toMatchObject({
      commandType: "room.lightFire",
      message: "injected action failure",
    });
    const persisted = adapter.load();
    expect(persisted.status).toBe("loaded");
    expect("data" in persisted).toBe(true);

    const before = engine.clock.now();
    session.advanceForTest(1_000);
    expect(engine.clock.now()).toBe(before + 1_000);
    removeFailure();
    session.lightFire();
    expect(session.uiSnapshot("navigation").runtimeFailure).not.toBeNull();
    session.dismissRuntimeFailure();
    expect(session.uiSnapshot("navigation").runtimeFailure).toBeNull();
    session.stop();
  });
});
