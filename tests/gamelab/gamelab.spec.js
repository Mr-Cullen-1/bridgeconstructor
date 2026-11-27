import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { connect } from "../e2e/helpers.js";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const calls = (page, type) =>
  page.evaluate((t) => window.__host.calls.filter((c) => c.type === t), type);
async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/gamelab-host.html${query}`);
  await page.getByRole("button", { name: "Qurishni boshlash" }).click();
  // The mock host has no saved progress, so this is a first run: the guided tour opens. These tests
  // are about the host contract, so skip it (the tour itself is covered in tests/e2e/onboarding.spec.js).
  await page.getByRole("button", { name: "O‘tkazib yuborish" }).click();
  return errors;
}
const testButton = (page) => page.getByRole("button", { name: "Ko‘prikni sinash", exact: true });

test("one bridge test is one attempt with the contract payloads", async ({ page }) => {
  const errors = await open(page);
  await connect(page, solutions[0]);
  await testButton(page).click();
  const dialog = page.getByRole("dialog", { name: "Ajoyib ko‘prik!" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".save-line")).toContainText("Natija: Saqlandi");
  await page.waitForTimeout(400); // StrictMode and re-renders must not duplicate callbacks
  const [start] = await calls(page, "start"),
    [end] = await calls(page, "end");
  expect(await calls(page, "start")).toHaveLength(1);
  expect(await calls(page, "end")).toHaveLength(1);
  expect(start.payload).toMatchObject({ modeId: "default", levelId: "bridge-01" });
  expect(start.payload.attemptId).toMatch(uuid);
  expect(Number.isFinite(Date.parse(start.payload.startedAt))).toBe(true);
  expect(end.result).toMatchObject({ attemptId: start.payload.attemptId, outcome: "success" });
  expect(end.result.metrics).toMatchObject({ stars: 3, materialUsed: 56 });
  expect(end.result.metrics.score).toBeGreaterThan(0);
  expect(end.result.metrics.stabilityScore).toBeGreaterThan(0);
  expect(end.result.durationSeconds).toBeGreaterThanOrEqual(0);
  expect(Number.isFinite(Date.parse(end.result.endedAt))).toBe(true);
  expect(end.result).not.toHaveProperty("reason");
  expect(errors).toEqual([]);
});

test("a failed test is reported as failure and Retry starts a new attempt", async ({ page }) => {
  await open(page);
  await testButton(page).click(); // empty bridge: a real, failed attempt
  await expect(page.getByRole("dialog", { name: "Yana bir yechim bor!" })).toBeVisible();
  await page.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
  await connect(page, solutions[0]);
  await testButton(page).click();
  await expect(page.getByRole("dialog", { name: "Ajoyib ko‘prik!" })).toBeVisible();
  const starts = await calls(page, "start"),
    ends = await calls(page, "end");
  expect(starts).toHaveLength(2);
  expect(ends.map((e) => e.result.outcome)).toEqual(["failure", "success"]);
  expect(ends[0].result).toMatchObject({ reason: "road_gap", metrics: { stars: 0, score: 0 } });
  expect(starts[0].payload.attemptId).not.toBe(starts[1].payload.attemptId);
  expect(ends[1].result.attemptId).toBe(starts[1].payload.attemptId);
});

test("exiting during a running test aborts it once, then asks the host to exit", async ({ page }) => {
  test.setTimeout(150000); // slow when the whole suite loads the machine
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  await connect(page, solutions[0]);
  await testButton(page).click();
  await expect(page.locator(".countdown")).toBeVisible();
  await page.getByRole("button", { name: "Tanaffus", exact: true }).click();
  await page.getByRole("button", { name: "O‘yindan chiqish" }).click();
  await expect(page.getByRole("dialog", { name: "Yana ko‘rishguncha!" })).toBeVisible();
  await page.waitForTimeout(500);
  const log = await page.evaluate(() => window.__host.calls.filter((c) => c.type !== "event").map((c) => c.type));
  expect(log).toEqual(["start", "end", "exit"]);
  const [end] = await calls(page, "end");
  expect(end.result).toMatchObject({ outcome: "aborted", reason: "player_exit", metrics: { materialUsed: 56 } });
  expect(end.result.metrics).not.toHaveProperty("stars");
});

test("leaving a level during a test aborts that attempt and the next level opens a new one", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  await connect(page, solutions[0]);
  await testButton(page).click();
  await expect(page.locator(".countdown")).toBeVisible();
  await page.getByRole("button", { name: "Bosqichlar", exact: true }).first().click();
  await page.getByRole("button", { name: "2-bosqich: Tayanch kuchi" }).click();
  const [end] = await calls(page, "end");
  expect(end.result).toMatchObject({ outcome: "aborted", reason: "level_change" });
  expect(await calls(page, "exit")).toHaveLength(0);
});

test("save states: error blocks the end, retry reuses the attempt, offline queues then flushes", async ({ page }) => {
  await open(page, "?save=error");
  await testButton(page).click();
  const dialog = page.getByRole("dialog", { name: "Yana bir yechim bor!" });
  await expect(dialog.locator(".save-line")).toContainText("Boshlanish: Saqlanmadi");
  const blocked = await page.evaluate(() => {
    const [id] = window.__host.store.attempts.keys();
    return window.__host.store.saveState.attempts[id];
  });
  expect(blocked.start).toMatchObject({ status: "error", errorCode: "SERVER" });
  expect(blocked.end).toMatchObject({ status: "error", errorCode: "START_NOT_SAVED" });
  await page.evaluate(() => window.__host.setMode("normal"));
  await dialog.getByRole("button", { name: "Qayta yuborish" }).click();
  await expect(dialog.locator(".save-line")).toContainText("Natija: Saqlandi");
  const [start] = await calls(page, "start"),
    [retry] = await calls(page, "retry");
  expect(await calls(page, "start")).toHaveLength(1);
  expect(retry.attemptId).toBe(start.payload.attemptId);

  await page.evaluate(() => window.__host.setMode("offline"));
  await dialog.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
  await testButton(page).click();
  await expect(page.getByRole("dialog", { name: "Yana bir yechim bor!" }).locator(".save-line")).toContainText(
    "Natija: Yuborish kutilmoqda",
  );
  await page.evaluate(() => window.__host.setMode("normal"));
  await expect(page.getByRole("dialog").locator(".save-line")).toContainText("Natija: Saqlandi");
});

test("an unsaved result stays visible after the next attempt starts and opens a retry list", async ({ page }) => {
  await open(page, "?save=error");
  await testButton(page).click();
  await page.getByRole("button", { name: "Ko‘prikni yaxshilash" }).click();
  const chip = page.locator(".save-chip");
  await expect(chip).toContainText("Boshlanish: Saqlanmadi");
  await chip.click();
  const panel = page.getByRole("dialog", { name: "Saqlash holati" });
  await expect(panel.getByRole("button", { name: "Qayta yuborish" })).toHaveCount(1);
  await page.evaluate(() => window.__host.setMode("normal"));
  await panel.getByRole("button", { name: "Qayta yuborish" }).click();
  await expect(panel).toContainText("Natija: Saqlandi");
  await panel.getByRole("button", { name: "Yopish" }).click();
  await expect(page.getByRole("button", { name: "Ko‘prikni sinash", exact: true })).toBeEnabled();
});

test("language and progress updates keep the running game and show saved stars", async ({ page }) => {
  await open(page);
  await connect(page, [["a", "b"]]);
  await expect(page.getByLabel("Material sarfi")).toContainText("14 / 80");
  await page.evaluate(() => {
    window.__host.setLang("ru");
    window.__host.setProgress({
      completedLevelIds: ["bridge-01"],
      scopes: [{ modeId: "default", levelId: "bridge-01", scoreVersion: 1, attemptsCount: 2, lastResult: null,
        bestResult: { metrics: { stars: 3 } } }],
    });
  });
  await expect(page.getByLabel("Расход материала")).toContainText("14 / 80"); // not reset
  await expect(page.getByRole("button", { name: "Проверить мост", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Уровни", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Уровень 1: Первый мост" }).getByLabel("Звёзд: 3")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть" }).click();
  await page.evaluate(() => window.__host.setLang("en"));
  await expect(page.getByRole("button", { name: "Test the bridge", exact: true })).toBeVisible();
});

test("all three languages render the intro and the game without clipped controls", async ({ page }) => {
  for (const [lang, start] of [["uz", "Qurishni boshlash"], ["ru", "Начать стройку"], ["en", "Start building"]]) {
    await page.goto(`/gamelab-host.html?lang=${lang}`);
    const cta = page.getByRole("button", { name: start });
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(768);
  }
});

test("the game stays inside its container and does not restyle the host page", async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const sentinel = document.getElementById("host-sentinel");
    const app = document.querySelector(".bridge-app").getBoundingClientRect();
    const root = document.getElementById("root").getBoundingClientRect();
    return {
      sentinelBorder: getComputedStyle(sentinel).borderTopWidth,
      bodyOverflow: getComputedStyle(document.body).overflow,
      htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      fills: Math.abs(app.height - root.height) < 1 && Math.abs(app.width - root.width) < 1,
      scrolls: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(result).toEqual({
    sentinelBorder: "2px",
    bodyOverflow: "visible",
    htmlBackground: "rgb(255, 255, 255)",
    bodyBackground: "rgb(255, 255, 255)",
    fills: true,
    scrolls: false,
  });
});

test.describe("exported delivery/gamelab/Game.jsx", () => {
  test.skip(!existsSync("delivery/gamelab/Game.jsx"), "run npm run export:gamelab first");
  test("declares the manifest and completes a level through the same callbacks", async ({ page }) => {
    const errors = await open(page, "?artifact=1");
    const manifest = await page.evaluate(() => window.__host.manifest);
    expect(manifest).toMatchObject({ contractVersion: 1, gameId: "bridge-master", kind: "level" });
    expect(manifest.levelIds).toHaveLength(20);
    await connect(page, solutions[0]);
    await testButton(page).click();
    await expect(page.getByRole("dialog", { name: "Ajoyib ko‘prik!" })).toBeVisible();
    expect(await calls(page, "start")).toHaveLength(1);
    expect((await calls(page, "end"))[0].result.outcome).toBe("success");
    expect(errors).toEqual([]);
  });
});
