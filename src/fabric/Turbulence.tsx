import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { lcg } from './random.ts';
import { TURB_FRAG, TURB_VERT } from './shaders.ts';
import { palette, shared } from './uniforms.ts';

const COUNT = 1800;
const RADIUS = 1.22;

/**
 * Red/orange memory-fragmentation turbulence on the legacy (left) side of the
 * fabric. Lives at the scene root, not inside the rotating group, so the
 * split stays fixed to the viewer's left.
 */
export function Turbulence() {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const dirs = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const rnd = lcg(4242);
    for (let i = 0; i < COUNT; i++) {
      const r = RADIUS * Math.cbrt(rnd());
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const k = Math.sqrt(1 - u * u);
      const x = -Math.abs(r * k * Math.cos(th)) - 0.05;
      const y = r * u;
      const z = r * k * Math.sin(th);
      positions.set([x, y, z], i * 3);
      const len = Math.hypot(x, y, z) || 1;
      dirs.set([x / len, y / len, z / len], i * 3);
      seeds[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TURB_VERT,
        fragmentShader: TURB_FRAG,
        uniforms: {
          uTime: shared.uTime,
          uStress: shared.uStress,
          uPixelRatio: shared.uPixelRatio,
          uOrange: { value: palette.turbOrange },
          uRed: { value: palette.turbRed },
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

  // Skip the draw entirely when there is no load to visualise.
  useFrame(() => {
    const p = points.current;
    if (p) p.visible = shared.uStress.value > 0.004;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} visible={false} />;
}
