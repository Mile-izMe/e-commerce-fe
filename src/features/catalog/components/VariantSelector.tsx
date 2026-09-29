import type { ProductVariant } from "../types";
import { formatPrice } from "../lib/product-price";

export default function VariantSelector({
  variants,
  selectedId,
  onChange,
  disabled,
}: {
  variants: ProductVariant[];
  selectedId?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="my-7">
      <legend className="mb-3 text-xs font-medium">Lựa chọn sản phẩm</legend>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <label key={variant.id} className="cursor-pointer">
            <input
              type="radio"
              name="product-variant"
              value={variant.id}
              checked={variant.id === selectedId}
              onChange={() => onChange(variant.id)}
              className="peer sr-only"
            />
            <span className="flex min-w-20 flex-col gap-1 border border-neutral-200 px-4 py-3 text-center text-xs transition peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-disabled:opacity-50">
              <span>
                {variant.name === "Default" ? "Tiêu chuẩn" : variant.name}
              </span>
              <span className="text-[10px] opacity-60">
                {variant.availableQuantity > 0
                  ? formatPrice(variant.priceAmount, variant.currency)
                  : "Hết hàng"}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
