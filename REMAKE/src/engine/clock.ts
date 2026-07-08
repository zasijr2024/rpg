export type TimerId = number;
export type ScheduledTask = () => void;

interface TimerEntry {
  id: TimerId;
  dueAt: number;
  intervalMs: number | null;
  task: ScheduledTask;
}

export interface TimerSnapshot {
  id: TimerId;
  dueAt: number;
  intervalMs: number | null;
}

export class ManualClock {
  private nowMs = 0;
  private nextId = 1;
  private timers = new Map<TimerId, TimerEntry>();

  now(): number {
    return this.nowMs;
  }

  restoreNow(nowMs: number): void {
    if (nowMs < 0) {
      throw new Error("nowMs must be non-negative");
    }
    this.nowMs = nowMs;
    this.timers.clear();
  }

  setTimeout(task: ScheduledTask, delayMs: number): TimerId {
    return this.schedule(task, delayMs, null);
  }

  setInterval(task: ScheduledTask, intervalMs: number): TimerId {
    if (intervalMs <= 0) {
      throw new Error("intervalMs must be greater than 0");
    }
    return this.schedule(task, intervalMs, intervalMs);
  }

  clearTimer(id: TimerId): void {
    this.timers.delete(id);
  }

  clearAll(): void {
    this.timers.clear();
  }

  timerSnapshot(id: TimerId | null): TimerSnapshot | null {
    if (id === null) return null;
    const timer = this.timers.get(id);
    if (!timer) return null;
    return {
      id: timer.id,
      dueAt: timer.dueAt,
      intervalMs: timer.intervalMs,
    };
  }

  advanceBy(ms: number): void {
    if (ms < 0) {
      throw new Error("Cannot move clock backwards");
    }

    const target = this.nowMs + ms;
    while (true) {
      const next = this.nextDueTimer(target);
      if (!next) break;
      this.nowMs = next.dueAt;
      this.timers.delete(next.id);
      next.task();
      if (next.intervalMs !== null) {
        next.dueAt = this.nowMs + next.intervalMs;
        this.timers.set(next.id, next);
      }
    }
    this.nowMs = target;
  }

  private schedule(
    task: ScheduledTask,
    delayMs: number,
    intervalMs: number | null,
  ): TimerId {
    if (delayMs < 0) {
      throw new Error("delayMs must be non-negative");
    }
    const id = this.nextId++;
    this.timers.set(id, {
      id,
      dueAt: this.nowMs + delayMs,
      intervalMs,
      task,
    });
    return id;
  }

  private nextDueTimer(target: number): TimerEntry | null {
    let next: TimerEntry | null = null;
    for (const timer of this.timers.values()) {
      if (timer.dueAt <= target && (!next || timer.dueAt < next.dueAt)) {
        next = timer;
      }
    }
    return next;
  }
}

export interface RealtimeClockDriverOptions {
  intervalMs?: number;
  maxCatchUpMs?: number;
  now?: () => number;
  timeScale?: () => number;
}

export class RealtimeClockDriver {
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastNow = 0;
  private readonly intervalMs: number;
  private readonly maxCatchUpMs: number;
  private readonly now: () => number;
  private readonly timeScale: () => number;

  constructor(
    private readonly clock: ManualClock,
    options: RealtimeClockDriverOptions = {},
  ) {
    this.intervalMs = options.intervalMs ?? 250;
    this.maxCatchUpMs = options.maxCatchUpMs ?? 5 * 60 * 1000;
    this.timeScale = options.timeScale ?? (() => 1);
    this.now =
      options.now ??
      (() =>
        typeof performance !== "undefined" &&
        typeof performance.now === "function"
          ? performance.now()
          : Date.now());
  }

  start(onTick: () => void): void {
    if (this.timer !== null) return;
    this.lastNow = this.now();
    this.timer = setInterval(() => {
      const currentNow = this.now();
      const elapsed = Math.min(
        Math.max(0, currentNow - this.lastNow),
        this.maxCatchUpMs,
      );
      this.lastNow = currentNow;
      if (elapsed > 0) {
        this.clock.advanceBy(elapsed * Math.max(0, this.timeScale()));
      }
      onTick();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}
