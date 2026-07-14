import { expect, test } from "@playwright/test";
import budgets from "../../../performance-budgets.json" with { type: "json" };

interface LongTask {
  startTime: number;
  duration: number;
}

declare global {
  interface Window {
    __adrPerformanceLongTasks?: LongTask[];
  }
}

test("browser: production startup, long-task, and idle budgets remain within limits", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    window.__adrPerformanceLongTasks = [];
    if (!PerformanceObserver.supportedEntryTypes.includes("longtask")) return;
    new PerformanceObserver((entries) => {
      window.__adrPerformanceLongTasks?.push(
        ...entries.getEntries().map(({ startTime, duration }) => ({
          startTime,
          duration,
        })),
      );
    }).observe({ type: "longtask", buffered: true });
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
  const startupMs = await page.evaluate(() => performance.now());
  expect(startupMs).toBeLessThanOrEqual(budgets.browser.startupMs);

  const idle = await page.evaluate(async () => {
    const idleStartedAt = performance.now();
    const delays: number[] = [];
    for (let sample = 0; sample < 40; sample += 1) {
      const expectedAt = performance.now() + 25;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
      delays.push(performance.now() - expectedAt);
    }
    const longTasks = window.__adrPerformanceLongTasks ?? [];
    return {
      maxTimerDelayMs: Math.max(...delays),
      longTasks,
      idleLongTasks: longTasks.filter(
        ({ startTime }) => startTime >= idleStartedAt,
      ),
    };
  });

  const maxLongTaskMs = Math.max(
    0,
    ...idle.longTasks.map(({ duration }) => duration),
  );
  const totalLongTaskMs = idle.longTasks.reduce(
    (total, { duration }) => total + duration,
    0,
  );
  const maxIdleLongTaskMs = Math.max(
    0,
    ...idle.idleLongTasks.map(({ duration }) => duration),
  );

  expect(maxLongTaskMs).toBeLessThanOrEqual(budgets.browser.longTaskMaxMs);
  expect(totalLongTaskMs).toBeLessThanOrEqual(budgets.browser.longTaskTotalMs);
  expect(maxIdleLongTaskMs).toBeLessThanOrEqual(
    budgets.browser.idleLongTaskMaxMs,
  );
  expect(idle.maxTimerDelayMs).toBeLessThanOrEqual(
    budgets.browser.idleTimerDelayMs,
  );
  await testInfo.attach("production-performance-budget.json", {
    body: JSON.stringify(
      { startupMs, maxLongTaskMs, totalLongTaskMs, ...idle },
      null,
      2,
    ),
    contentType: "application/json",
  });
});
