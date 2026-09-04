import { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowUp, Check, Github, Instagram, Linkedin, Mail } from 'lucide-react';
import { profile, socials } from '@/data/content';
import { Reveal } from '@/components/primitives/Reveal';
import { Magnetic } from '@/components/primitives/Magnetic';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { CinematicHeading } from '@/components/primitives/CinematicHeading';
import { scrollToTop } from '@/hooks/useLenis';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const EASE = [0.22, 1, 0.36, 1] as const;

const iconMap = { Github, Instagram, Linkedin, Mail };

export function Contact() {
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const orbScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.95]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative overflow-hidden border-t border-hairline pt-32 pb-0 lg:pt-52"
      aria-label="Contact"
    >
      <motion.div
        style={{ y: reduced ? 0 : orbY, scale: reduced ? 1 : orbScale }}
        className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute inset-0 rounded-full bg-accent/5 blur-[200px]" />
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/3 blur-[160px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <div className="absolute inset-0 dot-pattern opacity-10" />

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-12">
        <Reveal className="flex justify-center">
          <SectionHeading index="05" title="Contact" />
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-10 font-mono text-sm uppercase tracking-widest text-accent">
            Let's collaborate
          </p>
        </Reveal>

        <div className="mt-6 overflow-hidden">
          <Reveal delay={0.15}>
            <h2 className="text-display font-serif font-medium leading-[1.05] tracking-tight text-balance">
              <CinematicHeading
                lines={[
                  "Let's build",
                  <><span className="text-ink-muted">something </span><span className="text-accent-gradient">great</span><span className="text-ink">.</span></>,
                ]}
                className="text-display font-serif font-medium tracking-tight text-balance"
                duration={1.3}
                delay={0.15}
                stagger={0.2}
              />
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-ink-secondary">
            I'm currently {profile.available ? 'open' : 'booking'} for
            collaborations and interesting projects. If you have an idea worth
            building, I'd love to hear about it.
          </p>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="mt-12 flex flex-col items-center gap-6">
            <Magnetic strength={0.15}>
              <button
                onClick={handleCopy}
                data-cursor
                data-cursor-label="Copy"
                className="btn-sheen press-scale group relative flex items-center gap-3 overflow-hidden rounded-full border border-hairline bg-base-elevated px-10 py-5 text-lg font-medium text-ink transition-all duration-300 hover:border-accent/30 hover:shadow-soft-md"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="flex items-center gap-2 text-success"
                    >
                      <Check size={20} />
                      Copied to clipboard
                    </motion.span>
                  ) : (
                    <motion.span
                      key="email"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="flex items-center gap-2"
                    >
                      <Mail size={18} className="text-accent" />
                      {profile.email}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </Magnetic>

            <div className="flex items-center gap-4">
              {socials.map((social) => {
                const Icon = iconMap[social.icon as keyof typeof iconMap];
                return (
                  <Magnetic key={social.label} strength={0.3}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      data-cursor
                      data-cursor-label={social.label}
                      className="press-scale flex h-12 w-12 items-center justify-center rounded-full border border-hairline text-ink-secondary transition-all duration-300 hover:scale-105 hover:border-accent/30 hover:text-accent hover:shadow-soft"
                    >
                      <Icon size={18} />
                    </a>
                  </Magnetic>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>

      <footer className="relative mx-auto mt-32 max-w-7xl border-t border-hairline px-6 lg:px-12">
        <div className="flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-base-elevated font-mono text-xs font-bold text-accent">
              {profile.initials}
            </span>
            <span className="font-mono text-sm text-ink-muted">
              {profile.name}
            </span>
          </div>

          <div className="flex items-center gap-5 font-mono text-xs text-ink-faint">
            <a href={`mailto:${profile.email}`} className="transition-colors duration-300 hover:text-accent">Email</a>
            <span className="h-3 w-px bg-hairline" />
            <a href="https://github.com/patilpushpraj39-lang" target="_blank" rel="noopener noreferrer" className="transition-colors duration-300 hover:text-accent">GitHub</a>
            <span className="h-3 w-px bg-hairline" />
            <a href="https://www.instagram.com/_the_pushpraj_patil__/" target="_blank" rel="noopener noreferrer" className="transition-colors duration-300 hover:text-accent">Instagram</a>
            <span className="h-3 w-px bg-hairline" />
            <a href="https://www.linkedin.com/in/pushpraj-patil-aa7320328" target="_blank" rel="noopener noreferrer" className="transition-colors duration-300 hover:text-accent">LinkedIn</a>
          </div>

          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
            <p className="font-mono text-xs text-ink-faint">
              Built with React, Tailwind & Framer Motion
            </p>
            <span className="hidden h-3 w-px bg-hairline sm:block" />
            <p className="font-mono text-xs text-ink-faint">
              © {new Date().getFullYear()} — All rights reserved
            </p>
          </div>
        </div>

        <div className="flex justify-center pb-10">
          <Magnetic strength={0.2}>
            <button
              onClick={() => scrollToTop()}
              data-cursor
              data-cursor-label="Top"
              className="press-scale group flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors duration-300 hover:text-ink"
            >
              <span className="link-underline">Back to top</span>
              <ArrowUp
                size={14}
                className="transition-transform duration-300 group-hover:-translate-y-1.5"
              />
            </button>
          </Magnetic>
        </div>
      </footer>
    </section>
  );
}
