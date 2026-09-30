import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiSuccessResponse, CursorPaginationMeta } from "../types";
import { useAuthStore } from "@/store";
import { ApiClientError, normalizeApiError } from "./api-error";
import { refreshSession, sessionChangedError } from "./auth-session";
import { httpConfig } from "./http-config";

export { ApiClientError } from "./api-error";

declare module "axios" {
  interface AxiosRequestConfig {
    requiresAuth?: boolean;
  }
}

interface SessionRequest extends InternalAxiosRequestConfig {
  sessionVersion?: number;
  retried?: boolean;
}

export const api = axios.create(httpConfig);

function isSessionEndpoint(url = "") {
  return /^\/?auth\/(login|register|refresh|logout)(?:[/?#]|$)/.test(url);
}

api.interceptors.request.use((config: SessionRequest) => {
  if (!config.requiresAuth || isSessionEndpoint(config.url)) return config;
  const session = useAuthStore.getState();
  if (
    config.sessionVersion !== undefined &&
    config.sessionVersion !== session.sessionVersion
  )
    throw sessionChangedError();
  if (!session.accessToken)
    throw new ApiClientError("Vui lòng đăng nhập để tiếp tục.", 401);
  config.sessionVersion = session.sessionVersion;
  config.headers.set("Authorization", `Bearer ${session.accessToken}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    const config = response.config as SessionRequest;
    if (
      config.requiresAuth &&
      config.sessionVersion !== useAuthStore.getState().sessionVersion
    )
      throw sessionChangedError();
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw normalizeApiError(error);
    const config = error.config as SessionRequest | undefined;
    if (
      !config?.requiresAuth ||
      isSessionEndpoint(config.url) ||
      error.response?.status !== 401
    )
      throw normalizeApiError(error);
    const session = useAuthStore.getState();
    if (config.sessionVersion !== session.sessionVersion)
      throw sessionChangedError();
    if (config.retried) {
      // Do not invalidate a newer token because an older replay finished late.
      if (
        config.headers.get("Authorization") === `Bearer ${session.accessToken}`
      )
        session.clearAuth();
      throw normalizeApiError(error);
    }
    config.retried = true;
    // A concurrent request may already have rotated the token.
    if (config.headers.get("Authorization") === `Bearer ${session.accessToken}`)
      await refreshSession();
    if (config.sessionVersion !== useAuthStore.getState().sessionVersion)
      throw sessionChangedError();
    return api.request(config);
  },
);

function isApiSuccess<T>(value: unknown): value is ApiSuccessResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value
  );
}

export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiSuccessResponse<T>>(config);
  if (!isApiSuccess<T>(response.data)) {
    throw new ApiClientError(
      "Phản hồi từ máy chủ không hợp lệ.",
      response.status,
    );
  }
  return response.data.data;
}

export async function requestCursorPage<T>(
  config: AxiosRequestConfig,
): Promise<{ items: T[]; meta: CursorPaginationMeta }> {
  const response = await api.request<ApiSuccessResponse<T[]>>(config);
  const body = response.data;
  if (
    !isApiSuccess<T[]>(body) ||
    !Array.isArray(body.data) ||
    !body.meta ||
    typeof body.meta.hasMore !== "boolean" ||
    typeof body.meta.limit !== "number" ||
    (body.meta.nextCursor !== null && typeof body.meta.nextCursor !== "string")
  ) {
    throw new ApiClientError(
      "Phản hồi phân trang không hợp lệ.",
      response.status,
    );
  }
  return { items: body.data, meta: body.meta };
}

export async function requestNoContent(
  config: AxiosRequestConfig,
): Promise<void> {
  const response = await api.request(config);
  if (response.status !== 204) {
    throw new ApiClientError(
      "Phản hồi từ máy chủ không hợp lệ.",
      response.status,
    );
  }
}
