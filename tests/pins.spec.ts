import { test, expect } from "@playwright/test";
test("brass pins anchor their tips, have generous targets, and reject a returning drag", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const paris = page.getByRole("button", {
    name: /Elia Monroe and Sloane Ellis/,
  });
  await expect(paris).toBeVisible();
  const geometry = await paris.evaluate((button) => {
    const b = button.getBoundingClientRect(),
      s = button.querySelector("svg")!.getBoundingClientRect(),
      anchor = button.parentElement!.getBoundingClientRect();
    return {
      w: b.width,
      h: b.height,
      shapeH: s.height,
      tipX: s.x + 13 - anchor.x,
      tipY: s.y + 27 - anchor.y,
    };
  });
  expect(geometry.w).toBeGreaterThanOrEqual(44);
  expect(geometry.h).toBeGreaterThanOrEqual(44);
  expect(geometry.shapeH).toBe(28);
  expect(Math.abs(geometry.tipX)).toBeLessThan(1);
  expect(Math.abs(geometry.tipY)).toBeLessThan(1);
  const b = (await paris.boundingBox())!,
    x = b.x + b.width / 2,
    y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 30, y, { steps: 3 });
  await page.mouse.move(x, y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator(".pin-selection")).toHaveCount(0);
  await paris.focus();
  await expect(
    page.locator(".pin-tooltip").filter({ hasText: "Paris" }),
  ).toBeVisible();
  await paris.press("Enter");
  await expect(page.locator(".pin-selection a")).toHaveCount(2);
  await expect(
    page.locator(".pin-tooltip").filter({ hasText: "Paris" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".pin-selection")).toHaveCount(0);
});
test("mobile pin labels stay within the viewport near the globe edge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const pin = page.getByRole("button", { name: "Cleo Winters — Mexico City" });
  await expect(pin).toBeVisible();
  await pin.focus();
  const tooltip = page
    .locator(".pin-tooltip")
    .filter({ hasText: "Mexico City" });
  await expect(tooltip).toBeVisible();
  const b = (await tooltip.boundingBox())!;
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(390);
});
