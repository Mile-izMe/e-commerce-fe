import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import {
  ApiErrorResponse,
  ApiSuccessResponse,
  CursorPaginationMeta,
} from "../types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null,
    public readonly errorCode?: string,
    public readonly traceId?: string,
    public readonly subErrors?: ApiErrorResponse["subErrors"],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function isApiError(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === false &&
    "message" in value &&
    typeof value.message === "string" &&
    "statusCode" in value &&
    typeof value.statusCode === "number"
  );
}

function isApiSuccess<T>(value: unknown): value is ApiSuccessResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value
  );
}

function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;

  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (isApiError(response?.data)) {
      const body = response.data;
      return new ApiClientError(
        body.message,
        response?.status ?? body.statusCode,
        body.errorCode,
        body.traceId,
        body.subErrors,
      );
    }

    if (!response) {
      return new ApiClientError(
        error.code === AxiosError.ETIMEDOUT ||
          error.code === AxiosError.ECONNABORTED
          ? "Yêu cầu quá thời gian. Vui lòng thử lại."
          : "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        null,
      );
    }

    return new ApiClientError(
      "Yêu cầu thất bại. Vui lòng thử lại.",
      response.status,
    );
  }

  return new ApiClientError("Đã xảy ra lỗi không xác định.", null);
}

const backendUrl =
  process.env.BACKEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";

// Browser requests go through Next.js so the backend does not need browser CORS.
export const api = axios.create({
  baseURL: typeof window === "undefined" ? backendUrl : "/backend",
  timeout: 15_000,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeApiError(error)),
);

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
