import { test, expect } from "@playwright/test";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";
import { connect, start, win, choose } from "./helpers.js";
for (const [missing, collapsed, x] of [
  ["c", ['["b","c"]', '["c","d"]'], -2],
  ["e", ['["d","e"]'], 6],
]) {
  test(`collapse follows missing ${missing} support instead of the first span`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await start(page);
    await choose(page, 3, "Uchburchak siri");
    await connect(page, solutions[2].filter(([a, b, type]) =>
      !(type === "support" && [a, b].includes(missing)),
    ));
    await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
    const canvas = page.locator(".world-canvas");
    await expect(canvas).toHaveAttribute("data-collapsed-edges", JSON.stringify(collapsed));
    expect(Number(await canvas.getAttribute("data-vehicle-x"))).toBeCloseTo(x);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `output/playwright/collapse-missing-${missing}.png` });
    await expect(page.getByRole("dialog", { name: "Yana bir yechim bor!" })).toBeVisible();
    await page.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
    await expect(canvas).toHaveAttribute("data-collapsed-edges", "[]");
    await connect(page, [[missing, "f", "support"]]);
    await win(page);
  });
}
test("an unsupported bridge collapses all road spans and retry restores them", async ({ page }) => {
  await start(page);
  await choose(page, 3, "Uchburchak siri");
  await connect(page, solutions[2].filter(([, , type]) => type !== "support"));
  await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
  await expect(page.getByRole("dialog", { name: "Yana bir yechim bor!" })).toBeVisible();
  const canvas = page.locator(".world-canvas");
  await expect(canvas).toHaveAttribute("data-collapsed-edges", JSON.stringify([
    '["a","b"]', '["b","c"]', '["c","d"]', '["d","e"]',
  ]));
  await page.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
  await expect(canvas).toHaveAttribute("data-collapsed-edges", "[]");
});
test("level four explains optional nodes and completes within its budget", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Bosqichlar", exact: true }).click();
  await page.getByRole("button", { name: "4-bosqich: Oqilona quruvchi", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("B va D nuqtalaridan foydalanish shart emas");
  await page.getByRole("button", { name: "Qurishni boshlash" }).click();
  await expect(page.getByRole("status")).toContainText("B va D");
  await connect(page, solutions[3]);
  await expect(page.getByLabel("Material sarfi")).toContainText("139 / 150");
  await page.screenshot({ path: "output/playwright/level-four-solution.png" });
  await win(page);
  await expect(page.getByLabel("3 yulduz", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Keyingi bosqich" }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Yangi cho‘qqilar");
});
test("empty, incomplete and unsupported bridges can be tested and repaired", async ({
  page,
}) => {
  await start(page);
  for (const pairs of [[], [["a", "b"]]]) {
    await connect(page, pairs);
    await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
    await expect(
      page.getByRole("dialog", { name: "Yana bir yechim bor!" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Yo‘l uzilgan");
    await page.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
  }
  await expect(page.getByLabel("Material sarfi")).toContainText("14 / 80");
  await connect(page, solutions[0].slice(1));
  await win(page);
  await page.getByRole("button", { name: "Keyingi bosqich" }).click();
  await page.getByRole("button", { name: "Qurishni boshlash" }).click();
  await connect(
    page,
    solutions[1].filter(([, , type]) => type !== "support"),
  );
  await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
  await expect(
    page.getByRole("dialog", { name: "Yana bir yechim bor!" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Tayanch yetishmadi");
  await page.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
  await connect(
    page,
    solutions[1].filter(([, , type]) => type === "support"),
  );
  await win(page);
});
test("normal-motion partial bridge drives to the gap and falls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start(page);
  await connect(page, [["a", "b"]]);
  await page.getByRole("button", { name: "Ko‘prikni sinash" }).click();
  await expect(page.locator(".countdown")).toBeVisible();
  await expect(page.locator(".countdown")).toBeHidden();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "output/playwright/partial-bridge-fall.png" });
  await expect(
    page.getByRole("dialog", { name: "Yana bir yechim bor!" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Yo‘l uzilgan");
});
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
  await expect(page.getByRole("status")).toContainText("B va D");
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
