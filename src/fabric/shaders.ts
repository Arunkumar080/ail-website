/**
 * All strands, synapse nodes, dust and turbulence share one uniform set so the
 * whole fabric breathes on the same clock. `uPulse` / `uPulseFast` are
 * integrated phase clocks (not uTime * speed) so pulse speed can change
 * without heads jumping.
 */
export const PULSE_FN = /* glsl */ `
  float gauss(float x, float w) { return exp(-(x * x) / (2.0 * w * w)); }

  // Three pulse heads per strand, evenly spaced around the loop, each with a
  // bright core, a soft halo, and a trailing tail behind the direction of travel.
  float pulseAt(float t, float clock, float phase) {
    float head0 = clock + phase;
    float p = 0.0;
    for (int i = 0; i < 3; i++) {
      float head = fract(head0 + float(i) / 3.0);
      float d = fract(t - head + 0.5) - 0.5;
      p += gauss(d, 0.009);
      p += 0.32 * gauss(d, 0.04);
      p += 0.22 * exp(-abs(d) / 0.07) * (d < 0.0 ? 1.0 : 0.25);
    }
    return p;
  }
`;

/**
 * Left/right split of the fabric in world space (the camera pans, the fabric
 * stays at the origin, so world x maps to screen x) and the legacy-side
 * fragmentation jitter: a flowing high-frequency term plus a time-quantised
 * stutter so the left side reads as stalling rather than flowing.
 */
export const SPLIT_FN = /* glsl */ `
  float hash11(float n) { return fract(sin(n) * 43758.5453123); }

  // 1 on the right half of the fabric (world x > 0), 0 on the left.
  float rightSide(float wx) { return smoothstep(-0.22, 0.22, wx); }

  vec3 fragJitter(vec3 p, float t) {
    vec3 flow = vec3(
      sin(t * 41.0 + p.y * 23.0 + p.z * 17.0),
      cos(t * 37.0 + p.x * 19.0 + p.z * 29.0),
      sin(t * 53.0 + p.x * 31.0 + p.y * 13.0));
    float st = floor(t * 18.0) / 18.0;
    vec3 stutter = vec3(
      sin(st * 97.0 + p.y * 61.0),
      cos(st * 89.0 + p.z * 71.0),
      sin(st * 83.0 + p.x * 67.0));
    return flow * 0.018 + stutter * 0.03;
  }
`;

