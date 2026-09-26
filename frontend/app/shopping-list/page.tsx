"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addShoppingItem,
  clearCompleted,
  deleteShoppingItem,
  errorMessage,
  getShoppingList,
  updateShoppingItem,
  type ShoppingItem,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Select,
} from "@/components/ui";
import { IconBasket, IconPlus, IconTrash } from "@/components/icons";

const UNITS = ["pcs", "g", "kg", "ml", "l", "tbsp", "tsp", "cup", "clove", "bunch", "slice", "pack", "can"];

export default function ShoppingListPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await getShoppingList();
      setItems(page.results);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, user, load]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const created = await addShoppingItem({
        name: name.trim(),
        quantity,
        unit,
      });
      setItems((prev) => {
        const without = prev.filter((item) => item.id !== created.id);
        return [...without, created].sort((a, b) => {
          if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
          return a.name.localeCompare(b.name);
        });
      });
      setName("");
      setQuantity("1");
      setUnit("pcs");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function toggleItem(item: ShoppingItem) {
    try {
      const updated = await updateShoppingItem(item.id, {
        is_completed: !item.is_completed,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function removeItem(item: ShoppingItem) {
    try {
      await deleteShoppingItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleClearCompleted() {
    try {
      await clearCompleted();
      setItems((prev) => prev.filter((item) => !item.is_completed));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (authLoading || (user && loading)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <LoadingState label="Loading shopping list…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Log in to use your shopping list"
          icon={<IconBasket width={26} height={26} />}
          action={<ButtonLink href="/login">Log in</ButtonLink>}
        >
          Add ingredients from any recipe and keep track of what to buy.
        </EmptyState>
      </div>
    );
  }

  const remaining = items.filter((item) => !item.is_completed).length;
  const completed = items.length - remaining;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Shopping list
          </h1>
          <div className="mt-2 flex gap-2">
            <Badge tone="emerald">{remaining} to buy</Badge>
            <Badge tone="zinc">{completed} done</Badge>
          </div>
        </div>
        {completed > 0 && (
          <Button variant="secondary" onClick={handleClearCompleted}>
            Clear completed
          </Button>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-8 grid gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-[1fr_110px_110px_auto] sm:items-end"
      >
        <Field label="Item">
          <Input
            placeholder="e.g. Olive oil"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Quantity">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </Field>
        <Field label="Unit">
          <Select value={unit} onChange={(event) => setUnit(event.target.value)}>
            {UNITS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={adding || !name.trim()} className="h-[42px]">
          <IconPlus width={16} height={16} />
          {adding ? "Adding…" : "Add"}
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            title="Your shopping list is empty"
            icon={<IconBasket width={26} height={26} />}
          >
            Add items above, or open a recipe and tap{" "}
            <strong>Add to shopping list</strong>.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  checked={item.is_completed}
                  onChange={() => toggleItem(item)}
                />
                <div className="flex-1">
                  <span
                    className={
                      item.is_completed
                        ? "text-sm text-zinc-400 line-through"
                        : "text-sm font-medium text-zinc-800 dark:text-zinc-200"
                    }
                  >
                    {item.name}
                  </span>
                  {item.category && (
                    <span className="ml-2 text-xs text-zinc-400">{item.category}</span>
                  )}
                </div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {item.quantity} {item.unit}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  aria-label={`Remove ${item.name}`}
                >
                  <IconTrash width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
