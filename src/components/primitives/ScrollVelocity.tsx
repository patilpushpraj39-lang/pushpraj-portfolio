import { useRef, useEffect, type ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'framer-motion';

interface ScrollVelocityProps {
  children: ReactNode;
  baseVelocity?: number;
  className?: string;
}

export function ScrollVelocity({
  children,
  baseVelocity = 3,
  className,
}: ScrollVelocityProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const directionFactor = useRef(1);
  const lastTime = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf: number;
    let active = true;

    const tick = (time: number) => {
      if (!active) return;
      const delta = lastTime.current ? time - lastTime.current : 16;
      lastTime.current = time;

      let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

      const vf = velocityFactor.get();
      if (vf < 0) directionFactor.current = -1;
      else if (vf > 0) directionFactor.current = 1;

      moveBy += directionFactor.current * moveBy * Math.abs(vf);
      baseX.set(baseX.get() + moveBy);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [baseVelocity, baseX, velocityFactor]);

  return (
    <div className={`overflow-hidden ${className ?? ''}`}>
      <motion.div className="flex whitespace-nowrap" style={{ x }}>
        <span>{children}</span>
        <span>{children}</span>
      </motion.div>
    </div>
  );
}
