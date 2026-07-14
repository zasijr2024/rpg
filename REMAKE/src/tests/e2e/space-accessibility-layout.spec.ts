import { expect, test, type Page } from "@playwright/test";

async function startFlight(page: Page, fleetBeacon = false) {
  await page.goto("/?testHarness=1&testSeed=space-slice");
  if (fleetBeacon) {
    await page.evaluate(() =>
      window.__adrTest?.setState('stores["fleet beacon"]', 1),
    );
  }
  await page.getByRole("tab", { name: "An Old Starship" }).click();
  const ship = page.getByRole("region", { name: "An Old Starship" });
  const reinforce = ship.getByRole("button", { name: /reinforce hull/ });
  for (let alloy = 0; alloy < 6; alloy += 1) await reinforce.click();
  await ship.getByRole("button", { name: "lift off", exact: true }).click();
  await ship
    .getByRole("region", { name: "Ready to Leave?" })
    .getByRole("button", { name: "lift off" })
    .click();
  return page.getByRole("region", { name: "space flight" });
}

test("browser: nonvisual Space feed announces actionable geometry without taking over flight controls", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  const flight = await startFlight(page);
  const toggle = flight.getByRole("button", {
    name: /turn spatial flight feed/,
  });

  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  const feed = flight.getByRole("region", { name: "spatial flight feed" });
  await expect(feed).toContainText(
    /ship position: .* column, .* row; x 350, y 350\./,
  );
  await expect(feed).toContainText(
    /nearest debris: (?:north|south|east|west)(?:-(?:east|west))?, \d+ pixels away\./,
  );
  await expect(feed).toContainText(/collision threat:/);
  await expect(feed.getByRole("status")).toContainText("ship position:");

  // Arrow input bubbles from the focused feed toggle to the flight region.
  // The polite status then publishes the moved coordinate on its next cadence.
  await page.keyboard.down("ArrowLeft");
  await page.evaluate(() => window.__adrTest?.advance(33));
  await page.keyboard.up("ArrowLeft");
  const visiblePosition = feed.locator(":scope > p").first();
  await expect(visiblePosition).not.toContainText("x 350, y 350");
  const movedX = Number(
    (await visiblePosition.textContent())?.match(/x (\d+), y 350/)?.[1],
  );
  expect(movedX).toBeLessThan(350);
  await expect(feed.getByRole("status")).toContainText(`x ${movedX}, y 350`, {
    timeout: 3_000,
  });
  await expect(toggle).toBeFocused();

  await flight.getByRole("button", { name: "east", exact: true }).click();
  await expect(feed).toContainText(/x 350, y 350/);

  // The deterministic first debris is in the east lane. Moving beneath it
  // changes the terse assertive alert immediately; routine geometry remains
  // on the slower polite cadence.
  const east = flight.getByRole("button", { name: "east", exact: true });
  for (let step = 0; step < 70; step += 1) await east.click();
  await expect(feed).toContainText("collision threat: potential");
  await expect(feed.getByRole("alert")).toHaveText("danger, move west.");
  await flight.getByRole("button", { name: "west", exact: true }).click();
  await expect(feed.getByRole("alert")).toBeEmpty();
});

test("browser: fleet and score endings expose a real heading and preserve the ending sequence", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await startFlight(page, true);
  await page.evaluate(() => window.__adrTest?.advance(60_000));

  const fleet = page.getByRole("region", { name: "fleet ending" });
  await expect(fleet).toBeFocused();
  await expect(fleet.getByRole("heading", { name: "homefleet" })).toBeVisible();
  await expect(fleet).toContainText("the capsule is cold");
  await fleet.getByRole("button", { name: "wait" }).click();

  const ending = page.getByRole("region", { name: "ending" });
  await expect(ending).toBeFocused();
  await expect(ending.getByRole("heading", { name: "the end." })).toBeVisible();
  await expect(ending).toContainText(/score for this game:\s*\d+/);
  await expect(ending.getByRole("button", { name: "restart." })).toBeVisible();
});

test("visual: true 4K/1x layout applies the large-desktop reading and hit-area policy", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-3840");
  await page.goto("/?testHarness=1&testSeed=phase3");

  const density = await page.evaluate(() => ({
    active: window.matchMedia(
      "(min-width: 3000px) and (min-height: 1600px) and (resolution: 1dppx)",
    ).matches,
    rootFontSize: Number.parseFloat(
      window.getComputedStyle(document.documentElement).fontSize,
    ),
    devicePixelRatio: window.devicePixelRatio,
  }));
  expect(density).toEqual({
    active: true,
    rootFontSize: 20,
    devicePixelRatio: 1,
  });

  const shell = await page.locator(".appShell").boundingBox();
  expect(shell?.width).toBeGreaterThanOrEqual(1_250);
  expect(shell?.width).toBeLessThanOrEqual(1_300);
  const primaryAction = await page
    .getByRole("button", { name: "light fire" })
    .boundingBox();
  expect(primaryAction?.width).toBeGreaterThanOrEqual(44);
  expect(primaryAction?.height).toBeGreaterThanOrEqual(44);

  await startFlight(page);
  await page.evaluate(() => window.__adrTest?.advance(60_000));
  const ending = page.getByRole("region", { name: "ending" });
  const panelBox = await ending.boundingBox();
  const restartBox = await ending
    .getByRole("button", { name: "restart." })
    .boundingBox();
  const scoreSize = await ending
    .locator("strong")
    .first()
    .evaluate((node) =>
      Number.parseFloat(window.getComputedStyle(node).fontSize),
    );

  expect(panelBox?.height).toBeGreaterThanOrEqual(2_000);
  expect(scoreSize).toBeGreaterThanOrEqual(70);
  expect(restartBox?.width).toBeGreaterThanOrEqual(120);
  expect(restartBox?.height).toBeGreaterThanOrEqual(44);
});
