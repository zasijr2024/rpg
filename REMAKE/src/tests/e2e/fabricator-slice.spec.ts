import { expect, test } from "@playwright/test";

test("scenario-seeded: redeemed blueprint opens playable Fabricator progression", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1&testSeed=fabricator-slice");

  await expect(
    page.getByRole("tab", { name: "A Whirring Fabricator" }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "world" }).click();
  await page.getByRole("button", { name: "return" }).click();

  const fabricatorTab = page.getByRole("tab", {
    name: "A Whirring Fabricator",
  });
  await expect(fabricatorTab).toBeVisible();
  await fabricatorTab.click();

  const fabricator = page.getByRole("region", {
    name: "A Whirring Fabricator",
  });
  await expect(fabricator.getByLabel("blueprints")).toContainText("hypo");
  await expect(
    page.getByRole("button", { name: /energy blade/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /kinetic armour/ }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /hypo \(x5\)/ })).toBeEnabled();
  await expect(page.getByLabel("fabricator notifications")).toContainText(
    "the familiar hum of wanderer machinery",
  );

  await page.getByRole("button", { name: /hypo \(x5\)/ }).click();

  await expect(fabricator.getByLabel("stores")).toContainText("hypo5");
  await expect(fabricator.getByLabel("stores")).not.toContainText(
    "alien alloy",
  );
  await expect(
    page.getByRole("button", { name: /hypo \(x5\)/ }),
  ).toBeDisabled();
  await expect(page.getByLabel("fabricator notifications")).toContainText(
    "a handful of hypos. life in a vial.",
  );
});
