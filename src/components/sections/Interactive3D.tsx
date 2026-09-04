import { lazy, useRef, useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { RotateCcw, Hand } from 'lucide-react';
import { Reveal } from '@/components/primitives/Reveal';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { Magnetic } from '@/components/primitives/Magnetic';
import { CinematicHeading } from '@/components/primitives/CinematicHeading';
import { SceneErrorBoundary } from '@/components/primitives/SceneErrorBoundary';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { isWebGLAvailable } from '@/utils/performance';

const RubiksCubeCanvas = lazy(() =>
  import('@/components/three/RubiksCube').then((m) => ({ default: m.RubiksCubeCanvas }))
);

const FALLBACK_COLORS = ['#C45A48', '#D08240', '#4A7AAA', '#6BA050', '#F0EDE5', '#E8C84A'];

function CubeFallback() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="grid grid-cols-3 grid-rows-3 gap-1 rounded-xl border border-hairline bg-base-elevated p-2 shadow-soft-md">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-10 rounded-md sm:h-12 sm:w-12"
            style={{ backgroundColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
          />
        ))}
      </div>
      <div className="font-mono text-xs uppercase tracking-widest text-ink-muted">
        Drag to explore
      </div>
    </div>
  );
}

export function Interactive3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const scrollProgressRef = useRef(0);

  const [hasTurns, setHasTurns] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const resetCubeRef = useRef<() => void>(() => {});

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.9, 1, 1, 0.9]);
  const sectionScale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.99, 1, 1, 0.99]);

  // Cache WebGL availability once — never re-check during interaction
  const webglAvailable = useMemo(() => isWebGLAvailable(), []);

  // Stable callbacks that never change identity
  const handleTurnComplete = useCallback(() => {
    setHasTurns(true);
  }, []);

  const handleDragStateChange = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  const handleReset = useCallback(() => {
    resetCubeRef.current();
    setHasTurns(false);
  }, []);

  // Feed scroll progress into ref without causing re-renders
  useEffect(() => {
    return scrollYProgress.on('change', (v) => {
      scrollProgressRef.current = v;
    });
  }, [scrollYProgress]);

  const cursorLabel = isDragging ? 'Drag' : 'Rotate';

  return (
    <section
      id="interact"
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden border-t border-hairline py-24 lg:py-32"
      aria-label="Interactive cube"
    >
      <motion.div
        style={{ y: reduced ? 0 : orbY }}
        className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/4 blur-[200px]"
      />
      <div className="absolute inset-0 dot-pattern opacity-10" />

      <motion.div
        style={{
          opacity: reduced ? 1 : sectionOpacity,
          scale: reduced ? 1 : sectionScale,
        }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12"
      >
        <div className="text-center">
          <Reveal className="flex justify-center">
            <SectionHeading index="03" title="Interact" />
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="mt-8 text-h1 font-serif font-medium leading-[1.05] tracking-tight text-balance">
              <CinematicHeading
                lines={['Built to be', <span className="text-accent-gradient">experienced</span>]}
                className="text-h1 font-serif font-medium tracking-tight text-balance"
                duration={1.3}
                delay={0.1}
                stagger={0.2}
              />
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-secondary">
              Get a 3D touch in your Website
            </p>
          </Reveal>
        </div>

        <div
          className="relative mt-8 h-[420px] w-full cursor-grab active:cursor-grabbing sm:h-[480px] lg:h-[520px]"
          data-cursor
          data-cursor-label={cursorLabel}
        >
          {webglAvailable ? (
            <SceneErrorBoundary fallback={<CubeFallback />}>
              <Suspense fallback={null}>
                <RubiksCubeCanvas
                  reduced={reduced}
                  scrollProgress={scrollProgressRef}
                  onTurnComplete={handleTurnComplete}
                  onDragStateChange={handleDragStateChange}
                  resetCubeRef={resetCubeRef}
                />
              </Suspense>
            </SceneErrorBoundary>
          ) : (
            <CubeFallback />
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <motion.div
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Hand size={14} className="text-accent" />
            Drag to rotate
          </motion.div>
        </div>

        <div className="mt-4 flex justify-center">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: hasTurns ? 1 : 0,
              height: hasTurns ? 'auto' : 0,
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <Magnetic strength={0.3}>
              <button
                onClick={handleReset}
                data-cursor
                data-cursor-label="Reset"
                className="btn-sheen press-scale group flex items-center gap-2 rounded-full border border-hairline bg-base-elevated px-6 py-3 font-mono text-xs uppercase tracking-widest text-ink-secondary transition-all duration-300 hover:border-accent/30 hover:text-accent"
              >
                <RotateCcw
                  size={14}
                  className="transition-transform duration-500 group-hover:-rotate-180"
                />
                Reset cube
              </button>
            </Magnetic>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
