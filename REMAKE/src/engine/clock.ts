export type TimerId = number;
export type ScheduledTask = () => void;

interface TimerEntry {
  id: TimerId;
  dueAt: number;
  intervalMs: number | null;
  task: ScheduledTask;
}

export class ManualClock {
  private nowMs = 0;
  private nextId = 1;
  private timers = new Map<TimerId, TimerEntry>();

  now(): number {
    return this.nowMs;
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
    intervalMs: number | null
  ): TimerId {
    if (delayMs < 0) {
      throw new Error("delayMs must be non-negative");
    }
    const id = this.nextId++;
    this.timers.set(id, {
      id,
      dueAt: this.nowMs + delayMs,
      intervalMs,
      task
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

