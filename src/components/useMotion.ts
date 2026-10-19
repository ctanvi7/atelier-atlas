"use client";
import { useEffect, useState } from "react";
export function useReducedMotion() {
  const [reduce, set] = useState(true);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => set(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return reduce;
}
export function useWebGL() {
  const [supported, set] = useState<boolean | null>(null);
  useEffect(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    set(!!gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);
  return supported;
}
