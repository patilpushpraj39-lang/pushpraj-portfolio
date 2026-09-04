import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { detectPerformanceTier, getDPR, shouldEnable3D } from '@/utils/performance';

// ─── Constants ──────────────────────────────────────────────

const COLORS = {
  white: '#F0EDE5',
  yellow: '#E8C84A',
  red: '#C45A48',
  orange: '#D08240',
  blue: '#4A7AAA',
  green: '#6BA050',
  body: '#15130F',
};

const FACE_COLORS: Record<string, string> = {
  '+X': COLORS.red,
  '-X': COLORS.orange,
  '+Y': COLORS.white,
  '-Y': COLORS.yellow,
  '+Z': COLORS.blue,
  '-Z': COLORS.green,
};

const CUBIE_SIZE = 0.95;
const GAP = 0.05;
const STEP = CUBIE_SIZE + GAP;
const STICKER = CUBIE_SIZE * 0.82;
const STICKER_T = 0.02;
const STICKER_OFF = CUBIE_SIZE / 2 + STICKER_T / 2;

const BASE_ROT_X = -0.35;
const BASE_ROT_Y = -0.5;

// ─── Physical motion constants ──────────────────────────────

const DRAG_SENSITIVITY = 0.005;   // radians per pixel of pointer movement
const VEL_SAMPLE_WINDOW = 5;      // frames of recent velocity to average
const MAX_VEL = 0.04;             // clamp max angular velocity per axis
const VEL_DAMPING = 0.90;         // momentum decay per frame (~60fps)
const ROT_LERP = 0.12;            // rotation smoothing toward target
const IDLE_RESUME_DELAY = 800;    // ms after release before idle resumes
const LAYER_DRAG_THRESHOLD = 8;   // px before layer rotation engages
const LAYER_DRAG_SMOOTH = 0.18;    // smoothing factor for layer drag feel
const HOVER_SCALE = 1.015;        // subtle cubie hover scale
const LAYER_ACTIVE_SCALE = 1.012; // subtle scale on active layer cubies
const HOVER_LERP = 0.12;          // hover transition smoothing (≈200ms feel)
// Logical cube coordinates are integers -1, 0, 1 on each axis.
// World positions are logical * STEP.
type Axis = 'x' | 'y' | 'z';

// ─── Sticker geometry helpers ───────────────────────────────

function stickerDims(dir: string): [number, number, number] {
  switch (dir) {
    case '+X':
    case '-X':
      return [STICKER_T, STICKER, STICKER];
    case '+Y':
    case '-Y':
      return [STICKER, STICKER_T, STICKER];
    default:
      return [STICKER, STICKER, STICKER_T];
  }
}

function stickerPos(dir: string): [number, number, number] {
  switch (dir) {
    case '+X':
      return [STICKER_OFF, 0, 0];
    case '-X':
      return [-STICKER_OFF, 0, 0];
    case '+Y':
      return [0, STICKER_OFF, 0];
    case '-Y':
      return [0, -STICKER_OFF, 0];
    case '+Z':
      return [0, 0, STICKER_OFF];
    default:
      return [0, 0, -STICKER_OFF];
  }
}

// ─── Cubie logical state ────────────────────────────────────

interface CubieData {
  logicalPos: [number, number, number]; // -1, 0, or 1 on each axis
  worldPos: [number, number, number]; // logical * STEP
  mesh: THREE.Group | null;
}

// ─── Cubie component ────────────────────────────────────────

interface CubieProps {
  position: [number, number, number];
  cubieRef: (mesh: THREE.Group | null) => void;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
}

function Cubie({ position, cubieRef, onPointerOver, onPointerOut }: CubieProps) {
  const [x, y, z] = position;

  const stickers = useMemo(() => {
    const dirs: string[] = [];
    if (x === 1) dirs.push('+X');
    if (x === -1) dirs.push('-X');
    if (y === 1) dirs.push('+Y');
    if (y === -1) dirs.push('-Y');
    if (z === 1) dirs.push('+Z');
    if (z === -1) dirs.push('-Z');

    return dirs.map((dir, i) => (
      <RoundedBox
        key={i}
        position={stickerPos(dir)}
        args={stickerDims(dir)}
        radius={0.025}
        smoothness={2}
      >
        <meshStandardMaterial
          color={FACE_COLORS[dir]}
          roughness={0.4}
          metalness={0.0}
        />
      </RoundedBox>
    ));
  }, [x, y, z]);

  return (
    <group
      ref={cubieRef}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <RoundedBox args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} radius={0.07} smoothness={3}>
        <meshStandardMaterial color={COLORS.body} roughness={0.65} metalness={0.15} />
      </RoundedBox>
      {stickers}
    </group>
  );
}

