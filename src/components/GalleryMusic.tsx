"use client";
import { useId, useState } from "react";
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
  const playerId = useId();
  const playlist = spotifyPlaylist(playlistUrl);
  if (!playlist) return null;
  return (
    <section
      className={`gallery-music ${compact ? "music-compact" : ""}`}
      aria-label="Gallery soundtrack"
    >
      <div className="music-heading">
        <div>
          <p className="eyebrow">{compact ? "SPOTIFY" : "SOUNDTRACK"}</p>
          <p className="music-credit">Selected by {artistName}</p>
        </div>
        <button
          className="text-button icon-button"
          aria-label={open ? "Stop music" : "Open Spotify player"}
          title={open ? "Stop music" : "Open Spotify player"}
          type="button"
          aria-expanded={open}
          aria-controls={playerId}
          onClick={() => setOpen(!open)}
        >
          <Icon kind={open ? "stop" : "music"} />
        </button>
      </div>
      {open && (
        <div id={playerId}>
          <iframe
            src={playlist.embedUrl}
            title={`${artistName}’s Spotify playlist`}
            width="100%"
            height={compact ? "152" : "352"}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      <p className="music-note">
        {open ? "Press play inside Spotify." : "Player stopped."}{" "}
        <a href={playlist.url} target="_blank" rel="noopener noreferrer">
          Open playlist in Spotify <Icon />
        </a>
      </p>
    </section>
  );
}
