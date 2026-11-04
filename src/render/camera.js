import { W, H, FOCUS } from './geometry.js';

/** Camera 2D: chuyển động (x,y,s), kéo/nhả, vuốt 2 ngón, lăn chuột; giới hạn hợp lý. */
export class Camera {
  constructor(host, onChange) {
    this.host = host; this.onChange = onChange;
    this.x = 0; this.y = 0; this.s = 1; this.cw = 800; this.ch = 600;
    this.minS = 0.2; this.maxS = 4; this.anim = null; this.focusName = 'overview';
    this.ptrs = new Map(); this.last = null; this.padTop = 0; this.padBottom = 0; this.padRight = 0;
    host.style.touchAction = 'none';
    host.addEventListener('pointerdown', (e) => this.down(e));
    host.addEventListener('pointermove', (e) => this.move(e));
    host.addEventListener('pointerup', (e) => this.up(e));
    host.addEventListener('pointercancel', (e) => this.up(e));
    host.addEventListener('wheel', (e) => { e.preventDefault(); this.cancel(); const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)); this.zoomAt(e.offsetX ?? e.clientX, e.offsetY ?? e.clientY, k); }, { passive: false });
    host.addEventListener('dblclick', (e) => { if (e.target.closest && e.target.closest('[data-part]') && this.s > 0.8) return; this.cancel(); this.zoomAt(e.offsetX, e.offsetY, 1.6); });
    this.dragged = false;
  }
  resize(w, h, padTop = 0, padBottom = 0, padRight = 0) {
    this.cw = w; this.ch = h; this.padTop = padTop; this.padBottom = padBottom; this.padRight = padRight;
    this.minS = this.fitScale(FOCUS.overview) * 0.85;
    this.maxS = Math.max(2.2, this.fitScale(FOCUS.overview) * 7);
    if (!this.inited && w > 120 && h > 120) { this.inited = true; this.focus(this.initialFocus || 'overview', 0); }
    else if (this.inited) { this.clamp(); this.onChange(); }
  }
  viewH() { return Math.max(60, this.ch - this.padTop - this.padBottom); }
  viewW() { return Math.max(60, this.cw - this.padRight); }
  fitScale(r) { return Math.min(this.viewW() / r.w, this.viewH() / r.h); }
  focus(name, ms = 700) {
    this.focusName = name;
    const r = FOCUS[name]; if (!r) return;
    let s = this.fitScale(r);
    if (name === 'overview') s = Math.min(s, this.viewW() / W);
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    this.to(s, this.viewW() / 2 - cx * s, this.padTop + this.viewH() / 2 - cy * s, ms);
  }
  to(s, x, y, ms) {
    s = Math.max(this.minS, Math.min(this.maxS, s));
    if (!ms) { this.s = s; this.x = x; this.y = y; this.clamp(); this.onChange(); return; }
    this.anim = { s0: this.s, x0: this.x, y0: this.y, s1: s, x1: x, y1: y, t: 0, d: ms / 1000 };
  }
  cancel() { this.anim = null; }
  tick(dt) {
    const a = this.anim; if (!a) return false;
    a.t += dt; let u = Math.min(1, a.t / a.d); u = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    this.s = a.s0 + (a.s1 - a.s0) * u; this.x = a.x0 + (a.x1 - a.x0) * u; this.y = a.y0 + (a.y1 - a.y0) * u;
    if (a.t >= a.d) this.anim = null;
    this.onChange(); return true;
  }
  clamp() {
    const s = this.s, vw = this.viewW(), vh = this.viewH(), m = 0.15;
    const ww = W * s, hh = H * s;
    // giữ ít nhất một phần thế giới trong khung
    const minX = vw - ww - vw * m, maxX = vw * m;
    this.x = ww < vw ? (vw - ww) / 2 + Math.max(-vw * m, Math.min(vw * m, this.x - (vw - ww) / 2)) : Math.max(minX, Math.min(maxX, this.x));
    const minY = this.padTop + vh - hh - vh * m, maxY = this.padTop + vh * m - 90 * s;
    this.y = Math.max(minY, Math.min(maxY, this.y));
  }
  zoomAt(px, py, k) {
    const s1 = Math.max(this.minS, Math.min(this.maxS, this.s * k)); k = s1 / this.s;
    this.x = px - (px - this.x) * k; this.y = py - (py - this.y) * k; this.s = s1;
    this.focusName = ''; this.clamp(); this.onChange();
  }
  down(e) {
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.dragged = false; this.cancel();
    if (this.ptrs.size === 2) { const [a, b] = [...this.ptrs.values()]; this.pd = Math.hypot(a.x - b.x, a.y - b.y); }
  }
  move(e) {
    const p = this.ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (this.ptrs.size === 1) {
      if (!this.dragged && Math.hypot(dx, dy) < 4) return;
      if (!this.dragged) { try { this.host.setPointerCapture(e.pointerId); } catch (_) {} } this.dragged = true; this.x += dx; this.y += dy; this.focusName = ''; this.clamp(); this.onChange();
      p.x = e.clientX; p.y = e.clientY;
    } else if (this.ptrs.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...this.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = this.host.getBoundingClientRect();
      if (this.pd) this.zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / this.pd);
      this.pd = d; this.dragged = true;
    }
  }
  up(e) { this.ptrs.delete(e.pointerId); this.pd = 0; }
}
