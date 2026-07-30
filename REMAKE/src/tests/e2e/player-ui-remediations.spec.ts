import { expect, test, type Page } from "@playwright/test";

interface UiHarness {
  advance: (ms: number) => void;
  getState: (path: string) => unknown;
  refresh: () => void;
  setState: (path: string, value: unknown) => void;
}

type HarnessWindow = Window & { __adrTest?: UiHarness };

async function setStates(
  page: Page,
  entries: Array<[path: string, value: unknown]>,
) {
  await page.evaluate((nextEntries) => {
    const harness = (window as HarnessWindow).__adrTest;
    if (!harness) throw new Error("test harness unavailable");
    for (const [path, value] of nextEntries) harness.setState(path, value);
    harness.refresh();
  }, entries);
}

async function getState(page: Page, path: string) {
  return page.evaluate((statePath) => {
    const harness = (window as HarnessWindow).__adrTest;
    if (!harness) throw new Error("test harness unavailable");
    return harness.getState(statePath);
  }, path);
}

async function advance(page: Page, ms: number) {
  await page.evaluate((duration) => {
    const harness = (window as HarnessWindow).__adrTest;
    if (!harness) throw new Error("test harness unavailable");
    harness.advance(duration);
  }, ms);
}

async function unlockComposedNavigation(page: Page) {
  await setStates(page, [
    ["features.location.outside", true],
    ["features.location.path", true],
    ["features.location.fabricator", true],
    ["features.location.spaceShip", true],
    ["features.location.world", true],
    ["game.world.active", true],
  ]);
}

test("scenario-seeded: every composed location tab remains reachable without colliding with Hyper", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 683, height: 384 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/?testHarness=1&testSeed=domain-ui-subscriptions");
    await unlockComposedNavigation(page);

    const tabs = page.locator('.locationTabs [role="tab"]');
    await expect(tabs).toHaveCount(6);
    const hyper = page.getByRole("button", { name: "hyper." });

    for (let index = 0; index < 6; index += 1) {
      const tab = tabs.nth(index);
      await tab.scrollIntoViewIfNeeded();
      const overlap = await tab.evaluate((tabElement) => {
        const tab = tabElement.getBoundingClientRect();
        const tabList = tabElement.parentElement?.getBoundingClientRect();
        const hyperButton =
          tabElement.parentElement?.parentElement?.querySelector<HTMLElement>(
            ".hyperModeButton",
          );
        if (!tabList || !hyperButton) throw new Error("navigation incomplete");
        const hyperRect = hyperButton.getBoundingClientRect();
        const visibleTab = {
          left: Math.max(tab.left, tabList.left),
          right: Math.min(tab.right, tabList.right),
          top: Math.max(tab.top, tabList.top),
          bottom: Math.min(tab.bottom, tabList.bottom),
        };
        return (
          Math.max(
            0,
            Math.min(visibleTab.right, hyperRect.right) -
              Math.max(visibleTab.left, hyperRect.left),
          ) *
          Math.max(
            0,
            Math.min(visibleTab.bottom, hyperRect.bottom) -
              Math.max(visibleTab.top, hyperRect.top),
          )
        );
      });
      expect(overlap).toBe(0);
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(hyper).toBeVisible();
    }
  }
});

test("fresh-run: cooldown actions retain keyboard focus and reject activation while aria-disabled", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");

  const fireAction = page.locator(".roomPanel .actionRow button");
  await fireAction.focus();
  await page.keyboard.press("Enter");
  await expect(fireAction).toContainText("stoke fire");
  await expect(fireAction).toHaveAttribute("aria-disabled", "true");
  await expect(fireAction).toBeFocused();

  const fireBeforeRejectedActivation = await getState(page, "game.fire.value");
  await page.keyboard.press("Enter");
  expect(await getState(page, "game.fire.value")).toBe(
    fireBeforeRejectedActivation,
  );

  await advance(page, 10_000);
  await expect(fireAction).toHaveAttribute("aria-disabled", "false");
  await expect(fireAction).toBeFocused();

  await setStates(page, [["features.location.outside", true]]);
  await page.getByRole("tab", { name: "A Silent Forest" }).click();
  const gather = page.getByRole("button", { name: "gather wood" });
  await gather.focus();
  await page.keyboard.press("Enter");
  await expect(gather).toHaveAttribute("aria-disabled", "true");
  await expect(gather).toBeFocused();

  const woodDuringCooldown = await getState(page, "stores.wood");
  await page.keyboard.press("Enter");
  expect(await getState(page, "stores.wood")).toBe(woodDuringCooldown);
  await advance(page, 60_000);
  await expect(gather).toHaveAttribute("aria-disabled", "false");
  await expect(gather).toBeFocused();
});

