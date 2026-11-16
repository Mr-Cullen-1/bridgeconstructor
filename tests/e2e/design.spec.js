import { test, expect } from "@playwright/test";
import { connect, win } from "./helpers.js";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 320, height: 568 },
  { width: 800, height: 360 },
]) {
  test(`workshop dialogs stay usable through failure, pause and success at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const inspect = async (state) => {
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS("transform", "none");
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
