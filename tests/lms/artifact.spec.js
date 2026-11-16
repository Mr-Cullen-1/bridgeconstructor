import { test, expect } from "@playwright/test";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";
import { connect, win, choose } from "../e2e/helpers.js";

test("the single uploaded JSX runs all twenty levels offline inside an opaque sandbox", async ({ page }) => {
  test.setTimeout(180000);
  const errors = [], requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(new URL(r.url()).pathname));
  await page.goto("/");
  const game = page.frameLocator("iframe");
  await game.getByRole("button", { name: "Qurishni boshlash" }).click();
  const frame = page.frames().find((f) => f.url().endsWith("/game/"));
  expect(await frame.evaluate(() => {
    try { return !!parent.document; } catch { return false; }
  })).toBe(false);
  await expect(game.locator(".world-canvas")).toHaveAttribute("data-renderer", "webgl");
  for (let i = 0; i < 20; i++) {
    await connect(game, solutions[i]);
    await win(game);
    await expect.poll(() => page.evaluate(() => window.__lmsMessages.filter((m) => m.type === "completed").length)).toBe(i + 1);
    if (i < 19) {
      await game.getByRole("button", { name: "Keyingi bosqich" }).click();
      await game.getByRole("button", { name: "Qurishni boshlash" }).click();
    }
  }
  const messages = await page.evaluate(() => window.__lmsMessages);
  expect(messages.filter((m) => m.type === "completed").map((m) => [m.payload.levelId, m.payload.stars])).toEqual(
    Array.from({ length: 20 }, (_, i) => [`bridge-${String(i + 1).padStart(2, "0")}`, 3]),
  );
  expect(messages.find((m) => m.type === "ready").payload).toMatchObject({
    contractVersion: 1,
    version: "1.1.0",
    levelIds: Array.from({ length: 20 }, (_, i) => `bridge-${String(i + 1).padStart(2, "0")}`),
  });
  await expect(game.getByRole("button", { name: "Keyingi bosqich" })).toHaveCount(0);
  expect(messages.filter((m) => m.type === "error")).toEqual([]);
  expect([...new Set(requests)].sort()).toEqual(["/", "/game/", "/game/runner.js"]);
  expect(errors).toEqual([]);
});

test("the uploaded JSX retains late-span collapse, failure events, repair and exit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const game = page.frameLocator("iframe");
  await game.getByRole("button", { name: "Qurishni boshlash" }).click();
  await choose(game, 3, "Uchburchak siri");
  await connect(game, solutions[2].filter(([a, b, type]) => !(type === "support" && [a, b].includes("e"))));
  await game.getByRole("button", { name: "Ko‘prikni sinash" }).click();
  const canvas = game.locator(".world-canvas");
  await expect(canvas).toHaveAttribute("data-collapsed-edges", JSON.stringify(['["d","e"]']));
  expect(Number(await canvas.getAttribute("data-vehicle-x"))).toBeCloseTo(6);
  await page.waitForTimeout(200);
  await page.screenshot({ path: "output/playwright/lms-late-collapse.png" });
  await expect(game.getByRole("dialog", { name: "Yana bir yechim bor!" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__lmsMessages.some((m) => m.payload?.name === "bridge_test_failed"))).toBe(true);
  expect(await page.evaluate(() => window.__lmsMessages.filter((m) => m.type === "completed").length)).toBe(0);
  await game.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
  await connect(game, [["e", "f", "support"]]);
  await win(game);
  await game.getByRole("button", { name: "Yana o‘ynash" }).click();
  await game.getByRole("button", { name: "Qurishni boshlash" }).click();
  await game.getByRole("button", { name: "Tanaffus" }).click();
  await game.getByRole("button", { name: "O‘yindan chiqish" }).click();
  await expect.poll(() => page.evaluate(() => window.__lmsMessages.filter((m) => m.type === "exited").length)).toBe(1);
});

test("the uploaded JSX fits a mobile LMS viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const game = page.frameLocator("iframe");
  await game.getByRole("button", { name: "Qurishni boshlash" }).click();
  await connect(game, solutions[0]);
  const frame = page.frames().find((f) => f.url().endsWith("/game/"));
  expect(await frame.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth > innerWidth,
    vertical: document.documentElement.scrollHeight > innerHeight,
  }))).toEqual({ horizontal: false, vertical: false });
  await page.screenshot({ path: "output/playwright/lms-mobile.png" });
  await win(game);
});
