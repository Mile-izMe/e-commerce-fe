import { requestData } from "@/src/shared/lib/api";
import { refreshSession, logoutSession } from "@/src/shared/lib/auth-session";
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

  refresh: refreshSession,
  logout: logoutSession,

  getProfile: (): Promise<UserType> =>
    requestData({
      method: "GET",
      url: "/users/me",
      requiresAuth: true,
    }),
};
