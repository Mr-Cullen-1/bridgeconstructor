import { test, expect } from "@playwright/test";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";
import { connect, start, win, choose } from "./helpers.js";
test("all five levels can be completed, replayed and selected", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  for (let i = 0; i < 5; i++) {
    await connect(page, solutions[i]);
    if (i === 0)
      await page.screenshot({
        path: "output/playwright/desktop-bridge.png",
        fullPage: true,
      });
    await win(page);
    await expect(page.getByLabel("3 yulduz", { exact: true })).toBeVisible();
    if (i < 4) {
      await page.getByRole("button", { name: "Keyingi bosqich" }).click();
      await page.getByRole("button", { name: "Qurishni boshlash" }).click();
    }
  }
  await page.getByRole("button", { name: "Yana o‘ynash" }).click();
  await page.getByRole("button", { name: "Qurishni boshlash" }).click();
  await expect(page.getByLabel("Material sarfi")).toContainText("0 / 205");
  await choose(page, 1, "Birinchi ko‘prik");
  await expect(page.getByLabel("Material sarfi")).toContainText("0 / 80");
  expect(errors).toEqual([]);
});
test("valid weak bridge fails, keeps construction and succeeds after repair", async ({
  page,
}) => {
  await start(page);
  await choose(page, 2, "Tayanch kuchi");
  await connect(page, solutions[1].slice(0, -1));
  await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
  await expect(
    page.getByRole("dialog", { name: "Yana bir yechim bor!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
  await expect(page.getByLabel("Material sarfi")).toContainText("103 / 155");
  await page.getByRole("button", { name: "Tayanch", exact: true }).click();
  await page.getByRole("button", { name: "Nuqta E" }).click();
  await page.getByRole("button", { name: "Nuqta F" }).click();
  await win(page);
});
test("keyboard, delete, undo, reset, budget and sound controls work", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Nuqta A" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Nuqta B" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Kesma A–B" }).click();
  await page.keyboard.press("Delete");
  await expect(page.getByLabel("Material sarfi")).toContainText("0 / 80");
  await page.keyboard.press("Control+z");
  await expect(page.getByLabel("Material sarfi")).toContainText("14 / 80");
  await page.getByRole("button", { name: "Qayta qurish" }).click();
  await expect(page.getByLabel("Material sarfi")).toContainText("0 / 80");
  await page.getByRole("button", { name: "Ovozni yoqish" }).click();
  await expect(
    page.getByRole("button", { name: "Ovozni o‘chirish" }),
  ).toBeVisible();
  await choose(page, 4, "Oqilona quruvchi");
  await connect(page, [
    ["a", "b"],
    ["b", "c"],
    ["c", "d"],
    ["d", "e"],
    ["a", "f", "support"],
    ["b", "f", "support"],
    ["c", "f", "support"],
    ["d", "f", "support"],
  ]);
  await expect(page.getByRole("status")).toContainText("Material yetmaydi");
  await expect(page.getByLabel("Material sarfi")).toContainText("129 / 150");
});
test("pause freezes an active test and resumes through success", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start(page);
  await connect(page, solutions[0]);
  await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
  await page.getByRole("button", { name: "Tanaffus" }).click();
  await expect(
    page.getByRole("dialog", { name: "Biroz dam olamizmi?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Davom etish" }).click();
  await expect(
    page.getByRole("dialog", { name: "Ajoyib ko‘prik!" }),
  ).toBeVisible();
});
