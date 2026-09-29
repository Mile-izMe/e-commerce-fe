"use client";

import { useState } from "react";
import type { ProductImage } from "../types";
import ProductPhoto from "./ProductPhoto";

export default function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id);
  const selected = sorted.find((image) => image.id === selectedId) ?? sorted[0];
  return (
    <section aria-label="Hình ảnh sản phẩm" className="min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#eeece7] lg:max-h-[740px]">
        <ProductPhoto
          src={selected?.url}
          alt={selected?.altText || name}
          sizes="(max-width: 1024px) 100vw, 55vw"
          eager
          contain
        />
        <span className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 text-[10px] tracking-[0.18em]">
          ATELIER / OBJECTS FOR EVERYDAY
        </span>
      </div>
      {sorted.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Xem ảnh ${index + 1}: ${image.altText || name}`}
              aria-pressed={selected?.id === image.id}
              onClick={() => setSelectedId(image.id)}
              className={`relative h-24 w-20 shrink-0 overflow-hidden bg-[#eeece7] outline-offset-4 focus-visible:outline-2 ${selected?.id === image.id ? "ring-1 ring-neutral-900 ring-offset-2" : "opacity-60 hover:opacity-100"}`}
            >
              <ProductPhoto src={image.url} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <p className="mt-4 text-[11px] text-neutral-400">
        {sorted.length
          ? `${sorted.length} hình ảnh`
          : "Hình ảnh đang được cập nhật"}
      </p>
    </section>
  );
}
