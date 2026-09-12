/**
 * The sonic nervous system: a pure Web Audio API synthesizer. No files are
 * loaded; every sound is generated from oscillators, filters, and a noise
 * buffer. Muted until the user enables it (autoplay policy). One-shot voices
 * disconnect themselves when they end; `dispose()` closes the context.
 */
interface Hum {
  osc: OscillatorNode;
  pitchLfo: OscillatorNode;
  filterLfo: OscillatorNode;
  gain: GainNode;
  nodes: AudioNode[];
}

class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private hum: Hum | null = null;
  private noise: AudioBuffer | null = null;
  private subscribers = new Set<() => void>();
  enabled = false;

  subscribe = (cb: () => void) => {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  };
  private emit() {
    for (const cb of this.subscribers) cb();
  }

  /** Must be called from a user gesture the first time. */
  async enable() {
    if (this.enabled) return;
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.enabled = true;
    this.startHum();
    this.emit();
  }

  disable() {
    if (!this.enabled) return;
    this.stopHum();
    this.enabled = false;
    void this.ctx?.suspend();
    this.emit();
  }

  toggle() {
    if (this.enabled) this.disable();
    else void this.enable();
  }

  /** Full teardown: stops every oscillator and closes the context. */
  dispose() {
    this.stopHum(true);
    this.enabled = false;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.emit();
  }

  debug() {
    return { enabled: this.enabled, state: this.ctx?.state ?? null, hum: this.hum !== null };
  }

  // ---- ambient ----------------------------------------------------------

  /** Continuous sub-bass sine drifting between 45 and 55 Hz under a 0.1 Hz low-pass LFO. */
  private startHum() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.hum) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 50;
    const pitchLfo = ctx.createOscillator();
    pitchLfo.frequency.value = 0.03;
    const pitchDepth = ctx.createGain();
    pitchDepth.gain.value = 5; // ±5 Hz → 45..55 Hz
    pitchLfo.connect(pitchDepth).connect(osc.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 140;
    filter.Q.value = 0.8;
    const filterLfo = ctx.createOscillator();
    filterLfo.frequency.value = 0.1;
    const filterDepth = ctx.createGain();
    filterDepth.gain.value = 80;
    filterLfo.connect(filterDepth).connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 1.6);

    osc.connect(filter).connect(gain).connect(master);
    osc.start(t);
    pitchLfo.start(t);
    filterLfo.start(t);
    this.hum = { osc, pitchLfo, filterLfo, gain, nodes: [pitchDepth, filter, filterDepth, gain] };
  }

  private stopHum(immediate = false) {
    const ctx = this.ctx;
    const hum = this.hum;
    if (!ctx || !hum) return;
    this.hum = null;
    const t = ctx.currentTime;
    const tail = immediate ? 0 : 0.4;
    hum.gain.gain.cancelScheduledValues(t);
    hum.gain.gain.setValueAtTime(Math.max(hum.gain.gain.value, 0.0001), t);
    hum.gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(tail, 0.01));
    const stopAt = t + tail + 0.02;
    for (const o of [hum.osc, hum.pitchLfo, hum.filterLfo]) o.stop(stopAt);
    hum.osc.onended = () => {
      for (const o of [hum.osc, hum.pitchLfo, hum.filterLfo]) o.disconnect();
      for (const n of hum.nodes) n.disconnect();
    };
  }

  // ---- one-shot voices --------------------------------------------------

  private voice(): { ctx: AudioContext; master: GainNode; t: number } | null {
    if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return null;
    return { ctx: this.ctx, master: this.master, t: this.ctx.currentTime };
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise && this.noise.sampleRate === ctx.sampleRate) return this.noise;
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }

  /** Disconnect a chain once its source ends. */
  private autoRelease(source: AudioScheduledSourceNode, ...nodes: AudioNode[]) {
    source.onended = () => {
      source.disconnect();
      for (const n of nodes) n.disconnect();
    };
  }

  /** Terminal key click: a 2 ms high-frequency white-noise pop. */
  click() {
    const v = this.voice();
    if (!v) return;
    const { ctx, master, t } = v;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.002);
    src.connect(hp).connect(g).connect(master);
    src.start(t, Math.random() * 1.5, 0.004);
    this.autoRelease(src, hp, g);
  }

  /** Mode shift: 150 ms exponential pitch sweep, 80 → 240 Hz. */
  modeShift() {
    const v = this.voice();
    if (!v) return;
    const { ctx, master, t } = v;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.15);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.16);
    this.autoRelease(osc, g);
  }

  /** Drift / quarantine alert: low sawtooth pulse, 110 → 55 Hz. */
  driftAlert() {
    const v = this.voice();
    if (!v) return;
    const { ctx, master, t } = v;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0005, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.65);
    osc.connect(lp).connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.7);
    this.autoRelease(osc, lp, g);
  }

  /** Gateway launch: rising sub-bass sweep, 34 → 96 Hz over 1.0 s, with a soft octave for presence. */
  gatewaySweep() {
    const v = this.voice();
    if (!v) return;
    const { ctx, master, t } = v;
    const D = 1.0;
    for (const [mult, level] of [
      [1, 0.26],
      [2, 0.06],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(34 * mult, t);
      osc.frequency.exponentialRampToValueAtTime(96 * mult, t + D);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0005, t);
      g.gain.exponentialRampToValueAtTime(level, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0005, t + D + 0.15);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + D + 0.2);
      this.autoRelease(osc, g);
    }
  }

  /** Phantom drop: sub-bass drop 120 → 30 Hz over 1.8 s under a rising high-pass noise sweep. */
  dropPulse() {
    const v = this.voice();
    if (!v) return;
    const { ctx, master, t } = v;
    const D = 1.8;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + D);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0005, t);
    sg.gain.exponentialRampToValueAtTime(0.24, t + 0.05);
    sg.gain.exponentialRampToValueAtTime(0.0005, t + D);
    sub.connect(sg).connect(master);
    sub.start(t);
    sub.stop(t + D + 0.05);
    this.autoRelease(sub, sg);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(ctx);
    noise.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(240, t);
    hp.frequency.exponentialRampToValueAtTime(9000, t + D);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0005, t);
    ng.gain.exponentialRampToValueAtTime(0.05, t + 0.2);
    ng.gain.exponentialRampToValueAtTime(0.0005, t + D);
    noise.connect(hp).connect(ng).connect(master);
    noise.start(t);
    noise.stop(t + D + 0.05);
    this.autoRelease(noise, hp, ng);
  }
}

export const synth = new Synth();
