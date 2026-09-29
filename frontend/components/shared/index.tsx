"use client";

import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Reveal on scroll                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Fades a block in the first time 15% of it is visible (§22.2).
 *
 * With `prefers-reduced-motion` the transform is dropped entirely and the
 * block simply paints, which is the global rule from §22.3 applied once rather
 * than at every call site.
 */
export function RevealSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Error state                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Failure state with a retry affordance (§21). `onRetry` is optional so the
 * same component covers both recoverable query errors and terminal ones.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const t = useTranslations("common");

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft/40 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertCircle className="size-6" aria-hidden />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-fg">{title ?? t("somethingWentWrong")}</p>
        {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden />
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Card skeleton                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors `RecipeCard`'s exact box metrics (4:3 image + three text rows) so
 * swapping skeleton for content causes no layout shift (§22.2).
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface",
        className,
      )}
    >
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Card-shaped skeleton grid; `count` matches the real column count. */
export function SkeletonCardGrid({ count = 8 }: { count?: number }) {
  return (
    <ul
      aria-hidden
      className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <SkeletonCard />
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                  */
/* -------------------------------------------------------------------------- */

/** Numbered pagination for DRF `PageNumberPagination` responses (§6, §11). */
export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const t = useTranslations("recipes");
  if (totalPages <= 1) return null;

  // Window of at most 5 page numbers around the current page.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <nav
      aria-label={t("pagination")}
      className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}
    >
      <Button
        variant="outline"
        size="icon-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label={t("previousPage")}
      >
        <ChevronLeft aria-hidden />
      </Button>

      {pages.map((number) => (
        <Button
          key={number}
          variant={number === page ? "primary" : "ghost"}
          size="icon-sm"
          onClick={() => onChange(number)}
          aria-current={number === page ? "page" : undefined}
          aria-label={t("goToPage", { page: number })}
        >
          {number}
        </Button>
      ))}

      <Button
        variant="outline"
        size="icon-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label={t("nextPage")}
      >
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
