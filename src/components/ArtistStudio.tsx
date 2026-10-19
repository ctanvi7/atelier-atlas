"use client";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { galleryHref, type Artist, type Artwork } from "@/lib/data";
import { artworkFromFile, saveGallery } from "@/lib/studio";
import { spotifyPlaylist } from "@/lib/spotify";
import GalleryMusic from "./GalleryMusic";
import Icon from "./Icon";
import LocationPicker from "./LocationPicker";
import { useLocalGalleries } from "./useLocalGalleries";
const blankArtist: Artist = {
  slug: "new",
  name: "",
  city: "",
  country: "",
  lat: NaN,
  lng: NaN,
  discipline: "",
  bio: "",
  spotifyPlaylistUrl: "",
  works: [],
};

export default function ArtistStudio() {
  const [selected, setSelected] = useState<Artist>(blankArtist);
  const { galleries, ready, error } = useLocalGalleries();
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const artist = selected;
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
        <h1>Create your gallery</h1>
        <p>Add your pin. Share your art. Tell your story.</p>
      </header>
      <aside className="studio-local-note">
        <strong>A private rehearsal.</strong> Uploads and playlists are saved in
        this browser only. They are not published or synced to other devices.
        Clearing site data removes your drafts. Keep your original images.
      </aside>
      {error && (
        <p className="studio-error" role="alert">
          {error}
        </p>
      )}
      <div className="studio-artist-picker">
        <label htmlFor="studio-artist">Your galleries in this browser</label>
        <select
          id="studio-artist"
          value={selected.slug}
          disabled={busy || !ready}
          onChange={(event) => {
            if (leave()) {
              setDirty(false);
              setSelected(
                galleries.find((a) => a.slug === event.target.value) ??
                  blankArtist,
              );
            }
          }}
        >
          <option value="new">Create a new gallery</option>
          {galleries.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name} — {a.city}
            </option>
          ))}
        </select>
        {selected.slug !== "new" && (
          <Link
            href={galleryHref(selected)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View saved gallery <Icon />
          </Link>
        )}
      </div>
      <StudioEditor
        key={selected.slug}
        artist={artist}
        ready={ready && !error}
        onSaved={setSelected}
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
  ready,
  onSaved,
}: {
  artist: Artist;
  ready: boolean;
  onSaved: (artist: Artist) => void;
  dirty: boolean;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [works, setWorks] = useState<Artwork[]>(artist.works);
  const [playlist, setPlaylist] = useState(artist.spotifyPlaylistUrl ?? "");
  const [profile, setProfile] = useState(artist);
  const [lat, setLat] = useState(
    Number.isFinite(artist.lat) ? String(artist.lat) : "",
  );
  const [lng, setLng] = useState(
    Number.isFinite(artist.lng) ? String(artist.lng) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    artist.slug !== "new"
      ? "Saved in this browser. Your pin and gallery are ready."
      : "",
  );
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
          if (lat === "" || lng === "")
            throw new Error("Choose a location for your pin.");
          const collection: Artist = {
            ...profile,
            slug:
              artist.slug === "new"
                ? `local-${crypto.randomUUID()}`
                : artist.slug,
            name: profile.name.trim(),
            city: profile.city.trim(),
            country: profile.country.trim(),
            bio: profile.bio.trim(),
            discipline: profile.discipline.trim(),
            lat: Number(lat),
            lng: Number(lng),
            works: saved,
            spotifyPlaylistUrl: normalized?.url ?? "",
          };
          await saveGallery(collection);
          setWorks(saved);
          setPlaylist(normalized?.url ?? "");
          onDirty(false);
          setMessage("Saved in this browser. Your pin and gallery are ready.");
          onSaved(collection);
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
        <section className="studio-section studio-profile">
          <p className="eyebrow">01 / YOUR PLACE ON THE ATLAS</p>
          <h2>Add your pin</h2>
          <div className="profile-grid">
            {(
              [
                ["name", "Your artist name"],
                ["city", "City"],
                ["country", "Country"],
                ["discipline", "Art practice"],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label htmlFor={`profile-${field}`}>{label}</label>
                <input
                  id={`profile-${field}`}
                  required={field !== "discipline"}
                  maxLength={field === "discipline" ? 160 : 100}
                  value={profile[field]}
                  onChange={(e) => {
                    setProfile({ ...profile, [field]: e.target.value });
                    change();
                  }}
                />
              </div>
            ))}
          </div>
          <label htmlFor="profile-bio">About you and your art</label>
          <textarea
            id="profile-bio"
            rows={3}
            maxLength={1500}
            value={profile.bio}
            onChange={(e) => {
              setProfile({ ...profile, bio: e.target.value });
              change();
            }}
          />
          <LocationPicker
            lat={lat}
            lng={lng}
            onChange={(latitude, longitude) => {
              setLat(latitude);
              setLng(longitude);
              change();
            }}
          />
        </section>
        <section className="studio-section">
          <div className="studio-section-heading">
            <div>
              <p className="eyebrow">02 / YOUR ARTWORK</p>
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
          <p className="eyebrow">03 / THE ATMOSPHERE</p>
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
            artistName={profile.name || "You"}
            playlistUrl={playlist.trim()}
          />
        </section>
        <div className="studio-save">
          <p>
            {dirty
              ? "You have unsaved changes."
              : artist.slug === "new"
                ? "Add a pin and at least one artwork to begin."
                : "Your collection is up to date."}
          </p>
          <button className="studio-primary" type="submit">
            {busy ? "Working…" : "Save pin & gallery"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
