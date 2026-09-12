import { useEffect, useRef } from 'react';
import { perimeter, usePerimeter } from '../state/perimeter.ts';
import {
  ComputeOverheadModel,
  FABRIC_LATENCY_MS,
  LEGACY_MAX_MS,
  LegacyLatencyModel,
  SAMPLE_HZ,
  WINDOW,
  usd,
  valueDelta,
} from '../sim/model.ts';

interface SeriesStyle {
  max: number;
  grid: number[];
  gridLabel: (v: number) => string;
  line: string;
  glow: string;
  fill: string;
  hair: string;
  ink: string;
}

const LEGACY_STYLE: SeriesStyle = {
  max: LEGACY_MAX_MS,
  grid: [0, 150, 300, 450],
  gridLabel: (v) => `${v}`,
  line: '#d07c50',
  glow: 'rgba(200, 118, 75, 0.35)',
  fill: 'rgba(200, 118, 75, 0.10)',
  hair: 'rgba(230, 237, 240, 0.07)',
  ink: '#5a6367',
};

const FABRIC_STYLE: SeriesStyle = {
  max: 0.1,
  grid: [0, 0.04, 0.08],
  gridLabel: (v) => v.toFixed(2),
  line: '#eafcff',
  glow: 'rgba(95, 242, 255, 0.55)',
  fill: 'rgba(95, 242, 255, 0.07)',
  hair: 'rgba(230, 237, 240, 0.07)',
  ink: '#5a6367',
};

const FONT = '"Inter Variable", Inter, system-ui, sans-serif';

function fitCanvas(cv: HTMLCanvasElement): boolean {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(cv.clientWidth * dpr);
  const h = Math.round(cv.clientHeight * dpr);
  if (w === 0 || h === 0) return false;
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
  return true;
}

