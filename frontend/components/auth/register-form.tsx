"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthShell, AuthSwitch } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/login-form";
import { Button } from "@/components/ui";
import { Field, FormAlert, Input } from "@/components/ui/form";
import { useSafeRedirect } from "@/hooks/use-safe-redirect";
import { ApiError } from "@/lib/api/client";
import { defaultFormMessages, registerSchema, type RegisterValues } from "@/lib/validators";
import { useAuth, useAuthErrorMessage } from "@/providers/auth-provider";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { register } = useAuth();
  const toMessage = useAuthErrorMessage();
  const safeRedirect = useSafeRedirect("/");

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema(defaultFormMessages)),
    defaultValues: { name: "", email: "", password: "", password2: "" },
  });

  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        password2: values.password2,
      });
      router.replace(safeRedirect());
      router.refresh();
    } catch (error) {
      // A duplicate email is the one server error worth naming explicitly.
      if (error instanceof ApiError) {
        const emailErrors = error.fields.email;
        if (emailErrors?.length && /taken|exists|unique/i.test(emailErrors[0])) {
          setFormError(t("emailTaken"));
          return;
        }
      }
      setFormError(toMessage(error));
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <AuthShell
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      footer={<AuthSwitch question={t("haveAccount")} actionLabel={t("signIn")} href="/login" />}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormAlert message={formError} />

        <Field label={t("name")} error={errors.name?.message} required>
          <Input
            autoComplete="name"
            placeholder="Alisher Karimov"
            leadingIcon={<UserPlus aria-hidden />}
            {...form.register("name")}
          />
        </Field>

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

        <Field
          label={t("password")}
          error={errors.password?.message}
          hint={t("passwordHint")}
          required
        >
          <PasswordInput
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
            {...form.register("password")}
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
          loadingText={t("signingUp")}
        >
          {!isSubmitting ? <UserPlus aria-hidden /> : null}
          {t("signUp")}
        </Button>
      </form>
    </AuthShell>
  );
}
