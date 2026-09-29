import Link from "next/link";
import type { Product } from "../types";
import { formatPrice } from "../lib/product-price";
import ProductPhoto from "./ProductPhoto";

function productPrice(product: Product) {
  const currency = product.variants[0]?.currency;
  const prices = product.variants
    .filter(
      (variant) =>
        variant.currency === currency && /^\d+$/.test(variant.priceAmount),
    )
    .map((variant) => BigInt(variant.priceAmount));
  if (!currency || prices.length === 0) return "Chưa có giá";
  const minimum = prices.reduce((a, b) => (a < b ? a : b));
  const price = formatPrice(minimum.toString(), currency);
  return prices.some((value) => value !== minimum) ? `Từ ${price}` : price;
}

export default function ProductCard({ product }: { product: Product }) {
  const cover = [...product.images].sort((a, b) => a.position - b.position)[0];
  const soldOut =
    product.variants.length === 0 ||
    product.variants.every((variant) => variant.availableQuantity <= 0);
  return (
    <article className="group min-w-0">
      <Link
        href={`/products/${encodeURIComponent(product.slug)}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-sm bg-[#eeece7]">
          <ProductPhoto
            src={cover?.url}
            alt={cover?.altText || product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {soldOut && (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] text-neutral-600">
              Tạm hết hàng
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium leading-6 text-neutral-900">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-neutral-600">{productPrice(product)}</p>
        <p className="mt-2 text-[11px] text-neutral-400">
          {product.variants.length} lựa chọn
        </p>
      </Link>
    </article>
  );
}
