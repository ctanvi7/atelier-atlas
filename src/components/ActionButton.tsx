"use client";
import { useRef, type ButtonHTMLAttributes } from "react";
/** Activate a deliberate touch on release; browsers can suppress the click after a look gesture. */
export default function ActionButton({
  onActivate,
  children,
  ...props
}: Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onClick"
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onPointerCancel"
> & { onActivate: () => void }) {
  const touch = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressClickUntil = useRef(0);
  return (
    <button
      {...props}
      onPointerDown={(e) => {
        if (e.pointerType === "touch")
          touch.current = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            moved: false,
          };
      }}
      onPointerMove={(e) => {
        const t = touch.current;
        if (
          t &&
          t.id === e.pointerId &&
          Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8
        )
          t.moved = true;
      }}
      onPointerCancel={() => {
        touch.current = null;
      }}
      onPointerUp={(e) => {
        const t = touch.current;
        touch.current = null;
        if (!t || t.id !== e.pointerId || t.moved || props.disabled) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < bounds.left ||
          e.clientX > bounds.right ||
          e.clientY < bounds.top ||
          e.clientY > bounds.bottom
        )
          return;
        suppressClickUntil.current = performance.now() + 700;
        onActivate();
      }}
      onClick={(e) => {
        if (e.detail === 0 || performance.now() > suppressClickUntil.current)
          onActivate();
        else e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
