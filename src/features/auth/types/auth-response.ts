export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: UserType;
}

export type UserRole = "CUSTOMER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface UserType {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
}
