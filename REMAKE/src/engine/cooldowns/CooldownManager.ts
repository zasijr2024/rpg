import type { ManualClock } from "../clock";

export interface CooldownSnapshot {
  key: string;
  startedAt: number;
  durationMs: number;
  remainingMs: number;
  progress: number;
  active: boolean;
}

interface CooldownEntry {
  key: string;
  startedAt: number;
  durationMs: number;
}

export class CooldownManager {
  private cooldowns = new Map<string, CooldownEntry>();

  constructor(private readonly clock: ManualClock) {}

  start(key: string, durationMs: number): CooldownSnapshot {
    if (durationMs < 0) {
      throw new Error("durationMs must be non-negative");
    }

    const entry: CooldownEntry = {
      key,
      startedAt: this.clock.now(),
      durationMs
    };
    this.cooldowns.set(key, entry);
    return this.snapshot(key);
  }

  isActive(key: string): boolean {
    return this.snapshot(key).active;
  }

  snapshot(key: string): CooldownSnapshot {
    const entry = this.cooldowns.get(key);
    if (!entry) {
      return {
        key,
        startedAt: 0,
        durationMs: 0,
        remainingMs: 0,
        progress: 1,
        active: false
      };
    }

    const elapsed = Math.max(0, this.clock.now() - entry.startedAt);
    const remainingMs = Math.max(0, entry.durationMs - elapsed);
    const progress =
      entry.durationMs === 0 ? 1 : Math.min(1, elapsed / entry.durationMs);
    const active = remainingMs > 0;

    if (!active) {
      this.cooldowns.delete(key);
    }

    return {
      key,
      startedAt: entry.startedAt,
      durationMs: entry.durationMs,
      remainingMs,
      progress,
      active
    };
  }

  snapshots(): CooldownSnapshot[] {
    return [...this.cooldowns.keys()].map((key) => this.snapshot(key));
  }
}

