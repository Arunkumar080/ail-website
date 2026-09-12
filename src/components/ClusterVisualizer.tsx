import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CLUSTER_NODES, registerCell } from '../phantom/cluster.ts';
import { PHASE_LABEL, executePhantomDrop } from '../phantom/drop.ts';
import { usePerimeter } from '../state/perimeter.ts';

const SLOTS = ['09:00', '11:00', '14:00', '16:00'];
const TOAST_MS = 2200;

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Minimal inline scheduler: a date, a utc slot, one lock-in. */
function SessionScheduler() {
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [locked, setLocked] = useState<string | null>(null);

  if (locked) {
    return (
      <p className="scheduler__locked" role="status">
        {locked}
      </p>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!date || !slot) return;
    setLocked(`> session locked · ${date} ${slot} utc · ail engineer assigned`);
  };

  return (
    <form className="scheduler" onSubmit={onSubmit} aria-label="session scheduler">
      <div className="scheduler__row">
        <label htmlFor="drop-date">Deployment Date</label>
        <input id="drop-date" type="date" min={tomorrowISO()} value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="scheduler__row">
        <span id="slot-label">Session Slot (UTC)</span>
        <div className="scheduler__slots" role="group" aria-labelledby="slot-label">
          {SLOTS.map((s) => (
            <button key={s} type="button" className="pill" data-active={slot === s || undefined} onClick={() => setSlot(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" className="pill pill--primary" disabled={!date || !slot}>
        Lock In Session
      </button>
    </form>
  );
}

/** Sandbox Cluster Visualizer (right half). */
export function ClusterVisualizer() {
  const phase = usePerimeter((s) => s.dropPhase);
  const macBind = usePerimeter((s) => s.macBind);
  const token = usePerimeter((s) => s.token);
  const [toast, setToast] = useState<string | null>(null);
  const [scheduler, setScheduler] = useState(false);
  const macEl = useRef<HTMLSpanElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // Phase 1: reveal the hardware hash progressively across the compile window (DOM writes only).
  useEffect(() => {
    const el = macEl.current;
    if (!el || !macBind) return;
    if (phase !== 1) {
      el.textContent = macBind;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 760);
      const n = 2 + Math.floor((macBind.length - 2) * k);
      el.textContent = macBind.slice(0, n) + (k < 1 ? '…' : '');
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, macBind]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };

  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      showToast('> token copied');
    } catch {
      showToast('> clipboard unavailable');
    }
  };

  const metrics =
    phase >= 4
      ? ['Avg Latency: 0.04ms', 'GC Pause Rate: 0.00%', 'Data Exfiltration: 0 Bytes']
      : ['Avg Latency: 340ms', 'GC Pause Rate: 14%'];

  return (
    <section className="panel cluster" aria-label="sandbox cluster visualizer" data-phase={phase}>
      <div className="cluster__metrics tok" role="status" aria-live="polite">
        <span>
          Status: <b>{PHASE_LABEL[phase]}</b>
        </span>
        {metrics.map((m) => (
          <span key={m}>
            <span className="cluster__sep" aria-hidden="true">
              |
            </span>
            {m}
          </span>
        ))}
      </div>

      <div className="cluster__grid" aria-label="cluster topology">
        {CLUSTER_NODES.map((n, i) => (
          <div key={n.id} ref={registerCell(i)} className="cell" data-index={i}>
            <span className="cell__label tok">
              {n.id} [{n.role}]
            </span>
            {i === 0 && macBind && (
              <span className="cell__mac tok">
                MAC Bind: <span ref={macEl} />
              </span>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="drop-btn" onClick={executePhantomDrop} disabled={phase !== 0}>
        Execute Phantom Drop
      </button>

      {token && (
        <div className="token-card" aria-label="deployment token">
          <div className="token-card__title tok">PERIMETER DEPLOYMENT TOKEN // SINGLE-USE</div>
          <code className="token-card__payload tok">{token}</code>
          <div className="token-card__actions">
            <button type="button" className="pill" onClick={copy}>
              Copy Deployment Payload
            </button>
            <button type="button" className="pill" onClick={() => setScheduler((v) => !v)} aria-expanded={scheduler}>
              Schedule On Premise Drop
            </button>
            {toast && (
              <span className="toast" role="status">
                {toast}
              </span>
            )}
          </div>
          {scheduler && <SessionScheduler />}
        </div>
      )}
    </section>
  );
}
