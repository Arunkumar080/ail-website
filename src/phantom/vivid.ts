/** VIVID's scripted responses. No network: every reply is authored and streamed locally. */
export interface Scenario {
  id: string;
  label: string;
  prompt: string;
  response: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'scenario_01',
    label: 'Scenario 01: 2m Insert Postgres Choke',
    prompt: 'scenario_01: 2m_insert_postgres_choke',
    response: `> scenario_01 accepted. 2,000,000-row partition insert against a postgres primary that is already gc-bound.

diagnosis: the choke is not postgres. it is the allocator between your ingest tier and the wal. every batch heap-allocates row buffers, the runtime gc pauses 40–450ms under parallel load, and wal fsync amplifies each stall into a p99 cliff.

shadow payload: compiled locally on node_01 from your intent ulid. no source leaves the perimeter. the ephemeral binary binds to the host cpu's enclave key (mac_bind) and mmaps a 64-byte aligned arena at boot.

transformation: inserts stream as cache-line batches through the arena with zero dynamic allocation, wal appended in aligned pages. postgres remains your system of record; aetheriusdb absorbs the ingest path in shadow until the delta is proven.

result: execution 340ms → 0.04ms. gc_pause_rate 14% → 0.00%. data_exfiltration: 0 bytes. the primary never leaves your rack.`,
  },
  {
    id: 'scenario_02',
    label: 'Scenario 02: Monolithic To Multitenant Refactor',
    prompt: 'scenario_02: monolithic_to_multitenant_refactor',
    response: `> scenario_02 accepted. monolith → multitenant without a rewrite window.

diagnosis: the risk is not the code, it is the cutover. a big-bang refactor forks state, and tenants drift between two truths.

shadow payload: eidoseye binds every module of the monolith to an ast hash and projects the 7-dimension graph. visioncraft fans out per module (≤8 agents); each emit is ast-verified against the bound hash before it exists on disk.

transformation: tenant isolation is injected at the module boundary as a typed context, not a schema fork. proteus resolves every tenant intent against one org graph. the shadow runs both shapes side by side on mirrored traffic until the delta clears.

execution: local compile, enclave-bound, replay-journaled. rollback is a pointer, not a migration.

result: zero-downtime cutover. zero capital risk: nothing is provisioned until the shadow delta is proven.`,
  },
  {
    id: 'scenario_03',
    label: 'Scenario 03: Zero Exfiltration Infosec Audit',
    prompt: 'scenario_03: zero_exfiltration_infosec_audit',
    response: `> scenario_03 accepted. infosec audit: prove zero exfiltration.

posture: the shadow agent has no egress. the ephemeral binary is compiled inside your perimeter from the intent ulid; the only inbound artifact is a signed 64-byte manifest.

binding: mac_bind pins the binary to the enclave key of the host cpu. it will not execute on any other silicon, and the key never leaves the tpm.

runtime: zero dynamic allocation means no heap to scrape and no swap to leak. every buffer lives in a pre-reserved arena that is wiped at exit.

evidence: eidoseye emits an append-only ledger of every ast hash it verifies. your auditors receive the ledger and the manifest. we receive nothing.

result: data_exfiltration: 0 bytes, by construction, not by policy.`,
  },
];

export function customResponse(question: string): string {
  const q = question.trim().replace(/\s+/g, ' ');
  return `> intent received: "${q}"

vivid does not answer from a knowledge base. it resolves intent against your perimeter, and every phantom drop has the same shape:

1. compile: the ephemeral binary is built locally on node_01 from the intent ulid. no source, no data, and no model weights cross the perimeter.
2. bind: mac_bind pins the binary to the enclave key of the host cpu. it cannot execute anywhere else.
3. execute: the zero-allocation fabric is injected into the hot path. buffers live in a 64-byte aligned arena; the gc never runs because nothing is allocated.
4. verify: eidoseye checks every touched module against its ast hash and appends the proof to the ledger.

run Execute Phantom Drop to watch it against the sandbox cluster, or pick a scenario above for the specific breakdown.`;
}
