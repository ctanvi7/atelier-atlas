import type { Artwork } from "./data";
export type Point = [number, number, number];
export type Obstacle = { x: number; z: number; width: number; depth: number };
export type Wall = Obstacle & { height: number; y: number };
export type Placement = {
  position: Point;
  rotation: number;
  camera: Point;
  width: number;
  height: number;
  room: number;
};
export type RoomLayout = { index: number; centerZ: number; works: number[] };
export type ExhibitionLayout = {
  rooms: RoomLayout[];
  placements: Placement[];
  walls: Wall[];
  obstacles: Obstacle[];
};
export const EYE_HEIGHT = 2.45;
export const ENTRANCE: Point = [0, EYE_HEIGHT, 6.5];
export const ROOM_DEPTH = 14;
export const BODY_RADIUS = 0.42;
export const DOOR_HALF_WIDTH = 1.7;

export function artworkSize(work: Artwork, availableWidth = 2.6) {
  if (!(work.width > 0 && work.height > 0))
    throw new Error("Artwork dimensions must be positive.");
  const scale = Math.min(availableWidth / work.width, 2.1 / work.height);
  return { width: work.width * scale, height: work.height * scale };
}

/** Up to eight works per room; wall runs reserve space for doorways and frames. */
export function createExhibition(works: Artwork[]): ExhibitionLayout {
  if (works.length > 24)
    throw new Error("This exhibition layout supports at most 24 artworks.");
  const rooms = Array.from(
    { length: Math.ceil(works.length / 8) },
    (_, index) => ({
      index,
      centerZ: 1 - index * ROOM_DEPTH,
      works: Array.from(
        { length: Math.min(8, works.length - index * 8) },
        (_, i) => index * 8 + i,
      ),
    }),
  );
  const placements: Placement[] = [];
  const walls: Wall[] = [];
  const wall = (
    x: number,
    z: number,
    width: number,
    depth: number,
    height = 6,
    y = 3,
  ) => walls.push({ x, z, width, depth, height, y });
  for (const room of rooms) {
    const offset = -room.index * ROOM_DEPTH;
    wall(-6, room.centerZ, 0.2, 14);
    wall(6, room.centerZ, 0.2, 14);
    if (room.index === 0) wall(0, 8, 12, 0.2);
    const backZ = -6 + offset;
    if (room.index < rooms.length - 1) {
      const segmentWidth = 6 - DOOR_HALF_WIDTH;
      wall(-(6 + DOOR_HALF_WIDTH) / 2, backZ, segmentWidth, 0.2);
      wall((6 + DOOR_HALF_WIDTH) / 2, backZ, segmentWidth, 0.2);
      wall(0, backZ, DOOR_HALF_WIDTH * 2, 0.2, 2.4, 4.8);
    } else wall(0, backZ, 12, 0.2);

    const place = (
      index: number,
      position: Point,
      rotation: number,
      maxWidth: number,
    ) => {
      const size = artworkSize(works[index], maxWidth);
      const normal = [Math.sin(rotation), 0, Math.cos(rotation)];
      placements[index] = {
        position,
        rotation,
        ...size,
        room: room.index,
        camera: [
          position[0] + normal[0] * 4.5,
          EYE_HEIGHT,
          position[2] + normal[2] * 4.5,
        ],
      };
    };
    // Two distinct wall bays flank the doorway, even in a one-room exhibition.
    room.works
      .slice(0, 2)
      .forEach((index, i) =>
        place(
          index,
          [i === 0 ? -3.65 : 3.65, EYE_HEIGHT, backZ + 0.14],
          0,
          2.6,
        ),
      );
    const sideWorks = room.works.slice(2);
    for (const side of [-1, 1]) {
      const indices = sideWorks.filter(
        (_, i) => i % 2 === (side === -1 ? 0 : 1),
      );
      const sizes = indices.map((i) => artworkSize(works[i]));
      // Almost eleven metres of wall; equal breathing room around actual framed widths.
      const length = 10.8;
      const gap =
        (length - sizes.reduce((sum, s) => sum + s.width + 0.32, 0)) /
        (indices.length + 1);
      let along = -4.9 + gap;
      indices.forEach((index, i) => {
        const framed = sizes[i].width + 0.32;
        place(
          index,
          [side * 5.86, EYE_HEIGHT, offset + along + framed / 2],
          side === -1 ? Math.PI / 2 : -Math.PI / 2,
          2.6,
        );
        along += framed + gap;
      });
    }
  }
  const obstacles: Obstacle[] = walls
    .filter((w) => w.y - w.height / 2 < EYE_HEIGHT)
    .map((w) => ({ ...w }));
  // Frames protrude from walls. Include the whole frame, not just its artwork surface.
  placements.forEach((p) =>
    obstacles.push({
      x: p.position[0],
      z: p.position[2],
      width:
        Math.abs(Math.cos(p.rotation)) * (p.width + 0.36) +
        Math.abs(Math.sin(p.rotation)) * 0.4,
      depth:
        Math.abs(Math.sin(p.rotation)) * (p.width + 0.36) +
        Math.abs(Math.cos(p.rotation)) * 0.4,
    }),
  );
  return { rooms, placements, walls, obstacles };
}

