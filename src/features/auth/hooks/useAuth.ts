"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store";
import { ApiClientError } from "@/src/shared/lib/api";
import { authApi } from "../api";
import type { AuthResponse, LoginInput, RegisterInput, UserType } from "../types";

const profileKey = ["auth", "me"] as const;

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (session: AuthResponse) => {
      setAuth(session);
      queryClient.setQueryData(profileKey, session.user);
      toast.success("Đăng nhập thành công");
      router.push("/");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (session: AuthResponse) => {
      setAuth(session);
      queryClient.setQueryData(profileKey, session.user);
      toast.success("Đăng ký thành công");
      router.push("/");
    },
  });
}

export function useProfile() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<UserType>({
    queryKey: profileKey,
    queryFn: () => {
      if (!accessToken) throw new ApiClientError("Chưa có phiên đăng nhập.", 401);
      return authApi.getProfile(accessToken);
    },
    enabled: accessToken !== null,
  });
}

export function useRefreshToken() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        throw new ApiClientError("Chưa có phiên đăng nhập.", 401);
      }
      return authApi.refresh(refreshToken);
    },
    onSuccess: (session: AuthResponse) => {
      setAuth(session);
      queryClient.setQueryData(profileKey, session.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) await authApi.logout(refreshToken);
    },
    onSuccess: () => {
      toast.success("Đã đăng xuất");
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
