export type PerformanceTier = 'desktop' | 'tablet' | 'mobile' | 'low-end';

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'desktop';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return 'low-end';

  if (!isWebGLAvailable()) return 'low-end';

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const width = window.innerWidth;

  if (isTouch && width < 768) return 'mobile';
  if (isTouch && width < 1024) return 'tablet';
  if (cores <= 2 || memory <= 2) return 'low-end';

  return 'desktop';
}

export function getParticleCount(tier: PerformanceTier): number {
  switch (tier) {
    case 'desktop': return 1200;
    case 'tablet': return 600;
    case 'mobile': return 300;
    case 'low-end': return 0;
  }
}

export function shouldEnable3D(tier: PerformanceTier): boolean {
  return tier !== 'low-end';
}

export function shouldEnableShadows(tier: PerformanceTier): boolean {
  return tier === 'desktop';
}

export function getDPR(tier: PerformanceTier): [number, number] {
  switch (tier) {
    case 'desktop': return [1, 2];
    case 'tablet': return [1, 1.5];
    case 'mobile': return [1, 1];
    case 'low-end': return [0.5, 1];
  }
}
