import { useEffect, useState } from 'react';

export interface Telemetry {
  deployments: number;
  latencyMs: number;
  coherence: number;
  nodesOnline: number;
  nodesTotal: number;
  uptimeSec: number;
}

const INITIAL: Telemetry = {
  deployments: 14,
  latencyMs: 0.04,
  coherence: 99.97,
  nodesOnline: 7,
  nodesTotal: 7,
  uptimeSec: 0,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Cheap approximately-normal jitter in [-1, 1]. */
const jitter = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

function step(prev: Telemetry, elapsedSec: number): Telemetry {
  const r = Math.random();
  const deployments =
    r < 0.09 ? prev.deployments + 1 : r < 0.18 ? prev.deployments - 1 : prev.deployments;
  // Latency is mean-reverting around 0.04ms with rare spikes.
  const spike = Math.random() < 0.03 ? 0.02 : 0;
  const latencyMs = 0.04 + (prev.latencyMs - 0.04) * 0.55 + jitter() * 0.006 + spike;
  const coherence = 99.97 + (prev.coherence - 99.97) * 0.6 + jitter() * 0.012;
  // A node occasionally drops for one tick and resyncs.
  const nodesOnline =
    prev.nodesOnline < prev.nodesTotal ? prev.nodesTotal : Math.random() < 0.02 ? prev.nodesTotal - 1 : prev.nodesTotal;
  return {
    deployments: clamp(deployments, 9, 23),
    latencyMs: clamp(latencyMs, 0.028, 0.079),
    coherence: clamp(coherence, 99.9, 99.99),
    nodesOnline,
    nodesTotal: prev.nodesTotal,
    uptimeSec: Math.floor(elapsedSec),
  };
}

/** Simulated global telemetry: random-walked every ~800ms. */
export function useTelemetry(): Telemetry {
  const [data, setData] = useState(INITIAL);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      setData((prev) => step(prev, (performance.now() - start) / 1000));
    }, 800);
    return () => clearInterval(id);
  }, []);
  return data;
}

export function formatUptime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
