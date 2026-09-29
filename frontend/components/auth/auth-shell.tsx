"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { sectionInView } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Centered auth card shared by login / register / reset pages.
 *
 * Auth screens are a deliberate break from the wide content grid: one column,
 * generous vertical padding, and the utility panel stays reachable through the
 * normal navbar so language and theme are never stranded on a form.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Cross-link under the card, e.g. "No account? Sign up". */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      {...sectionInView}
      className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12 sm:py-16 lg:py-24"
    >
      <div
        className={cn(
          "rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8",
          className,
        )}
      >
        <header className="mb-7 space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">{title}</h1>
          {subtitle ? <p className="text-sm text-fg-muted">{subtitle}</p> : null}
        </header>
        {children}
      </div>
      {footer ? <div className="mt-6 text-center text-sm text-fg-muted">{footer}</div> : null}
    </motion.div>
  );
}

/** "Don't have an account? Sign up" style cross-link. */
export function AuthSwitch({
  question,
  actionLabel,
  href,
}: {
  question: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <p>
      {question}{" "}
      <Link
        href={href}
        className="font-semibold text-fg-brand underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:underline"
      >
        {actionLabel}
      </Link>
    </p>
  );
}

/** Small brand mark reused above the card title. */
export function AuthMark() {
  const t = useTranslations("common");
  return (
    <Link
      href="/"
      aria-label={t("appName")}
      className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-[10px]"
    >
      <span className="flex size-10 items-center justify-center rounded-[12px] bg-brand text-fg-inverse">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
          <path
            d="M7 20h10M6 16h12M8 16a4 4 0 0 1-1.2-7.8A4.5 4.5 0 0 1 16 7.6 4.2 4.2 0 0 1 16 16H8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
