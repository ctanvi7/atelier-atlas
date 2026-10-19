import type { Artwork } from "./data";
import { spotifyPlaylist } from "./spotify";

export type ArtistDraft = {
  version: 1;
  works: Artwork[];
  spotifyPlaylistUrl: string;
};
const DB = "atelier-atlas-studio";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("artists");
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

export async function readDraft(slug: string): Promise<ArtistDraft | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction("artists")
        .objectStore("artists")
        .get(slug);
      request.onsuccess = () => {
        try {
          resolve(request.result ? validateDraft(request.result) : null);
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () =>
        reject(new Error("The saved collection could not be read."));
    });
  } finally {
    db.close();
  }
}

export async function saveDraft(slug: string, draft: ArtistDraft) {
  validateDraft(draft);
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("artists", "readwrite");
      transaction.objectStore("artists").put(draft, slug);
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
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("atelier-studio");
    channel.postMessage(slug);
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
