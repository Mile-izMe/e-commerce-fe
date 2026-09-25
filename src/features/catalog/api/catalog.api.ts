import { requestCursorPage, requestData } from "@/src/shared/lib/api";
import { Product } from "../types";
import { CatalogQueryParams } from "../types/validation";
import type { Category } from "../types/category";

export const catalogApi = {
  categories: () => requestData<Category[]>({ method: "GET", url: "/categories" }),
  list: (params: CatalogQueryParams = {}) =>
    requestCursorPage<Product>({ method: "GET", url: "/products", params }),
  getBySlug: (slug: string) =>
    requestData<Product>({
      method: "GET",
      url: `/products/${encodeURIComponent(slug)}`,
    }),
};
