import { ManualClock } from "../../engine";

export interface CooldownPressureResult {
  ticks: number;
  notifications: number;
  distinctPercentValues: number;
}

export function simulateCooldownPressure(
  durationMs: number,
  frameMs: number,
  notify: (percent: number) => void,
): CooldownPressureResult {
  const clock = new ManualClock();
  const seen = new Set<number>();
  let ticks = 0;
  let notifications = 0;
  let lastPercent = -1;

  clock.setInterval(() => {
    ticks += 1;
    const percent = Math.min(100, Math.floor((clock.now() / durationMs) * 100));
    seen.add(percent);
    if (percent !== lastPercent) {
      notifications += 1;
      lastPercent = percent;
      notify(percent);
    }
  }, frameMs);

  clock.advanceBy(durationMs);

  return {
    ticks,
    notifications,
    distinctPercentValues: seen.size,
  };
}