test("fresh-run: Escape closes Hyper confirmation and restores its trigger", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");

  const hyper = page.getByRole("button", { name: "hyper." });
  await hyper.click();
  await expect(page.getByRole("dialog", { name: "Go Hyper?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Go Hyper?" })).toHaveCount(0);
  await expect(hyper).toBeFocused();
});

test("scenario-seeded: starved converters disclose paused nominal output and recover when supplied", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1");

  await setStates(page, [
    ["stores.wood", 20],
    ["stores.meat", 2],
    [
      'income["charcutier"]',
      {
        delay: 10,
        stores: { meat: -5, wood: -5, "cured meat": 1 },
        timeLeft: 10,
      },
    ],
  ]);

  const income = page.getByRole("group", { name: "income" });
  await expect(income).toContainText(
    /charcutier.*paused; nominal.*cured meat \+1\/10s.*waiting for meat/,
  );

  await setStates(page, [["stores.meat", 10]]);
  await expect(income).not.toContainText("paused");
  await expect(income).not.toContainText("waiting for");
  await expect(income).toContainText("cured meat +1/10s");
});

test("fresh-run: legal attribution links are named, licensed, and production-addressable", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/");

  const legal = page.getByRole("group", { name: "legal" });
  const notices = legal.getByRole("link", { name: "notices" });
  const license = legal.getByRole("link", { name: "license" });
  await expect(notices).toHaveAttribute("href", "NOTICE.txt");
  await expect(notices).toHaveAttribute("target", "_blank");
  await expect(license).toHaveAttribute("href", "LICENSE.txt");
  await expect(license).toHaveAttribute("rel", /license/);

  const responses = await page.evaluate(async () => {
    const [notice, licenseText] = await Promise.all([
      fetch("/NOTICE.txt").then((response) => ({
        ok: response.ok,
        text: response.text(),
      })),
      fetch("/LICENSE.txt").then((response) => ({
        ok: response.ok,
        text: response.text(),
      })),
    ]);
    return {
      noticeOk: notice.ok,
      noticeText: await notice.text,
      licenseOk: licenseText.ok,
      licenseText: await licenseText.text,
    };
  });
  expect(responses.noticeOk).toBe(true);
  expect(responses.noticeText).toContain("Michael Townsend");
  expect(responses.licenseOk).toBe(true);
  expect(responses.licenseText).toContain("Mozilla Public License");
});

test("fresh-run: recovery import rejects bad files and restores a valid exported save", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "light fire" }).click();

  let recovery = "";
  await expect
    .poll(async () => {
      recovery = await page.evaluate(
        () => window.localStorage.getItem("adr-remake-save") ?? "",
      );
      return recovery.length;
    })
    .toBeGreaterThan(100);

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
  await page.getByText("recovery", { exact: true }).click();
  const input = page.getByLabel("import recovery file");

  await input.setInputFiles({
    name: "invalid-recovery.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"not":"a save"}'),
  });
  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "current session has not changed",
  );
  await page.getByRole("button", { name: "cancel" }).click();
  await expect(page.getByRole("status")).toContainText("current session kept");
  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
  await input.setInputFiles({
    name: "invalid-recovery.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"not":"a save"}'),
  });
  await page.getByRole("button", { name: "replace current session" }).click();
  await expect(page.getByRole("status")).toContainText(
    "recovery file rejected",
  );
  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();

  await input.setInputFiles({
    name: "a-dark-room-recovery.json",
    mimeType: "application/json",
    buffer: Buffer.from(recovery),
  });
  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "current session has not changed",
  );
  await page.getByRole("button", { name: "replace current session" }).click();
  await expect(page.locator(".recoveryImport [role='status']")).toHaveText(
    "recovery imported and saved",
  );
  await expect(page.getByRole("button", { name: "stoke fire" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "stoke fire" })).toBeVisible();
});
