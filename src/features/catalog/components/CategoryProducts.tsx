"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCategories, useProducts } from "../hooks/useCatalog";
import ProductCard from "./ProductCard";
import ProductGridSkeleton from "./ProductGridSkeleton";

export default function CategoryProducts({ slug }: { slug: string }) {
  const categoriesQuery = useCategories();
  const category = categoriesQuery.data?.find((item) => item.slug === slug);

  const {
    data,
    isPending,
    isError,
    isFetching,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useProducts({ category: slug, limit: 10 }, Boolean(category));
  const sentinel = useRef<HTMLDivElement>(null);
  const products = [
    ...new Map(
      (data?.pages.flatMap((page) => page.items) ?? []).map((product) => [
        product.id,
        product,
      ]),
    ).values(),
  ];

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || isFetching || isError) return;
    if (!("IntersectionObserver" in window)) return;

    // Disconnect before fetching so repeated observer events cannot request the same page.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          void fetchNextPage();
        }
      },
      { rootMargin: "0px 0px 240px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isError, fetchNextPage]);

  return (
    <div className="min-h-[60vh] bg-[#fafaf8] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/#catalog"
          className="mb-8 inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Tất cả danh mục
        </Link>

        {categoriesQuery.isPending ? (
          <ProductGridSkeleton />
        ) : categoriesQuery.isError ? (
          <div role="alert" className="py-12 text-center">
            <p>Chưa tải được danh mục.</p>
            <button
              type="button"
              onClick={() => void categoriesQuery.refetch()}
              className="mt-4 underline underline-offset-4"
            >
              Thử lại
            </button>
          </div>
        ) : !category ? (
          <h1 className="py-12 text-2xl">Không tìm thấy danh mục này.</h1>
        ) : (
          <>
            <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-8">
              <div>
                <p className="mb-3 text-[10px] tracking-[0.25em] text-neutral-500">
                  ATELIER / COLLECTION
                </p>
                <h1 className="text-3xl font-normal tracking-tight sm:text-5xl">
                  {category.name}
                </h1>
              </div>
              <p aria-live="polite" className="text-xs text-neutral-500">
                {isPending
                  ? "Đang tải sản phẩm…"
                  : `${products.length} sản phẩm đã hiển thị`}
              </p>
            </header>

            {isPending ? (
              <ProductGridSkeleton count={10} />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            {!isPending && !isError && products.length === 0 && (
              <p className="py-16 text-center text-sm text-neutral-500">
                Danh mục này chưa có sản phẩm.
              </p>
            )}

            <div ref={sentinel} aria-hidden className="h-1" />
            <div
              className="mt-10 text-center text-sm text-neutral-500"
              aria-live="polite"
            >
              {isError ? (
                <div role="alert">
                  <p>
                    {isFetchNextPageError
                      ? "Chưa tải được trang tiếp theo."
                      : "Chưa tải được sản phẩm."}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      isFetchNextPageError
                        ? void fetchNextPage()
                        : void refetch()
                    }
                    className="mt-4 underline underline-offset-4"
                  >
                    Thử lại
                  </button>
                </div>
              ) : isFetchingNextPage ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Đang tải thêm…
                </span>
              ) : hasNextPage ? (
                <button
                  type="button"
                  disabled={isFetching}
                  onClick={() => void fetchNextPage()}
                  className="rounded-full border border-neutral-300 px-6 py-3 disabled:opacity-50"
                >
                  Tải thêm sản phẩm
                </button>
              ) : products.length > 0 ? (
                <p>Bạn đã xem hết sản phẩm trong danh mục.</p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
