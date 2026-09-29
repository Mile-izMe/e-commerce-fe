import { requestData } from "@/src/shared/lib/api";
import type { AddCartItem, Cart } from "../types/cart";

export const cartApi = {
  addItem: (data: AddCartItem, accessToken: string) =>
    requestData<Cart>({
      method: "POST",
      url: "/cart/items",
      data,
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
