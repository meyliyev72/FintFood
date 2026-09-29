import { getFormatter } from "next-intl/server";

/**
 * Locale-aware formatting helpers.
 *
 * §3.3 requires dates, numbers and units to respect the active locale, so every
 * value that reaches the UI goes through `next-intl`'s formatters rather than
 * string concatenation.
 */

/** Localized duration, e.g. 125 -> "2 ч 5 мин" / "125 min". */
export async function formatDuration(minutes: number): Promise<string> {
  const format = await getFormatter();
  return format.number(Math.round(minutes), {
    style: "unit",
    unit: "minute",
    unitDisplay: "long",
    maximumFractionDigits: 0,
  });
}

/** Plain localized number with at most `maximumFractionDigits` decimals. */
export async function formatNumber(
  value: number,
  maximumFractionDigits = 1,
): Promise<string> {
  const format = await getFormatter();
  return format.number(value, { maximumFractionDigits });
}

/** Localized date, e.g. "12 мар. 2026 г.". */
export async function formatDate(iso: string): Promise<string> {
  const format = await getFormatter();
  return format.dateTime(new Date(iso), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
