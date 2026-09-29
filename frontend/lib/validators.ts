/**
 * Zod schemas — the single source of truth for client-side form validation.
 *
 * Every rule here is mirrored by a DRF serializer on the server
 * (see §25); the client copy exists for instant feedback, never as the only
 * check. Message *keys* are translation keys rather than literals so the
 * same schema can be reused under uz / ru / en — see `formError()`.
 *
 * Usage with react-hook-form:
 *   useForm({ resolver: zodResolver(loginSchema) })
 * where a `LoginSchema` message function is supplied per locale.
 */

import { z } from "zod";

import type { Unit } from "@/types";

/* -------------------------------------------------------------------------- */
/* Message maps                                                                */
/* -------------------------------------------------------------------------- */

/** Translation keys `errors.*` understands, per field. */
export interface FormMessages {
  required: string;
  tooShort: string;
  invalidEmail: string;
  tooLong: string;
  positiveNumber: string;
  minValue: (n: number) => string;
  mismatch: string;
  invalid: string;
}

export const defaultFormMessages: FormMessages = {
  required: "This field is required",
  tooShort: "This is too short",
  invalidEmail: "Enter a valid email address",
  tooLong: "This is too long",
  positiveNumber: "Enter a positive number",
  minValue: (n) => `Must be at least ${n}`,
  mismatch: "Passwords do not match",
  invalid: "This value is not valid",
};

/* -------------------------------------------------------------------------- */
/* Primitives                                                                   */
/* -------------------------------------------------------------------------- */

const email = (m: FormMessages) => z.email({ error: m.invalidEmail });

/** A text field with a shared trim/length policy. */
const text = (m: FormMessages, { min = 1, max = 5000 }: { min?: number; max?: number } = {}) =>
  z
    .string()
    .trim()
    .min(min, m.required)
    .max(max, m.tooLong);

/** Positive integer, e.g. minutes or servings. */
const positiveInt = (m: FormMessages, max: number) =>
  z
    .number({ error: m.positiveNumber })
    .int(m.positiveNumber)
    .positive(m.positiveNumber)
    .max(max, m.tooLong);

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

/** Mirrors `LoginSerializer` (email + password). */
export const loginSchema = (m: FormMessages = defaultFormMessages) =>
  z.object({
    email: email(m),
    password: z.string().min(1, m.required),
  });

export type LoginValues = z.infer<ReturnType<typeof loginSchema>>;

/** Mirrors `RegisterSerializer`. */
export const registerSchema = (m: FormMessages = defaultFormMessages) => {
  const password = z
    .string()
    .min(8, m.tooShort)
    .regex(/[A-Za-z]/, m.invalid)
    .regex(/\d/, m.invalid);
  return z
    .object({
      name: text(m, { min: 2, max: 150 }),
      email: email(m),
      password,
      password2: z.string().min(1, m.required),
    })
    .refine((values) => values.password === values.password2, {
      message: m.mismatch,
      path: ["password2"],
    });
};

export type RegisterValues = z.infer<ReturnType<typeof registerSchema>>;

/** Mirrors `PasswordResetRequestSerializer`. */
export const forgotPasswordSchema = (m: FormMessages = defaultFormMessages) =>
  z.object({ email: email(m) });

export type ForgotPasswordValues = z.infer<ReturnType<typeof forgotPasswordSchema>>;

/** Mirrors `PasswordResetConfirmSerializer`. */
export const resetPasswordSchema = (m: FormMessages = defaultFormMessages) => {
  const password = z
    .string()
    .min(8, m.tooShort)
    .regex(/[A-Za-z]/, m.invalid)
    .regex(/\d/, m.invalid);
  return z
    .object({
      uid: z.string().min(1, m.required),
      token: z.string().min(1, m.required),
      new_password: password,
      password2: z.string().min(1, m.required),
    })
    .refine((values) => values.new_password === values.password2, {
      message: m.mismatch,
      path: ["password2"],
    });
};

export type ResetPasswordValues = z.infer<ReturnType<typeof resetPasswordSchema>>;

/** Mirrors `PasswordChangeSerializer`. */
export const changePasswordSchema = (m: FormMessages = defaultFormMessages) => {
  const password = z
    .string()
    .min(8, m.tooShort)
    .regex(/[A-Za-z]/, m.invalid)
    .regex(/\d/, m.invalid);
  return z
    .object({
      old_password: z.string().min(1, m.required),
      new_password: password,
      password2: z.string().min(1, m.required),
    })
    .refine((values) => values.new_password === values.password2, {
      message: m.mismatch,
      path: ["password2"],
    });
};

export type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>;

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

/** Mirrors the writable fields of `UserSerializer`. */
export const profileSchema = (m: FormMessages = defaultFormMessages) =>
  z.object({
    name: text(m, { min: 2, max: 150 }),
    bio: z.string().trim().max(500, m.tooLong).default(""),
  });

export type ProfileValues = z.infer<ReturnType<typeof profileSchema>>;

