import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { capabilities } from '@/data/content';
import { Reveal, Stagger, StaggerItem } from '@/components/primitives/Reveal';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { TiltCard } from '@/components/primitives/TiltCard';
import { CinematicHeading } from '@/components/primitives/CinematicHeading';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const EASE = [0.22, 1, 0.36, 1] as const;

function CapabilityCard({
  category,
  items,
}: {
  category: string;
  items: { name: string; detail: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <StaggerItem>
      <TiltCard maxRotate={6} scale={1.02} className="rounded-2xl">
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        className="group relative h-full overflow-hidden rounded-2xl border border-hairline bg-base-elevated p-8 shadow-soft transition-colors duration-300 hover:shadow-soft-md lg:p-10"
      >
        <motion.div
          className="pointer-events-none absolute h-48 w-48 rounded-full bg-accent/8 opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-100"
          style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
        />

        <h3 className="relative font-mono text-sm uppercase tracking-widest text-accent" style={{ transform: 'translateZ(30px)' }}>
          {category}
        </h3>
        <ul className="relative mt-8 space-y-5" style={{ transform: 'translateZ(20px)' }}>
          {items.map((item, i) => (
            <motion.li
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
              className="group/item"
            >
              <div className="text-[15px] font-medium text-ink transition-colors duration-300 group-hover/item:text-accent">
                {item.name}
              </div>
              <div className="mt-1 font-mono text-xs text-ink-muted">
                {item.detail}
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
      </TiltCard>
    </StaggerItem>
  );
}

export function Capabilities() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], ['-20%', '20%']);
  const glowX = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);

  return (
    <section
      id="capabilities"
      ref={sectionRef}
      className="relative overflow-hidden border-t border-hairline py-32 lg:py-48"
      aria-label="Capabilities"
    >
      <motion.div
        style={{ y: reduced ? 0 : glowY, x: reduced ? 0 : glowX }}
        className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-accent/3 blur-[160px]"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <Reveal>
          <SectionHeading index="04" title="Capabilities" />
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mt-8 max-w-2xl text-h1 font-serif font-medium tracking-tight text-ink">
            <CinematicHeading
              lines={[
                <>A growing toolkit for{' '}<span className="text-ink-muted">building things</span>.</>,
              ]}
              className="text-h1 font-serif font-medium tracking-tight text-ink"
              duration={1.2}
              delay={0.1}
            />
          </h2>
        </Reveal>

        <Stagger
          className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.12}
        >
          {capabilities.map((capability) => (
            <CapabilityCard
              key={capability.category}
              category={capability.category}
              items={capability.items}
            />
          ))}
        </Stagger>
      </div>
    </section>
  );
}
