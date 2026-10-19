"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, type RefObject } from "react";
import { SRGBColorSpace } from "three";
import { useProgress, useTexture } from "@react-three/drei";
import type { Artist } from "@/lib/data";
import {
  createExhibition,
  ENTRANCE,
  DOOR_HALF_WIDTH,
  type ExhibitionLayout,
  type Point,
} from "@/lib/scene";
import ArtworkFrame from "./ArtworkFrame";
import WalkingCamera from "./WalkingCamera";
import ExhibitionLabel from "./ExhibitionLabel";
import type { WalkInput } from "./ExplorationControls";
export type GalleryRoomProps = {
  artist: Artist;
  selected: number | null;
  request: number;
  exploring: boolean;
  blocked: boolean;
  input: RefObject<WalkInput>;
  onInspect: (n: number) => void;
  onRoomChange: (room: number) => void;
};
function Box({
  position,
  size,
  color,
}: {
  position: Point;
  size: Point;
  color: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}
function Architecture({ layout }: { layout: ExhibitionLayout }) {
  const oak = useTexture("/materials/oak.svg");
  oak.colorSpace = SRGBColorSpace;
  return (
    <>
      {layout.walls.map((w, i) => (
        <group key={i}>
          <Box
            position={[w.x, w.y, w.z]}
            size={[w.width, w.height, w.depth]}
            color="#eee8dc"
          />
          {[0.18, 0.65, 5.5, 5.7]
            .filter((y) => y > w.y - w.height / 2 && y < w.y + w.height / 2)
            .map((y) => (
              <Box
                key={y}
                position={[w.x, y, w.z]}
                size={[w.width + 0.1, 0.065, w.depth + 0.1]}
                color="#dfd4c0"
              />
            ))}
        </group>
      ))}
      {layout.rooms.map((room) => (
        <group key={room.index} name={`exhibition-room-${room.index + 1}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, room.centerZ]}>
            <planeGeometry args={[12, 14]} />
            <meshStandardMaterial map={oak} roughness={0.86} />
          </mesh>
          <Box
            position={[0, 6, room.centerZ]}
            size={[12, 0.15, 14]}
            color="#f3ede2"
          />
          <pointLight
            position={[0, 4.8, room.centerZ]}
            intensity={30}
            distance={12}
            color="#ffefd8"
          />
          {room.index < layout.rooms.length - 1 &&
            [-1, 1].map((side) => (
              <Box
                key={side}
                position={[
                  side * (DOOR_HALF_WIDTH + 0.07),
                  1.8,
                  room.centerZ - 7,
                ]}
                size={[0.1, 3.6, 0.34]}
                color="#dfd4c0"
              />
            ))}
        </group>
      ))}
    </>
  );
}
function Room({
  layout,
  ...props
}: GalleryRoomProps & { layout: ExhibitionLayout }) {
  const { artist, input, onInspect } = props;
  return (
    <>
      <color attach="background" args={["#eee7db"]} />
      <ambientLight intensity={1.15} />
      <hemisphereLight args={["#fff6e5", "#a68a65", 0.8]} />
      <directionalLight position={[0, 6, 4]} intensity={1.3} />
      <Architecture layout={layout} />
      {artist.works.map((work, i) => {
        const p = layout.placements[i];
        return (
          <group key={work.id}>
            <ArtworkFrame
              work={work}
              position={p.position}
              rotation={p.rotation}
              size={{ width: p.width, height: p.height }}
              onSelect={() => {
                if (!input.current.dragged && !props.blocked) onInspect(i);
              }}
            />
            <ExhibitionLabel
              position={[
                p.position[0],
                p.position[1] - p.height / 2 - 0.35,
                p.position[2],
              ]}
              rotation={p.rotation}
              title={work.title}
              subtitle={artist.name}
              description={work.medium}
            />
          </group>
        );
      })}
      <ExhibitionLabel
        position={[-3.4, 2.65, 7.84]}
        rotation={Math.PI}
        title={artist.name}
        subtitle={`${artist.city} · ${artist.discipline}`}
        description={artist.bio}
        introduction
      />
      <WalkingCamera layout={layout} {...props} />
    </>
  );
}
export default function GalleryRoom(props: GalleryRoomProps) {
  const { active } = useProgress();
  const layout = useMemo(
    () => createExhibition(props.artist.works),
    [props.artist.works],
  );
  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );
  if (!layout.rooms.length)
    return (
      <div className="scene-message">
        The next collection is being prepared.
      </div>
    );
  return (
    <>
      <Canvas
        frameloop="demand"
        camera={{ position: ENTRANCE, fov: 58, near: 0.1, far: 80 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        aria-label="Three-dimensional exhibition room. Enable walking or use artwork navigation to explore."
      >
        <Suspense fallback={null}>
          <Room layout={layout} {...props} />
        </Suspense>
      </Canvas>
      {active && (
        <div className="scene-message texture-loading-overlay" role="status">
          Hanging the collection…
        </div>
      )}
    </>
  );
}
