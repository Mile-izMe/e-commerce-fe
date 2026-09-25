import CatalogHero from "@/src/features/catalog/components/CatalogHero";
import CatalogProducts from "@/src/features/catalog/components/CatalogProducts";

export default function Home() {
  return (
    <main>
      <CatalogHero />
      <CatalogProducts />
      <footer className="border-t border-neutral-200 bg-[#fafaf8] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <span className="text-lg font-medium tracking-tight">ATELIER</span>
          <p className="text-xs text-neutral-500">Những điều giản dị. Mỗi ngày.</p>
        </div>
      </footer>
    </main>
  );
}
