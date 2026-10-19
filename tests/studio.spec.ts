import { test, expect, type Page } from "@playwright/test";
import { artists } from "../src/lib/data";
import { validateDraft, validateGallery } from "../src/lib/studio";

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

async function fillProfile(page: Page, name = "River Artist") {
  await page.getByLabel("Your artist name").fill(name);
  await page.getByLabel("City", { exact: true }).fill("Dakar");
  await page.getByLabel("Country", { exact: true }).fill("Senegal");
  await page
    .getByLabel("About you and your art")
    .fill("Colour and light from my own collection.");
  await page.getByLabel("Latitude", { exact: true }).fill("14.7167");
  await page.getByLabel("Longitude", { exact: true }).fill("-17.4677");
}
async function addArt(page: Page) {
  await page
    .locator("#art-upload")
    .setInputFiles("public/art/sloane-ellis.png");
  await expect(page.locator(".studio-work")).toHaveCount(1);
  await page
    .getByLabel("Artwork title", { exact: true })
    .fill("My cobalt study");
  await page
    .getByLabel("Artwork label", { exact: true })
    .fill("My landscape, in its original proportions.");
}
async function save(page: Page) {
  await page.getByRole("button", { name: "Save pin & gallery" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your pin and gallery are ready",
  );
  return (await page
    .getByRole("link", { name: "View saved gallery" })
    .getAttribute("href"))!;
}

test("new contribution starts empty, survives reload and adds a selectable globe pin", async ({
  page,
}) => {
  await page.goto("/studio");
  await expect(
    page.getByRole("button", { name: "Save pin & gallery" }),
  ).toBeEnabled();
  await expect(page.locator(".studio-work")).toHaveCount(0);
  await expect(page.locator("#studio-artist option")).toHaveCount(1);
  await fillProfile(page);
  await addArt(page);
  await page.getByLabel("Spotify playlist link").fill(playlist);
  const href = await save(page);
  expect(href).toMatch(/^\/gallery\/local\/local-/);
  await page.reload();
  await page
    .getByLabel("Your galleries in this browser")
    .selectOption({ label: "River Artist — Dakar" });
  await expect(page.getByLabel("Artwork title", { exact: true })).toHaveValue(
    "My cobalt study",
  );
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const pin = page.getByRole("button", { name: "River Artist — Dakar" });
  await expect(pin).toBeVisible();
  await pin.focus();
  await pin.press("Enter");
  await expect(page).toHaveURL(new RegExp(href));
  await expect(
    page.getByRole("heading", { name: "River Artist", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-position",
    /6\.500/,
  );
  await page.getByRole("button", { name: "View in 2D" }).click();
  await expect(page.locator(".flat-work")).toHaveCount(1);
  const image = page.getByRole("img", { name: "My cobalt study" });
  expect(
    await image.evaluate(
      (img: HTMLImageElement) => img.naturalWidth / img.naturalHeight,
    ),
  ).toBeCloseTo(4 / 3, 2);
  await page
    .getByRole("button", { name: "My cobalt study View artwork" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("My landscape");
});

test("featured galleries ignore legacy overrides and cannot be edited or overwritten", async ({
  page,
}) => {
  expect(() => validateGallery(artists[0])).toThrow();
  await page.goto("/studio?artist=elia-monroe");
  await expect(
    page.getByRole("button", { name: "Save pin & gallery" }),
  ).toBeEnabled();
  await expect(page.locator("#studio-artist option")).toHaveCount(1);
  await expect(page.locator(".studio-work")).toHaveCount(0);
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("atelier-atlas-studio", 2);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("artists", "readwrite");
        tx.objectStore("artists").put(
          { version: 1, works: [], spotifyPlaylistUrl: "" },
          "elia-monroe",
        );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      open.onerror = () => reject(open.error);
    });
  });
  await page.goto("/gallery/elia-monroe");
  await page.getByRole("button", { name: "View in 2D" }).click();
  await expect(page.locator(".flat-work")).toHaveCount(6);
  await expect(
    page.getByRole("img", { name: "Where the morning rests" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0);
});

test("mobile pin map and coordinate inputs agree; invalid uploads and empty galleries are rejected", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  await expect(
    page.getByRole("button", { name: "Save pin & gallery" }),
  ).toBeEnabled();
  await fillProfile(page);
  const map = page.getByRole("img", {
    name: "World map for placing your gallery pin",
  });
  const bounds = (await map.boundingBox())!;
  await map.click({ position: { x: bounds.width / 2, y: bounds.height / 2 } });
  expect(
    Math.abs(
      Number(await page.getByLabel("Latitude", { exact: true }).inputValue()),
    ),
  ).toBeLessThan(1);
  expect(
    Math.abs(
      Number(await page.getByLabel("Longitude", { exact: true }).inputValue()),
    ),
  ).toBeLessThan(1);
  await page.getByRole("button", { name: "Save pin & gallery" }).click();
  await expect(page.locator(".studio-error")).toContainText("at least one");
  await page
    .locator("#art-upload")
    .setInputFiles({
      name: "bad.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    });
  await expect(page.locator(".studio-error")).toContainText("JPG, PNG or WebP");
  await addArt(page);
  await page.getByLabel("Spotify playlist link").fill("https://example.com");
  await page.getByRole("button", { name: "Save pin & gallery" }).click();
  await expect(page.locator(".studio-error")).toContainText(
    "full Spotify playlist",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "/tmp/atelier-create-mobile.png",
    fullPage: true,
  });
});

test("saving an own collection updates another tab; other browsers see an explanatory missing-gallery state", async ({
  page,
  context,
  browser,
}) => {
  await page.goto("/studio");
  await fillProfile(page);
  await addArt(page);
  const href = await save(page);
  const gallery = await context.newPage();
  await gallery.goto(href);
  await expect(
    gallery.getByRole("heading", { name: "River Artist", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Your artist name").fill("River Studio");
  await save(page);
  await expect(
    gallery.getByRole("heading", { name: "River Studio", exact: true }),
  ).toBeVisible();
  const separate = await browser.newContext();
  const visitor = await separate.newPage();
  await visitor.goto("http://127.0.0.1:3000" + href);
  await expect(
    visitor.getByText("This gallery isn’t saved in this browser.", {
      exact: false,
    }),
  ).toBeVisible();
  await separate.close();
});

test("save failures keep own artwork unsaved and do not add a pin", async ({
  page,
}) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.put = () => {
      throw new DOMException("Storage full", "QuotaExceededError");
    };
  });
  await page.goto("/studio");
  await fillProfile(page);
  await addArt(page);
  await page.getByRole("button", { name: "Save pin & gallery" }).click();
  await expect(page.locator(".studio-error")).toBeVisible();
  await expect(page.getByText("You have unsaved changes.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View saved gallery" }),
  ).toHaveCount(0);
});
