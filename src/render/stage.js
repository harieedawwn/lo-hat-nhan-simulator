import { buildPlant } from './plant.js';
import { Camera } from './camera.js';
import { Scene } from './scene.js';
import { Flows } from './flows.js';
import { Labels } from './labels.js';
import { Lens } from './lens.js';
import { PARTS } from '../ui/parts.js';
import { FOCUS } from './geometry.js';

const NS = 'http://www.w3.org/2000/svg';

/** Sân khấu sơ đồ: SVG tĩnh + Canvas hạt + nhãn + kính lúp + camera. */
export class Stage {
  constructor(host, { onPick } = {}) {
    this.host = host; this.onPick = onPick || (() => {});
    host.innerHTML = `<svg id="svg" xmlns="${NS}" role="img" aria-label="Sơ đồ mặt cắt nhà máy điện hạt nhân PWR 1000 MW"><g id="cam">${buildPlant()}</g></svg>
<canvas id="fx" aria-hidden="true"></canvas>
<svg id="lab" xmlns="${NS}" aria-hidden="true"></svg>
<div id="vignette" aria-hidden="true"></div>
<div id="lensBox"><div class="lensHead"><b>Bên trong lõi lò</b><span id="lensK" class="num"></span><button id="lensClose" aria-label="Ẩn kính lúp">×</button></div><canvas id="lensCv" aria-label="Mô phỏng phản ứng dây chuyền ở mức hạt nhân"></canvas>
<ul class="lensLeg"><li><i style="background:#F08A24"></i>neutron nhanh</li><li><i style="background:#1D6FE0"></i>neutron chậm (nhiệt)</li><li><i style="background:#E0603C"></i>²³⁵U (phân hạch)</li><li><i style="background:#7B8AA3"></i>²³⁸U</li><li><i style="background:#2B3A55"></i>thanh điều khiển</li></ul></div>`;
    this.svg = host.querySelector('#svg'); this.cam = host.querySelector('#cam');
    this.fx = host.querySelector('#fx'); this.ctx = this.fx.getContext('2d');
    this.labSvg = host.querySelector('#lab');
    this.vign = host.querySelector('#vignette');
    this.quality = 2; this.dpr = 1; this.dirty = true;
    this.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.scene = new Scene(this.svg);
    this.flows = new Flows(2);
    this.labels = new Labels(this.labSvg, (p) => this.onPick(p));
    this.camera = new Camera(host, () => { this.dirty = true; });
    this.tagParts();
    this.addPlumeHit();
    host.addEventListener('click', (e) => {
      if (this.camera.dragged) { this.camera.dragged = false; return; }
      const el = e.target.closest ? e.target.closest('[data-part]') : null;
      if (el && el.dataset.part) this.onPick(el.dataset.part);
    });
    this.lensBox = host.querySelector('#lensBox'); this.lensK = host.querySelector('#lensK');
    this.lens = new Lens(host.querySelector('#lensCv'));
    this.lensLead = document.createElementNS(NS, 'g');
    this.lensLead.innerHTML = '<path id="lensLine" stroke="#1D5FA8" stroke-width="1.6" stroke-dasharray="5 4" fill="none"/><circle id="lensRing" r="15" fill="rgba(29,95,168,.10)" stroke="#1D5FA8" stroke-width="2"/>';
    this.labSvg.insertBefore(this.lensLead, this.labSvg.firstChild);
    this.lensFrame = 0; this.lensOn = true;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
  }
  tagParts() {
    // gán vòng cho từng bộ phận để làm nổi bật
    this.svg.querySelectorAll('.part').forEach((el) => {
      const p = PARTS[el.dataset.part]; if (!p) return;
      el.dataset.loop = el.dataset.part === 'steamgen' ? '12' : el.dataset.part === 'condenser' ? '23' : String(p.loop);
      el.setAttribute('tabindex', '-1');
    });
    this.svg.querySelectorAll('.pipe').forEach((el) => {
      const nested = !!el.parentElement.closest('.part');
      if (!nested) el.dataset.top = '1';
      el.dataset.loop = el.classList.contains('l1') ? '1' : el.classList.contains('l2') ? '2' : '3';
    });
  }
  addPlumeHit() {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', 1820); r.setAttribute('y', 60); r.setAttribute('width', 340); r.setAttribute('height', 400);
    r.setAttribute('fill', 'transparent'); r.setAttribute('class', 'part'); r.dataset.part = 'plume'; r.dataset.loop = '3';
    this.svg.querySelector('#towerGroup').appendChild(r);
  }
  setHighlight(n) { this.svg.dataset.hl = n ? String(n) : ''; this.svg.classList.toggle('hl', !!n); }
  setQuality(q) {
    this.quality = q; this.dpr = Math.min(window.devicePixelRatio || 1, [1, 1.5, 2][q]);
    this.flows.setQuality(q); this.lens?.setQuality(q); this.resize();
  }
  setPads(top, bottom, right) { this.pads = [top, bottom, right]; this.resize(); }
  resize() {
    const r = this.host.getBoundingClientRect();
    const w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
    this.cw = w; this.ch = h;
    this.svg.setAttribute('width', w); this.svg.setAttribute('height', h);
    this.labSvg.setAttribute('width', w); this.labSvg.setAttribute('height', h);
    this.fx.width = Math.round(w * this.dpr); this.fx.height = Math.round(h * this.dpr);
    this.fx.style.width = w + 'px'; this.fx.style.height = h + 'px';
    const [pt, pb, pr] = this.pads || [0, 0, 0];
    this.camera.resize(w, h, pt, pb, pr);
    this.dirty = true;
    if (this.lens) { const lw = Math.round(this.lensBox.querySelector('canvas').getBoundingClientRect().width) || 200; this.lens.resize(lw); }
  }
  warm(s, d) { this.flows.prewarm(s, d); }
  focus(name, ms = 700) { this.camera.focus(name, ms); }
  frame(s, d, dt, simDt) {
    this.camera.tick(dt);
    this.scene.update(s, d, simDt, this.quality);
    this.flows.setDrive(s, d);
    this.flows.update(simDt);
    if (this.lensOn) {
      this.lens.update(simDt, s);
      if ((this.lensFrame++ & 1) === 0 || this.quality > 1) this.lens.draw(s);
      this.lensKTxt(s);
      this.lensLeadUpdate();
    }
    const c = this.camera;
    if (this.dirty) {
      this.cam.setAttribute('transform', `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${c.s.toFixed(4)})`);
      this.labels.layout(c, this.cw, this.ch, this.obstacles());
      this.dirty = false;
    }
    const ctx = this.ctx, k = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.fx.width, this.fx.height);
    ctx.setTransform(k * c.s, 0, 0, k * c.s, k * c.x, k * c.y);
    this.flows.draw(ctx, c);
    this.flows.drawPlume(ctx, c, k);
    // viền đỏ khi quá nhiệt / SCRAM
    const red = s.status === 'overheat' || s.status === 'scram';
    this.vign.style.opacity = red ? (this.reduce ? '0.7' : (0.55 + 0.45 * Math.sin(performance.now() / (s.status === 'overheat' ? 110 : 260))).toFixed(2)) : '0';
  }
  obstacles() {
    const h = this.host.getBoundingClientRect(), out = [];
    for (const sel of ['#lensBox', '.hlbar', '.focusbar', '#legend', '.chip']) {
      const el = (sel === '#lensBox' ? this.host : this.host.parentElement).querySelector(sel);
      if (!el || el.offsetParent === null) continue;
      const r = el.getBoundingClientRect(); if (r.width < 2) continue;
      out.push({ x: r.left - h.left - 4, y: r.top - h.top - 4, w: r.width + 8, h: r.height + 8 });
    }
    return out;
  }
  lensKTxt(s) { const v = 'k = ' + s.k.toFixed(3).replace('.', ','); if (v !== this._k) { this._k = v; this.lensK.textContent = v; } }
  lensLeadUpdate() {
    const b = this.lensBox.getBoundingClientRect(), h = this.host.getBoundingClientRect();
    const cv = this.lensBox.querySelector('canvas').getBoundingClientRect();
    const cx = cv.left - h.left + cv.width / 2, cy = cv.top - h.top + cv.height / 2, r = cv.width / 2;
    const c = this.coreScreen(), dx = c.x - cx, dy = c.y - cy, L = Math.hypot(dx, dy) || 1;
    const ring = Math.max(10, Math.min(30, 17 * this.camera.s));
    const ex = c.x - (dx / L) * ring, ey = c.y - (dy / L) * ring;
    this.lensLead.firstChild.setAttribute('d', `M${(cx + dx / L * r).toFixed(1)},${(cy + dy / L * r).toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`);
    const rg = this.lensLead.lastChild; rg.setAttribute('cx', c.x.toFixed(1)); rg.setAttribute('cy', c.y.toFixed(1)); rg.setAttribute('r', ring.toFixed(1));
  }
  setLens(on) { this.lensOn = on; this.lensBox.style.display = on ? '' : 'none'; this.lensLead.style.display = on ? '' : 'none'; if (on) this.resize(); }
  live(s, d) { this.labels.updateLive(s, d); }
  /** tâm lõi lò trên màn hình (để vẽ đường nối tới kính lúp) */
  coreScreen() { const c = this.camera; return { x: c.x + c.s * 250, y: c.y + c.s * 700 }; }
}
