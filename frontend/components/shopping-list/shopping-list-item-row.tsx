"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { Input, Select } from "@/components/ui/form";
import { UNITS } from "@/lib/validators";
import type { Unit } from "@/types";

/** A single shopping-list line: tick, edit in place, delete. */
export function ShoppingListItemRow({
  item,
  onToggle,
  onUpdate,
  onRemove,
  isUpdating = false,
  isRemoving = false,
}: {
  item: {
    id: number;
    name: string;
    quantity: string;
    /** Localized display label. */
    unit: string;
    /** Raw key used when writing an edit back. */
    unit_code: Unit;
    is_completed: boolean;
  };
  onToggle: (isCompleted: boolean) => void;
  onUpdate: (input: { quantity: string; unit: Unit }) => void;
  onRemove: () => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}) {
  const t = useTranslations("shoppingList");
  const tu = useTranslations("unit");
  const prefersReducedMotion = useReducedMotion();

  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState<Unit>(item.unit_code);
  const quantityRef = useRef<HTMLInputElement>(null);

  // Keep the draft in step with server values (e.g. after a merge or refetch).
  useEffect(() => {
    if (editing) return;
    setQuantity(item.quantity);
    setUnit(item.unit_code);
  }, [editing, item.quantity, item.unit_code]);

  useEffect(() => {
    if (editing) quantityRef.current?.select();
  }, [editing]);

  function save() {
    const next = Number.parseFloat(quantity);
    if (!Number.isFinite(next) || next <= 0) {
      setQuantity(item.quantity);
      setEditing(false);
      return;
    }
    onUpdate({ quantity: quantity.trim(), unit });
    setEditing(false);
  }

  const done = item.is_completed;
  const rowId = `shopping-item-${item.id}`;

  return (
    <motion.li
      layout={!prefersReducedMotion}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="group relative flex items-center gap-3 border-b border-border px-1 py-2.5 last:border-b-0"
    >
      <label htmlFor={rowId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <span className="relative flex size-5 shrink-0 items-center justify-center">
          <input
            id={rowId}
            type="checkbox"
            checked={done}
            onChange={(event) => onToggle(event.target.checked)}
            className="peer size-5 cursor-pointer appearance-none rounded-[5px] border border-border-strong bg-surface transition-colors duration-[var(--duration-instant)] checked:border-brand checked:bg-brand"
          />
          <Check
            aria-hidden
            className="pointer-events-none absolute size-3.5 text-on-brand opacity-0 transition-opacity duration-[var(--duration-fast)] peer-checked:opacity-100"
            strokeWidth={3}
          />
        </span>

        <span className="relative min-w-0 flex-1">
          <span
            className={
              "block truncate text-sm font-medium transition-colors duration-[var(--duration-fast)] " +
              (done ? "text-fg-muted" : "text-fg")
            }
          >
            {item.name}
          </span>
          {/* Strikethrough draws in from the left once the row is ticked. */}
          <AnimatePresence>
            {done ? (
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.1 : 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: "left" }}
                className="absolute inset-x-0 top-1/2 h-px bg-fg-muted"
              />
            ) : null}
          </AnimatePresence>
        </span>

        <span className="shrink-0 text-sm tabular-nums text-fg-secondary">
          {formatQuantity(item.quantity)} {item.unit}
        </span>
      </label>

      {editing ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <Input
            ref={quantityRef}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="decimal"
            className="h-9 w-20 text-sm"
            aria-label={t("editQuantity")}
          />
          <Select
            value={unit}
            onChange={(event) => setUnit(event.target.value as Unit)}
            className="h-9 w-24 text-sm"
            options={UNITS.map((value) => ({ value, label: tu(value) }))}
            aria-label={t("editUnit")}
          />
          <Button size="icon-sm" onClick={save} aria-label={t("saveEdit")}>
            <Check className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              setQuantity(item.quantity);
              setEditing(false);
            }}
            aria-label={t("cancelEdit")}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity duration-[var(--duration-fast)] md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            aria-label={t("editQuantity")}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onRemove}
            disabled={isRemoving}
            aria-label={t("removeItem")}
            className="text-danger hover:bg-danger/10"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      {isUpdating ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left animate-[progress_0.6s_ease-linear] bg-brand"
        />
      ) : null}
    </motion.li>
  );
}

/** `300.00` -> `300`, `0.50` -> `0.5`. Keeps the unit column aligned. */
function formatQuantity(value: string): string {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return value;
  return String(Number.parseFloat(parsed.toFixed(2)));
}
