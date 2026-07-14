import { expect, test } from "@playwright/test";

test("scenario-seeded: World exposes a compact accessible model without hidden map tiles", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1&testSeed=world-accessibility");
  await page.getByRole("tab", { name: "world" }).click();

  const information = page.getByRole("region", { name: "world information" });
  await expect(information).toContainText("x 30, y 30; the village");
  await expect(information).toContainText("10 of 10 health, 10 of 10 water");
  await expect(information).toContainText("0 moves here");
  await expect(information).toContainText("north, west, east, south");

  const landmarks = information.getByRole("region", {
    name: "visible nearby landmarks",
  });
  await expect(landmarks.getByRole("list")).toContainText(
    "A Damp Cave: 1 moves east",
  );
  await expect(information).not.toContainText("A Crashed Starship");

  await expect(page.locator(".worldMapStage")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  const axTree = await page.locator(".worldPanel").ariaSnapshot();
  expect(axTree).toContain("current world state");
  expect(axTree).not.toContain("world map");
  expect(axTree).not.toContain("A Crashed Starship");
});
