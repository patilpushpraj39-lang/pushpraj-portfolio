import { useRef, type ReactNode } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const EASE = [0.22, 1, 0.36, 1] as const;

interface CinematicHeadingProps {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  once?: boolean;
}

export function CinematicHeading({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.15,
  duration = 1.2,
  once = true,
}: CinematicHeadingProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: '-60px' });
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <span ref={ref} className={className}>
        {lines.map((line, i) => (
          <span key={i} className={lineClassName}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  }

  const lineVariants: Variants = {
    hidden: { y: '110%', opacity: 0, filter: 'blur(8px)' },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration,
        delay: delay + i * stagger,
        ease: EASE,
      },
    }),
  };

  return (
    <span ref={ref} className={className} aria-label={undefined}>
      {lines.map((line, i) => (
        <span
          key={i}
          className={`block overflow-hidden ${lineClassName ?? ''}`}
          aria-hidden="true"
        >
          <motion.span
            custom={i}
            variants={lineVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="block will-change-transform"
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
