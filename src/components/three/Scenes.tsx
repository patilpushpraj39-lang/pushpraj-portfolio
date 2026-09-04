import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, MeshDistortMaterial, Float, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';
import { detectPerformanceTier, getDPR, shouldEnable3D } from '@/utils/performance';

interface MousePos {
  x: number;
  y: number;
}

function ContextLossHandler() {
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    return () => canvas.removeEventListener('webglcontextlost', onContextLost);
  }, []);
  return null;
}

export const heroFallback = (
  <div className="absolute inset-0">
    <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/6 blur-[140px]" />
    <div className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-accent/8 to-transparent blur-[60px]" />
    <div className="absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/12" />
  </div>
);

function CenterObject({
  mouse,
  scrollProgress,
}: {
  mouse: React.MutableRefObject<MousePos>;
  scrollProgress: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const entranceRef = useRef(0);

  useFrame(() => {
    if (!meshRef.current) return;

    // Entrance scale-in: 0.96 → 1 over first ~90 frames (~1.5s)
    if (entranceRef.current < 1) {
      entranceRef.current = Math.min(1, entranceRef.current + 0.012);
      const s = 0.96 + 0.04 * entranceRef.current;
      meshRef.current.scale.setScalar(s);
    }

    meshRef.current.rotation.y += 0.0008;

    // Cursor tilt — subtle, 2-5 degrees max (0.04-0.09 rad), damped
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      mouse.current.y * 0.06,
      0.025
    );
    meshRef.current.rotation.z = THREE.MathUtils.lerp(
      meshRef.current.rotation.z,
      mouse.current.x * 0.04,
      0.025
    );

    // Position follow — barely perceptible
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      mouse.current.x * 0.15,
      0.02
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      mouse.current.y * 0.1,
      0.02
    );

    const sp = scrollProgress.current;
    meshRef.current.position.z = THREE.MathUtils.lerp(
      meshRef.current.position.z,
      sp * 1.2,
      0.04
    );
  });

  return (
    <Float speed={0.8} rotationIntensity={0.12} floatIntensity={0.5}>
      <Icosahedron ref={meshRef} args={[1.5, 8]}>
        <MeshDistortMaterial
          color="#A0764E"
          emissive="#6B4E2E"
          emissiveIntensity={0.06}
          roughness={0.7}
          metalness={0.12}
          distort={0.12}
          speed={0.6}
        />
      </Icosahedron>
    </Float>
  );
}

function Scene({
  scrollProgress,
}: {
  scrollProgress: React.MutableRefObject<number>;
}) {
  const mouse = useRef<MousePos>({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#F2E8DA" />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#A0764E" />
      <directionalLight position={[0, 5, 5]} intensity={0.3} />

      <CenterObject mouse={mouse} scrollProgress={scrollProgress} />
    </>
  );
}

export function Hero3DScene({
  scrollProgress,
}: {
  scrollProgress: React.MutableRefObject<number>;
}) {
  const tier = detectPerformanceTier();

  if (!shouldEnable3D(tier)) {
    return heroFallback;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={getDPR(tier)}
      gl={{ antialias: tier === 'desktop', alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
        });
      }}
    >
      <ContextLossHandler />
      <Suspense fallback={null}>
        <Scene scrollProgress={scrollProgress} />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Suspense>
    </Canvas>
  );
}
