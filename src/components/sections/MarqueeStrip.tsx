import { marqueeItems } from '@/data/content';
import { ScrollVelocity } from '@/components/primitives/ScrollVelocity';

function MarqueeContent() {
  return (
    <span className="flex items-center" aria-hidden="true">
      {marqueeItems.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 font-mono text-sm uppercase tracking-widest text-ink-secondary sm:px-8 sm:text-base">
            {item}
          </span>
          <span className="text-accent/30">✦</span>
        </span>
      ))}
    </span>
  );
}

export function MarqueeStrip() {
  return (
    <div className="relative border-y border-hairline bg-base-subtle/60 py-8 backdrop-blur-sm">
      <ScrollVelocity baseVelocity={1.2} className="mask-fade-x group">
        <MarqueeContent />
      </ScrollVelocity>
    </div>
  );
}
