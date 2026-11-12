import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: "./tests/setup.js",
    include: ["src/**/*.test.{js,jsx}"],
    maxWorkers: 2,
    testTimeout: 15000,
  },
});
