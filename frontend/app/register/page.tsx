"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Alert, Button, Field, Input, Spinner } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({
        name: name.trim() || undefined,
        email: email.trim(),
        password,
        password2,
      });
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        It&apos;s free. Start matching recipes to the ingredients you already have.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Field label="Name" htmlFor="name" hint="Optional — shown on your reviews.">
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirm password" htmlFor="password2">
          <Input
            id="password2"
            type="password"
            autoComplete="new-password"
            required
            value={password2}
            onChange={(event) => setPassword2(event.target.value)}
          />
        </Field>

        {error && <Alert variant="error">{error}</Alert>}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : null}
          {busy ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
