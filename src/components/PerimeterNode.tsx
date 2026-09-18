import { useEffect, useRef } from 'react';
import { FabricScene } from '../fabric/FabricScene.tsx';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts.ts';
import { perimeter, useListening, useMode } from '../state/perimeter.ts';
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
  const topRef = useRef<HTMLElement>(null);
  const listening = useListening();
  const mode = useMode();
  const simulator = mode === 'simulator';
  const ledger = mode === 'ledger';
  const phantom = mode === 'phantom';
  const gateway = mode === 'gateway';
  const entry = !simulator && !ledger && !phantom && !gateway;

  // Publish the header's footprint for CameraRig. The panel is sized by its
  // tallest child (the telemetry column), so it is far taller than a title bar
  // and would otherwise sit on top of the scene. Written straight to the store
  // rather than React state: the rig reads it per frame and must not re-render.
  useEffect(() => {
    const top = topRef.current;
    const grid = top?.parentElement;
    if (!top || !grid) return;
    const measure = () => {
      perimeter.chromeTopPx = top.getBoundingClientRect().bottom;
      // The bottom element differs per mode (CTA in the gateway, terminal or
      // controller bar elsewhere) and some modes have none.
      const bottom = grid.querySelector('.node__bottom, .gate__cta');
      perimeter.chromeBottomPx = bottom ? bottom.getBoundingClientRect().top : window.innerHeight;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(top);
    ro.observe(grid);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [mode]);

  return (
    <main className="node" data-listening={listening} data-mode={mode}>
      <div className="node__fabric" aria-hidden="true">
        <FabricScene />
      </div>
      <div className="node__veil" aria-hidden="true" />
      {ledger && <LedgerLabels />}

      <div className="node__grid" data-mode={mode}>
        <header className="node__top" ref={topRef}>
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
