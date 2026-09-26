/**
 * Motion tokens (§22.1).
 *
 * Single source of truth shared by the CSS custom properties in
 * `app/globals.css` and the Framer Motion transitions below, so CSS-only
 * animations and JS animations stay on the same rhythm.
 */

export const durations = {
  instant: 0.12,
  fast: 0.18,
  base: 0.24,
  slow: 0.38,
  slower: 0.56,
} as const;

export const easings = {
  standard: [0.2, 0, 0, 1],
  entrance: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
  spring: [0.34, 1.56, 0.64, 1],
} as const;

export type Duration = keyof typeof durations;
export type Easing = keyof typeof easings;

/** Framer Motion transition preset. */
export function transition(duration: Duration = "base", easing: Easing = "standard") {
  return { duration: durations[duration], ease: easings[easing] };
}

/** Page/route entrance: content rises and fades in. */
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: transition("base", "entrance"),
};

/** Pure fade, for overlays and cross-fades. */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: transition("fast", "standard"),
};

/** Modal / bottom-sheet: scales up from slightly below. */
export const sheetIn = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
  transition: transition("base", "entrance"),
};

/** Small scale-in for cards, chips and popovers. */
export const popIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: transition("fast", "entrance"),
};

/** Staggered container: children animate in sequence. */
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};

/** Item inside a `staggerContainer` group. */
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0,  transition: transition("base", "entrance") },
};

/** Card hover: a small lift plus a shadow bloom. */
export const cardHover = {
  rest: { y: 0, transition: transition("fast", "standard") },
  hover: { y: -4, transition: transition("fast", "spring") },
};

/**
 * Every `while*` prop should be paired with these so Framer Motion honours
 * `prefers-reduced-motion` even where CSS cannot (transform/opacity on
 * elements animated by JS).
 */
export const reducedMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
};
