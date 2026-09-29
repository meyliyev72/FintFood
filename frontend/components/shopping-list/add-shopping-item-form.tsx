"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui";
import { Field, Input, Select } from "@/components/ui/form";
import { useFormMessages } from "@/hooks/use-form-messages";
import { shoppingListItemSchema, UNITS } from "@/lib/validators";
import type { Unit } from "@/types";

/**
 * Manual entry for §9.
 *
 * Validation goes through `shoppingListItemSchema` so the browser and DRF
 * agree on what a valid line is; only the first failing message is surfaced,
 * because a three-field inline form does not need three red borders to explain
 * "type a number".
 *
 * Stays collapsed until asked for, so the list — not the form — is the page's
 * headline.
 */
export function AddShoppingItemForm({
  onAdd,
  isPending,
}: {
  onAdd: (input: { name: string; quantity: number; unit: Unit }) => Promise<void>;
  isPending: boolean;
}) {
  const t = useTranslations("shoppingList");
  const tu = useTranslations("unit");
  const tc = useTranslations("common");
  const messages = useFormMessages();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<Unit>("pcs");
  const [error, setError] = useState<string | null>(null);

  const schema = shoppingListItemSchema(messages);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = schema.safeParse({
      name,
      quantity: Number.parseFloat(quantity),
      unit,
    });

    // The messages are already localized strings by this point.
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? messages.invalid);
      return;
    }

    setError(null);
    await onAdd(parsed.data);
    setName("");
    setQuantity("1");
    setUnit("pcs");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Plus className="size-4" />
        {t("addItem")}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="w-full space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_auto] sm:items-start">
        <Field label={t("itemName")} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("addPlaceholder")}
            autoComplete="off"
            maxLength={120}
          />
        </Field>
        <Field label={t("quantity")} required>
          <Input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="decimal"
            className="tabular-nums"
          />
        </Field>
        <Field label={t("unit")}>
          <Select
            value={unit}
            onChange={(event) => setUnit(event.target.value as Unit)}
            options={UNITS.map((value) => ({ value, label: tu(value) }))}
          />
        </Field>        <div className="flex gap-2 sm:pt-7">
          <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none">
            {isPending ? tc("saving") : t("submitAdd")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
