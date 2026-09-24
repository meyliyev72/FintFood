"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  changePassword,
  deleteRecipe,
  errorMessage,
  getMyRecipes,
  updateMe,
  type RecipeSummary,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  Textarea,
} from "@/components/ui";

export default function ProfilePage() {
  const { user, loading: authLoading, setUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio ?? "");
    }
  }, [user]);

  const loadRecipes = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const page = await getMyRecipes();
      setRecipes(page.results);
    } catch {
      setRecipes([]);
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRecipesLoading(false);
      return;
    }
    void loadRecipes();
  }, [authLoading, user, loadRecipes]);

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const updated = await updateMe({ name, bio });
      setUser(updated);
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileError(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        password2,
      });
      setPasswordMessage("Password changed. Please log in again.");
      setOldPassword("");
      setNewPassword("");
      setPassword2("");
      setUser(null);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setPasswordError(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteRecipe(slug);
      setRecipes((prev) => prev.filter((recipe) => recipe.slug !== slug));
    } catch (err) {
      setProfileError(errorMessage(err));
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <LoadingState label="Loading profile…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Log in to view your profile"
          action={<ButtonLink href="/login">Log in</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader
        title={user.display_name}
        subtitle={user.email}
        action={
          <>
            <ButtonLink href="/recipes/new">Add recipe</ButtonLink>
            <Button
              variant="secondary"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              Log out
            </Button>
          </>
        }
      />

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Profile details</h2>
        <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
          <Field label="Name" htmlFor="name">
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Bio" htmlFor="bio">
            <Textarea
              id="bio"
              rows={3}
              placeholder="Tell others a little about your cooking."
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </Field>
          {profileError && <Alert variant="error">{profileError}</Alert>}
          {profileMessage && <Alert variant="success">{profileMessage}</Alert>}
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <Field label="Current password" htmlFor="old">
            <Input
              id="old"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
            />
          </Field>
          <Field label="New password" htmlFor="new">
            <Input
              id="new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="new2">
            <Input
              id="new2"
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(event) => setPassword2(event.target.value)}
            />
          </Field>
          {passwordError && <Alert variant="error">{passwordError}</Alert>}
          {passwordMessage && <Alert variant="success">{passwordMessage}</Alert>}
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My recipes</h2>
          <ButtonLink href="/recipes/new" variant="secondary" size="sm">
            New recipe
          </ButtonLink>
        </div>
        <div className="mt-4">
          {recipesLoading ? (
            <LoadingState label="Loading your recipes…" />
          ) : recipes.length === 0 ? (
            <EmptyState title="You haven't added any recipes yet">
              Share your first recipe with the community.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {recipes.map((recipe) => (
                <li
                  key={recipe.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <Link
                    href={{ pathname: "/recipe", query: { slug: recipe.slug } }}
                    className="text-sm font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    {recipe.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(recipe.slug, recipe.title)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
