import { test, expect } from "@playwright/test";
import { artists } from "../src/lib/data";
import { validateDraft } from "../src/lib/studio";

const playlist = "https://open.spotify.com/playlist/4VMiOs9qL6OSML9Y9ZFWPN";

test("all eight artist playlists are assigned correctly", () => {
  expect(artists.map((a) => a.name)).toEqual([
    "Elia Monroe",
    "Sloane Ellis",
    "Nina Calloway",
    "Arden Blake",
    "Cleo Winters",
    "Remi Sinclair",
    "Kaia Laurent",
    "Thea Wren",
  ]);
  expect(artists.map((a) => a.spotifyPlaylistUrl?.split("/").pop())).toEqual([
    "53pKJ7WfSEf5I8ox4Iu25c",
    "4VMiOs9qL6OSML9Y9ZFWPN",
    "1aYiM4zLmBuFq0Fg6NQb6a",
    "0Hwb2a9DJdom4yoe5V41K9",
    "1z5D0mAmeDIsjKzA3YTz0t",
    "1aYiM4zLmBuFq0Fg6NQb6a",
    "0Hwb2a9DJdom4yoe5V41K9",
    "4VMiOs9qL6OSML9Y9ZFWPN",
  ]);
  const draft = {
    version: 1 as const,
    works: artists[0].works,
    spotifyPlaylistUrl: playlist,
  };
  expect(validateDraft(draft)).toBe(draft);
  expect(() =>
    validateDraft({
      ...draft,
      works: Array.from({ length: 25 }, (_, i) => ({
        ...draft.works[0],
        id: `${i}`,
      })),
    }),
  ).toThrow();
  expect(() =>
    validateDraft({
      ...draft,
      works: [{ ...draft.works[0], image: "javascript:alert(1)" }],
    }),
  ).toThrow();
});

test("studio saves uploaded artwork and music per artist, survives reload and renders in the gallery", async ({
  page,
  context,
}) => {
  await page.goto("/studio");
  const save = page.getByRole("button", { name: "Save to this browser" });
  await expect(save).toBeEnabled();
  await page
    .locator("#art-upload")
    .setInputFiles("public/art/sloane-ellis.png");
  await expect(page.locator(".studio-work")).toHaveCount(7);
  const uploaded = page.locator(".studio-work").last();
  await uploaded
    .getByLabel("Artwork title", { exact: true })
    .fill("My cobalt study");
  await uploaded.getByLabel("Medium / materials").fill("Oil on linen");
  await uploaded
    .getByLabel("Artwork label", { exact: true })
    .fill("An uploaded landscape with its original proportions.");
  await page.getByLabel("Spotify playlist link").fill(playlist + "?si=shared");
  await save.click();
  await expect(page.getByRole("status")).toContainText("Saved in this browser");
  await page.reload();
  await expect(page.locator(".studio-work")).toHaveCount(7);
  await expect(
    page.getByLabel("Artwork title", { exact: true }).last(),
  ).toHaveValue("My cobalt study");
  await expect(page.getByLabel("Spotify playlist link")).toHaveValue(playlist);
  await page.getByLabel("Choose a sample artist").selectOption("sloane-ellis");
  await expect(page.locator(".studio-work")).toHaveCount(6);
  const gallery = await context.newPage();
  await gallery.route("https://open.spotify.com/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Spotify test player</p>",
    }),
  );
  await gallery.goto("/gallery/elia-monroe");
  await expect(
    gallery.getByText("Local studio preview", { exact: false }),
  ).toBeVisible();
  await expect(gallery.locator("canvas")).toHaveAttribute(
    "data-position",
    /6\.500/,
  );
  await gallery.getByRole("button", { name: "View in 2D" }).click();
  await expect(gallery.locator(".flat-work")).toHaveCount(7);
  const image = gallery.getByRole("img", { name: "My cobalt study" });
  expect(
    await image.evaluate(
      (element: HTMLImageElement) =>
        element.naturalWidth / element.naturalHeight,
    ),
  ).toBeCloseTo(4 / 3, 2);
  await gallery.getByRole("button", { name: "Listen on Spotify" }).click();
  await expect(gallery.locator("iframe")).toHaveAttribute(
    "src",
    /4VMiOs9qL6OSML9Y9ZFWPN/,
  );
  await gallery
    .getByRole("button", { name: "My cobalt study View artwork" })
    .click();
  await expect(gallery.getByRole("dialog")).toContainText(
    "An uploaded landscape",
  );
  await gallery.close();
});

