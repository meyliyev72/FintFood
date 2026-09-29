import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui";
import { Link } from "@/i18n/navigation";

/**
 * Locale-scoped 404. Rendered when a recipe, category or any other slug-backed
 * route calls `notFound()`, so the visitor keeps the active language and a real
 * way out instead of a bare browser page.
 */
export default async function NotFound() {
  const t = await getTranslations("recipe");
  const tr = await getTranslations("recipes");
  const tc = await getTranslations("common");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-fg-brand">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        {t("notFound")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-fg-muted">
        {t("notFoundHint")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/recipes">{tr("title")}</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/">{tc("back")}</Link>
        </Button>
      </div>
    </div>
  );
}
