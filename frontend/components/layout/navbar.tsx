"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingBasket,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { UtilityPanel } from "@/components/layout/utility-panel";
import { Button } from "@/components/ui";
import { Link, useRouter } from "@/i18n/navigation";
import { mediaUrl } from "@/lib/api/client";
import { useIsMobile } from "@/hooks/use-media-query";
import { sheetIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const NAV_LINKS = [
  { href: "/recipes", key: "recipes", icon: LayoutGrid },
  { href: "/find", key: "findByIngredients", icon: Sparkles },
  { href: "/categories", key: "categories", icon: LayoutGrid },
  { href: "/favorites", key: "favorites", icon: Heart },
] as const;

export function Navbar({ onOpenUtilities }: { onOpenUtilities: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-[8px]"
          aria-label={t("home")}
        >
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand text-fg-inverse">
            <ChefMark />
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-fg sm:block">
            FintFood
          </span>
        </Link>

        {/* Desktop nav */}
        {!isMobile ? (
          <nav aria-label={t("primaryNavigation")} className="ml-4 flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={cn(
                  "relative rounded-[8px] px-3 py-2 text-sm font-medium",
                  "transition-colors duration-[var(--duration-fast)]",
                  isActive(link.href)
                    ? "text-fg-brand"
                    : "text-fg-muted hover:text-fg",
                )}
              >
                {t(link.key)}
                {isActive(link.href) ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex-1" />

        {/* Desktop search */}
        {!isMobile ? (
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder={t("searchPlaceholder")}
            className="w-56 lg:w-72"
          />
        ) : null}

        {/* Desktop actions */}
        {!isMobile ? (
          <div className="flex items-center gap-1.5">
            <UtilityButton onClick={onOpenUtilities} />
            <AuthMenu />
            <Button asChild size="sm" className="ml-1">
              <Link href="/recipes/new">
                <Plus aria-hidden />
                {t("createRecipe")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <UtilityButton onClick={onOpenUtilities} />
            <Button
              variant="ghost"
              size="icon"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile search row */}
      {isMobile ? (
        <div className="border-t border-border px-4 py-2.5">
          <SearchBox value={query} onChange={setQuery} placeholder={t("searchPlaceholder")} />
        </div>
      ) : null}

      <AnimatePresence>
        {isMobile && menuOpen ? (
          <motion.nav
            id="mobile-nav"
            key="mobile-nav"
            {...sheetIn}
            aria-label={t("primaryNavigation")}
            className="border-t border-border bg-surface px-4 py-3 shadow-[var(--shadow-pop)]"
          >
            <ul className="space-y-0.5">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium",
                        "transition-colors duration-[var(--duration-fast)]",
                        isActive(link.href)
                          ? "bg-brand-soft text-fg-brand"
                          : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {t(link.key)}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/shopping-list"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
                >
                  <ShoppingBasket className="size-4 shrink-0" aria-hidden />
                  {t("shoppingList")}
                </Link>
              </li>
            </ul>
            <div className="mt-3 border-t border-border pt-3">
              <AuthMenu block onNavigate={() => setMenuOpen(false)} />
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function UtilityButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("nav");
  return (
    <Button variant="ghost" size="icon" onClick={onClick} aria-label={t("openUtilities")}>
      <Settings aria-hidden />
    </Button>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const router = useRouter();

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/recipes?query=${encodeURIComponent(trimmed)}` : "/recipes");
  }

  return (
    <form role="search" onSubmit={submit} className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={t("search")}
        className={cn(
          "h-10 w-full rounded-full border border-border bg-surface-sunken pl-9 pr-3 text-sm text-fg",
          "placeholder:text-fg-subtle",
          "transition-[border-color,background-color] duration-[var(--duration-fast)]",
          "hover:border-border-strong focus-visible:border-brand focus-visible:bg-surface",
        )}
      />
    </form>
  );
}

function AuthMenu({ block = false, onNavigate }: { block?: boolean; onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const tp = useTranslations("profile");
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <Button asChild variant={block ? "secondary" : "ghost"} size={block ? "md" : "sm"} onClick={onNavigate}>
        <Link href="/login">
          <LogIn aria-hidden />
          {tc("signIn")}
        </Link>
      </Button>
    );
  }

  if (block) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{user?.display_name}</p>
            <p className="truncate text-xs text-fg-subtle">{user?.email}</p>
          </div>
        </div>
        <MobileAuthLink href="/profile" icon={UserIcon} label={t("profile")} onNavigate={onNavigate} />
        <MobileAuthLink href="/profile#my-recipes" icon={LayoutGrid} label={tp("myRecipes")} onNavigate={onNavigate} />
        <MobileAuthLink href="/shopping-list" icon={ShoppingBasket} label={t("shoppingList")} onNavigate={onNavigate} />
        <button
          type="button"
          onClick={async () => {
            onNavigate?.();
            await logout();
            toast.success(tc("signOut"));
          }}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          {tc("signOut")}
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-border bg-surface-sunken p-1 pr-2",
            "transition-colors duration-[var(--duration-fast)] hover:border-border-strong",
          )}
          aria-label={t("profile")}
        >
          <Avatar user={user} />
          <ChevronDown className="size-3.5 text-fg-subtle" aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-[12px] border border-border bg-surface-raised p-1.5 shadow-[var(--shadow-pop)]"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-fg">{user?.display_name}</p>
            <p className="truncate text-xs text-fg-subtle">{user?.email}</p>
          </div>
          <DropdownItem href="/profile" icon={UserIcon} label={t("profile")} />
          <DropdownItem href="/profile#my-recipes" icon={LayoutGrid} label={tp("myRecipes")} />
          <DropdownItem href="/shopping-list" icon={ShoppingBasket} label={t("shoppingList")} />
          <DropdownMenu.Separator className="my-1.5 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={async () => {
              await logout();
              toast.success(tc("signOut"));
            }}
            className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm text-danger outline-none data-[highlighted]:bg-danger-soft"
          >
            <LogOut className="size-4" aria-hidden />
            {tc("signOut")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function DropdownItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof UserIcon;
  label: string;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm text-fg-muted outline-none transition-colors data-[highlighted]:bg-surface-hover data-[highlighted]:text-fg"
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </Link>
    </DropdownMenu.Item>
  );
}

function MobileAuthLink({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: typeof UserIcon;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

function Avatar({ user }: { user: { avatar: string | null; display_name: string } | null }) {
  const src = mediaUrl(user?.avatar);
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={28}
        height={28}
        className="size-7 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-fg-brand">
      {(user?.display_name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

function ChefMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M7 20h10M6 16h12M8 16a4 4 0 0 1-1.2-7.8A4.5 4.5 0 0 1 16 7.6 4.2 4.2 0 0 1 16 16H8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { UtilityPanel };
