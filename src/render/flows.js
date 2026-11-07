import { FLOWS, ELEC, GROUND } from './geometry.js';

const NS = 'http://www.w3.org/2000/svg';
const STEP = 3;                    // px giữa các mẫu
const STEAM_NOM = 3000 / 1.81;     // kg/s định mức
const TC = 1990;

const COL = {
  1: 'rgba(255,232,228,.92)', steam: 'rgba(96,178,232,.85)', water: 'rgba(228,240,252,.95)', 3: 'rgba(232,252,252,.95)',
};

function sample(d) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  const L = p.getTotalLength();
  const n = Math.max(2, Math.ceil(L / STEP) + 1);
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const t = Math.min(L, i * STEP);
    const q = p.getPointAtLength(t);
    a[i * 4] = q.x; a[i * 4 + 1] = q.y;
  }
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
    const dx = a[i1 * 4] - a[i0 * 4], dy = a[i1 * 4 + 1] - a[i0 * 4 + 1];
    const l = Math.hypot(dx, dy) || 1;
    a[i * 4 + 2] = -dy / l; a[i * 4 + 3] = dx / l;
  }
  return { a, n, len: L };
}

const rng = (() => { let s = 99; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

/** Hệ hạt Canvas dùng toạ độ thế giới (bộ biến đổi camera đặt ở ctx). */
export class Flows {
  constructor(quality = 1) {
    this.q = quality;
    this.flows = FLOWS.map((f) => this.mk(f));
    this.elec = ELEC.map((e) => this.mk({ id: e.id, d: e.d, gap: e.gap, speed: e.speed, alpha: e.alpha ?? 1, spread: 0, size: 2.6 }));
    this.drive = {};
    this.puffCap = 80; this.puffs = [];
    this.sprite = this.mkSprite();
    this.bub = Array.from({ length: 70 }, () => ({ x: 0, y: 0, v: 0, r: 0, ph: rng() * 6, on: 0 }));
    this.drops = Array.from({ length: 110 }, () => ({ x: 0, y: 0, v: 0, on: 0 }));
    this.ripples = Array.from({ length: 24 }, () => ({ x: 0, t: 1 }));
    this.cdrip = Array.from({ length: 22 }, () => ({ x: 0, y: 0, on: 0 }));
    this.pbub = Array.from({ length: 5 }, (_, i) => ({ x: 380 + i * 8, y: 400 + i * 14, ph: i }));
    this.t = 0; this.puffAcc = 0;
    this.setQuality(quality);
    this.warm = false;
  }
  mk(f) {
    const { a, n, len } = sample(f.d);
    const gap = f.gap || 16;
    const cnt = Math.max(2, Math.ceil(len / gap));
    return { f, a, n, len, cnt, pos: Float32Array.from({ length: cnt }, (_, i) => ((i + rng() * 0.6) / cnt) * len), rank: Float32Array.from({ length: cnt }, (_, i) => (i * 0.61803398875) % 1), off: Float32Array.from({ length: cnt }, () => rng() * 2 - 1), col: f.kind === 'steam' ? COL.steam : f.kind === 'water' ? COL.water : f.loop === 1 ? COL[1] : f.loop === 3 ? COL[3] : '#fff' };
  }
  mkSprite() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, 'rgba(255,255,255,.98)'); r.addColorStop(0.5, 'rgba(248,251,254,.85)'); r.addColorStop(0.8, 'rgba(222,232,243,.5)'); r.addColorStop(1, 'rgba(210,222,236,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const c2 = document.createElement('canvas'); c2.width = c2.height = 128;
    const g2 = c2.getContext('2d');
    const r2 = g2.createRadialGradient(64, 64, 4, 64, 64, 62);
    r2.addColorStop(0, 'rgba(150,170,196,.8)'); r2.addColorStop(0.6, 'rgba(165,184,208,.45)'); r2.addColorStop(1, 'rgba(165,184,208,0)');
    g2.fillStyle = r2; g2.fillRect(0, 0, 128, 128);
    this.sprite2 = c2;
    // viền tối nhẹ (steamEdge) để tách khối hơi khỏi nền trời
    const c3 = document.createElement('canvas'); c3.width = c3.height = 128;
    const g3 = c3.getContext('2d');
    const r3 = g3.createRadialGradient(64, 64, 30, 64, 64, 63);
    r3.addColorStop(0, 'rgba(137,150,168,0)'); r3.addColorStop(0.72, 'rgba(137,150,168,.55)'); r3.addColorStop(0.86, 'rgba(120,134,154,.42)'); r3.addColorStop(1, 'rgba(137,150,168,0)');
    g3.fillStyle = r3; g3.fillRect(0, 0, 128, 128);
    this.sprite3 = c3;
    return c;
  }
  setQuality(q) { // 0 thấp, 1 trung bình, 2 cao
    this.qual = q;
    this.puffCap = [18, 34, 56][q];
    this.nSub = [2, 3, 3][q];
    this.density = [0.45, 0.75, 1][q];
    this.nBub = [20, 40, 70][q];
    this.nDrop = [30, 60, 110][q];
  }
  /** Tính các hệ số điều khiển từ trạng thái mô hình. */
  setDrive(s, d) {
    const st = Math.min(1.4, s.steam / STEAM_NOM);
    const dr = this.drive;
    dr.one = 1;
    dr.steam = st;
    dr.turb = s.steamOk && s.turb !== 'coasting' ? st : 0;
    dr.dump = s.tripSeen && !s.steamOk ? st : 0;
    dr.makeup = 0.25;
    dr.pe = Math.min(1.3, s.pe / 1000);
    dr.waste = Math.min(1.3, d.waste / 2000);
    dr.pow = Math.min(1.3, s.p);
    this.plumeI = s.p < 0.001 && d.waste < 1 ? 0 : 0.14 + 0.86 * Math.min(1.2, d.waste / 2000);
  }
  prewarm(s, d) {
    this.setDrive(s, d);
    for (let i = 0; i < 140; i++) this.update(0.1);
    this.warm = true;
  }
  update(dt) {
    this.t += dt;
    const dr = this.drive;
    for (const fl of this.flows) {
      const f = dr[fl.f.drive] ?? 1;
      if (f < 0.015) continue;
      const v = fl.f.speed * (fl.f.drive === 'one' ? 1 : 0.3 + 0.7 * Math.min(f, 1.2)) * dt;
      for (let i = 0; i < fl.cnt; i++) { fl.pos[i] += v; if (fl.pos[i] >= fl.len) fl.pos[i] -= fl.len; }
    }
    const pe = dr.pe ?? 0;
    for (const fl of this.elec) { if (pe < 0.01) continue; const v = fl.f.speed * dt; for (let i = 0; i < fl.cnt; i++) { fl.pos[i] += v; if (fl.pos[i] >= fl.len) fl.pos[i] -= fl.len; } }
    // bọt sôi trong bình sinh hơi
    const pow = dr.pow ?? 0, nb = Math.floor(this.nBub * Math.min(1, pow * 1.05));
    for (let i = 0; i < this.bub.length; i++) {
      const b = this.bub[i];
      if (i >= nb) { b.on = 0; continue; }
      if (!b.on) { b.on = 1; b.x = 484 + rng() * 72; b.y = 770 - rng() * 30; b.v = 36 + rng() * 40; b.r = 1; }
      b.y -= b.v * (0.5 + pow * 0.6) * dt; b.ph += dt * 4;
      b.r = 1.1 + (770 - b.y) / 340 * 2.6;
      if (b.y < 448) b.on = 0;
    }
    // giọt phun trong tháp làm mát
    const sp = Math.min(1.2, dr.waste ?? 0), nd = Math.floor(this.nDrop * Math.max(0.12, sp));
    for (let i = 0; i < this.drops.length; i++) {
      const p = this.drops[i];
      if (i >= nd) { p.on = 0; continue; }
      if (!p.on) { p.on = 1; p.x = TC - 96 + Math.floor(rng() * 13) * 16 + (rng() - 0.5) * 6; p.y = 772 + rng() * 40; p.v = 10 + rng() * 40; }
      p.v += 420 * dt; if (p.y > 800 && p.y < 842) p.v = Math.min(p.v, 150);
      p.y += p.v * dt;
      if (p.y > 908) {
        p.on = 0; if (rng() < 0.4) { const r = this.ripples[(rng() * this.ripples.length) | 0]; r.x = p.x; r.t = 0; }
      }
    }
    for (const r of this.ripples) if (r.t < 1) r.t += dt * 1.6;
    // giọt ngưng tụ
    const st = dr.steam ?? 0;
    for (const c of this.cdrip) {
      if (!c.on) { if (rng() < st * 0.25) { c.on = 1; c.x = 952 + rng() * 136; c.y = 846; } continue; }
      c.y += 40 * dt; if (c.y > 859) c.on = 0;
    }
    // đám hơi (không phóng xạ) trên tháp
    const I = this.plumeI ?? 0;
    this.puffAcc += dt * (0.4 + 6 * I) * (this.puffCap / 56) * (I > 0 ? 1 : 0);
    while (this.puffAcc >= 1 && this.puffs.length < this.puffCap) {
      this.puffAcc -= 1;
      // mỗi đám hơi là một cụm 2–3 khối tròn mềm, nở dần khi bốc lên
      const sub = Array.from({ length: 3 }, (_, j) => ({ dx: j ? (rng() - 0.5) * 1.3 : 0, dy: j ? -rng() * 0.7 : 0, k: j ? 0.55 + rng() * 0.3 : 1 }));
      this.puffs.push({ x: TC + (rng() - 0.5) * 220 * (0.6 + 0.4 * I), y: 466, age: 0, life: 10 + rng() * 5, vy: 34 + rng() * 22, r0: (44 + rng() * 26) * (0.55 + 0.45 * I), g: 7 + rng() * 6, a: 0.3 + 0.5 * I, ph: rng() * 6.28, sub });
    }
    if (this.puffAcc > 2) this.puffAcc = 2;
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.age += dt; p.y -= p.vy * dt * (1 - p.age / p.life * 0.55);
      p.x += (10 + p.age * 3.2 + 4 * Math.sin(p.ph + p.age * 0.7)) * dt; // gió nhẹ sang phải
      if (p.age >= p.life) this.puffs.splice(i, 1);
    }
  }
  draw(ctx, view) {
    const dr = this.drive, dens = this.density;
    // dòng chảy
    for (const fl of this.flows) {
      const f = dr[fl.f.drive] ?? 1;
      if (f < 0.015) continue;
      const lim = fl.f.drive === 'one' ? 1 : Math.min(1, f);
      const rr = lim * dens;
      ctx.fillStyle = fl.col;
      ctx.beginPath();
      const sz = fl.f.size, sp = fl.f.spread;
      for (let i = 0; i < fl.cnt; i++) {
        if (fl.rank[i] > rr) continue;
        let idx = fl.pos[i] / STEP | 0; if (idx >= fl.n) idx = fl.n - 1;
        const o = sp * (sp > 20 ? fl.off[i] : fl.off[i] * 0.8);
        const x = fl.a[idx * 4] + fl.a[idx * 4 + 2] * o, y = fl.a[idx * 4 + 1] + fl.a[idx * 4 + 3] * o;
        if (fl.f.kind === 'steam') { ctx.moveTo(x + sz, y); ctx.arc(x, y, sz * (0.9 + 0.5 * ((i * 7) % 3) / 2), 0, 6.283); }
        else { ctx.moveTo(x + sz, y); ctx.arc(x, y, sz, 0, 6.283); }
      }
      ctx.fill();
    }
    // bọt sôi
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.strokeStyle = 'rgba(40,86,140,.55)'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const b of this.bub) { if (!b.on) continue; const x = b.x + Math.sin(b.ph) * 2; ctx.moveTo(x + b.r, b.y); ctx.arc(x, b.y, b.r, 0, 6.283); }
    ctx.fill(); ctx.stroke();
    // giọt ngưng tụ + giọt phun
    ctx.fillStyle = 'rgba(70,140,215,.9)'; ctx.beginPath();
    for (const c of this.cdrip) { if (!c.on) continue; ctx.moveTo(c.x + 1.3, c.y); ctx.arc(c.x, c.y, 1.3, 0, 6.283); }
    ctx.fill();
    ctx.fillStyle = 'rgba(244,252,255,.92)'; ctx.beginPath();
    for (const p of this.drops) { if (!p.on) continue; ctx.moveTo(p.x + 1.6, p.y); ctx.arc(p.x, p.y, 1.6, 0, 6.283); }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2;
    for (const r of this.ripples) { if (r.t >= 1) continue; ctx.globalAlpha = 1 - r.t; ctx.beginPath(); ctx.ellipse(r.x, 912, 4 + r.t * 14, 1.5 + r.t * 3, 0, 0, 6.283); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // xung năng lượng
    const pe = dr.pe ?? 0;
    if (pe > 0.01) {
      const rr = Math.min(1, pe) * dens;
      const vx0 = -view.x / view.s - 10, vx1 = vx0 + (view.cw || 4000) / view.s + 20;
      for (const fl of this.elec) {
        ctx.globalAlpha = fl.f.alpha; // pha sau (theo chiều sâu) nhạt hơn
        for (let pass = 0; pass < 2; pass++) {
          ctx.fillStyle = pass ? 'rgba(255,200,60,.95)' : 'rgba(255,196,60,.25)';
          ctx.beginPath();
          const rad = pass ? 2.6 : 6;
          for (let i = 0; i < fl.cnt; i++) {
            if (fl.rank[i] > rr) continue;
            let idx = fl.pos[i] / STEP | 0; if (idx >= fl.n) idx = fl.n - 1;
            const x = fl.a[idx * 4], y = fl.a[idx * 4 + 1];
            if (x < vx0 || x > vx1) continue;
            ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, 6.283);
          }
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Đám hơi vẽ ở độ phân giải thấp vào canvas phụ rồi dán một lần (giảm chi phí đổ pixel). */
  drawPlume(ctx, cam, dpr) {
    if (!this.puffs.length) return;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const x0 = Math.max(0, Math.floor((cam.x + cam.s * 1580) * dpr)), x1 = Math.min(W, Math.ceil((cam.x + cam.s * 2950) * dpr));
    const y0 = Math.max(0, Math.floor((cam.y + cam.s * -520) * dpr)), y1 = Math.min(H, Math.ceil((cam.y + cam.s * 520) * dpr));
    const w = x1 - x0, h = y1 - y0; if (w < 8 || h < 8) return;
    const sc = [0.25, 0.33, 0.4][this.qual];
    const pc = this.pc || (this.pc = document.createElement('canvas')), pw = Math.ceil(w * sc), ph = Math.ceil(h * sc);
    if (pc.width !== pw || pc.height !== ph) { pc.width = pw; pc.height = ph; }
    const g = pc.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pw, ph);
    const k = cam.s * dpr * sc; g.setTransform(k, 0, 0, k, (cam.x * dpr - x0) * sc, (cam.y * dpr - y0) * sc);
    const nSub = this.nSub || 3, shade = this.qual > 0;
    // 2 lượt: viền/bóng trước, thân trắng sau → viền chỉ lộ ở mép ngoài của cả đám
    for (let pass = 0; pass < 2; pass++) {
      for (const p of this.puffs) {
        const u = p.age / p.life;
        const a = p.a * Math.min(1, u * 5) * (1 - u) * (1 - u * 0.3);
        if (a < 0.01) continue;
        const R = p.r0 + p.g * p.age * 2.4;
        for (let j = 0; j < nSub; j++) {
          const sb = p.sub[j], r = R * sb.k, x = p.x + sb.dx * R, y = p.y + sb.dy * R;
          if (pass === 0) {
            if (shade) { g.globalAlpha = a * 0.4; g.drawImage(this.sprite2, x - r + r * 0.12, y - r + r * 0.22, r * 2, r * 2); }
            g.globalAlpha = a * 0.9; g.drawImage(this.sprite3, x - r * 1.04, y - r * 1.04, r * 2.08, r * 2.08);
          } else {
            g.globalAlpha = Math.min(1, a * 1.15); g.drawImage(this.sprite, x - r, y - r, r * 2, r * 2);
          }
        }
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.drawImage(pc, 0, 0, pw, ph, x0, y0, w, h);
  }
}
