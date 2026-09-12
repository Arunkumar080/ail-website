import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gatewayAlpha, monolithDim, shatter } from './arsenal.ts';
import { MONOLITH_FRAG, MONOLITH_VERT } from './shaders.ts';
import { lcg } from '../fabric/random.ts';
import { shared } from '../fabric/uniforms.ts';
import { perimeter } from '../state/perimeter.ts';

const W = 1.0;
const H = 2.2;
const D = 0.55;
const SPLIT = 10;
const SHATTER_MS = 1100;

interface Seg {
  a: THREE.Vector3;
  b: THREE.Vector3;
  tint: number;
}

function boxEdges(w: number, h: number, d: number, tint: number, out: Seg[]) {
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  const c = [
    [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
  ].map(([a, b, cc]) => new THREE.Vector3(a, b, cc));
  const pairs = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  for (const [i, j] of pairs) out.push({ a: c[i], b: c[j], tint });
}

/** Outer edges, three inner section frames, and a few structural diagonals. */
function buildSegments(): Seg[] {
  const segs: Seg[] = [];
  boxEdges(W, H, D, 1, segs);
  for (const f of [-0.5, 0, 0.5]) {
    const y = f * H * 0.82;
    const x = W * 0.42;
    const z = D * 0.42;
    const ring = [
      new THREE.Vector3(-x, y, -z), new THREE.Vector3(x, y, -z),
      new THREE.Vector3(x, y, z), new THREE.Vector3(-x, y, z),
    ];
    for (let i = 0; i < 4; i++) segs.push({ a: ring[i], b: ring[(i + 1) % 4], tint: 0.38 });
  }
  const dx = W * 0.5;
  const dy = H * 0.5;
  const dz = D * 0.5;
  segs.push({ a: new THREE.Vector3(-dx, -dy, dz), b: new THREE.Vector3(dx, dy, dz), tint: 0.22 });
  segs.push({ a: new THREE.Vector3(dx, -dy, -dz), b: new THREE.Vector3(-dx, dy, -dz), tint: 0.22 });
  segs.push({ a: new THREE.Vector3(0, -dy, 0), b: new THREE.Vector3(0, dy, 0), tint: 0.16 });
  return segs;
}

function buildGeometry(): THREE.BufferGeometry {
  const rnd = lcg(2077);
  const segs = buildSegments();
  const n = segs.length * SPLIT * 2;
  const positions = new Float32Array(n * 3);
  const centers = new Float32Array(n * 3);
  const dirs = new Float32Array(n * 3);
  const seeds = new Float32Array(n);
  const tints = new Float32Array(n);
  let v = 0;
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const dir = new THREE.Vector3();
  for (const s of segs) {
    for (let k = 0; k < SPLIT; k++) {
      p.lerpVectors(s.a, s.b, k / SPLIT);
      q.lerpVectors(s.a, s.b, (k + 1) / SPLIT);
      mid.addVectors(p, q).multiplyScalar(0.5);
      dir.copy(mid).normalize().addScaledVector(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5), 0.9).normalize();
      const seed = rnd();
      for (const pt of [p, q]) {
        positions.set([pt.x, pt.y, pt.z], v * 3);
        centers.set([mid.x, mid.y, mid.z], v * 3);
        dirs.set([dir.x, dir.y, dir.z], v * 3);
        seeds[v] = seed;
        tints[v] = s.tint;
        v++;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('aCenter', new THREE.BufferAttribute(centers, 3));
  g.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  g.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
  return g;
}

const { damp } = THREE.MathUtils;

/** Monolith brightness uniform: gateway fade × framer-motion dim, written by the frame loop. */
const monolithAlpha = { value: 0 };

/** "The Client Perimeter": a slowly rotating wireframe monolith that shatters into the fabric on launch. */
export function Monolith() {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => buildGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: MONOLITH_VERT,
        fragmentShader: MONOLITH_FRAG,
        uniforms: {
          uTime: shared.uTime,
          uShatter: shatter,
          uAlpha: monolithAlpha,
          uColor: { value: new THREE.Color('#8fe9f2') },
          uHot: { value: new THREE.Color('#eafcff') },
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const lines = useMemo(() => new THREE.LineSegments(geometry, material), [geometry, material]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 30);
    const { mode, shattering } = perimeter.get();
    const gateway = mode === 'gateway';
    gatewayAlpha.value = damp(gatewayAlpha.value, gateway ? 1 : 0, gateway ? 2.4 : 5, d);
    shatter.value = shattering ? Math.min(1, (performance.now() - perimeter.shatterAt) / SHATTER_MS) : 0;
    const g = group.current;
    if (!g) return;
    // executive briefing: 20% watermark, rotation slowed to a quarter
    const dim = monolithDim.get();
    monolithAlpha.value = gatewayAlpha.value * dim;
    g.visible = gatewayAlpha.value > 0.005 && shatter.value < 0.999;
    const t = state.clock.elapsedTime;
    const rate = 0.25 + 0.75 * (dim - 0.2) / 0.8;
    g.rotation.y += 0.12 * rate * d;
    g.rotation.x = 0.14 + Math.sin(t * 0.21) * 0.05;
    g.rotation.z = Math.cos(t * 0.17) * 0.04;
  });

  return (
    <group ref={group} visible={false}>
      <primitive object={lines} />
    </group>
  );
}
