import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const visibleRef = useRef(false);

  const labelRef = useRef('');
  const [, setTick] = useState(0);
  const lastLabel = useRef('');

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const ringX = useSpring(x, { stiffness: 180, damping: 24, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 180, damping: 24, mass: 0.5 });
  const dotX = useSpring(x, { stiffness: 1000, damping: 45 });
  const dotY = useSpring(y, { stiffness: 1000, damping: 45 });

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visibleRef.current) {
        visibleRef.current = true;
        setIsVisible(true);
        document.body.classList.add('cursor-active');
      }

      const target = e.target as HTMLElement;
      const interactive = target.closest(
        'a, button, [role="button"], [data-cursor]'
      ) as HTMLElement | null;

      const newLabel = interactive?.dataset.cursorLabel ?? '';

      if (newLabel !== labelRef.current) {
        labelRef.current = newLabel;
        lastLabel.current = newLabel;
        setTick((t) => t + 1);
      }
    };

    const leave = () => setIsHidden(true);
    const enter = () => setIsHidden(false);

    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
      document.body.classList.remove('cursor-active');
    };
  }, [x, y]);

  if (isHidden || !isVisible) return null;

  const label = labelRef.current;
  const hasLabel = !!label;

  return (
    <>
      {/* Outer circle — soft, delayed */}
      <motion.div
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[9999] hidden items-center justify-center rounded-full border md:flex"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: hasLabel ? 72 : 36,
          height: hasLabel ? 72 : 36,
          borderColor: hasLabel
            ? 'rgba(160, 118, 78, 0.5)'
            : 'rgba(26, 24, 20, 0.15)',
          backgroundColor: hasLabel
            ? 'rgba(160, 118, 78, 0.06)'
            : 'rgba(160, 118, 78, 0)',
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {hasLabel && (
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-[9px] font-medium uppercase tracking-[0.15em] text-ink"
          >
            {label}
          </motion.span>
        )}
      </motion.div>

      {/* Central dot — tiny, precise */}
      <motion.div
        className="cursor-dot pointer-events-none fixed left-0 top-0 z-[9999] hidden rounded-full bg-ink md:block"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          width: 6,
          height: 6,
          opacity: hasLabel ? 0.3 : 0.5,
        }}
        animate={{
          scale: hasLabel ? 0.5 : 1,
        }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </>
  );
}