/** Determine which logical axis the face normal is most aligned with (cube-local space). */
function getDominantAxis(normal: THREE.Vector3, cubeGroup: THREE.Group): Axis {
  const localNormal = normal.clone().applyQuaternion(cubeGroup.quaternion.clone().invert());
  const ax = Math.abs(localNormal.x);
  const ay = Math.abs(localNormal.y);
  const az = Math.abs(localNormal.z);
  if (ax >= ay && ax >= az) return 'x';
  if (ay >= az) return 'y';
  return 'z';
}

/** Project a world-space direction onto screen-space (NDC-like, y-down). */
function projectDirectionToScreen(worldDir: THREE.Vector3, camera: THREE.Camera): THREE.Vector2 {
  const origin = new THREE.Vector3(0, 0, 0);
  const p1 = origin.clone().project(camera);
  const p2 = origin.clone().add(worldDir).project(camera);
  return new THREE.Vector2(p2.x - p1.x, -(p2.y - p1.y));
}

/**
 * Given a face normal (world-space) and the drag direction (screen-space),
 * determine which axis to rotate around and the direction (clockwise/CCW).
 */
function determineRotationAxis(
  faceNormal: THREE.Vector3,
  dragDir: THREE.Vector2,
  camera: THREE.Camera,
  cubeGroup: THREE.Group
): { axis: Axis; direction: number } | null {
  const normalAxis = getDominantAxis(faceNormal, cubeGroup);
  const perpAxes: Axis[] = (['x', 'y', 'z'] as Axis[]).filter((a) => a !== normalAxis);

  const candidates: { axis: Axis; worldDir: THREE.Vector3 }[] = [];
  for (const axis of perpAxes) {
    const axisVec = new THREE.Vector3(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0
    );
    const worldAxis = axisVec.clone().applyQuaternion(cubeGroup.quaternion);
    const worldDragDir = new THREE.Vector3().crossVectors(faceNormal, worldAxis);
    candidates.push({ axis, worldDir: worldDragDir });
  }

  let bestAxis: Axis | null = null;
  let bestDot = -Infinity;
  let bestSign = 1;

  for (const { axis, worldDir } of candidates) {
    const screenDir = projectDirectionToScreen(worldDir, camera);
    const dot = screenDir.x * dragDir.x + screenDir.y * dragDir.y;
    if (Math.abs(dot) > Math.abs(bestDot)) {
      bestDot = dot;
      bestAxis = axis;
      bestSign = dot > 0 ? 1 : -1;
    }
  }

  if (!bestAxis) return null;
  return { axis: bestAxis, direction: bestSign };
}

// ─── Cube group with interaction ────────────────────────────

interface CubeGroupProps {
  reduced: boolean;
  scrollProgress: React.MutableRefObject<number>;
  onTurnComplete: () => void;
  onDragStateChange: (dragging: boolean) => void;
  resetRef: React.MutableRefObject<() => void>;
}

