import { expect, test, type Page } from "@playwright/test";

async function carryMeatAndEmbark(page: Page, amount: number) {
  await page.getByRole("tab", { name: "A Dusty Path" }).click();
  for (let item = 0; item < amount; item += 1) {
    await page
      .getByRole("button", { name: "cured meat +1", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "embark" }).click();
}

test("scenario-seeded: World discovery opens an operable original Ship slice", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1&testSeed=ship-slice");

  await carryMeatAndEmbark(page, 2);
  await page.getByRole("button", { name: "north" }).click();

  const event = page.getByRole("dialog", { name: "event" });
  await expect(event).toContainText("A Huge Borehole");
  await expect(page.getByLabel("loot")).toContainText("alien alloy");
  await page.getByRole("button", { name: "take everything" }).click();
  await page.getByRole("button", { name: "leave" }).click();
  await page.getByRole("button", { name: "south" }).click();

  await expect(page.getByRole("tab", { name: "An Old Starship" })).toHaveCount(
    0,
  );

  await carryMeatAndEmbark(page, 2);
  await page.getByRole("button", { name: "east" }).click();
  await expect(event).toContainText("A Crashed Ship");
  await page.getByRole("button", { name: "salvage" }).click();
  await page.getByRole("button", { name: "west" }).click();

  const shipTab = page.getByRole("tab", { name: "An Old Starship" });
  await expect(shipTab).toBeVisible();
  await shipTab.click();

  const ship = page.getByRole("region", { name: "An Old Starship" });
  await expect(ship.getByLabel("ship status")).toContainText("hull:0");
  await expect(ship.getByLabel("ship status")).toContainText("engine:1");
  await expect(page.getByLabel("ship notifications")).toContainText(
    "somewhere above the debris cloud, the wanderer fleet hovers",
  );

  const reinforce = page.getByRole("button", { name: /reinforce hull/ });
  await expect(reinforce).toBeEnabled();
  await reinforce.click();

  await expect(ship.getByLabel("ship status")).toContainText("hull:1");
  await expect(page.getByLabel("stores")).not.toContainText("alien alloy");
  await expect(
    page.getByRole("button", { name: /upgrade engine/ }),
  ).toBeDisabled();
});
