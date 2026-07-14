import { defineConfig, devices } from "@playwright/test";

const releaseViewport = { width: 1366, height: 768 };

export default defineConfig({
  testDir: "./src/tests/e2e",
  testMatch: [
    "**/accessibility-release.spec.ts",
    "**/fresh-save-spine.spec.ts",
    "**/release-matrix.spec.ts",
  ],
  timeout: 180_000,
  use: {
    baseURL: "http://127.0.0.1:41730",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 41730 --strictPort",
    url: "http://127.0.0.1:41730",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "release-chromium",
      use: { ...devices["Desktop Chrome"], viewport: releaseViewport },
    },
    {
      name: "release-firefox",
      use: { ...devices["Desktop Firefox"], viewport: releaseViewport },
    },
    {
      name: "release-webkit",
      use: { ...devices["Desktop Safari"], viewport: releaseViewport },
    },
  ],
});
