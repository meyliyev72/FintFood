"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Pencil, Star, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared";
import { Button, Skeleton } from "@/components/ui";
import { RatingInput, RatingStars, Textarea } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/overlay";
import { usePathname, useRouter } from "@/i18n/navigation";
import { reviewsApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/providers/auth-provider";
import type { Review } from "@/types";

/**
 * Reviews block (§7).
 *
 * The API's POST /reviews/ is an `update_or_create` on (recipe, user), so this
 * component issues a single create-or-edit request instead of guessing which
 * endpoint to hit. The form flips to edit mode when the signed-in user already
 * has a review, seeded from the list we just fetched.
 */
export function ReviewSection({ recipeId }: { recipeId: number }) {
  const t = useTranslations("recipe");
  const te = useTranslations("errors");
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.reviews(recipeId),
    queryFn: () => reviewsApi.listForRecipe(recipeId),
    staleTime: 30_000,
  });

  const reviews = query.data?.results ?? [];
  const mine = isAuthenticated
    ? reviews.find((review) => review.user.id === user?.id)
    : undefined;

  const save = useMutation({
    mutationFn: (input: { rating: number; comment: string }) =>
      reviewsApi.submit({ recipe_id: recipeId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeReviews });
      toast.success(t("reviewSubmitted"));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : te("saveFailed"));
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => reviewsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeReviews });
    },
    onError: () => toast.error(te("generic")),
  });

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <h2
        id="reviews-heading"
        className="text-xl font-bold tracking-tight text-fg sm:text-2xl"
      >
        {t("reviews")}
        {reviews.length > 0 ? (
          <span className="ml-2 text-base font-medium text-fg-muted">
            {reviews.length}
          </span>
        ) : null}
      </h2>

      {isAuthenticated ? (
        <ReviewForm
          key={mine?.id ?? "new"}
          existing={mine}
          isPending={save.isPending}
          onSubmit={(input) => save.mutate(input)}
        />
      ) : (
        <SignInPrompt />
      )}

      {query.isPending ? (
        <ul className="m-0 list-none space-y-4 p-0">
          {[0, 1].map((index) => (
            <li
              key={index}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
            >
              <Skeleton className="mb-3 h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : reviews.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface-sunken/50 px-5 py-8 text-center text-sm text-fg-muted">
          {t("noReviews")}
        </p>
      ) : (
        <ul className="m-0 list-none space-y-4 p-0">
          {reviews.map((review) => (
            <ReviewRow
              key={review.id}
              review={review}
              canModify={isAuthenticated && review.user.id === user?.id}
              isDeleting={
                remove.isPending && remove.variables === review.id
              }
              onDelete={() => remove.mutate(review.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewRow({
  review,
  canModify,
  isDeleting,
  onDelete,
}: {
  review: Review;
  canModify: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const t = useTranslations("recipe");
  const tc = useTranslations("common");
  const format = useFormatter();
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-fg-brand"
          >
            {review.user.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-fg">{review.user.name}</p>
            <p className="text-xs text-fg-muted">
              {format.dateTime(new Date(review.created_at), {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RatingStars value={review.rating} />
          {canModify ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirming(true)}
              aria-label={t("deleteReview")}
              className="text-fg-muted hover:text-danger"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Trash2 aria-hidden />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {review.comment ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
          {review.comment}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("deleteReview")}
        description={t("deleteReviewConfirm")}
        confirmLabel={t("deleteReview")}
        cancelLabel={tc("cancel")}
        isPending={isDeleting}
        onConfirm={() => {
          onDelete();
          setConfirming(false);
        }}
      />
    </li>
  );
}

function ReviewForm({
  existing,
  isPending,
  onSubmit,
}: {
  existing?: Review;
  isPending: boolean;
  onSubmit: (input: { rating: number; comment: string }) => void;
}) {
  const t = useTranslations("recipe");
  const te = useTranslations("errors");
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating < 1 || rating > 5) {
      setError(te("validation"));
      return;
    }
    setError(null);
    onSubmit({ rating, comment: comment.trim() });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
    >
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg">
        {existing ? (
          <Pencil aria-hidden className="size-4" />
        ) : (
          <Star aria-hidden className="size-4" />
        )}
        {existing ? t("updateReview") : t("writeReview")}
      </h3>

      <div className="space-y-3">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-fg">
            {t("yourRating")}
          </span>
          <RatingInput value={rating} onChange={setRating} />
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="mb-1.5 block text-sm font-medium text-fg"
          >
            {t("comment")}
          </label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t("commentPlaceholder")}
            maxLength={2000}
          />
        </div>

        {error ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={isPending} loadingText={t("submitReview")}>
          {t("submitReview")}
        </Button>
      </div>
    </form>
  );
}

function SignInPrompt() {
  const t = useTranslations("recipe");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface-sunken/50 px-5 py-4">
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <MessageSquare aria-hidden className="size-4" />
        {t("signInToReview")}
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
      >
        {t("signInToReview")}
      </Button>
    </div>
  );
}
