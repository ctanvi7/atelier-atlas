"use client";
import { useTexture } from "@react-three/drei";
import { SRGBColorSpace } from "three";
import type { Artwork } from "@/lib/data";
import { artworkSize } from "@/lib/scene";
export default function ArtworkFrame({
  work,
  position,
  rotation = 0,
  onSelect,
  design = "gold",
  size,
}: {
  work: Artwork;
  position: [number, number, number];
  rotation?: number;
  onSelect: () => void;
  design?: "gold";
  size?: { width: number; height: number };
}) {
  const texture = useTexture(work.image);
  texture.colorSpace = SRGBColorSpace;
  const { width: w, height: h } = size ?? artworkSize(work);
  const border = 0.095;
  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      userData={{ frameDesign: design }}
    >
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[w + 0.32, h + 0.32, 0.13]} />
        <meshStandardMaterial color="#dbc9a2" roughness={0.7} />
      </mesh>
      {([-1, 1] as const).map((sign) => (
        <group key={sign}>
          <mesh position={[sign * (w / 2 + border / 2), 0, 0.065]}>
            <boxGeometry args={[border, h + border * 2, 0.16]} />
            <meshStandardMaterial
              color="#ad8544"
              metalness={0.65}
              roughness={0.34}
            />
          </mesh>
          <mesh position={[0, sign * (h / 2 + border / 2), 0.065]}>
            <boxGeometry args={[w, border, 0.16]} />
            <meshStandardMaterial
              color="#b18b50"
              metalness={0.65}
              roughness={0.34}
            />
          </mesh>
          <mesh position={[sign * (w / 2 + 0.01), 0, 0.15]}>
            <boxGeometry args={[0.016, h, 0.025]} />
            <meshStandardMaterial
              color="#e3c887"
              metalness={0.65}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
      <mesh
        position={[0, 0, 0.075]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
}
