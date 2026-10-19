"use client";
import Link from "next/link";
import { useLocalGalleries } from "./useLocalGalleries";
import Gallery from "./Gallery";
export default function SavedGallery({ slug }: { slug: string }) {
  const { galleries, ready, error, revision } = useLocalGalleries();
  if (!ready)
    return (
      <p className="gallery-loading" role="status">
        Opening your gallery…
      </p>
    );
  const artist = galleries.find((a) => a.slug === slug);
  if (error || !artist)
    return (
      <main className="studio-page">
        <h1>Your local gallery</h1>
        <p>
          {error ||
            "This gallery isn’t saved in this browser. Local gallery links do not transfer uploads between devices."}
        </p>
        <Link href="/studio">Create your gallery</Link>
        <p>
          <Link href="/">Back to globe</Link>
        </p>
      </main>
    );
  return (
    <>
      <p className="draft-notice">Your gallery · saved in this browser only</p>
      <Gallery key={revision} artist={artist} />
    </>
  );
}
