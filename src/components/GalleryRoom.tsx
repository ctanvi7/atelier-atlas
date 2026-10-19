"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { Artist } from "@/lib/data";
import ArtworkFrame from "./ArtworkFrame";
import { useReducedMotion } from "./useMotion";
import { placements } from "@/lib/scene";
import { useProgress, useTexture } from "@react-three/drei";
import { SRGBColorSpace } from "three";
function Camera({ selected }: { selected: number | null }) {
  const { camera, invalidate } = useThree();
  const reduce = useReducedMotion();
  const look = useRef(new Vector3(0, 2.45, -5.5));
  useEffect(() => {
    invalidate();
  }, [selected, invalidate]);
  useFrame((_, delta) => {
    const target =
      selected === null
        ? new Vector3(0, 2.7, 7)
        : new Vector3(...placements[selected].camera);
    const aim =
      selected === null
        ? new Vector3(0, 2.45, -5.5)
        : new Vector3(...placements[selected].position);
    const blend = reduce ? 1 : 1 - Math.exp(-delta * 3.5);
    camera.position.lerp(target, blend);
    look.current.lerp(aim, blend);
    camera.position.clamp(
      new Vector3(-4.5, 1, -4.5),
      new Vector3(4.5, 4.5, 7.5),
    );
    camera.lookAt(look.current);
    if (
      camera.position.distanceTo(target) > 0.001 ||
      look.current.distanceTo(aim) > 0.001
    )
      invalidate();
  });
  return null;
}
function Box({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}
function WoodenFloor() {
  const texture = useTexture("/materials/oak.svg");
  texture.colorSpace = SRGBColorSpace;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]}>
      <planeGeometry args={[12, 14]} />
      <meshStandardMaterial map={texture} roughness={0.86} />
    </mesh>
  );
}
function Room({
  artist,
  selected,
  onInspect,
}: {
  artist: Artist;
  selected: number | null;
  onInspect: (n: number) => void;
}) {
  return (
    <>
      <color attach="background" args={["#eee7db"]} />
      <ambientLight intensity={1.3} />
      <hemisphereLight args={["#fff6e5", "#a68a65", 1.1]} />
      <directionalLight position={[0, 6, 4]} intensity={1.4} />
      <Box position={[0, 3, -6]} size={[12.2, 6, 0.2]} color="#eee8dc" />
      <Box position={[-6, 3, 1]} size={[0.2, 6, 14]} color="#e8dfce" />
      <Box position={[6, 3, 1]} size={[0.2, 6, 14]} color="#eee5d5" />
      <Box position={[0, 6, 1]} size={[12, 0.15, 14]} color="#f3ede2" />
      <WoodenFloor />
      {[0.22, 1.05, 5.5, 5.7].map((y) => (
        <group key={y}>
          <Box
            position={[0, y, -5.84]}
            size={[12, 0.075, 0.13]}
            color="#dfd4c0"
          />
          <Box
            position={[-5.84, y, 1]}
            size={[0.13, 0.075, 14]}
            color="#dfd4c0"
          />
          <Box
            position={[5.84, y, 1]}
            size={[0.13, 0.075, 14]}
            color="#dfd4c0"
          />
        </group>
      ))}
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <Box
          key={x}
          position={[x, 3.1, -5.85]}
          size={[0.045, 4.65, 0.035]}
          color="#e0d5c3"
        />
      ))}
      {artist.works.map((work, i) => (
        <group key={work.id}>
          <ArtworkFrame
            work={work}
            position={placements[i].position}
            rotation={placements[i].rotation}
            onSelect={() => onInspect(i)}
          />
          <pointLight
            position={[
              placements[i].position[0] * 0.78,
              4.7,
              placements[i].position[2] * 0.75,
            ]}
            intensity={7}
            distance={6}
            color="#ffe9c5"
          />
        </group>
      ))}
      <Camera selected={selected} />
    </>
  );
}
export default function GalleryRoom(props: {
  artist: Artist;
  selected: number | null;
  onInspect: (n: number) => void;
}) {
  const { active } = useProgress();
  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );
  return (
    <>
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 2.7, 7], fov: 58, near: 0.1, far: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        aria-label="Three-dimensional exhibition room. Use the artwork navigation controls to explore."
      >
        <Suspense fallback={null}>
          <Room {...props} />
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
