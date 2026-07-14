import { defineConfig, devices } from "@playwright/test";

const productionViewport = { width: 1366, height: 768 };

export default defineConfig({
  testDir: "./src/tests/e2e",
  testMatch: ["**/production-bundle.spec.ts", "**/lazy-route-recovery.spec.ts"],
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:41732",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "npm run build && npm run preview -- --host 127.0.0.1 --port 41732 --strictPort",
      url: "http://127.0.0.1:41732",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 41733 --strictPort",
      url: "http://127.0.0.1:41733",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "production-chromium",
      use: { ...devices["Desktop Chrome"], viewport: productionViewport },
    },
    {
      name: "production-firefox",
      use: { ...devices["Desktop Firefox"], viewport: productionViewport },
    },
    {
      name: "production-webkit",
      use: { ...devices["Desktop Safari"], viewport: productionViewport },
    },
  ],
});
