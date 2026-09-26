"use client";

import { Check, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Language switcher.
 *
 * Switching keeps the user on the same page: it rewrites the first path
 * segment instead of navigating home, so /uz/recipes?difficulty=easy becomes
 * /ru/recipes?difficulty=easy.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    // `params` carries dynamic segments (e.g. { slug }); forwarding it keeps
    // the current record in view after the switch.
    startTransition(() => {
      router.replace(
        // @ts-expect-error pathname is a typed route; dynamic segments are filled from params
        { pathname, params },
        { locale: next },
      );
    });
  }

  return (
    <div
      className={cn("space-y-1", className)}
      role="radiogroup"
      aria-label={t("title")}
      data-pending={pending || undefined}
    >
      {locales.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => change(option)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-sm",
              "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
              active
                ? "bg-brand-soft font-medium text-fg-brand"
                : "text-fg-muted hover:bg-surface-hover hover:text-fg",
            )}
          >
            <span className="flex items-center gap-2">
              {active ? (
                <Check className="size-4 shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="size-4 shrink-0 opacity-0" aria-hidden />
              )}
              {localeNames[option]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
