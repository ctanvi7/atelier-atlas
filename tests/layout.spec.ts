import { test, expect } from "@playwright/test";
import { artists, type Artwork } from "../src/lib/data";
import {
  createExhibition,
  ENTRANCE,
  isWalkable,
  moveWithinRoom,
  guidedPath,
  type Point,
} from "../src/lib/scene";
function collection(count: number): Artwork[] {
  return Array.from({ length: count }, (_, i) => ({
    ...artists[0].works[i % 6],
    id: `test-${i}`,
    width: [600, 800, 2000, 300][i % 4],
    height: [800, 600, 300, 1800][i % 4],
  }));
}
for (const count of [1, 8, 9, 16, 17, 24])
  test(`${count} works: room count, frame spacing, proportions and safe guided travel`, () => {
    const works = collection(count),
      layout = createExhibition(works);
    expect(layout.rooms).toHaveLength(Math.ceil(count / 8));
    expect(layout.placements).toHaveLength(count);
    for (const [i, p] of layout.placements.entries()) {
      expect(p.width / p.height).toBeCloseTo(
        works[i].width / works[i].height,
        10,
      );
      expect(p.width).toBeLessThanOrEqual(2.6);
      expect(p.height).toBeLessThanOrEqual(2.1);
      expect(isWalkable(p.camera, layout)).toBeTruthy();
      expect(
        Math.hypot(p.camera[0] - p.position[0], p.camera[2] - p.position[2]),
      ).toBeCloseTo(4.5);
      for (const q of layout.placements.slice(i + 1))
        if (q.room === p.room && q.rotation === p.rotation) {
          const distance = Math.hypot(
            p.position[0] - q.position[0],
            p.position[2] - q.position[2],
          );
          expect(distance - (p.width + q.width) / 2 - 0.32).toBeGreaterThan(
            0.45,
          );
        }
    }
    for (const from of [ENTRANCE, ...layout.placements.map((p) => p.camera)])
      for (const target of [
        ENTRANCE,
        ...layout.placements.map((p) => p.camera),
      ]) {
        let current: Point = [...from];
        for (const next of guidedPath(from, target, layout)) {
          const start = [...current];
          for (let step = 1; step <= 20; step++) {
            const intended: Point = [
              start[0] + ((next[0] - start[0]) * step) / 20,
              2.45,
              start[2] + ((next[2] - start[2]) * step) / 20,
            ];
            expect(isWalkable(intended, layout)).toBeTruthy();
            current = moveWithinRoom(
              current,
              intended[0] - current[0],
              intended[2] - current[2],
              layout,
            );
          }
          expect(current[0]).toBeCloseTo(next[0], 5);
          expect(current[2]).toBeCloseTo(next[2], 5);
        }
      }
  });
test("swept collision stops walls, door jambs and frame surfaces, but allows connected rooms", () => {
  const layout = createExhibition(collection(24));
  const throughDoor = moveWithinRoom(ENTRANCE, 0, -38, layout);
  expect(throughDoor[2]).toBeCloseTo(-31.5, 2);
  expect(isWalkable(throughDoor, layout)).toBeTruthy();
  const blocked = moveWithinRoom([3, 2.45, 1], 0, -100, layout);
  expect(blocked[2]).toBeGreaterThan(-5.5);
  const side = moveWithinRoom(ENTRANCE, 100, 0, layout);
  expect(side[0]).toBeLessThan(5.5);
  const back = moveWithinRoom(ENTRANCE, 0, 100, layout);
  expect(back[2]).toBeLessThan(7.5);
  for (const p of layout.placements) {
    const moved = moveWithinRoom(
      p.camera,
      (p.position[0] - p.camera[0]) * 10,
      (p.position[2] - p.camera[2]) * 10,
      layout,
    );
    expect(isWalkable(moved, layout)).toBeTruthy();
    expect(
      Math.hypot(moved[0] - p.position[0], moved[2] - p.position[2]),
    ).toBeGreaterThanOrEqual(0.61);
  }
  expect(createExhibition([]).rooms).toHaveLength(0);
  expect(() => createExhibition(collection(25))).toThrow(/24/);
});

test("guided navigation remains clear after free exploration beside frames and partitions", () => {
  for (const count of [1, 8, 9, 16, 17, 24]) {
    const layout = createExhibition(collection(count));
    for (const room of layout.rooms) {
      for (const x of [-5.4, -5.1, -3, 0, 3, 5.1, 5.4]) {
        for (let z = room.centerZ - 6.4; z < room.centerZ + 6.5; z += 0.4) {
          const from: Point = [x, 2.45, z];
          if (!isWalkable(from, layout)) continue;
          for (const target of [
            ENTRANCE,
            ...layout.placements.map((p) => p.camera),
          ]) {
            let start = from;
            for (const next of guidedPath(from, target, layout)) {
              const steps = Math.ceil(
                Math.hypot(next[0] - start[0], next[2] - start[2]) / 0.08,
              );
              for (let step = 1; step <= steps; step++) {
                const point: Point = [
                  start[0] + ((next[0] - start[0]) * step) / steps,
                  2.45,
                  start[2] + ((next[2] - start[2]) * step) / steps,
                ];
                if (!isWalkable(point, layout)) {
                  throw new Error(
                    `Blocked ${count}-work route from ${from} to ${target} at ${point}`,
                  );
                }
              }
              start = next;
            }
          }
        }
      }
    }
  }
});
