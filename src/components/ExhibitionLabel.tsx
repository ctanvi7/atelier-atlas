"use client";
import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Point } from "@/lib/scene";
/** Local canvas lettering keeps labels on the wall and behind room geometry. */
export default function ExhibitionLabel({
  title,
  subtitle,
  description = "",
  position,
  rotation = 0,
  introduction = false,
}: {
  title: string;
  subtitle: string;
  description?: string;
  position: Point;
  rotation?: number;
  introduction?: boolean;
}) {
  const [texture, setTexture] = useState<CanvasTexture>();
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = introduction ? 640 : 320;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f4eee2";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#393126";
    ctx.font = "42px Georgia";
    ctx.fillText(title, 50, 85, 924);
    ctx.fillStyle = "#6d604e";
    ctx.font = "25px Arial";
    ctx.fillText(subtitle, 50, 142, 924);
    ctx.font = introduction ? "28px Georgia" : "23px Arial";
    let line = "",
      y = 206;
    for (const word of description.split(" ")) {
      if (ctx.measureText(line + word).width > 910) {
        ctx.fillText(line, 50, y);
        y += 42;
        line = "";
      }
      line += word + " ";
    }
    ctx.fillText(line, 50, y);
    const map = new CanvasTexture(c);
    map.colorSpace = SRGBColorSpace;
    setTexture(map);
    return () => map.dispose();
  }, [title, subtitle, description, introduction]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry
          args={introduction ? [2.1, 1.31, 0.035] : [1, 0.3125, 0.035]}
        />
        <meshStandardMaterial color="#ede3d1" roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={introduction ? [2.1, 1.31] : [1, 0.3125]} />
        <meshBasicMaterial
          key={texture?.uuid ?? "blank"}
          map={texture}
          color={texture ? "white" : "#f4eee2"}
        />
      </mesh>
    </group>
  );
}
