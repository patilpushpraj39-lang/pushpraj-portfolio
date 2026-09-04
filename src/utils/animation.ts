import { type Variants } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const springs = {
  gentle: { stiffness: 120, damping: 18, mass: 0.8 },
  snappy: { stiffness: 200, damping: 20 },
  smooth: { stiffness: 150, damping: 25, mass: 0.6 },
  magnetic: { stiffness: 200, damping: 20 },
  tilt: { stiffness: 200, damping: 22 },
  cursor: { stiffness: 250, damping: 22, mass: 0.6 },
  cursorDot: { stiffness: 1000, damping: 40 },
  parallax: { stiffness: 50, damping: 20 },
} as const;

export const durations = {
  fast: 0.4,
  normal: 0.6,
  slow: 0.8,
  cinematic: 1.3,
} as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  visible: (custom: { delay: number; y: number }) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: durations.normal,
      delay: custom.delay,
      ease: EASE,
    },
  }),
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: durations.slow, ease: EASE },
  },
};

export const wordRevealVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: durations.normal, delay, ease: EASE },
  }),
};

export const charRevealVariants: Variants = {
  hidden: { opacity: 0, y: 100, filter: 'blur(24px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: durations.cinematic,
      delay: 0.5 + i * 0.08,
      ease: EASE,
    },
  }),
};
