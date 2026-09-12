import { useRef, type CSSProperties, type FormEvent } from 'react';
import { INGESTION, OPEX, perimeter } from '../state/perimeter.ts';
import { int, usd } from '../sim/model.ts';

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  format: (v: number) => string;
  onInput: (v: number) => void;
}

/**
 * Uncontrolled range input. The readout and the track fill are written
 * straight to the DOM on input, so dragging never re-renders React; only
 * the store subscribers that display derived numbers update.
 */
function Slider({ id, label, min, max, step, defaultValue, format, onInput }: SliderProps) {
  const readout = useRef<HTMLOutputElement>(null);
  const pct = (v: number) => `${((v - min) / (max - min)) * 100}%`;

  const paint = (el: HTMLInputElement, v: number) => {
    el.style.setProperty('--p', pct(v));
    if (readout.current) readout.current.textContent = format(v);
  };

  const handle = (e: FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const v = Number(el.value);
    paint(el, v);
    onInput(v);
  };

  return (
    <div className="ctl">
      <div className="ctl__meta">
        <label htmlFor={id}>{label}</label>
        <output ref={readout} htmlFor={id}>
          {format(defaultValue)}
        </output>
      </div>
      <input
        id={id}
        style={{ '--p': pct(defaultValue) } as CSSProperties}
        name={id}
        type="range"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        onInput={handle}
        aria-label={label}
      />
    </div>
  );
}

export function ControllerBar() {
  return (
    <div className="bar" role="group" aria-label="simulator controller">
      <Slider
        id="ingestion_load"
        label="Ingestion Load"
        min={INGESTION.min}
        max={INGESTION.max}
        step={INGESTION.step}
        defaultValue={INGESTION.default}
        format={(v) => `${int(v)} records / partition insert`}
        onInput={(v) => perimeter.set({ ingestionLoad: v })}
      />
      <Slider
        id="cloud_opex_baseline"
        label="Cloud Opex Baseline"
        min={OPEX.min}
        max={OPEX.max}
        step={OPEX.step}
        defaultValue={OPEX.default}
        format={(v) => `${usd(v)} / month`}
        onInput={(v) => perimeter.set({ opexBaseline: v })}
      />
    </div>
  );
}
