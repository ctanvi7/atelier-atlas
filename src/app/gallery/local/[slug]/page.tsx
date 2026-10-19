import { notFound } from "next/navigation";
import SavedGallery from "@/components/SavedGallery";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^local-[a-f0-9-]{36}$/.test(slug)) notFound();
  return <SavedGallery slug={slug} />;
}
