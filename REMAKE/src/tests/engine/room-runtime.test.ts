import { describe, expect, it } from "vitest";
import { createGameEngine, RoomRuntime } from "../../engine";
import {
  ROOM_BUILDER_STATE_DELAY,
  ROOM_FIRE_COOL_DELAY,
  ROOM_NEED_WOOD_DELAY,
  ROOM_STOKE_COOLDOWN,
} from "../../content/original/room/roomData";

describe("RoomRuntime", () => {
  it("initializes the original fresh room state", () => {
    const room = new RoomRuntime(createGameEngine());
    room.initialize();

    expect(room.snapshot()).toMatchObject({
      title: "A Dark Room",
      fire: "dead",
      fireValue: 0,
      temperature: "freezing",
      temperatureValue: 0,
      builderLevel: -1,
      wood: undefined,
      activeButton: "light fire",
    });
  });

  it("keeps room snapshots side-effect free", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    room.initialize();
    engine.state.set("game.builder.level", 4);
    engine.state.set("game.temperature", { value: 3, text: "warm" });
    engine.state.set("stores.wood", 5);
    room.refreshAvailability();

    const stateBefore = engine.state.snapshot();
    const notificationsBefore = engine.notifications.list();

    room.snapshot();
    room.snapshot();

    expect(engine.state.snapshot()).toEqual(stateBefore);
    expect(engine.notifications.list()).toEqual(notificationsBefore);
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
      activeButton: "stoke fire",
    });
    expect(room.snapshot().activeCooldown).toMatchObject({
      active: true,
      remainingMs: ROOM_STOKE_COOLDOWN * 1000,
    });
    expect(room.snapshot().notifications.map((item) => item.message)).toEqual([
      "the fire is burning",
      "the light from the fire spills from the windows, out into the dark",
    ]);
  });

  it("stokes fire using original no-wood and free-wood semantics", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    room.lightFire();
    expect(room.stokeFire()).toBe(false);
    engine.clock.advanceBy(ROOM_STOKE_COOLDOWN * 1000);

    expect(room.stokeFire()).toBe(true);
    expect(room.snapshot().fire).toBe("roaring");

    engine.clock.advanceBy(ROOM_STOKE_COOLDOWN * 1000);
    engine.state.set("stores.wood", 0);
    expect(room.stokeFire()).toBe(false);
    expect(room.snapshot().notifications.at(-1)?.message).toBe(
      "the wood has run out",
    );
  });

  it("runs original room timers for builder arrival, need-wood, and fire cooling", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    room.lightFire();
    engine.clock.advanceBy(ROOM_BUILDER_STATE_DELAY);
    expect(room.snapshot()).toMatchObject({
      builderLevel: 1,
      outsideUnlocked: false,
    });

    engine.clock.advanceBy(ROOM_NEED_WOOD_DELAY);
    expect(room.snapshot()).toMatchObject({
      outsideUnlocked: true,
      wood: 4,
    });

    engine.clock.advanceBy(
      ROOM_FIRE_COOL_DELAY - ROOM_BUILDER_STATE_DELAY - ROOM_NEED_WOOD_DELAY,
    );
    expect(room.snapshot().fire).toBe("flickering");
  });

  it("returns to the dark room title as the fire cools below flickering", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.fire", { value: 2, text: "flickering" });
    expect(room.snapshot()).toMatchObject({
      title: "A Firelit Room",
      fire: "flickering",
    });

    room.coolFire();

    expect(room.snapshot()).toMatchObject({
      title: "A Dark Room",
      fire: "smoldering",
    });
    expect(room.snapshot().notifications.at(-1)?.message).toBe(
      "the fire is smoldering",
    );
  });

  it("does not repeat outside unlock notifications after forest is already unlocked", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    room.unlockForest();
    room.unlockForest();

    expect(room.snapshot().notifications.map((item) => item.message)).toEqual([
      "the wind howls outside",
      "the wood is running out",
    ]);
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

  it("promotes the warmed builder to helper and reveals original building options", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.builder.level", 3);
    engine.state.set("game.temperature", { value: 3, text: "warm" });
    engine.state.set("stores.wood", 5);

    room.onArrival();
    room.refreshAvailability();

    const snapshot = room.snapshot();
    expect(snapshot.builderLevel).toBe(4);
    expect(snapshot.income).toEqual([
      {
        source: "builder",
        store: "wood",
        amount: 2,
        delay: 10,
        text: "+2 per 10s",
      },
    ]);
    expect(snapshot.buildOptions).toEqual([
      {
        kind: "build",
        key: "trap",
        name: "trap",
        cost: { wood: 10 },
        maximum: 10,
        count: 0,
        disabled: true,
      },
    ]);
    expect(snapshot.notifications.map((item) => item.message)).toContain(
      "builder says she can make traps to catch any creatures might still be alive out there",
    );
  });

  it("applies debug income multiplier to passive income only when enabled", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.builder.level", 3);
    engine.state.set("stores.wood", 0);
    room.onArrival();

    engine.clock.advanceBy(10_000);
    expect(engine.state.get("stores.wood")).toBe(2);

    engine.state.set("config.debug.incomeMultiplier", 10, true);
    expect(room.snapshot().income).toEqual([
      {
        source: "builder",
        store: "wood",
        amount: 20,
        delay: 10,
        text: "+20 per 10s",
      },
    ]);

    engine.clock.advanceBy(10_000);
    expect(engine.state.get("stores.wood")).toBe(22);
  });

  it("sorts and classifies room stores with original misc and fabricator item types", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("stores.wood", 12);
    engine.state.set("stores.fur", 3);
    engine.state.set('stores["laser rifle"]', 1);
    engine.state.set('stores["energy blade"]', 1);
    engine.state.set('stores["kinetic armour"]', 1);
    engine.state.set("stores.compass", 1);
    engine.state.set('stores["ship blueprint"]', 1);

    expect(room.snapshot().stores).toEqual([
      { key: "compass", value: 1, category: "special" },
      { key: "energy blade", value: 1, category: "weapons" },
      { key: "fur", value: 3, category: "resources" },
      { key: "laser rifle", value: 1, category: "weapons" },
      { key: "wood", value: 12, category: "resources" },
    ]);
  });

  it("does not expose workshop craftables just because the store item exists", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.builder.level", 4);
    engine.state.set("game.temperature", { value: 3, text: "warm" });
    engine.state.set("stores.wood", 10);
    engine.state.set("stores.torch", 1);
    engine.state.set('game.buildings["trap"]', 1);

    const snapshot = room.snapshot();
    expect(snapshot.craftOptions.map((option) => option.key)).not.toContain(
      "torch",
    );
    expect(snapshot.buildOptions.map((option) => option.key)).toContain("trap");
    expect(room.build("torch")).toBe(false);
  });

  it("builds unlocked room buildings with original dynamic costs", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.builder.level", 4);
    engine.state.set("game.temperature", { value: 3, text: "warm" });
    engine.state.set("stores.wood", 25);

    expect(room.build("trap")).toBe(true);
    expect(engine.state.get("stores.wood")).toBe(15);
    expect(engine.state.get('game.buildings["trap"]')).toBe(1);
    expect(room.snapshot().buildOptions[0]?.cost).toEqual({ wood: 20 });
  });

  it("uses original hut dynamic cost after existing huts", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.builder.level", 4);
    engine.state.set("game.temperature", { value: 3, text: "warm" });
    engine.state.set("stores.wood", 400);
    engine.state.set('game.buildings["hut"]', 2);
    engine.state.set('game.room.buttons["hut"]', true);

    const hut = room
      .snapshot()
      .buildOptions.find((option) => option.key === "hut");
    expect(hut?.cost).toEqual({ wood: 200 });

    expect(room.build("hut")).toBe(true);
    expect(engine.state.get("stores.wood")).toBe(200);
    expect(engine.state.get('game.buildings["hut"]')).toBe(3);
    expect(
      room.snapshot().buildOptions.find((option) => option.key === "hut")?.cost,
    ).toEqual({
      wood: 250,
    });
  });

  it("crafts original workshop items into stores", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.builder.level", 4);
    engine.state.set("game.temperature", { value: 3, text: "warm" });
    engine.state.set('game.buildings["workshop"]', 1);
    engine.state.set("stores.wood", 100);
    engine.state.set("stores.cloth", 1);
    room.refreshAvailability();

    expect(room.snapshot().craftOptions.map((option) => option.key)).toContain(
      "torch",
    );
    expect(room.build("torch")).toBe(true);
    expect(engine.state.get("stores.wood")).toBe(99);
    expect(engine.state.get("stores.cloth")).toBe(0);
    expect(engine.state.get("stores.torch")).toBe(1);
    expect(room.snapshot().notifications.at(-1)?.message).toBe(
      "a torch to keep the dark away",
    );
  });

  it("buys trade goods after trading post once goods are seen", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set('game.buildings["trading post"]', 1);
    engine.state.set("stores.fur", 200);
    engine.state.set("stores.scales", 0);
    room.refreshAvailability();

    expect(room.snapshot().buyOptions.map((option) => option.key)).toContain(
      "scales",
    );
    expect(room.buy("scales")).toBe(true);
    expect(engine.state.get("stores.fur")).toBe(50);
    expect(engine.state.get("stores.scales")).toBe(1);
  });

  it("keeps room item maximums disabled and blocks overbuilding", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.builder.level", 4);
    engine.state.set("game.temperature", { value: 3, text: "warm" });
    engine.state.set("stores.wood", 1000);
    engine.state.set('game.buildings["cart"]', 1);

    const cart = room
      .snapshot()
      .buildOptions.find((option) => option.key === "cart");
    expect(cart).toMatchObject({
      maximum: 1,
      count: 1,
      disabled: true,
    });
    expect(room.build("cart")).toBe(false);
    expect(engine.state.get('game.buildings["cart"]')).toBe(1);
  });

  it("emits original max message when a maxed craftable has one", () => {
    const engine = createGameEngine();
    const room = new RoomRuntime(engine);

    engine.state.set("game.builder.level", 4);
    engine.state.set("game.temperature", { value: 3, text: "warm" });
    engine.state.set("stores.wood", 1000);
    engine.state.set('game.buildings["trap"]', 10);

    expect(room.build("trap")).toBe(false);
    expect(engine.notifications.list().at(-1)?.message).toBe(
      "more traps won't help now",
    );
  });
});
