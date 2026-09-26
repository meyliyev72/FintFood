"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-fg-inverse shadow-sm hover:bg-brand-hover hover:shadow-md",
        secondary:
          "bg-surface-sunken text-fg border border-border hover:bg-surface-hover hover:border-border-strong",
        outline:
          "border border-border-strong bg-transparent text-fg hover:bg-surface-hover",
        ghost: "bg-transparent text-fg-muted hover:bg-surface-hover hover:text-fg",
        danger: "bg-danger text-fg-inverse shadow-sm hover:bg-danger-hover",
        "danger-outline":
          "border border-danger/40 bg-transparent text-danger hover:bg-danger-soft",
        link: "text-fg-brand underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 rounded-[8px] px-3 text-sm [&_svg]:size-4",
        md: "h-11 rounded-[10px] px-5 text-sm [&_svg]:size-4",
        lg: "h-12 rounded-[12px] px-6 text-base [&_svg]:size-5",
        icon: "size-10 rounded-[10px] [&_svg]:size-5",
        "icon-sm": "size-8 rounded-[8px] [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** Announced by screen readers while `loading` is true. */
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";

  if (asChild) {
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
});

export { buttonVariants };

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(function Card({ className, interactive = false, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]",
        className,
      )}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Badge / Chip                                                               */
/* -------------------------------------------------------------------------- */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-chip text-chip-fg",
        brand: "bg-brand-soft text-fg-brand",
        accent: "bg-accent-soft text-fg-accent",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px] [&_svg]:size-3",
        md: "px-2.5 py-1 text-xs [&_svg]:size-3.5",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-[8px]", className)} aria-hidden {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface-sunken/50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-14 items-center justify-center rounded-full bg-surface text-fg-subtle [&_svg]:size-7">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-fg">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section header                                                             */
/* -------------------------------------------------------------------------- */

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">{title}</h2>
        {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
