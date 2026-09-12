import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { phantomAlpha } from './alpha.ts';
import { lcg } from '../fabric/random.ts';
import { NODE_FRAG, NODE_VERT, STRAND_FRAG, STRAND_VERT } from '../fabric/shaders.ts';
import { palette, shared } from '../fabric/uniforms.ts';
import { perimeter } from '../state/perimeter.ts';

const TRACES = 32;
const LAYER_Z = [-0.3, -0.5, -0.72];
const { clamp, damp } = THREE.MathUtils;

interface Trace {
  path: THREE.CurvePath<THREE.Vector3>;
  phase: number;
  start: THREE.Vector3;
  end: THREE.Vector3;
}

/** Rectilinear cpu/ram trace paths on three depth layers, with occasional vias between layers. */
function buildTraces(): Trace[] {
  const rnd = lcg(9001);
  const out: Trace[] = [];
  for (let i = 0; i < TRACES; i++) {
    const z = LAYER_Z[i % LAYER_Z.length];
    let p = new THREE.Vector3((rnd() - 0.5) * 1.1, (rnd() - 0.5) * 0.8, z);
    const start = p.clone();
    const path = new THREE.CurvePath<THREE.Vector3>();
    const segments = 3 + Math.floor(rnd() * 3);
    let axis = rnd() < 0.5 ? 0 : 1;
    for (let s = 0; s < segments; s++) {
      const len = 0.08 + rnd() * 0.26;
      const dir = rnd() < 0.5 ? -1 : 1;
      const q = p.clone();
      if (axis === 0) q.x = clamp(q.x + len * dir, -0.62, 0.62);
      else q.y = clamp(q.y + len * dir, -0.46, 0.46);
      if (s === Math.floor(segments / 2) && rnd() < 0.35) q.z = LAYER_Z[(i + 1) % LAYER_Z.length];
      if (q.distanceToSquared(p) > 1e-6) path.add(new THREE.LineCurve3(p, q));
      p = q;
      axis = 1 - axis;
    }
    out.push({ path, phase: rnd(), start, end: p.clone() });
  }
  return out;
}

const traces = buildTraces();

// Every trace carries its pulse phase as a vertex attribute so all 32 tubes
// merge into one geometry and one draw call.
const TRACE_VERT = STRAND_VERT.replace(
  'varying float vWx;',
  'varying float vWx;\n  attribute float aPhase;\n  varying float vPhase;',
).replace('vWx = wp.x;', 'vWx = wp.x;\n    vPhase = aPhase;');
const TRACE_FRAG = STRAND_FRAG.replace('uniform float uPhase;', 'varying float vPhase;').replaceAll('uPhase', 'vPhase');

function buildTraceGeometry(): THREE.BufferGeometry {
  const parts = traces.map((tr) => {
    const g = new THREE.TubeGeometry(tr.path, 96, 0.0045, 6, false);
    const n = g.attributes.position.count;
    g.setAttribute('aPhase', new THREE.BufferAttribute(new Float32Array(n).fill(tr.phase), 1));
    return g;
  });
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) throw new Error('enclave: trace merge failed');
  return merged;
}

function Traces() {
  const geometry = useMemo(() => buildTraceGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TRACE_VERT,
        fragmentShader: TRACE_FRAG,
        uniforms: {
          uTime: shared.uTime,
          uPulse: shared.uPulse,
          uPulseFast: shared.uPulseFast,
          uListening: shared.uListening,
          uSurge: shared.uSurge,
          uStress: shared.uStress,
          uFade: phantomAlpha,
          uBase: { value: palette.base },
          uAccent: { value: palette.accent },
          uWarn: { value: palette.warn },
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
  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

/** Pads at every trace endpoint; they flare when a pulse arrives, via the synapse shader. */
function Pads() {
  const geometry = useMemo(() => {
    const n = traces.length * 2;
    const positions = new Float32Array(n * 3);
    const ts = new Float32Array(n);
    const phases = new Float32Array(n);
    const sizes = new Float32Array(n);
    traces.forEach((tr, i) => {
      positions.set([tr.start.x, tr.start.y, tr.start.z], i * 6);
      positions.set([tr.end.x, tr.end.y, tr.end.z], i * 6 + 3);
      ts[i * 2] = 0;
      ts[i * 2 + 1] = 1;
      phases[i * 2] = phases[i * 2 + 1] = tr.phase;
      sizes[i * 2] = sizes[i * 2 + 1] = 3.2;
    });
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
          uFade: phantomAlpha,
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

/**
 * The hardware enclave: glowing cpu/ram trace paths just inside the fabric,
 * in front of the phantom camera. Scene-root, so the fabric's rotation
 * sweeps its strands past the traces.
 */
export function Enclave() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);
    const phantom = perimeter.get().mode === 'phantom';
    phantomAlpha.value = damp(phantomAlpha.value, phantom ? 1 : 0, phantom ? 2.2 : 5, d);
    if (group.current) group.current.visible = phantomAlpha.value > 0.005;
  });
  return (
    <group ref={group} visible={false}>
      <Traces />
      <Pads />
    </group>
  );
}
