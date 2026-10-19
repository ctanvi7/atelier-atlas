"use client";
import Icon from "./Icon";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Artist } from "@/lib/data";
import SceneBoundary from "./SceneBoundary";
import { useWebGL } from "./useMotion";
import GalleryControls from "./GalleryControls";
import ArtworkDetails from "./ArtworkDetails";
import GalleryMusic from "./GalleryMusic";
import ExplorationControls, {
  createWalkInput,
  WalkPad,
} from "./ExplorationControls";
const GalleryRoom = dynamic(() => import("./GalleryRoom"), {
  ssr: false,
  loading: () => <div className="scene-message">Opening the exhibition…</div>,
});
export default function Gallery({ artist }: { artist: Artist }) {
  const gl = useWebGL();
  const viewer = useRef<HTMLDivElement>(null);
  const fullscreenButton = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const sync = () =>
      setExpanded(document.fullscreenElement === viewer.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !document.fullscreenElement &&
        !document.querySelector("dialog[open]")
      ) {
        setExpanded(false);
        fullscreenButton.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
    };
  }, [expanded]);
  const toggleFullscreen = async () => {
    if (expanded) {
      if (document.fullscreenElement) await document.exitFullscreen();
      setExpanded(false);
    } else {
      setExpanded(true);
      try {
        await viewer.current?.requestFullscreen?.();
      } catch {
        /* Use the viewport-sized fallback. */
      }
    }
  };
  const [twoD, setTwoD] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<number | null>(null);
  const [exploring, setExploring] = useState(false);
  const [request, setRequest] = useState(0);
  const [room, setRoom] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const input = useRef(createWalkInput());
  const selectView = (index: number | null) => {
    setSelected(index);
    setExploring(false);
    setRequest((n) => n + 1);
  };
  const roomCount = Math.ceil(artist.works.length / 8);
  const flat = twoD || gl === false || artist.works.length === 0;
  const fallback = (
    <div className="scene-message">
      The 3D room couldn’t load.
      <button onClick={() => setTwoD(true)}>Open the 2D collection</button>
    </div>
  );
  return (
    <main className="gallery-page">
      <nav className="gallery-nav">
        <Link href="/">← Back to globe</Link>
        <Link href="/" className="footer-logo">
          Atelier Atlas
        </Link>
        <button
          className="text-button icon-button"
          aria-label={flat ? "Switch to 3D" : "View in 2D"}
          title={flat ? "Switch to 3D" : "View in 2D"}
          onClick={() => {
            setTwoD(!twoD);
            setSceneReady(false);
          }}
          disabled={gl === false}
        >
          <Icon kind={flat ? "cube" : "grid"} />
        </button>
      </nav>
      <header className="gallery-heading">
        <p className="eyebrow">
          {artist.city}, {artist.country}
        </p>
        <h1>{artist.name}</h1>
        <p>{artist.discipline}</p>
      </header>
      {gl === false && (
        <p className="fallback-note" role="status">
          WebGL is unavailable. Enjoy the complete exhibition in 2D.
        </p>
      )}
      <details className="gallery-introduction">
        <summary>About the artist · {artist.works.length} works</summary>
        <p>{artist.bio}</p>
      </details>
      <div
        ref={viewer}
        className={`gallery-viewer ${expanded ? "is-expanded" : ""}`}
      >
        {flat ? (
          <section className="flat-gallery" aria-label="2D artwork collection">
            {artist.works.length === 0 && (
              <p className="empty-collection">
                This collection is waiting for its first artwork.
              </p>
            )}
            {artist.works.map((w, i) => (
              <button
                key={w.id}
                className="flat-work"
                onClick={() => setDetail(i)}
              >
                <span className="flat-image">
                  <img
                    src={w.image}
                    width={w.width}
                    height={w.height}
                    alt={w.title}
                  />
                </span>
                <span>{w.title}</span>
                <small>
                  View artwork <Icon />
                </small>
              </button>
            ))}
          </section>
        ) : (
          <section className="room-section">
            <button
              ref={fullscreenButton}
              className="fullscreen-toggle icon-button"
              aria-label={expanded ? "Exit fullscreen" : "Full screen"}
              title={expanded ? "Exit fullscreen" : "Full screen"}
              onClick={toggleFullscreen}
              aria-pressed={expanded}
            >
              <Icon kind={expanded ? "collapse" : "expand"} />
            </button>
            <GalleryMusic
              compact
              autoOpen
              artistName={artist.name}
              playlistUrl={artist.spotifyPlaylistUrl}
            />
            <div className="room-label">
              <span aria-live="polite">
                Room {room + 1} of {roomCount}
              </span>
            </div>
            <SceneBoundary fallback={fallback}>
              {gl ? (
                <GalleryRoom
                  artist={artist}
                  selected={selected}
                  onInspect={setDetail}
                  request={request}
                  exploring={exploring}
                  blocked={detail !== null}
                  input={input}
                  onRoomChange={(nextRoom) => {
                    setRoom(nextRoom);
                    setSceneReady(true);
                  }}
                />
              ) : (
                <div className="scene-message">Preparing your exhibition…</div>
              )}
            </SceneBoundary>
            {exploring && <WalkPad input={input} disabled={detail !== null} />}
          </section>
        )}
        {!flat && (
          <ExplorationControls
            exploring={exploring}
            onExplore={() => {
              setExploring(true);
              setRequest((n) => n + 1);
            }}
            input={input}
            disabled={detail !== null || !sceneReady}
          />
        )}
        {!flat && (
          <GalleryControls
            works={artist.works}
            selected={selected}
            onSelect={selectView}
            onInspect={setDetail}
          />
        )}
        {detail !== null && (
          <ArtworkDetails
            artist={artist}
            work={artist.works[detail]}
            onClose={() => setDetail(null)}
          />
        )}
      </div>
      {flat && (
        <GalleryMusic
          compact
          artistName={artist.name}
          playlistUrl={artist.spotifyPlaylistUrl}
        />
      )}
      <details className="artwork-catalogue">
        <summary>Artwork titles &amp; labels</summary>
        <ol>
          {artist.works.map((work, index) => (
            <li key={work.id}>
              <button onClick={() => setDetail(index)}>{work.title}</button>
              <span>
                {artist.name} · {work.medium}
              </span>
              <p>{work.description}</p>
            </li>
          ))}
        </ol>
      </details>
      <footer>
        <Link href="/">← A world of art awaits</Link>
        <Link href="/studio">Add your pin &amp; artwork</Link>
        <a href="/ATTRIBUTION.txt">Credits & image licences</a>
      </footer>
    </main>
  );
}
