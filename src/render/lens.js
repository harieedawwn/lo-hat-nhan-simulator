/** Kính lúp "Bên trong lõi lò": phản ứng dây chuyền ở mức hạt nhân (minh hoạ, số hạt bị giới hạn). */
const TAU = Math.PI * 2;
const rnd = (() => { let s = 4242; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

export class Lens {
  constructor(canvas) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.S = 220; this.dpr = 1;
    this.u235 = []; this.u238 = []; this.h2o = [];
    this.neu = []; this.frag = []; this.flash = []; this.t = 0; this.rate = 0; this.ema = 0; this.acc = 0;
    this.maxN = 60;
    this.layout();
  }
  layout() {
    const S = this.S;
    // thanh nhiên liệu: dải đứng ở giữa-trái; nước hai bên; thanh điều khiển bên phải
    this.fuelX0 = 66; this.fuelX1 = 130;
    this.u235.length = this.u238.length = this.h2o.length = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) {
      const x = 76 + i * 15 + (j % 2) * 5, y = 34 + j * 20 + (i % 2) * 6;
      (rnd() < 0.24 ? this.u235 : this.u238).push({ x, y, fl: 0, hot: 0 });
    }
    if (this.u235.length < 4) for (let i = 0; i < 4; i++) { this.u238[i * 5]?.x; const n = this.u238.splice(i * 5, 1)[0]; if (n) this.u235.push(n); }
    for (let i = 0; i < 18; i++) {
      const left = i < 8;
      this.h2o.push({ x: left ? 18 + rnd() * 36 : 146 + rnd() * 54, y: 24 + rnd() * (S - 48), a: rnd() * TAU, vx: (rnd() - 0.5) * 6, vy: (rnd() - 0.5) * 6, fl: 0 });
    }
    this.rodX0 = 176; this.rodX1 = 202;
  }
  resize(px) {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.c.width = Math.round(px * this.dpr); this.c.height = Math.round(px * this.dpr);
    this.scale = px / this.S;
  }
  setQuality(q) { this.maxN = [26, 40, 60][q]; }
  spawnFast(x, y, k, rodIns) {
    if (this.neu.length >= this.maxN) return;
    const pk = Math.max(0, Math.min(1.05, k)) / 2.5;
    const r = rnd();
    // chọn số phận của neutron
    let kind;
    if (r < pk) kind = 'u235';
    else if (r < pk + (1 - pk) * Math.min(0.85, rodIns * 0.9)) kind = 'rod';
    else if (r < pk + (1 - pk) * 0.75) kind = 'u238';
    else kind = 'leak';
    const w = this.h2o[(rnd() * this.h2o.length) | 0];
    const n = { x, y, st: 0, kind, wx: w.x, wy: w.y, w, tx: 0, ty: 0, life: 0, t235: null };
    this.pickTarget(n, rodIns);
    this.neu.push(n);
  }
  pickTarget(n, rodIns) {
    if (n.kind === 'u235') { const t = this.u235[(rnd() * this.u235.length) | 0]; n.t235 = t; n.tx = t.x; n.ty = t.y; }
    else if (n.kind === 'u238') { const t = this.u238[(rnd() * this.u238.length) | 0]; n.tx = t.x; n.ty = t.y; n.t238 = t; }
    else if (n.kind === 'rod') { n.tx = this.rodX0 + 4; n.ty = 20 + rnd() * Math.max(10, 180 * rodIns); }
    else { n.tx = rnd() < 0.5 ? 4 : 216; n.ty = 20 + rnd() * 180; }
  }
  fission(t) {
    t.fl = 1; this.ema += 1;
    this.flash.push({ x: t.x, y: t.y, t: 0 });
    const a = rnd() * TAU;
    this.frag.push({ x: t.x, y: t.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, t: 0, c: 0 });
    this.frag.push({ x: t.x, y: t.y, vx: -Math.cos(a) * 52, vy: -Math.sin(a) * 52, t: 0, c: 1 });
    if (this.frag.length > 30) this.frag.splice(0, 4);
    this.nuOut = (rnd() < 0.5) ? 2 : 3;
    return this.nuOut;
  }
  update(dt, s) {
    this.t += dt;
    const pf = s.pf, k = s.k, rodIns = 1 - s.rod / 100;
    this.ema *= Math.exp(-dt / 1.2);
    // nguồn bổ sung để tốc độ phân hạch bám p_f (tối đa theo chất lượng)
    const R = Math.min(14, 11 * pf) * (this.maxN / 60 + 0.3);
    const chainRate = this.ema / 1.2;
    const need = Math.max(0, R - chainRate);
    this.acc += need * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      const t = this.u235[(rnd() * this.u235.length) | 0];
      const nu = this.fission(t);
      for (let i = 0; i < nu; i++) this.spawnFast(t.x, t.y, k, rodIns);
    }
    if (this.acc > 2) this.acc = 2;
    for (let i = this.neu.length - 1; i >= 0; i--) {
      const n = this.neu[i];
      n.life += dt;
      const tx = n.st === 0 ? n.wx : n.tx, ty = n.st === 0 ? n.wy : n.ty;
      const dx = tx - n.x, dy = ty - n.y, dl = Math.hypot(dx, dy);
      const sp = n.st === 0 ? 150 : 52;
      if (dl < sp * dt + 1.5) {
        if (n.st === 0) { n.st = 1; n.w.fl = 1; this.flash.push({ x: n.x, y: n.y, t: 0, small: 1 }); this.pickTarget(n, rodIns); }
        else {
          if (n.kind === 'u235') { const nu = this.fission(n.t235); for (let j = 0; j < nu; j++) this.spawnFast(n.t235.x, n.t235.y, k, rodIns); }
          else if (n.kind === 'u238' && n.t238) { n.t238.hot = 1; this.flash.push({ x: n.x, y: n.y, t: 0, small: 1, grey: 1 }); }
          else if (n.kind === 'rod') this.flash.push({ x: n.x, y: n.y, t: 0, small: 1, grey: 1 });
          this.neu.splice(i, 1);
        }
        continue;
      }
      // đường đi hơi gập ghềnh
      const jx = Math.sin(this.t * 9 + i * 1.7) * 14 * dt, jy = Math.cos(this.t * 8 + i) * 14 * dt;
      n.x += (dx / dl) * sp * dt + jx; n.y += (dy / dl) * sp * dt + jy;
      if (n.life > 14) this.neu.splice(i, 1);
    }
    for (const f of this.frag) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.97; f.vy *= 0.97; }
    this.frag = this.frag.filter((f) => f.t < 1.1);
    for (const f of this.flash) f.t += dt * 2.4;
    this.flash = this.flash.filter((f) => f.t < 1);
    for (const w of this.h2o) { w.x += w.vx * dt; w.y += w.vy * dt; w.a += dt * 0.5; w.fl = Math.max(0, w.fl - dt * 3); if (w.x < 10 || (w.x > 56 && w.x < 144) || w.x > 208) { w.vx = -w.vx; w.x += w.vx * dt * 2; } if (w.y < 14 || w.y > 206) w.vy = -w.vy; }
    for (const n of this.u235) n.fl = Math.max(0, n.fl - dt * 2);
    for (const n of this.u238) n.hot = Math.max(0, n.hot - dt * 0.8);
  }
  draw(s) {
    const g = this.g, S = this.S, k = this.scale * this.dpr;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.clearRect(0, 0, S, S);
    g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, TAU); g.clip();
    const bg = g.createLinearGradient(0, 0, 0, S); bg.addColorStop(0, '#E6F1FA'); bg.addColorStop(1, '#CFE3F3');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    // nhiên liệu (UO₂) + vỏ zirconium
    g.fillStyle = '#EFE7D5'; g.fillRect(this.fuelX0 - 4, 0, this.fuelX1 - this.fuelX0 + 8, S);
    g.fillStyle = '#9AA6B8'; g.fillRect(this.fuelX0 - 6, 0, 3, S); g.fillRect(this.fuelX1 + 3, 0, 3, S);
    // thanh điều khiển
    const ins = 1 - s.rod / 100, rl = 14 + ins * (S - 28);
    g.fillStyle = '#2B3A55'; g.fillRect(this.rodX0, 0, this.rodX1 - this.rodX0, rl);
    g.fillStyle = 'rgba(255,255,255,.18)'; for (let y = 6; y < rl; y += 10) g.fillRect(this.rodX0 + 2, y, this.rodX1 - this.rodX0 - 4, 2);
    g.fillStyle = '#8C98AB'; g.fillRect(this.rodX0 - 2, rl - 3, this.rodX1 - this.rodX0 + 4, 3);
    // phân tử nước
    for (const w of this.h2o) {
      g.save(); g.translate(w.x, w.y); g.rotate(w.a);
      g.fillStyle = w.fl > 0 ? `rgba(80,160,255,${0.5 + 0.5 * w.fl})` : 'rgba(80,140,210,.9)';
      g.beginPath(); g.arc(0, 0, 4.2 + w.fl * 3, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-5, 3.2, 2.3, 0, TAU); g.arc(5, 3.2, 2.3, 0, TAU); g.fill();
      g.restore();
    }
    // hạt nhân
    for (const n of this.u238) { g.fillStyle = n.hot ? '#9AA6B8' : '#7B8AA3'; g.beginPath(); g.arc(n.x, n.y, 6.2 + n.hot * 1.5, 0, TAU); g.fill(); g.strokeStyle = 'rgba(27,43,72,.5)'; g.lineWidth = 0.8; g.stroke(); }
    for (const n of this.u235) {
      g.fillStyle = `rgb(${224 + n.fl * 30 | 0},${96 + n.fl * 110 | 0},${60 + n.fl * 40 | 0})`; g.beginPath(); g.arc(n.x, n.y, 6.6 + n.fl * 2, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(100,30,10,.7)'; g.lineWidth = 0.9; g.stroke();
    }
    // mảnh vỡ
    for (const f of this.frag) { g.globalAlpha = 1 - f.t / 1.1; g.fillStyle = f.c ? '#2E8B7A' : '#B24A9C'; g.beginPath(); g.arc(f.x, f.y, f.c ? 4 : 5, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    // tia sáng khi phân hạch
    for (const f of this.flash) {
      g.globalAlpha = (1 - f.t) * (f.small ? 0.6 : 0.9);
      g.strokeStyle = f.grey ? '#8C98AB' : '#FFC24A'; g.lineWidth = f.small ? 1.5 : 3;
      g.beginPath(); g.arc(f.x, f.y, 5 + f.t * (f.small ? 10 : 24), 0, TAU); g.stroke();
      if (!f.small) { g.fillStyle = `rgba(255,236,160,${(1 - f.t) * 0.7})`; g.beginPath(); g.arc(f.x, f.y, 5 + f.t * 12, 0, TAU); g.fill(); }
    }
    g.globalAlpha = 1;
    // neutron
    for (const n of this.neu) {
      g.fillStyle = n.st === 0 ? '#F08A24' : '#1D6FE0'; g.strokeStyle = '#fff'; g.lineWidth = 1.1;
      g.beginPath(); g.arc(n.x, n.y, n.st === 0 ? 3.1 : 3.8, 0, TAU); g.fill(); g.stroke();
      if (n.st === 0) { g.strokeStyle = 'rgba(240,138,36,.45)'; g.lineWidth = 1.4; const a = Math.atan2(n.wy - n.y, n.wx - n.x); g.beginPath(); g.moveTo(n.x, n.y); g.lineTo(n.x - Math.cos(a) * 10, n.y - Math.sin(a) * 10); g.stroke(); }
    }
    g.restore();
    g.strokeStyle = '#1B2B48'; g.lineWidth = 2.2; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, TAU); g.stroke();
    // chú thích cố định
    g.font = '600 9.5px "Be Vietnam Pro",system-ui,sans-serif'; g.textAlign = 'center';
    g.fillStyle = '#1B2B48';
    const halo = (t, x, y) => { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.strokeText(t, x, y); g.fillText(t, x, y); };
    halo('nhiên liệu UO₂', (this.fuelX0 + this.fuelX1) / 2, 14);
    halo('nước', 36, 206);
    halo('thanh ĐK', (this.rodX0 + this.rodX1) / 2, 206);
  }
}
