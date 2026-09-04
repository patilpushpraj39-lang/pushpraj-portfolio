import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profile } from '@/data/content';

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 1400;

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [skipOverlay, setSkipOverlay] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || sessionStorage.getItem('portfolio-loaded')) {
      setSkipOverlay(true);
      onComplete();
      return;
    }

    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setProgress(Math.round(easeOut(t) * 100));

      if (t >= 1) {
        setTimeout(() => setExiting(true), 300);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const handleExitComplete = () => {
    sessionStorage.setItem('portfolio-loaded', '1');
    onComplete();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {!exiting && !skipOverlay && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-base"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="flex flex-col items-center">
            <motion.p
              className="font-mono text-[10px] uppercase tracking-[0.4em] text-ink-faint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
            >
              Portfolio
            </motion.p>

            <motion.h2
              className="mt-6 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl"
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
            >
              {profile.name}
            </motion.h2>

            <div className="mt-10 h-px w-44 overflow-hidden bg-hairline sm:w-56">
              <motion.div
                className="h-full bg-accent/50"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            <motion.div
              className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {profile.title.split('&')[0].trim()}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
