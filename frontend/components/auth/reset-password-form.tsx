"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/login-form";
import { Button } from "@/components/ui";
import { Field, FormAlert } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  defaultFormMessages,
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validators";
import { useAuthErrorMessage } from "@/providers/auth-provider";

/**
 * Consume a `?uid=…&token=…` reset link.
 *
 * The credentials come from the emailed URL, so a missing or malformed pair
 * renders an explicit dead end instead of a form that cannot possibly submit.
 */
export function ResetPasswordForm({ uid, token }: { uid: string; token: string }) {
  const t = useTranslations("auth");
  const toMessage = useAuthErrorMessage();
  const linkLooksValid = Boolean(uid && token);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema(defaultFormMessages)),
    defaultValues: { uid, token, new_password: "", password2: "" },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!linkLooksValid) {
    return (
      <AuthShell title={t("resetTitle")} subtitle={t("resetSubtitle")}>
        <div className="space-y-5 text-center">
          <p className="text-sm text-fg-muted">{t("resetLinkInvalid")}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">{t("sendResetLink")}</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title={t("resetTitle")}>
        <div className="space-y-5 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-fg-brand">
            <ShieldCheck className="size-7" aria-hidden />
          </span>
          <p className="text-sm text-fg-muted">{t("resetDone")}</p>
          <Button asChild className="w-full">
            <Link href="/login">{t("signIn")}</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    try {
      await authApi.confirmPasswordReset({
        uid: values.uid,
        token: values.token,
        new_password: values.new_password,
      });
      setDone(true);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : toMessage(error));
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <AuthShell title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormAlert message={formError} />

        <Field label={t("newPassword")} error={errors.new_password?.message} hint={t("passwordHint")} required>
          <PasswordInput
            autoComplete="new-password"
            invalid={Boolean(errors.new_password)}
            {...form.register("new_password")}
          />
        </Field>

        <Field label={t("confirmPassword")} error={errors.password2?.message} required>
          <PasswordInput
            autoComplete="new-password"
            invalid={Boolean(errors.password2)}
            {...form.register("password2")}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingText={t("saving")}
        >
          {!isSubmitting ? <KeyRound aria-hidden /> : null}
          {t("save")}
        </Button>
      </form>
    </AuthShell>
  );
}
