import * as THREE from 'three';

/** One shared uniform set, updated once per frame by <FabricClock/>. */
export const shared = {
  uTime: { value: 0 },
  /** integrated pulse clock, [0,1) */
  uPulse: { value: 0 },
  /** accelerated pulse clock for the right side of the fabric under load */
  uPulseFast: { value: 0 },
  uListening: { value: 0 },
  uSurge: { value: 0 },
  /** ingestion_load stress, damped, [0,1] — 0 outside the simulator */
  uStress: { value: 0 },
  /** whole-fabric brightness; 0 behind the gateway monolith (initial mode), dimmed inside the phantom nexus */
  uFabricFade: { value: 0 },
  uPixelRatio: { value: 1 },
};

export const palette = {
  base: new THREE.Color('#0a3540'),
  accent: new THREE.Color('#7df7ff'),
  node: new THREE.Color('#0d4552'),
  dust: new THREE.Color('#5c7a84'),
  /** legacy-side degradation tint */
  warn: new THREE.Color('#ff7443'),
  turbOrange: new THREE.Color('#ff8a3c'),
  turbRed: new THREE.Color('#ee4128'),
};
