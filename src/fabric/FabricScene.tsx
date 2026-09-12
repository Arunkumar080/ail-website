import { useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CameraRig } from './CameraRig.tsx';
import { Dust } from './Dust.tsx';
import { LogicFabric } from './LogicFabric.tsx';
import { Turbulence } from './Turbulence.tsx';
import { Ladder } from '../ledger/Ladder.tsx';
import { arsenalScreen, monolithDim, shatter } from '../gateway/arsenal.ts';
import { Arsenal } from '../gateway/Arsenal.tsx';
import { Monolith } from '../gateway/Monolith.tsx';
import { ClusterNodes } from '../phantom/ClusterNodes.tsx';
import { Enclave } from '../phantom/Enclave.tsx';
import { shared } from './uniforms.ts';
import { synth } from '../audio/synth.ts';
import { perimeter } from '../state/perimeter.ts';

const VOID = '#030405';
const VOID_COLOR = new THREE.Color(VOID);
const BLACK = new THREE.Color('#000000');

/** Drives the shared uniform set once per frame. Reads the store directly: no React in the loop. */
function FabricClock() {
  useFrame((state, dt) => {
    // Whole-frame draw-call accounting (the composer renders several passes per frame).
    state.gl.info.autoReset = false;
    state.gl.info.reset();
    const d = Math.min(dt, 1 / 30);
    const { listening, mode } = perimeter.get();
    const u = shared;
    u.uTime.value = state.clock.elapsedTime;
    u.uListening.value = THREE.MathUtils.damp(u.uListening.value, listening ? 1 : 0, listening ? 6 : 2.5, d);
    const sinceSurge = (performance.now() - perimeter.surgeAt) / 1000;
    u.uSurge.value = sinceSurge < 0 ? 0 : Math.exp(-sinceSurge * 1.9) * (1 - Math.exp(-sinceSurge * 18));
    // ingestion_load → stress, only while the simulator is live.
    const stressTarget = mode === 'simulator' ? perimeter.stress() : 0;
    u.uStress.value = THREE.MathUtils.damp(u.uStress.value, stressTarget, 3.5, d);
    // The fabric is hidden behind the gateway monolith and blooms in as it shatters.
    const fadeTarget = mode === 'gateway' ? (perimeter.get().shattering ? 1 : 0) : mode === 'phantom' ? 0.42 : 1;
    u.uFabricFade.value = THREE.MathUtils.damp(u.uFabricFade.value, fadeTarget, mode === 'gateway' ? 2.2 : 2.5, d);
    const bg = state.scene.background;
    if (bg instanceof THREE.Color) bg.lerp(mode === 'gateway' && shatter.value < 0.5 ? BLACK : VOID_COLOR, Math.min(1, 2 * d));
    // Integrated pulse clocks: speed ramps smoothly, heads never jump.
    const speed = 0.042 + 0.085 * u.uListening.value + 0.14 * u.uSurge.value;
    u.uPulse.value = (u.uPulse.value + speed * d) % 1;
    const fast = speed * (1 + 3.2 * u.uStress.value);
    u.uPulseFast.value = (u.uPulseFast.value + fast * d) % 1;
    u.uPixelRatio.value = state.viewport.dpr;
  });
  return null;
}

export function FabricScene() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      perimeter.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      perimeter.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <Canvas
      dpr={[1, 1.5]}
      flat
      onCreated={({ gl, camera }) => {
        if (import.meta.env.DEV) {
          (window as unknown as { __ail: unknown }).__ail = {
            stats: () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, points: gl.info.render.points }),
            audio: () => synth.debug(),
            cam: () => ({ x: +camera.position.x.toFixed(3), y: +camera.position.y.toFixed(3), z: +camera.position.z.toFixed(3) }),
            arsenal: () => Object.fromEntries(arsenalScreen),
            gateway: () => ({ arsenal: perimeter.get().arsenal, shattering: perimeter.get().shattering, shatter: shatter.value, view: perimeter.get().gatewayView, dim: +monolithDim.get().toFixed(3) }),
          };
        }
      }}
      camera={{ fov: 38, position: [0, 0, 6.2], near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={[VOID]} />
      <FabricClock />
      <CameraRig />
      <Ladder />
      <Monolith />
      <Arsenal />
      <Enclave />
      <ClusterNodes />
      <LogicFabric />
      <Turbulence />
      <Dust />
      <EffectComposer multisampling={4}>
        <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.25} intensity={1.25} mipmapBlur levels={5} radius={0.72} />
      </EffectComposer>
    </Canvas>
  );
}
