import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';

export function DynamicBackground() {
  const [reduced, setReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const negX = useTransform(springX, (v) => -v);
  const negY = useTransform(springY, (v) => -v);

  const { scrollY } = useScroll();

  const farY = useTransform(scrollY, [0, 3000], [0, 40]);
  const farX = useTransform(scrollY, [0, 3000], [0, 20]);
  const midY = useTransform(scrollY, [0, 3000], [0, 80]);
  const nearY = useTransform(scrollY, [0, 3000], [0, 120]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    if (mq.matches) return;

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    const onMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 40);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 40);
    };

    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [mouseX, mouseY]);

  if (reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        style={{ x: farX, y: farY }}
        className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-accent/3 blur-[180px]"
      />

      <motion.div
        style={{ x: isMobile ? 0 : negX, y: isMobile ? midY : negY }}
        className="absolute -right-[10%] top-[50%] h-[400px] w-[400px] rounded-full bg-success/3 blur-[160px]"
      />

      <motion.div
        style={{ x: isMobile ? 0 : springX, y: isMobile ? nearY : springY }}
        className="absolute left-1/2 top-[80%] h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-accent/2 blur-[140px]"
      />
    </div>
  );
}
