"use client";
import Icon from "./Icon";
import type { Artwork } from "@/lib/data";
export default function GalleryControls({
  works,
  selected,
  onSelect,
  onInspect,
}: {
  works: Artwork[];
  selected: number | null;
  onSelect: (n: number | null) => void;
  onInspect: (n: number) => void;
}) {
  return (
    <div className="gallery-controls">
      <button
        aria-label="Previous artwork"
        onClick={() =>
          onSelect(
            selected === null
              ? works.length - 1
              : (selected + works.length - 1) % works.length,
          )
        }
      >
        ←
      </button>
      <div className="current-work" aria-live="polite">
        <span className="eyebrow">
          {selected === null
            ? "THE ENTRANCE"
            : `WORK ${selected + 1} OF ${works.length}`}
        </span>
        <span>
          {selected === null
            ? "A moment to take it all in"
            : works[selected].title}
        </span>
      </div>
      <button
        aria-label="Next artwork"
        onClick={() =>
          onSelect(selected === null ? 0 : (selected + 1) % works.length)
        }
      >
        →
      </button>
      <span className="control-divider" />
      <button
        className="inspect-button"
        onClick={() => onInspect(selected ?? 0)}
      >
        View artwork <Icon />
      </button>
      <button className="reset-button" onClick={() => onSelect(null)}>
        Reset view
      </button>
    </div>
  );
}
