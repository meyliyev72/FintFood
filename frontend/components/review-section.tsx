"use client";

import { useEffect, useState } from "react";
import {
  createReview,
  deleteReview,
  errorMessage,
  type Review,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Alert, Button, Stars, Textarea } from "@/components/ui";

export function ReviewSection({
  recipeId,
  initialReviews,
  onReviewsChange,
}: {
  recipeId: number;
  initialReviews: Review[];
  onReviewsChange?: (reviews: Review[]) => void;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const myReview = user ? reviews.find((r) => r.user.id === user.id) : undefined;

  function update(next: Review[]) {
    setReviews(next);
    onReviewsChange?.(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createReview({ recipe_id: recipeId, rating, comment });
      const withoutMine = reviews.filter((r) => r.user.id !== created.user.id);
      update([created, ...withoutMine]);
      setComment("");
      setSuccess("Your review has been saved.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    setBusy(true);
    setError(null);
    try {
      await deleteReview(id);
      update(reviews.filter((r) => r.id !== id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold tracking-tight">
        Reviews{" "}
        <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">
          ({reviews.length})
        </span>
      </h2>

      {user ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {myReview ? "Update your review" : "Write a review"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                className={`text-2xl leading-none ${
                  value <= rating ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"
                }`}
              >
                ★
              </button>
            ))}
            <span className="ml-1 text-sm text-zinc-500 dark:text-zinc-400">
              {rating}/5
            </span>
          </div>
          <Textarea
            className="mt-3"
            rows={3}
            placeholder="How did it turn out?"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          {error && (
            <div className="mt-3">
              <Alert variant="error">{error}</Alert>
            </div>
          )}
          {success && (
            <div className="mt-3">
              <Alert variant="success">{success}</Alert>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : myReview ? "Update review" : "Post review"}
            </Button>
            {myReview && (
              <Button
                variant="danger"
                onClick={() => handleDelete(myReview.id)}
                disabled={busy}
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Log in to write a review.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No reviews yet. Be the first to share your thoughts.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                    {review.user.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{review.user.name}</p>
                    <Stars rating={review.rating} />
                  </div>
                </div>
                <time className="text-xs text-zinc-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </time>
              </div>
              {review.comment && (
                <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                  {review.comment}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
