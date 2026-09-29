"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiClientError } from "@/src/shared/lib/api";
import { useProductDetail } from "../hooks";
import ProductGallery from "./ProductGallery";
import ProductPurchase from "./ProductPurchase";

export default function ProductDetail({ slug }: { slug: string }) {
  const {
    data: product,
    isPending,
    isError,
    error,
    refetch,
  } = useProductDetail(slug);
  const notFound = error instanceof ApiClientError && error.statusCode === 404;
  return (
    <main className="flex-1 bg-[#fafaf8] px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label="Đường dẫn sản phẩm"
          className="mb-8 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500"
        >
          <Link
            href="/#catalog"
            className="inline-flex items-center gap-2 hover:text-neutral-900"
          >
            <ArrowLeft aria-hidden className="h-3 w-3" />
            Bộ sưu tập
          </Link>
          {product?.category && (
            <>
              <span aria-hidden>/</span>
              <Link
                href={`/categories/${encodeURIComponent(product.category.slug)}`}
                className="hover:text-neutral-900"
              >
                {product.category.name}
              </Link>
            </>
          )}
          {product && (
            <>
              <span aria-hidden>/</span>
              <span aria-current="page" className="text-neutral-900">
                {product.name}
              </span>
            </>
          )}
        </nav>
        {isPending ? (
          <div
            role="status"
            aria-label="Đang tải sản phẩm"
            className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20"
          >
            <div className="aspect-[4/5] bg-neutral-200/70 motion-safe:animate-pulse" />
            <div className="space-y-6 py-8">
              <div className="h-4 w-28 bg-neutral-200" />
              <div className="h-16 w-3/4 bg-neutral-200" />
              <div className="h-24 bg-neutral-200/60" />
              <div className="h-12 bg-neutral-200" />
              <span className="sr-only">Đang tải sản phẩm…</span>
            </div>
          </div>
        ) : isError ? (
          <div role="alert" className="py-28 text-center">
            <h1 className="text-3xl tracking-tight">
              {notFound ? "Không tìm thấy sản phẩm" : "Chưa tải được sản phẩm"}
            </h1>
            <p className="mt-4 text-sm text-neutral-500">
              {notFound
                ? "Sản phẩm có thể đã ngừng được hiển thị."
                : "Vui lòng kiểm tra kết nối và thử lại."}
            </p>
            {!notFound && (
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-6 border-b border-neutral-900 text-sm"
              >
                Thử lại
              </button>
            )}
            {notFound && (
              <Link
                href="/#catalog"
                className="mt-6 inline-block border-b border-neutral-900 text-sm"
              >
                Trở về bộ sưu tập
              </Link>
            )}
          </div>
        ) : (
          product && (
            <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
              <ProductGallery
                key={product.id}
                images={product.images}
                name={product.name}
              />
              <ProductPurchase key={product.id} product={product} />
            </div>
          )
        )}
        <footer className="mt-20 flex flex-wrap justify-between gap-4 border-t border-neutral-200 pt-8">
          <span className="text-sm tracking-[0.2em]">ATELIER</span>
          <p className="text-xs text-neutral-400">Ít hơn. Vừa đủ. Mỗi ngày.</p>
        </footer>
      </div>
    </main>
  );
}
