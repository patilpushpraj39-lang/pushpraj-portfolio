import { useEffect, useState, useRef, lazy, Fragment } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { profile } from '@/data/content';
import { Magnetic } from '@/components/primitives/Magnetic';
import { CinematicHeading } from '@/components/primitives/CinematicHeading';
import { SceneErrorBoundary } from '@/components/primitives/SceneErrorBoundary';
import { scrollToSection } from '@/hooks/useLenis';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const Hero3DScene = lazy(() =>
  import('@/components/three/Scenes').then((m) => ({ default: m.Hero3DScene }))
);

const heroFallback = (
  <div className="absolute inset-0">
    <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/6 blur-[140px]" />
    <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-accent/8 to-transparent blur-[60px]" />
    <div className="absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/12" />
  </div>
);

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({ started }: { started: boolean }) {
  const [time, setTime] = useState('');
  const reduced = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  const scrollProgressRef = useRef(0);

  // Scroll choreography — text recedes gently, 3D goes deeper + scales down
  const yContent = useTransform(scrollY, [0, 800], [0, -60]);
  const yScene = useTransform(scrollY, [0, 800], [0, -100]);
  const scaleScene = useTransform(scrollY, [0, 600], [1, 0.94]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scaleContent = useTransform(scrollY, [0, 500], [1, 0.95]);

  // Mouse parallax — subtle, damped via springs, text moves less than 3D
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const textParallaxX = useSpring(mouseX, { stiffness: 40, damping: 20, mass: 0.8 });
  const textParallaxY = useSpring(mouseY, { stiffness: 40, damping: 20, mass: 0.8 });
  const sceneParallaxX = useSpring(mouseX, { stiffness: 25, damping: 18, mass: 1.2 });
  const sceneParallaxY = useSpring(mouseY, { stiffness: 25, damping: 18, mass: 1.2 });

  // Map normalized mouse (-1..1) to small pixel offsets
  const textPxX = useTransform(textParallaxX, [-1, 1], [-6, 6]);
  const textPxY = useTransform(textParallaxY, [-1, 1], [-5, 5]);
  const scenePxX = useTransform(sceneParallaxX, [-1, 1], [-15, 15]);
  const scenePxY = useTransform(sceneParallaxY, [-1, 1], [-12, 12]);

  // Composite Y: scroll + mouse parallax combined
  const yContentCombined = useTransform([yContent, textPxY], (values: number[]) =>
    values[0] + values[1]
  );
  const ySceneCombined = useTransform([yScene, scenePxY], (values: number[]) =>
    values[0] + values[1]
  );

  useEffect(() => {
    const onScroll = () => {
      scrollProgressRef.current = Math.min(window.scrollY / window.innerHeight, 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date().toLocaleTimeString('en-GB', {
        timeZone: profile.timezone,
        hour: '2-digit',
        minute: '2-digit',
      });
      setTime(now);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mouse parallax listener — only on non-touch, non-reduced-motion devices
  useEffect(() => {
    if (reduced) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set(-(e.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [reduced, mouseX, mouseY]);

  const subtitleParts = ['Engineering Student', '·', 'Developer'];

  const scrollToWork = () => scrollToSection('#work');
  const scrollToContact = () => scrollToSection('#contact');

  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden"
      aria-label="Introduction"
    >
      {/* 3D Scene — background layer, shifted right, subtle recede on scroll */}
      <motion.div
        style={{
          y: reduced ? 0 : ySceneCombined,
          x: reduced ? 0 : scenePxX,
          scale: reduced ? 1 : scaleScene,
          opacity: reduced ? 1 : (started ? 1 : 0),
        }}
        className="absolute inset-0 z-0 lg:left-[15%]"
        transition={reduced ? undefined : { duration: 1.4, ease: EASE }}
      >
        <SceneErrorBoundary fallback={heroFallback}>
          <Hero3DScene scrollProgress={scrollProgressRef} />
        </SceneErrorBoundary>
      </motion.div>

      {/* Ambient overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-base/60 via-base/20 to-base" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-base/50 via-transparent to-base/50" />
      <div className="absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-base to-transparent" />

      {/* Content */}
      <motion.div
        style={{
          y: reduced ? 0 : yContentCombined,
          x: reduced ? 0 : textPxX,
          opacity,
          scale: reduced ? 1 : scaleContent,
        }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-24 pb-20 lg:px-12"
      >
        {/* Status row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7, ease: EASE }}
          className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-widest text-ink-muted"
        >
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {profile.available ? 'Available for work' : 'Currently engaged'}
          </span>
          <span className="hidden h-3 w-px bg-hairline sm:block" />
          <span>{profile.location} — {time} IST</span>
        </motion.div>

        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
          className="block font-mono text-xs uppercase tracking-[0.4em] text-ink-muted"
        >
          Portfolio
        </motion.span>

        {/* Name — the strongest typographic element */}
        <h1 className="mt-4 flex flex-col gap-1 sm:gap-2">
          <CinematicHeading
            lines={['Pushpraj', <span className="text-gradient">Patil</span>]}
            className="text-display font-serif font-medium tracking-tight"
            lineClassName="text-ink first:text-ink [&:nth-child(2)]:text-gradient"
            delay={0.3}
            stagger={0.18}
            duration={1.0}
          />
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
          className="mt-6 font-mono text-sm uppercase tracking-[0.25em] text-ink-secondary"
        >
          {subtitleParts.map((part, i) => (
            <Fragment key={i}>
              {part}
              {i < subtitleParts.length - 1 && ' '}
            </Fragment>
          ))}
        </motion.p>

        {/* Supporting statement */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.85, duration: 0.7, ease: EASE }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-ink-secondary sm:text-xl"
        >
          Building thoughtful digital experiences with code, AI and interactive design.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={started ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.0, duration: 0.7, ease: EASE }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Magnetic strength={0.3}>
            <button
              onClick={scrollToWork}
              data-cursor
              data-cursor-label="Explore"
              className="btn-sheen press-scale group flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-sm font-medium text-white transition-all duration-300 hover:bg-accent-hover hover:shadow-soft-md"
            >
              Explore Work
              <ArrowDown
                size={16}
                className="transition-transform duration-300 group-hover:translate-y-1.5"
              />
            </button>
          </Magnetic>
          <Magnetic strength={0.3}>
            <button
              onClick={scrollToContact}
              data-cursor
              data-cursor-label="Say hi"
              className="btn-sheen press-scale group flex items-center gap-3 rounded-full border border-hairline px-8 py-4 text-sm font-medium text-ink transition-all duration-300 hover:border-accent/30 hover:bg-base-elevated"
            >
              Get in Touch
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </button>
          </Magnetic>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={started ? { opacity: 1 } : {}}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          Scroll
        </span>
        <div className="relative h-12 w-px overflow-hidden bg-hairline">
          <motion.div
            className="absolute inset-x-0 h-5 bg-accent/60"
            animate={{ y: [-20, 48] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
}
