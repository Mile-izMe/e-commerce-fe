import Image from "next/image";
import { Package } from "lucide-react";
import { useState } from "react";
import type { Product } from "../types";

function productPrice(product: Product) {
  const currency = product.variants[0]?.currency;
  const prices = product.variants
    .filter((variant) => variant.currency === currency)
    .map((variant) => Number(variant.priceAmount))
    .filter((price) => Number.isFinite(price) && price >= 0);
  if (!currency || prices.length === 0) return "Chưa có giá";
  const minimum = Math.min(...prices);
  try {
    const price = new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(minimum);
    return prices.some((value) => value !== minimum) ? `Từ ${price}` : price;
  } catch {
    return `${minimum.toLocaleString("vi-VN")} ${currency}`;
  }
}

export default function ProductCard({ product }: { product: Product }) {
  const cover = [...product.images].sort((a, b) => a.position - b.position)[0];
  const [failedUrl, setFailedUrl] = useState<string>();
  const imageUrl = cover?.url;
  const showImage = imageUrl && imageUrl !== failedUrl && /^(https?:\/\/|\/(?!\/))/.test(imageUrl);
  const soldOut = product.variants.length > 0 && product.variants.every((variant) => variant.availableQuantity <= 0);

  return (
    <article className="group min-w-0">
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-sm bg-[#eeece7]">
        {showImage ? (
          <Image src={imageUrl} alt={cover.altText || product.name} fill unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" onError={() => setFailedUrl(imageUrl)} className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.035]" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-400">
            <Package aria-hidden className="h-9 w-9 stroke-1" />
            <span className="text-[10px] tracking-[0.1em]">ĐANG CẬP NHẬT ẢNH</span>
          </div>
        )}
        {soldOut && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] text-neutral-600">Tạm hết hàng</span>}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-6 text-neutral-900">{product.name}</h3>
      </div>
      <p className="mt-1 text-sm text-neutral-600">{productPrice(product)}</p>
      <p className="mt-2 text-[11px] text-neutral-400">{product.variants.length} lựa chọn</p>
    </article>
  );
}
