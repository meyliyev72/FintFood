"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eraser, Loader2, ShoppingBasket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { AddShoppingItemForm } from "@/components/shopping-list/add-shopping-item-form";
import { ShoppingListItemRow } from "@/components/shopping-list/shopping-list-item-row";
import { Link } from "@/i18n/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useShoppingList } from "@/hooks/use-shopping-list";
import { ApiError } from "@/lib/api/client";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/overlay";
import type { Unit } from "@/types";

/**
 * Shopping list (§9).
 *
 * Grouping and the completed/remaining split come from `useShoppingList`;
 * destructive actions go through `ConfirmDialog` as §21 requires.
 */
export function ShoppingListView() {
  const t = useTranslations("shoppingList");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const tf = useTranslations("favorites");
  const prefersReducedMotion = useReducedMotion();

  // Redirects to /login with a return path when there is no session.
  const isAllowed = useRequireAuth();

  const [pendingRemoval, setPendingRemoval] = useState<{ id: number; name: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const {
    groups,
    remainingCount,
    completedCount,
    isLoading,
    isError,
    refetch,
    toggle,
    update,
    remove,
    add,
    clearCompleted,
  } = useShoppingList({ enabled: isAllowed });

  function report(error: unknown, fallback: string) {
    toast.error(error instanceof ApiError && error.message ? error.message : fallback);
  }

  const handleAdd = async (input: { name: string; quantity: number; unit: Unit }) => {
    try {
      await add.mutateAsync(input);
      toast.success(t("added", { count: 1 }));
    } catch (error) {
      report(error, te("saveFailed"));
    }
  };

  if (!isAllowed) return <ShoppingListSkeleton />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-fg-muted">{t("subtitle")}</p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <AddShoppingItemForm onAdd={handleAdd} isPending={add.isPending} />

        {completedCount > 0 ? (
          <Button
            variant="ghost"
            onClick={() => setConfirmClear(true)}
            disabled={clearCompleted.isPending}
          >
            {clearCompleted.isPending ? <Loader2 className="size-4 animate-spin" /> : <Eraser className="size-4" />}
            {t("clearCompleted")}
          </Button>
        ) : null}

        {remainingCount + completedCount > 0 ? (
          <p className="ml-auto text-sm text-fg-muted">
            {t("remaining")}: <span className="font-medium text-fg">{remainingCount}</span>
            {" · "}
            {t("completedCount", { count: completedCount })}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <ShoppingListSkeleton />
      ) : isError ? (
        <EmptyState
          title={te("loadFailed")}
          description={te("generic")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {tc("retry")}
            </Button>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<ShoppingBasket className="size-8" />}
          title={t("empty")}
          description={t("emptyHint")}
          action={
            <Button asChild variant="secondary">
              <Link href="/recipes">{tf("explore")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <AnimatePresence initial={false} mode="popLayout">
            {groups.map((group) => (
              <motion.section
                key={group.category}
                layout={!prefersReducedMotion}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[var(--radius-card)] border border-border bg-surface"
              >
                <h2 className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-fg-muted">
                  {group.category}
                </h2>
                <ul className="px-3">
                  {group.items.map((item) => (
                    <ShoppingListItemRow
                      key={item.id}
                      item={item}
                      isUpdating={toggle.isPending && toggle.variables?.id === item.id}
                      isRemoving={remove.isPending && remove.variables === item.id}
                      onToggle={(isCompleted) => {
                        toggle.mutate(
                          { id: item.id, isCompleted },
                          { onError: (error) => report(error, te("saveFailed")) },
                        );
                      }}
                      onUpdate={(input) => {
                        update.mutate(
                          { id: item.id, input },
                          { onError: (error) => report(error, te("saveFailed")) },
                        );
                      }}
                      onRemove={() => setPendingRemoval({ id: item.id, name: item.name })}
                    />
                  ))}
                </ul>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title={t("removeItem")}
        description={pendingRemoval ? t("removeConfirm", { name: pendingRemoval.name }) : undefined}
        confirmLabel={t("removeItem")}
        cancelLabel={t("cancelEdit")}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!pendingRemoval) return;
          const id = pendingRemoval.id;
          setPendingRemoval(null);
          remove.mutate(id, {
            onSuccess: () => toast.success(t("removed")),
            onError: (error) => report(error, te("saveFailed")),
          });
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title={t("confirmClearTitle")}
        description={t("confirmClearBody")}
        confirmLabel={t("clearCompleted")}
        cancelLabel={t("cancelEdit")}
        isPending={clearCompleted.isPending}
        onConfirm={() => {
          clearCompleted.mutate(undefined, {
            onSuccess: ({ deleted }) => {
              setConfirmClear(false);
              toast.success(t("cleared", { count: deleted }));
            },
            onError: (error) => report(error, te("saveFailed")),
          });
        }}
      />
    </div>
  );
}

function ShoppingListSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      {[0, 1].map((group) => (
        <div key={group} className="rounded-[var(--radius-card)] border border-border bg-surface">
          <Skeleton className="h-11 w-full rounded-none border-b border-border" />
          <div className="space-y-3 px-4 py-4">
            {Array.from({ length: group === 0 ? 4 : 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-[5px]" />
                <Skeleton className="h-4 flex-1" style={{ maxWidth: `${55 - i * 8}%` }} />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
