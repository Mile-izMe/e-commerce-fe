import { requestCursorPage, requestData } from "@/src/shared/lib/api";

export interface CatalogQueryParams {
  cursor?: string;
  limit?: number;
  category?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: Array<{ id: string; url: string; altText: string | null; position: number }>;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    options: unknown;
    priceAmount: string;
    compareAtAmount: string | null;
    currency: string;
    availableQuantity: number;
  }>;
}

export const catalogApi = {
  list: (params: CatalogQueryParams = {}) =>
    requestCursorPage<Product>({ method: "GET", url: "/products", params }),
  getBySlug: (slug: string) =>
    requestData<Product>({ method: "GET", url: `/products/${encodeURIComponent(slug)}` }),
};
