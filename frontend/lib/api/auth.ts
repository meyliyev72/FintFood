import { api, type RequestOptions } from "./client";
import type { AuthResponse, User } from "@/types";

type Ctx = Pick<RequestOptions, "locale" | "signal">;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password2: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PasswordChangeInput {
  old_password: string;
  new_password: string;
  password2: string;
}

/** Auth endpoints. Tokens are set as httpOnly cookies by the API. */
export const authApi = {
  register: (input: RegisterInput, ctx: Ctx = {}) =>
    api.post<AuthResponse>("/auth/register/", input, ctx),

  login: (input: LoginInput, ctx: Ctx = {}) => api.post<AuthResponse>("/auth/login/", input, ctx),

  /** Blacklists the refresh token and clears the auth cookies. */
  logout: (ctx: Ctx = {}) => api.post<{ detail: string }>("/auth/logout/", undefined, ctx),

  /** Current user. Rejects with 401 when the session has expired. */
  me: (ctx: Ctx = {}) => api.get<User>("/auth/me/", ctx),

  /** Partial profile update (name, bio, avatar). */
  updateProfile: (input: Partial<Pick<User, "name" | "bio" | "avatar">>, ctx: Ctx = {}) =>
    api.patch<User>("/auth/me/", input, ctx),

  /** Clears the auth cookies on success, so the user signs in again. */
  changePassword: (input: PasswordChangeInput, ctx: Ctx = {}) =>
    api.post<{ detail: string }>("/auth/password/change/", input, ctx),

  /**
   * Requests a reset link. Always resolves, even for unknown emails, so the
   * endpoint cannot be used to discover registered addresses.
   */
  requestPasswordReset: (input: { email: string; locale?: string }, ctx: Ctx = {}) =>
    api.post<{ detail: string }>("/auth/password/reset/", input, ctx),

  confirmPasswordReset: (
    input: { uid: string; token: string; new_password: string },
    ctx: Ctx = {},
  ) => api.post<{ detail: string }>("/auth/password/reset/confirm/", input, ctx),
};
