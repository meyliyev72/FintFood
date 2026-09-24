"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage, toggleFavorite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  recipeId,
  initial,
  onToggled,
  className,
}: {
  recipeId: number;
  initial: boolean;
  onToggled?: (isFavorite: boolean) => void;
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await toggleFavorite(recipeId);
      setIsFavorite(result.is_favorite);
      onToggled?.(result.is_favorite);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60",
          isFavorite
            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
        )}
      >
        <span aria-hidden>{isFavorite ? "♥" : "♡"}</span>
        {isFavorite ? "Saved" : "Save"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
