"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { authApi, type LoginInput, type RegisterInput } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  /** True while the initial session probe is in flight. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // The access token is httpOnly, so the only way to know whether a session
  // exists is to ask the API. 401s resolve to `null` rather than throwing.
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.session,
    queryFn: async (): Promise<User | null> => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.isUnauthorized) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  /** Drops every cached query: the next screen must not show stale user data. */
  const clearCache = useCallback(() => {
    queryClient.setQueryData(queryKeys.session, null);
    queryClient.clear();
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(queryKeys.session, user);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(queryKeys.session, user);
      queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearCache();
      router.refresh();
    },
  });

  const login = useCallback(
    async (input: LoginInput) => {
      await loginMutation.mutateAsync(input);
    },
    [loginMutation],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await registerMutation.mutateAsync(input);
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.session });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading,
      isAuthenticated: Boolean(data),
      login,
      register,
      logout,
      refresh,
    }),
    [data, isLoading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}

/** Convenience: turns any thrown error into a message safe to show the user. */
export function useAuthErrorMessage() {
  const t = useTranslations("errors");

  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.isNetwork) return t("network");
        if (error.status === 401) return t("unauthorized");
        const firstField = Object.values(error.fields)[0];
        return firstField?.[0] ?? error.message;
      }
      return t("generic");
    },
    [t],
  );
}
