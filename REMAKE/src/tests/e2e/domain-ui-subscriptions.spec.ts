import { expect, test } from "@playwright/test";

interface UiDiagnostics {
  renders: Record<string, number>;
}

async function uiDiagnostics(
  page: import("@playwright/test").Page,
): Promise<UiDiagnostics> {
  return page.evaluate(() => {
    const harness = (
      window as Window & {
        __adrTest?: { uiDiagnostics: () => UiDiagnostics };
      }
    ).__adrTest;
    if (!harness) throw new Error("test harness unavailable");
    return harness.uiDiagnostics();
  });
}

test("scenario-seeded: moving in World does not render inactive location domains or the app shell", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1&testSeed=domain-ui-subscriptions");
  await page.getByRole("tab", { name: "world" }).click();
  await expect(
    page.getByRole("region", { name: "world", exact: true }),
  ).toBeVisible();

  const before = await uiDiagnostics(page);
  await page.getByRole("button", { name: "east" }).click();
  await expect
    .poll(async () => (await uiDiagnostics(page)).renders.world)
    .toBeGreaterThan(before.renders.world);
  const after = await uiDiagnostics(page);

  expect(after.renders.navigation).toBe(before.renders.navigation);
  expect(after.renders.room).toBe(before.renders.room);
  expect(after.renders.outside).toBe(before.renders.outside);
  expect(after.renders.path).toBe(before.renders.path);
  expect(after.renders.settings).toBe(before.renders.settings);
});
