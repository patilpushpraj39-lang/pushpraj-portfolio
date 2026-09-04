import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { projects as projectsData, type Project } from '@/data/content';
import { Reveal } from '@/components/primitives/Reveal';
import { Magnetic } from '@/components/primitives/Magnetic';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const EASE = [0.22, 1, 0.36, 1] as const;

// Progressive staggered reveal — number → title → description → tech → image → CTA
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

const techItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

interface ProjectCardProps {
  project: Project;
  index: number;
}

function ProjectCard({ project, index }: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Subtle parallax — 40px max movement
  const imgY = useTransform(scrollYProgress, [0, 1], ['-20px', '20px']);
  // Scale: enter at 0.94 → 1, exit 1 → 0.98
  const imgScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.96, 1, 1, 0.98]);
  // Number drifts slightly
  const numY = useTransform(scrollYProgress, [0, 1], ['10px', '-10px']);

  const isReversed = index % 2 === 1;

  return (
    <motion.article
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className={`grid items-center gap-10 lg:gap-20 ${
        isReversed ? 'lg:grid-cols-[1fr_1.3fr]' : 'lg:grid-cols-[1.3fr_1fr]'
      }`}
    >
      {/* Visual */}
      <motion.div
        variants={imageReveal}
        className={`group relative ${isReversed ? 'lg:order-2' : ''}`}
      >
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          data-cursor
          data-cursor-label="View"
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-hairline bg-base-elevated shadow-soft">
            <motion.div
              style={{
                y: reduced ? 0 : imgY,
                scale: reduced ? 1 : imgScale,
              }}
              className="absolute inset-0"
            >
            <img
              src={project.image}
              alt={`${project.title} website preview`}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover opacity-90 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] group-hover:opacity-100"
            />
          </motion.div>

          {/* Subtle bottom gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-base/50 via-transparent to-transparent" />

          {/* Accent top line — barely visible, strengthens on hover */}
          <div
            className="absolute inset-x-0 top-0 h-px opacity-20 transition-opacity duration-500 group-hover:opacity-50"
            style={{ background: `linear-gradient(to right, ${project.accent}, transparent)` }}
          />

          {/* Year badge */}
          <div className="absolute right-5 top-5 rounded-full border border-hairline bg-base/80 px-3.5 py-1.5 font-mono text-xs text-ink-secondary backdrop-blur-md">
            {project.year}
          </div>

          {/* Project number — visually secondary */}
          <motion.div
            style={{ y: reduced ? 0 : numY, color: `${project.accent}40` }}
            className="absolute left-5 top-4 font-mono text-4xl font-bold lg:text-5xl"
          >
            {project.number}
            </motion.div>
          </div>
        </a>
      </motion.div>

      {/* Text */}
      <div className={`group/title ${isReversed ? 'lg:order-1' : ''}`}>
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-ink-muted"
        >
          <span style={{ color: project.accent }} className="text-base">
            ●
          </span>
          <span>{project.category}</span>
          <span className="text-ink-faint">—</span>
          <span>{project.year}</span>
        </motion.div>

        <motion.h3
          variants={fadeUp}
          className="mt-5 text-h1 font-serif font-medium tracking-tight text-ink"
        >
          {project.title}
        </motion.h3>

        <motion.p
          variants={fadeUp}
          className="mt-5 max-w-md text-base leading-relaxed text-ink-secondary"
        >
          {project.description}
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-5 space-y-3"
        >
          <div className="flex gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-ink-faint shrink-0 pt-0.5">
              Problem
            </span>
            <p className="text-sm leading-relaxed text-ink-muted">{project.problem}</p>
          </div>
          <div className="flex gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-ink-faint shrink-0 pt-0.5">
              Result
            </span>
            <p className="text-sm leading-relaxed text-ink-muted">{project.result}</p>
          </div>
        </motion.div>

        {/* Technology tags — staggered */}
        <motion.div
          variants={fadeUp}
          className="mt-7 flex flex-wrap gap-2"
        >
          {project.stack.map((tech) => (
            <motion.span
              key={tech}
              variants={techItem}
              className="rounded-full border border-hairline bg-base-elevated px-3.5 py-1.5 font-mono text-xs text-ink-secondary transition-all duration-300 hover:border-hairline-strong hover:text-ink"
            >
              {tech}
            </motion.span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-6">
          <Magnetic strength={0.2}>
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press-scale group flex items-center gap-2 text-sm font-medium text-ink transition-colors duration-300 hover:text-accent"
            >
              <span className="link-underline">View Project</span>
              <ArrowUpRight
                size={15}
                className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-hover:-translate-y-1.5"
              />
            </a>
          </Magnetic>
          {project.githubUrl && (
            <Magnetic strength={0.2}>
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="press-scale group flex items-center gap-2 text-sm font-medium text-ink transition-colors duration-300 hover:text-accent"
              >
                <span className="link-underline">GitHub</span>
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-hover:-translate-y-1.5"
                />
              </a>
            </Magnetic>
          )}
        </motion.div>
      </div>
    </motion.article>
  );
}

export function Projects() {
  return (
    <section id="work" className="relative py-32 lg:py-48" aria-label="Selected work">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <div>
              <span className="font-mono text-sm text-accent">{`// 01`}</span>
              <h2 className="mt-3 text-h1 font-serif font-medium tracking-tight text-ink">
                Selected Work
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-xs text-sm leading-relaxed text-ink-muted sm:text-right">
              A selection of projects I have built and learned from.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 space-y-24 lg:mt-24 lg:space-y-32">
          {projectsData.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
