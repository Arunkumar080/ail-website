import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CLUSTER_NODES, clusterRegistry } from './cluster.ts';
import { phantomAlpha } from './alpha.ts';
import { CLUSTER_FRAG, CLUSTER_VERT } from './shaders.ts';
import { lcg } from '../fabric/random.ts';
import { palette, shared } from '../fabric/uniforms.ts';
import { perimeter } from '../state/perimeter.ts';

const COUNT = 240;
const RADIUS = 0.058;
/** distance from the camera along each cell's ray */
const DEPTH = 1.15;
const { damp } = THREE.MathUtils;

const AMBER = new THREE.Color('#f0b35a');
const WHITE = new THREE.Color('#eafcff');

type U = { value: number };
interface NodeLive {
  uOpt: U;
  uFlash: U;
  uWave: U;
}
/** Per-node uniforms, mutated by the frame loop only. */
const live: NodeLive[] = CLUSTER_NODES.map(() => ({ uOpt: { value: 0 }, uFlash: { value: 0 }, uWave: { value: 0 } }));
const scratch = new THREE.Vector3();

function makeGeometry(seed: number) {
  const rnd = lcg(seed);
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = RADIUS * Math.pow(rnd(), 0.75);
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const k = Math.sqrt(1 - u * u);
    positions.set([r * k * Math.cos(th), r * u, r * k * Math.sin(th)], i * 3);
    seeds[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  return g;
}

/**
 * Four particle nodes overlaid on the visualizer's CSS grid: every frame each
 * cell's centre is unprojected along the camera ray to a fixed depth.
 */
export function ClusterNodes() {
  const points = useRef<(THREE.Object3D | null)[]>([]);
  const geometries = useMemo(() => CLUSTER_NODES.map((_, i) => makeGeometry(300 + i)), []);
  const materials = useMemo(
    () =>
      CLUSTER_NODES.map(
        (_, i) =>
          new THREE.ShaderMaterial({
            vertexShader: CLUSTER_VERT,
            fragmentShader: CLUSTER_FRAG,
            uniforms: {
              uTime: shared.uTime,
              uPixelRatio: shared.uPixelRatio,
              uAlpha: phantomAlpha,
              uOpt: live[i].uOpt,
              uFlash: live[i].uFlash,
              uWave: live[i].uWave,
              uAmber: { value: AMBER },
              uCyan: { value: palette.accent },
              uWhite: { value: WHITE },
            },
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [],
  );
  useEffect(
    () => () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
    },
    [geometries, materials],
  );

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 30);
    const { dropPhase } = perimeter.get();
    const el = (performance.now() - perimeter.dropAt) / 1000;
    const visible = phantomAlpha.value > 0.005;
    const camera = state.camera;
    camera.updateMatrixWorld();
    const { width, height } = state.size;

    for (let i = 0; i < live.length; i++) {
      const u = live[i];
      // phase 1: node_01 flashes cyan while the hardware hash is generated
      const flash = i === 0 && dropPhase === 1 ? 0.55 + 0.45 * Math.sin(el * 28) : 0;
      u.uFlash.value = damp(u.uFlash.value, flash, 14, d);
      // phase 2: high-speed sweep across the four nodes (2.5 sweeps/s)
      let wave = 0;
      if (dropPhase === 2) {
        const front = (((el - 0.8) * 2.5) % 1) * 4.8 - 0.4;
        wave = Math.exp(-((front - i) * (front - i)) / 0.32);
      }
      u.uWave.value = damp(u.uWave.value, wave, 18, d);
      // phase 3+: amber → electric cyan / white
      u.uOpt.value = damp(u.uOpt.value, dropPhase >= 3 ? 1 : 0, 3.2, d);

      const pts = points.current[i];
      if (!pts) continue;
      pts.visible = visible;
      const cell = clusterRegistry.get(i);
      if (!cell || !visible) continue;
      const r = cell.getBoundingClientRect();
      const nx = ((r.left + r.width / 2) / width) * 2 - 1;
      const ny = -(((r.top + r.height / 2) / height) * 2 - 1);
      scratch.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
      pts.position.copy(camera.position).addScaledVector(scratch, DEPTH);
    }
  });

  return (
    <>
      {CLUSTER_NODES.map((n, i) => (
        <points
          key={n.id}
          ref={(el) => {
            points.current[i] = el;
          }}
          geometry={geometries[i]}
          material={materials[i]}
          frustumCulled={false}
          visible={false}
        />
      ))}
    </>
  );
}
