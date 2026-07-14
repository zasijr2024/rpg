import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  testMatch: "**/production-complete-spine.spec.ts",
  timeout: 240_000,
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
      name: "production-spine-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
  ],
});
