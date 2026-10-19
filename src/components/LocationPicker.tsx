"use client";
import { useEffect, useState } from "react";
import { feature } from "topojson-client";
import { geoEquirectangular, geoPath } from "d3-geo";
import type { Topology, GeometryObject } from "topojson-specification";
export default function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}) {
  const [land, setLand] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/land-110m.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((topology: Topology) => {
        const geometry = feature(
          topology,
          topology.objects.land as GeometryObject,
        );
        const projection = geoEquirectangular()
          .scale(720 / (2 * Math.PI))
          .translate([360, 180]);
        setLand(geoPath(projection)(geometry) ?? "");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, []);
  const valid =
    lat !== "" &&
    lng !== "" &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180;
  return (
    <div className="location-picker">
      <p id="pin-instructions">
        Click or tap the map to place your pin, or enter coordinates below.
        Choose an approximate location you’re comfortable sharing.
      </p>
      <svg
        className="pin-map"
        viewBox="0 0 720 360"
        role="img"
        aria-label="World map for placing your gallery pin"
        aria-describedby="pin-instructions"
        onClick={(event) => {
          if (event.currentTarget.closest("fieldset")?.disabled) return;
          const svg = event.currentTarget;
          const transform = svg.getScreenCTM();
          if (!transform) return;
          const point = svg.createSVGPoint();
          point.x = event.clientX;
          point.y = event.clientY;
          const local = point.matrixTransform(transform.inverse());
          const x = Math.max(0, Math.min(1, local.x / 720));
          const y = Math.max(0, Math.min(1, local.y / 360));
          onChange((90 - y * 180).toFixed(4), (x * 360 - 180).toFixed(4));
        }}
      >
        <rect width="720" height="360" fill="#e5ddce" />
        <path d={land} fill="#b49b72" />
        {valid && (
          <g
            transform={`translate(${(Number(lng) + 180) * 2},${(90 - Number(lat)) * 2})`}
          >
            <path
              d="M0 0C-4-6-10-11-10-18a10 10 0 0 1 20 0C10-11 4-6 0 0Z"
              fill="#b29051"
              stroke="#4e3d25"
              strokeWidth="2"
            />
            <circle cy="-18" r="3" fill="#f5f0e7" />
          </g>
        )}
      </svg>
      {failed && (
        <p>
          Map imagery couldn’t load. You can still set your location using
          coordinates.
        </p>
      )}
      <div className="profile-grid">
        <div>
          <label htmlFor="pin-lat">Latitude</label>
          <input
            id="pin-lat"
            type="number"
            min="-90"
            max="90"
            step="any"
            required
            value={lat}
            onChange={(e) => onChange(e.target.value, lng)}
          />
        </div>
        <div>
          <label htmlFor="pin-lng">Longitude</label>
          <input
            id="pin-lng"
            type="number"
            min="-180"
            max="180"
            step="any"
            required
            value={lng}
            onChange={(e) => onChange(lat, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
