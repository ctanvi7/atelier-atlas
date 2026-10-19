# Atelier Atlas

A working visitor-first art discovery website built with Next.js, TypeScript, Three.js and React Three Fiber. The collection contains **eight demo artists in seven sample cities**, with six sample works per exhibition, including one newly generated painting for each artist. There is no backend, account system or payment flow.

## Preview

Use Node.js 24 (tested with 24.19.0) and npm 11. In your cloned `atelier-atlas` folder:

```sh
npm ci
npm run dev
```

The development server listens on port **3000** on all interfaces. Open port 3000 using your development environment's port forwarding, or visit `localhost:3000` on your own machine. No environment variables or API keys are needed. Fonts, geography and sample imagery are served locally. Optional music loads Spotify only when the visitor opens the player.

For a production preview:

```sh
npm run build
npm run start
```

Do not run both servers on the same port. To choose another port, use `npm run dev -- --port 3001` (or the equivalent `start` command).

## Visitor journey

- Drag or touch the actual 3D globe. It rotates slowly while idle; interactions, pin focus and the pause control stop idle rotation. Reduced-motion preferences disable idle animation and camera transitions.
- Antique-brass teardrop pins have 26–28px visible shapes, 44px touch targets and tips anchored to geographic positions. They show artist names and cities on hover, focus or selection. A single-artist pin opens its gallery directly. Paris offers two artist links. Escape dismisses its selection list. Rear-facing pins are removed from the DOM and cannot intercept clicks or keyboard navigation.
- The compact Explore artists menu provides a keyboard-friendly route to every gallery.
- Each `/gallery/[artistSlug]` route renders actual connected rooms with walls, mouldings, a wooden floor, layered gold frames and aspect-correct artwork surfaces. The existing demo artists still have six works each.
- Select **Walk through the gallery**, then use WASD or arrow keys while the room has focus. Drag to look. On mobile, hold the on-screen direction buttons and swipe the room to look. Movement stops on release, cancellation, focus loss or opening artwork details.
- Previous/next remains a guided alternative. Guided paths use the central doorways when crossing rooms. **Reset view** always returns to the entrance, including after free exploration. Reduced motion makes guided changes instantaneous and uses a slower, direct walking speed without inertia or head bob.
- A visitor collision radius and subdivided movement steps prevent crossing walls, door jambs or the protruding artwork frames, even at low frame rates. Walking stays at a fixed eye height.
- An introduction panel sits near the entrance, and each artwork has a wall plaque. The biography and the expandable **Artwork titles & labels** catalogue provide equivalent accessible HTML text.
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

The tests cover geographic coordinates, source image proportions, artist URLs and 404s, idle/drag/touch rotation, rear-facing pins, multi-artist selection, direct single-artist navigation, 3D artwork clicks, desktop walking and drag-to-look, mobile hold/swipe/release controls, collision and frame-spacing invariants, travel through connected doors, reset, keyboard modal dismissal and focus restoration, reduced motion, mobile overflow, and the no-WebGL fallback. Layout boundaries at 1, 8, 9, 16, 17 and 24 artworks are checked both geometrically and in a browser. A test-only esbuild fixture mounts the real room and controls with larger collections; it adds no public demo routes. Desktop and mobile screenshots were inspected during implementation. Tests use Chromium software rendering; physical mobile devices and other browser engines have not been tested.

## Structure

- `src/lib/data.ts`: typed artist and artwork records; stable slugs, image URLs, dimensions and descriptions. Replace these records with persisted data later without changing the visitor routes.
- `src/lib/scene.ts`: proportion-aware layout generation, wall and frame obstacles, collision resolution and guided paths.
- `src/components/Globe.tsx`: spherical geography texture, camera rotation, location pins and visibility.
- `src/components/GalleryRoom.tsx`: modular exhibition geometry, lighting and local plaque textures.
- `WalkingCamera.tsx`, `ExplorationControls.tsx`: keyboard, drag and touch input, camera transitions and walking controls.
- `ExhibitionLabel.tsx`: local canvas lettering for physical introduction and artwork plaques.
- `src/components/ArtworkFrame.tsx`: reusable frame component. The `design` API currently supports only `gold`; add other implementations here later.
- `GalleryControls.tsx`, `ArtworkDetails.tsx`, `Gallery.tsx`: HTML navigation, accessible modal and 2D fallback.
- `public/art`, `public/materials`, `public/data`: local art, wood material and geographic data.

