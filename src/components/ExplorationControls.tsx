"use client";
import { useEffect, type RefObject } from "react";
import ActionButton from "./ActionButton";
export type WalkInput = {
  keys: Set<string>;
  pad: Set<string>;
  yaw: number;
  pitch: number;
  dragged: boolean;
  invalidate: () => void;
};
export const createWalkInput = (): WalkInput => ({
  keys: new Set(),
  pad: new Set(),
  yaw: 0,
  pitch: 0,
  dragged: false,
  invalidate: () => {},
});
export function clearWalkInput(input: WalkInput) {
  input.keys.clear();
  input.pad.clear();
  input.yaw = 0;
  input.pitch = 0;
}
export default function ExplorationControls({
  exploring,
  onExplore,
  input,
  disabled,
}: {
  exploring: boolean;
  onExplore: () => void;
  input: RefObject<WalkInput>;
  disabled: boolean;
}) {
  useEffect(() => {
    const clear = () => clearWalkInput(input.current);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      clear();
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, [input]);
  return (
    <div className="exploration-controls">
      <ActionButton
        className="explore-toggle"
        aria-pressed={exploring}
        onActivate={onExplore}
        disabled={disabled}
      >
        {exploring ? "Walking enabled" : "Walk through the gallery"}
      </ActionButton>
      <p id="walking-instructions">
        {exploring
          ? "WASD or arrow keys to walk. Drag the room to look. On touch, hold an on-screen arrow and swipe the room to look."
          : "Explore freely, or use previous / next for a guided view."}{" "}
        <span>Reset view returns to the entrance.</span>
      </p>
    </div>
  );
}

export function WalkPad({
  input,
  disabled,
}: {
  input: RefObject<WalkInput>;
  disabled: boolean;
}) {
  return (
    <div className="walk-pad" role="group" aria-label="Walking controls">
      {[
        ["forward", "↑", "Walk forward"],
        ["left", "←", "Step left"],
        ["back", "↓", "Walk backward"],
        ["right", "→", "Step right"],
      ].map(([dir, glyph, label]) => (
        <button
          key={dir}
          aria-label={label}
          disabled={disabled}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            input.current.pad.add(dir);
            input.current.invalidate();
          }}
          onPointerUp={() => input.current.pad.delete(dir)}
          onPointerCancel={() => input.current.pad.delete(dir)}
          onLostPointerCapture={() => input.current.pad.delete(dir)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              input.current.pad.add(dir);
              input.current.invalidate();
            }
          }}
          onKeyUp={() => input.current.pad.delete(dir)}
          onBlur={() => input.current.pad.delete(dir)}
        >
          {glyph}
        </button>
      ))}
    </div>
  );
}
