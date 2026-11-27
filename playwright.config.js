import { defineConfig } from "@playwright/test";
const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:5173";
// Existing specs test the game itself, so they start as a returning player who already saw the
// guided lessons (the standalone app keeps that list in localStorage). onboarding.spec.js starts fresh.
export const returningPlayer = {
  cookies: [],
  origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: "bridge-master:onboarding:v2", value: JSON.stringify(["*"]) }] }],
};
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 12000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    storageState: returningPlayer,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "npm.cmd run dev -- --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    {
      name: "desktop-chrome",
      testMatch: ["gameplay.spec.js", "viewport.spec.js", "design.spec.js", "onboarding.spec.js"],
      use: {
        browserName: "chromium",
        channel: "chrome",
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "mobile-chrome",
      testMatch: ["mobile.spec.js", "onboarding.spec.js"],
      use: {
        browserName: "chromium",
        channel: "chrome",
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "gamelab",
      testDir: "./tests/gamelab",
      testMatch: "gamelab.spec.js",
      use: {
        browserName: "chromium",
        channel: "chrome",
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "desktop-edge",
      testMatch: "smoke.spec.js",
      use: {
        browserName: "chromium",
        channel: "msedge",
        viewport: { width: 1366, height: 768 },
      },
    },
  ],
});