Layouts use one room for 1–8 works, two for 9–16 and three for 17–24. Only those rooms are rendered. Each room reserves two back-wall bays beside its doorway and up to three works on each side wall. Actual framed widths determine spacing; image dimensions determine the fitted size without distortion. Viewpoints sit 4.5 metres from each work. The current scope stops at 24 works: the studio limits each collection to 24 artworks. Future irregular room shapes or freestanding sculptures would need their own layout and collision rules. Uploads should supply validated image dimensions and safe image URLs; SVG uploads would require sanitisation or rasterisation. The current SVGs are trusted, local project assets.

## Credits and scope

Parisienne and Cormorant Garamond are self-hosted fonts licensed under the SIL Open Font License. Natural Earth land outlines are public-domain data, distributed through world-atlas under ISC. D3's spherical clipping preserves the antimeridian and polar outlines. The SVG sample illustrations and oak texture were created for this project and dedicated to CC0. The eight PNG sample paintings are AI-generated and identified separately in the credits. Full credits and licence copies are in `public/ATTRIBUTION.txt` and `public/licences`.

Artist accounts, shared publishing, server database integration, recommendations, ratings and tipping are deferred. Demo profiles use sample locations and biographies. Sample artwork is labelled separately from browser-local uploads.

## Gallery soundtracks

Set `spotifyPlaylistUrl` on an artist record in `src/lib/data.ts` to that artist’s public Spotify playlist share URL (`https://open.spotify.com/playlist/…`). All eight artists have their supplied playlist assigned; empty or invalid values hide the music section. No Spotify API key, account integration, or backend is required. New contributors can choose a playlist for their own gallery in the studio. Existing artist playlists are read-only.

The gallery shows a soundtrack panel in both 3D and 2D views. Visitors choose **Listen on Spotify** to load the official Spotify embed, then press play inside it. Closing the player or leaving the gallery removes the iframe and stops its playback; switching between 3D and 2D keeps it mounted. Playback availability, previews, sign-in and regional restrictions are controlled by Spotify. The direct playlist link remains available if the embedded player is blocked. No autoplay is requested.

Player tests validate URL handling, explicit loading, closing, keyboard access and mobile width with a mocked Spotify iframe. They do not verify real audio playback or Spotify account behaviour.

## Create your gallery

Choose **Add your pin & artwork** on the homepage or visit `/studio`. Start with an empty collection, enter your artist name, city, country and introduction, then tap the world map to place your pin (or enter latitude/longitude). Upload your own JPG/PNG/WebP artwork, add titles and descriptions, and optionally connect a public Spotify playlist. Choose **Save pin & gallery** to add your gallery to this browser’s globe and artist menu. You can edit only galleries created in this browser through the **Your galleries in this browser** selector.

The eight existing artists are read-only. Their galleries always render the supplied collection, and legacy local edits cannot override them. Old draft records are preserved in storage but no longer offered for editing. New galleries use a separate IndexedDB store and local-only URLs under `/gallery/local/`. Links cannot transfer uploads to another browser or device. No account or shared publication is implied.

Images must be at most 10 MB and 40 megapixels. They are decoded and re-encoded as WebP at at most 2048 pixels along the longest edge, preserving proportions. SVG uploads and invalid files are rejected. Each new gallery needs 1–24 artworks. Saving updates already-open local galleries and the globe in other tabs. Storage failures remain visible; clearing site data removes local galleries, so keep your original images.

The eight generated PNG sample paintings and existing SVG illustrations remain labelled in the collection and credits. Their artist locations and biographies are illustrative. All supplied Spotify playlist URLs remain assigned to the original artists.
