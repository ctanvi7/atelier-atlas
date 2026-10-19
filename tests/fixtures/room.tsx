import { createRoot } from "react-dom/client";
import { useState, useRef } from "react";
import GalleryRoom from "../../src/components/GalleryRoom";
import GalleryControls from "../../src/components/GalleryControls";
import ExplorationControls, {
  createWalkInput,
  WalkPad,
} from "../../src/components/ExplorationControls";
import { artists } from "../../src/lib/data";
const count = Number(new URLSearchParams(location.search).get("count") ?? 24);
const artist = {
  ...artists[0],
  works: Array.from({ length: count }, (_, i) => ({
    ...artists[0].works[i % 6],
    id: `fixture-${i}`,
  })),
};
function Fixture() {
  const [selected, setSelected] = useState<number | null>(null);
  const [request, setRequest] = useState(0);
  const [exploring, setExploring] = useState(false);
  const [room, setRoom] = useState(0);
  const input = useRef(createWalkInput());
  const [inspected, setInspected] = useState<number | null>(null);
  return (
    <>
      <h1>{count} artwork layout</h1>
      <div style={{ height: 560, position: "relative" }}>
        {exploring && <WalkPad input={input} disabled={false} />}
        <GalleryRoom
          artist={artist}
          selected={selected}
          request={request}
          exploring={exploring}
          blocked={false}
          input={input}
          onInspect={setInspected}
          onRoomChange={setRoom}
        />
      </div>
      <p aria-live="polite">
        Room {room + 1} of {Math.ceil(count / 8)}
      </p>
      <ExplorationControls
        exploring={exploring}
        onExplore={() => {
          setExploring(true);
          setRequest((n) => n + 1);
        }}
        input={input}
        disabled={false}
      />
      <GalleryControls
        works={artist.works}
        selected={selected}
        onSelect={(n) => {
          setSelected(n);
          setExploring(false);
          setRequest((i) => i + 1);
        }}
        onInspect={setInspected}
      />
      <p>Inspected: {inspected ?? "none"}</p>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
