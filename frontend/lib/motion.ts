/**
 * Motion tokens (§22.1).
 *
 * Single source of truth shared by the CSS custom properties in
 * `app/globals.css` and the Framer Motion transitions below, so CSS-only
 * animations and JS animations stay on the same rhythm.
 *
 * Hard limits (§22.3) are encoded in the types below: no duration may exceed
 * `page`, no distance may exceed `medium`, and no scale may exceed 1.05.
 */

export const durations = {
  instant: 0.1,
  fast: 0.15,
  base: 0.22,
  slow: 0.35,
  page: 0.4,
} as const;

export const easings = {
  standard: [0.4, 0, 0.2, 1],
  entrance: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const;

/** §22.1 spring, used for hearts, chips and shared-element layout moves. */
export const spring = { type: "spring", stiffness: 400, damping: 30 } as const;

/** §22.1 distances. `medium` is the ceiling for entrance travel. */
export const distances = {
  micro: 2,
  small: 8,
  medium: 16,
} as const;

export type Duration = keyof typeof durations;
export type Easing = keyof typeof easings;

/** Framer Motion transition preset. */
export function transition(duration: Duration = "base", easing: Easing = "standard") {
  return { duration: durations[duration], ease: easings[easing] };
}

/** Page/route entrance: content rises and fades in. */
export const fadeUp = {
  initial: { opacity: 0, y: distances.small },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -distances.small },
  transition: transition("page", "entrance"),
};

/** Pure fade, for overlays and cross-fades. */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: transition("fast", "standard"),
};

/** Dialog / bottom-sheet panel: scales up from slightly below. */
export const sheetIn = {
  initial: { opacity: 0, y: distances.medium, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: distances.medium, scale: 0.96 },
  transition: transition("base", "entrance"),
};

/** Small scale-in for menus, popovers and chips. */
export const popIn = {
  initial: { opacity: 0, scale: 0.96, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -4 },
  transition: transition("fast", "entrance"),
};

/**
 * Staggered container: children animate in sequence, 40ms apart, capped at
 * the first 8 items so long lists never feel sluggish (§22.2).
 */
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

/** Item inside a `staggerContainer` group. */
export const staggerItem = {
  initial: { opacity: 0, y: distances.medium },
  animate: { opacity: 1, y: 0, transition: transition("slow", "entrance") },
};

/** Card hover: a 4px lift plus a shadow bloom. */
export const cardHover = {
  rest: { y: 0, transition: transition("base", "standard") },
  hover: { y: -4, transition: transition("base", "standard") },
};

/** Section entrance, triggered once at 15% visibility (§22.2). */
export const sectionInView = {
  initial: { opacity: 0, y: distances.medium },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: transition("slow", "entrance"),
} as const;

/** Chips animating between the picker grid and the selected bar. */
export const chipSpring = { layout: true, transition: spring } as const;

/**
 * Every `while*` prop should be paired with these so Framer Motion honours
 * `prefers-reduced-motion` even where CSS cannot (transform/opacity on
 * elements animated by JS).
 */
export const reducedMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
