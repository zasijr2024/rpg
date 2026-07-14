import { expect, test } from "@playwright/test";

const SAVE_KEY = "adr-remake-dev-save";

async function savedClockNow(page: import("@playwright/test").Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const save = JSON.parse(raw) as {
      payload?: { engine?: { nowMs?: unknown } };
    };
    const nowMs = save.payload?.engine?.nowMs;
    return typeof nowMs === "number" ? nowMs : null;
  }, SAVE_KEY);
}

test("fresh-run: a reload preserves and eventually pays all suspended realtime debt", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-07-10T00:00:00Z") });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "light fire" }).click();
  const beforeSuspension = await savedClockNow(page);
  expect(beforeSuspension).not.toBeNull();

  await page.clock.fastForward(60 * 60 * 1000);
  await expect
    .poll(() => savedClockNow(page))
    .toBe((beforeSuspension ?? 0) + 10 * 1000);

  await page.reload();
  await page.clock.runFor(359 * 250);

  await expect
    .poll(() => savedClockNow(page))
    .toBe((beforeSuspension ?? 0) + 60 * 60 * 1000);
});
