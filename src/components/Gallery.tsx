"use client";
import Icon from "./Icon";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
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
          className="text-button"
          onClick={() => {
            setTwoD(!twoD);
            setSceneReady(false);
          }}
          disabled={gl === false}
        >
          {flat ? "Switch to 3D" : "View in 2D"}{" "}
          <span aria-hidden>
            <Icon />
          </span>
        </button>
      </nav>
      <header className="gallery-heading">
        <p className="eyebrow">
          {artist.city}, {artist.country} <span> / </span> A DEMONSTRATION
          EXHIBITION
        </p>
        <h1>{artist.name}</h1>
        <p>{artist.discipline}</p>
      </header>
      {gl === false && (
        <p className="fallback-note" role="status">
          WebGL is unavailable. Enjoy the complete exhibition in 2D.
        </p>
      )}
      <aside className="entrance-introduction" aria-label="Artist introduction">
        <p>{artist.bio}</p>
        <span>
          {artist.works.length} works · {roomCount}{" "}
          {roomCount === 1 ? "room" : "connected rooms"}
        </span>
      </aside>
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
          <div className="room-label">
            THE PRIVATE VIEW{" "}
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
          <p className={`room-hint ${exploring ? "walking-hint" : ""}`}>
            {exploring
              ? "Take your time. Drag to look around."
              : "Select an artwork to look closer"}
          </p>
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
      <GalleryMusic
        key={artist.slug}
        artistName={artist.name}
        playlistUrl={artist.spotifyPlaylistUrl}
      />
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
      <section className="artist-about">
        <p className="eyebrow">BEHIND THE COLLECTION</p>
        <p>{artist.bio}</p>
        <small>
          Demo artist profile · {artist.works.length} works · Sample artworks
          are labelled.
        </small>
      </section>
      <footer>
        <Link href="/">← A world of art awaits</Link>
        <Link href="/studio">Artist studio</Link>
        <a href="/ATTRIBUTION.txt">Credits & image licences</a>
      </footer>
      {detail !== null && (
        <ArtworkDetails
          artist={artist}
          work={artist.works[detail]}
          onClose={() => setDetail(null)}
        />
      )}
    </main>
  );
}
