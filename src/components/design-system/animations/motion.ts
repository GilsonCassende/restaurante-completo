import type { Variants } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

export const motionPresets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } satisfies Variants,
  slideUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 16 },
  } satisfies Variants,
  slideDown: {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  } satisfies Variants,
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  } satisfies Variants,
  hover: {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -2 },
    tap: { scale: 0.98 },
  } satisfies Variants,
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.04,
      },
    },
  } satisfies Variants,
  staggerItem: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
  } satisfies Variants,
  page: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.32, ease },
  },
};

export function createStagger(delayChildren = 0.04, staggerChildren = 0.08): Variants {
  return {
    animate: {
      transition: {
        delayChildren,
        staggerChildren,
      },
    },
  };
}

export const motionTransition = {
  duration: 0.28,
  ease,
};
