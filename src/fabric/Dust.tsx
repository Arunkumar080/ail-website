import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { lcg } from './random.ts';
import { DUST_FRAG, DUST_VERT } from './shaders.ts';
import { palette, shared } from './uniforms.ts';

const COUNT = 520;

/** Sparse, dim particulate so the void has depth without reading as "stars". */
export function Dust() {
  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const rnd = lcg(1337);
    for (let i = 0; i < COUNT; i++) {
      // Shell between r=1.9 and r=5.5, biased outward.
      const r = 1.9 + Math.pow(rnd(), 0.6) * 3.6;
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
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        uniforms: {
          uTime: shared.uTime,
          uPixelRatio: shared.uPixelRatio,
          uColor: { value: palette.dust },
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
