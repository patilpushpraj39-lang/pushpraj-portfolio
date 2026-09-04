import { useRef, useEffect, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface MagneticProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}

export function Magnetic({
  children,
  className,
  strength = 0.3,
  radius = 100,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 180, damping: 18, mass: 0.4 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < radius + Math.max(rect.width, rect.height) / 2) {
          const pull = 1 - dist / (radius + Math.max(rect.width, rect.height) / 2);
          const maxMove = 10;
          const factor = Math.min(1, pull * strength * 2);
          x.set(Math.max(-maxMove, Math.min(maxMove, dx * factor * 0.5)));
          y.set(Math.max(-maxMove, Math.min(maxMove, dy * factor * 0.5)));
        } else {
          x.set(0);
          y.set(0);
        }
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced, radius, strength, x, y]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: reduced ? 0 : springX, y: reduced ? 0 : springY }}
    >
      {children}
    </motion.div>
  );
}
