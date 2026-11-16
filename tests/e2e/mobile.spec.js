import { test, expect } from "@playwright/test";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";
import { connect, start, win } from "./helpers.js";
for (const viewport of [{ width: 360, height: 800 }, { width: 800, height: 360 }]) {
  test(`all twenty levels complete by touch at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    // Twenty touch-built bridges and screenshots take nearly three minutes on this Windows host.
    test.setTimeout(300000);
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Qurishni boshlash" }).tap();
    for (let levelIndex = 0; levelIndex < solutions.length; levelIndex++) {
      for (const button of await page.locator(".toolbar button").all()) {
        const bounds = await button.boundingBox();
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      }
      for (const node of await page.getByRole("button", { name: /^Nuqta / }).all()) {
        const target = await node.locator("circle").first().boundingBox();
        expect(target.width).toBeGreaterThanOrEqual(43.9);
        expect(target.height).toBeGreaterThanOrEqual(43.9);
      }
      expect(await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      )).toBe(true);
      await connect(page, solutions[levelIndex], true);
      await page.screenshot({
        path: viewport.width === 360 && levelIndex === 0
          ? "output/playwright/mobile-bridge.png"
          : `output/playwright/mobile-${viewport.width}-level-${levelIndex + 1}.png`,
        fullPage: true,
      });
      await win(page, true);
      await expect(page.getByLabel("3 yulduz", { exact: true })).toBeVisible();
      if (levelIndex < solutions.length - 1) {
        await page.getByRole("button", { name: "Keyingi bosqich" }).tap();
        await page.getByRole("button", { name: "Qurishni boshlash" }).tap();
      }
    }
    expect(errors).toEqual([]);
  });
}
test("landscape remains usable and can exit then restart", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 360 });
  await start(page);
  await connect(page, solutions[0], true);
  await win(page);
  await page.getByRole("button", { name: "Yana o‘ynash" }).click();
  await page.getByRole("button", { name: "Qurishni boshlash" }).click();
  await page.getByRole("button", { name: "Tanaffus" }).click();
  await page.getByRole("button", { name: "O‘yindan chiqish" }).click();
  await expect(
    page.getByRole("dialog", { name: "Yana ko‘rishguncha!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "O‘yinga qaytish" }).click();
  await expect(
    page.getByRole("button", { name: "Qurishni boshlash" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
