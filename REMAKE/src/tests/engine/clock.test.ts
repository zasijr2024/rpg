import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGameEngine,
  GameSession,
  ManualClock,
  RealtimeClockDriver,
} from "../../engine";

afterEach(() => {
  vi.useRealTimers();
});

describe("ManualClock", () => {
  it("runs timeouts only after their delay", () => {
    const clock = new ManualClock();
    let calls = 0;

    clock.setTimeout(() => {
      calls += 1;
    }, 100);

    clock.advanceBy(99);
    expect(calls).toBe(0);
    clock.advanceBy(1);
    expect(calls).toBe(1);
  });

  it("runs intervals repeatedly while advancing time", () => {
    const clock = new ManualClock();
    let calls = 0;

    clock.setInterval(() => {
      calls += 1;
    }, 10);

    clock.advanceBy(35);
    expect(calls).toBe(3);
  });

  it("drives manual time by elapsed real time", () => {
    vi.useFakeTimers();
    const clock = new ManualClock();
    let now = 1000;
    let ticks = 0;
    const driver = new RealtimeClockDriver(clock, {
      intervalMs: 250,
      now: () => now,
    });

    driver.start(() => {
      ticks += 1;
    });

    now = 1750;
    vi.advanceTimersByTime(250);

    expect(clock.now()).toBe(750);
    expect(ticks).toBe(1);

    driver.stop();
  });

  it("applies realtime debug time scaling", () => {
    vi.useFakeTimers();
    const clock = new ManualClock();
    let now = 0;
    let scale = 10;
    const driver = new RealtimeClockDriver(clock, {
      intervalMs: 250,
      now: () => now,
      timeScale: () => scale,
    });

    driver.start(() => undefined);

    now = 250;
    vi.advanceTimersByTime(250);
    expect(clock.now()).toBe(2500);

    scale = 1;
    now = 500;
    vi.advanceTimersByTime(250);
    expect(clock.now()).toBe(2750);

    driver.stop();
  });

  it("drains a suspended realtime jump in bounded batches without losing time", () => {
    vi.useFakeTimers();
    const clock = new ManualClock();
    let now = 0;
    let intervalCalls = 0;
    clock.setInterval(() => {
      intervalCalls += 1;
    }, 1000);
    const driver = new RealtimeClockDriver(clock, {
      intervalMs: 250,
      maxCatchUpMs: 1000,
      now: () => now,
    });

    driver.start(() => undefined);

    now = 10_000;
    vi.advanceTimersByTime(250);

    expect(clock.now()).toBe(1000);
    expect(intervalCalls).toBe(1);

    vi.advanceTimersByTime(9 * 250);

    expect(clock.now()).toBe(10_000);
    expect(intervalCalls).toBe(10);

    driver.stop();
  });

  it("eventually matches continuous timer outcomes after a one-hour suspension", () => {
    vi.useFakeTimers();
    const suspendedClock = new ManualClock();
    const continuousClock = new ManualClock();
    let now = 0;
    let suspendedTimeouts = 0;
    let suspendedIntervals = 0;
    let continuousTimeouts = 0;
    let continuousIntervals = 0;

    suspendedClock.setTimeout(
      () => {
        suspendedTimeouts += 1;
      },
      17 * 60 * 1000 + 123,
    );
    suspendedClock.setInterval(() => {
      suspendedIntervals += 1;
    }, 10_000);
    continuousClock.setTimeout(
      () => {
        continuousTimeouts += 1;
      },
      17 * 60 * 1000 + 123,
    );
    continuousClock.setInterval(() => {
      continuousIntervals += 1;
    }, 10_000);

    continuousClock.advanceBy(60 * 60 * 1000);
    const driver = new RealtimeClockDriver(suspendedClock, {
      intervalMs: 250,
      maxCatchUpMs: 5 * 60 * 1000,
      now: () => now,
    });
    driver.start(() => undefined);

    now = 60 * 60 * 1000;
    vi.advanceTimersByTime(12 * 250);

    expect(suspendedClock.now()).toBe(continuousClock.now());
    expect(suspendedTimeouts).toBe(continuousTimeouts);
    expect(suspendedIntervals).toBe(continuousIntervals);

    driver.stop();
  });

  it("retains undrained debt across stop and restart", () => {
    vi.useFakeTimers();
    const clock = new ManualClock();
    let now = 0;
    const driver = new RealtimeClockDriver(clock, {
      intervalMs: 250,
      maxCatchUpMs: 1000,
      now: () => now,
    });

    driver.start(() => undefined);
    now = 10_000;
    vi.advanceTimersByTime(250);
    expect(clock.now()).toBe(1000);
    driver.stop();

    driver.start(() => undefined);
    vi.advanceTimersByTime(9 * 250);
    expect(clock.now()).toBe(10_000);
    driver.stop();
  });

  it("restores serialized debt with its original time scale", () => {
    vi.useFakeTimers();
    const sourceClock = new ManualClock();
    let now = 0;
    let scale = 10;
    const source = new RealtimeClockDriver(sourceClock, {
      intervalMs: 250,
      maxCatchUpMs: 1000,
      now: () => now,
      timeScale: () => scale,
    });
    source.start(() => undefined);
    now = 2000;
    vi.advanceTimersByTime(250);
    expect(sourceClock.now()).toBe(10_000);
    source.stop();

    const snapshot = source.lifecycleSnapshot();
    const resumedClock = new ManualClock();
    resumedClock.restoreNow(sourceClock.now());
    const resumed = new RealtimeClockDriver(resumedClock, {
      intervalMs: 250,
      maxCatchUpMs: 1000,
      now: () => now,
      timeScale: () => scale,
    });
    resumed.restoreLifecycle(snapshot);
    scale = 1;
    resumed.start(() => undefined);
    vi.advanceTimersByTime(250);

    expect(resumedClock.now()).toBe(20_000);
    resumed.stop();
  });

  it("matches update-gated session outcomes during a bounded catch-up batch", () => {
    vi.useFakeTimers();
    const continuous = builderTransitionSession();
    const suspended = builderTransitionSession();

    for (let step = 0; step < 1200; step += 1) {
      continuous.advanceForTest(250);
    }

    let now = 0;
    const driver = new RealtimeClockDriver(suspended.engine.clock, {
      intervalMs: 250,
      now: () => now,
    });
    driver.start(
      () => undefined,
      () => suspended.update(),
    );
    now = 5 * 60 * 1000;
    vi.advanceTimersByTime(30 * 250);

    expect(suspended.engine.clock.now()).toBe(continuous.engine.clock.now());
    expect(suspended.engine.state.get("game.builder.level")).toBe(
      continuous.engine.state.get("game.builder.level"),
    );
    expect(suspended.engine.state.get("stores.wood")).toBe(
      continuous.engine.state.get("stores.wood"),
    );
    driver.stop();
  });
});

function builderTransitionSession(): GameSession {
  const engine = createGameEngine({ rngSeed: 1 });
  engine.state.set("game.builder.level", 2, true);
  engine.state.set(
    "game.temperature",
    { key: "Warm", value: 3, text: "warm" },
    true,
  );
  engine.state.set(
    "game.fire",
    { key: "Burning", value: 3, text: "burning" },
    true,
  );
  engine.state.set("stores.wood", 0, true);
  return new GameSession(engine);
}