export function isWalkable(position: Point, layout: ExhibitionLayout) {
  const [x, , z] = position;
  if (
    !layout.rooms.length ||
    Math.abs(x) > 6 - BODY_RADIUS ||
    z > 8 - BODY_RADIUS ||
    z < 8 - layout.rooms.length * ROOM_DEPTH + BODY_RADIUS
  )
    return false;
  return !layout.obstacles.some(
    (o) =>
      Math.abs(x - o.x) < o.width / 2 + BODY_RADIUS &&
      Math.abs(z - o.z) < o.depth / 2 + BODY_RADIUS,
  );
}
/** Swept small steps prevent tunnelling; separate axes allow sliding along walls. */
export function moveWithinRoom(
  position: Point,
  dx: number,
  dz: number,
  layout: ExhibitionLayout,
): Point {
  const next: Point = [position[0], EYE_HEIGHT, position[2]];
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  for (let i = 0; i < steps; i++) {
    const x: Point = [next[0] + dx / steps, EYE_HEIGHT, next[2]];
    if (isWalkable(x, layout)) next[0] = x[0];
    const z: Point = [next[0], EYE_HEIGHT, next[2] + dz / steps];
    if (isWalkable(z, layout)) next[2] = z[2];
  }
  return next;
}
export function roomAt(z: number, layout: ExhibitionLayout) {
  return Math.max(
    0,
    Math.min(layout.rooms.length - 1, Math.floor((8 - z) / ROOM_DEPTH)),
  );
}
/** Check the entire segment against obstacles expanded by the visitor radius. */
function clearSegment(from: Point, to: Point, layout: ExhibitionLayout) {
  return !layout.obstacles.some((obstacle) => {
    let enter = 0;
    let leave = 1;
    for (const [axis, center, extent] of [
      [0, obstacle.x, obstacle.width / 2 + BODY_RADIUS],
      [2, obstacle.z, obstacle.depth / 2 + BODY_RADIUS],
    ]) {
      const delta = to[axis] - from[axis];
      if (Math.abs(delta) < 1e-10) {
        if (Math.abs(from[axis] - center) > extent) return false;
      } else {
        const first = (center - extent - from[axis]) / delta;
        const last = (center + extent - from[axis]) / delta;
        enter = Math.max(enter, Math.min(first, last));
        leave = Math.min(leave, Math.max(first, last));
        if (enter > leave) return false;
      }
    }
    return true;
  });
}

/** Leave perimeter recesses before entering the central aisle and doorways. */
export function guidedPath(
  from: Point,
  to: Point,
  layout: ExhibitionLayout,
): Point[] {
  const source = roomAt(from[2], layout),
    target = roomAt(to[2], layout);
  if (source === target && clearSegment(from, to, layout)) return [to];
  const center = layout.rooms[source].centerZ;
  // Back-wall frames and side-wall frames leave a clear transverse aisle
  // 1.1m inside each end. Moving longitudinally first escapes the recesses
  // beside back-wall frames without cutting across their protruding edges.
  const safeZ = Math.max(center - 5.9, Math.min(center + 5.9, from[2]));
  return [
    [from[0], EYE_HEIGHT, safeZ],
    [0, EYE_HEIGHT, safeZ],
    [0, EYE_HEIGHT, to[2]],
    to,
  ];
}
