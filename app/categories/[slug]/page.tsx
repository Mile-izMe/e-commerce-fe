import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryProducts from "@/src/features/catalog/components/CategoryProducts";

export const metadata: Metadata = { title: "Bộ sưu tập | ATELIER" };

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  return <main><CategoryProducts key={slug} slug={slug} /></main>;
}
