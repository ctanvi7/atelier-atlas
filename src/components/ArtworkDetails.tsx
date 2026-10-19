"use client";
import { useEffect, useRef } from "react";
import type { Artist, Artwork } from "@/lib/data";
export default function ArtworkDetails({
  artist,
  work,
  onClose,
}: {
  artist: Artist;
  work: Artwork;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const active = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      dialog.close();
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="art-dialog"
      aria-labelledby="art-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        className="dialog-close"
        aria-label="Close artwork details"
        autoFocus
        onClick={onClose}
      >
        ×
      </button>
      <div className="detail-image">
        <img
          src={work.image}
          width={work.width}
          height={work.height}
          alt={`${work.title}, an abstract sample composition`}
        />
      </div>
      <div className="detail-copy">
        <p className="eyebrow">{artist.city} · DEMONSTRATION COLLECTION</p>
        <h2 id="art-title">{work.title}</h2>
        <p className="detail-artist">{artist.name}</p>
        <p>{work.description}</p>
        <p className="medium">
          {work.medium}
          <br />
          Original illustration · CC0
        </p>
      </div>
    </dialog>
  );
}
