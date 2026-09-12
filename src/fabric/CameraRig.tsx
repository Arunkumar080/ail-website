import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { arsenalWorld } from '../gateway/arsenal.ts';
import { LADDER_ORIGIN, planeY } from '../ledger/nodes.ts';
import { perimeter } from '../state/perimeter.ts';

interface Pose {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  roll: number;
}

const FOV = 38;
const IDLE: Pose = { pos: new THREE.Vector3(0, 0, 6.2), look: new THREE.Vector3(0, 0, 0), fov: FOV, roll: 0 };
// Listening: dolly in, swing off-axis, push the fabric up and away from the terminal.
const FOCUS: Pose = { pos: new THREE.Vector3(2.3, -0.35, 4.1), look: new THREE.Vector3(0.15, -0.95, 0), fov: 50, roll: -0.07 };
// Simulator: a pure lateral pan so the fabric sits in the left third of the viewport.
const SIM_DISTANCE = 8.1;
// Ledger: angled top-down (≈40° elevation) looking down through the plane stack.
const LADDER_VIEW = new THREE.Vector3(0, 7.2, 8.5);
// Gateway: front-on to the monolith; hovering an arsenal node snaps the view slightly toward it.
const GATEWAY: Pose = { pos: new THREE.Vector3(0, 0.15, 5.4), look: new THREE.Vector3(0, 0.1, 0), fov: FOV, roll: 0 };
// Phantom: inside the fabric, looking down the enclave trace paths.
const ENCLAVE: Pose = { pos: new THREE.Vector3(0, 0.06, 0.62), look: new THREE.Vector3(0.04, 0, -1), fov: 64, roll: 0 };

const { damp, degToRad } = THREE.MathUtils;
const HALF_TAN = Math.tan(degToRad(FOV / 2));

const REDUCED_MOTION =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

interface RigState {
  look: THREE.Vector3;
  goal: THREE.Vector3;
  /** scratch pose for the computed (aspect-dependent) simulator/ledger views */
  dyn: Pose;
  roll: number;
}

export function CameraRig() {
  const rig = useRef<RigState>({
    look: IDLE.look.clone(),
    goal: new THREE.Vector3(),
    dyn: { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: FOV, roll: 0 },
    roll: 0,
  });

  useFrame((state, dt) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const r = rig.current;
    const d = Math.min(dt, 1 / 30);
    const { listening, mode, focusedLayer, arsenalHover } = perimeter.get();
    const aspect = state.viewport.aspect;
    const portraitZoom = Math.max(1, 0.72 / aspect);

    let pose: Pose;
    let lambda: number;
    let parallax: number;

    if (mode === 'gateway') {
      r.dyn.look.copy(GATEWAY.look);
      r.dyn.pos.copy(GATEWAY.pos).multiplyScalar(portraitZoom);
      const hp = arsenalHover ? arsenalWorld.get(arsenalHover) : undefined;
      if (hp) {
        r.dyn.look.lerp(hp, 0.35);
        r.dyn.pos.addScaledVector(hp.clone().sub(r.dyn.pos).normalize(), 0.45);
      }
      r.dyn.fov = FOV;
      r.dyn.roll = 0;
      pose = r.dyn;
      lambda = arsenalHover ? 4.5 : 2.6;
      parallax = 0.22;
      r.goal.copy(pose.pos);
    } else if (mode === 'ledger') {
      // Frame the ladder in the left half: offset so its origin projects to NDC x = -0.5.
      // Plane navigation: drift the target toward the focused plane and dolly in slightly.
      const dist = LADDER_VIEW.length();
      const halfH = dist * HALF_TAN;
      const fy = focusedLayer === null ? 0 : planeY(focusedLayer) * 0.55;
      const dolly = focusedLayer === null ? 1 : 0.93;
      if (aspect >= 1) {
        // NDC x ≈ -0.38: centred in the left half with room for the plane labels.
        r.dyn.look.set(LADDER_ORIGIN.x + 0.38 * halfH * aspect, fy, 0);
      } else {
        r.dyn.look.set(LADDER_ORIGIN.x, fy - 0.42 * halfH, 0);
      }
      r.dyn.pos.copy(r.dyn.look).addScaledVector(LADDER_VIEW, dolly * portraitZoom);
      r.dyn.fov = FOV;
      r.dyn.roll = 0;
      pose = r.dyn;
      lambda = 2.6;
      parallax = 0.08;
      r.goal.copy(pose.pos);
    } else if (mode === 'phantom') {
      pose = ENCLAVE;
      lambda = 2.4;
      parallax = 0.03;
      r.goal.copy(pose.pos);
    } else if (mode === 'simulator') {
      // Offset the camera so the origin projects to NDC x = -2/3 (centre of
      // the left third). Portrait: park the fabric in the upper region instead.
      const halfH = SIM_DISTANCE * HALF_TAN;
      if (aspect >= 1) {
        const panX = (2 / 3) * halfH * aspect;
        r.dyn.pos.set(panX + 0.25, 0.1, SIM_DISTANCE);
        r.dyn.look.set(panX + 0.1, 0.05, 0);
      } else {
        const panY = 0.42 * halfH;
        r.dyn.pos.set(0, -panY, SIM_DISTANCE * portraitZoom);
        r.dyn.look.set(0, -panY, 0);
      }
      r.dyn.fov = FOV;
      r.dyn.roll = 0;
      pose = r.dyn;
      lambda = 3.2;
      parallax = 0.1;
      r.goal.copy(pose.pos);
    } else {
      pose = listening ? FOCUS : IDLE;
      // Aggressive in, gentle out.
      lambda = listening ? 7.5 : 2.8;
      parallax = listening ? 0.12 : 0.38;
      // Portrait viewports: pull back so the fabric never overflows the narrow axis.
      r.goal.copy(pose.pos).multiplyScalar(portraitZoom);
    }

    const px = REDUCED_MOTION ? 0 : perimeter.pointer.x;
    const py = REDUCED_MOTION ? 0 : perimeter.pointer.y;
    r.goal.x += px * parallax;
    r.goal.y += py * parallax * 0.6;

    camera.position.set(
      damp(camera.position.x, r.goal.x, lambda, d),
      damp(camera.position.y, r.goal.y, lambda, d),
      damp(camera.position.z, r.goal.z, lambda, d),
    );

    r.look.set(
      damp(r.look.x, pose.look.x, lambda, d),
      damp(r.look.y, pose.look.y, lambda, d),
      damp(r.look.z, pose.look.z, lambda, d),
    );

    r.roll = damp(r.roll, pose.roll, lambda, d);
    camera.up.set(Math.sin(r.roll), Math.cos(r.roll), 0);
    camera.lookAt(r.look);

    const fov = damp(camera.fov, pose.fov, lambda, d);
    if (Math.abs(fov - camera.fov) > 1e-4) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
