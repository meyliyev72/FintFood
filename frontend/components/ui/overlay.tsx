"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui";
import { sheetIn, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Dialog                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Radix dialog with the §22.2 motion spec: the backdrop fades over 220ms and
 * the panel scales 0.96 -> 1 over the same window. Radix owns focus trapping
 * and the `Escape` / outside-click dismissal.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  hideClose = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
  const t = useTranslations("common");
  const prefersReducedMotion = useReducedMotion();

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay asChild>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.22 }}
          className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]"
        />
      </DialogPrimitive.Overlay>

      <DialogPrimitive.Content asChild {...props}>
        <motion.div
          {...(prefersReducedMotion
            ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
            : sheetIn)}
          transition={
            prefersReducedMotion
              ? { duration: 0.1 }
              : // Exit is quicker than entrance, per §22.2.
                { duration: 0.15, ease: [0.4, 0, 1, 1] }
          }
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-pop)]",
            "max-h-[calc(100dvh-3rem)] overflow-y-auto",
            className,
          )}
        >
          {children}
          {hideClose ? null : (
            <DialogPrimitive.Close
              className={cn(
                "absolute right-4 top-4 grid size-8 place-items-center rounded-[8px] text-fg-muted",
                "transition-colors duration-[var(--duration-fast)] hover:bg-surface-hover hover:text-fg",
              )}
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">{t("close")}</span>
            </DialogPrimitive.Close>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  title,
  description,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 space-y-1.5 pr-8", className)}>
      <DialogPrimitive.Title className="text-lg font-bold tracking-tight text-fg">
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="text-sm text-fg-muted">
          {description}
        </DialogPrimitive.Description>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bottom sheet (mobile filters, ingredient picker)                           */
/* -------------------------------------------------------------------------- */

/**
 * Slides up from the bottom edge with a drag handle. The handle is decorative
 * only — `Esc`, the backdrop and the close button are the real affordances, so
 * the sheet is never a dead control.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.button
            type="button"
            aria-label={t("close")}
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.22 }}
            className="absolute inset-0 w-full cursor-default bg-overlay"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            initial={prefersReducedMotion ? { opacity: 0 } : { y: "100%" }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: "100%" }}
            transition={prefersReducedMotion ? { duration: 0.1 } : spring}
            drag={prefersReducedMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_event, info) => {
              // Dismiss on a decisive downward flick.
              if (info.offset.y > 120 || info.velocity.y > 600) onOpenChange(false);
            }}
            className={cn(
              "absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto overscroll-contain",
              "rounded-t-[20px] border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]",
              "shadow-[var(--shadow-pop)]",
              className,
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4">
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-1 w-9 rounded-full bg-border-strong" />
                <h2 className="text-base font-semibold text-fg">{title}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenChange(false)}
                aria-label={t("close")}
              >
                <X aria-hidden />
              </Button>
            </div>

            <div className="px-5 py-5">{children}</div>
            {footer ? (
              <div className="sticky bottom-0 border-t border-border bg-surface px-5 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirm dialog                                                              */
/* -------------------------------------------------------------------------- */

/** Destructive confirmations (§21) — delete recipe, list item, review. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <DialogPrimitive.Title className="text-base font-semibold text-fg">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-sm text-fg-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isPending}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
