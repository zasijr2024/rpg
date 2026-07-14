import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  testMatch: "**/performance-budgets.spec.ts",
  timeout: 30_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:41731",
    viewport: { width: 1366, height: 768 },
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 41731 --strictPort",
    url: "http://127.0.0.1:41731",
    reuseExistingServer: !process.env.CI,
  },
});
