import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/src/features/catalog/components/ProductDetail";

export const metadata: Metadata = { title: "Chi tiết sản phẩm | Atelier" };

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  return <ProductDetail key={slug} slug={slug} />;
}
