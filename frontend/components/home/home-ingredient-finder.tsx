"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui";
import { Input } from "@/components/ui/form";
import { useRouter } from "@/i18n/navigation";
import { spring } from "@/lib/motion";
import { mediaUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types";

/**
 * Flagship "what do you have at home?" section (§5.2).
 *
 * Chips are laid out from the real ingredient catalog, toggled locally, and
 * handed to the full page as query params. The `layoutId` on each chip is what
 * produces the shared-element move when a chip is selected (§22.2).
 */
export function HomeIngredientFinder({
  popular,
  background,
}: {
  popular: Ingredient[];
  background: string | null;
}) {
  const t = useTranslations("home");
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<number[]>([]);
  const [term, setTerm] = useState("");
  const backgroundImage = useMemo(() => mediaUrl(background), [background]);

  const suggestions = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const pool = needle
      ? popular.filter((item) => item.name.toLowerCase().includes(needle))
      : popular;
    return pool.slice(0, 12);
  }, [popular, term]);

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function submit() {
    const query = selected.length ? `?ingredients=${selected.join(",")}` : "";
    router.push(`/find-by-ingredients${query}`);
  }

  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold tracking-tight text-fg">
              {t("findTitle")}
            </h2>
            <p className="mt-3 max-w-lg text-lg leading-relaxed text-fg-muted">
              {t("findSubtitle")}
            </p>

            <div className="mt-7 max-w-lg">
              <Input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t("popularIngredients")}
                aria-label={t("popularIngredients")}
                leadingIcon={<Search aria-hidden />}
              />
            </div>

            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                {t("popularIngredients")}
              </p>
              <ul className="flex flex-wrap gap-2">
                <AnimatePresence initial={false} mode="popLayout">
                  {suggestions.map((ingredient) => {
                    const active = selected.includes(ingredient.id);
                    return (
                      <motion.li
                        key={ingredient.id}
                        layout={!prefersReducedMotion}
                        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={
                          prefersReducedMotion
                            ? { opacity: 0, transition: { duration: 0.1 } }
                            : { opacity: 0, scale: 0.8, transition: { duration: 0.15 } }
                        }
                        transition={spring}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(ingredient.id)}
                          aria-pressed={active}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium",
                            "transition-[background-color,border-color,color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
                            "active:scale-[0.97]",
                            active
                              ? "border-brand bg-brand text-fg-inverse"
                              : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
                          )}
                        >
                          {ingredient.name}
                          {active ? (
                            <X className="size-3.5" aria-hidden />
                          ) : (
                            <span className="text-fg-subtle">+</span>
                          )}
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={submit} disabled={selected.length === 0}>
                {t("ctaFind")}
                <ArrowRight aria-hidden />
              </Button>
              <p className="text-sm text-fg-muted" aria-live="polite">
                {selected.length > 0 ? `${selected.length} × ${t("popularIngredients")}` : null}
              </p>
            </div>
          </div>

          <div className="relative hidden aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-sunken lg:block">
            {backgroundImage ? (
              <Image
                src={backgroundImage}
                alt=""
                fill
                sizes="45vw"
                className="object-cover"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Section wrapper that reveals once 15% of it is in view (§22.2). */
export function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
