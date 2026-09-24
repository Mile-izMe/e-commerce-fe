import { requestData, requestNoContent } from "@/src/shared/lib/api";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  UserType,
} from "../types";

export const authApi = {
  register: (data: RegisterInput): Promise<AuthResponse> =>
    requestData({ method: "POST", url: "/auth/register", data }),

  login: (data: LoginInput): Promise<AuthResponse> =>
    requestData({ method: "POST", url: "/auth/login", data }),

  refresh: (refreshToken: string): Promise<AuthResponse> =>
    requestData({
      method: "POST",
      url: "/auth/refresh",
      data: { refreshToken },
    }),

  logout: (refreshToken: string): Promise<void> =>
    requestNoContent({
      method: "POST",
      url: "/auth/logout",
      data: { refreshToken },
    }),

  getProfile: (accessToken: string): Promise<UserType> =>
    requestData({
      method: "GET",
      url: "/users/me",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
