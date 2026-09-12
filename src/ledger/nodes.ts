import * as THREE from 'three';
import type { NodeId } from '../state/perimeter.ts';

/** EidosEye depth hierarchy, top plane first. */
export const LAYERS = [
  'BLOCK_DIAGRAM',
  'DEPLOYMENT_ARCH',
  'APPLICATION_ARCH',
  'HLD',
  'MODULE_ARCH',
  'API_ARCH',
  'DATABASE_DESIGN',
] as const;
export type Layer = (typeof LAYERS)[number];

export const PLANE_W = 2.6;
export const PLANE_D = 1.8;
export const PLANE_GAP = 0.46;
/** world-space y of plane i (0 = top) */
export const planeY = (i: number) => ((LAYERS.length - 1) / 2 - i) * PLANE_GAP;

/** The ladder lives far from the fabric; the camera flies between them. */
export const LADDER_ORIGIN = new THREE.Vector3(16, 0, 0);
export const LADDER_YAW = -0.38;

export const LEDGER_ROOT_ULID = '01J7Q0AETH3R00TN0DE000X4R2';

export interface LedgerNode {
  id: NodeId;
  name: string;
  ulid: string;
  layer: number;
  parentId: string;
  parentName: string;
  tagline: string;
  role: string;
  constraints: string[];
  techStack: string[];
  astHash: string;
  why: string[];
  /** local x/z on its plane */
  x: number;
  z: number;
}

