import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 41730,
    strictPort: true,
  },
  test: {
    exclude: ["node_modules", "dist", "src/tests/e2e/**"],
    environment: "jsdom",
    globals: true,
  },
});
