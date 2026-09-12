import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { labelRegistry } from './labels.ts';
import { selectNode } from './navigate.ts';
import {
  LADDER_ORIGIN,
  LADDER_YAW,
  LAYERS,
  NODE_ORDER,
  NODES,
  PLANE_D,
  PLANE_W,
  planeY,
  type LedgerNode,
} from './nodes.ts';
import { CORE_FRAG, CORE_VERT, PLANE_FRAG, PLANE_VERT, RING_FRAG, RING_VERT } from './shaders.ts';
import { palette, shared } from '../fabric/uniforms.ts';
import { perimeter, type NodeId } from '../state/perimeter.ts';

const { damp } = THREE.MathUtils;

/** Whole-ladder fade (0 outside the ledger). Shared by every ledger material. */
const ladderAlpha = { value: 0 };
const AMBER = new THREE.Color('#f0b35a');
const RED = new THREE.Color('#ff4b3a');
const PLANE_ACCENT = new THREE.Color('#5ff2ff');
const CORE_LIFT = 0.075;

type U = { value: number };
interface PlaneUniforms {
  uFocus: U;
  uDrift: U;
  uDriftRed: U;
}
interface NodeUniforms {
  uHover: U;
  uSelect: U;
  uDrift: U;
  uDriftRed: U;
}

interface LadderLive {
  planeU: PlaneUniforms[];
  nodeU: Record<NodeId, NodeUniforms>;
  tmp: THREE.Vector3;
}

/**
 * Per-plane and per-node uniform objects. The ladder is a scene singleton and
 * the frame loop mutates these every frame, so they live at module level:
 * React never owns them and never needs to know.
 */
function createLive(): LadderLive {
  return {
    planeU: LAYERS.map(() => ({ uFocus: { value: 0.35 }, uDrift: { value: 0 }, uDriftRed: { value: 0 } })),
    nodeU: Object.fromEntries(
      NODE_ORDER.map((id) => [
        id,
        { uHover: { value: 0 }, uSelect: { value: 0 }, uDrift: { value: 0 }, uDriftRed: { value: 0 } },
      ]),
    ) as Record<NodeId, NodeUniforms>,
    tmp: new THREE.Vector3(),
  };
}
const live = createLive();

function makeMaterial(vertexShader: string, fragmentShader: string, extra: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: shared.uTime,
      uAlpha: ladderAlpha,
      uAmber: { value: AMBER },
      uRed: { value: RED },
      ...extra,
    },
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
}

function useDispose(...items: { dispose(): void }[]) {
  useEffect(
    () => () => {
      for (const it of items) it.dispose();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    items,
  );
}

function Plane({ index, u }: { index: number; u: PlaneUniforms }) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(PLANE_W, PLANE_D), []);
  const material = useMemo(
    () =>
      makeMaterial(PLANE_VERT, PLANE_FRAG, {
        uFocus: u.uFocus,
        uDrift: u.uDrift,
        uDriftRed: u.uDriftRed,
        uCells: { value: new THREE.Vector2(16, 11) },
        uAccent: { value: PLANE_ACCENT },
      }),
    [u],
  );
  useDispose(geometry, material);
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, planeY(index), 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      frustumCulled={false}
    />
  );
}

const inLedger = () => perimeter.get().mode === 'ledger';

function Node({ node, u, phase }: { node: LedgerNode; u: NodeUniforms; phase: number }) {
  const core = useMemo(() => new THREE.SphereGeometry(CORE_LIFT, 32, 24), []);
  const ring = useMemo(() => new THREE.PlaneGeometry(0.56, 0.56), []);
  const hit = useMemo(() => new THREE.SphereGeometry(0.24, 12, 8), []);
  const coreMat = useMemo(
    () =>
      makeMaterial(CORE_VERT, CORE_FRAG, {
        uHover: u.uHover,
        uSelect: u.uSelect,
        uDrift: u.uDrift,
        uDriftRed: u.uDriftRed,
        uPhase: { value: phase },
        uAccent: { value: palette.accent },
      }),
    [u, phase],
  );
  const ringMat = useMemo(
    () =>
      makeMaterial(RING_VERT, RING_FRAG, {
        uHover: u.uHover,
        uSelect: u.uSelect,
        uDrift: u.uDrift,
        uDriftRed: u.uDriftRed,
        uAccent: { value: palette.accent },
      }),
    [u],
  );
  // Generous hit target: never rendered (visible=false), raycast only.
  const hitMat = useMemo(() => new THREE.MeshBasicMaterial(), []);
  useDispose(core, ring, hit, coreMat, ringMat, hitMat);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!inLedger()) return;
    e.stopPropagation();
    selectNode(node.id);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!inLedger()) return;
    e.stopPropagation();
    perimeter.hoverNode = node.id;
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    if (perimeter.hoverNode !== node.id) return;
    perimeter.hoverNode = null;
    document.body.style.cursor = '';
  };

  return (
    <group position={[node.x, planeY(node.layer), node.z]}>
      <mesh geometry={core} material={coreMat} position={[0, CORE_LIFT, 0]} frustumCulled={false} />
      <mesh geometry={ring} material={ringMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} frustumCulled={false} />
      <mesh
        geometry={hit}
        material={hitMat}
        position={[0, CORE_LIFT, 0]}
        visible={false}
        onClick={onClick}
        onPointerOver={onOver}
        onPointerOut={onOut}
      />
    </group>
  );
}

