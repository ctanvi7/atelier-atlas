"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { Euler, Vector3 } from "three";
import {
  ENTRANCE,
  EYE_HEIGHT,
  guidedPath,
  moveWithinRoom,
  roomAt,
  type ExhibitionLayout,
  type Point,
} from "@/lib/scene";
import { clearWalkInput, type WalkInput } from "./ExplorationControls";
import { useReducedMotion } from "./useMotion";
export default function WalkingCamera({
  layout,
  selected,
  request,
  exploring,
  blocked,
  input,
  onRoomChange,
}: {
  layout: ExhibitionLayout;
  selected: number | null;
  request: number;
  exploring: boolean;
  blocked: boolean;
  input: RefObject<WalkInput>;
  onRoomChange: (room: number) => void;
}) {
  const { camera, gl, invalidate } = useThree();
  const reduce = useReducedMotion();
  const route = useRef<Point[]>([]);
  const aim = useRef(new Vector3(0, EYE_HEIGHT, -6));
  const look = useRef(aim.current.clone());
  const angles = useRef({ yaw: 0, pitch: 0 });
  const lastRoom = useRef(-1);
  const dragging = useRef<{
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  useEffect(() => {
    input.current.invalidate = invalidate;
    return () => {
      input.current.invalidate = () => {};
      clearWalkInput(input.current);
    };
  }, [input, invalidate]);
  useEffect(() => {
    clearWalkInput(input.current);
    dragging.current = null;
    if (exploring) {
      route.current = [];
      const e = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
      angles.current = { yaw: e.y, pitch: e.x };
      if (!blocked) gl.domElement.focus({ preventScroll: true });
    } else {
      const target =
        selected === null ? ENTRANCE : layout.placements[selected].camera;
      aim.current.set(
        ...(selected === null
          ? ([0, EYE_HEIGHT, -6] as Point)
          : layout.placements[selected].position),
      );
      const direction = new Vector3();
      camera.getWorldDirection(direction);
      look.current.copy(camera.position).addScaledVector(direction, 4.5);
      if (reduce) {
        camera.position.set(...target);
        look.current.copy(aim.current);
        route.current = [];
        camera.lookAt(aim.current);
      } else
        route.current = guidedPath(
          camera.position.toArray() as Point,
          target,
          layout,
        );
    }
    invalidate();
  }, [
    selected,
    request,
    exploring,
    layout,
    camera,
    gl,
    input,
    invalidate,
    reduce,
  ]);
  useEffect(() => {
    if (blocked) {
      clearWalkInput(input.current);
      dragging.current = null;
    }
    invalidate();
  }, [blocked, input, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-describedby", "walking-instructions");
    const down = (e: PointerEvent) => {
      if (
        blocked ||
        e.button !== 0 ||
        (!e.isPrimary && e.pointerType !== "touch")
      )
        return;
      if (exploring && e.pointerType === "touch") e.preventDefault();
      input.current.dragged = false;
      dragging.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
      };
      if (exploring) {
        canvas.focus({ preventScroll: true });
        canvas.setPointerCapture(e.pointerId);
      }
    };
    const move = (e: PointerEvent) => {
      const d = dragging.current;
      if (!d || e.pointerId !== d.id || blocked) return;
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 6)
        input.current.dragged = true;
      if (exploring && input.current.dragged) {
        if (e.pointerType === "touch") e.preventDefault();
        input.current.yaw -= (e.clientX - d.x) * 0.004;
        input.current.pitch -= (e.clientY - d.y) * 0.003;
        invalidate();
      }
      d.x = e.clientX;
      d.y = e.clientY;
    };
    const up = () => {
      dragging.current = null;
    };
    const keydown = (e: KeyboardEvent) => {
      if (
        !exploring ||
        blocked ||
        document.activeElement !== canvas ||
        ![
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(e.key.toLowerCase())
      )
        return;
      e.preventDefault();
      input.current.keys.add(e.key.toLowerCase());
      invalidate();
    };
    const keyup = (e: KeyboardEvent) =>
      input.current.keys.delete(e.key.toLowerCase());
    const blur = () => {
      clearWalkInput(input.current);
      dragging.current = null;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", up);
    canvas.addEventListener("blur", blur);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("blur", blur);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      blur();
    };
  }, [exploring, blocked, gl, input, invalidate]);
  useFrame((_, elapsed) => {
    const dt = Math.min(elapsed, 0.15);
    if (!blocked && exploring) {
      const state = input.current;
      angles.current.yaw += state.yaw;
      angles.current.pitch = Math.max(
        -0.8,
        Math.min(0.8, angles.current.pitch + state.pitch),
      );
      state.yaw = 0;
      state.pitch = 0;
      camera.rotation.set(angles.current.pitch, angles.current.yaw, 0, "YXZ");
      const has = (...keys: string[]) =>
        keys.some((k) => state.keys.has(k) || state.pad.has(k));
      let forward =
        Number(has("w", "arrowup", "forward")) -
        Number(has("s", "arrowdown", "back"));
      let right =
        Number(has("d", "arrowright", "right")) -
        Number(has("a", "arrowleft", "left"));
      const length = Math.hypot(forward, right);
      if (length) {
        forward /= length;
        right /= length;
        const speed = (reduce ? 1.8 : 2.8) * dt;
        const yaw = angles.current.yaw;
        camera.position.set(
          ...moveWithinRoom(
            camera.position.toArray() as Point,
            (-Math.sin(yaw) * forward + Math.cos(yaw) * right) * speed,
            (-Math.cos(yaw) * forward - Math.sin(yaw) * right) * speed,
            layout,
          ),
        );
        invalidate();
      }
    } else if (!blocked && !exploring) {
      const next = route.current[0];
      if (next) {
        const target = new Vector3(...next);
        const delta = target.sub(camera.position);
        const distance = delta.length();
        const step = Math.min(distance, dt * 7);
        if (distance > 0.001) {
          delta.multiplyScalar(step / distance);
          camera.position.set(
            ...moveWithinRoom(
              camera.position.toArray() as Point,
              delta.x,
              delta.z,
              layout,
            ),
          );
        }
        if (distance < 0.025) route.current.shift();
        invalidate();
      }
      look.current.lerp(aim.current, reduce ? 1 : 1 - Math.exp(-dt * 5));
      camera.lookAt(look.current);
      if (look.current.distanceTo(aim.current) > 0.001) invalidate();
    }
    const room = roomAt(camera.position.z, layout);
    if (lastRoom.current !== room) {
      lastRoom.current = room;
      onRoomChange(room);
    }
    // Observable pose is useful for regression checks and diagnosing navigation.
    gl.domElement.dataset.position = camera.position
      .toArray()
      .map((n) => n.toFixed(3))
      .join(",");
    gl.domElement.dataset.rotation = [camera.rotation.x, camera.rotation.y]
      .map((n) => n.toFixed(3))
      .join(",");
  });
  return null;
}
