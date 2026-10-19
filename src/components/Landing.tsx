"use client";
import Icon from "./Icon";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { artists } from "@/lib/data";
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
  const [paused, setPaused] = useState(false);
  return (
    <main className="landing">
      <nav className="topbar">
        <span className="small-caps">Independent art. Without borders.</span>
        <details className="artist-menu">
          <summary>
            Explore artists{" "}
            <span aria-hidden>
              <Icon />
            </span>
          </summary>
          <nav aria-label="Choose an artist">
            {artists.map((artist) => (
              <Link key={artist.slug} href={`/gallery/${artist.slug}`}>
                {artist.name}
                <small>{artist.city}</small>
              </Link>
            ))}
          </nav>
        </details>
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
          <SceneBoundary
            fallback={
              <div className="scene-message">
                The globe couldn’t load. Choose a gallery from Explore artists
                above.
              </div>
            }
          >
            {gl === false ? (
              <div className="scene-message">
                Choose a gallery from Explore artists above.
                <br />
                <small>3D is unavailable on this device.</small>
              </div>
            ) : gl === true ? (
              <Globe paused={paused} />
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
            className="text-button pause"
            onClick={() => setPaused(!paused)}
          >
            {!paused && <Icon kind="pause" />}
            {paused ? "Resume rotation" : "Pause rotation"}
          </button>
        )}
      </section>
      <footer>
        <span className="footer-logo">Atelier Atlas</span>
        <Link href="/studio">Artist studio</Link>
        <a href="/ATTRIBUTION.txt">Credits & image licences</a>
      </footer>
    </main>
  );
}
