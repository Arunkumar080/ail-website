import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ARSENAL, ORBIT_RADIUS, ORBIT_SPEED, ORBIT_TILT, arsenalScreen, arsenalWorld, gatewayAlpha } from './arsenal.ts';
import { CORE_FRAG, CORE_VERT } from '../ledger/shaders.ts';
import { palette, shared } from '../fabric/uniforms.ts';
import { perimeter, type ArsenalId } from '../state/perimeter.ts';

const { damp } = THREE.MathUtils;
const AMBER = new THREE.Color('#f0b35a');
const RED = new THREE.Color('#ff4b3a');
const ZERO = { value: 0 };

type U = { value: number };
interface NodeLive {
  uAlpha: U;
  uHover: U;
  spawn: number;
}
/** Per-node uniforms, mutated by the frame loop only. */
const live: Record<ArsenalId, NodeLive> = Object.fromEntries(
  ARSENAL.map((n) => [n.id, { uAlpha: { value: 0 }, uHover: { value: 0 }, spawn: 0 }]),
) as Record<ArsenalId, NodeLive>;

const inGateway = () => {
  const s = perimeter.get();
  return s.mode === 'gateway' && s.arsenal && s.gatewayView === 'technical';
};

function Node({ id, index }: { id: ArsenalId; index: number }) {
  const group = useRef<THREE.Group>(null);
  const core = useMemo(() => new THREE.SphereGeometry(0.075, 32, 24), []);
  const hit = useMemo(() => new THREE.SphereGeometry(0.24, 12, 8), []);
  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
        uniforms: {
          uTime: shared.uTime,
          uAlpha: live[id].uAlpha,
          uHover: live[id].uHover,
          uSelect: live[id].uHover,
          uDrift: ZERO,
          uDriftRed: ZERO,
          uPhase: { value: index / ARSENAL.length },
          uAccent: { value: palette.accent },
          uAmber: { value: AMBER },
          uRed: { value: RED },
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [id, index],
  );
  const hitMat = useMemo(() => new THREE.MeshBasicMaterial(), []);
  useEffect(
    () => () => {
      core.dispose();
      hit.dispose();
      coreMat.dispose();
      hitMat.dispose();
    },
    [core, hit, coreMat, hitMat],
  );

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!inGateway()) return;
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    if (perimeter.get().arsenalHover !== id) perimeter.set({ arsenalHover: id });
  };
  const out = () => {
    if (perimeter.get().arsenalHover !== id) return;
    document.body.style.cursor = '';
    perimeter.set({ arsenalHover: null });
  };

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(dt, 1 / 30);
    const l = live[id];
    const { arsenal, arsenalHover, shattering, gatewayView } = perimeter.get();
    // staggered spawn once the manifesto has faded; dissolve for the briefing or the shatter
    const target = arsenal && !shattering && gatewayView === 'technical' ? 1 : 0;
    l.spawn = damp(l.spawn, target, target ? 3.2 : 6, d);
    l.uAlpha.value = gatewayAlpha.value * l.spawn;
    l.uHover.value = damp(l.uHover.value, arsenalHover === id ? 1 : 0, 9, d);
    g.visible = l.uAlpha.value > 0.005;

    // orbit around the monolith on a tilted ring
    const a = state.clock.elapsedTime * ORBIT_SPEED + (index / ARSENAL.length) * Math.PI * 2;
    const r = ORBIT_RADIUS * (0.6 + 0.4 * l.spawn);
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    const y = z * Math.sin(ORBIT_TILT) + 0.08 * Math.sin(state.clock.elapsedTime * 0.7 + index);
    g.position.set(x, y, z * Math.cos(ORBIT_TILT));
    g.scale.setScalar(0.4 + 0.6 * l.spawn + 0.25 * l.uHover.value);

    // publish world + screen positions for the camera rig and the dev hook
    const w = arsenalWorld.get(id);
    if (w) w.copy(g.position);
    const sp = g.position.clone().project(state.camera);
    arsenalScreen.set(id, {
      x: (sp.x * 0.5 + 0.5) * state.size.width,
      y: (1 - (sp.y * 0.5 + 0.5)) * state.size.height,
    });
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={core} material={coreMat} frustumCulled={false} />
      <mesh geometry={hit} material={hitMat} visible={false} onPointerOver={over} onPointerOut={out} onClick={over} />
    </group>
  );
}

/** Five interactive glowing nodes in a 3D orbit around the monolith. */
export function Arsenal() {
  return (
    <>
      {ARSENAL.map((n, i) => (
        <Node key={n.id} id={n.id} index={i} />
      ))}
    </>
  );
}
