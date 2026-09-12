import { motionValue } from 'framer-motion';
import * as THREE from 'three';
import { ARSENAL } from '../brand/arsenal.ts';
import type { ArsenalId } from '../state/perimeter.ts';

/** The five primitives, in orbit order (shared with the public site via src/brand/arsenal.ts). */
export { ARSENAL };
export type { ArsenalNode } from '../brand/arsenal.ts';

export const ORBIT_RADIUS = 1.75;
export const ORBIT_TILT = 0.42;
export const ORBIT_SPEED = 0.16;

/** World position of each node, written every frame by <Arsenal/>, read by the camera rig. */
export const arsenalWorld = new Map<ArsenalId, THREE.Vector3>(ARSENAL.map((n) => [n.id, new THREE.Vector3()]));
/** Screen position of each node (dev hook / harness). */
export const arsenalScreen = new Map<ArsenalId, { x: number; y: number }>();

/** Whole-gateway fade: 1 in gateway mode, 0 elsewhere. */
export const gatewayAlpha = { value: 0 };
/** Monolith shatter progress, 0 → 1 over the launch; shared so the scene can read it. */
export const shatter = { value: 0 };
/**
 * Monolith brightness, animated by framer-motion (1 technical → 0.2 executive
 * briefing). The R3F loop only reads it, so the tween is uncoupled from rendering.
 */
export const monolithDim = motionValue(1);