export const NODES: Record<NodeId, LedgerNode> = {
  vivid: {
    id: 'vivid',
    name: 'aetherius vivid',
    ulid: '01J7Q1V1V1DSH4D0W1FC3A9K2M',
    layer: 1,
    parentId: LEDGER_ROOT_ULID,
    parentName: 'ledger_root',
    tagline: 'autonomous architect & shadow interface',
    role: 'listens for deployment intent, plans the shadow deployment, and operates the perimeter autonomously.',
    constraints: ['shadow_first_deploys', 'zero_capital_risk', 'ast_hash_binding', 'human_veto_window'],
    techStack: ['autonomous planner', 'shadow traffic mirror', 'perimeter node runtime', 'signed rollout ledger'],
    astHash: '7f3a9c1e5b2d8046e9a1c3f5b7d9e2a4',
    why: [
      'decision 0001 · every deployment runs in shadow first; production is a promotion, never a launch.',
      'decision 0002 · capital risk is zero because nothing is provisioned until the shadow delta is proven.',
      'decision 0003 · vivid is the only node permitted to write to the deployment layer.',
    ],
    x: -0.65,
    z: 0.3,
  },
  proteus: {
    id: 'proteus',
    name: 'proteus',
    ulid: '01J7Q2PR0TE5SBR41N7C4NV5X8',
    layer: 2,
    parentId: '01J7Q1V1V1DSH4D0W1FC3A9K2M',
    parentName: 'aetherius vivid',
    tagline: 'the intent canvas & organizational brain',
    role: 'captures deployment intent as a typed intent graph and resolves it against organizational state before any pipeline runs.',
    constraints: ['intent_graph_typed', 'no_untracked_state', 'ast_hash_binding', '<50ms_intent_resolution'],
    techStack: ['rust intent kernel', 'mmap-backed org graph', 'simd graph traversal', 'wasm edge adapters'],
    astHash: 'a1c3e5f7092b4d6e8f0a1b2c3d4e5f60',
    why: [
      'decision 0001 · intent is a first-class artifact: every downstream node derives from a hashed intent, not from prose.',
      "decision 0002 · organizational state lives in one mmap'd graph so resolution is a pointer walk, not a query.",
      'decision 0003 · bound to eidoseye ast hashes so a drifted intent cannot deploy.',
    ],
    x: 0.55,
    z: -0.35,
  },
  eidoseye: {
    id: 'eidoseye',
    name: 'eidoseye',
    ulid: '01J7Q3E1D0SEYEGR4PHDR1FT6Z',
    layer: 3,
    parentId: '01J7Q2PR0TE5SBR41N7C4NV5X8',
    parentName: 'proteus',
    tagline: 'living architecture graph & ast drift detector',
    role: 'maintains the 7-dimensional architecture graph and continuously binds every node to the ast hash of its implementation.',
    constraints: ['ast_hash_binding', 'append_only_ledger', 'drift_ttl≤2.5s', '7_dimension_invariant'],
    techStack: ['merkle-bound ast graph', 'incremental tree-sitter parse', 'lock-free drift monitor', 'zero-copy diff engine'],
    astHash: 'e0d1c2b3a4958677f6e5d4c3b2a19080',
    why: [
      'decision 0001 · architecture is stored as a graph bound to code hashes, so documentation cannot diverge from the build.',
      'decision 0002 · drift is a runtime event with a hard ttl; recovery is autonomous, never a ticket.',
      'decision 0003 · seven fixed dimensions keep every node in exactly one legal layer.',
    ],
    x: -0.2,
    z: 0.55,
  },
  visioncraft: {
    id: 'visioncraft',
    name: 'visioncraft',
    ulid: '01J7Q4V1S10NCR4FTP1PE7A2Y3',
    layer: 4,
    parentId: '01J7Q3E1D0SEYEGR4PHDR1FT6Z',
    parentName: 'eidoseye',
    tagline: 'multi-agent prd-to-code pipeline',
    role: 'turns a resolved intent into module-level code through a bounded multi-agent pipeline whose every emit is ast-verified.',
    constraints: ['bounded_agent_fanout≤8', 'ast_hash_binding', 'no_unverified_emit', 'deterministic_replay'],
    techStack: ['agent scheduler (rust, io_uring)', 'frontier planner tier', 'ast-diff verifier', 'replay journal (append-only)'],
    astHash: '4b6d8f0a2c4e6081a3c5e7f9b1d3f5a7',
    why: [
      'decision 0001 · agents fan out per module, never per file, so ownership maps 1:1 to the module arch layer.',
      'decision 0002 · every emit is diffed against the bound ast hash; a mismatch halts the pipeline before merge.',
      'decision 0003 · the replay journal makes any generated module reproducible from its intent ulid.',
    ],
    x: 0.7,
    z: 0.15,
  },
  aetheriusdb: {
    id: 'aetheriusdb',
    name: 'aetheriusdb',
    ulid: '01J7Q5AETHDBZ3R04KK0C8T1V9',
    layer: 6,
    parentId: '01J7Q4V1S10NCR4FTP1PE7A2Y3',
    parentName: 'visioncraft',
    tagline: 'hardware-native zero-allocation data engine',
    role: 'executes partition inserts and reads with zero dynamic allocation and cache-line aligned batches at 0.04ms.',
    constraints: ['zero_gc_allocation', '<0.05ms_latency', 'cache_line_aligned_batches', 'ast_hash_binding'],
    techStack: ['rust, no_std core', '64b aligned arena allocator', 'io_uring + numa pinning', 'simd batch codec'],
    astHash: '0c8e6a4b2d1f3e5c7a9b8d6f4e2c0a19',
    why: [
      'decision 0001 · no allocator on the hot path: memory is arena-reserved at boot, so latency is bounded by the cache, not the gc.',
      'decision 0002 · batches are 64-byte aligned so a partition insert is a single cache-line stream.',
      'decision 0003 · 0.04ms is a contract enforced by the perimeter, not a benchmark.',
    ],
    x: -0.5,
    z: -0.3,
  },
};

/** Render/graph order: the parent chain from the deployment layer down to the database. */
export const NODE_ORDER: NodeId[] = ['vivid', 'proteus', 'eidoseye', 'visioncraft', 'aetheriusdb'];

/** Deterministic "illegal modification": every nibble shifted, so the hash visibly mismatches. */
export function driftHash(hash: string): string {
  return hash
    .split('')
    .map((c) => ((parseInt(c, 16) + 7) % 16).toString(16))
    .join('');
}

export const RECOVERY_LINE = '> ast mismatch resolved. perimeter integrity restored.';
