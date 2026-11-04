/**
 * Âm thanh thủ tục (Web Audio): dao động, nhiễu lọc, hồi âm tạo sinh. Mọi lớp bám theo mô hình.
 * Đồ thị âm thanh dựng được trên cả AudioContext lẫn OfflineAudioContext (để kiểm thử mức đỉnh).
 */
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

export class AudioGraph {
  constructor(ctx, quality = 2) {
    this.ctx = ctx; this.q = quality; this.L = {}; this.G = {};
    const c = ctx;
    // ---- đường ra: tổng → nén → hạn biên → loa ----
    this.master = c.createGain(); this.master.gain.value = 0;
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -20; this.comp.knee.value = 14; this.comp.ratio.value = 5; this.comp.attack.value = 0.006; this.comp.release.value = 0.22;
    this.lim = c.createDynamicsCompressor();
    this.lim.threshold.value = -4; this.lim.knee.value = 0; this.lim.ratio.value = 20; this.lim.attack.value = 0.001; this.lim.release.value = 0.08;
    this.trim = c.createGain(); this.trim.gain.value = 0.85;
    this.master.connect(this.comp); this.comp.connect(this.lim); this.lim.connect(this.trim); this.trim.connect(c.destination);
    // ---- nhóm theo vùng (tiêu điểm camera làm to/rõ vùng đó) ----
    for (const k of ['reactor', 'turb', 'tower', 'fx']) { const g = c.createGain(); g.connect(this.master); this.G[k] = g; }
    // ---- hồi âm ngắn (tạo sinh) ----
    this.verb = null;
    if (quality > 0) {
      const len = Math.floor(c.sampleRate * 1.4), ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let s = 12345 + ch * 777; for (let i = 0; i < len; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = ((s / 4294967296) * 2 - 1) * Math.pow(1 - i / len, 2.6); } }
      this.verb = c.createConvolver(); this.verb.buffer = ir; const vg = c.createGain(); vg.gain.value = 0.35; this.verb.connect(vg); vg.connect(this.G.fx); this.verbIn = c.createGain(); this.verbIn.connect(this.verb);
    }
    // ---- bộ nhiễu dùng chung ----
    const nl = c.sampleRate * 2, nb = c.createBuffer(1, nl, c.sampleRate), nd = nb.getChannelData(0); let ns = 987654;
    for (let i = 0; i < nl; i++) { ns = (ns * 1664525 + 1013904223) >>> 0; nd[i] = (ns / 4294967296) * 2 - 1; }
    this.nbuf = nb;
    this.build();
  }
  noise() { const n = this.ctx.createBufferSource(); n.buffer = this.nbuf; n.loop = true; n.start(0, Math.random() * 1.8); return n; }
  layer(name, group, node) { const g = this.ctx.createGain(); g.gain.value = 0; node.connect(g); g.connect(this.G[group]); this.L[name] = g; return g; }
  filt(type, f, q = 0.7) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  osc(type, f) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; }
  build() {
    const c = this.ctx, q = this.q;
    // phòng lò: ồn nền trầm
    { const n = this.noise(), f = this.filt('lowpass', 380, 0.5), f2 = this.filt('lowshelf', 120); n.connect(f); f.connect(f2); const g = this.layer('room', 'reactor', f2); if (this.verbIn) { const s = c.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(this.verbIn); } }
    // bơm vòng 1: tiếng rít kèm họa âm (luôn chạy)
    { const lp = this.filt('lowpass', 1100, 0.6); this.pumpO = [0, 1, 2].map((i) => { const o = this.osc(i === 0 ? 'sawtooth' : 'sine', 96 * (i + 1)); const g = c.createGain(); g.gain.value = [0.5, 0.35, 0.22][i]; o.connect(g); g.connect(lp); return o; }); this.layer('pump', 'reactor', lp); }
    // sôi trong bình sinh hơi: nhiễu dải giữa điều biên ngẫu nhiên
    if (q > 0) { const n = this.noise(), f = this.filt('bandpass', 900, 0.8), am = c.createGain(); am.gain.value = 0.6; const lfo = this.osc('sine', 7.3), lg = c.createGain(); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain); n.connect(f); f.connect(am); this.layer('boil', 'reactor', am); }
    // hơi: rít + ù trầm
    { const n = this.noise(), f = this.filt('highpass', 2600, 0.5), f2 = this.filt('bandpass', 4200, 0.4); n.connect(f); f.connect(f2); this.layer('hiss', 'turb', f2); }
    if (q > 0) { const n = this.noise(), f = this.filt('lowpass', 140, 0.7); n.connect(f); this.layer('rumble', 'turb', f); }
    // xả hơi về bình ngưng
    { const n = this.noise(), f = this.filt('highpass', 1800, 0.5), f2 = this.filt('peaking', 5200, 0.8); f2.gain.value = 6; n.connect(f); f.connect(f2); this.layer('dump', 'turb', f2); }
    // tuabin: rít + gầm
    { const lp = this.filt('lowpass', 2600, 0.7); this.whO = [this.osc('sawtooth', 60), this.osc('sine', 120), this.osc('sine', 187)]; this.whO.forEach((o, i) => { const g = c.createGain(); g.gain.value = [0.35, 0.5, 0.2][i]; o.connect(g); g.connect(lp); }); this.layer('whine', 'turb', lp); }
    { const n = this.noise(), f = this.filt('bandpass', 300, 0.6); this.roarF = f; n.connect(f); this.layer('roar', 'turb', f); }
    // máy phát: ù điện 100/150/200 Hz
    { const lp = this.filt('lowpass', 900, 0.5); this.genO = [100, 150, 200].map((fr, i) => { const o = this.osc('sine', fr), g = c.createGain(); g.gain.value = [0.6, 0.3, 0.2][i]; o.connect(g); g.connect(lp); return o; }); this.layer('gen', 'turb', lp); }
    // tháp làm mát: mưa rơi + gió nhẹ
    { const n = this.noise(), f = this.filt('highpass', 1500, 0.5), f2 = this.filt('bandpass', 3400, 0.5); n.connect(f); f.connect(f2); this.layer('rain', 'tower', f2); }
    if (q > 0) { const n = this.noise(), f = this.filt('lowpass', 520, 0.6), am = c.createGain(); am.gain.value = 0.7; const lfo = this.osc('sine', 0.13), lg = c.createGain(); lg.gain.value = 0.3; lfo.connect(lg); lg.connect(am.gain); n.connect(f); f.connect(am); this.layer('wind', 'tower', am); }
  }
  /** mục tiêu cho từng lớp (khoảng 0–1 nhân hệ số bên trong) */
  apply(p, focus, tc = 0.18) {
    const t = this.ctx.currentTime, set = (n, v) => { const g = this.L[n]; if (g) g.gain.setTargetAtTime(v, t, tc); };
    set('room', 0.05); set('pump', 0.03);
    set('boil', 0.07 * Math.pow(p.pow, 1.4));
    set('hiss', 0.05 * Math.pow(p.steam, 1.2)); set('rumble', 0.12 * p.steam);
    set('dump', 0.12 * p.dump);
    set('whine', 0.05 * Math.pow(p.rr, 1.5)); set('roar', 0.1 * Math.pow(p.rr, 1.3) * (0.45 + 0.55 * p.load));
    set('gen', 0.05 * p.load); set('rain', 0.1 * p.spray); set('wind', 0.022);
    if (this.whO) { const f = 30 + p.rr * 430; this.whO[0].frequency.setTargetAtTime(f, t, 0.1); this.whO[1].frequency.setTargetAtTime(f * 2, t, 0.1); this.whO[2].frequency.setTargetAtTime(f * 3.1, t, 0.1); }
    if (this.roarF) this.roarF.frequency.setTargetAtTime(220 + p.rr * 700, t, 0.15);
    if (this.pumpO) this.pumpO.forEach((o, i) => o.frequency.setTargetAtTime((96 + Math.sin(t * 0.7) * 1.5) * (i + 1), t, 0.3));
    const f = focus || '';
    const w = (g) => (f === g ? 1.7 : f === 'overview' || f === '' ? 1 : 0.5);
    this.G.reactor.gain.setTargetAtTime(w('reactor'), t, 0.3); this.G.turb.gain.setTargetAtTime(w('turbine'), t, 0.3); this.G.tower.gain.setTargetAtTime(w('tower'), t, 0.3);
  }
  setMaster(v, tc = 0.15) { this.master.gain.setTargetAtTime(v, this.ctx.currentTime, tc); }
  // ---- hiệu ứng một lần ----
  env(g, t, a, peak, dec) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  burst(t, f, qv, peak, dur, group = 'fx', type = 'bandpass') {
    const n = this.noise(), fl = this.filt(type, f, qv), g = this.ctx.createGain(); n.connect(fl); fl.connect(g); g.connect(this.G[group]); this.env(g, t, 0.002, peak, dur); n.stop(t + dur + 0.1);
  }
  tone(t, f0, f1, peak, dur, type = 'sine', group = 'fx', a = 0.004) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    o.connect(g); g.connect(this.G[group]); this.env(g, t, a, peak, dur); o.start(t); o.stop(t + dur + 0.1);
  }
  click(t, v = 1) { this.burst(t, 2600, 4, 0.05 * v, 0.018); this.tone(t, 150, 90, 0.025 * v, 0.03); }
  uiTick(v = 1) { const t = this.ctx.currentTime; this.tone(t, 1900, 1700, 0.018 * v, 0.03, 'sine', 'fx'); }
  release(t) { this.burst(t, 700, 0.7, 0.16, 0.5, 'reactor', 'lowpass'); this.tone(t, 220, 60, 0.07, 0.4, 'sawtooth', 'reactor'); }
  thud(t) { this.tone(t, 70, 28, 0.32, 0.45, 'sine', 'reactor'); this.burst(t, 180, 0.7, 0.12, 0.25, 'reactor', 'lowpass'); }
  breaker(t) { this.tone(t, 95, 45, 0.2, 0.3, 'sine', 'turb'); this.burst(t, 1500, 1.2, 0.09, 0.07, 'turb'); this.burst(t + 0.09, 2200, 1.5, 0.07, 0.05, 'turb'); }
  chime(t) { this.tone(t, 880, 880, 0.045, 0.7, 'sine', 'fx', 0.01); this.tone(t + 0.18, 1174.7, 1174.7, 0.04, 0.9, 'sine', 'fx', 0.01); }
  beeps(t) { for (let i = 0; i < 3; i++) this.tone(t + i * 0.16, 1040, 1040, 0.05, 0.11, 'triangle', 'fx', 0.008); }
  siren(t, loud = 1) { for (let i = 0; i < 4; i++) { this.tone(t + i * 0.34, 740, 740, 0.06 * loud, 0.3, 'triangle', 'fx', 0.01); this.tone(t + i * 0.34 + 0.17, 554, 554, 0.06 * loud, 0.16, 'triangle', 'fx', 0.01); } }
  remind(t) { this.tone(t, 660, 660, 0.03, 0.4, 'triangle', 'fx', 0.01); this.tone(t + 0.22, 494, 494, 0.03, 0.5, 'triangle', 'fx', 0.01); }
}

