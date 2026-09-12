/**
 * Wireframe monolith. Every edge is pre-split into short segments; each
 * segment carries its centre, a fly-out direction, and a seed so the whole
 * mesh can shatter in the vertex shader (one draw call, no CPU work).
 */
export const MONOLITH_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uShatter;
  uniform float uAlpha;
  attribute vec3 aCenter;
  attribute vec3 aDir;
  attribute float aSeed;
  attribute float aTint;
  varying float vA;
  void main() {
    float s = uShatter;
    vec3 rel = position - aCenter;
    // tumble around the segment centre as it flies out
    float ang = s * (2.5 + aSeed * 7.0);
    float c = cos(ang), sn = sin(ang);
    rel = vec3(rel.x * c - rel.y * sn, rel.x * sn + rel.y * c, rel.z);
    vec3 p = aCenter + rel + aDir * s * s * (1.4 + aSeed * 3.0);
    float shimmer = 0.62 + 0.38 * sin(uTime * 1.1 + aSeed * 14.0 + position.y * 2.0);
    vA = uAlpha * aTint * shimmer * (1.0 - smoothstep(0.55, 1.0, s));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const MONOLITH_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uShatter;
  varying float vA;
  void main() {
    // edges flash toward electric white as they break
    vec3 col = mix(uColor, uHot, smoothstep(0.0, 0.35, uShatter));
    gl_FragColor = vec4(col * vA, 1.0);
    #include <colorspace_fragment>
  }
`;
