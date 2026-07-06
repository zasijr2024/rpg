import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:41730",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 41730 --strictPort",
    url: "http://127.0.0.1:41730",
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      name: "chromium-4k",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 3840, height: 2160 }
      }
    }
  ]
});
