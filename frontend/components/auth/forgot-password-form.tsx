"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { authApi } from "@/lib/api/auth";
import {
  defaultFormMessages,
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validators";
import { useAuthErrorMessage } from "@/providers/auth-provider";

/**
 * Request a reset link.
 *
 * The API always answers 200 so it cannot be used to enumerate accounts, so a
 * successful submit shows the neutral "if that email exists" confirmation rather
 * than claiming a mail was definitely sent.
 */
export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const toMessage = useAuthErrorMessage();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema(defaultFormMessages)),
    defaultValues: { email: "" },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    try {
      await authApi.requestPasswordReset({ email: values.email, locale });
      setSentTo(values.email);
    } catch (error) {
      setFormError(toMessage(error));
    }
  }

  if (sentTo) {
    return (
      <AuthShell title={t("forgotTitle")}>
        <div className="space-y-5 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-fg-brand">
            <MailCheck className="size-7" aria-hidden />
          </span>
          <p className="text-sm text-fg-muted">{t("resetSent")}</p>
          <p className="break-all text-sm font-semibold text-fg">{sentTo}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t("backToSignIn")}</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <AuthShell title={t("forgotTitle")} subtitle={t("forgotSubtitle")}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormAlert message={formError} />

        <Field label={t("email")} error={errors.email?.message} required>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            leadingIcon={<Mail aria-hidden />}
            {...form.register("email")}
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingText={t("sending")}
        >
          {!isSubmitting ? <Mail aria-hidden /> : null}
          {t("sendResetLink")}
        </Button>

        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">{t("backToSignIn")}</Link>
        </Button>
      </form>
    </AuthShell>
  );
}
