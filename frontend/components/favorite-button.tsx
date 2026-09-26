"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage, toggleFavorite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { IconHeart } from "@/components/icons";

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
          "inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold shadow-sm transition-all disabled:opacity-60 active:scale-[.98]",
          isFavorite
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
            : "border-zinc-200 bg-white text-zinc-700 hover:border-rose-200 hover:text-rose-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
        )}
      >
        <IconHeart width={18} height={18} filled={isFavorite} />
        {isFavorite ? "Saved" : "Save"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
