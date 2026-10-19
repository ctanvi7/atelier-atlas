import { test, expect } from "@playwright/test";
import { artists, latLngToPosition } from "../src/lib/data";
test("geographic coordinates and all artwork aspect ratios match local images", async ({
  request,
}) => {
  expect(latLngToPosition(0, 0)).toEqual([2, 0, -0]);
  expect(latLngToPosition(90, 0)[1]).toBe(2);
  for (const a of artists) {
    expect(a.works).toHaveLength(6);
    for (const w of a.works) {
      const res = await request.get(w.image);
      expect(res.ok()).toBeTruthy();
      if (w.image.endsWith(".png")) {
        const png = await res.body();
        expect(png.readUInt32BE(16)).toBe(w.width);
        expect(png.readUInt32BE(20)).toBe(w.height);
      } else {
        const svg = await res.text();
        expect(svg).toContain(`width="${w.width}" height="${w.height}"`);
      }
    }
  }
});
test("globe to artist, artwork dialog, 2D mode and back", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Pause rotation" }).click();
  const paris = page.getByRole("button", {
    name: /Elia Monroe and Sloane Ellis/,
  });
  await expect(paris).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Nina Calloway — Kyoto/ }),
  ).toHaveCount(0);
  await paris.focus();
  await expect(
    page.locator(".pin-tooltip").filter({ hasText: "Elia Monroe" }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/atelier-landing.png", fullPage: true });
  await paris.press("Enter");
  await expect(page.locator(".pin-selection a")).toHaveCount(2);
  await page.locator(".pin-selection a").first().click();
  await expect(page).toHaveURL(/gallery\/elia-monroe/);
  await expect(
    page.getByRole("heading", { name: "Elia Monroe", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "/tmp/atelier-room.png", fullPage: true });
  const initial = await page.locator("canvas").screenshot();
  await page.getByRole("button", { name: "Next artwork" }).click();
  await expect(page.getByText("WORK 1 OF 6")).toBeVisible();
  await expect
    .poll(async () =>
      Number(
        (await page.locator("canvas").getAttribute("data-position"))?.split(
          ",",
        )[2],
      ),
    )
    .toBeCloseTo(-1.36, 1);
  expect(
    Buffer.compare(initial, await page.locator("canvas").screenshot()),
  ).not.toBe(0);
  // The selected frame is centred in the viewport: test the actual 3D hit target.
  const bounds = (await page.locator("canvas").boundingBox())!;
  await page
    .locator("canvas")
    .click({ position: { x: bounds.width / 2, y: bounds.height / 2 } });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "View artwork" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Where the morning rests" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "View artwork" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Previous artwork" }).click();
  await expect(page.getByText("WORK 6 OF 6")).toBeVisible();
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(page.getByText("THE ENTRANCE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View in 2D" }).click();
  await expect(page.locator(".flat-work")).toHaveCount(6);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Back to globe" }).click();
  await expect(page).toHaveURL("/");
  expect(errors).toEqual([]);
});
test("globe rotates on drag and idle, with no drag selection", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".map-pin").first()).toBeVisible();
  const canvas = page.locator("canvas");
  const first = await canvas.screenshot();
  await page.waitForTimeout(900);
  expect(Buffer.compare(first, await canvas.screenshot())).not.toBe(0);
  await page.getByRole("button", { name: "Pause rotation" }).click();
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.5 + 300, b.y + b.height * 0.7, {
    steps: 15,
  });
  await page.mouse.up();
  await page.waitForTimeout(600);
  expect(Buffer.compare(first, await canvas.screenshot())).not.toBe(0);
  await expect(
    page.getByRole("button", { name: /Elia Monroe and Sloane Ellis/ }),
  ).toHaveCount(0);
  await expect(page.locator(".pin-selection")).toHaveCount(0);
  await expect(page).toHaveURL("/");
});
test("direct gallery URLs, mobile layout and accessible details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const a of artists) {
    await page.goto(`/gallery/${a.slug}`);
    await expect(
      page.getByRole("heading", { name: a.name, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Next artwork" }).click();
  await expect(page.getByText("WORK 1 OF 6")).toBeVisible();
  await page.getByRole("button", { name: "View artwork" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: "/tmp/atelier-mobile-detail.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Close artwork details" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("link", { name: "Back to globe" }).click();
  await expect(page.locator(".map-pin").first()).toBeVisible();
  await page.screenshot({ path: "/tmp/atelier-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("WebGL unavailable: fallback links and complete 2D collection still work", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Choose an artist" })
    .getByRole("link")
    .first()
    .click();
  await expect(
    page.getByText("WebGL is unavailable.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".flat-work")).toHaveCount(6);
  await page.locator(".flat-work").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("unknown artist returns 404", async ({ request }) => {
  expect((await request.get("/gallery/not-an-artist")).status()).toBe(404);
});

test("reduced motion stays still; a single artist pin navigates directly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const pin = page.getByRole("button", { name: "Arden Blake — Lagos" });
  await expect(pin).toBeVisible();
  await page.waitForTimeout(250);
  const before = await page.locator("canvas").screenshot();
  await page.waitForTimeout(600);
  expect(
    Buffer.compare(before, await page.locator("canvas").screenshot()),
  ).toBe(0);
  await pin.click();
  await expect(page).toHaveURL("/gallery/arden-blake");
});

test("mobile touch gestures rotate without selecting; touch pin opens choices", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000");
  const paris = page.getByRole("button", {
    name: /Elia Monroe and Sloane Ellis/,
  });
  await expect(paris).toBeVisible();
  await paris.tap();
  await expect(page.locator(".pin-selection a")).toHaveCount(2);
  await page.getByRole("button", { name: "Close", exact: true }).tap();
  const canvas = page.locator("canvas");
  const b = (await canvas.boundingBox())!;
  const before = await canvas.screenshot();
  const cdp = await context.newCDPSession(page);
  const x = b.x + b.width / 2,
    y = b.y + b.height * 0.7;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 8; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + i * 15, y }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(600);
  expect(Buffer.compare(before, await canvas.screenshot())).not.toBe(0);
  await expect(page.locator(".pin-selection")).toHaveCount(0);
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
  await context.close();
});
