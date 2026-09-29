"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store";
import { ApiClientError } from "@/src/shared/lib/api";
import { cartApi } from "../api/cart.api";
import type { AddCartItem } from "../types/cart";

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false, // POST adds quantity: retrying an uncertain response could add twice.
    mutationFn: async (item: AddCartItem) => {
      const { accessToken, user } = useAuthStore.getState();
      if (!accessToken || !user)
        throw new ApiClientError("Vui lòng đăng nhập để thêm vào giỏ.", 401);
      return {
        cart: await cartApi.addItem(item, accessToken),
        userId: user.id,
      };
    },
    onSuccess: ({ cart, userId }) => {
      if (useAuthStore.getState().user?.id !== userId) return;
      queryClient.setQueryData(["cart", userId], cart);
      toast.success("Đã thêm sản phẩm vào giỏ hàng.");
    },
  });
}
