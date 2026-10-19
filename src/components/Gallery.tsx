"use client";
import Icon from "./Icon";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import type { Artist } from "@/lib/data";
import SceneBoundary from "./SceneBoundary";
import { useWebGL } from "./useMotion";
import GalleryControls from "./GalleryControls";
import ArtworkDetails from "./ArtworkDetails";
const GalleryRoom = dynamic(() => import("./GalleryRoom"), {
  ssr: false,
  loading: () => <div className="scene-message">Opening the exhibition…</div>,
});
export default function Gallery({ artist }: { artist: Artist }) {
  const gl = useWebGL();
  const [twoD, setTwoD] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<number | null>(null);
  const flat = twoD || gl === false;
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
          onClick={() => setTwoD(!twoD)}
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
      {flat ? (
        <section className="flat-gallery" aria-label="2D artwork collection">
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
            THE PRIVATE VIEW <span>01 — 06</span>
          </div>
          <SceneBoundary fallback={fallback}>
            {gl ? (
              <GalleryRoom
                artist={artist}
                selected={selected}
                onInspect={setDetail}
              />
            ) : (
              <div className="scene-message">Preparing your exhibition…</div>
            )}
          </SceneBoundary>
          <p className="room-hint">Select an artwork to look closer</p>
        </section>
      )}
      {!flat && (
        <GalleryControls
          works={artist.works}
          selected={selected}
          onSelect={setSelected}
          onInspect={setDetail}
        />
      )}
      <section className="artist-about">
        <p className="eyebrow">BEHIND THE COLLECTION</p>
        <p>{artist.bio}</p>
        <small>
          Fictional artist · Six original sample works · No artwork is offered
          for sale.
        </small>
      </section>
      <footer>
        <Link href="/">← A world of art awaits</Link>
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
