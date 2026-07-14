import { expect, test, type Page, type TestInfo } from "@playwright/test";

const SAVE_KEY = "adr-remake-dev-save";
const PHYSICAL_DESKTOP_VIEWPORT = { width: 1366, height: 768 };
const realZoomLevels = [100, 125, 150, 200] as const;

function effectiveViewport(zoom: number) {
  return {
    width: Math.round((PHYSICAL_DESKTOP_VIEWPORT.width * 100) / zoom),
    height: Math.round((PHYSICAL_DESKTOP_VIEWPORT.height * 100) / zoom),
  };
}

async function attachViewport(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: false }),
    contentType: "image/png",
  });
}

async function savedClockNow(page: Page) {
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

test("fresh-run: save and suspended background time survive a browser reload", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-07-10T00:00:00Z") });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
  const beforeSuspension = await savedClockNow(page);
  expect(beforeSuspension).not.toBeNull();

  await page.clock.fastForward(60 * 60 * 1000);
  await expect
    .poll(() => savedClockNow(page))
    .toBeGreaterThan((beforeSuspension ?? 0) + 0);
  const afterSuspension = await savedClockNow(page);

  await page.reload();
  const afterReload = await savedClockNow(page);
  expect(afterReload).toBeGreaterThanOrEqual(afterSuspension ?? 0);
  await page.clock.runFor(2_000);
  await expect
    .poll(() => savedClockNow(page))
    .toBeGreaterThan(afterReload ?? 0);
  await attachViewport(page, testInfo, "save-background-full-viewport.png");
});

test("scenario-seeded: combat focus stays owned by the modal", async ({
  page,
}, testInfo) => {
  await page.goto("/?testHarness=1");
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__adrTest)))
    .toBe(true);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("encounter.snarling-beast"),
  );
  const dialog = page.getByRole("dialog", { name: "event" });
  const punch = dialog.getByRole("button", { name: "punch" });

  await expect(dialog).toBeVisible();
  await expect(punch).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(punch).toBeDisabled();
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog).toBeFocused();
  await attachViewport(page, testInfo, "modal-focus-full-viewport.png");
});

test("scenario-seeded: an event blocks pointer and command access to the background", async ({
  page,
}) => {
  await page.goto("/?testHarness=1&testSeed=world-accessibility");
  await page.getByRole("tab", { name: "world" }).click();
  const status = page.locator('[aria-label="world status"]');
  const before = await status.textContent();
  await page.evaluate(() => window.__adrTest?.triggerEventByKey("room.beggar"));
  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toBeVisible();
  await expect(page.locator(".gameSurface")).toHaveAttribute("inert", "");

  const east = page.locator('.worldControls button[aria-label="east"]');
  const eastBounds = await east.boundingBox();
  expect(eastBounds).not.toBeNull();
  await page.mouse.click(
    eastBounds!.x + eastBounds!.width / 2,
    eastBounds!.y + eastBounds!.height / 2,
  );
  await expect(status).toHaveText(before ?? "");

  await east.click({ force: true });
  await page.locator("#location-tab-room").click({ force: true });
  await expect(status).toHaveText(before ?? "");
  await expect(page.locator("#location-tab-world")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(dialog).toBeVisible();
});

test("scenario-seeded: World remains usable across the real desktop zoom matrix", async ({
  page,
}, testInfo) => {
  await page.goto("/?testHarness=1&testSeed=domain-ui-subscriptions");
  await page.getByRole("tab", { name: "world" }).click();
  await expect(
    page.getByRole("region", { name: "world", exact: true }),
  ).toBeVisible();

  for (const zoom of realZoomLevels) {
    await page.setViewportSize(effectiveViewport(zoom));
    const map = page.locator(".worldMap");
    const controls = page.getByLabel("world controls");
    await expect(map).toBeVisible();
    await expect(controls.getByRole("button", { name: "north" })).toBeVisible();
    await expect(controls.getByRole("button", { name: "south" })).toBeVisible();

    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(overflow.document).toBeLessThanOrEqual(overflow.viewport);
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
    await attachViewport(page, testInfo, `world-${zoom}-full-viewport.png`);
  }

  await page.getByRole("button", { name: "east" }).click();
  await expect(page.getByLabel("world status")).toContainText(/distance\s*1/);
});

test("scenario-seeded: a long event remains contained and operable across the real desktop zoom matrix", async ({
  page,
}, testInfo) => {
  await page.goto("/?testHarness=1");
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__adrTest)))
    .toBe(true);
  await page.evaluate(() =>
    window.__adrTest?.triggerEventByKey("executioner.antechamber"),
  );
  const dialog = page.getByRole("dialog", { name: "event" });

  for (const zoom of realZoomLevels) {
    await page.setViewportSize(effectiveViewport(zoom));
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      effectiveViewport(zoom).width,
    );
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
      effectiveViewport(zoom).height,
    );

    const leave = dialog.getByRole("button", { name: "leave" });
    await leave.scrollIntoViewIfNeeded();
    await expect(leave).toBeVisible();
    await leave.focus();
    await expect(leave).toBeFocused();

    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(overflow.document).toBeLessThanOrEqual(overflow.viewport);
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
    await attachViewport(page, testInfo, `event-${zoom}-full-viewport.png`);
  }
});
