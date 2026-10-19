"use client";
import Icon from "./Icon";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { artists as featuredArtists, galleryHref } from "@/lib/data";
import { useLocalGalleries } from "./useLocalGalleries";
import SceneBoundary from "./SceneBoundary";
import { useWebGL } from "./useMotion";
const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => (
    <div className="scene-message">Bringing the world into view…</div>
  ),
});
export default function Landing() {
  const gl = useWebGL();
  const { galleries, error } = useLocalGalleries();
  const artists = [...featuredArtists, ...galleries];
  const [paused, setPaused] = useState(false);
  const fallback = (
    <div className="scene-message">
      <p>Choose a gallery</p>
      <nav className="fallback-artists" aria-label="Choose an artist">
        {artists.map((artist) => (
          <Link key={artist.slug} href={galleryHref(artist)}>
            {artist.name}
            <small>{artist.city}</small>
          </Link>
        ))}
      </nav>
    </div>
  );
  return (
    <main className="landing">
      <nav className="topbar">
        <span className="small-caps">Independent art. Without borders.</span>
      </nav>
      <header className="hero-heading">
        <p className="eyebrow">A NEW PERSPECTIVE ON ART</p>
        <h1 className="wordmark">Atelier Atlas</h1>
        <p className="tagline">A world of art, a space of your own.</p>
      </header>
      <section
        className="globe-section"
        aria-label="Interactive world of artists"
      >
        <div className="globe-annotation left-note">
          <span className="tiny-star">
            <Icon kind="star" />
          </span>
          <p>
            Different places.
            <br />
            Shared imagination.
          </p>
        </div>
        <div className="globe-stage">
          <SceneBoundary fallback={fallback}>
            {gl === false ? (
              fallback
            ) : gl === true ? (
              <Globe paused={paused} artists={artists} />
            ) : (
              <div className="scene-message">Preparing your atlas…</div>
            )}
          </SceneBoundary>
        </div>
        <div className="globe-annotation right-note">
          <span className="gold-dot" />
          <p>
            A place.
            <br />
            An artist.
            <br />A new discovery.
          </p>
        </div>
      </section>
      <section className="globe-caption">
        <h2>Spin the globe. Discover an artist.</h2>
        <p>
          Drag to wander <span>·</span> Select a golden point to step inside
        </p>
        {gl && (
          <button
            className="text-button pause icon-button"
            aria-label={paused ? "Resume rotation" : "Pause rotation"}
            title={paused ? "Resume rotation" : "Pause rotation"}
            onClick={() => setPaused(!paused)}
          >
            <Icon kind={paused ? "play" : "pause"} />
          </button>
        )}
      </section>
      <div className="join-atlas">
        <Link className="studio-primary" href="/studio">
          Add your pin & artwork
        </Link>

        {error && <p role="status">{error}</p>}
      </div>
      <footer>
        <span className="footer-logo">Atelier Atlas</span>
        <Link href="/studio">Create your gallery</Link>
        <a href="/ATTRIBUTION.txt">Credits & image licences</a>
      </footer>
    </main>
  );
}
