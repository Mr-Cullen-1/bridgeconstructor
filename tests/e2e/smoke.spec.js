import { test, expect } from "@playwright/test";
import { solutions } from "../../src/games/bridge-master/__tests__/fixtures/solutions.js";
import { start, connect, win } from "./helpers.js";
test("Edge completes tutorial without browser errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await connect(page, solutions[0]);
  await win(page);
  expect(errors).toEqual([]);
});
