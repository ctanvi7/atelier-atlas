import type { Artist, Artwork } from "./data";
import { spotifyPlaylist } from "./spotify";

export type ArtistDraft = {
  version: 1;
  works: Artwork[];
  spotifyPlaylistUrl: string;
};
const DB = "atelier-atlas-studio";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("artists"))
        request.result.createObjectStore("artists");
      if (!request.result.objectStoreNames.contains("galleries"))
        request.result.createObjectStore("galleries");
    };
    request.onblocked = () =>
      reject(
        new Error(
          "Close other Atelier Atlas tabs and reload to upgrade local storage.",
        ),
      );
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage is unavailable. Your changes have not been saved.",
        ),
      );
  });
}

export function validateDraft(value: unknown): ArtistDraft {
  const draft = value as ArtistDraft;
  if (
    !draft ||
    draft.version !== 1 ||
    !Array.isArray(draft.works) ||
    draft.works.length > 24 ||
    typeof draft.spotifyPlaylistUrl !== "string" ||
    (draft.spotifyPlaylistUrl && !spotifyPlaylist(draft.spotifyPlaylistUrl))
  )
    throw new Error("This saved collection is invalid.");
  const ids = new Set<string>();
  for (const work of draft.works) {
    if (
      !work ||
      typeof work.id !== "string" ||
      ids.has(work.id) ||
      typeof work.title !== "string" ||
      !work.title.trim() ||
      work.title.length > 120 ||
      typeof work.medium !== "string" ||
      work.medium.length > 160 ||
      typeof work.description !== "string" ||
      work.description.length > 1500 ||
      !Number.isFinite(work.width) ||
      !Number.isFinite(work.height) ||
      work.width <= 0 ||
      work.height <= 0 ||
      work.width > 4096 ||
      work.height > 4096 ||
      typeof work.image !== "string" ||
      work.image.length > 8_000_000 ||
      !/^(?:\/art\/[a-zA-Z0-9-]+\.(?:svg|png)|data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/]+=*)$/.test(
        work.image,
      )
    )
      throw new Error("An artwork has invalid details or image data.");
    ids.add(work.id);
  }
  return draft;
}

export function validateGallery(value: unknown): Artist {
  const artist = value as Artist;
  if (
    !artist ||
    !/^local-[a-f0-9-]{36}$/.test(artist.slug) ||
    ![artist.name, artist.city, artist.country].every(
      (s) => typeof s === "string" && s.trim().length > 0 && s.length <= 100,
    ) ||
    typeof artist.bio !== "string" ||
    artist.bio.length > 1500 ||
    typeof artist.discipline !== "string" ||
    artist.discipline.length > 160 ||
    !Number.isFinite(artist.lat) ||
    !Number.isFinite(artist.lng) ||
    Math.abs(artist.lat) > 90 ||
    Math.abs(artist.lng) > 180
  )
    throw new Error("Add your name, city, country and a valid pin location.");
  validateDraft({
    version: 1,
    works: artist.works,
    spotifyPlaylistUrl: artist.spotifyPlaylistUrl ?? "",
  });
  if (
    !artist.works.length ||
    artist.works.some((w) => w.sample || !w.image.startsWith("data:image/"))
  )
    throw new Error("Add at least one of your own artworks.");
  return artist;
}

export async function listGalleries(): Promise<Artist[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction("galleries")
        .objectStore("galleries")
        .getAll();
      request.onsuccess = () => {
        try {
          resolve(request.result.map(validateGallery));
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () =>
        reject(new Error("Your local galleries could not be loaded."));
    });
  } finally {
    db.close();
  }
}

export async function saveGallery(artist: Artist) {
  validateGallery(artist);
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("galleries", "readwrite");
      transaction.objectStore("galleries").put(artist, artist.slug);
      transaction.oncomplete = () => resolve();
      transaction.onabort = transaction.onerror = () =>
        reject(
          new Error(
            "Could not save. Browser storage may be full; remove some images and try again.",
          ),
        );
    });
  } finally {
    db.close();
  }
  window.dispatchEvent(new Event("atelier-galleries"));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("atelier-studio");
    channel.postMessage(artist.slug);
    channel.close();
  }
}

export async function artworkFromFile(file: File): Promise<Artwork> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(
      "Choose a JPG, PNG or WebP image. SVG files are not supported for uploads.",
    );
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose an image smaller than 10 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This file could not be read as an image.");
  }
  try {
    if (bitmap.width * bitmap.height > 40_000_000)
      throw new Error("Choose an image under 40 megapixels.");
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "Untitled",
      image: canvas.toDataURL("image/webp", 0.9),
      width: canvas.width,
      height: canvas.height,
      medium: "",
      description: "",
      sample: false,
    };
  } finally {
    bitmap.close();
  }
}
