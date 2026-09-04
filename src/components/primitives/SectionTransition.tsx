import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface SectionTransitionProps {
  children: ReactNode;
  className?: string;
  /** 0 = no effect, 1 = full effect */
  intensity?: number;
}

/**
 * Wraps a section with subtle opacity/scale transitions as it enters
 * and exits the viewport. GPU-friendly (transform + opacity only).
 * Respects prefers-reduced-motion.
 */
export function SectionTransition({ children, className, intensity = 1 }: SectionTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.88, 1],
    [1 - 0.12 * intensity, 1, 1, 1 - 0.12 * intensity]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [1 - 0.015 * intensity, 1, 1, 1 - 0.015 * intensity]
  );

  return (
    <motion.div
      ref={ref}
      style={{
        opacity: reduced ? 1 : opacity,
        scale: reduced ? 1 : scale,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
