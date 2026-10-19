"use client";
import { useState } from "react";
import Icon from "./Icon";
import { spotifyPlaylist } from "@/lib/spotify";

export default function GalleryMusic({
  artistName,
  playlistUrl,
  compact = false,
  autoOpen = false,
}: {
  artistName: string;
  playlistUrl?: string;
  compact?: boolean;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const playlist = spotifyPlaylist(playlistUrl);
  if (!playlist) return null;
  return (
    <section
      className={`gallery-music ${compact ? "music-compact" : ""}`}
      aria-label="Gallery soundtrack"
    >
      <div className="music-heading">
        <div>
          <p className="eyebrow">
            {compact ? "ROOM SOUNDTRACK" : "A SOUNDTRACK FOR YOUR VISIT"}
          </p>
          <p className="music-credit">
            {compact ? (
              <a
                href={playlist.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open playlist in Spotify"
              >
                {artistName} ↗
              </a>
            ) : (
              <>Selected by {artistName}</>
            )}
          </p>
        </div>
        <button
          className="text-button"
          type="button"
          aria-expanded={open}
          aria-controls="gallery-playlist"
          onClick={() => setOpen(!open)}
        >
          {open
            ? autoOpen
              ? "Stop music"
              : "Close player"
            : "Listen on Spotify"}
        </button>
      </div>
      {open && (
        <div id="gallery-playlist">
          <iframe
            src={
              autoOpen ? `${playlist.embedUrl}&autoplay=1` : playlist.embedUrl
            }
            title={`${artistName}’s Spotify playlist`}
            width="100%"
            height={compact ? "80" : "352"}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <p className="music-note">
            Press play in Spotify to listen.{" "}
            <a href={playlist.url} target="_blank" rel="noopener noreferrer">
              Open playlist in Spotify <Icon />
            </a>
          </p>
        </div>
      )}
    </section>
  );
}