function CubeGroup({
  reduced,
  scrollProgress,
  onTurnComplete,
  onDragStateChange,
  resetRef,
}: CubeGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl, size, camera } = useThree();

  // Cubie tracking
  const cubieRefs = useRef<Map<string, THREE.Group>>(new Map());
  const cubieData = useRef<CubieData[]>([]);

  // Interaction state — single gesture ownership ref
  const interactionMode = useRef<'none' | 'pending' | 'whole-cube' | 'layer'>('none');
  const prevPointer = useRef({ x: 0, y: 0 });
  const mouseTarget = useRef({ x: 0, y: 0 });
  const floatPhase = useRef(0);
  const idleY = useRef(0);
  const idlePaused = useRef(false);
  const idleResumeTime = useRef(0);

  // Physical motion: target rotation (set by drag), smoothed actual rotation,
  // and velocity history for momentum on release.
  const targetRot = useRef({ x: BASE_ROT_X, y: BASE_ROT_Y });
  const currentRot = useRef({ x: BASE_ROT_X, y: BASE_ROT_Y });
  const velHistory = useRef<{ x: number; y: number }[]>(
    Array.from({ length: VEL_SAMPLE_WINDOW }, () => ({ x: 0, y: 0 }))
  );
  const velHistoryIdx = useRef(0);
  const momentum = useRef({ x: 0, y: 0 });

  // Layer rotation state
  const dragStart = useRef<{
    pointerX: number;
    pointerY: number;
    faceNormal: THREE.Vector3;
    cubieKey: string;
    layerAxis: Axis;
    layerValue: number; // -1, 0, or 1
  } | null>(null);

  const hasPassedThreshold = useRef(false);

  // Active layer rotation
  const rotationGroup = useRef<THREE.Group | null>(null);
  const activeLayerCubies = useRef<THREE.Group[]>([]);
  const activeRotationInfo = useRef<{ axis: Axis; direction: number } | null>(null);
  const currentLayerAngle = useRef(0);
  const isAnimating = useRef(false); // during snap animation

  // Hover + active layer visual feedback (ref-driven, no React state)
  const hoveredCubie = useRef<THREE.Group | null>(null);
  const hoverScale = useRef(1);
  const layerScale = useRef(1);
  const smoothedLayerAngle = useRef(0);

  // Smoothed scroll-driven values
  const scrollScale = useRef(1);
  const scrollY = useRef(0);
  const scrollRotY = useRef(0);

  const scaleRef = useRef(0.92);

  // ─── Initialize cubie logical data ──────────────────────
  const cubiePositions = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let lx = -1; lx <= 1; lx++) {
      for (let ly = -1; ly <= 1; ly++) {
        for (let lz = -1; lz <= 1; lz++) {
          list.push([lx * STEP, ly * STEP, lz * STEP]);
        }
      }
    }
    return list;
  }, []);

  useEffect(() => {
    cubieData.current = cubiePositions.map((pos) => {
      const logical: [number, number, number] = [
        Math.round(pos[0] / STEP),
        Math.round(pos[1] / STEP),
        Math.round(pos[2] / STEP),
      ];
      return {
        logicalPos: logical,
        worldPos: pos,
        mesh: cubieRefs.current.get(logical.join(',')) ?? null,
      };
    });
  }, [cubiePositions]);

  useEffect(() => {
    const w = size.width;
    if (w < 500) scaleRef.current = 0.55;
    else if (w < 768) scaleRef.current = 0.68;
    else if (w < 1024) scaleRef.current = 0.8;
    else scaleRef.current = 0.92;
  }, [size.width]);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      mouseTarget.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTarget.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [reduced]);

  // ─── Reset via ref (no re-renders) ───────────────────
  const resetCube = useCallback(() => {
    if (!groupRef.current) return;
    isAnimating.current = true;

    const cubies = Array.from(groupRef.current.children) as THREE.Group[];
    const duration = reduced ? 200 : 600;
    const startTime = performance.now();
    const startTransforms = cubies.map((c) => ({
      pos: c.position.clone(),
      quat: c.quaternion.clone(),
    }));

    const animate = () => {
      if (!groupRef.current) return;
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      cubies.forEach((cubie, i) => {
        const logical: [number, number, number] = [
          Math.round(cubiePositions[i][0] / STEP),
          Math.round(cubiePositions[i][1] / STEP),
          Math.round(cubiePositions[i][2] / STEP),
        ];
        const targetPos = new THREE.Vector3(
          logical[0] * STEP,
          logical[1] * STEP,
          logical[2] * STEP
        );
        cubie.position.lerpVectors(startTransforms[i].pos, targetPos, eased);
        cubie.quaternion.slerpQuaternions(startTransforms[i].quat, new THREE.Quaternion(), eased);
      });

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        cubieData.current = cubiePositions.map((pos) => {
          const logical: [number, number, number] = [
            Math.round(pos[0] / STEP),
            Math.round(pos[1] / STEP),
            Math.round(pos[2] / STEP),
          ];
          return {
            logicalPos: logical,
            worldPos: pos,
            mesh: cubieRefs.current.get(logical.join(',')) ?? null,
          };
        });
        isAnimating.current = false;
        onTurnComplete();
      }
    };
    requestAnimationFrame(animate);
  }, [cubiePositions, reduced, onTurnComplete]);

  useEffect(() => {
    resetRef.current = resetCube;
  }, [resetRef, resetCube]);

  // ─── Hover handlers (subtle scale feedback, no React state) ───
  const onCubiePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (isAnimating.current || interactionMode.current !== 'none') return;
      e.stopPropagation();
      gl.domElement.style.cursor = 'grab';
      const hit = e.object as THREE.Object3D;
      let cubieGroup: THREE.Group | null = hit.parent as THREE.Group;
      while (cubieGroup && cubieGroup.parent !== groupRef.current) {
        cubieGroup = cubieGroup.parent as THREE.Group;
      }
      hoveredCubie.current = cubieGroup;
    },
    [gl]
  );

  const onCubiePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      hoveredCubie.current = null;
    },
    []
  );

  // ─── Finalize layer rotation ───────────────────────────
  // Reparents cubies back to the cube group (attach preserves world transforms),
  // then snaps positions to exact grid to eliminate floating-point drift.
  const finalizeLayerRotation = useCallback(
    (axis: Axis, turns: number) => {
      if (!rotationGroup.current || !groupRef.current) return;

      const cubies = activeLayerCubies.current;
      for (const cubie of cubies) {
        groupRef.current.attach(cubie);
      }

      groupRef.current.remove(rotationGroup.current);
      rotationGroup.current = null;
      activeLayerCubies.current = [];
      activeRotationInfo.current = null;
      currentLayerAngle.current = 0;
      dragStart.current = null;
      hasPassedThreshold.current = false;
      interactionMode.current = 'none';
      smoothedLayerAngle.current = 0;

      if (turns !== 0) {
        // Snap every affected cubie to the exact grid — attach() already
        // preserved the world transform (position + orientation), so we
        // only need to round the position to avoid drift over many turns.
        for (const cubie of cubies) {
          cubie.position.set(
            Math.round(cubie.position.x / STEP) * STEP,
            Math.round(cubie.position.y / STEP) * STEP,
            Math.round(cubie.position.z / STEP) * STEP
          );
        }

        cubieData.current = cubieData.current.map((cd) => {
          const mesh = cd.mesh;
          if (!mesh || !groupRef.current) return cd;
          const localPos = new THREE.Vector3();
          mesh.getWorldPosition(localPos);
          const cubeLocal = groupRef.current.worldToLocal(localPos.clone());
          return {
            ...cd,
            logicalPos: [
              Math.round(cubeLocal.x / STEP),
              Math.round(cubeLocal.y / STEP),
              Math.round(cubeLocal.z / STEP),
            ],
          };
        });

        onTurnComplete();
      }

      isAnimating.current = false;
      idlePaused.current = true;
      idleResumeTime.current = performance.now() + IDLE_RESUME_DELAY;
    },
    [onTurnComplete]
  );

  // ─── Pointer down on cube ──────────────────────────────
  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (isAnimating.current) return;
      e.stopPropagation();

      const nativeEvent = e.nativeEvent as PointerEvent;
      const dom = gl.domElement;
      const startX = e.clientX;
      const startY = e.clientY;

      // Try to detect a cubie face hit for potential layer rotation
      let faceHit = false;
      const hit = e.object;
      const faceNormal = e.face?.normal.clone();

      if (hit && faceNormal && groupRef.current) {
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.matrixWorld);
        const worldNormal = faceNormal.applyMatrix3(normalMatrix).normalize();

        let cubieGroup: THREE.Group | null = hit.parent as THREE.Group;
        while (cubieGroup && cubieGroup.parent !== groupRef.current) {
          cubieGroup = cubieGroup.parent as THREE.Group;
        }

        if (cubieGroup) {
          const cubieWorldPos = new THREE.Vector3();
          cubieGroup.getWorldPosition(cubieWorldPos);
          const localPos = groupRef.current.worldToLocal(cubieWorldPos.clone());
          const logicalX = Math.round(localPos.x / STEP);
          const logicalY = Math.round(localPos.y / STEP);
          const logicalZ = Math.round(localPos.z / STEP);

          const localNormal = worldNormal
            .clone()
            .applyQuaternion(groupRef.current.quaternion.clone().invert());
          const ax = Math.abs(localNormal.x);
          const ay = Math.abs(localNormal.y);
          const az = Math.abs(localNormal.z);
          let layerAxis: Axis;
          let layerValue: number;
          if (ax >= ay && ax >= az) {
            layerAxis = 'x';
            layerValue = logicalX;
          } else if (ay >= az) {
            layerAxis = 'y';
            layerValue = logicalY;
          } else {
            layerAxis = 'z';
            layerValue = logicalZ;
          }

          dragStart.current = {
            pointerX: startX,
            pointerY: startY,
            faceNormal: worldNormal,
            cubieKey: `${logicalX},${logicalY},${logicalZ}`,
            layerAxis,
            layerValue,
          };

          hasPassedThreshold.current = false;
          // Enter pending mode — do NOT start whole-cube drag yet
          interactionMode.current = 'pending';
          faceHit = true;
        }
      }

      if (!faceHit) {
        dragStart.current = null;
        // No face hit — start whole-cube drag immediately
        interactionMode.current = 'whole-cube';
      }

      prevPointer.current = { x: startX, y: startY };
      gl.domElement.style.cursor = 'grabbing';
      onDragStateChange(true);

      if (groupRef.current) {
        targetRot.current.x = groupRef.current.rotation.x;
        targetRot.current.y = groupRef.current.rotation.y;
        currentRot.current.x = groupRef.current.rotation.x;
        currentRot.current.y = groupRef.current.rotation.y;
      }

      velHistory.current = Array.from({ length: VEL_SAMPLE_WINDOW }, () => ({ x: 0, y: 0 }));
      velHistoryIdx.current = 0;
      momentum.current = { x: 0, y: 0 };

      idlePaused.current = true;
      if (groupRef.current) {
        idleY.current = groupRef.current.rotation.y - BASE_ROT_Y - scrollRotY.current;
      }

      try {
        dom.setPointerCapture(nativeEvent.pointerId);
      } catch {
        // pointer capture not supported
      }

      // ── Window-level move handler ──
      const onMove = (ev: PointerEvent) => {
        if (isAnimating.current) return;
        if (interactionMode.current === 'none') return;

        const dx = ev.clientX - prevPointer.current.x;
        const dy = ev.clientY - prevPointer.current.y;
        const totalDx = ev.clientX - startX;
        const totalDy = ev.clientY - startY;
        const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

        // ── Pending → commit to layer or whole-cube ──
        if (interactionMode.current === 'pending' && totalDist >= LAYER_DRAG_THRESHOLD) {
          if (dragStart.current && groupRef.current) {
            const dragDir = new THREE.Vector2(totalDx, totalDy).normalize();
            const rotInfo = determineRotationAxis(
              dragStart.current.faceNormal,
              dragDir,
              camera,
              groupRef.current
            );

            if (rotInfo) {
              // Commit to layer drag
              hasPassedThreshold.current = true;
              interactionMode.current = 'layer';

              activeRotationInfo.current = { axis: rotInfo.axis, direction: rotInfo.direction };

              // Create temporary rotation group
              const tempGroup = new THREE.Group();
              groupRef.current.add(tempGroup);
              rotationGroup.current = tempGroup;

              // Find and reparent all 9 cubies in the selected layer
              const { layerAxis, layerValue } = dragStart.current;
              const layerCubies: THREE.Group[] = [];
              for (const child of Array.from(groupRef.current.children)) {
                if (child === tempGroup) continue;
                if (child instanceof THREE.Group && child.children.length > 0) {
                  const childWorldPos = new THREE.Vector3();
                  child.getWorldPosition(childWorldPos);
                  const cubeLocal = groupRef.current.worldToLocal(childWorldPos.clone());
                  const lv = Math.round(cubeLocal[layerAxis] / STEP);
                  if (lv === layerValue) {
                    layerCubies.push(child as THREE.Group);
                  }
                }
              }

              for (const cubie of layerCubies) {
                tempGroup.attach(cubie);
              }
              activeLayerCubies.current = layerCubies;
              currentLayerAngle.current = 0;
              smoothedLayerAngle.current = 0;
            } else {
              // Could not determine rotation axis — fall back to whole-cube drag
              interactionMode.current = 'whole-cube';
            }
          } else {
            interactionMode.current = 'whole-cube';
          }
        }

        // ── Layer drag in progress: rotate ONLY the layer group ──
        if (interactionMode.current === 'layer' && rotationGroup.current && activeRotationInfo.current) {
          const rotInfo = activeRotationInfo.current;
          const axisVec = new THREE.Vector3(
            rotInfo.axis === 'x' ? 1 : 0,
            rotInfo.axis === 'y' ? 1 : 0,
            rotInfo.axis === 'z' ? 1 : 0
          );

          const screenDragDir = projectDirectionToScreen(
            new THREE.Vector3().crossVectors(
              dragStart.current!.faceNormal,
              new THREE.Vector3(
                rotInfo.axis === 'x' ? 1 : 0,
                rotInfo.axis === 'y' ? 1 : 0,
                rotInfo.axis === 'z' ? 1 : 0
              ).applyQuaternion(groupRef.current!.quaternion)
            ),
            camera
          );
          const projectedDist = totalDx * screenDragDir.x + totalDy * screenDragDir.y;
          let angle = (projectedDist / 100) * (Math.PI / 2) * rotInfo.direction;
          angle = Math.max(-Math.PI * 2 / 3, Math.min(Math.PI * 2 / 3, angle));

          // Smooth the target angle for a physical, non-1:1 drag feel
          smoothedLayerAngle.current = THREE.MathUtils.lerp(
            smoothedLayerAngle.current, angle, LAYER_DRAG_SMOOTH
          );

          rotationGroup.current.quaternion.setFromAxisAngle(axisVec, smoothedLayerAngle.current);
          currentLayerAngle.current = smoothedLayerAngle.current;
          prevPointer.current = { x: ev.clientX, y: ev.clientY };
          return;
        }

        // ── Whole cube drag: rotate the entire cube group ──
        if (interactionMode.current === 'whole-cube') {
          targetRot.current.y += dx * DRAG_SENSITIVITY;
          targetRot.current.x += dy * DRAG_SENSITIVITY;

          const idx = velHistoryIdx.current;
          velHistory.current[idx] = { x: dy * DRAG_SENSITIVITY, y: dx * DRAG_SENSITIVITY };
          velHistoryIdx.current = (idx + 1) % VEL_SAMPLE_WINDOW;

          prevPointer.current = { x: ev.clientX, y: ev.clientY };
        }
      };

      // ── Window-level up handler ──
      const onUp = (ev: PointerEvent) => {
        try {
          dom.releasePointerCapture(ev.pointerId);
        } catch {
          // no-op
        }

        const mode = interactionMode.current;

        // ── Layer drag release: snap to nearest 90° ──
        if (mode === 'layer' && rotationGroup.current && groupRef.current) {
          const angle = currentLayerAngle.current;
          const snap = Math.PI / 2;
          const nearest = Math.round(angle / snap) * snap;
          const rotInfo = activeRotationInfo.current;
          if (!rotInfo) {
            interactionMode.current = 'none';
            onDragStateChange(false);
            gl.domElement.style.cursor = 'grab';
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            return;
          }
          const axis = rotInfo.axis;
          const turns = Math.round(nearest / snap);

          isAnimating.current = true;
          interactionMode.current = 'none';
          onDragStateChange(false);

          const startAngle = currentLayerAngle.current;
          const targetAngle = nearest;
          const duration = reduced ? 150 : 350;
          const startTime = performance.now();

          const animateSnap = () => {
            if (!rotationGroup.current || !groupRef.current) return;
            const elapsed = performance.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const a = startAngle + (targetAngle - startAngle) * eased;

            const axisVec = new THREE.Vector3(
              axis === 'x' ? 1 : 0,
              axis === 'y' ? 1 : 0,
              axis === 'z' ? 1 : 0
            );
            rotationGroup.current.quaternion.setFromAxisAngle(axisVec, a);

            if (t < 1) {
              requestAnimationFrame(animateSnap);
            } else {
              finalizeLayerRotation(axis, turns);
            }
          };
          requestAnimationFrame(animateSnap);

          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          return;
        }

        // ── Whole cube drag release: momentum ──
        if (mode === 'whole-cube') {
          interactionMode.current = 'none';
          gl.domElement.style.cursor = 'grab';
          onDragStateChange(false);

          let avgX = 0, avgY = 0;
          for (const v of velHistory.current) { avgX += v.x; avgY += v.y; }
          avgX /= VEL_SAMPLE_WINDOW;
          avgY /= VEL_SAMPLE_WINDOW;

          momentum.current.x = Math.max(-MAX_VEL, Math.min(MAX_VEL, avgX));
          momentum.current.y = Math.max(-MAX_VEL, Math.min(MAX_VEL, avgY));

          idlePaused.current = true;
          idleResumeTime.current = performance.now() + IDLE_RESUME_DELAY;
        }

        // ── Pending gesture that never crossed threshold: clean up ──
        if (mode === 'pending') {
          interactionMode.current = 'none';
          dragStart.current = null;
          gl.domElement.style.cursor = 'grab';
          onDragStateChange(false);
        }

        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [camera, gl, onDragStateChange, reduced, finalizeLayerRotation]
  );

  // ─── Animation loop ────────────────────────────────────
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const sp = scrollProgress.current;
    const g = groupRef.current;

    // Scroll-driven scale
    const targetScrollScale = scaleRef.current * (0.88 + Math.sin(Math.min(sp, 1) * Math.PI) * 0.12);
    scrollScale.current = THREE.MathUtils.lerp(scrollScale.current, targetScrollScale, 0.04);

    // Scroll-driven Y position
    const targetScrollY = Math.sin(Math.min(sp, 1) * Math.PI) * 0.15 - 0.05;
    scrollY.current = THREE.MathUtils.lerp(scrollY.current, targetScrollY, 0.04);

    // Scroll-driven rotation offset
    const targetScrollRotY = (sp - 0.5) * 0.35;
    scrollRotY.current = THREE.MathUtils.lerp(scrollRotY.current, targetScrollRotY, 0.04);

    g.scale.setScalar(scrollScale.current);

    if (reduced) {
      g.position.y = scrollY.current;
      return;
    }

    const isInteracting = interactionMode.current !== 'none' || isAnimating.current;

    if (isInteracting) {
      // While actively dragging the whole cube, follow target rotation with smooth lerp
      if (interactionMode.current === 'whole-cube') {
        currentRot.current.x = THREE.MathUtils.lerp(currentRot.current.x, targetRot.current.x, ROT_LERP);
        currentRot.current.y = THREE.MathUtils.lerp(currentRot.current.y, targetRot.current.y, ROT_LERP);
        g.rotation.x = currentRot.current.x;
        g.rotation.y = currentRot.current.y;
      }
      // Position with scroll offset
      g.position.y = scrollY.current;
      // Pause idle during interaction
      idlePaused.current = true;
      idleResumeTime.current = performance.now() + IDLE_RESUME_DELAY;

      // ── Subtle hover + active layer scale feedback ──
      const targetHover = hoveredCubie.current ? HOVER_SCALE : 1;
      hoverScale.current = THREE.MathUtils.lerp(hoverScale.current, targetHover, HOVER_LERP);
      const targetLayerScale = interactionMode.current === 'layer' ? LAYER_ACTIVE_SCALE : 1;
      layerScale.current = THREE.MathUtils.lerp(layerScale.current, targetLayerScale, HOVER_LERP);

      for (const child of g.children) {
        if (!(child instanceof THREE.Group) || child.children.length === 0) continue;
        const isHovered = child === hoveredCubie.current;
        const isLayerActive = interactionMode.current === 'layer' &&
          activeLayerCubies.current.includes(child as THREE.Group);
        const s = isHovered ? hoverScale.current : isLayerActive ? layerScale.current : 1;
        if (child.scale.x !== s || child.scale.y !== s || child.scale.z !== s) {
          child.scale.setScalar(s);
        }
      }

      return;
    }

    // ─── Not interacting: momentum + idle blend ─────────

    // Check if it's time to resume idle
    if (idlePaused.current && performance.now() >= idleResumeTime.current) {
      idlePaused.current = false;
      // Sync idle phase to the current rotation so there's no jump
      idleY.current = currentRot.current.y - BASE_ROT_Y - scrollRotY.current;
    }

    // Apply momentum with heavy damping
    if (Math.abs(momentum.current.x) > 0.0001 || Math.abs(momentum.current.y) > 0.0001) {
      currentRot.current.x += momentum.current.x;
      currentRot.current.y += momentum.current.y;
      momentum.current.x *= VEL_DAMPING;
      momentum.current.y *= VEL_DAMPING;
    } else {
      momentum.current.x = 0;
      momentum.current.y = 0;
    }

    // Idle rotation advances only when not paused
    if (!idlePaused.current) {
      idleY.current += delta * (Math.PI * 2 / 20);
    }

    // Build target from base + idle + momentum-settled rotation + scroll + mouse-follow
    const idleContribution = idlePaused.current ? 0 : idleY.current;
    const targetRotY = BASE_ROT_Y + idleContribution + scrollRotY.current;
    const targetRotX = BASE_ROT_X + (-mouseTarget.current.y * 0.1);
    const targetRotZ = mouseTarget.current.x * 0.05;

    // If idle is active, smoothly blend currentRot toward the idle target
    // If momentum is active, currentRot is already set above and we blend toward idle target
    if (!idlePaused.current) {
      currentRot.current.x = THREE.MathUtils.lerp(currentRot.current.x, targetRotX, 0.04);
      currentRot.current.y = THREE.MathUtils.lerp(currentRot.current.y, targetRotY, 0.04);
    } else {
      // Momentum settling — gently pull toward base orientation + scroll
      currentRot.current.x = THREE.MathUtils.lerp(currentRot.current.x, targetRotX, 0.02);
      currentRot.current.y = THREE.MathUtils.lerp(currentRot.current.y, targetRotY, 0.02);
    }

    g.rotation.x = currentRot.current.x;
    g.rotation.y = currentRot.current.y;
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, targetRotZ, 0.02);

    // ── Subtle hover scale feedback (non-interacting state) ──
    const targetHover = hoveredCubie.current ? HOVER_SCALE : 1;
    hoverScale.current = THREE.MathUtils.lerp(hoverScale.current, targetHover, HOVER_LERP);
    layerScale.current = THREE.MathUtils.lerp(layerScale.current, 1, HOVER_LERP);
    for (const child of g.children) {
      if (!(child instanceof THREE.Group) || child.children.length === 0) continue;
      const isHovered = child === hoveredCubie.current;
      const s = isHovered ? hoverScale.current : 1;
      if (child.scale.x !== s || child.scale.y !== s || child.scale.z !== s) {
        child.scale.setScalar(s);
      }
    }

    // Gentle floating + scroll position
    floatPhase.current += delta * 0.5;
    g.position.y = scrollY.current + Math.sin(floatPhase.current) * 0.06;
  });

  return (
    <group
      ref={groupRef}
      scale={scaleRef.current}
      rotation={[BASE_ROT_X, BASE_ROT_Y, 0]}
      onPointerDown={onPointerDown}
    >
      {cubiePositions.map((pos) => {
        const key = `${Math.round(pos[0] / STEP)},${Math.round(pos[1] / STEP)},${Math.round(pos[2] / STEP)}`;
        return (
          <Cubie
            key={key}
            position={pos}
            cubieRef={(mesh) => {
              if (mesh) cubieRefs.current.set(key, mesh);
            }}
            onPointerOver={onCubiePointerOver}
            onPointerOut={onCubiePointerOut}
          />
        );
      })}
    </group>
  );
}

