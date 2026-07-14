import { expect, test, type Page } from "@playwright/test";

const zoomLevels = [100, 125, 150, 200] as const;

async function openSeededWorld(page: Page) {
  await page.goto("/?testHarness=1&testSeed=domain-ui-subscriptions");
  await page.getByRole("tab", { name: "world" }).click();
  await expect(
    page.getByRole("region", { name: "world", exact: true }),
  ).toBeVisible();
}

test("scenario-seeded: dedicated World layout keeps the map and controls stable through desktop zoom", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1366" &&
      testInfo.project.name !== "chromium-1920",
  );
  await openSeededWorld(page);

  for (const zoom of zoomLevels) {
    await page.evaluate((value) => {
      document.body.style.zoom = `${value}%`;
    }, zoom);

    const map = page.locator(".worldMap");
    const controls = page.getByLabel("world controls");
    await expect(map).toBeVisible();
    await expect(controls.getByRole("button", { name: "north" })).toBeVisible();
    await expect(controls.getByRole("button", { name: "south" })).toBeVisible();

    const layout = await page.locator(".worldPanel").evaluate((panel) => {
      const mapElement = panel.querySelector<HTMLElement>(".worldMap");
      const sidebar = panel.querySelector<HTMLElement>(".worldSidebar");
      if (!mapElement || !sidebar) throw new Error("World layout incomplete");
      const mapRect = mapElement.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      return {
        mapWidth: mapRect.width,
        mapHeight: mapRect.height,
        mapRight: mapRect.right,
        sidebarLeft: sidebarRect.left,
        sidebarWidth: sidebarRect.width,
        fontSize: getComputedStyle(mapElement).fontSize,
        lineHeight: getComputedStyle(mapElement).lineHeight,
      };
    });

    expect(layout.fontSize).toBe("15px");
    expect(layout.lineHeight).toBe("11px");
    expect(layout.mapWidth).toBeGreaterThan(540);
    expect(layout.mapHeight).toBeGreaterThan(680);
    expect(layout.sidebarWidth).toBeGreaterThan(200);
    expect(layout.sidebarLeft).toBeGreaterThanOrEqual(layout.mapRight);
  }

  await page.getByRole("button", { name: "east" }).click();
  await expect(page.getByLabel("world status")).toContainText(/distance\s*1/);
});
