import { describe, expect, it } from "vitest";
import { CommandBus, type Command } from "../../engine";

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
});
