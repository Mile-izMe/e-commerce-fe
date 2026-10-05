import { requestData } from "@/src/shared/lib/api";
import type { AddCartItem, Cart, UpdateCartItem } from "../types/cart";

export const cartApi = {
  getCart: () =>
    requestData<Cart>({
      method: "GET",
      url: "/cart",
      requiresAuth: true,
    }),
  addToCart: (data: AddCartItem) =>
    requestData<Cart>({
      method: "POST",
      url: "/cart/items",
      data,
      requiresAuth: true,
    }),
  updateItemToCart: (itemId: string, data: UpdateCartItem) =>
    requestData<Cart>({
      method: "PATCH",
      url: `/cart/items/${itemId}`,
      data,
      requiresAuth: true,
    }),
  removeItemFromCart: (itemId: string) =>
    requestData<Cart>({
      method: "DELETE",
      url: `/cart/items/${itemId}`,
      requiresAuth: true,
    }),
  removeCart: () =>
    requestData<Cart>({
      method: "DELETE",
      url: `/cart/items`,
      requiresAuth: true,
    }),
};
