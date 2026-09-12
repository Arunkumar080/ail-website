/** Shared drift/alpha colouring for every ledger material. */
const DRIFT_FN = /* glsl */ `
  // Amber while drifted, red while quarantined; the pulse rate escalates with it.
  vec3 driftTint(vec3 col, float drift, float red, float t, float base) {
    float rate = mix(6.0, 22.0, red);
    float pulse = 0.55 + 0.45 * sin(t * rate);
    vec3 warn = mix(uAmber, uRed, red);
    return mix(col, warn * base * (0.5 + 0.9 * pulse), drift);
  }
`;

export const PLANE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Semi-transparent dimensional plane with subtle additive grid lines and a hairline border. */
export const PLANE_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uAlpha;
  uniform float uFocus;
  uniform float uDrift;
  uniform float uDriftRed;
  uniform vec2 uCells;
  uniform vec3 uAccent;
  uniform vec3 uAmber;
  uniform vec3 uRed;
  varying vec2 vUv;
  ${DRIFT_FN}
  void main() {
    vec2 g = abs(fract(vUv * uCells - 0.5) - 0.5) / fwidth(vUv * uCells);
    float grid = 1.0 - min(min(g.x, g.y), 1.0);
    vec2 b = min(vUv, 1.0 - vUv);
    float border = 1.0 - smoothstep(0.0, 0.006, min(b.x, b.y));
    // soft radial falloff so the sheet reads as a depth plane, not a slab
    float r = length((vUv - 0.5) * vec2(1.0, 1.4));
    float sheet = 0.032 * (1.0 - smoothstep(0.25, 0.75, r));
    float focus = 0.55 + 0.9 * uFocus;
    vec3 col = uAccent * (sheet * focus + grid * 0.075 * focus + border * 0.42 * focus);
    col = driftTint(col, uDrift, uDriftRed, uTime, 0.10 + grid * 0.25 + border * 0.8);
    gl_FragColor = vec4(col * uAlpha, 1.0);
    #include <colorspace_fragment>
  }
`;

export const CORE_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/** Glowing node core: fresnel shell that brightens on hover/select and pulses under drift. */
export const CORE_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uAlpha;
  uniform float uHover;
  uniform float uSelect;
  uniform float uDrift;
  uniform float uDriftRed;
  uniform float uPhase;
  uniform vec3 uAccent;
  uniform vec3 uAmber;
  uniform vec3 uRed;
  varying vec3 vN;
  varying vec3 vV;
  ${DRIFT_FN}
  void main() {
    float fres = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 1.6);
    float breathe = 0.85 + 0.15 * sin(uTime * 2.1 + uPhase * 6.2832);
    float gain = (1.0 + 0.6 * uHover + 0.9 * uSelect) * breathe;
    vec3 col = uAccent * (0.32 + fres * 1.25) * gain;
    col = driftTint(col, uDrift, uDriftRed, uTime, 0.5 + fres * 1.8);
    gl_FragColor = vec4(col * uAlpha, 1.0);
    #include <colorspace_fragment>
  }
`;

export const RING_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Footprint ring on the plane beneath each node; expands and brightens when selected. */
export const RING_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uAlpha;
  uniform float uHover;
  uniform float uSelect;
  uniform float uDrift;
  uniform float uDriftRed;
  uniform vec3 uAccent;
  uniform vec3 uAmber;
  uniform vec3 uRed;
  varying vec2 vUv;
  ${DRIFT_FN}
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float ring = smoothstep(0.86, 0.94, d) * smoothstep(1.0, 0.96, d);
    float disc = (1.0 - smoothstep(0.0, 0.9, d)) * 0.08;
    float sweep = 0.5 + 0.5 * sin(uTime * 3.0 - d * 9.0);
    float gain = 0.35 + 0.35 * uHover + 0.9 * uSelect * (0.7 + 0.3 * sweep);
    vec3 col = uAccent * (ring * gain + disc * (0.4 + uSelect));
    col = driftTint(col, uDrift, uDriftRed, uTime, ring * 1.4 + disc * 2.0);
    gl_FragColor = vec4(col * uAlpha, 1.0);
    #include <colorspace_fragment>
  }
`;
