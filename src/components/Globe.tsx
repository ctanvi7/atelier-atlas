"use client";
import Icon from "./Icon";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasTexture, SRGBColorSpace, Vector3 } from "three";
import { feature } from "topojson-client";
import { geoEquirectangular, geoPath } from "d3-geo";
import type { Topology, GeometryObject } from "topojson-specification";
import type { Feature, FeatureCollection } from "geojson";
import { locations, latLngToPosition } from "@/lib/data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "./useMotion";
function useLand() {
  const [texture, setTexture] = useState<CanvasTexture>();
  const [error, setError] = useState<Error>();
  useEffect(() => {
    let active = true;
    let map: CanvasTexture | undefined;
    const abort = new AbortController();
    fetch("/data/land-110m.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error("Geography unavailable");
        return r.json();
      })
      .then((topology: Topology) => {
        const geo = feature(
          topology,
          topology.objects.land as GeometryObject,
        ) as Feature | FeatureCollection;
        const c = document.createElement("canvas");
        c.width = 2048;
        c.height = 1024;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#e5ddce";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#b49b72";
        // Spherical clipping splits polygons at the antimeridian. Drawing raw
        // longitude segments would create a false line across Antarctica.
        const projection = geoEquirectangular()
          .scale(c.width / (2 * Math.PI))
          .translate([c.width / 2, c.height / 2]);
        ctx.beginPath();
        geoPath(projection, ctx)(geo);
        ctx.fill();
        map = new CanvasTexture(c);
        map.colorSpace = SRGBColorSpace;
        if (active) setTexture(map);
        else map.dispose();
      })
      .catch((e) => {
        if (active && e.name !== "AbortError") setError(e);
      });
    return () => {
      active = false;
      abort.abort();
      map?.dispose();
    };
  }, []);
  if (error) throw error;
  return texture;
}
function Pin({
  location,
  index,
  open,
  setOpen,
  setEngaged,
}: {
  location: (typeof locations)[number];
  index: number;
  open: number | null;
  setOpen: (n: number | null) => void;
  setEngaged: (engaged: boolean) => void;
}) {
  const router = useRouter();
  const { camera, size } = useThree();
  const position = latLngToPosition(
    location.artists[0].lat,
    location.artists[0].lng,
    2.025,
  );
  const [visible, setVisible] = useState(false);
  const prior = useRef(false);
  const [align, setAlign] = useState("center");
  const priorAlign = useRef("center");
  const start = useRef([0, 0]);
  const dragged = useRef(false);
  useFrame(() => {
    const normal = new Vector3(...position).normalize();
    const toCamera = camera.position
      .clone()
      .sub(new Vector3(...position))
      .normalize();
    const front = normal.dot(toCamera) > 0.12;
    const screenX =
      ((new Vector3(...position).project(camera).x + 1) * size.width) / 2;
    const alignment =
      screenX < 140 ? "left" : screenX > size.width - 140 ? "right" : "center";
    if (alignment !== priorAlign.current) {
      priorAlign.current = alignment;
      setAlign(alignment);
    }
    if (front !== prior.current) {
      prior.current = front;
      setVisible(front);
      if (!front) {
        if (open === index) setOpen(null);
        setEngaged(false);
      }
    }
  });
  if (!visible) return null;
  return (
    <Html position={position} zIndexRange={[30, 0]}>
      <div
        className={`pin-container pin-align-${align} ${open === index ? "is-selected" : ""}`}
        onPointerEnter={() => setEngaged(true)}
        onPointerLeave={(e) => {
          if (!e.currentTarget.contains(document.activeElement))
            setEngaged(false);
        }}
        onFocus={() => setEngaged(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setEngaged(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(null);
        }}
      >
        <button
          className="map-pin"
          aria-label={`${location.artists.map((a) => a.name).join(" and ")} — ${location.city}`}
          aria-expanded={open === index}
          onPointerDown={(e) => {
            dragged.current = false;
            start.current = [e.clientX, e.clientY];
            e.currentTarget.setPointerCapture(e.pointerId);
            e.stopPropagation();
          }}
          onPointerMove={(e) => {
            if (
              Math.hypot(
                e.clientX - start.current[0],
                e.clientY - start.current[1],
              ) > 6
            )
              dragged.current = true;
          }}
          onPointerCancel={() => {
            dragged.current = true;
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (
              e.detail === 0 ||
              (!dragged.current &&
                Math.hypot(
                  e.clientX - start.current[0],
                  e.clientY - start.current[1],
                ) < 6)
            ) {
              if (location.artists.length === 1)
                router.push(`/gallery/${location.artists[0].slug}`);
              else setOpen(open === index ? null : index);
            }
          }}
        >
          <svg className="pin-shape" viewBox="0 0 26 28" aria-hidden="true">
            <path
              d="M13 27C10 22 3 17 3 11a10 10 0 0 1 20 0c0 6-7 11-10 16Z"
              fill="#b29051"
              stroke="#4e3d25"
              strokeWidth="1.4"
            />
            <path
              d="M6 11a7 7 0 0 1 7-7"
              stroke="#e4cc94"
              strokeWidth="1.5"
              fill="none"
            />
            <circle
              cx="13"
              cy="11"
              r="3.2"
              fill="#f0e3c9"
              stroke="#6c5230"
              strokeWidth="1"
            />
          </svg>
        </button>
        <div className="pin-tooltip">
          {location.artists.map((a) => a.name).join(" & ")}
          <small>{location.city}</small>
        </div>
        {open === index && (
          <div className="pin-selection">
            <div className="eyebrow">
              {location.city} ·{" "}
              {location.artists.length === 1
                ? "ONE PERSPECTIVE"
                : "CHOOSE AN ARTIST"}
            </div>
            {location.artists.map((a) => (
              <Link key={a.slug} href={`/gallery/${a.slug}`}>
                {a.name}
                <span>
                  Enter gallery <Icon />
                </span>
              </Link>
            ))}
            <button className="text-button" onClick={() => setOpen(null)}>
              Close
            </button>
          </div>
        )}
      </div>
    </Html>
  );
}
function World({ paused, onReady }: { paused: boolean; onReady: () => void }) {
  const texture = useLand();
  useEffect(() => {
    if (texture) onReady();
  }, [texture, onReady]);
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);
  const [engaged, setEngaged] = useState(false);
  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[-3, 6, 7]} intensity={2.5} />
      <directionalLight position={[5, -1, 2]} intensity={0.25} />
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[2, 96, 64]} />
        <meshStandardMaterial
          key={texture?.uuid ?? "loading"}
          map={texture}
          color={texture ? "white" : "#e8dfce"}
          roughness={1}
        />
      </mesh>
      {texture &&
        locations.map((l, i) => (
          <Pin
            key={l.city}
            location={l}
            index={i}
            open={open}
            setOpen={setOpen}
            setEngaged={setEngaged}
          />
        ))}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={!paused && !reduce && !engaged && open === null}
        autoRotateSpeed={0.35}
        rotateSpeed={0.6}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.25}
      />
    </>
  );
}
export default function Globe({ paused }: { paused: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const onReady = useCallback(() => setLoaded(true), []);
  return (
    <>
      <Canvas
        camera={{ position: [5, 2.1, 3.7], fov: 43 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
        aria-label="Drag to rotate the globe. Gold pins reveal artists; the artist directory offers the same destinations."
      >
        <World paused={paused} onReady={onReady} />
      </Canvas>
      {!loaded && (
        <div className="scene-message texture-loading-overlay" role="status">
          Drawing the atlas…
        </div>
      )}
    </>
  );
}
