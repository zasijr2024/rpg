import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __ADR_DEV_SURFACES__: JSON.stringify(true),
  },
  test: {
    include: ["src/tests/engine/progression-distribution.test.ts"],
    environment: "node",
    globals: true,
    disableConsoleIntercept: process.env.PHASE14_STUDY_TRACE === "1",
    testTimeout: 300_000,
  },
});
