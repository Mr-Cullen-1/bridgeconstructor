import { test, expect } from "@playwright/test";

// These tests start as a brand-new player: no saved list of seen lessons (the other specs set it).
test.use({ storageState: { cookies: [], origins: [] } });

const SHOTS = "output/playwright";
const KEY = "bridge-master:onboarding:v2";
const tour = (page) => page.locator(".tour");
const card = (page) => page.locator(".tour-card");
const hole = (page) => page.locator(".tour-hole");
const press = (locator, touch) => (touch ? locator.tap() : locator.click());
const next = (page, touch) => press(page.getByRole("button", { name: "Tushunarli", exact: true }), touch);
const node = (page, id) => page.getByRole("button", { name: `Nuqta ${id}`, exact: true });
const tool = (page, name) => page.getByRole("button", { name, exact: true });
const start = (page, touch) => press(page.getByRole("button", { name: "Qurishni boshlash" }), touch);
const box = async (locator) => (await locator.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
const link = async (page, pairs, touch) => {
  for (const [a, b] of pairs) {
    await press(node(page, a), touch);
    await press(node(page, b), touch);
  }
};
// A returning player who finished lesson one lands on the level they pick, with only that lesson new.
async function openLevel(page, touch, n, title, seen = ["bridge-01"]) {
  await page.addInitScript(([key, list]) => localStorage.setItem(key, JSON.stringify(list)), [KEY, seen]);
  await page.goto("/");
  await start(page, touch);
  await press(page.getByRole("button", { name: "Bosqichlar", exact: true }).first(), touch);
  await press(page.getByRole("button", { name: `${n}-bosqich: ${title}`, exact: true }), touch);
  await start(page, touch);
}

// The spotlight must wrap every element the step talks about, and the card must sit fully on screen
// without covering the spotlight, so the player always sees what is being explained.
async function expectFramed(page, targets, label) {
  await expect(card(page)).toHaveCSS("opacity", "1");
  const h = await box(hole(page));
  for (const target of targets) {
    const t = await box(page.locator(`[data-tour="${target}"]`));
    expect(t.width, `${label}: ${target} is on screen`).toBeGreaterThan(0);
    expect(h.x, `${label}: hole left of ${target}`).toBeLessThanOrEqual(t.x + 1);
    expect(h.y, `${label}: hole top of ${target}`).toBeLessThanOrEqual(t.y + 1);
    expect(h.x + h.width, `${label}: hole right of ${target}`).toBeGreaterThanOrEqual(t.x + t.width - 1);
    expect(h.y + h.height, `${label}: hole bottom of ${target}`).toBeGreaterThanOrEqual(t.y + t.height - 1);
  }
  const c = await box(card(page));
  const view = page.viewportSize();
  expect(c.x, `${label}: card inside left`).toBeGreaterThanOrEqual(0);
  expect(c.y, `${label}: card inside top`).toBeGreaterThanOrEqual(0);
  expect(c.x + c.width, `${label}: card inside right`).toBeLessThanOrEqual(view.width);
  expect(c.y + c.height, `${label}: card inside bottom`).toBeLessThanOrEqual(view.height);
  const apart = c.x + c.width <= h.x || c.x >= h.x + h.width || c.y + c.height <= h.y || c.y >= h.y + h.height;
  expect(apart, `${label}: card does not cover the spotlight`).toBe(true);
}
// Building steps show what to build: dashed example lines glued to the real nodes, and a hand.
async function expectExample(page, lines, label) {
  await expect(page.locator(".tour-ghost-line")).toHaveCount(lines.length);
  await expect(page.locator(".tour-hand")).toHaveCount(1);
  const hand = await box(page.locator(".tour-hand"));
  expect(hand.width, `${label}: the hand is drawn`).toBeGreaterThan(0);
  for (const [i, [a, b]] of lines.entries()) {
    const line = page.locator(".tour-ghost-line").nth(i);
    const [x1, y1, x2, y2] = await Promise.all(["x1", "y1", "x2", "y2"].map((name) => line.getAttribute(name).then(Number)));
    const root = await box(page.locator(".bridge-app"));
    for (const [id, x, y] of [[a, x1, y1], [b, x2, y2]]) {
      const dot = await box(node(page, id.toUpperCase()).locator(".node-core"));
      expect(Math.abs(root.x + x - (dot.x + dot.width / 2)), `${label}: ${a}-${b} starts/ends on ${id}`).toBeLessThanOrEqual(2);
      expect(Math.abs(root.y + y - (dot.y + dot.height / 2)), `${label}: ${a}-${b} y on ${id}`).toBeLessThanOrEqual(2);
    }
  }
}

test("level one is taught in full, by doing, and the lesson never returns", async ({ page, isMobile }) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.screenshot({ path: `${SHOTS}/onboarding-0-intro.png` });
  await start(page, isMobile);
  await expect(tour(page)).toBeVisible();

  const infoSteps = [
    ["Ko‘prik quramiz!", ["node-a", "node-e"]],
    ["Bu — bosqich", ["level"]],
    ["Material — sizning hamyoningiz", ["budget"]],
    ["Ikkita asbob", ["materials"]],
  ];
  let n = 1;
  for (const [heading, targets] of infoSteps) {
    await expect(card(page)).toContainText(heading);
    await expect(card(page)).toContainText(`${n} / 10`);
    await expectFramed(page, targets, heading);
    await expect(page.locator(".tour-hand")).toHaveCount(0);
    await page.screenshot({ path: `${SHOTS}/onboarding-${n}-${targets[0]}.png` });
    await next(page, isMobile);
    n++;
  }

  // Action step 1: only the highlighted point can be used; the rest of the game is blocked.
  await expect(card(page)).toContainText("1-qadam: A nuqta");
  await expect(card(page).locator(".tour-do")).toHaveText("A nuqtani bosing");
  await expectFramed(page, ["node-a"], "pick first");
  await expectExample(page, [], "pick first");
  await expect(page.getByRole("button", { name: "Tushunarli", exact: true })).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/onboarding-5-pick-a.png` });
  const c = await box(node(page, "C"));
  await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
  await expect(node(page, "C")).toHaveAttribute("aria-pressed", "false");
  await expect(node(page, "A")).toHaveAttribute("aria-pressed", "false");
  await press(node(page, "A"), isMobile);

  await expect(card(page)).toContainText("2-qadam: B nuqta");
  await expect(card(page).locator(".tour-do")).toHaveText("B nuqtani bosing");
  await expectFramed(page, ["node-b"], "pick second");
  await expectExample(page, [["a", "b"]], "pick second");
  await page.screenshot({ path: `${SHOTS}/onboarding-6-pick-b.png` });
  await press(node(page, "B"), isMobile);

  await expect(card(page)).toContainText("Adashdingizmi?");
  await expectFramed(page, ["edit"], "edit");
  await expect(page.getByLabel("Material sarfi")).toContainText("14 / 80");
  await page.screenshot({ path: `${SHOTS}/onboarding-7-edit.png` });
  await next(page, isMobile);

  await expect(card(page)).toContainText("Yo‘lni oxirigacha");
  await expect(card(page).locator(".tour-do")).toHaveText("B–C, C–D va D–E ni ulang");
  await expectFramed(page, ["node-a", "node-b", "node-c", "node-d", "node-e"], "road");
  await expectExample(page, [["b", "c"], ["c", "d"], ["d", "e"]], "road");
  await page.screenshot({ path: `${SHOTS}/onboarding-8-road.png` });
  await link(page, [["B", "C"], ["C", "D"], ["D", "E"]], isMobile);

  await expect(card(page)).toContainText("Ovoz va tanaffus");
  await expectFramed(page, ["controls"], "controls");
  await page.screenshot({ path: `${SHOTS}/onboarding-10-controls.png` });
  await next(page, isMobile);

  await expect(card(page)).toContainText("Sinab ko‘ramizmi?");
  await expect(card(page).locator(".tour-do")).toHaveText("Yashil «Ko‘prikni sinash» tugmasini bosing");
  await expectFramed(page, ["test"], "test");
  await page.screenshot({ path: `${SHOTS}/onboarding-11-test.png` });
  await press(tool(page, "Ko‘prikni sinash"), isMobile);
  await expect(tour(page)).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Ajoyib ko‘prik!" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Qurishni boshlash" })).toBeVisible();
  await start(page, isMobile);
  await expect(tour(page)).toHaveCount(0);
});

test("level two teaches the F support: road, Support tool, three ropes, triangles", async ({ page, isMobile }) => {
  test.setTimeout(120000);
  await openLevel(page, isMobile, 2, "Tayanch kuchi");
  await expect(card(page)).toContainText("Yangi: tayanch nuqta!");
  await expectFramed(page, ["node-f"], "new");
  await page.screenshot({ path: `${SHOTS}/onboarding-L2-1-new.png` });
  await next(page, isMobile);

  await expect(card(page).locator(".tour-do")).toHaveText("A–B va B–E ni ulang");
  await expectFramed(page, ["node-a", "node-b", "node-e"], "L2 road");
  await expectExample(page, [["a", "b"], ["b", "e"]], "L2 road");
  await page.screenshot({ path: `${SHOTS}/onboarding-L2-2-road.png` });
  await link(page, [["A", "B"], ["B", "E"]], isMobile);

  await expect(card(page).locator(".tour-do")).toHaveText("Ko‘k «Tayanch» tugmasini bosing");
  await expectFramed(page, ["tool-support"], "L2 tool");
  await page.screenshot({ path: `${SHOTS}/onboarding-L2-3-tool.png` });
  await press(tool(page, "Tayanch"), isMobile);

  await expect(card(page).locator(".tour-do")).toHaveText("F–A, F–B va F–E ni ulang");
  await expectFramed(page, ["node-a", "node-b", "node-e", "node-f"], "L2 ropes");
  await expectExample(page, [["a", "f"], ["b", "f"], ["e", "f"]], "L2 ropes");
  await page.screenshot({ path: `${SHOTS}/onboarding-L2-4-ropes.png` });
  await link(page, [["F", "A"], ["F", "B"], ["F", "E"]], isMobile);

  await expect(card(page)).toContainText("Uchburchaklar!");
  await expect(page.locator(".tour-shape")).toHaveCount(2);
  await page.screenshot({ path: `${SHOTS}/onboarding-L2-5-triangles.png` });
  await next(page, isMobile);
  await expect(card(page).locator(".tour-do")).toHaveText("Yashil «Ko‘prikni sinash» tugmasini bosing");
  await press(tool(page, "Ko‘prikni sinash"), isMobile);
  await expect(tour(page)).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Ajoyib ko‘prik!" })).toBeVisible();
});

test("level three teaches the triangle secret", async ({ page, isMobile }) => {
  test.setTimeout(120000);
  await openLevel(page, isMobile, 3, "Uchburchak siri", ["bridge-01", "bridge-02"]);
  await expect(card(page)).toContainText("Uchburchak siri");
  await expectFramed(page, ["node-a", "node-e", "node-f"], "L3 idea");
  await page.screenshot({ path: `${SHOTS}/onboarding-L3-1-idea.png` });
  await next(page, isMobile);
  await expectExample(page, [["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"]], "L3 road");
  await link(page, [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]], isMobile);
  await expect(card(page).locator(".tour-do")).toHaveText("Ko‘k «Tayanch» tugmasini bosing");
  await press(tool(page, "Tayanch"), isMobile);
  await expect(card(page).locator(".tour-do")).toHaveText("F ni A, B, C, D va E bilan ulang");
  await expectFramed(page, ["node-a", "node-e", "node-f"], "L3 fan");
  await expectExample(page, ["a", "b", "c", "d", "e"].map((id) => [id, "f"]), "L3 fan");
  await page.screenshot({ path: `${SHOTS}/onboarding-L3-4-fan.png` });
  await link(page, ["A", "B", "C", "D", "E"].map((id) => ["F", id]), isMobile);
  await expect(card(page)).toContainText("To‘rtta uchburchak!");
  await expect(page.locator(".tour-shape")).toHaveCount(4);
  await page.screenshot({ path: `${SHOTS}/onboarding-L3-5-triangles.png` });
  await next(page, isMobile);
  await expect(card(page)).toContainText("Tejamkor bo‘ling");
  await expectFramed(page, ["budget"], "L3 star");
  await next(page, isMobile);
  await press(tool(page, "Ko‘prikni sinash"), isMobile);
  await expect(page.getByRole("dialog", { name: "Ajoyib ko‘prik!" })).toBeVisible();
});

test("a later level that changes something gets a short NEW note on its first step", async ({ page, isMobile }) => {
  await openLevel(page, isMobile, 4, "Oqilona quruvchi", ["bridge-01", "bridge-02", "bridge-03"]);
  await expect(card(page)).toContainText("YANGI!");
  await expect(card(page)).toContainText("Material kam!");
  await expectFramed(page, ["node-b", "node-d"], "L4 skip");
  await page.screenshot({ path: `${SHOTS}/onboarding-L4-1-skip.png` });
  await next(page, isMobile);
  await expectExample(page, [["a", "c"], ["c", "e"]], "L4 road");
  await link(page, [["A", "C"], ["C", "E"]], isMobile);
  await expect(tour(page)).toHaveCount(0);
});

test("skipping hands the game over at once, silences every lesson and is remembered", async ({ page, isMobile }) => {
  await page.goto("/");
  await start(page, isMobile);
  await next(page, isMobile);
  await press(page.getByRole("button", { name: "O‘tkazib yuborish" }), isMobile);
  await expect(tour(page)).toHaveCount(0);
  await link(page, [["A", "B"]], isMobile);
  await expect(page.getByLabel("Material sarfi")).toContainText("14 / 80");
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toContain("*");
  await page.reload();
  await start(page, isMobile);
  await expect(tour(page)).toHaveCount(0);
});

test("?tour shows the lessons again for a player who already saw them", async ({ page, isMobile }) => {
  await page.addInitScript((key) => localStorage.setItem(key, JSON.stringify(["*"])), KEY);
  await page.goto("/?tour");
  await start(page, isMobile);
  await expect(tour(page)).toBeVisible();
});

test("the tour stays on screen with the page unscrolled", async ({ page, isMobile }) => {
  await page.goto("/");
  await start(page, isMobile);
  await expect(card(page)).toHaveCSS("opacity", "1");
  const overflow = await page.evaluate(() => ({
    x: document.documentElement.scrollWidth - innerWidth,
    y: document.documentElement.scrollHeight - innerHeight,
  }));
  expect(overflow.x).toBeLessThanOrEqual(0);
  expect(overflow.y).toBeLessThanOrEqual(0);
});
