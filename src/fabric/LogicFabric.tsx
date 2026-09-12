import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KnotCurve, STRANDS, type StrandSpec } from './curves.ts';
import { NODE_FRAG, NODE_VERT, STRAND_FRAG, STRAND_VERT } from './shaders.ts';
import { palette, shared } from './uniforms.ts';
import { perimeter } from '../state/perimeter.ts';

const TUBULAR_SEGMENTS = 720;
const RADIAL_SEGMENTS = 10;

function Strand({ spec }: { spec: StrandSpec }) {
  const geometry = useMemo(() => {
    const curve = new KnotCurve(spec.p, spec.q, spec.major, spec.minor, spec.zAmp);
    return new THREE.TubeGeometry(curve, TUBULAR_SEGMENTS, spec.radius, RADIAL_SEGMENTS, true);
  }, [spec]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STRAND_VERT,
        fragmentShader: STRAND_FRAG,
        uniforms: {
          uTime: shared.uTime,
          uPulse: shared.uPulse,
          uPulseFast: shared.uPulseFast,
          uListening: shared.uListening,
          uSurge: shared.uSurge,
          uStress: shared.uStress,
          uPhase: { value: spec.phase },
          uFade: shared.uFabricFade,
          uBase: { value: palette.base },
          uAccent: { value: palette.accent },
          uWarn: { value: palette.warn },
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [spec],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <mesh geometry={geometry} material={material} rotation={spec.rotation} frustumCulled={false} />;
}

/** Synapse nodes: point sprites seeded along every strand that flare as a pulse passes. */
function Synapses() {
  const geometry = useMemo(() => {
    const total = STRANDS.reduce((n, s) => n + s.nodes, 0);
    const positions = new Float32Array(total * 3);
    const ts = new Float32Array(total);
    const phases = new Float32Array(total);
    const sizes = new Float32Array(total);
    const v = new THREE.Vector3();
    const e = new THREE.Euler();
    let i = 0;
    for (const spec of STRANDS) {
      const curve = new KnotCurve(spec.p, spec.q, spec.major, spec.minor, spec.zAmp);
      e.set(...spec.rotation);
      for (let k = 0; k < spec.nodes; k++) {
        const t = (k + 0.5) / spec.nodes;
        curve.getPoint(t, v).applyEuler(e);
        positions.set([v.x, v.y, v.z], i * 3);
        ts[i] = t;
        phases[i] = spec.phase;
        sizes[i] = spec.nodeSize;
        i++;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(ts, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NODE_VERT,
        fragmentShader: NODE_FRAG,
        uniforms: {
          uTime: shared.uTime,
          uPulse: shared.uPulse,
          uPulseFast: shared.uPulseFast,
          uSurge: shared.uSurge,
          uStress: shared.uStress,
          uListening: shared.uListening,
          uPixelRatio: shared.uPixelRatio,
          uBase: { value: palette.node },
          uAccent: { value: palette.accent },
          uWarn: { value: palette.warn },
          uFade: shared.uFabricFade,
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

const SCALE = 0.82;

export function LogicFabric() {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0.11);
  const reduced = useMemo(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(dt, 1 / 30);
    g.visible = shared.uFabricFade.value > 0.004;
    const listening = perimeter.get().listening;
    // Idle: a slow, hardware-cool rotation. Listening: the fabric spins up.
    const target = reduced ? 0.03 : listening ? 0.36 : 0.11;
    spin.current = THREE.MathUtils.damp(spin.current, target, listening ? 4 : 1.6, d);
    g.rotation.y += spin.current * d;
    const t = state.clock.elapsedTime;
    g.rotation.x = Math.sin(t * 0.19) * 0.18 + (listening ? 0.22 : 0);
    g.rotation.z = Math.cos(t * 0.13) * 0.08;
  });

  return (
    <group ref={group} scale={SCALE}>
      {STRANDS.map((spec, i) => (
        <Strand key={i} spec={spec} />
      ))}
      <Synapses />
    </group>
  );
}
