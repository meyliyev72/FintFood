"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Palette, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import { LanguageSwitcher } from "@/components/language/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui";
import { useIsMobile } from "@/hooks/use-media-query";
import { fadeIn, sheetIn } from "@/lib/motion";

/**
 * Language + theme utility panel.
 *
 * Desktop: a slide-in right side sheet (Radix Dialog).
 * Mobile:  a bottom sheet via `side="bottom"`.
 *
 * Opened from the navbar icon and from the mobile bottom bar.
 */
export function UtilityPanel({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
}) {
  const t = useTranslations("language");
  const tt = useTranslations("theme");
  const isMobile = useIsMobile();

  // Radix locks body scroll for a modal dialog; with `modal={false}` on the
  // desktop side sheet we do that ourselves so the page keeps its position.
  useEffect(() => {
    if (open || isMobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isMobile]);

  const title = (
    <span className="flex items-center gap-2">
      <Palette className="size-5 text-fg-brand" aria-hidden />
      {t("title")} &amp; {tt("title")}
    </span>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                key="utility-overlay"
                {...fadeIn}
                className={
                  isMobile
                    ? "fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]"
                    : "fixed inset-0 z-50 bg-overlay/40"
                }
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                key="utility-panel"
                {...sheetIn}
                aria-describedby={undefined}
                className={
                  isMobile
                    ? "glass-panel fixed inset-x-0 bottom-0 z-50 rounded-t-[20px] border-t border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-pop)]"
                    : "glass-panel fixed right-0 top-0 z-50 flex h-full w-[min(22rem,88vw)] flex-col border-l border-border p-5 shadow-[var(--shadow-pop)]"
                }
              >
                <div className="mb-6 flex items-center justify-between">
                  <Dialog.Title className="text-base font-semibold text-fg">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={t("title")}>
                      <X aria-hidden />
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="space-y-6 overflow-y-auto">
                  <section className="space-y-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                      {t("title")}
                    </h3>
                    <LanguageSwitcher />
                  </section>

                  <section className="space-y-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                      {tt("title")}
                    </h3>
                    <ThemeToggle className="w-full justify-between [&>button]:flex-1" />
                  </section>

                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
