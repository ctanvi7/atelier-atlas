export default function Icon({
  kind = "arrow",
}: {
  kind?: "arrow" | "pause" | "star";
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
      {kind === "arrow" ? (
        <path d="M5 19 19 5M5 5h14v14" />
      ) : kind === "pause" ? (
        <path d="M9 5v14M15 5v14" />
      ) : (
        <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />
      )}
    </svg>
  );
}
