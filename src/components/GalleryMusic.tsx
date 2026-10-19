"use client";
import { useState } from "react";
import Icon from "./Icon";
import { spotifyPlaylist } from "@/lib/spotify";

export default function GalleryMusic({
  artistName,
  playlistUrl,
}: {
  artistName: string;
  playlistUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const playlist = spotifyPlaylist(playlistUrl);
  if (!playlist) return null;
  return (
    <section className="gallery-music" aria-label="Gallery soundtrack">
      <div className="music-heading">
        <div>
          <p className="eyebrow">A SOUNDTRACK FOR YOUR VISIT</p>
          <p className="music-credit">Selected by {artistName}</p>
        </div>
        <button
          className="text-button"
          type="button"
          aria-expanded={open}
          aria-controls="gallery-playlist"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close player" : "Listen on Spotify"}
        </button>
      </div>
      {open && (
        <div id="gallery-playlist">
          <iframe
            src={playlist.embedUrl}
            title={`${artistName}’s Spotify playlist`}
            width="100%"
            height="352"
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
