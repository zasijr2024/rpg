import { expect, test } from "@playwright/test";

test("fresh-run: atomic autosave resumes without manual save controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
  await expect(
    page.getByRole("status", { name: "background time policy" }),
  ).toContainText("closing the page earns nothing");
  await expect(page.getByRole("log", { name: "notifications" })).toContainText(
    "time catches up only while this tab remains open; closing the page earns nothing",
  );
  await expect(page.getByRole("tab", { name: "settings" })).toHaveCount(0);
});

test("browser: corrupt primary autosave recovers the previous generation", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
  await page.evaluate(() => {
    const key = "adr-remake-save";
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error("expected autosave");
    const save = JSON.parse(raw) as {
      payload: { location: string };
    };
    save.payload.location = "outside";
    window.localStorage.setItem(key, JSON.stringify(save));
  });

  await page.reload();

  await expect(page.getByRole("button", { name: "light fire" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toHaveCount(
    0,
  );
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("adr-remake-save:quarantine");
        return raw ? (JSON.parse(raw) as { reason: string }).reason : null;
      }),
    )
    .toBe("checksum-mismatch");
});

test("browser: quota failure stays visible, exports, retries, and survives reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => {
    const originalSetItem = Storage.prototype.setItem;
    const controlledWindow = window as Window & { __adrBlockWrites?: boolean };
    controlledWindow.__adrBlockWrites = true;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (controlledWindow.__adrBlockWrites) {
        throw new DOMException("quota unavailable", "QuotaExceededError");
      }
      originalSetItem.call(this, key, value);
    };
  });

  await page.getByRole("button", { name: "light fire" }).click();
  const warning = page.getByRole("alert", { name: "saving status" });
  await expect(warning).toContainText("quota-exceeded");
  await expect(warning).toContainText("held in memory only");

  const downloadPromise = page.waitForEvent("download");
  await warning.getByRole("button", { name: "export recovery" }).click();
  await expect((await downloadPromise).suggestedFilename()).toBe(
    "a-dark-room-recovery.json",
  );

  await page.evaluate(() => {
    (window as Window & { __adrBlockWrites?: boolean }).__adrBlockWrites =
      false;
  });
  await warning.getByRole("button", { name: "retry saving" }).click();
  await expect(warning).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
  await expect(page.getByRole("alert", { name: "saving status" })).toHaveCount(
    0,
  );
});

test("browser: private-mode storage restrictions keep the game playable with a durable warning", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("private storage blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("private storage blocked", "SecurityError");
    };
  });
  await page.goto("/");

  const warning = page.getByRole("alert", { name: "saving status" });
  await expect(warning).toContainText("storage-blocked");
  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.getByRole("tab", { name: "A Firelit Room" })).toBeVisible();
  await expect(warning).toBeVisible();
});
