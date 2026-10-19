import { artists } from "@/lib/data";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
export function generateStaticParams() {
  return artists.map((a) => ({ artistSlug: a.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ artistSlug: string }>;
}) {
  const { artistSlug } = await params;
  const artist = artists.find((a) => a.slug === artistSlug);
  if (!artist) notFound();
  return <Gallery artist={artist} />;
}
