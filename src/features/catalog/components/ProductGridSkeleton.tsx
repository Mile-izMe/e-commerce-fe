export default function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      aria-label="Đang tải sản phẩm"
      className="grid grid-cols-2 gap-5 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="motion-safe:animate-pulse">
          <div className="aspect-[4/5] bg-neutral-200/60" />
          <div className="mt-4 h-3 w-3/4 bg-neutral-200/60" />
          <div className="mt-3 h-3 w-1/3 bg-neutral-200/60" />
        </div>
      ))}
    </div>
  );
}
