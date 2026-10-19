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
        <a href="#artists">
          Explore the artists{" "}
          <span aria-hidden>
            <Icon />
          </span>
        </a>
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
                The globe couldn’t load. Discover every artist in the directory
                below.
              </div>
            }
          >
            {gl === false ? (
              <div className="scene-message">
                Discover a world of art in the artist directory below.
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
      <div className="landing-divider">
        <span>ART HAS NO BORDERS</span>
        <a href="#artists" aria-label="Browse the artist directory">
          ↓
        </a>
        <span>TAKE YOUR TIME HERE</span>
      </div>
      <section id="artists" className="artist-directory">
        <div className="section-intro">
          <div>
            <p className="eyebrow">THE FIRST COLLECTION</p>
            <h2>Meet a world of perspectives.</h2>
          </div>
          <p>
            Five imagined artists. Four cities.
            <br />
            An invitation to look a little closer.
          </p>
        </div>
        <div className="artist-list">
          {artists.map((a, i) => (
            <Link
              className="artist-row"
              href={`/gallery/${a.slug}`}
              key={a.slug}
            >
              <span className="artist-number">0{i + 1}</span>
              <span className="artist-name">
                {a.name}
                <small>{a.discipline}</small>
              </span>
              <span className="artist-city">
                {a.city}, {a.country}
              </span>
              <span className="row-arrow" aria-hidden>
                <Icon />
              </span>
            </Link>
          ))}
        </div>
        <p className="sample-note">
          A demonstration collection · All artists are fictional. Artwork is
          original sample imagery.
        </p>
      </section>
      <footer>
        <span className="footer-logo">Atelier Atlas</span>
        <span>A slower way to discover art.</span>
        <a href="/ATTRIBUTION.txt">Credits & image licences</a>
      </footer>
    </main>
  );
}
