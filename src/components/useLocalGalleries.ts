"use client";
import { useEffect, useState } from "react";
import type { Artist } from "@/lib/data";
import { listGalleries } from "@/lib/studio";
export function useLocalGalleries() {
  const [galleries, setGalleries] = useState<Artist[]>([]);
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let generation = 0;
    const refresh = async () => {
      const current = ++generation;
      try {
        const values = await listGalleries();
        if (active && generation === current) {
          setGalleries(values);
          setRevision(current);
          setError("");
        }
      } catch {
        if (active && generation === current)
          setError(
            "Local galleries could not be loaded. Check browser storage and reload.",
          );
      } finally {
        if (active && generation === current) setReady(true);
      }
    };
    void refresh();
    window.addEventListener("atelier-galleries", refresh);
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("atelier-studio")
        : null;
    if (channel) channel.onmessage = refresh;
    return () => {
      active = false;
      window.removeEventListener("atelier-galleries", refresh);
      channel?.close();
    };
  }, []);
  return { galleries, ready, error, revision };
}
