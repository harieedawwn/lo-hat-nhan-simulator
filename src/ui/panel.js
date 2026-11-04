import { fmt, fmtSci } from '../sim/format.js';
import { calcCorner } from '../sim/calc.js';
import { canRecover } from '../sim/model.js';

const $ = (id) => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const polar = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
const arc = (cx, cy, r, a0, a1) => { const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1); return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`; };

const ICONS = {
  ok: '<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="15" fill="#2E8B57"/><path d="M10 17.5l5 5 9-10" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg viewBox="0 0 34 34"><path d="M17 3L32 30H2z" fill="#C98A12" stroke="#C98A12" stroke-width="2" stroke-linejoin="round"/><path d="M17 12v9M17 25v.01" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>',
  bad: '<svg viewBox="0 0 34 34"><path d="M11 2h12l9 9v12l-9 9H11L2 23V11z" fill="#C62828"/><path d="M17 9v10M17 24v.01" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>',
  scram: '<svg viewBox="0 0 34 34"><path d="M17 2l13 7.5v15L17 32 4 24.5v-15z" fill="#8E1B1B"/><rect x="11" y="9" width="12" height="16" rx="2" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M14 9v13M17 9v16M20 9v13" stroke="#fff" stroke-width="2.2"/></svg>',
};
const TITLES = { normal: 'Bình thường', warning: 'Cảnh báo', overheat: 'Quá nhiệt', scram: 'Dập lò khẩn cấp (SCRAM)' };

export class Panel {
  constructor() {
    this.c = {};
    this.buildGauge(); this.buildTherm(); this.buildKScale();
    this.trend = $('trend'); this.tctx = this.trend.getContext('2d');
    this.N = 300; this.hTh = new Float32Array(this.N); this.hEl = new Float32Array(this.N); this.hT = new Float32Array(this.N);
    this.hn = 0; this.lastPush = -1; this.lastDraw = 0;
    this.lastStatus = ''; this.txt = {};
  }
  setText(id, v) { if (this.txt[id] !== v) { this.txt[id] = v; const e = this.c[id] || (this.c[id] = $(id)); e.textContent = v; } }
  setW(sel, v) { const e = this.c[sel] || (this.c[sel] = document.querySelector(sel)); const w = Math.max(0, Math.min(100, v)).toFixed(1) + '%'; if (this.txt[sel] !== w) { this.txt[sel] = w; e.style.setProperty('--w', w); e.style.width = w; } }

  buildGauge() {
    const g = $('gauge'), cx = 120, cy = 122, r = 84, A0 = 135, A1 = 405, MAX = 1200;
    const ang = (v) => A0 + ((A1 - A0) * v) / MAX;
    let h = `<path d="${arc(cx, cy, r, A0, A1)}" fill="none" stroke="#E4E9F0" stroke-width="16" stroke-linecap="round"/>`;
    h += `<path d="${arc(cx, cy, r, ang(1000), ang(1100))}" fill="none" stroke="#F2C76A" stroke-width="16" opacity=".55"/><path d="${arc(cx, cy, r, ang(1100), A1 - 0.01)}" fill="none" stroke="#E88B8B" stroke-width="16" opacity=".6"/>`;
    h += `<path id="gArc" d="" fill="none" stroke="#12919A" stroke-width="16" stroke-linecap="round"/>`;
    for (let v = 0; v <= MAX; v += 100) {
      const major = v % 200 === 0, [x0, y0] = polar(cx, cy, r + 11, ang(v)), [x1, y1] = polar(cx, cy, r + (major ? 17 : 14), ang(v));
      h += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)}" stroke="#6B7A93" stroke-width="${major ? 1.6 : 1}"/>`;
      if (major) { const [tx, ty] = polar(cx, cy, r + 28, ang(v)); h += `<text x="${tx.toFixed(1)}" y="${(ty + 3.5).toFixed(1)}" text-anchor="middle" font-size="10" fill="#4A5A75" font-family="Be Vietnam Pro,sans-serif" font-weight="600">${fmt(v)}</text>`; }
    }
    const [mx, my] = polar(cx, cy, r - 14, ang(1000)); const [m2x, m2y] = polar(cx, cy, r - 24, ang(1000));
    h += `<path d="M${mx.toFixed(1)},${my.toFixed(1)} L${m2x.toFixed(1)},${m2y.toFixed(1)}" stroke="#C99A3E" stroke-width="3.2" stroke-linecap="round"/>`;
    h += `<g id="gNeedle"><path d="M0,-3 L${r - 12},0 L0,3z" fill="#14213D"/></g><circle cx="${cx}" cy="${cy}" r="7" fill="#14213D"/><circle cx="${cx}" cy="${cy}" r="2.6" fill="#fff"/>`;
    h += `<text id="gVal" x="${cx}" y="${cy + 38}" text-anchor="middle" font-size="26" font-weight="700" fill="#14213D" font-family="Be Vietnam Pro,sans-serif" style="font-variant-numeric:tabular-nums">1 000</text>`;
    h += `<text x="${cx}" y="${cy + 54}" text-anchor="middle" font-size="12" fill="#66758F" font-family="Be Vietnam Pro,sans-serif" font-weight="600">MW điện</text>`;
    g.innerHTML = h; this.gMax = MAX; this.gA0 = A0; this.gA1 = A1; this.gc = [cx, cy, r];
  }
  updGauge(pe) {
    const [cx, cy, r] = this.gc, v = Math.max(0, Math.min(this.gMax, pe)), a = this.gA0 + ((this.gA1 - this.gA0) * v) / this.gMax;
    const arcEl = this.c.gArc || (this.c.gArc = $('gArc'));
    arcEl.setAttribute('d', v < 3 ? '' : arc(cx, cy, r, this.gA0, Math.max(this.gA0 + 0.5, a)));
    arcEl.setAttribute('stroke', v > 1100 ? '#C62828' : v > 1030 ? '#C98A12' : '#12919A');
    (this.c.gNeedle || (this.c.gNeedle = $('gNeedle'))).setAttribute('transform', `translate(${cx},${cy}) rotate(${a.toFixed(2)})`);
    this.setText('gVal', fmt(pe));
  }
  buildTherm() {
    const x0 = 14, x1 = 306, W = x1 - x0;
    const mx = (T) => x0 + ((T - 40) / 310) * W, zx = (T) => x0 + ((T - 280) / 70) * W;
    const zones = [[40, 280, '#BBD3EC'], [280, 325.5, '#9ED3B1'], [325.5, 327.5, '#F2C76A'], [327.5, 345, '#E88B8B'], [345, 350, '#8E1B1B']];
    let h = '';
    for (const [a, b, c] of zones) h += `<rect x="${mx(a).toFixed(1)}" y="34" width="${(mx(b) - mx(a)).toFixed(1)}" height="16" fill="${c}"/>`;
    h += `<rect x="${x0}" y="34" width="${W}" height="16" rx="3" fill="none" stroke="#14213D" stroke-opacity=".5"/>`;
    for (let T = 50; T <= 350; T += 50) h += `<path d="M${mx(T).toFixed(1)},50 v4" stroke="#4A5A75"/><text x="${mx(T).toFixed(1)}" y="64" font-size="9.5" text-anchor="middle" fill="#4A5A75" font-family="Be Vietnam Pro,sans-serif">${T}</text>`;
    h += `<path d="M${mx(345).toFixed(1)},28 V52" stroke="#8E1B1B" stroke-width="2"/><text x="${x1}" y="20" font-size="10" text-anchor="end" fill="#8E1B1B" font-weight="700" font-family="Be Vietnam Pro,sans-serif">345 °C – điểm sôi ở 155 bar</text>`;
    h += `<text x="${x0}" y="20" font-size="10" fill="#4A5A75" font-family="Be Vietnam Pro,sans-serif" font-weight="600">40–350 °C</text>`;
    h += `<path d="M${zx(280).toFixed(1)},52 L${x0},96 M${zx(350).toFixed(1)},52 L${x1},96" stroke="#6B7A93" stroke-width="1" stroke-dasharray="3 3"/><path d="M${mx(280).toFixed(1)},34 v-6 h${(mx(350) - mx(280)).toFixed(1)} v6" fill="none" stroke="#6B7A93" stroke-width="1"/>`;
    for (const [a, b, c] of zones) { const aa = Math.max(280, a), bb = Math.min(350, b); if (bb > aa) h += `<rect x="${zx(aa).toFixed(1)}" y="100" width="${(zx(bb) - zx(aa)).toFixed(1)}" height="26" fill="${c}"/>`; }
    h += `<rect x="${x0}" y="100" width="${W}" height="26" rx="3" fill="none" stroke="#14213D" stroke-opacity=".5"/>`;
    for (let T = 280; T <= 350; T += 10) h += `<path d="M${zx(T).toFixed(1)},126 v5" stroke="#4A5A75"/><text x="${zx(T).toFixed(1)}" y="143" font-size="9.5" text-anchor="middle" fill="#4A5A75" font-family="Be Vietnam Pro,sans-serif">${T}</text>`;
    h += `<path d="M${zx(345).toFixed(1)},100 V126" stroke="#8E1B1B" stroke-width="2"/>`;
    h += `<text x="${x0}" y="165" font-size="10" fill="#4A5A75" font-family="Be Vietnam Pro,sans-serif" font-weight="600">Phóng đại 280–350 °C (từng 1 °C nhìn thấy được)</text>`;
    h += `<text x="${zx(326.5).toFixed(1)}" y="117" font-size="9" text-anchor="middle" fill="#14213D" opacity=".75" font-family="Be Vietnam Pro,sans-serif">giới hạn</text>`;
    // đánh dấu
    const mk = (id, fill, shape) => `<g id="${id}">${shape}</g>`;
    h += mk('mHotA', '', `<path d="M0,0 l-6,-11 h12z" fill="#A3162E" stroke="#fff" stroke-width="1.2"/>`);
    h += mk('mColdA', '', `<path d="M0,0 l-5.5,-5.5 l5.5,-5.5 l5.5,5.5z" fill="#E5645B" stroke="#fff" stroke-width="1.2"/>`);
    h += mk('mHotB', '', `<path d="M0,0 l-7,-12 h14z" fill="#A3162E" stroke="#fff" stroke-width="1.2"/>`);
    h += mk('mColdB', '', `<path d="M0,0 l-6,-6 l6,-6 l6,6z" fill="#E5645B" stroke="#fff" stroke-width="1.2"/>`);
    $('therm').innerHTML = h;
    this.th = { mx, zx };
  }
  updTherm(tHot, tCold) {
    const { mx, zx } = this.th, cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const set = (id, x, y) => (this.c[id] || (this.c[id] = $(id))).setAttribute('transform', `translate(${x.toFixed(1)},${y})`);
    set('mHotA', mx(cl(tHot, 40, 350)), 34); set('mColdA', mx(cl(tCold, 40, 350)), 34);
    set('mHotB', zx(cl(tHot, 280, 350)), 100); set('mColdB', zx(cl(tCold, 280, 350)), 100);
  }
  buildKScale() {
    const a = 6, b = 214, kx = (k) => a + ((k - 0.85) / 0.17) * (b - a);
    $('kScale').innerHTML = `<defs><linearGradient id="kg"><stop offset="0" stop-color="#9DB9E0"/><stop offset=".88" stop-color="#C9D7EA"/><stop offset=".88" stop-color="#F2C76A"/><stop offset="1" stop-color="#E8A23A"/></linearGradient></defs><rect x="${a}" y="12" width="${b - a}" height="8" rx="4" fill="url(#kg)"/><path d="M${kx(1).toFixed(1)},8 v16" stroke="#14213D" stroke-width="2"/><text x="${a}" y="33" font-size="9" fill="#4A5A75" font-family="Be Vietnam Pro,sans-serif">0,85</text><text x="${kx(1).toFixed(1)}" y="33" font-size="9" fill="#14213D" text-anchor="middle" font-weight="700" font-family="Be Vietnam Pro,sans-serif">1</text><text x="${b}" y="33" font-size="9" fill="#4A5A75" text-anchor="end" font-family="Be Vietnam Pro,sans-serif">1,02</text><g id="kMark"><path d="M0,10 l-5,-9 h10z" fill="#1D5FA8"/></g>`;
    this.kx = kx;
  }
  updK(k) { (this.c.kMark || (this.c.kMark = $('kMark'))).setAttribute('transform', `translate(${this.kx(Math.max(0.85, Math.min(1.02, k))).toFixed(1)},0)`); }

  /** Cập nhật ~10 lần/giây */
  update(s, d, t, opts) {
    const calc = calcCorner(d.pFis, d.pTh, d.pe);
    // trạng thái
    const st = s.status, sc = (this.c.statusCard || (this.c.statusCard = $('statusCard')));
    let text = '';
    if (st === 'normal') {
      if (s.turb === 'rolling') text = `Đã đủ hơi: tuabin đang tăng tốc (${fmt(s.rpm)} vòng/phút), chờ hòa lưới 50 Hz.`;
      else if (s.p < 0.03) text = 'Lò đang dừng nóng, chưa có điện. Hãy rút thanh điều khiển để tăng công suất.';
      else if (s.k > 1.0005) text = 'k > 1: số neutron tăng, công suất đang tăng theo độ rút thanh.';
      else if (s.k < 0.9995) text = 'k < 1: số neutron giảm, công suất đang giảm.';
      else text = 'Tới hạn (k = 1): phản ứng dây chuyền ổn định, đã hòa lưới 50 Hz.';
    } else if (st === 'warning') text = 'Công suất vượt 103 % hoặc nhiệt độ nhánh nóng quá 325,5 °C. Hãy đưa bớt thanh điều khiển vào.';
    else if (st === 'overheat') text = `Công suất > 110 % hoặc T > 327,5 °C. Hệ thống bảo vệ sẽ tự động dập lò sau ${Math.max(0, Math.ceil(s.countdown))} s.`;
    else {
      const why = s.scramReason === 'auto' ? 'Hệ thống bảo vệ tự động dập lò. ' : s.scramReason === 'prompt' ? 'Công suất ≥ 118 %: tắt lò tức thì. ' : 'Đã bấm SCRAM. ';
      text = why + `Thanh rơi vào lõi, phản ứng dây chuyền dừng; dư nhiệt phân rã vẫn ≈ ${fmt(d.pDecay)} MW nên bơm và làm mát tiếp tục chạy.`;
    }
    if (st !== this.lastStatus) {
      this.lastStatus = st;
      sc.className = 'card st ' + { normal: 'st-ok', warning: 'st-warn', overheat: 'st-bad', scram: 'st-scram' }[st];
      sc.querySelector('.st-ico').innerHTML = ICONS[{ normal: 'ok', warning: 'warn', overheat: 'bad', scram: 'scram' }[st]];
      this.setText('stTitle', TITLES[st]);
      opts.announce(TITLES[st] + (st === 'scram' ? '. Thanh điều khiển đang rơi.' : ''));
    }
    this.setText('stText', text);
    const cd = $('stCount');
    if (st === 'overheat') { cd.hidden = false; this.setText('stCount', String(Math.max(0, Math.ceil(s.countdown)))); } else if (!cd.hidden) cd.hidden = true;
    // thanh điều khiển
    this.setText('peQuick', fmt(d.pe));
    this.setText('rodT', fmt(s.rodTarget, s.rodTarget % 1 ? 1 : 0)); this.setText('rodA', fmt(s.rod, 1));
    const rec = $('btnRecover'), can = canRecover(s);
    if (rec.disabled === can) rec.disabled = !can;
    const slider = $('rodSlider'); if (slider.disabled !== s.scram) slider.disabled = s.scram;
    let hint = '';
    if (s.scram) hint = can ? 'Nhà máy đã ổn định. Bấm “Khôi phục”; thanh vẫn ở 0 % – rút lại từ từ để khởi động.' : `Chờ ổn định để khôi phục: p_f < 1 % (hiện ${fmt(s.pf * 100, 1)} %) và T_nóng < ${fmt(294)} °C (hiện ${fmt(s.tHot, 0)} °C).`;
    this.setText('recoverHint', hint);
    // chuỗi năng lượng
    this.setText('hTh', fmt(d.pTh)); this.setW('#chain [data-k=th] .bar i', (d.pTh / 3750) * 100);
    this.setText('hSt', fmt(d.steam)); this.setText('hStP', fmt(d.pSteam, 0)); this.setW('#chain [data-k=st] .bar i', (d.steam / 2070) * 100);
    this.setText('hTb', fmt(d.rpm)); this.setW('#chain [data-k=tb] .bar i', (d.rpm / 3000) * 100);
    this.setText('hEl', fmt(d.pe)); this.setW('#chain [data-k=el] .bar i', (d.pe / 1250) * 100);
    const sy = $('hSync'), synced = s.breaker; const cls = synced ? 'chipSync' : s.turb === 'rolling' ? 'chipSync mid' : 'chipSync no';
    if (sy.className !== cls) sy.className = cls; this.setText('hSync', synced ? 'đã hòa lưới' : 'chưa hòa lưới');
    this.updGauge(d.pe);
    // nhiệt độ
    this.updTherm(d.tHot, d.tCold);
    this.setText('tHot', fmt(d.tHot, 1)); this.setText('tCold', fmt(d.tCold, 1)); this.setText('pPrim', fmt(d.pPrim, 1));
    // k
    this.setText('kVal', fmt(d.k, 3)); this.updK(d.k);
    const kc = $('kChip'); const kl = d.kLabel, kcls = 'kchip' + (kl === 'Vượt tới hạn' ? ' up' : kl === 'Dưới tới hạn' ? ' dn' : '');
    if (kc.className !== kcls) kc.className = kcls; this.setText('kChip', kl);
    // phân hạch vs phân rã
    const tot = Math.max(1, d.pFisHeat + d.pDecay);
    this.setText('spF', fmt(d.pFisHeat)); this.setText('spD', fmt(d.pDecay));
    this.setW('.split .sf', (d.pFisHeat / 3750) * 100); this.setW('.split .sd', (d.pDecay / 3750) * 100);
    // cân bằng năng lượng
    this.setW('.ebar .ee', (d.pe / 3750) * 100); this.setW('.ebar .ew', (d.waste / 3750) * 100);
    this.setText('ebTxt', `${fmt(d.pTh)} MW nhiệt = ${fmt(d.pe)} MW điện + ${fmt(d.waste)} MW thải ra môi trường · η = ${fmt(d.eta * 100, 1)} %`);
    // góc tính toán
    this.setText('cN', fmtSci(calc.N) + ' phân hạch/s');
    this.setText('cU', fmt(calc.uKgDay, 2) + ' kg/ngày');
    this.setText('cM', fmt(calc.massGDay, 2) + ' g/ngày');
    this.setText('cC', fmt(calc.coalTDay) + ' tấn/ngày');
    this.setText('cE', fmt(calc.eta * 100, 1) + ' %');
    this.setText('cW', fmt(calc.waste) + ' MW');
    // biểu đồ
    if (t - this.lastPush >= 0.2) {
      this.lastPush = t;
      const i = this.hn % this.N; this.hTh[i] = s.p * 100; this.hEl[i] = (d.pe / 1000) * 100; this.hT[i] = d.tHot; this.hn++;
      this.drawTrend();
      this.setText('lgTh', fmt(d.pTh) + ' MW'); this.setText('lgEl', fmt(d.pe) + ' MW'); this.setText('lgT', fmt(d.tHot, 1) + ' °C');
    }
  }
  clearTrend() { this.hn = 0; this.lastPush = -1; this.drawTrend(); }
  drawTrend() {
    const cv = this.trend, r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(120, Math.round(r.width)), h = Math.round(w * 150 / 320);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = this.tctx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const L = 30, R = w - 34, T = 8, B = h - 18, X = (i) => L + (i / (this.N - 1)) * (R - L);
    g.font = '10px "Be Vietnam Pro",sans-serif'; g.textBaseline = 'middle';
    g.strokeStyle = '#E2E7EE'; g.fillStyle = '#66758F'; g.lineWidth = 1;
    for (let p = 0; p <= 120; p += 20) { const y = B - (p / 130) * (B - T); g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke(); g.textAlign = 'right'; g.fillText(p, L - 4, y); }
    g.textAlign = 'left'; for (let tt = 280; tt <= 340; tt += 20) { const y = B - ((tt - 280) / 60) * (B - T); g.fillText(tt, R + 4, y); }
    g.textAlign = 'center'; for (let s = 0; s <= 60; s += 20) g.fillText(s === 60 ? '−60 s' : s === 0 ? '0' : '−' + (60 - s), L + (s / 60) * (R - L), B + 9);
    g.save(); g.fillStyle = '#9AA6B8'; g.textAlign = 'left'; g.fillText('% định mức', L + 2, T + 2); g.restore();
    const n = Math.min(this.hn, this.N);
    const line = (arr, map, col, dash, wd = 2) => {
      if (n < 2) return; g.beginPath(); g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash); g.lineJoin = 'round';
      for (let k = 0; k < n; k++) { const idx = (this.hn - n + k) % this.N, x = X(this.N - n + k), y = map(arr[idx]); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.setLineDash([]);
    };
    line(this.hT, (v) => B - Math.max(0, Math.min(1.02, (v - 280) / 60)) * (B - T), '#1F3A6B', [2, 3], 1.8);
    line(this.hEl, (v) => B - Math.min(1.1, v / 130) * (B - T), '#D79A1C', [6, 4], 2.2);
    line(this.hTh, (v) => B - Math.min(1.1, v / 130) * (B - T), '#B53A4B', [], 2.4);
  }
}
