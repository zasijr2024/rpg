import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  testIgnore: "**/production-bundle.spec.ts",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:41730",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 41730 --strictPort",
    url: "http://127.0.0.1:41730",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium-1366",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "chromium-1920",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "chromium-2560",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 2560, height: 1440 },
      },
    },
    {
      name: "chromium-3840",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 3840, height: 2160 },
      },
    },
  ],
});
