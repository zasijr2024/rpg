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

export interface RealtimeClockDebtSegment {
  elapsedMs: number;
  timeScale: number;
}

export interface RealtimeClockDriverLifecycleSnapshot {
  debt: RealtimeClockDebtSegment[];
}

export class RealtimeClockDriver {
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastNow = 0;
  private catchUpDebt: RealtimeClockDebtSegment[] = [];
  private readonly intervalMs: number;
  private readonly maxCatchUpMs: number;
  private readonly now: () => number;
  private readonly timeScale: () => number;

  constructor(
    private readonly clock: ManualClock,
    options: RealtimeClockDriverOptions = {},
  ) {
    this.intervalMs = options.intervalMs ?? 250;
    this.maxCatchUpMs = options.maxCatchUpMs ?? 10 * 1000;
    if (!Number.isFinite(this.intervalMs) || this.intervalMs <= 0) {
      throw new Error("intervalMs must be a positive finite number");
    }
    if (!Number.isFinite(this.maxCatchUpMs) || this.maxCatchUpMs <= 0) {
      throw new Error("maxCatchUpMs must be a positive finite number");
    }
    this.timeScale = options.timeScale ?? (() => 1);
    this.now =
      options.now ??
      (() =>
        typeof performance !== "undefined" &&
        typeof performance.now === "function"
          ? performance.now()
          : Date.now());
  }

  start(onTick: () => void, onSimulationStep: () => void = () => {}): void {
    if (this.timer !== null) return;
    this.lastNow = this.now();
    this.timer = setInterval(() => {
      this.captureElapsed();
      this.drainCatchUpBatch(onSimulationStep);
      onTick();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer === null) return;
    this.captureElapsed();
    clearInterval(this.timer);
    this.timer = null;
  }

  lifecycleSnapshot(): RealtimeClockDriverLifecycleSnapshot {
    if (this.timer !== null) this.captureElapsed();
    return {
      debt: this.catchUpDebt.map((segment) => ({ ...segment })),
    };
  }

  restoreLifecycle(snapshot: RealtimeClockDriverLifecycleSnapshot): void {
    this.catchUpDebt = snapshot.debt.map((segment) => ({ ...segment }));
    if (this.timer !== null) this.lastNow = this.now();
  }

  private captureElapsed(): void {
    const currentNow = this.now();
    const elapsedMs = Math.max(0, currentNow - this.lastNow);
    this.lastNow = currentNow;
    if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
    const rawScale = this.timeScale();
    const timeScale = Number.isFinite(rawScale) ? Math.max(0, rawScale) : 0;
    const previous = this.catchUpDebt.at(-1);
    if (previous?.timeScale === timeScale) {
      previous.elapsedMs += elapsedMs;
      return;
    }
    this.catchUpDebt.push({ elapsedMs, timeScale });
  }

  private drainCatchUpBatch(onSimulationStep: () => void): void {
    let remainingBatchMs = this.maxCatchUpMs;
    while (remainingBatchMs > 0 && this.catchUpDebt.length > 0) {
      const segment = this.catchUpDebt[0];
      const stepMs = Math.min(
        segment.elapsedMs,
        remainingBatchMs,
        this.intervalMs,
      );
      this.clock.advanceBy(stepMs * segment.timeScale);
      onSimulationStep();
      segment.elapsedMs -= stepMs;
      remainingBatchMs -= stepMs;
      if (segment.elapsedMs <= Number.EPSILON) this.catchUpDebt.shift();
    }
  }
}