export class Sound {
  constructor() { this.enabled = false; this.volume = 0.7; this.ctx = null; this.graph = null; this.q = 2; this.ev = null; this.alarmT = 0; this.lastStatus = 'normal'; this.nextStep = 0; this.pendingThud = null; this.lastApply = 0; }
  async init() {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      this.ctx = new AC({ latencyHint: 'interactive' });
      this.graph = new AudioGraph(this.ctx, this.q);
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.graph.setMaster(this.vol(), 0.4);
    } catch (e) { this.ctx = null; this.graph = null; }
  }
  vol() { return this.enabled ? Math.pow(this.volume, 1.5) : 0; }
  setQuality(q) { this.q = q; }
  setEnabled(b) {
    this.enabled = !!b;
    if (this.enabled && !this.ctx) { /* init được gọi trong thao tác người dùng */ }
    if (this.graph) { this.graph.setMaster(this.vol(), 0.2); if (this.enabled) this.resume(); }
  }
  setVolume(v) { this.volume = clamp(v, 0, 1); if (this.graph) this.graph.setMaster(this.vol(), 0.1); }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.enabled && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); }
  uiClick(v = 1) { if (this.graph && this.enabled) this.graph.uiTick(v); }
  update(s, d, dt, focus, active) {
    const g = this.graph; if (!g || !this.enabled || this.ctx.state !== 'running') { if (s && this.ev) this.sync(s); return; }
    if (!this.ev) this.sync(s);
    const t = this.ctx.currentTime;
    if (!active) { g.setMaster(this.vol() * 0.0, 0.15); this.sync(s); return; }
    g.setMaster(this.vol(), 0.2);
    // sự kiện
    const e = s.ev, E = this.ev;
    if (e.rodStep !== E.rodStep) { const n = e.rodStep - E.rodStep; E.rodStep = e.rodStep; if (t >= this.nextStep) { g.click(t + 0.005); if (n > 1) g.click(t + 0.045, 0.7); this.nextStep = t + 0.07; } }
    if (e.scram !== E.scram) { E.scram = e.scram; g.release(t + 0.01); this.pendingThud = t + 2.0; }
    if (this.pendingThud && t >= this.pendingThud - 0.05) { g.thud(Math.max(t, this.pendingThud)); this.pendingThud = null; }
    if (e.sync !== E.sync) { E.sync = e.sync; g.breaker(t + 0.01); }
    if (e.trip !== E.trip) { E.trip = e.trip; g.breaker(t + 0.01); }
    // cảnh báo
    const st = s.status;
    if (st !== this.lastStatus) { this.lastStatus = st; this.alarmT = 0; }
    if (t >= this.alarmT) {
      if (st === 'warning') { g.chime(t); this.alarmT = t + 4.5; }
      else if (st === 'overheat') { g.beeps(t); this.alarmT = t + 1.25; }
      else if (st === 'scram') { if (!this.scramLoud) { g.siren(t, 1); this.alarmT = t + 6; this.scramLoud = true; } else { g.remind(t); this.alarmT = t + 6; } }
      else this.scramLoud = false;
    }
    if (st !== 'scram') this.scramLoud = false;
    // mức các lớp (~15 lần/giây)
    if (t - this.lastApply > 0.07) {
      this.lastApply = t;
      const steam = Math.min(1.3, s.steam / 1657), dumpOn = s.tripSeen && !s.steamOk;
      g.apply({ steam, pow: Math.min(1.3, s.p), rr: s.rpm / 3000, load: Math.min(1.3, s.pe / 1000), dump: dumpOn ? steam : 0, spray: Math.min(1.3, d.waste / 2000) + 0.05 }, focus);
    }
  }
  sync(s) { this.ev = { rodStep: s.ev.rodStep, scram: s.ev.scram, sync: s.ev.sync, trip: s.ev.trip, recover: s.ev.recover }; }
  /** Dựng đồ thị trong OfflineAudioContext, phát tải nặng và trả về đỉnh (kiểm thử). */
  static async renderTest(seconds = 3) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.floor(sr * seconds), sr), g = new AudioGraph(ctx, 2);
    g.setMaster(1, 0.01);
    g.apply({ steam: 1.3, pow: 1.3, rr: 1, load: 1.3, dump: 1.3, spray: 1.3 }, 'overview', 0.01);
    for (let i = 0; i < 20; i++) { g.click(0.1 + i * 0.05); }
    g.release(0.3); g.thud(0.8); g.breaker(1.2); g.siren(1.4, 1.5); g.beeps(2.3); g.chime(2.6);
    const buf = await ctx.startRendering(); let peak = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; } }
    return { peak, db: 20 * Math.log10(Math.max(peak, 1e-9)), nan: false };
  }
}
