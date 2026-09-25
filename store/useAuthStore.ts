import type { AuthResponse, UserType } from "@/src/features/auth/types";
import { create } from "zustand";

type AuthStatus = "restoring" | "authenticated" | "unauthenticated" | "restoreFailed";
const REFRESH_TOKEN_KEY = "atelier.refreshToken";

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    if (token) return token;

    // Move a session saved by the previous version into localStorage once.
    const previousToken = window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (previousToken) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, previousToken);
      window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    return previousToken;
  } catch {
    return null;
  }
}

function saveRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Storage may be unavailable; the current in-memory session still works.
  }
}

interface AuthState {
  user: UserType | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  setAuth: (session: AuthResponse) => void;
  clearAuth: () => void;
  setRestoreFailed: () => void;
}

// Access token stays in memory; localStorage keeps the refresh token across tabs and restarts.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "restoring",
  setAuth: ({ user, accessToken, refreshToken }) => {
    saveRefreshToken(refreshToken);
    set({ user, accessToken, refreshToken, status: "authenticated" });
  },
  clearAuth: () => {
    saveRefreshToken(null);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: "unauthenticated",
    });
  },
  setRestoreFailed: () => set({ status: "restoreFailed" }),
}));
