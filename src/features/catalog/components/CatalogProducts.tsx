"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "../hooks/useCatalog";
import CategoryPreview from "./CategoryPreview";
import ProductGridSkeleton from "./ProductGridSkeleton";

export default function CatalogProducts() {
  const { data: categories, isPending, isError, refetch } = useCategories();

  return (
    <section
      id="catalog"
      aria-labelledby="catalog-heading"
      className="scroll-mt-24 bg-[#fafaf8] px-5 py-14 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-neutral-200 pb-7">
          <p className="mb-3 text-[10px] tracking-[0.25em] text-neutral-500">
            THE COLLECTION
          </p>
          <h2
            id="catalog-heading"
            className="text-3xl font-normal tracking-tight text-neutral-900 sm:text-4xl"
          >
            Tìm điều bạn yêu thích.
          </h2>
        </div>
        {isPending && (
          <div className="pt-10">
            <ProductGridSkeleton />
          </div>
        )}
        {isError && (
          <div
            role="alert"
            className="py-12 text-center text-sm text-neutral-600"
          >
            <p>Chưa tải được danh mục sản phẩm.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 underline underline-offset-4"
            >
              Thử lại
            </button>
          </div>
        )}
        {categories && categories.length > 0 && (
          <>
            <nav
              aria-label="Danh mục sản phẩm"
              className="flex flex-wrap gap-2 py-6"
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${encodeURIComponent(category.slug)}`}
                  className="inline-flex items-center gap-5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-600 transition hover:border-neutral-900"
                >
                  {category.name}
                  <ArrowUpRight aria-hidden className="h-3 w-3" />
                </Link>
              ))}
            </nav>
            {categories.map((category, index) => (
              <CategoryPreview
                key={category.id}
                category={category}
                index={index}
              />
            ))}
          </>
        )}
        {categories?.length === 0 && (
          <p className="py-20 text-center text-sm text-neutral-500">
            Bộ sưu tập đang được chuẩn bị.
          </p>
        )}
      </div>
    </section>
  );
}
