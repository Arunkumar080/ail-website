/**
 * Cluster node particles. Amber state: fragmented stutter with irregular
 * spikes. Optimised state: coherent drift, steady breathing. uFlash lights
 * node_01 during compile; uWave carries the injection sweep.
 */
export const CLUSTER_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uAlpha;
  uniform float uOpt;
  uniform float uFlash;
  uniform float uWave;
  attribute float aSeed;
  varying float vA;
  varying float vHot;
  float hash11(float n) { return fract(sin(n) * 43758.5453123); }
  void main() {
    float t = uTime;
    vec3 p = position;
    // legacy: quantised stutter (memory fragmentation)
    float st = floor(t * 14.0) / 14.0;
    p += (1.0 - uOpt) * 0.011 * vec3(
      sin(st * 97.0 + aSeed * 61.0),
      cos(st * 89.0 + aSeed * 71.0),
      sin(st * 83.0 + aSeed * 67.0));
    // symbiotic: coherent slow drift
    p += uOpt * 0.006 * vec3(sin(t * 1.3 + aSeed * 20.0), cos(t * 1.1 + aSeed * 17.0), sin(t * 0.9 + aSeed * 13.0));
    // irregular amber pulsing with random latency spikes
    float spike = step(0.94, hash11(floor(t * 6.0) + aSeed * 3.0));
    float amber = 0.42 + 0.22 * sin(t * 2.3 + aSeed * 4.0) + 0.7 * spike;
    float cyan = 0.9 + 0.1 * sin(t * 1.7 + aSeed * 2.0);
    vA = mix(amber, cyan, uOpt) * uAlpha;
    vHot = (uFlash + uWave) * uAlpha;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.3 + 1.7 * aSeed) * uPixelRatio * (1.0 + 0.7 * vHot) * (1.25 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const CLUSTER_FRAG = /* glsl */ `
  precision highp float;
  uniform float uOpt;
  uniform vec3 uAmber;
  uniform vec3 uCyan;
  uniform vec3 uWhite;
  varying float vA;
  varying float vHot;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.08, d);
    vec3 base = mix(uAmber * 0.55, mix(uCyan, uWhite, 0.35), uOpt);
    vec3 col = base * vA + mix(uCyan, uWhite, 0.5) * vHot * 1.4;
    gl_FragColor = vec4(col * a, 1.0);
    #include <colorspace_fragment>
  }
`;
