export default function Icon({
  kind = "arrow",
}: {
  kind?:
    | "arrow"
    | "pause"
    | "star"
    | "play"
    | "stop"
    | "expand"
    | "collapse"
    | "reset"
    | "eye"
    | "walk"
    | "grid"
    | "cube";
}) {
  return (
    <svg
      className="icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path
        d={
          {
            arrow: "M5 19 19 5M5 5h14v14",
            pause: "M9 5v14M15 5v14",
            star: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z",
            play: "m8 5 11 7-11 7Z",
            stop: "M6 6h12v12H6Z",
            expand: "M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5",
            collapse: "M4 9h5V4m6 0v5h5M9 20v-5H4m11 5v-5h5",
            reset: "M4 10a8 8 0 1 1 1 8M4 4v6h6",
            eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm7 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
            walk: "M14 3h.01M8 21l3-7 3 3v4M7 12l2-5h4l2 5h3M12 7l-1 7",
            grid: "M4 4h6v6H4Zm10 0h6v6h-6ZM4 14h6v6H4Zm10 0h6v6h-6Z",
            cube: "m12 3 9 5v9l-9 5-9-5V8Zm0 10v9M3 8l9 5 9-5M12 3v10",
          }[kind]
        }
      />
    </svg>
  );
}
