import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-emerald-50">
            F
          </span>
          FintFood
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/recipes" className="hover:text-zinc-900 dark:hover:text-white">
            Recipes
          </Link>
          <Link href="/find" className="hover:text-zinc-900 dark:hover:text-white">
            Find by ingredients
          </Link>
          <a href="/api/v1/docs/" className="hover:text-zinc-900 dark:hover:text-white">
            API docs
          </a>
        </div>
        <p>Cook with what you have.</p>
      </div>
    </footer>
  );
}
