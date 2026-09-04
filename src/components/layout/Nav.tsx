import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { navLinks, profile } from '@/data/content';
import { useScrollSpy, useScrollProgress, useBodyScrollLock } from '@/hooks/useScrollSpy';
import { scrollToSection } from '@/hooks/useLenis';
import { Magnetic } from '@/components/primitives/Magnetic';

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeId = useScrollSpy(navLinks.map((l) => l.href.slice(1)));
  const progress = useScrollProgress();

  useBodyScrollLock(isOpen);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setIsOpen(false);
    scrollToSection(href);
  };

  return (
    <>
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:border focus:border-hairline focus:bg-base-elevated focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>

      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass py-3' : 'py-5'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-12">
          {/* Logo */}
          <a
            href="#top"
            onClick={(e) => handleNavClick(e, '#top')}
            className="group flex items-center gap-2.5"
            aria-label="Back to top"
            data-cursor
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-base-elevated font-mono text-sm font-bold text-accent transition-all duration-300 group-hover:border-accent/40 group-hover:bg-accent/8">
              {profile.initials}
            </span>
            <span className="hidden text-sm font-medium text-ink transition-opacity sm:block">
              {profile.name}
            </span>
          </a>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = activeId === link.href.slice(1);
              return (
                <li key={link.href}>
                  <Magnetic strength={0.25} radius={80}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    data-cursor
                    className="group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors duration-300 hover:text-ink"
                    style={{ color: isActive ? 'var(--ink)' : 'var(--ink-secondary)' }}
                  >
                    <span className="font-mono text-[10px] text-accent/60 transition-transform duration-300 group-hover:translate-x-0.5">
                      {link.index}
                    </span>
                    <span className="link-underline">{link.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-full border border-hairline bg-base-elevated"
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                      />
                    )}
                    {isActive && (
                      <span className="absolute -bottom-px left-1/2 h-px w-6 -translate-x-1/2 bg-accent/60" />
                    )}
                  </a>
                  </Magnetic>
                </li>
              );
            })}
          </ul>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-10 w-10 items-center justify-center text-ink transition-colors duration-300 hover:text-accent md:hidden"
            aria-label="Open menu"
            aria-expanded={isOpen}
          >
            <Menu size={22} />
          </button>
        </nav>

        {/* Scroll progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-accent to-accent-hover"
          style={{ width: `${progress * 100}%` }}
        />
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className="fixed inset-0 z-[60] bg-base/95 backdrop-blur-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <span className="font-mono text-sm text-ink-muted">
                {profile.name}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center text-ink"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <motion.ul
              className="flex flex-col gap-0 px-6 pt-8"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
              }}
            >
              {navLinks.map((link) => (
                <motion.li
                  key={link.href}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
                    },
                  }}
                >
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="group flex items-baseline gap-4 border-b border-hairline py-6 transition-colors duration-300 hover:border-hairline-strong"
                  >
                    <span className="font-mono text-sm text-accent">
                      {link.index}
                    </span>
                    <span className="text-4xl font-semibold tracking-tight text-ink transition-colors duration-300 group-hover:text-accent">
                      {link.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
