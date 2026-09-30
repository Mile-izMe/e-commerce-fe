import axios from "axios";
import { getStoredRefreshToken, useAuthStore } from "@/store";
import type { AuthResponse } from "@/src/features/auth/types";
import type { ApiSuccessResponse } from "../types";
import { ApiClientError, normalizeApiError } from "./api-error";
import { httpConfig } from "./http-config";

// Separate transport: a failed refresh must never trigger another refresh.
export const sessionHttp = axios.create(httpConfig);
let pending: { version: number; promise: Promise<AuthResponse> } | null = null;

export function sessionChangedError() {
  return new ApiClientError(
    "Phiên đăng nhập đã thay đổi. Vui lòng thử lại.",
    401,
  );
}

export function refreshSession(): Promise<AuthResponse> {
  const snapshot = useAuthStore.getState();
  const version = snapshot.sessionVersion;
  if (pending?.version === version) return pending.promise;
  const token =
    snapshot.refreshToken ??
    (snapshot.status === "restoring" || snapshot.status === "restoreFailed"
      ? getStoredRefreshToken()
      : null);
  if (!token) {
    useAuthStore.getState().clearAuth();
    return Promise.reject(
      new ApiClientError(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        401,
      ),
    );
  }

  const promise = (async () => {
    try {
      const response = await sessionHttp.post<ApiSuccessResponse<AuthResponse>>(
        "/auth/refresh",
        { refreshToken: token },
      );
      const session = response.data.data;
      if (
        !response.data.success ||
        !session?.accessToken ||
        !session.refreshToken ||
        !session.user?.id
      ) {
        throw new ApiClientError("Phản hồi phiên đăng nhập không hợp lệ.", 502);
      }
      if (useAuthStore.getState().sessionVersion !== version) {
        // Logout/login happened while refreshing. Never resurrect the old session.
        void sessionHttp
          .post("/auth/logout", { refreshToken: session.refreshToken })
          .catch(() => {});
        throw sessionChangedError();
      }
      useAuthStore.getState().applyRefresh(session);
      return session;
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (
        useAuthStore.getState().sessionVersion === version &&
        (normalized.statusCode === 401 || normalized.statusCode === 403)
      ) {
        useAuthStore.getState().clearAuth();
      }
      throw normalized;
    }
  })();
  pending = { version, promise };
  const release = () => {
    if (pending?.promise === promise) pending = null;
  };
  void promise.then(release, release);
  return promise;
}

export async function logoutSession() {
  const token = useAuthStore.getState().refreshToken;
  // Invalidate immediately, including any pending requests/refresh response.
  useAuthStore.getState().clearAuth();
  if (token) {
    try {
      await sessionHttp.post("/auth/logout", { refreshToken: token });
    } catch (error) {
      throw normalizeApiError(error);
    }
  }
}
