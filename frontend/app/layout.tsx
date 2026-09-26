import type { ReactNode } from "react";

import "./globals.css";

/**
 * Root layout.
 *
 * Deliberately contains no `<html>`/`<body>`: the `lang` attribute must
 * reflect the active locale, so the document shell lives in
 * `app/[locale]/layout.tsx` where the locale is available.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
