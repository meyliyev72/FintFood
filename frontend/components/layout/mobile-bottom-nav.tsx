"use client";

import { Heart, Home, LayoutGrid, Search, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom bar.
 *
 * `pb-[env(safe-area-inset-bottom)]` keeps the bar clear of the iOS home
 * indicator; the page container adds matching bottom padding.
 */
export function MobileBottomNav({ onOpenUtilities }: { onOpenUtilities: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/", key: "home", icon: Home },
    { href: "/recipes", key: "recipes", icon: LayoutGrid },
    { href: "/find", key: "findByIngredients", icon: Search },
    { href: "/favorites", key: "favorites", icon: Heart },
  ] as const;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label={t("primaryNavigation")}
      className={cn(
        "glass-panel fixed inset-x-0 bottom-0 z-40 border-t border-border md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5",
                  "transition-colors duration-[var(--duration-fast)]",
                  active ? "text-fg-brand" : "text-fg-subtle hover:text-fg",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="text-[10px] font-medium leading-none">{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onOpenUtilities}
            aria-label={t("openUtilities")}
            className={cn(
              "flex w-full flex-col items-center gap-1 px-1 py-2.5",
              "transition-colors duration-[var(--duration-fast)]",
              pathname.startsWith("/profile") ? "text-fg-brand" : "text-fg-subtle hover:text-fg",
            )}
          >
            <Settings className="size-5" aria-hidden />
            <span className="text-[10px] font-medium leading-none">{t("utilities")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
