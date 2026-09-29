import { Minus, Plus } from "lucide-react";

export default function QuantitySelector({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className="inline-flex h-12 items-center border border-neutral-300"
      role="group"
      aria-label="Số lượng"
    >
      <button
        type="button"
        aria-label="Giảm số lượng"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
        className="h-full px-4 hover:bg-neutral-100 disabled:opacity-30"
      >
        <Minus aria-hidden className="h-3 w-3" />
      </button>
      <output aria-live="polite" className="min-w-6 text-center text-sm">
        {value}
      </output>
      <button
        type="button"
        aria-label="Tăng số lượng"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className="h-full px-4 hover:bg-neutral-100 disabled:opacity-30"
      >
        <Plus aria-hidden className="h-3 w-3" />
      </button>
    </div>
  );
}
