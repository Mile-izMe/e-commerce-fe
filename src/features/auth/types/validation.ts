export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  name?: string;
}
