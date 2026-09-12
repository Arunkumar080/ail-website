import * as THREE from 'three';

/**
 * A torus-knot family curve. Every strand of the fabric is one of these:
 * closed, smooth, and rotationally symmetric by construction.
 */
export class KnotCurve extends THREE.Curve<THREE.Vector3> {
  p: number;
  q: number;
  major: number;
  minor: number;
  zAmp: number;

  constructor(p: number, q: number, major: number, minor: number, zAmp: number) {
    super();
    this.p = p;
    this.q = q;
    this.major = major;
    this.minor = minor;
    this.zAmp = zAmp;
  }

  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const phi = t * Math.PI * 2;
    const rad = this.major + this.minor * Math.cos(this.q * phi);
    return target.set(
      rad * Math.cos(this.p * phi),
      rad * Math.sin(this.p * phi),
      this.minor * Math.sin(this.q * phi) * this.zAmp,
    );
  }
}

export interface StrandSpec {
  p: number;
  q: number;
  major: number;
  minor: number;
  zAmp: number;
  /** tube radius */
  radius: number;
  rotation: [number, number, number];
  /** 0..1 pulse phase offset so strands never fire in unison */
  phase: number;
  /** number of synapse nodes to seed along the strand (0 = none) */
  nodes: number;
  nodeSize: number;
}

const H = Math.PI / 2;
const Q = Math.PI / 4;

/**
 * The fabric: two orthogonal trefoils form the core weave, a (3,4) knot
 * threads between them, a tight (2,5) knot sits inside, and two rippled
 * halo rings close the envelope. All mirrored / rotated in 90° steps so the
 * silhouette stays symmetric from any angle.
 */
export const STRANDS: StrandSpec[] = [
  { p: 2, q: 3, major: 1.0, minor: 0.42, zAmp: 1.0, radius: 0.017, rotation: [0, 0, 0], phase: 0.0, nodes: 18, nodeSize: 9 },
  { p: 2, q: 3, major: 1.0, minor: 0.42, zAmp: 1.0, radius: 0.017, rotation: [H, 0, 0], phase: 0.37, nodes: 18, nodeSize: 9 },
  { p: 3, q: 4, major: 1.14, minor: 0.27, zAmp: 1.5, radius: 0.011, rotation: [0, H, 0], phase: 0.66, nodes: 24, nodeSize: 6 },
  { p: 2, q: 5, major: 0.74, minor: 0.46, zAmp: 0.85, radius: 0.012, rotation: [Q, Q, 0], phase: 0.19, nodes: 20, nodeSize: 6 },
  { p: 1, q: 8, major: 1.42, minor: 0.08, zAmp: 2.4, radius: 0.008, rotation: [H, 0, 0], phase: 0.52, nodes: 16, nodeSize: 5 },
  { p: 1, q: 8, major: 1.42, minor: 0.08, zAmp: 2.4, radius: 0.008, rotation: [0, 0, 0], phase: 0.84, nodes: 16, nodeSize: 5 },
];
