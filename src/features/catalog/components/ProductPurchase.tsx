"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/store";
import { ApiClientError } from "@/src/shared/lib/api";
import AuthModal, {
  type AuthMode,
} from "@/src/features/auth/components/AuthModal";
import { useAddToCart } from "@/src/features/cart/hooks/useCart";
import type { Product } from "../types";
import { formatPrice } from "../lib/product-price";
import { sortVariants } from "../lib/product-variants";
import VariantSelector from "./VariantSelector";
import QuantitySelector from "./QuantitySelector";

export default function ProductPurchase({ product }: { product: Product }) {
  const variants = sortVariants(product.variants);
  const first =
    variants.find((variant) => variant.availableQuantity > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(first?.id);
  const [quantity, setQuantity] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);
  const mutation = useAddToCart();
  const variant =
    product.variants.find((item) => item.id === selectedId) ?? first;
  const maxQuantity = Math.min(99, variant?.availableQuantity ?? 0);
  const selectedQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const soldOut = !variant || maxQuantity === 0;
  const needsLogin =
    mutation.error instanceof ApiClientError &&
    mutation.error.statusCode === 401;
  const compareAt =
    variant?.compareAtAmount &&
    BigInt(variant.compareAtAmount) > BigInt(variant.priceAmount)
      ? formatPrice(variant.compareAtAmount, variant.currency)
      : null;

  function addToCart() {
    if (!variant || soldOut || mutation.isPending) return;
    if (!accessToken || needsLogin) {
      setAuthMode("signin");
      setAuthOpen(true);
      return;
    }
    mutation.mutate({ variantId: variant.id, quantity: selectedQuantity });
  }

  return (
    <div className="lg:sticky lg:top-28">
      <p className="mb-5 text-[10px] tracking-[0.24em] text-muted">
        ATELIER / {product.category?.name.toUpperCase() ?? "COLLECTION"}
      </p>
      <h1 className="max-w-xl text-4xl font-normal leading-[1.12] tracking-[-0.04em] sm:text-5xl xl:text-6xl">
        {product.name}
      </h1>
      <p className="mt-5 max-w-md text-sm leading-7 text-muted">
        {product.description || "Thông tin sản phẩm đang được cập nhật."}
      </p>

      <div
        className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-6"
        aria-live="polite"
      >
        <div className="flex items-baseline gap-3">
          <p className="text-2xl tracking-tight">
            {variant
              ? formatPrice(variant.priceAmount, variant.currency)
              : "Chưa có giá"}
          </p>
          {compareAt && <del className="text-sm text-subtle">{compareAt}</del>}
        </div>
        <p className="flex items-center gap-2 text-[11px] text-muted">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${soldOut ? "bg-line" : "bg-emerald-700"}`}
          />
          {soldOut
            ? "Tạm hết hàng"
            : `Còn ${variant.availableQuantity} sản phẩm`}
        </p>
      </div>

      {product.variants.length > 0 && (
        <VariantSelector
          variants={variants}
          selectedId={variant?.id}
          disabled={mutation.isPending}
          onChange={(id) => {
            setSelectedId(id);
            setQuantity(1);
            mutation.reset();
          }}
        />
      )}
      <div className="flex flex-wrap gap-3">
        <QuantitySelector
          value={selectedQuantity}
          max={maxQuantity}
          disabled={soldOut || mutation.isPending}
          onChange={setQuantity}
        />
        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut || mutation.isPending || status === "restoring"}
          className="flex h-12 min-w-48 flex-1 items-center justify-center gap-3 bg-action px-5 text-xs font-medium text-action-foreground transition hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingBag aria-hidden className="h-4 w-4" />
          )}
          {soldOut
            ? "Tạm hết hàng"
            : mutation.isPending
              ? "Đang thêm…"
              : status === "restoring"
                ? "Đang khôi phục phiên…"
                : needsLogin
                  ? "Đăng nhập lại"
                  : "Thêm vào giỏ hàng"}
        </button>
      </div>
      <div aria-live="polite" className="mt-3 text-xs leading-5">
        {mutation.isSuccess && (
          <p className="text-positive">
            Đã thêm {mutation.variables.quantity} sản phẩm vào giỏ hàng.
          </p>
        )}
        {mutation.isError && (
          <p role="alert" className="text-danger">
            {mutation.error.message}
          </p>
        )}
      </div>

      <dl className="mt-8 space-y-3 border-t border-line pt-6 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">Mã sản phẩm</dt>
          <dd className="break-all text-right font-mono text-[10px]">
            {variant?.sku ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">Danh mục</dt>
          <dd>{product.category?.name ?? "Chưa phân loại"}</dd>
        </div>
      </dl>
      {product.category && (
        <Link
          href={`/categories/${encodeURIComponent(product.category.slug)}`}
          className="mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 text-xs"
        >
          Khám phá cùng danh mục
          <ArrowUpRight aria-hidden className="h-3 w-3" />
        </Link>
      )}
      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => {
          setAuthOpen(false);
          mutation.reset();
        }}
      />
    </div>
  );
}