// ─── Lighting ───────────────────────────────────────────────

function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.9} color="#F5EFE3" />
      <directionalLight position={[5, 8, 6]} intensity={1.2} color="#F5EFE3" />
      <directionalLight position={[-6, -2, 4]} intensity={0.45} color="#EDE0CC" />
      <directionalLight position={[0, 3, -8]} intensity={0.35} color="#C4A878" />
    </>
  );
}

// ─── Scene wrapper ──────────────────────────────────────────

interface RubiksCubeSceneProps {
  reduced: boolean;
  scrollProgress: React.MutableRefObject<number>;
  onTurnComplete: () => void;
  onDragStateChange: (dragging: boolean) => void;
  resetRef: React.MutableRefObject<() => void>;
}

function RubiksCubeScene({
  reduced,
  scrollProgress,
  onTurnComplete,
  onDragStateChange,
  resetRef,
}: RubiksCubeSceneProps) {
  return (
    <>
      <StudioLighting />
      <CubeGroup
        reduced={reduced}
        scrollProgress={scrollProgress}
        onTurnComplete={onTurnComplete}
        onDragStateChange={onDragStateChange}
        resetRef={resetRef}
      />
      <ContactShadows
        position={[0, -2.1, 0]}
        opacity={0.28}
        scale={8}
        blur={3.5}
        far={4}
        color="#1A1814"
      />
    </>
  );
}

