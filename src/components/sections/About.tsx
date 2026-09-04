import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, useState, Fragment } from 'react';
import { profile } from '@/data/content';
import { Reveal } from '@/components/primitives/Reveal';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const EASE = [0.22, 1, 0.36, 1] as const;

function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const num = parseInt(value.replace(/\D/g, '')) || 0;
    const suffix = value.replace(/\d/g, '');
    let frame: number;
    const start = performance.now();
    const duration = 1600;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(num * eased) + suffix);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-3xl font-serif font-medium tabular-nums text-ink sm:text-5xl">
      {display}
    </div>
  );
}

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const yPhoto = useTransform(scrollYProgress, [0, 1], ['-2%', '2%']);
  const yRings = useTransform(scrollYProgress, [0, 1], ['2%', '-2%']);
  const photoRef = useRef<HTMLDivElement>(null);
  const photoInView = useInView(photoRef, { once: true, margin: '-80px' });

  // Portrait cursor-following movement
  const portraitX = useMotionValue(0);
  const portraitY = useMotionValue(0);
  const springPortraitX = useSpring(portraitX, { stiffness: 120, damping: 20 });
  const springPortraitY = useSpring(portraitY, { stiffness: 120, damping: 20 });

  const handlePortraitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    portraitX.set(px * 12);
    portraitY.set(py * 12);
  };

  const handlePortraitMouseLeave = () => {
    portraitX.set(0);
    portraitY.set(0);
  };

  const bioRef = useRef<HTMLParagraphElement>(null);
  const bioInView = useInView(bioRef, { once: true, margin: '-40px' });

  const renderWords = (text: string, startDelay: number) =>
    text.split(' ').map((word, i) => (
      <Fragment key={i}>
        <motion.span
          initial={{ opacity: 0.12 }}
          animate={bioInView ? { opacity: 1 } : {}}
          transition={{ delay: startDelay + i * 0.025, duration: 0.4, ease: EASE }}
          className="inline-block"
        >
          {word}
        </motion.span>
        {' '}
      </Fragment>
    ));

  return (
    <section
      id="about"
      ref={ref}
      className="relative overflow-hidden py-32 lg:py-48"
      aria-label="About"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <Reveal>
          <SectionHeading index="02" title="About" />
        </Reveal>

        <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-7">
            <div ref={bioRef} className="space-y-6">
              {profile.bio.map((paragraph, i) => (
                <p
                  key={i}
                  className={`text-h2 font-serif font-normal leading-relaxed ${
                    i === 0 ? 'text-ink' : 'text-ink-secondary'
                  }`}
                >
                  {renderWords(paragraph, i * 0.6)}
                </p>
              ))}
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 border-t border-hairline pt-10 sm:gap-8 sm:pt-12">
              {profile.stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.15, duration: 0.6, ease: EASE }}
                >
                  <AnimatedCounter value={stat.value} />
                  <div className="mt-3 font-mono text-xs uppercase tracking-widest text-ink-muted">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <motion.div
                ref={photoRef}
                initial={{ opacity: 0, y: 30, scale: 1.03 }}
                animate={reduced || photoInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, ease: EASE }}
                className="group relative overflow-hidden border border-hairline bg-base-elevated transition-transform duration-700 ease-expo hover:scale-[1.01]"
                onMouseMove={handlePortraitMouseMove}
                onMouseLeave={handlePortraitMouseLeave}
                data-cursor
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <motion.div
                    style={{
                      y: reduced ? 0 : yPhoto,
                      x: reduced ? 0 : springPortraitX,
                      translateY: reduced ? 0 : springPortraitY,
                    }}
                    className="absolute inset-0"
                  >
                    <img
                      src="/images/IMG_20251214_154837.jpg.jpeg"
                      alt="Portrait of Pushpraj Patil"
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-expo group-hover:scale-[1.015]"
                    />
                  </motion.div>

                  <div className="absolute inset-0 bg-gradient-to-t from-base/55 via-transparent to-transparent" />

                  <motion.div
                    style={{ y: reduced ? 0 : yRings }}
                    animate={reduced ? undefined : { rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="absolute right-6 top-6 h-20 w-20 rounded-full border border-accent/15"
                  />
                  <motion.div
                    style={{ y: reduced ? 0 : yRings }}
                    animate={reduced ? undefined : { rotate: -360 }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                    className="absolute right-10 top-10 h-12 w-12 rounded-full border border-hairline-strong"
                  />

                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-ink-muted">
                    <span className="text-ink-secondary">{profile.name}</span>
                    <span className="text-accent">{profile.title.split('&')[0].trim()}</span>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
                className="absolute -bottom-5 left-6 z-10 rounded-xl border border-hairline bg-base-elevated px-5 py-3 shadow-soft backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-ink-secondary">
                    {profile.available ? 'Open to work' : 'Currently engaged'}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
