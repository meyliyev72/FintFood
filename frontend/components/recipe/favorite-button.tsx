"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { toast } from "sonner";

import { favoritesApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { spring } from "@/lib/motion";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Recipe } from "@/types";
import { useAuth } from "@/providers/auth-provider";

/**
 * Heart toggle (§22.2).
 *
 * The spring pop and the single radial burst fire immediately on click, before
 * the API answers; on error the fill fades back out and a toast explains why.
 * Unauthenticated taps are a soft prompt to sign in rather than an error, and
 * the click never reaches the card link underneath.
 */
export function FavoriteButton({
  recipeId,
  initialIsFavorite,
  className,
  size = "md",
  showLabel = false,
  variant = "overlay",
}: {
  recipeId: Recipe["id"];
  initialIsFavorite: boolean;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  /** `overlay` floats on artwork; `inline` sits on a surface. */
  variant?: "overlay" | "inline";
}) {
  const t = useTranslations("recipe");
  const tc = useTranslations("errors");
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Optimistic local state keeps the heart instant; the mutation reconciles it.
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, setIsPending] = useState(false);
  // Drives the one-shot burst ring; `null` means "no burst in flight".
  const [burstKey, setBurstKey] = useState<number | null>(null);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setIsFavorite(initialIsFavorite), [initialIsFavorite]);

  useEffect(
    () => () => {
      if (burstTimer.current) clearTimeout(burstTimer.current);
    },
    [],
  );

  const mutation = useMutation({
    mutationFn: () => favoritesApi.toggle(recipeId),
    onMutate: async () => {
      setIsPending(true);
      const previous = isFavorite;
      setIsFavorite(!previous);
      return { previous };
    },
    onError: (error, _variables, context) => {
      setIsFavorite(context?.previous ?? false);
      if (error instanceof ApiError && !error.isUnauthorized) toast.error(tc("generic"));
    },
    onSuccess: (result) => {
      setIsFavorite(result.is_favorite);
      // Every list that can render a heart needs the reconciled state.
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      queryClient.invalidateQueries({ queryKey: queryKeys.favoriteIds });
    },
    onSettled: () => setIsPending(false),
  });

  function fireBurst() {
    if (prefersReducedMotion) return;
    if (burstTimer.current) clearTimeout(burstTimer.current);
    setBurstKey(Date.now());
    burstTimer.current = setTimeout(() => setBurstKey(null), 400);
  }

  function onClick(event: MouseEvent<HTMLButtonElement>) {
    // The card is wrapped in a link; stop the heart from navigating.
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      // `pathname` from the i18n navigation helper is already locale-prefixed,
      // so the user returns to this exact recipe after signing in.
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isFavorite) fireBurst();
    mutation.mutate();
  }

  const label = isFavorite ? t("saved") : t("save");
  const iconSize = size === "sm" ? "size-4" : "size-[18px]";

  return (
    <span className={cn("relative inline-flex", className)}>
      {burstKey != null ? (
        <motion.span
          key={burstKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-danger"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      ) : null}

      <motion.button
        type="button"
        onClick={onClick}
        disabled={isPending || isAuthLoading}
        aria-pressed={isFavorite}
        aria-label={!isAuthenticated ? t("signInToSave") : label}
        title={label}
        animate={isFavorite && !prefersReducedMotion ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={spring}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-full",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "size-8 justify-center" : "size-9 justify-center",
          showLabel && "h-9 px-3",
          isFavorite
            ? "bg-danger/12 text-danger"
            : variant === "overlay"
              ? "bg-surface/95 text-fg-muted hover:text-danger"
              : "border border-border bg-surface text-fg-muted hover:text-danger",
        )}
      >
        <motion.span
          animate={isFavorite && !prefersReducedMotion ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={spring}
          className="inline-flex"
        >
          <Heart className={cn(iconSize, isFavorite && "fill-current")} aria-hidden />
        </motion.span>
        {showLabel ? <span className="text-xs font-medium">{label}</span> : null}
      </motion.button>
    </span>
  );
}
