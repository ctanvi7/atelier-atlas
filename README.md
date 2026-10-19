# Atelier Atlas

A working visitor-first art discovery website built with Next.js, TypeScript, Three.js and React Three Fiber. The collection contains **five fictional artists in four cities**, with six original sample works per exhibition. There is no backend, account system or payment flow.

## Preview

Use Node.js 24 (tested with 24.19.0) and npm 11. From this checkout:

```sh
cd /workspace/atelier-atlas
npm ci --cache /tmp/atelier-npm
npm run dev
```

The development server listens on port **3000** on all interfaces. Open port 3000 using your development environment's port forwarding, or visit `localhost:3000` on your own machine. No environment variables, API keys or external runtime services are needed. Fonts, geography and imagery are served locally.

For a production preview:

```sh
npm run build
npm run start
```

Do not run both servers on the same port. To choose another port, use `npm run dev -- --port 3001` (or the equivalent `start` command).

## Visitor journey

- Drag or touch the actual 3D globe. It rotates slowly while idle; interactions, pin focus and the pause control stop idle rotation. Reduced-motion preferences disable idle animation and camera transitions.
- Gold pins show artist names and cities on hover or focus. A single-artist pin opens its gallery directly. Paris offers two artist links. Escape dismisses its selection list. Rear-facing pins are removed from the DOM and cannot intercept clicks or keyboard navigation.
- The artist directory is a permanent keyboard-friendly route to every gallery.
- Each `/gallery/[artistSlug]` route renders an actual room with walls, mouldings, a wooden floor, layered gold frame geometry and six aspect-correct artwork surfaces.
- Previous/next selects a composed artwork viewpoint. Reset returns to the entrance. Guided camera paths remain within the room; this milestone intentionally uses guided views instead of free walking.
- Click a 3D artwork or use **View artwork** to open a native modal dialog. Escape closes it, keyboard focus stays inside while open, and focus returns to the triggering control.
- **View in 2D** provides the full collection without the 3D room. Devices without WebGL automatically receive this view. Errors loading a scene offer an HTML fallback.
- **Back to globe** completes the journey. Route changes unmount the globe canvas and dispose its generated texture. Heavy 3D modules load only on the client. The room uses demand-based rendering and stops rendering when the camera settles.

## Checks

```sh
npm run typecheck
npm run build
npm test
```

The Playwright suite starts a production server automatically, so build first. It uses `/usr/bin/chromium` when available. Alternatively, set `CHROMIUM_PATH` to a Chromium executable or install Playwright's browser with `npx playwright install chromium`. The cloud machine already provides Chromium; the external browser download endpoint is restricted here.

The tests cover geographic coordinates, source image proportions, artist URLs and 404s, idle/drag/touch rotation, rear-facing pins, multi-artist selection, direct single-artist navigation, 3D artwork clicks, camera view changes, room-boundary and frame-ratio invariants, reset, keyboard modal dismissal and focus restoration, reduced motion, mobile overflow, and the no-WebGL fallback. Desktop and mobile screenshots were inspected during implementation. Tests use Chromium software rendering; physical mobile devices and other browser engines have not been tested.

## Structure

- `src/lib/data.ts`: typed artist and artwork records; stable slugs, image URLs, dimensions and descriptions. Replace these records with persisted data later without changing the visitor routes.
- `src/lib/scene.ts`: room placements, safe camera targets and aspect-ratio fitting.
- `src/components/Globe.tsx`: spherical geography texture, camera rotation, location pins and visibility.
- `src/components/GalleryRoom.tsx`: actual exhibition geometry, lighting and bounded camera transitions.
- `src/components/ArtworkFrame.tsx`: reusable frame component. The `design` API currently supports only `gold`; add other implementations here later.
- `GalleryControls.tsx`, `ArtworkDetails.tsx`, `Gallery.tsx`: HTML navigation, accessible modal and 2D fallback.
- `public/art`, `public/materials`, `public/data`: local art, wood material and geographic data.

The room currently has six exhibition slots. To expand it, add placements and safe camera targets in `scene.ts` alongside the artwork records. Uploads should supply validated image dimensions and safe image URLs; SVG uploads would require sanitisation or rasterisation. The current SVGs are trusted, local project assets.

## Credits and scope

Parisienne and Cormorant Garamond are self-hosted fonts licensed under the SIL Open Font License. Natural Earth land outlines are public-domain data, distributed through world-atlas under ISC. D3's spherical clipping preserves the antimeridian and polar outlines. Sample artwork and the oak illustration were created for this project and dedicated to CC0. Full credits and licence copies are in `public/ATTRIBUTION.txt` and `public/licences`.

Accounts, uploads, database integration, music, recommendations, ratings and tipping are intentionally deferred. All displayed artists are fictional and all artwork is labelled sample content.
