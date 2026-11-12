import { expect } from "@playwright/test";
export async function connect(page, pairs, touch = false) {
  let type = "road";
  for (const [a, b, edgeType = "road"] of pairs) {
    if (type !== edgeType) {
      await page
        .getByRole("button", {
          name: edgeType === "road" ? "Yo‘l" : "Tayanch",
          exact: true,
        })
        .click();
      type = edgeType;
    }
    for (const id of [a, b]) {
      const node = page.getByRole("button", {
        name: `Nuqta ${id.toUpperCase()}`,
        exact: true,
      });
      if (touch) await node.tap();
      else await node.click();
    }
  }
}
export async function start(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Qurishni boshlash" }).click();
}
export async function win(page) {
  await page
    .getByRole("button", { name: "Ko‘prikni sinash", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Ajoyib ko‘prik!" }),
  ).toBeVisible();
}
export async function choose(page, index, title) {
  await page
    .getByRole("button", { name: "Bosqichlar", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: `${index}-bosqich: ${title}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Qurishni boshlash" }).click();
}
