import { describe, expect, it } from "vitest";
import { createGameEngine, RoomRuntime } from "../../engine";

describe("RoomRuntime", () => {
  it("initializes the original fresh room state", () => {
    const room = new RoomRuntime(createGameEngine());

    expect(room.snapshot()).toMatchObject({
      title: "A Dark Room",
      fire: "dead",
      fireValue: 0,
      temperature: "freezing",
      temperatureValue: 0,
      builderLevel: -1,
      wood: undefined,
      activeButton: "light fire"
    });
  });

  it("lights the fire and starts builder discovery without requiring initial wood", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    expect(room.lightFire()).toBe(true);

    expect(room.snapshot()).toMatchObject({
      title: "A Firelit Room",
      fire: "burning",
      fireValue: 3,
      builderLevel: 0,
      activeButton: "stoke fire"
    });
    expect(room.snapshot().notifications.map((item) => item.message)).toEqual([
      "the fire is burning",
      "the light from the fire spills from the windows, out into the dark"
    ]);
  });

  it("stokes fire using original no-wood and free-wood semantics", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    room.lightFire();
    expect(room.stokeFire()).toBe(true);
    expect(room.snapshot().fire).toBe("roaring");

    engine.state.set("stores.wood", 0);
    expect(room.stokeFire()).toBe(false);
    expect(room.snapshot().notifications.at(-1)?.message).toBe("the wood has run out");
  });

  it("moves temperature toward fire and advances builder states", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    room.lightFire();
    room.advanceBuilder();
    expect(room.snapshot().builderLevel).toBe(1);

    room.adjustTemperature();
    room.adjustTemperature();
    room.adjustTemperature();
    expect(room.snapshot().temperature).toBe("warm");

    room.advanceBuilder();
    expect(room.snapshot().builderLevel).toBe(2);
    room.advanceBuilder();
    expect(room.snapshot().builderLevel).toBe(3);
  });
});
