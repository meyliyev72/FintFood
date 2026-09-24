"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  confirmPasswordReset,
  errorMessage,
  requestPasswordReset,
} from "@/lib/api";
import { Alert, Button, Field, Input, Spinner } from "@/components/ui";

function RequestForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Alert variant="success">
        If an account exists for <strong>{email}</strong>, a reset link has been
        sent. Check your inbox and follow the link.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : null}
        {busy ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

function ConfirmForm({ uid, token }: { uid: string; token: string }) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await confirmPasswordReset({ uid, token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          Password has been reset. You can now sign in with your new password.
        </Alert>
        <Link
          href="/login"
          className="inline-block font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Go to log in →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="New password" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="password2">
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
        {busy ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}

function ResetInner() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const isConfirm = Boolean(uid && token);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {isConfirm ? "Choose a new password" : "Reset your password"}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {isConfirm
          ? "Enter a new password for your FintFood account."
          : "Enter your email and we'll send you a link to reset your password."}
      </p>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {isConfirm && uid && token ? (
          <ConfirmForm uid={uid} token={token} />
        ) : (
          <RequestForm />
        )}
      </div>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-zinc-500">Loading…</div>}>
      <ResetInner />
    </Suspense>
  );
}
