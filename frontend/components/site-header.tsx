"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/recipes", label: "Recipes" },
  { href: "/find", label: "Find by ingredients" },
  { href: "/favorites", label: "Favorites" },
  { href: "/shopping-list", label: "Shopping list" },
];

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-emerald-50">
            F
          </span>
          FintFood
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-zinc-900 dark:hover:text-white",
                pathname?.startsWith(item.href) && "text-emerald-700 dark:text-emerald-400",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {loading ? (
            <span className="h-8 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
          ) : user ? (
            <>
              <Link
                href="/recipes/new"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Add recipe
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white"
              >
                {user.display_name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 lg:hidden dark:border-zinc-800 dark:text-zinc-200"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="text-lg">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="flex flex-col gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/recipes/new" onClick={() => setOpen(false)}>
              Add recipe
            </Link>
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
            {user ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)}>
                  {user.display_name}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-zinc-500 dark:text-zinc-400"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
