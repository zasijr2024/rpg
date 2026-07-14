import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/engine/progression-distribution.test.ts"],
    environment: "node",
    globals: true,
    disableConsoleIntercept: process.env.PHASE14_STUDY_TRACE === "1",
    testTimeout: 300_000,
  },
});
