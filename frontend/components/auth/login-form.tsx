"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthShell, AuthSwitch } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { useSafeRedirect } from "@/hooks/use-safe-redirect";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { defaultFormMessages, loginSchema, type LoginValues } from "@/lib/validators";
import { useAuth, useAuthErrorMessage } from "@/providers/auth-provider";

/** Password field with a show/hide toggle, shared by every auth form. */
export function PasswordInput({
  autoComplete,
  invalid,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);

  return (
    <Input
      id={id}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      invalid={invalid}
      {...props}
      trailingSlot={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={t(visible ? "hidePassword" : "showPassword")}
          aria-pressed={visible}
          className="grid size-8 place-items-center rounded-[8px] text-fg-subtle transition-colors duration-[var(--duration-fast)] hover:bg-surface-hover hover:text-fg"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      }
    />
  );
}

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();
  const toMessage = useAuthErrorMessage();
  const safeRedirect = useSafeRedirect("/");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema(defaultFormMessages)),
    defaultValues: { email: "", password: "" },
  });

  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login({ email: values.email, password: values.password });
      // The session cookie is already set; move on to the return target.
      router.replace(safeRedirect());
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 401
          ? t("invalidCredentials")
          : toMessage(error),
      );
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <AuthShell
      title={t("loginTitle")}
      subtitle={t("loginSubtitle")}
      footer={
        <AuthSwitch question={t("noAccount")} actionLabel={t("signUp")} href="/register" />
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormAlert message={formError} />

        <Field label={t("email")} error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            leadingIcon={<Mail aria-hidden />}
            {...form.register("email")}
          />
        </Field>

        <Field
          label={t("password")}
          error={errors.password?.message}
          className="space-y-1.5"
        >
          <PasswordInput
            autoComplete="current-password"
            invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
          <div className="flex justify-end pt-0.5">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg-brand"
            >
              {t("forgotPassword")}
            </Link>
          </div>
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingText={t("signingIn")}
        >
          {!isSubmitting ? <LogIn aria-hidden /> : null}
          {t("signIn")}
        </Button>
      </form>
    </AuthShell>
  );
}
