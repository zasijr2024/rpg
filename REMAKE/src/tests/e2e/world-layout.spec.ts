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
  const baseViewport = page.viewportSize();
  if (!baseViewport) throw new Error("viewport project required");

  for (const zoom of zoomLevels) {
    await page.setViewportSize({
      width: Math.floor((baseViewport.width * 100) / zoom),
      height: Math.floor((baseViewport.height * 100) / zoom),
    });
    await openSeededWorld(page);

    const map = page.locator(".worldMap");
    const controls = page.getByLabel("world controls");
    await expect(map).toBeVisible();
    await expect(controls.getByRole("button", { name: "north" })).toBeVisible();
    await expect(controls.getByRole("button", { name: "south" })).toBeVisible();

    const layout = await page.locator(".worldPanel").evaluate((panel) => {
      const mapElement = panel.querySelector<HTMLElement>(".worldMap");
      const mapStage = panel.querySelector<HTMLElement>(".worldMapStage");
      const player = panel.querySelector<HTMLElement>(".worldMapPlayer");
      const sidebar = panel.querySelector<HTMLElement>(".worldSidebar");
      const status = panel.querySelector<HTMLElement>(".worldStatus");
      const movement = panel.querySelector<HTMLElement>(".worldControls");
      const navigation = document.querySelector<HTMLElement>(
        ".locationNavigation",
      );
      if (
        !mapElement ||
        !mapStage ||
        !player ||
        !sidebar ||
        !status ||
        !movement ||
        !navigation
      )
        throw new Error("World layout incomplete");
      const mapRect = mapElement.getBoundingClientRect();
      const stageRect = mapStage.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const statusRect = status.getBoundingClientRect();
      const movementRect = movement.getBoundingClientRect();
      const navigationRect = navigation.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY,
        documentWidth: document.documentElement.scrollWidth,
        mapWidth: mapRect.width,
        mapHeight: mapRect.height,
        mapRight: mapRect.right,
        stageTop: stageRect.top,
        stageBottom: stageRect.bottom,
        stageHeight: stageRect.height,
        playerLeft: playerRect.left,
        playerRight: playerRect.right,
        playerTop: playerRect.top,
        playerBottom: playerRect.bottom,
        sidebarLeft: sidebarRect.left,
        sidebarWidth: sidebarRect.width,
        statusBottom: statusRect.bottom,
        movementBottom: movementRect.bottom,
        navigationTop: navigationRect.top,
        navigationBottom: navigationRect.bottom,
        fontSize: getComputedStyle(mapElement).fontSize,
        lineHeight: getComputedStyle(mapElement).lineHeight,
      };
    });

    expect(layout.fontSize).toBe("15px");
    expect(layout.lineHeight).toBe("11px");
    expect(layout.mapWidth).toBeGreaterThan(540);
    expect(layout.mapHeight).toBeGreaterThan(680);
    expect(layout.sidebarWidth).toBeGreaterThan(200);
    expect(layout.scrollY).toBe(0);
    expect(layout.navigationTop).toBeGreaterThanOrEqual(0);
    expect(layout.navigationBottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);

    if (layout.viewportWidth <= 760) {
      expect(layout.stageHeight).toBeLessThanOrEqual(240);
      expect(layout.stageTop).toBeGreaterThanOrEqual(layout.navigationBottom);
      expect(layout.stageBottom).toBeLessThanOrEqual(layout.viewportHeight);
      expect(layout.playerLeft).toBeGreaterThanOrEqual(0);
      expect(layout.playerRight).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.playerTop).toBeGreaterThanOrEqual(layout.stageTop);
      expect(layout.playerBottom).toBeLessThanOrEqual(layout.stageBottom);
      expect(layout.statusBottom).toBeLessThanOrEqual(layout.viewportHeight);
      expect(layout.movementBottom).toBeLessThanOrEqual(layout.viewportHeight);
    } else {
      expect(layout.sidebarLeft).toBeGreaterThanOrEqual(layout.mapRight);
    }
  }

  await page.getByRole("button", { name: "east" }).click();
  await expect(page.getByLabel("world status")).toContainText(/distance\s*1/);
});
