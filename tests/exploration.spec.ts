import { test, expect, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";
let fixture: string;
test.beforeAll(async () => {
  fixture = (
    await build({
      entryPoints: ["tests/fixtures/room.tsx"],
      bundle: true,
      write: false,
      jsx: "automatic",
      define: { "process.env.NODE_ENV": '"production"' },
      alias: { "@": path.resolve("src") },
    })
  ).outputFiles[0].text;
});
async function mount(page: Page, count: number) {
  const css = await readFile("src/app/globals.css", "utf8");
  await page.route("**/__room-fixture*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><style>${css}</style></head><body><div id="root"></div><script type="module">${fixture}</script></body></html>`,
    }),
  );
  await page.goto(`/__room-fixture?count=${count}`);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-position",
    /6\.500/,
  );
}
async function pose(page: Page) {
  return (await page.locator("canvas").getAttribute("data-position"))!
    .split(",")
    .map(Number);
}
test("desktop walking, drag-to-look, collision, focus loss and reset", async ({
  page,
}) => {
  await page.goto("/gallery/elia-monroe");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-position",
    /6\.500/,
  );
  await page.getByRole("button", { name: "Walk through the gallery" }).click();
  await expect(page.locator("canvas")).toBeFocused();
  await page.keyboard.down("w");
  await page.waitForTimeout(650);
  await page.keyboard.up("w");
  expect((await pose(page))[2]).toBeLessThan(5.9);
  const canvas = page.locator("canvas");
  const b = (await canvas.boundingBox())!;
  const before = await canvas.getAttribute("data-rotation");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 160, b.y + b.height / 2 + 55, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(canvas).not.toHaveAttribute("data-rotation", before!);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect.poll(async () => (await pose(page))[2]).toBeCloseTo(6.5, 2);
  await page.getByRole("button", { name: "Walk through the gallery" }).click();
  await page.keyboard.down("s");
  await page.waitForTimeout(800);
  await page.keyboard.up("s");
  expect((await pose(page))[2]).toBeLessThan(7.5);
  await page.keyboard.down("w");
  await page.getByRole("button", { name: "View artwork" }).focus();
  const stopped = await pose(page);
  await page.waitForTimeout(300);
  await page.keyboard.up("w");
  expect(await pose(page)).toEqual(stopped);
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect.poll(async () => (await pose(page))[2]).toBeCloseTo(6.5, 2);
  await page.screenshot({
    path: "/tmp/atelier-refined-room.png",
    fullPage: true,
  });
});
test("mobile press-and-hold, swipe-look and release stop, with reduced motion", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/gallery/elia-monroe");
  await page.getByRole("button", { name: "Walk through the gallery" }).tap();
  const control = page.getByRole("button", { name: "Walk forward" });
  await control.scrollIntoViewIfNeeded();
  const b = (await control.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const x = b.x + b.width / 2,
    y = b.y + b.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await page.waitForTimeout(700);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await pose(page))[2]).toBeLessThan(6);
  await page.waitForTimeout(100);
  const stopped = await pose(page);
  await page.waitForTimeout(200);
  expect(await pose(page)).toEqual(stopped);
  await page.screenshot({
    path: "/tmp/atelier-mobile-walking.png",
    fullPage: true,
  });
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const rect = (await canvas.boundingBox())!;
  const before = await canvas.getAttribute("data-rotation");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: rect.x + 180, y: rect.y + 220 }],
  });
  for (let i = 1; i <= 5; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: rect.x + 180 + i * 15, y: rect.y + 220 }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(canvas).not.toHaveAttribute("data-rotation", before!);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const reset = page.getByRole("button", { name: "Reset view" });
  await reset.scrollIntoViewIfNeeded();
  await reset.tap();
  await expect.poll(async () => (await pose(page))[2]).toBe(6.5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "/tmp/atelier-refined-mobile-room.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Next artwork" }).tap();
  await page.getByRole("button", { name: "Walk through the gallery" }).tap();
  await canvas.scrollIntoViewIfNeeded();
  const artworkView = (await canvas.boundingBox())!;
  await page.touchscreen.tap(
    artworkView.x + artworkView.width / 2,
    artworkView.y + artworkView.height / 2,
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await context.close();
});
for (const count of [1, 8, 9, 16, 17, 24])
  test(`renders and navigates ${count} artwork exhibition`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(page, count);
    await expect(
      page.getByText(`Room 1 of ${Math.ceil(count / 8)}`, { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Previous artwork" }).click();
    await expect(page.getByText(`WORK ${count} OF ${count}`)).toBeVisible();
    await expect(
      page.getByText(
        `Room ${Math.ceil(count / 8)} of ${Math.ceil(count / 8)}`,
        { exact: true },
      ),
    ).toBeVisible();
    await expect.poll(async () => (await pose(page))[2]).toBeLessThan(6.5);
    await page.getByRole("button", { name: "Reset view" }).click();
    await expect.poll(async () => (await pose(page))[2]).toBe(6.5);
    if (count === 24)
      await page.screenshot({
        path: "/tmp/atelier-three-rooms.png",
        fullPage: true,
      });
    expect(errors).toEqual([]);
  });
test("guided camera traverses doors and walking crosses a doorway", async ({
  page,
}) => {
  await mount(page, 17);
  await page.getByRole("button", { name: "Previous artwork" }).click();
  await expect
    .poll(async () => (await pose(page))[2], { timeout: 15000 })
    .toBeCloseTo(-29.36, 1);
  await expect(page.getByText("Room 3 of 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect
    .poll(async () => (await pose(page))[2], { timeout: 15000 })
    .toBeCloseTo(6.5, 1);
  await page.getByRole("button", { name: "Walk through the gallery" }).click();
  await page.keyboard.down("w");
  await expect
    .poll(async () => (await pose(page))[2], { timeout: 15000 })
    .toBeLessThan(-6.8);
  await page.keyboard.up("w");
  await expect(page.getByText("Room 2 of 3", { exact: true })).toBeVisible();
});
