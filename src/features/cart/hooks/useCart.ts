"use client";

import { ApiClientError } from "@/src/shared/lib/api";
import { sessionChangedError } from "@/src/shared/lib/auth-session";
import { useAuthStore } from "@/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cartApi } from "../api/cart.api";
import type { AddCartItem, UpdateCartItem } from "../types/cart";

interface UpdateCartProps {
  itemId: string;
  item: UpdateCartItem;
}

interface CartSession {
  userId: string;
  sessionVersion: number;
}

export const cartKey = (userId: string) => ["cart", userId] as const;

function requireCartSession(): CartSession {
  // Lấy dữ liệu hiện tại tại thời điểm gọi
  const { user, accessToken, status, sessionVersion } = useAuthStore.getState();
  if (status !== "authenticated" || !accessToken || !user) {
    throw new ApiClientError("Vui lòng đăng nhập để quản lý giỏ hàng.", 401);
  }
  return { userId: user.id, sessionVersion };
}

function isCurrentCartSession(session: CartSession): boolean {
  const current = useAuthStore.getState();
  return (
    current.user?.id === session.userId &&
    current.sessionVersion === session.sessionVersion
  );
}

export function useCart() {
  // Subscribe ở cấp cao nhất của hook để đổi phiên sẽ cập nhật query key/enabled.
  // Lấy các fields và đăng ký theo dõi => giá trị đổi thì component/hook render lại
  const userId = useAuthStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);
  const sessionVersion = useAuthStore((state) => state.sessionVersion);

  return useQuery({
    queryKey: cartKey(userId ?? ""),
    enabled: status === "authenticated" && !!userId && !!accessToken,
    queryFn: async () => {
      const session = requireCartSession();
      if (
        session.userId !== userId ||
        session.sessionVersion !== sessionVersion
      ) {
        throw sessionChangedError();
      }
      const cart = await cartApi.getCart();
      if (!isCurrentCartSession(session)) throw sessionChangedError();
      // Cache luôn chứa Cart, cùng kiểu với dữ liệu mutation ghi vào setQueryData.
      return cart;
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false, // POST cộng số lượng: không tự retry khi kết quả chưa chắc chắn.
    mutationFn: async (item: AddCartItem) => {
      const session = requireCartSession();
      return { cart: await cartApi.addToCart(item), ...session };
    },
    onSuccess: ({ cart, ...session }) => {
      if (!isCurrentCartSession(session)) return;
      queryClient.setQueryData(cartKey(session.userId), cart);
      toast.success("Đã thêm sản phẩm vào giỏ hàng.");
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false, // PATCH đặt số lượng tuyệt đối; lỗi để người dùng chủ động thử lại.
    mutationFn: async ({ itemId, item }: UpdateCartProps) => {
      const session = requireCartSession();
      return { cart: await cartApi.updateItemToCart(itemId, item), ...session };
    },
    onSuccess: ({ cart, ...session }) => {
      if (!isCurrentCartSession(session)) return;
      queryClient.setQueryData(cartKey(session.userId), cart);
      toast.success("Đã cập nhật số lượng sản phẩm.");
    },
  });
}

export function useRemoveItemFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (itemId: string) => {
      const session = requireCartSession();
      return { cart: await cartApi.removeItemFromCart(itemId), ...session };
    },
    onSuccess: ({ cart, ...session }) => {
      if (!isCurrentCartSession(session)) return;
      queryClient.setQueryData(cartKey(session.userId), cart);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
    },
  });
}

export function useRemoveCart() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async () => {
      const session = requireCartSession();
      return { cart: await cartApi.removeCart(), ...session };
    },
    onSuccess: ({ cart, ...session }) => {
      if (!isCurrentCartSession(session)) return;
      queryClient.setQueryData(cartKey(session.userId), cart);
      toast.success("Đã xóa toàn bộ giỏ hàng.");
    },
  });
}
