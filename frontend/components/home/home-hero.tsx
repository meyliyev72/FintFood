"use client";

import { ArrowRight, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui";
import { Input } from "@/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";

/**
 * Above-the-fold hero (§5.1).
 *
 * Deliberately *not* animated in: §22.2 requires hero content to paint
 * immediately on every load.
 */
export function HomeHero({ image }: { image: string | null }) {
  const t = useTranslations("home");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/recipes?query=${encodeURIComponent(term)}` : "/recipes");
  }

  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-surface-sunken">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-fg">
            {t("heroTitle")}
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-fg-muted">{t("heroSubtitle")}</p>

          <form onSubmit={onSubmit} role="search" className="mt-8 flex gap-2">
            <Input
              type="search"
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              leadingIcon={<Search aria-hidden />}
              className="h-12 flex-1"
            />
            <Button
              type="submit"
              size="icon"
              className="size-12 shrink-0"
              aria-label={t("searchPlaceholder")}
            >
              <Search aria-hidden />
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/find-by-ingredients">
                <Sparkles aria-hidden />
                {t("ctaFind")}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/recipes">
                {t("ctaBrowse")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card-hover)]">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
