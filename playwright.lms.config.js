import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/lms", testMatch: "*.spec.js", workers: 1,
  timeout: 90000, expect: { timeout: 12000 },
  outputDir: "test-results/lms",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4174", browserName: "chromium", channel: "chrome",
    viewport: { width: 1366, height: 768 }, reducedMotion: "reduce",
    screenshot: "only-on-failure", trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-lms-preview.mjs",
    url: "http://127.0.0.1:4174", reuseExistingServer: false, timeout: 60000,
  },
});