/* -------------------------------------------------------------------------- */
/* Recipe write                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors `apps.core.models.Unit`. Keep in sync with the backend enum: a
 * mismatch would make the API reject a value the UI happily offers.
 */
export const UNITS: Unit[] = [
  "g",
  "kg",
  "ml",
  "l",
  "pcs",
  "tbsp",
  "tsp",
  "cup",
  "clove",
  "bunch",
  "pinch",
  "slice",
  "pack",
  "can",
];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const RECIPE_STATUSES = ["draft", "pending", "published"] as const;

/** One row of the dynamic ingredient list (§12). */
export const recipeIngredientRowSchema = (m: FormMessages = defaultFormMessages) =>
  z
    .object({
      ingredient_id: z.number().int().positive().nullish(),
      /** Free text used when no catalog match was picked. */
      name: z.string().trim().max(120, m.tooLong).optional(),
      quantity: z
        .number({ error: m.positiveNumber })
        .positive(m.positiveNumber)
        .max(100000, m.tooLong),
      unit: z.enum(UNITS),
    })
    .refine((row) => Boolean(row.ingredient_id) || Boolean(row.name), {
      message: m.required,
      path: ["ingredient_id"],
    });

export type RecipeIngredientRow = z.infer<ReturnType<typeof recipeIngredientRowSchema>>;

/** One row of the dynamic instruction list (§12). */
export const recipeStepRowSchema = (m: FormMessages = defaultFormMessages) =>
  z.object({
    instruction: text(m, { min: 5, max: 2000 }),
  });

export type RecipeStepRow = z.infer<ReturnType<typeof recipeStepRowSchema>>;

/**
 * Mirrors `RecipeWriteSerializer`.
 *
 * `status` is restricted to what a non-staff author may set: staff-only values
 * are rejected by the server regardless, but the client never offers them.
 */
export const recipeSchema = (m: FormMessages = defaultFormMessages) =>
  z
    .object({
      title: text(m, { min: 3, max: 200 }),
      description: text(m, { min: 20, max: 4000 }),
      category_id: z.number({ error: m.required }).int().positive(m.required),
      cooking_time: positiveInt(m, 24 * 60),
      prep_time: positiveInt(m, 24 * 60),
      servings: positiveInt(m, 100),
      difficulty: z.enum(DIFFICULTIES, { error: m.required }),
      status: z.enum(RECIPE_STATUSES).default("published"),
      calories: z.number().int().positive().max(10000).nullish(),
      protein: z.number().positive().max(1000).nullish(),
      carbs: z.number().positive().max(1000).nullish(),
      fat: z.number().positive().max(1000).nullish(),
      ingredients: z.array(recipeIngredientRowSchema(m)).min(1, m.required),
      steps: z.array(recipeStepRowSchema(m)).min(1, m.required),
    })
    // A 10 MB / jpg-png-webp cover is enforced server-side; this keeps the
    // obvious mistakes off the wire (§12).
    .refine(
      (values) => values.cooking_time + values.prep_time <= 48 * 60,
      { message: m.invalid, path: ["cooking_time"] },
    );

export type RecipeFormValues = z.infer<ReturnType<typeof recipeSchema>>;

/* -------------------------------------------------------------------------- */
/* Shopping list                                                               */
/* -------------------------------------------------------------------------- */

/** Mirrors `ShoppingListItemSerializer` on create. */
export const shoppingListItemSchema = (m: FormMessages = defaultFormMessages) =>
  z
    .object({
      name: text(m, { min: 1, max: 120 }),
      ingredient_id: z.number().int().positive().nullish(),
      quantity: z.number({ error: m.positiveNumber }).positive(m.positiveNumber).max(100000),
      unit: z.enum(UNITS, { error: m.required }),
    })
    .refine((row) => Boolean(row.ingredient_id) || Boolean(row.name), {
      message: m.required,
      path: ["name"],
    });

export type ShoppingListItemValues = z.infer<ReturnType<typeof shoppingListItemSchema>>;

/* -------------------------------------------------------------------------- */
/* Review                                                                      */
/* -------------------------------------------------------------------------- */

/** Mirrors `ReviewSerializer`: rating 1–5, comment optional but bounded. */
export const reviewSchema = (m: FormMessages = defaultFormMessages) =>
  z.object({
    rating: z
      .number({ error: m.required })
      .int(m.invalid)
      .min(1, m.minValue(1))
      .max(5, m.invalid),
    comment: z.string().trim().max(2000, m.tooLong).default(""),
  });

export type ReviewValues = z.infer<ReturnType<typeof reviewSchema>>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Turns a `ZodError` into `{ field: message }` for server-side errors that do
 * not map onto a known field, so `Field error={...}` always has something to
 * show. DRF returns `{ errors: { field: [...] } }`; `apiFetch` already flattens
 * that into `ApiError.fields`.
 */
export function fieldsToErrors(
  fields: Record<string, string[] | undefined>,
): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value) && value.length) output[key] = value[0];
  }
  return output;
}
