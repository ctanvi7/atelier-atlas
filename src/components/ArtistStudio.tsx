"use client";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { artists, type Artist, type Artwork } from "@/lib/data";
import { artworkFromFile, readDraft, saveDraft } from "@/lib/studio";
import { spotifyPlaylist } from "@/lib/spotify";
import GalleryMusic from "./GalleryMusic";
import Icon from "./Icon";

export default function ArtistStudio() {
  const [slug, setSlug] = useState(artists[0].slug);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const artist = artists.find((a) => a.slug === slug)!;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const leave = () =>
    !dirty || window.confirm("Leave without saving these changes?");
  return (
    <main className="studio-page">
      <nav className="studio-nav">
        <Link
          href="/"
          onClick={(event) => {
            if (!leave()) event.preventDefault();
          }}
        >
          ← Back to globe
        </Link>
        <Link
          href="/"
          className="footer-logo"
          onClick={(event) => {
            if (!leave()) event.preventDefault();
          }}
        >
          Atelier Atlas
        </Link>
      </nav>
      <header className="studio-heading">
        <p className="eyebrow">YOUR OWN CORNER OF THE WORLD</p>
        <h1>Artist studio</h1>
        <p>Hang a new piece. Set the mood. Make the room yours.</p>
      </header>
      <aside className="studio-local-note">
        <strong>A private rehearsal.</strong> Uploads and playlists are saved in
        this browser only. They are not published or synced to other devices.
        Clearing site data removes your drafts. Keep your original images.
      </aside>
      <div className="studio-artist-picker">
        <label htmlFor="studio-artist">Choose a sample artist</label>
        <select
          id="studio-artist"
          value={slug}
          disabled={busy}
          onChange={(event) => {
            if (leave()) {
              setDirty(false);
              setSlug(event.target.value);
            }
          }}
        >
          {artists.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name} — {a.city}
            </option>
          ))}
        </select>
        <Link
          href={`/gallery/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View saved gallery <Icon />
        </Link>
      </div>
      <StudioEditor
        key={slug}
        artist={artist}
        dirty={dirty}
        onDirty={setDirty}
        onBusy={setBusy}
      />
    </main>
  );
}

function StudioEditor({
  artist,
  dirty,
  onDirty,
  onBusy,
}: {
  artist: Artist;
  dirty: boolean;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [works, setWorks] = useState<Artwork[]>(artist.works);
  const [playlist, setPlaylist] = useState(artist.spotifyPlaylistUrl ?? "");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    readDraft(artist.slug)
      .then((draft) => {
        if (!active) return;
        if (draft) {
          setWorks(draft.works);
          setPlaylist(draft.spotifyPlaylistUrl);
        }
        setReady(true);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load your saved draft.",
          );
      });
    return () => {
      active = false;
    };
  }, [artist]);
  const change = () => {
    onDirty(true);
    setMessage("");
    setError("");
  };
  const lock = (value: boolean) => {
    setBusy(value);
    onBusy(value);
  };
  const patch = (id: string, fields: Partial<Artwork>) => {
    setWorks((current) =>
      current.map((work) => (work.id === id ? { ...work, ...fields } : work)),
    );
    change();
  };
  const reorder = (index: number, direction: number) => {
    const next = [...works];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    setWorks(next);
    change();
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (works.length + files.length > 24) {
      setError(
        "Each gallery holds up to 24 artworks. Remove a piece before adding more.",
      );
      return;
    }
    lock(true);
    setError("");
    setMessage("");
    try {
      const added: Artwork[] = [];
      for (const file of files) added.push(await artworkFromFile(file));
      setWorks((current) => [...current, ...added]);
      onDirty(true);
      setMessage(
        `${added.length} artwork${added.length === 1 ? "" : "s"} added to your draft. Save to see them in the gallery.`,
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Upload failed. Please try another image.",
      );
    } finally {
      lock(false);
    }
  };
  return (
    <form
      className="studio-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        const normalized = playlist.trim()
          ? spotifyPlaylist(playlist.trim())
          : null;
        if (playlist.trim() && !normalized) {
          setError(
            "Paste a full Spotify playlist link, such as https://open.spotify.com/playlist/…",
          );
          return;
        }
        lock(true);
        setError("");
        setMessage("");
        try {
          const saved = works.map((work) => ({
            ...work,
            title: work.title.trim(),
            medium: work.medium.trim(),
            description: work.description.trim(),
          }));
          await saveDraft(artist.slug, {
            version: 1,
            works: saved,
            spotifyPlaylistUrl: normalized?.url ?? "",
          });
          setWorks(saved);
          setPlaylist(normalized?.url ?? "");
          onDirty(false);
          setMessage("Saved in this browser. Your gallery preview is ready.");
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Could not save your collection.",
          );
        } finally {
          lock(false);
        }
      }}
    >
      {error && (
        <p className="studio-error" role="alert">
          {error}
        </p>
      )}
      <p className="studio-status" role="status">
        {message || (!ready && !error ? "Loading your studio…" : "")}
      </p>
      <fieldset disabled={!ready || busy}>
        <section className="studio-section">
          <div className="studio-section-heading">
            <div>
              <p className="eyebrow">01 / THE COLLECTION</p>
              <h2>On your walls</h2>
            </div>
            <p>
              {works.length} / 24 artworks · {Math.ceil(works.length / 8)}{" "}
              {works.length > 0 && works.length <= 8 ? "room" : "rooms"}
            </p>
          </div>
          <div className="studio-upload">
            <label htmlFor="art-upload">Add your artwork</label>
            <input
              id="art-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={upload}
              disabled={works.length >= 24 || busy || !ready}
            />
            <p>
              JPG, PNG or WebP · up to 10 MB each. Images are fitted to the room
              without stretching and resized to at most 2048 pixels for your
              preview.
            </p>
          </div>
          <div className="studio-work-list">
            {works.length === 0 && (
              <p className="empty-collection">
                An empty wall is a beginning. Add your first artwork above.
              </p>
            )}
            {works.map((work, index) => (
              <article className="studio-work" key={work.id}>
                <div className="studio-work-image">
                  <img
                    src={work.image}
                    alt={work.title}
                    width={work.width}
                    height={work.height}
                  />
                  <span>
                    {work.sample ? "SAMPLE ART" : "YOUR UPLOAD"} · {work.width}{" "}
                    × {work.height}
                  </span>
                </div>
                <div className="studio-work-fields">
                  <label htmlFor={`title-${work.id}`}>Artwork title</label>
                  <input
                    id={`title-${work.id}`}
                    value={work.title}
                    required
                    maxLength={120}
                    onChange={(e) => patch(work.id, { title: e.target.value })}
                  />
                  <label htmlFor={`medium-${work.id}`}>
                    Medium / materials
                  </label>
                  <input
                    id={`medium-${work.id}`}
                    value={work.medium}
                    maxLength={160}
                    placeholder="Oil on linen, 2026"
                    onChange={(e) => patch(work.id, { medium: e.target.value })}
                  />
                  <label htmlFor={`description-${work.id}`}>
                    Artwork label
                  </label>
                  <textarea
                    id={`description-${work.id}`}
                    value={work.description}
                    maxLength={1500}
                    rows={3}
                    placeholder="Tell visitors a little about this piece."
                    onChange={(e) =>
                      patch(work.id, { description: e.target.value })
                    }
                  />
                  <div className="studio-work-actions">
                    <button
                      type="button"
                      disabled={index === 0}
                      aria-label={`Move ${work.title} earlier`}
                      onClick={() => reorder(index, -1)}
                    >
                      ↑ Earlier
                    </button>
                    <button
                      type="button"
                      disabled={index === works.length - 1}
                      aria-label={`Move ${work.title} later`}
                      onClick={() => reorder(index, 1)}
                    >
                      ↓ Later
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${work.title}`}
                      onClick={() => {
                        setWorks(works.filter((w) => w.id !== work.id));
                        change();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="studio-section studio-music">
          <p className="eyebrow">02 / THE ATMOSPHERE</p>
          <h2>Your room, your soundtrack</h2>
          <label htmlFor="studio-playlist">Spotify playlist link</label>
          <input
            id="studio-playlist"
            type="url"
            value={playlist}
            placeholder="https://open.spotify.com/playlist/…"
            onChange={(event) => {
              setPlaylist(event.target.value);
              change();
            }}
          />
          <p>
            Copy the playlist link from Spotify’s Share menu. Visitors choose
            when to play. Leave this blank for a quiet gallery.
          </p>
          <GalleryMusic
            key={playlist}
            artistName={artist.name}
            playlistUrl={playlist.trim()}
          />
        </section>
        <div className="studio-save">
          <p>
            {dirty
              ? "You have unsaved changes."
              : "Your collection is up to date."}
          </p>
          <button className="studio-primary" type="submit">
            {busy ? "Working…" : "Save to this browser"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
