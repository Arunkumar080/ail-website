import { formatUptime, useTelemetry } from '../hooks/useTelemetry.ts';
import { AudioToggle } from './AudioToggle.tsx';
import { ViewToggle } from './ViewToggle.tsx';
import { useMode } from '../state/perimeter.ts';

export function Telemetry() {
  const t = useTelemetry();
  const mode = useMode();
  const degraded = t.nodesOnline < t.nodesTotal;
  return (
    <aside className="telemetry" aria-label="live telemetry">
      {mode === 'gateway' && <ViewToggle />}
      <div className="telemetry__head">
        <span className="telemetry__pip" aria-hidden="true" />
        <span>live telemetry</span>
        <AudioToggle />
      </div>
      <dl className="telemetry__rows">
        <div className="telemetry__row">
          <dt>active shadow deployments</dt>
          <dd>{t.deployments}</dd>
        </div>
        <div className="telemetry__row">
          <dt>zero-allocation batch latency</dt>
          <dd>{t.latencyMs.toFixed(2)}ms</dd>
        </div>
        <div className="telemetry__row">
          <dt>fabric coherence</dt>
          <dd>{t.coherence.toFixed(2)}%</dd>
        </div>
        <div className="telemetry__row" data-degraded={degraded || undefined}>
          <dt>perimeter nodes</dt>
          <dd>
            {String(t.nodesOnline).padStart(2, '0')}/{String(t.nodesTotal).padStart(2, '0')}
          </dd>
        </div>
        <div className="telemetry__row">
          <dt>node uptime</dt>
          <dd>{formatUptime(t.uptimeSec)}</dd>
        </div>
      </dl>
    </aside>
  );
}
