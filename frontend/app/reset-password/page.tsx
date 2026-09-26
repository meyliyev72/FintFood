"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  confirmPasswordReset,
  errorMessage,
  requestPasswordReset,
} from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";
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
          placeholder="you@example.com"
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
          className="inline-block font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
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
          placeholder="••••••••"
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
          placeholder="••••••••"
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
    <AuthShell
      title={isConfirm ? "Choose a new password" : "Reset your password"}
      subtitle={
        isConfirm
          ? "Enter a new password for your FintFood account."
          : "Enter your email and we'll send you a link to reset your password."
      }
      footer={
        <Link
          href="/login"
          className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Back to log in
        </Link>
      }
    >
      {isConfirm && uid && token ? (
        <ConfirmForm uid={uid} token={token} />
      ) : (
        <RequestForm />
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-zinc-500">Loading…</div>}>
      <ResetInner />
    </Suspense>
  );
}
