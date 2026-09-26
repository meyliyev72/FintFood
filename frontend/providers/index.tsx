"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * Composes every client-side provider in dependency order:
 *   Theme  — no dependencies
 *   Query  — no dependencies
 *   Auth   — needs Query
 *   Toaster— needs Auth (inherits its theme)
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            closeButton
            richColors
            // Matches the --radius-control token so toasts feel native.
            toastOptions={{ className: "!rounded-[10px] !border-border !bg-surface-raised !text-fg" }}
          />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