test("studio rejects invalid uploads and playlists and supports an empty collection", async ({
  page,
}) => {
  await page.goto("/studio");
  await expect(
    page.getByRole("button", { name: "Save to this browser" }),
  ).toBeEnabled();
  await page.locator("#art-upload").setInputFiles({
    name: "unsafe.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg></svg>"),
  });
  await expect(page.locator(".studio-error")).toContainText("JPG, PNG or WebP");
  await page.locator("#art-upload").setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.locator(".studio-error")).toContainText(
    "could not be read",
  );
  await page
    .getByLabel("Spotify playlist link")
    .fill("https://example.com/playlist");
  await page.getByRole("button", { name: "Save to this browser" }).click();
  await expect(page.locator(".studio-error")).toContainText(
    "full Spotify playlist link",
  );
  await page.getByLabel("Spotify playlist link").fill("");
  for (let i = 0; i < 6; i++)
    await page
      .getByRole("button", { name: /^Remove / })
      .first()
      .click();
  await page.getByRole("button", { name: "Save to this browser" }).click();
  await expect(page.getByRole("status")).toContainText("Saved in this browser");
  await page.goto("/gallery/elia-monroe");
  await expect(
    page.getByText("This collection is waiting for its first artwork."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Next artwork" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("region", { name: "Gallery soundtrack" }),
  ).toHaveCount(0);
});

test("mobile studio reorders artworks and warns before abandoning edits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  await expect(
    page.getByRole("button", { name: "Save to this browser" }),
  ).toBeEnabled();
  const title = await page
    .getByLabel("Artwork title", { exact: true })
    .first()
    .inputValue();
  await page.getByRole("button", { name: `Move ${title} later` }).click();
  await expect(
    page.getByLabel("Artwork title", { exact: true }).nth(1),
  ).toHaveValue(title);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByLabel("Choose a sample artist").selectOption("thea-wren");
  await expect(page.getByLabel("Choose a sample artist")).toHaveValue(
    "elia-monroe",
  );
  await page.getByRole("button", { name: "Save to this browser" }).click();
  await expect(page.getByRole("status")).toContainText("Saved in this browser");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "/tmp/atelier-studio-mobile.png",
    fullPage: true,
  });
});

test("saving updates an already-open gallery in another tab", async ({
  page,
  context,
}) => {
  await page.goto("/studio");
  await expect(
    page.getByRole("button", { name: "Save to this browser" }),
  ).toBeEnabled();
  const gallery = await context.newPage();
  await gallery.goto("/gallery/elia-monroe");
  await expect(
    gallery.getByRole("button", { name: "View in 2D" }),
  ).toBeVisible();
  await page
    .getByLabel("Artwork title", { exact: true })
    .first()
    .fill("A new morning");
  await page.getByRole("button", { name: "Save to this browser" }).click();
  await expect(page.getByRole("status")).toContainText("Saved in this browser");
  await expect(
    gallery.getByText("Local studio preview", { exact: false }),
  ).toBeVisible();
  await gallery.getByRole("button", { name: "View in 2D" }).click();
  await expect(
    gallery.getByRole("img", { name: "A new morning" }),
  ).toBeVisible();
});

test("storage failure leaves changes unsaved with a visible error", async ({
  page,
}) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.put = () => {
      throw new DOMException("Storage full", "QuotaExceededError");
    };
  });
  await page.goto("/studio");
  await expect(
    page.getByRole("button", { name: "Save to this browser" }),
  ).toBeEnabled();
  await page
    .getByLabel("Artwork title", { exact: true })
    .first()
    .fill("An unsaved piece");
  await page.getByRole("button", { name: "Save to this browser" }).click();
  await expect(page.locator(".studio-error")).toBeVisible();
  await expect(page.getByText("You have unsaved changes.")).toBeVisible();
  await expect(page.getByRole("status")).not.toContainText(
    "Saved in this browser",
  );
});
