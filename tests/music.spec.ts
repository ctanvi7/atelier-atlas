import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spotifyPlaylist } from "../src/lib/spotify";
const playlistUrl = "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO";

test("only Spotify playlist links can become embedded players", () => {
  expect(spotifyPlaylist(`${playlistUrl}?si=share`)?.url).toBe(playlistUrl);
  expect(
    spotifyPlaylist(playlistUrl.replace("/playlist/", "/intl-en/playlist/"))
      ?.url,
  ).toBe(playlistUrl);
  for (const value of [
    undefined,
    "",
    "javascript:alert(1)",
    playlistUrl.replace("https:", "http:"),
    playlistUrl.replace("open.spotify.com", "open.spotify.com.evil.test"),
    playlistUrl.replace("playlist", "track"),
    "https://open.spotify.com/playlist/invalid",
  ]) {
    expect(spotifyPlaylist(value)).toBeNull();
  }
});

for (const width of [1440, 390]) {
  test(`playlist loads on request and closes cleanly at ${width}px`, async ({
    page,
  }) => {
    const fixture = (
      await build({
        stdin: {
          contents: `import { createRoot } from 'react-dom/client'; import GalleryMusic from './src/components/GalleryMusic'; createRoot(document.getElementById('root')).render(<GalleryMusic artistName="Elia Monroe" playlistUrl={new URLSearchParams(location.search).get('playlist') ?? undefined} />);`,
          resolveDir: process.cwd(),
          loader: "tsx",
        },
        bundle: true,
        write: false,
        jsx: "automatic",
        alias: { "@": path.resolve("src") },
        define: { "process.env.NODE_ENV": '"production"' },
      })
    ).outputFiles[0].text;
    const css = await readFile("src/app/globals.css", "utf8");
    await page.route("**/__music-fixture*", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script type="module">${fixture}</script></body></html>`,
      }),
    );
    let requests = 0;
    await page.route("https://open.spotify.com/embed/**", (route) => {
      requests++;
      return route.fulfill({
        contentType: "text/html",
        body: "<p>Spotify player fixture</p>",
      });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      `/__music-fixture?playlist=${encodeURIComponent(playlistUrl)}`,
    );
    const open = page.getByRole("button", { name: "Listen on Spotify" });
    await expect(open).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(requests).toBe(0);
    await open.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("iframe")).toHaveAttribute(
      "src",
      spotifyPlaylist(playlistUrl)!.embedUrl,
    );
    await expect(
      page.frameLocator("iframe").getByText("Spotify player fixture"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open playlist in Spotify" }),
    ).toHaveAttribute("href", playlistUrl);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `/tmp/atelier-music-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Close player" }).click();
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.goto("/__music-fixture");
    await expect(
      page.getByRole("region", { name: "Gallery soundtrack" }),
    ).toHaveCount(0);
  });
}

test("homepage omits the large directory and keeps accessible gallery navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Meet a world of perspectives." }),
  ).toHaveCount(0);
  await expect(page.locator(".artist-directory, .landing-divider")).toHaveCount(
    0,
  );
  await page.locator(".artist-menu summary").focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("navigation", { name: "Choose an artist" })
      .getByRole("link"),
  ).toHaveCount(8);
});
