/** Value-delta formula, as specified. */
export const SAVINGS_RATE = 0.78;
export const ROYALTY_RATE = 0.2;

export interface ValueDelta {
  baseline: number;
  savings: number;
  royalty: number;
  netRetained: number;
}

export function valueDelta(baseline: number): ValueDelta {
  const savings = baseline * SAVINGS_RATE;
  const royalty = savings * ROYALTY_RATE;
  return { baseline, savings, royalty, netRetained: savings - royalty };
}

export const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
export const int = (n: number) => Math.round(n).toLocaleString('en-US');

export const SAMPLE_HZ = 20;
/** 8 seconds of history */
export const WINDOW = 160;
export const LEGACY_MAX_MS = 450;
export const FABRIC_LATENCY_MS = 0.04;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const gaussian = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/**
 * Legacy stack latency under parallel load: a stress-scaled baseline with
 * heavy variance, plus stop-the-world GC pauses that hold for a few samples
 * and reach 450ms at full ingestion load.
 */
export class LegacyLatencyModel {
  samples = new Float32Array(WINDOW).fill(18);
  head = 0;
  private pauseLeft = 0;
  private pauseLevel = 0;

  step(stress: number): number {
    const base = 16 + 80 * stress;
    const variance = base * (0.18 + 0.55 * stress);
    let v = base + gaussian() * variance;
    if (this.pauseLeft > 0) {
      v = this.pauseLevel * (0.86 + 0.14 * Math.random());
      this.pauseLeft--;
    } else if (Math.random() < 0.015 + 0.11 * stress) {
      this.pauseLevel = Math.min(LEGACY_MAX_MS, 80 + 370 * stress * (0.55 + 0.45 * Math.random()));
      this.pauseLeft = 1 + Math.floor(Math.random() * (1 + 3 * stress));
      v = this.pauseLevel;
    }
    v = clamp(v, 3, LEGACY_MAX_MS);
    this.samples[this.head] = v;
    this.head = (this.head + 1) % WINDOW;
    return v;
  }

  /** highest latency in the window */
  p99(): number {
    let m = 0;
    for (let i = 0; i < WINDOW; i++) m = Math.max(m, this.samples[i]);
    return m;
  }

  mean(): number {
    let s = 0;
    for (let i = 0; i < WINDOW; i++) s += this.samples[i];
    return s / WINDOW;
  }
}

/** Ballooning VRAM/CPU allocation: stress-scaled fill with churn and a slow fragmentation saw. */
export class ComputeOverheadModel {
  private churn = 0;
  value = 0.24;

  step(stress: number, t: number): number {
    this.churn += (Math.random() - 0.5 - this.churn) * 0.18;
    const saw = ((t % 7) / 7) * 0.09 * stress;
    this.value = clamp(0.22 + 0.66 * stress + 0.035 * Math.sin(t * 0.9) + this.churn * 0.06 + saw, 0.05, 1);
    return this.value;
  }

  vramGb(total = 80): number {
    return this.value * total;
  }

  cpuPct(): number {
    return 30 + 65 * this.value;
  }
}
