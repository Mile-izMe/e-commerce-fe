import { requestData } from "@/src/shared/lib/api";
import type { AddCartItem, Cart } from "../types/cart";

export const cartApi = {
  addItem: (data: AddCartItem) =>
    requestData<Cart>({
      method: "POST",
      url: "/cart/items",
      data,
      requiresAuth: true,
    }),
};
