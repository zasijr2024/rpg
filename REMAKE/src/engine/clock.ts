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
  private runningTimers = new Set<TimerId>();
  private cancelledRunningTimers = new Set<TimerId>();

  now(): number {
    return this.nowMs;
  }

  restoreNow(nowMs: number): void {
    if (!Number.isFinite(nowMs) || nowMs < 0) {
      throw new Error("nowMs must be a non-negative finite number");
    }
    this.nowMs = nowMs;
    this.clearAll();
  }

  setTimeout(task: ScheduledTask, delayMs: number): TimerId {
    return this.schedule(task, delayMs, null);
  }

  setInterval(task: ScheduledTask, intervalMs: number): TimerId {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      throw new Error("intervalMs must be a positive finite number");
    }
    return this.schedule(task, intervalMs, intervalMs);
  }

  clearTimer(id: TimerId): void {
    this.timers.delete(id);
    if (this.runningTimers.has(id)) this.cancelledRunningTimers.add(id);
  }

  clearAll(): void {
    this.timers.clear();
    for (const id of this.runningTimers) this.cancelledRunningTimers.add(id);
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
    if (!Number.isFinite(ms) || ms < 0) {
      throw new Error("Clock advance must be a non-negative finite number");
    }

    const target = this.nowMs + ms;
    if (!Number.isFinite(target)) {
      throw new Error("Clock target must be finite");
    }
    while (true) {
      const next = this.nextDueTimer(target);
      if (!next) break;
      this.nowMs = next.dueAt;
      this.timers.delete(next.id);
      this.runningTimers.add(next.id);
      try {
        next.task();
      } finally {
        this.runningTimers.delete(next.id);
        const wasCancelled = this.cancelledRunningTimers.delete(next.id);
        if (next.intervalMs !== null && !wasCancelled) {
          next.dueAt = this.nowMs + next.intervalMs;
          this.timers.set(next.id, next);
        }
      }
    }
    this.nowMs = target;
  }

  private schedule(
    task: ScheduledTask,
    delayMs: number,
    intervalMs: number | null,
  ): TimerId {
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      throw new Error("delayMs must be a non-negative finite number");
    }
    const dueAt = this.nowMs + delayMs;
    if (!Number.isFinite(dueAt))
      throw new Error("Timer due time must be finite");
    const id = this.nextId++;
    this.timers.set(id, {
      id,
      dueAt,
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
  private catchUpActive = false;
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

  start(
    onTick: () => void,
    onSimulationStep: () => void = () => {},
    onCatchUpDrained: () => void = () => {},
    onCatchUpCheckpoint: () => void = () => {},
  ): void {
    if (this.timer !== null) return;
    this.lastNow = this.now();
    this.timer = setInterval(() => {
      this.captureElapsed();
      const catchUpStarted =
        !this.catchUpActive && this.totalCatchUpDebtMs() >= this.maxCatchUpMs;
      if (this.totalCatchUpDebtMs() >= this.maxCatchUpMs) {
        this.catchUpActive = true;
      }
      this.drainCatchUpBatch(onSimulationStep);
      const catchUpDrained =
        this.catchUpActive && this.catchUpDebt.length === 0;
      onTick();
      if (catchUpStarted && !catchUpDrained) onCatchUpCheckpoint();
      if (catchUpDrained) {
        this.catchUpActive = false;
        onCatchUpDrained();
      }
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
    this.catchUpActive = this.catchUpDebt.length > 0;
    if (this.timer !== null) this.lastNow = this.now();
  }

  catchingUp(): boolean {
    return this.catchUpActive;
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

  private totalCatchUpDebtMs(): number {
    return this.catchUpDebt.reduce(
      (total, segment) => total + segment.elapsedMs,
      0,
    );
  }
}
