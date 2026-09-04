import { useState } from 'react';
import { motion } from 'framer-motion';
import { Preloader } from '@/components/sections/Preloader';
import { Nav } from '@/components/layout/Nav';
import { Hero } from '@/components/sections/Hero';
import { MarqueeStrip } from '@/components/sections/MarqueeStrip';
import { About } from '@/components/sections/About';
import { Projects } from '@/components/sections/Projects';
import { Interactive3D } from '@/components/sections/Interactive3D';
import { Capabilities } from '@/components/sections/Capabilities';
import { Contact } from '@/components/sections/Contact';
import { CustomCursor } from '@/components/primitives/CustomCursor';
import { DynamicBackground } from '@/components/primitives/DynamicBackground';
import { SectionTransition } from '@/components/primitives/SectionTransition';
import { useLenis } from '@/hooks/useLenis';

const EASE = [0.22, 1, 0.36, 1] as const;

function App() {
  useLenis();
  const [heroStarted, setHeroStarted] = useState(false);

  return (
    <>
      <Preloader onComplete={() => setHeroStarted(true)} />
      <CustomCursor />
      <DynamicBackground />
      <Nav />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, ease: EASE, delay: 0.3 }}
        className="relative noise"
        id="main-content"
      >
        <SectionTransition intensity={0.5}>
          <Hero started={heroStarted} />
        </SectionTransition>
        <MarqueeStrip />
        <SectionTransition intensity={0.35}>
          <About />
        </SectionTransition>
        <SectionTransition intensity={0.6}>
          <Projects />
        </SectionTransition>
        <Interactive3D />
        <SectionTransition intensity={0.3}>
          <Capabilities />
        </SectionTransition>
        <SectionTransition intensity={0.15}>
          <Contact />
        </SectionTransition>
      </motion.main>
    </>
  );
}

export default App;
