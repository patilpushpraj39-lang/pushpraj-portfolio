import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxRotate?: number;
  scale?: number;
  lift?: number;
  glare?: boolean;
}

export function TiltCard({
  children,
  className,
  maxRotate = 6,
  scale = 1.01,
  lift = 8,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const liftZ = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);
  const springLift = useSpring(liftZ, { stiffness: 140, damping: 18 });
  const springGlareX = useSpring(glareX, { stiffness: 400, damping: 30 });
  const springGlareY = useSpring(glareY, { stiffness: 400, damping: 30 });

  const glareBackground = useTransform(
    [springGlareX, springGlareY],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.10), transparent 60%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * maxRotate);
    rotateX.set(-py * maxRotate);
    glareX.set((px + 0.5) * 100);
    glareY.set((py + 0.5) * 100);
    liftZ.set(lift);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
    liftZ.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: reduced ? 0 : springRotateX,
        rotateY: reduced ? 0 : springRotateY,
        z: reduced ? 0 : springLift,
        transformStyle: 'preserve-3d',
      }}
      whileHover={reduced ? undefined : { scale }}
      transition={{ scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
      className={`perspective ${className ?? ''}`}
    >
      {children}
      {glare && !reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glareBackground }}
        />
      )}
    </motion.div>
  );
}
