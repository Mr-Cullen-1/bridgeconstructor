import { test, expect } from "@playwright/test";
import { connect, win, start } from "./helpers.js";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 320, height: 568 },
  { width: 800, height: 360 },
]) {
  test(`twenty-level navigation reaches and remembers the final page at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await start(page);
    await page.getByRole("button", { name: "Bosqichlar", exact: true }).click();
    const dialog = page.getByRole("dialog");
    for (let index = 0; index < 4; index++) {
      await expect(dialog.locator(".level-choice")).toHaveCount(5);
      await expect(dialog.locator(".level-pagination")).toContainText(`${index * 5 + 1}–${index * 5 + 5} / 20`);
      const dialogBox = await dialog.boundingBox();
      for (const button of await dialog.getByRole("button").all()) {
        const box = await button.boundingBox();
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
        expect(box.y + box.height).toBeLessThanOrEqual(dialogBox.y + dialogBox.height);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
      if (index < 3) await page.getByRole("button", { name: "Keyingi sahifa" }).click();
    }
    await page.screenshot({ path: `output/playwright/twenty-levels-${viewport.width}.png` });
    await page.getByRole("button", { name: "20-bosqich: Usta muhandis" }).click();
    await page.getByRole("button", { name: "Qurishni boshlash" }).click();
    await expect(page.getByRole("heading", { name: "Usta muhandis" })).toBeVisible();
    await expect(page.locator(".eyebrow")).toContainText("20 / 20");
    await expect(page.locator(".level-progress > span")).toHaveCount(5);
    await page.getByRole("button", { name: "Bosqichlar", exact: true }).click();
    await expect(page.getByRole("button", { name: "20-bosqich: Usta muhandis" })).toContainText("Hozirgi");
    await expect(page.getByRole("button", { name: "Keyingi sahifa" })).toBeDisabled();
    await page.getByRole("button", { name: "Yopish" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "16-bosqich: Dovon ustasi" })).toBeFocused();
    await page.getByRole("button", { name: "Yopish" }).click();
    await connect(page, solutions[19]);
    await page.screenshot({ path: `output/playwright/twenty-final-${viewport.width}.png` });
    await win(page);
    await expect(page.getByRole("button", { name: "Keyingi bosqich" })).toHaveCount(0);
    await page.getByRole("button", { name: "Bosqichlar", exact: true }).last().click();
    await expect(page.getByRole("button", { name: "20-bosqich: Usta muhandis" }).getByLabel("3 yulduz", { exact: true })).toBeVisible();
  });

  test(`workshop dialogs stay usable through failure, pause and success at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const inspect = async (state) => {
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toBeVisible();
      await page.waitForTimeout(450); // the entrance animation
      for (const button of await dialog.getByRole("button").all()) {
        const box = await button.boundingBox();
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
      await page.screenshot({ path: `output/playwright/workshop-${viewport.width}-${state}.png` });
    };
    await inspect("intro");
    await page.getByRole("button", { name: "Qurishni boshlash" }).click();
    await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
    await expect(page.getByRole("dialog", { name: "Yana bir yechim bor!" })).toBeVisible();
    await inspect("failed");
    await page.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
    await page.getByRole("button", { name: "Tanaffus" }).click();
    await inspect("paused");
    await page.getByRole("button", { name: "Davom etish" }).click();
    await page.getByRole("button", { name: "Bosqichlar", exact: true }).click();
    await inspect("levels");
    await expect(page.getByRole("button", { name: "1-bosqich: Birinchi ko‘prik" })).toContainText("Hozirgi");
    await page.getByRole("button", { name: "Yopish" }).click();
    await connect(page, solutions[0]);
    await win(page);
    await inspect("success");
    await expect(page.getByRole("dialog")).toContainText("Urinish: 2");
    await page.getByRole("button", { name: "Bosqichlar", exact: true }).last().click();
    await expect(page.getByRole("button", { name: "1-bosqich: Birinchi ko‘prik" }).getByLabel("3 yulduz", { exact: true })).toBeVisible();
  });
}
