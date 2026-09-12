import { perimeter, usePerimeter, type GatewayView } from '../state/perimeter.ts';

const VIEWS: { view: GatewayView; label: string }[] = [
  { view: 'technical', label: '[view: technical_architecture]' },
  { view: 'executive', label: '[view: executive_briefing]' },
];

/** Gateway view switch, top-right beside the audio toggle. Default: technical_architecture. */
export function ViewToggle() {
  const view = usePerimeter((s) => s.gatewayView);
  return (
    <div className="view-toggle" role="group" aria-label="gateway view">
      {VIEWS.map((v, i) => (
        <span key={v.view} className="view-toggle__item">
          {i > 0 && (
            <span className="view-toggle__sep" aria-hidden="true">
              |
            </span>
          )}
          <button
            type="button"
            className="view-toggle__btn tok"
            aria-pressed={view === v.view}
            onClick={() => perimeter.set({ gatewayView: v.view, arsenalHover: null })}
          >
            {v.label}
          </button>
        </span>
      ))}
    </div>
  );
}
