import { FabricScene } from '../fabric/FabricScene.tsx';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts.ts';
import { useListening, useMode } from '../state/perimeter.ts';
import { ClusterVisualizer } from './ClusterVisualizer.tsx';
import { ControllerBar } from './ControllerBar.tsx';
import { Gateway } from './Gateway.tsx';
import { IntentTerminal } from './IntentTerminal.tsx';
import { LedgerLabels } from './LedgerLabels.tsx';
import { ModeNav } from './ModeNav.tsx';
import { NodeInspector } from './NodeInspector.tsx';
import { Telemetry } from './Telemetry.tsx';
import { ValueDelta } from './ValueDelta.tsx';
import { VividConsole } from './VividConsole.tsx';

/**
 * The entry canvas. A locked, fullscreen grid.
 *
 * perimeter / routing:     simulator:              ledger:                 phantom:
 *   nav   ·  telemetry       nav   ·  telemetry      nav    ·   telemetry    nav   ·  telemetry
 *    ·   hook    ·            ·  delta  delta         ·(3d)   inspector     console  cluster
 *    ·  terminal ·           bar   bar   bar
 *
 * Side columns are equal `1fr` tracks so the centre column is mathematically
 * centred at every width; rows 1 and 3 are equal so the hook sits at the exact
 * vertical midpoint, dead centre on the fabric.
 */
export function PerimeterNode() {
  useGlobalShortcuts();
  const listening = useListening();
  const mode = useMode();
  const simulator = mode === 'simulator';
  const ledger = mode === 'ledger';
  const phantom = mode === 'phantom';
  const gateway = mode === 'gateway';
  const entry = !simulator && !ledger && !phantom && !gateway;
  return (
    <main className="node" data-listening={listening} data-mode={mode}>
      <div className="node__fabric" aria-hidden="true">
        <FabricScene />
      </div>
      <div className="node__veil" aria-hidden="true" />
      {ledger && <LedgerLabels />}

      <div className="node__grid" data-mode={mode}>
        <header className="node__top">
          <ModeNav />
          <Telemetry />
        </header>

        {gateway && <Gateway />}
        {simulator && <ValueDelta />}
        {ledger && <NodeInspector />}
        {phantom && (
          <>
            <VividConsole />
            <ClusterVisualizer />
          </>
        )}
        {entry && <h1 className="hook">symbiotic infrastructure. zero capital risk.</h1>}

        {entry && (
          <div className="node__bottom">
            <IntentTerminal />
          </div>
        )}
        {simulator && (
          <div className="node__bottom">
            <ControllerBar />
          </div>
        )}
      </div>
    </main>
  );
}
