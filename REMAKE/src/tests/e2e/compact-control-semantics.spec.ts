import { expect, test, type Page } from "@playwright/test";

async function setState(page: Page, path: string, value: unknown) {
  await page.evaluate(
    ({ statePath, stateValue }) =>
      (
        window as unknown as {
          __adrTest?: { setState: (path: string, value: unknown) => void };
        }
      ).__adrTest?.setState(statePath, stateValue),
    { statePath: path, stateValue: value },
  );
}

async function advanceGame(page: Page, milliseconds: number) {
  await page.evaluate(
    (advanceMs) =>
      (
        window as unknown as {
          __adrTest?: { advance: (ms: number) => void };
        }
      ).__adrTest?.advance(advanceMs),
    milliseconds,
  );
}

test("fresh-run: location tabs and notification announcements follow the control contract", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  const roomTab = page.getByRole("tab", { name: /A Dark Room/ });
  await expect(roomTab).toHaveAttribute("aria-controls", "location-panel-room");
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    "location-tab-room",
  );

  await page.getByRole("button", { name: "light fire" }).click();
  const roomNotifications = page.getByRole("log", { name: "notifications" });
  await expect(roomNotifications).toHaveAttribute("aria-live", "polite");
  await expect(roomNotifications).toContainText(
    "the light from the fire spills",
  );
  await advanceGame(page, 130_000);
  const outsideTab = page.getByRole("tab", { name: /A Silent Forest/ });
  await expect(outsideTab).toBeVisible();
  await page.locator("#location-tab-room").press("ArrowRight");
  await expect(outsideTab).toBeFocused();
  await expect(outsideTab).toHaveAttribute("aria-selected", "true");

  const notifications = page.getByRole("log", {
    name: "outside notifications",
  });
  await expect(notifications).toHaveAttribute("aria-live", "polite");
});

test("scenario-seeded: compact controls expose grouped keyboard, details, tabs, and live notifications", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.outside", true);
  await setState(page, "features.location.path", true);
  await setState(page, "stores.compass", 1);
  await setState(page, "stores.torch", 12);

  const roomTab = page.getByRole("tab", { name: /A Dark Room/ });
  const outsideTab = page.getByRole("tab", { name: /A Silent Forest/ });
  await expect(roomTab).toHaveAttribute("aria-selected", "true");
  await expect(roomTab).toHaveAttribute("tabindex", "0");
  await expect(outsideTab).toHaveAttribute("tabindex", "-1");
  await roomTab.press("ArrowRight");
  await expect(outsideTab).toBeFocused();
  await expect(outsideTab).toHaveAttribute("aria-selected", "true");
  const outsideTabId = await outsideTab.getAttribute("id");
  expect(outsideTabId).toBeTruthy();
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    outsideTabId!,
  );

  await page.getByRole("tab", { name: /A Dusty Path/ }).click();
  const torchRow = page.locator(".outfitRow", { hasText: "torch" });
  const details = torchRow.locator(".compactDetail");
  const detailsId = await details.getAttribute("aria-describedby");
  expect(detailsId).toBeTruthy();
  await expect(page.locator(`#${detailsId}`)).toContainText("weight");

  const stepper = page.getByRole("group", { name: "torch supply controls" });
  const buttons = stepper.getByRole("button");
  await expect(buttons).toHaveCount(4);
  await expect(stepper.locator('button[tabindex="0"]')).toHaveCount(1);
  const increase = stepper.getByRole("button", {
    name: "torch +1",
    exact: true,
  });
  const hitArea = await increase.boundingBox();
  expect(hitArea?.width).toBeGreaterThanOrEqual(24);
  expect(hitArea?.height).toBeGreaterThanOrEqual(24);
  await increase.press("ArrowRight");
  await expect(
    stepper.getByRole("button", { name: "torch +10", exact: true }),
  ).toBeFocused();

  await page.getByRole("tab", { name: /A Dark Room/ }).click();
  await page.getByRole("button", { name: "light fire" }).click();
  const notifications = page.getByRole("log", { name: "notifications" });
  await expect(notifications).toHaveAttribute("aria-live", "polite");
  await expect(notifications).toHaveAttribute(
    "aria-relevant",
    "additions text",
  );
  await expect(notifications).toContainText("the light from the fire spills");
});

test("scenario-seeded: a compact control enters the tab order when capacity enables it", async ({
  page,
}) => {
  await page.goto("/?testHarness=1");
  await setState(page, "features.location.path", true);
  await setState(page, "stores.compass", 1);
  await setState(page, "stores.torch", 1);
  await setState(page, 'stores["cured meat"]', 10);
  await setState(page, 'outfit["cured meat"]', 10);

  await page.getByRole("tab", { name: /A Dusty Path/ }).click();
  const torchStepper = page.getByRole("group", {
    name: "torch supply controls",
  });
  await expect(
    torchStepper.getByRole("button", { name: "torch +1", exact: true }),
  ).toBeDisabled();
  await expect(torchStepper.locator('button[tabindex="0"]')).toHaveCount(0);

  await setState(page, 'outfit["cured meat"]', 9);

  await expect(
    torchStepper.getByRole("button", { name: "torch +1", exact: true }),
  ).toBeEnabled();
  await expect(torchStepper.locator('button[tabindex="0"]')).toHaveCount(1);
  await expect(
    torchStepper.getByRole("button", { name: "torch +1", exact: true }),
  ).toHaveAttribute("tabindex", "0");
});
