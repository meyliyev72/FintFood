"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { FormMessages } from "@/lib/validators";

/**
 * Builds a `FormMessages` object from the active locale.
 *
 * Every Zod schema in `lib/validators.ts` takes one so its messages follow the
 * page language instead of the hardcoded English fallback. Routing all of them
 * through this hook is what keeps §3.3 true for validation errors as well as
 * for visible labels.
 */
export function useFormMessages(): FormMessages {
  const t = useTranslations("errors");

  return useMemo(
    () => ({
      required: t("fieldRequired"),
      tooShort: t("tooShort"),
      invalidEmail: t("invalidEmail"),
      tooLong: t("tooLong"),
      positiveNumber: t("positiveNumber"),
      minValue: (n: number) => t("minValue", { min: n }),
      mismatch: t("mismatch"),
      invalid: t("validation"),
    }),
    [t],
  );
}
