import { test, expect } from "@playwright/test";
import { start, connect } from "./helpers.js";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 1024, height: 600 },
  { width: 1024, height: 551 },
  { width: 1024, height: 701 },
  { width: 1024, height: 741 },
  { width: 768, height: 1024 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 800, height: 360 },
]) {
  test(`3D game and controls fit viewport ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const fits = () =>
      page.evaluate(() => ({
        width: document.documentElement.scrollWidth <= innerWidth,
        height: document.documentElement.scrollHeight <= innerHeight,
        controls: [
          ...document.querySelectorAll('[role="dialog"] button'),
        ].every((b) => {
          const r = b.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= innerHeight;
        }),
      }));
    expect(await fits()).toEqual({ width: true, height: true, controls: true });
    await page.getByRole("button", { name: "Qurishni boshlash" }).click();
    await expect(page.locator('canvas[data-renderer="webgl"]')).toBeVisible();
    const toolbar = await page.locator(".toolbar").boundingBox();
    expect(toolbar.y + toolbar.height).toBeLessThanOrEqual(viewport.height);
    for (const button of await page.locator(".toolbar button").all()) {
      const bounds = await button.boundingBox();
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    }
    const scene = await page.locator(".scene-wrap").boundingBox();
    expect(scene.height).toBeGreaterThanOrEqual(viewport.height * 0.42);
    await connect(page, solutions[0]);
    await page.screenshot({
      path: `output/playwright/3d-${viewport.width}x${viewport.height}.png`,
    });
    await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
    await expect(
      page.getByRole("dialog", { name: "Ajoyib ko‘prik!" }),
    ).toBeVisible();
    expect(await fits()).toEqual({ width: true, height: true, controls: true });
    await page
      .getByRole("button", { name: "Bosqichlar", exact: true })
      .last()
      .click();
    await expect(
      page.getByRole("dialog", { name: "Sarguzashtni tanlang" }),
    ).toBeVisible();
    expect(await fits()).toEqual({ width: true, height: true, controls: true });
  });
}

test("camera changes keep node hit targets aligned and gameplay usable", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Old ko‘rinish" }).click();
  await connect(page, solutions[0]);
  await page.getByRole("button", { name: "3D ko‘rinish" }).click();
  await page.getByRole("button", { name: "Kesma A–B" }).click();
  await page
    .getByRole("button", { name: "Tanlangan kesmani o‘chirish" })
    .click();
  await expect(page.getByLabel("Material sarfi")).toContainText("42 / 80");
});

test("normal-motion world animates and a hidden tab pauses the whole simulation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start(page);
  const canvas = page.locator('canvas[data-renderer="webgl"]');
  await expect(canvas).toBeVisible();
  const moving = await canvas.screenshot();
  await page.waitForTimeout(450);
  expect((await canvas.screenshot()).equals(moving)).toBe(false);
  await connect(page, solutions[0]);
  await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
  // Control the browser visibility input; exercise the real game listener and RAF lifecycle.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const paused = page.getByRole("dialog", { name: "Biroz dam olamizmi?" });
  await expect(paused).toBeVisible();
  await expect(paused).toHaveCSS("transform", "none");
  const frozen = await canvas.screenshot();
  await page.waitForTimeout(7500);
  expect((await canvas.screenshot()).equals(frozen)).toBe(true);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(paused).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Ajoyib ko‘prik!" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Davom etish" }).click();
  await expect(
    page.getByRole("dialog", { name: "Ajoyib ko‘prik!" }),
  ).toBeVisible();
});
