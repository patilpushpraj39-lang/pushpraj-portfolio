import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

type LenisInstance = InstanceType<typeof Lenis>;

let lenisInstance: LenisInstance | null = null;

export function useLenis() {
  const lenisRef = useRef<LenisInstance | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      lenisInstance = null;
      return;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
      infinite: false,
      autoResize: true,
    });

    lenisRef.current = lenis;
    lenisInstance = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      lenisInstance = null;
    };
  }, []);

  return lenisRef;
}

export function scrollToSection(selector: string): void {
  const el = document.querySelector(selector);
  if (!el) return;

  if (lenisInstance) {
    lenisInstance.scrollTo(el as HTMLElement, {
      offset: -80,
      duration: 1.4,
    });
  } else {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

export function scrollToTop(): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { duration: 1.4 });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
