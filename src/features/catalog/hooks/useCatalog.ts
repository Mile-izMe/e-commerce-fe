"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { catalogApi } from "../api";
import type { CatalogQueryParams } from "../types";

type ProductFilters = Omit<CatalogQueryParams, "cursor">;

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: catalogApi.categories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryPreview(category: string) {
  return useQuery({
    queryKey: ["products", "preview", category],
    queryFn: () => catalogApi.list({ category, limit: 4 }),
  });
}

export function useProducts(filters: ProductFilters = {}, enabled = true) {
  return useInfiniteQuery({
    enabled,
    queryKey: ["products", "list", filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      catalogApi.list({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore
        ? (lastPage.meta.nextCursor ?? undefined)
        : undefined,
  });
}

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: ["products", "detail", slug],
    queryFn: () => catalogApi.getBySlug(slug),
    enabled: slug.trim().length > 0,
  });
}
