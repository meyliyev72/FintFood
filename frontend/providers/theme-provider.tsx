"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * `next-themes` toggles the `class` attribute on <html>, which is what
 * `globals.css` keys the `.dark` token overrides off.
 *
 * `suppressHydrationWarning` is required on <html> so the server-rendered
 * markup does not mismatch the theme applied before hydration.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
