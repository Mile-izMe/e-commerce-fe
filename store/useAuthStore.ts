import type { AuthResponse, UserType } from "@/src/features/auth/types";
import { create } from "zustand";

type AuthStatus = "authenticated" | "unauthenticated";

interface AuthState {
  user: UserType | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  setAuth: (session: AuthResponse) => void;
  clearAuth: () => void;
}

// Tokens are memory-only. A page reload requires signing in again.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "unauthenticated",
  setAuth: ({ user, accessToken, refreshToken }) =>
    set({ user, accessToken, refreshToken, status: "authenticated" }),
  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: "unauthenticated",
    }),
}));