/** The parent chain, drawn as one additive polyline through the planes (scene singleton). */
const edgeMaterial = new THREE.LineBasicMaterial({
  color: palette.accent,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const edgeLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(
    NODE_ORDER.map((id) => {
      const n = NODES[id];
      return new THREE.Vector3(n.x, planeY(n.layer) + CORE_LIFT, n.z);
    }),
  ),
  edgeMaterial,
);

function Edges() {
  useFrame(() => {
    edgeMaterial.opacity = 0.3 * ladderAlpha.value;
  });
  return <primitive object={edgeLine} />;
}

export function Ladder() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(dt, 1 / 30);
    const { mode, selectedNode, focusedLayer, drift } = perimeter.get();
    const ledger = mode === 'ledger';
    ladderAlpha.value = damp(ladderAlpha.value, ledger ? 1 : 0, ledger ? 3.5 : 6, d);
    g.visible = ladderAlpha.value > 0.005;

    const driftOn = drift.phase !== 'synced';
    const red = drift.phase === 'quarantined' ? 1 : 0;
    const driftLayer = drift.nodeId ? NODES[drift.nodeId].layer : -1;

    const { planeU, nodeU, tmp } = live;
    for (let i = 0; i < planeU.length; i++) {
      const u = planeU[i];
      const focusT = focusedLayer === null ? 0.35 : focusedLayer === i ? 1 : 0.12;
      u.uFocus.value = damp(u.uFocus.value, focusT, 4, d);
      u.uDrift.value = damp(u.uDrift.value, driftOn && driftLayer === i ? 1 : 0, 10, d);
      u.uDriftRed.value = damp(u.uDriftRed.value, red, 12, d);
    }
    for (const id of NODE_ORDER) {
      const u = nodeU[id];
      u.uHover.value = damp(u.uHover.value, perimeter.hoverNode === id ? 1 : 0, 10, d);
      u.uSelect.value = damp(u.uSelect.value, selectedNode === id ? 1 : 0, 6, d);
      u.uDrift.value = damp(u.uDrift.value, driftOn && drift.nodeId === id ? 1 : 0, 10, d);
      u.uDriftRed.value = damp(u.uDriftRed.value, red, 12, d);
    }

    // Project label anchors to screen and write transforms straight to the DOM.
    if (labelRegistry.size === 0) return;
    state.camera.updateMatrixWorld();
    g.updateMatrixWorld();
    const { width, height } = state.size;
    const alpha = g.visible ? ladderAlpha.value.toFixed(3) : '0';
    for (const [key, el] of labelRegistry) {
      if (key.startsWith('plane:')) {
        const i = Number(key.slice(6));
        tmp.set(-PLANE_W / 2, planeY(i), PLANE_D / 2);
      } else {
        const n = NODES[key.slice(5) as NodeId];
        if (!n) continue;
        tmp.set(n.x, planeY(n.layer) + CORE_LIFT, n.z);
      }
      g.localToWorld(tmp).project(state.camera);
      const x = (tmp.x * 0.5 + 0.5) * width;
      const y = (1 - (tmp.y * 0.5 + 0.5)) * height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = tmp.z > 1 ? '0' : alpha;
      el.dataset.sx = x.toFixed(0);
      el.dataset.sy = y.toFixed(0);
    }
  });

  return (
    <group ref={group} position={LADDER_ORIGIN} rotation={[0, LADDER_YAW, 0]} visible={false}>
      {LAYERS.map((name, i) => (
        <Plane key={name} index={i} u={live.planeU[i]} />
      ))}
      <Edges />
      {NODE_ORDER.map((id, i) => (
        <Node key={id} node={NODES[id]} u={live.nodeU[id]} phase={i / NODE_ORDER.length} />
      ))}
    </group>
  );
}
