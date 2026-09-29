import type { ProductVariant } from "../types";

const clothingSizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function sortVariants(variants: ProductVariant[]) {
  // Only reorder a size-only list. Preserve the API order for other options.
  if (!variants.every((variant) => clothingSizes.includes(variant.name)))
    return variants;
  return [...variants].sort(
    (a, b) => clothingSizes.indexOf(a.name) - clothingSizes.indexOf(b.name),
  );
}
