import { useEffect, useState, useCallback } from 'react';

export function useScrollSpy(ids: string[], offset = 120): string {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY + offset;
        let current = '';
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.offsetTop <= scrollY) {
            current = id;
          }
        }
        setActiveId(current);
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [ids, offset]);

  return activeId;
}

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        setProgress(scrollHeight > 0 ? window.scrollY / scrollHeight : 0);
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

export function useTimePassed(): boolean {
  const [passed, setPassed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setPassed(true), 100);
    return () => clearTimeout(timer);
  }, []);
  return passed;
}

export function useBodyScrollLock(active: boolean): void {
  const restoreOverflow = useCallback(() => {
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      restoreOverflow();
    }
    return restoreOverflow;
  }, [active, restoreOverflow]);
}
