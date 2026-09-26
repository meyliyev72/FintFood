"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCategories,
  getFavorites,
  getShoppingList,
  type Category,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  IconCart,
  IconClose,
  IconHeart,
  IconMenu,
  IconPlus,
  IconSearch,
  IconUser,
} from "@/components/icons";

const NAV = [
  { href: "/recipes", label: "Recipes" },
  { href: "/find", label: "Cook from fridge" },
  { href: "/favorites", label: "Favorites" },
  { href: "/shopping-list", label: "Shopping list" },
];

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [shoppingCount, setShoppingCount] = useState(0);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoritesCount(0);
      setShoppingCount(0);
      return;
    }
    let cancelled = false;
    Promise.all([getFavorites(), getShoppingList()])
      .then(([favorites, shopping]) => {
        if (cancelled) return;
        setFavoritesCount(favorites.count);
        setShoppingCount(
          shopping.results.filter((item) => !item.is_completed).length,
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = term.trim();
    router.push(query ? `/recipes/?query=${encodeURIComponent(query)}` : "/recipes/");
    setOpen(false);
  }

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-black text-white shadow-sm">
            F
          </span>
          <span className="hidden text-lg sm:inline">FintFood</span>
        </Link>

        <form
          onSubmit={handleSearch}
          className="relative hidden flex-1 items-center md:flex"
          role="search"
        >
          <IconSearch
            width={18}
            height={18}
            className="pointer-events-none absolute left-3.5 text-zinc-400"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search recipes, ingredients…"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/favorites"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-rose-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Favorites"
          >
            <IconHeart width={21} height={21} />
            {favoritesCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {favoritesCount}
              </span>
            )}
          </Link>
          <Link
            href="/shopping-list"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Shopping list"
          >
            <IconCart width={21} height={21} />
            {shoppingCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                {shoppingCount}
              </span>
            )}
          </Link>

          {loading ? (
            <span className="ml-1 hidden h-9 w-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:block" />
          ) : user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/recipes/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <IconPlus width={16} height={16} />
                Add
              </Link>
              <Link
                href="/profile"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white"
                aria-label="Profile"
              >
                {user.display_name.charAt(0).toUpperCase()}
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 sm:hidden dark:border-zinc-800 dark:text-zinc-200"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      <div className="mx-auto hidden w-full max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6 lg:flex">
        <Link
          href="/recipes"
          className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-emerald-950"
        >
          All recipes
        </Link>
        {categories.slice(0, 10).map((category) => (
          <Link
            key={category.id}
            href={`/recipes/?category=${category.slug}`}
            className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-emerald-950"
          >
            {category.name}
          </Link>
        ))}
        <Link
          href="/find"
          className="ml-auto shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
        >
          Cook from your fridge →
        </Link>
      </div>

      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 sm:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <form onSubmit={handleSearch} className="relative mb-4 flex items-center">
            <IconSearch
              width={18}
              height={18}
              className="pointer-events-none absolute left-3.5 text-zinc-400"
            />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search recipes…"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </form>
          <nav className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/recipes/new"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Add recipe
            </Link>
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <IconUser width={16} height={16} />
                  {user.display_name}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-center font-semibold text-white"
                >
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