export const STRAND_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uStress;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  varying float vWx;
  ${SPLIT_FN}
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float left = 1.0 - rightSide(wp.x);
    wp.xyz += fragJitter(wp.xyz, uTime) * left * uStress;
    vWx = wp.x;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const STRAND_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uPulse;
  uniform float uPulseFast;
  uniform float uListening;
  uniform float uSurge;
  uniform float uStress;
  uniform float uPhase;
  uniform float uFade;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform vec3 uWarn;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  varying float vWx;
  ${PULSE_FN}
  ${SPLIT_FN}
  void main() {
    float t = vUv.x;
    float side = rightSide(vWx);
    float left = 1.0 - side;
    float sm = smoothstep(0.0, 0.1, uStress);

    // Right side: accelerated clock under load. Left side: base clock.
    float p = mix(pulseAt(t, uPulse, uPhase), pulseAt(t, uPulseFast, uPhase), side * sm);

    // Left side: segment-wise flicker and a warm degradation tint.
    float degrade = left * uStress;
    float flick = hash11(floor(uTime * 24.0) + uPhase * 7.0 + floor(vUv.x * 6.0));
    float flicker = mix(1.0, 0.3 + 1.4 * flick, degrade * 0.85);

    float breath = 0.5 + 0.5 * sin(uTime * 0.7 + uPhase * 6.2832);
    float fres = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.2);
    float ambient = (0.085 + 0.05 * breath + 0.10 * uListening + 0.22 * uSurge) * flicker;
    float gain = (0.78 + 0.45 * uListening + 0.9 * uSurge) * (1.0 + 0.55 * side * uStress) * flicker;

    vec3 base = mix(uBase, uWarn * 0.32, degrade * 0.75);
    vec3 accent = mix(uAccent, uWarn, degrade * 0.9);
    vec3 col = base * (ambient + fres * 0.22)
             + accent * (p * gain + fres * ambient * 0.35);
    gl_FragColor = vec4(col * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

export const NODE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform float uPulseFast;
  uniform float uSurge;
  uniform float uStress;
  uniform float uPixelRatio;
  attribute float aT;
  attribute float aPhase;
  attribute float aSize;
  varying float vGlow;
  varying float vWarm;
  ${PULSE_FN}
  ${SPLIT_FN}
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float side = rightSide(wp.x);
    float left = 1.0 - side;
    wp.xyz += fragJitter(wp.xyz, uTime) * left * uStress;
    float sm = smoothstep(0.0, 0.1, uStress);
    float p = mix(pulseAt(aT, uPulse, aPhase), pulseAt(aT, uPulseFast, aPhase), side * sm);
    vGlow = (min(p, 1.6) + uSurge * 0.7) * (1.0 + 0.4 * side * uStress);
    vWarm = left * uStress;
    vec4 mv = viewMatrix * wp;
    gl_PointSize = aSize * uPixelRatio * (1.0 + vGlow * 0.85) * (6.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const NODE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform vec3 uWarn;
  uniform float uListening;
  uniform float uFade;
  varying float vGlow;
  varying float vWarm;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    core *= core;
    float ring = smoothstep(0.5, 0.44, d) * smoothstep(0.36, 0.44, d);
    float idle = 0.18 + 0.12 * uListening;
    vec3 base = mix(uBase, uWarn * 0.3, vWarm * 0.7);
    vec3 accent = mix(uAccent, uWarn, vWarm * 0.9);
    vec3 col = base * (core * 0.9 + ring * 0.6) * idle * 4.0
             + accent * vGlow * (core * 1.3 + ring * 0.5);
    float a = core * (idle + vGlow) + ring * idle;
    gl_FragColor = vec4(col * a * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

export const DUST_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vTwinkle;
  void main() {
    vec3 pos = position;
    pos += 0.08 * vec3(
      sin(uTime * 0.21 + aSeed * 6.0),
      cos(uTime * 0.17 + aSeed * 9.0),
      sin(uTime * 0.13 + aSeed * 4.0)
    );
    vTwinkle = 0.55 + 0.45 * sin(uTime * 0.9 + aSeed * 40.0);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1.1 + aSeed * 1.4) * uPixelRatio * (6.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const DUST_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d) * vTwinkle * 0.28;
    gl_FragColor = vec4(uColor * a, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Legacy-side turbulence: red/orange particles seeded in the left hemisphere
 * of the fabric. Each one swirls, stutters, and fragments outward along its
 * own direction on a sawtooth life; everything scales with uStress so the
 * field is invisible at zero load.
 */
export const TURB_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uStress;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute vec3 aDir;
  varying float vA;
  varying float vHeat;
  ${SPLIT_FN}
  void main() {
    float s = uStress;
    float t = uTime;
    vec3 pos = position;
    pos += 0.22 * s * vec3(
      sin(t * 1.7 + aSeed * 31.0),
      cos(t * 1.3 + aSeed * 17.0),
      sin(t * 1.9 + aSeed * 23.0));
    float st = floor(t * 20.0) / 20.0;
    pos += 0.06 * s * vec3(
      sin(st * 113.0 + aSeed * 97.0),
      cos(st * 127.0 + aSeed * 89.0),
      sin(st * 131.0 + aSeed * 83.0));
    float life = fract(t * (0.22 + 0.4 * aSeed) + aSeed);
    pos += aDir * life * 0.55 * s;
    // keep the field on the legacy side even after drift
    pos.x = min(pos.x, -0.04);
    float flick = 0.45 + 0.55 * hash11(aSeed * 1000.0 + floor(t * 12.0));
    vA = s * (1.0 - life) * flick;
    vHeat = aSeed;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1.3 + 2.4 * aSeed) * uPixelRatio * (0.5 + s) * (6.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const TURB_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uOrange;
  uniform vec3 uRed;
  varying float vA;
  varying float vHeat;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.08, d) * vA * 0.9;
    vec3 c = mix(uRed, uOrange, vHeat);
    gl_FragColor = vec4(c * a, 1.0);
    #include <colorspace_fragment>
  }
`;
