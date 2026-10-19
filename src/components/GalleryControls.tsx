"use client";
import Icon from "./Icon";
import ActionButton from "./ActionButton";
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
      <ActionButton
        aria-label="Previous artwork"
        onActivate={() =>
          onSelect(
            selected === null
              ? works.length - 1
              : (selected + works.length - 1) % works.length,
          )
        }
      >
        ←
      </ActionButton>
      <div className="current-work" aria-live="polite">
        <span className="eyebrow">
          {selected === null
            ? "THE ENTRANCE"
            : `WORK ${selected + 1} OF ${works.length}`}
        </span>
        <span>{selected === null ? "Welcome" : works[selected].title}</span>
      </div>
      <ActionButton
        aria-label="Next artwork"
        onActivate={() =>
          onSelect(selected === null ? 0 : (selected + 1) % works.length)
        }
      >
        →
      </ActionButton>
      <span className="control-divider" />
      <ActionButton
        className="inspect-button icon-button"
        aria-label="View artwork"
        title="View artwork"
        onActivate={() => onInspect(selected ?? 0)}
      >
        <Icon kind="eye" />
      </ActionButton>
      <ActionButton
        className="reset-button icon-button"
        aria-label="Reset view"
        title="Reset view"
        onActivate={() => onSelect(null)}
      >
        <Icon kind="reset" />
      </ActionButton>
    </div>
  );
}
