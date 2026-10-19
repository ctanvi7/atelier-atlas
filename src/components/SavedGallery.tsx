"use client";
import { useEffect, useState } from "react";
import type { Artist } from "@/lib/data";
import { readDraft } from "@/lib/studio";
import Gallery from "./Gallery";

export default function SavedGallery({ artist }: { artist: Artist }) {
  const [state, setState] = useState<{
    artist: Artist;
    revision: number;
    local: boolean;
    error: string;
  }>();
  useEffect(() => {
    let active = true;
    let generation = 0;
    const refresh = async () => {
      const current = ++generation;
      try {
        const draft = await readDraft(artist.slug);
        if (active && current === generation)
          setState({
            artist: draft ? { ...artist, ...draft } : artist,
            revision: current,
            local: !!draft,
            error: "",
          });
      } catch {
        if (active && current === generation)
          setState({
            artist,
            revision: current,
            local: false,
            error:
              "Browser drafts could not be loaded. Showing the sample collection.",
          });
      }
    };
    void refresh();
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("atelier-studio")
        : null;
    if (channel)
      channel.onmessage = (event) => {
        if (event.data === artist.slug) void refresh();
      };
    return () => {
      active = false;
      channel?.close();
    };
  }, [artist]);
  if (!state)
    return (
      <p className="gallery-loading" role="status">
        Opening the collection…
      </p>
    );
  return (
    <>
      {state.error && (
        <p className="draft-notice" role="status">
          {state.error}
        </p>
      )}
      {state.local && (
        <p className="draft-notice">
          Local studio preview · saved in this browser only
        </p>
      )}
      <Gallery key={state.revision} artist={state.artist} />
    </>
  );
}
