import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { mediaUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

/** Category tile used on the home grid and the categories index (§5.4, §11). */
export async function CategoryCard({
  category,
  className,
  priority = false,
  showCount = true,
}: {
  category: Category;
  className?: string;
  priority?: boolean;
  showCount?: boolean;
}) {
  const t = await getTranslations("categories");
  const image = mediaUrl(category.image);

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative flex aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-sunken",
        "transition-[transform,border-color] duration-[var(--duration-base)] ease-[var(--ease-standard)]",
        "hover:-translate-y-1 hover:border-border-strong",
        "motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {image ? (
        <Image
          src={image}
          alt={category.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-[var(--duration-page)] ease-[var(--ease-standard)] group-hover:scale-[1.05] motion-reduce:group-hover:scale-100"
        />
      ) : null}

      {/* Solid scrim, not glassmorphism — keeps the label legible on any photo. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/70 to-transparent"
      />

      <span className="relative mt-auto flex flex-col gap-0.5 p-4">
        <span className="text-base font-semibold text-white">{category.name}</span>
        {showCount && category.recipe_count > 0 ? (
          <span className="text-xs text-white/80">
            {t("recipeCount", { count: category.recipe_count })}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