// ─── Exported canvas component ─────────────────────────────

interface RubiksCubeCanvasProps {
  reduced: boolean;
  scrollProgress: React.MutableRefObject<number>;
  onTurnComplete?: () => void;
  onDragStateChange?: (dragging: boolean) => void;
  resetCubeRef?: React.MutableRefObject<() => void>;
}

export function RubiksCubeCanvas({
  reduced,
  scrollProgress,
  onTurnComplete,
  onDragStateChange,
  resetCubeRef,
}: RubiksCubeCanvasProps) {
  const tier = useMemo(() => detectPerformanceTier(), []);
  const internalResetRef = useRef<() => void>(() => {});

  const handleTurnComplete = useCallback(() => {
    onTurnComplete?.();
  }, [onTurnComplete]);

  const handleDragStateChange = useCallback(
    (dragging: boolean) => {
      onDragStateChange?.(dragging);
    },
    [onDragStateChange]
  );

  useEffect(() => {
    if (resetCubeRef) {
      resetCubeRef.current = () => internalResetRef.current();
    }
  }, [resetCubeRef]);

  if (!shouldEnable3D(tier)) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [4.2, 3.6, 5.2], fov: 42 }}
      dpr={getDPR(tier)}
      gl={{ antialias: tier === 'desktop', alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'none' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
        });
      }}
    >
      <RubiksCubeScene
        reduced={reduced}
        scrollProgress={scrollProgress}
        onTurnComplete={handleTurnComplete}
        onDragStateChange={handleDragStateChange}
        resetRef={internalResetRef}
      />
    </Canvas>
  );
}