function drawSeries(cv: HTMLCanvasElement, samples: Float32Array, head: number, st: SeriesStyle) {
  if (!fitCanvas(cv)) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const dpr = cv.width / cv.clientWidth;
  const w = cv.width;
  const h = cv.height;
  const padT = 6 * dpr;
  const padB = 4 * dpr;
  const padR = 30 * dpr;
  const gw = w - padR;
  const gh = h - padT - padB;
  const yOf = (v: number) => padT + gh * (1 - Math.min(v, st.max) / st.max);

  ctx.clearRect(0, 0, w, h);

  // grid + labels
  ctx.lineWidth = 1;
  ctx.strokeStyle = st.hair;
  ctx.fillStyle = st.ink;
  ctx.font = `${9.5 * dpr}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const g of st.grid) {
    const y = Math.round(yOf(g)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(gw, y);
    ctx.stroke();
    ctx.fillText(st.gridLabel(g), gw + 6 * dpr, y);
  }

  // path
  const path = new Path2D();
  for (let i = 0; i < WINDOW; i++) {
    const v = samples[(head + i) % WINDOW];
    const x = (gw * i) / (WINDOW - 1);
    const y = yOf(v);
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }

  const area = new Path2D(path);
  area.lineTo(gw, padT + gh);
  area.lineTo(0, padT + gh);
  area.closePath();
  ctx.fillStyle = st.fill;
  ctx.fill(area);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = st.glow;
  ctx.lineWidth = 3.5 * dpr;
  ctx.stroke(path);
  ctx.strokeStyle = st.line;
  ctx.lineWidth = 1.1 * dpr;
  ctx.stroke(path);
}

/** Column B latency is a constant; keep one flat buffer for the shared drawing routine. */
const FLAT = new Float32Array(WINDOW).fill(FABRIC_LATENCY_MS);

function Financials() {
  const opex = usePerimeter((s) => s.opexBaseline);
  const d = valueDelta(opex);
  return (
    <>
      <div className="delta__fin delta__fin--legacy">
        <div className="delta__fin-row">
          <span>Monthly Cloud Opex</span>
          <span className="delta__num">{usd(d.baseline)}/mo</span>
        </div>
      </div>
      <div className="delta__fin delta__fin--fabric">
        <div className="delta__fin-row">
          <span>Engineered Opex Savings</span>
          <span className="delta__num">{usd(d.savings)}/mo</span>
        </div>
        <div className="delta__fin-row">
          <span>AIL Efficiency Royalty</span>
          <span className="delta__num">{usd(d.royalty)}/mo</span>
        </div>
        <div className="delta__net">
          <span>Net Retained Capital:</span>
          <strong>{usd(d.netRetained)}/mo</strong>
        </div>
      </div>
    </>
  );
}

export function ValueDelta() {
  const legacyCanvas = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<HTMLCanvasElement>(null);
  const p99 = useRef<HTMLSpanElement>(null);
  const mean = useRef<HTMLSpanElement>(null);
  const meterFill = useRef<HTMLDivElement>(null);
  const vram = useRef<HTMLSpanElement>(null);
  const cpu = useRef<HTMLSpanElement>(null);

  // One rAF loop owns every live surface in both columns. It reads the store
  // directly and writes to the DOM directly: React is never in this path.
  useEffect(() => {
    const latency = new LegacyLatencyModel();
    const overhead = new ComputeOverheadModel();
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    let stress = perimeter.stress();
    const stepMs = 1000 / SAMPLE_HZ;

    const frame = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      acc += dt;
      stress += (perimeter.stress() - stress) * Math.min(1, dt / 400);
      const t = now / 1000;

      while (acc >= stepMs) {
        acc -= stepMs;
        latency.step(stress);
        overhead.step(stress, t);
        if (p99.current) p99.current.textContent = `${Math.round(latency.p99())}ms`;
        if (mean.current) mean.current.textContent = `mean ${Math.round(latency.mean())}ms`;
        if (vram.current) vram.current.textContent = `${overhead.vramGb().toFixed(1)} gb vram`;
        if (cpu.current) cpu.current.textContent = `${Math.round(overhead.cpuPct())}% cpu`;
      }
      if (meterFill.current) meterFill.current.style.transform = `scaleX(${overhead.value.toFixed(4)})`;
      if (legacyCanvas.current) drawSeries(legacyCanvas.current, latency.samples, latency.head, LEGACY_STYLE);
      if (fabricCanvas.current) drawSeries(fabricCanvas.current, FLAT, 0, FABRIC_STYLE);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="delta" aria-label="value-delta simulator">
      <div className="delta__col delta__col--legacy">
        <header className="delta__head">
          <span className="delta__pip" aria-hidden="true" />
          <h2>Legacy Infrastructure // Standard Cloud</h2>
        </header>

        <div className="delta__graph">
          <div className="delta__meta">
            <span>P99 Latency</span>
            <span ref={p99} className="delta__readout">
              —
            </span>
          </div>
          <div className="delta__plot">
            <canvas ref={legacyCanvas} aria-label="legacy latency, milliseconds" />
          </div>
          <div className="delta__meta delta__meta--foot">
            <span>GC Pauses · Parallel Load · ms</span>
            <span ref={mean}>mean —</span>
          </div>
        </div>

        <div className="delta__meter">
          <div className="delta__meta">
            <span>Compute Overhead</span>
            <span ref={vram} className="delta__readout">
              —
            </span>
          </div>
          <div className="delta__bar">
            <div ref={meterFill} className="delta__bar-fill" />
          </div>
          <div className="delta__meta delta__meta--foot">
            <span>vram / cpu allocation</span>
            <span ref={cpu}>—</span>
          </div>
        </div>
      </div>

      <div className="delta__col delta__col--fabric">
        <header className="delta__head">
          <span className="delta__pip" aria-hidden="true" />
          <h2>Aetherius Fabric // Zero Allocation</h2>
        </header>

        <div className="delta__graph">
          <div className="delta__meta">
            <span>Execution Latency</span>
            <span className="delta__readout">{FABRIC_LATENCY_MS.toFixed(2)}ms</span>
          </div>
          <div className="delta__plot">
            <canvas ref={fabricCanvas} aria-label="aetherius execution latency, milliseconds" />
          </div>
          <div className="delta__meta delta__meta--foot">
            <span>absolute cache-line alignment · ms</span>
            <span>flatline</span>
          </div>
        </div>

        <div className="delta__meter">
          <div className="delta__meta">
            <span>Memory Allocation</span>
            <span className="delta__readout">0 b</span>
          </div>
          <div className="delta__bar">
            <div className="delta__bar-pin" />
          </div>
          <div className="delta__meta delta__meta--foot">
            <span>dynamic gc allocation</span>
            <span>pinned at zero</span>
          </div>
        </div>
      </div>

      <Financials />
    </section>
  );
}
