import type { Artwork } from "./data";
export const placements: {
  position: [number, number, number];
  rotation: number;
  camera: [number, number, number];
}[] = [
  { position: [-3, 2.65, -5.86], rotation: 0, camera: [-3, 2.65, -1.5] },
  { position: [0, 2.65, -5.86], rotation: 0, camera: [0, 2.65, -1.5] },
  { position: [3, 2.65, -5.86], rotation: 0, camera: [3, 2.65, -1.5] },
  {
    position: [-5.86, 2.65, -2.5],
    rotation: Math.PI / 2,
    camera: [-1.5, 2.65, -2.5],
  },
  {
    position: [5.86, 2.65, -2.5],
    rotation: -Math.PI / 2,
    camera: [1.5, 2.65, -2.5],
  },
  {
    position: [5.86, 2.65, 1.2],
    rotation: -Math.PI / 2,
    camera: [1.5, 2.65, 1.2],
  },
];

export function artworkSize(work: Artwork) {
  const scale = Math.min(2.3 / work.width, 2.1 / work.height);
  return { width: work.width * scale, height: work.height * scale };
}
