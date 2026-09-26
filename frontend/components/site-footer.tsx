import Link from "next/link";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/recipes", label: "All recipes" },
      { href: "/find", label: "Cook from your fridge" },
      { href: "/recipes/?ordering=avg_rating", label: "Top rated" },
      { href: "/recipes/?ordering=-created_at", label: "Newest" },
    ],
  },
  {
    title: "Your kitchen",
    links: [
      { href: "/favorites", label: "Favorites" },
      { href: "/shopping-list", label: "Shopping list" },
      { href: "/recipes/new", label: "Add a recipe" },
      { href: "/profile", label: "Profile" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/api/v1/docs/", label: "API docs" },
      { href: "/api/v1/schema/", label: "OpenAPI schema" },
      { href: "/admin/", label: "Admin" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-black text-white">
              F
            </span>
            FintFood
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Turn whatever is in your fridge into tonight&apos;s dinner. Match
            recipes to the ingredients you already have.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500 dark:text-zinc-400">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} FintFood. Cook with what you have.</p>
          <p>Built with Django REST Framework &amp; Next.js</p>
        </div>
      </div>
    </footer>
  );
}
