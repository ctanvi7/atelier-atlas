import { test, expect } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`compact room, music and fullscreen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://open.spotify.com/embed/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<button onclick="this.textContent='Pause'">Play</button>`,
      }),
    );
    await page.goto("/gallery/elia-monroe");
    await expect(page.locator(".artist-about, .draft-notice")).toHaveCount(0);
    await expect(
      page
        .getByRole("button", { name: "Full screen", exact: true })
        .locator("svg"),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Stop music" }).locator("svg"),
    ).toHaveCount(1);
    const room = page.locator(".room-section");
    await expect(room.locator("iframe")).toBeVisible();
    await expect(room.locator("iframe")).toHaveAttribute("height", "152");
    await expect(room.locator("iframe")).not.toHaveAttribute("src", /autoplay/);
    const nativePlay = page
      .frameLocator("iframe")
      .getByRole("button", { name: "Play", exact: true });
    await nativePlay.click();
    await expect(
      page
        .frameLocator("iframe")
        .getByRole("button", { name: "Pause", exact: true }),
    ).toBeVisible();
    await room.getByRole("button", { name: "Stop music" }).click();
    await expect(room.locator("iframe")).toHaveCount(0);
    await room.getByRole("button", { name: "Open Spotify player" }).click();
    await expect(room.locator("iframe")).toBeVisible();
    const reset = page.getByRole("button", { name: "Reset view" });
    await expect(reset).toBeInViewport();
    await room
      .getByRole("button", { name: "Full screen", exact: true })
      .click();
    await expect(page.locator(".gallery-viewer")).toHaveClass(/is-expanded/);
    await expect(reset).toBeInViewport();
    await page
      .getByRole("button", { name: "View artwork", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close artwork details" }).click();
    await page.screenshot({ path: `/tmp/room-fullscreen-${width}.png` });
    await page.getByRole("button", { name: "Exit fullscreen" }).click();
    await expect(page.locator(".gallery-viewer")).not.toHaveClass(
      /is-expanded/,
    );
    // Browsers without Fullscreen API still get an expanded room with Escape exit.
    await page.evaluate(() => {
      HTMLElement.prototype.requestFullscreen = undefined as never;
    });
    await page
      .getByRole("button", { name: "Full screen", exact: true })
      .click();
    await expect(page.locator(".gallery-viewer")).toHaveClass(/is-expanded/);
    await page.keyboard.press("Escape");
    await expect(page.locator(".gallery-viewer")).not.toHaveClass(
      /is-expanded/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
