import { test, expect } from "@playwright/test";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";
import { connect, start, win } from "./helpers.js";
test("360px touch game has usable targets, no overflow and completes", async ({
  page,
}) => {
  await start(page);
  for (const node of await page
    .getByRole("button", { name: /^Nuqta / })
    .all()) {
    const target = await node.locator("circle").first().boundingBox();
    expect(target.width).toBeGreaterThanOrEqual(43.9);
    expect(target.height).toBeGreaterThanOrEqual(43.9);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await connect(page, solutions[0], true);
  await page.screenshot({
    path: "output/playwright/mobile-bridge.png",
    fullPage: true,
  });
  await win(page);
});
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
