import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCategoryPreview } from "../hooks/useCatalog";
import type { Category } from "../types/category";
import ProductCard from "./ProductCard";
import ProductGridSkeleton from "./ProductGridSkeleton";

export default function CategoryPreview({ category, index }: { category: Category; index: number }) {
  const { data, isPending, isError, refetch } = useCategoryPreview(category.slug);
  const href = `/categories/${encodeURIComponent(category.slug)}`;

  return (
    <section aria-labelledby={`heading-${category.id}`} className="py-9 sm:py-12">
      <div className="mb-7 flex items-baseline justify-between gap-4">
        <h3 id={`heading-${category.id}`} className="text-xl font-normal tracking-tight text-neutral-900 sm:text-2xl">
          <span className="mr-4 align-middle font-mono text-[10px] text-neutral-400">{String(index + 1).padStart(2, "0")}</span>
          <Link href={href} className="hover:text-neutral-500">{category.name}</Link>
        </h3>
        <Link href={href} aria-label={`Xem tất cả ${category.name}`} className="inline-flex shrink-0 items-center gap-2 text-xs text-neutral-600 underline underline-offset-4">
          Xem tất cả <ArrowUpRight aria-hidden className="h-3 w-3" />
        </Link>
      </div>
      {isPending ? <ProductGridSkeleton /> : isError ? (
        <div role="alert" className="py-8 text-sm text-neutral-600">
          Chưa tải được sản phẩm trong danh mục này.
          <button type="button" onClick={() => void refetch()} className="ml-3 underline underline-offset-4">Thử lại</button>
        </div>
      ) : data?.items.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
          {data.items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : <p className="py-8 text-sm text-neutral-500">Danh mục này đang được cập nhật sản phẩm.</p>}
    </section>
  );
}
