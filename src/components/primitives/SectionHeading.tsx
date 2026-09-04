interface SectionHeadingProps {
  index: string;
  title: string;
  className?: string;
}

export function SectionHeading({
  index,
  title,
  className,
}: SectionHeadingProps) {
  return (
    <div className={`flex items-center gap-4 ${className ?? ''}`}>
      <span className="font-mono text-sm text-accent">{`// ${index}`}</span>
      <span className="h-px w-10 bg-gradient-to-r from-accent/60 to-transparent" />
      <span className="font-mono text-sm uppercase tracking-widest text-ink-muted">
        {title}
      </span>
    </div>
  );
}
