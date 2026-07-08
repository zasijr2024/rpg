import { afterEach, describe, expect, it, vi } from "vitest";
import { ManualClock, RealtimeClockDriver } from "../../engine";

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

  it("caps single realtime catch-up advances to avoid unbounded timer drains", () => {
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
  });
});
