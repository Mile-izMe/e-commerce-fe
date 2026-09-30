"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { useState } from "react";

export default function ProductPhoto({
  src,
  alt,
  sizes,
  eager = false,
  contain = false,
}: {
  src?: string;
  alt: string;
  sizes: string;
  eager?: boolean;
  contain?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string>();
  if (!src || src === failedUrl || !/^(https?:\/\/|\/(?!\/))/.test(src)) {
    return (
      <div
        className="flex h-full min-h-20 items-center justify-center text-subtle"
        role="img"
        aria-label={`Chưa có ảnh: ${alt}`}
      >
        <Package aria-hidden className="h-9 w-9 stroke-1" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailedUrl(src)}
      className={
        contain
          ? "object-contain"
          : "object-cover transition duration-700 motion-safe:group-hover:scale-[1.035]"
      }
    />
  );
}
