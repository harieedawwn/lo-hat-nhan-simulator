import { SCRAM_TIME } from '../sim/model.js';

const $ = (id) => document.getElementById(id);
const ROD_TRAVEL = 172;

const STOPS = [[0, [92, 112, 142]], [0.22, [58, 160, 168]], [0.5, [138, 202, 106]], [0.78, [244, 198, 72]], [1.0, [242, 138, 46]], [1.25, [214, 52, 30]]];
export function heatRGB(p) {
  p = Math.max(0, Math.min(1.25, p));
  for (let i = 1; i < STOPS.length; i++) {
    if (p <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], u = (p - a) / (b - a);
      return [ca[0] + (cb[0] - ca[0]) * u, ca[1] + (cb[1] - ca[1]) * u, ca[2] + (cb[2] - ca[2]) * u];
    }
  }
  return STOPS[STOPS.length - 1][1];
}
export const heatCss = (p) => { const c = heatRGB(p); return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; };

/** Cập nhật các phần tử SVG tĩnh theo trạng thái mô hình. */
export class Scene {
  constructor(root) {
    this.root = root;
    this.rods = [...root.querySelectorAll('.rodset')];
    this.asm = [...root.querySelectorAll('.asm')];
    this.el = {};
    for (const id of ['cher', 'vesselAlarm', 'bcnA', 'bcnAg', 'bcnR', 'bcnRg', 'imp1', 'imp2', 'imp3', 'strHP', 'strLP', 'strGen', 'blurHP', 'blurLP', 'vTSV', 'vDump', 'sgHeat', 'przHeat', 'sgSteamTint']) this.el[id] = $(id);
    this.rot = { imp1: 0, imp2: 0, imp3: 0 };
    this.stripe = 0; this.lastHeat = -1; this.t = 0;
    this.reduce = false;
  }
  update(s, d, dt, quality) {
    this.t += dt;
    const e = this.el;
    // thanh điều khiển (rơi + nảy tắt dần sau SCRAM)
    let rod = s.rod;
    if (s.scram && s.scramT > SCRAM_TIME && s.scramT < SCRAM_TIME + 1.2) {
      const u = s.scramT - SCRAM_TIME; rod = 3.2 * Math.exp(-u * 6) * Math.abs(Math.sin(u * 13));
    }
    const ty = (-ROD_TRAVEL * rod / 100).toFixed(2);
    for (const r of this.rods) r.setAttribute('transform', `translate(0,${ty})`);
    // màu nhiệt của lõi (trực quan hoá, không phải màu thật)
    const ins = 1 - s.rod / 100;
    const prof = [0.82, 1.0, 1.08, 1.0, 0.82];
    const key = (s.p * 400 | 0) + (ins * 100 | 0) * 1000;
    if (key !== this.lastHeat) {
      this.lastHeat = key;
      for (let i = 0; i < 5; i++) {
        const near = i % 2 === 0 ? 1 - 0.38 * ins : 1;
        this.asm[i].setAttribute('fill', heatCss(s.p * prof[i] * near));
      }
    }
    e.cher.setAttribute('opacity', (0.5 * Math.min(1, s.pf)).toFixed(2));
    // quay bơm
    const w = dt * 60;
    this.rot.imp1 = (this.rot.imp1 + 260 * dt) % 360; e.imp1.setAttribute('transform', `translate(622,822) rotate(${this.rot.imp1.toFixed(1)})`);
    this.rot.imp2 = (this.rot.imp2 + 200 * dt * Math.min(1.2, 0.25 + s.steam / 1657)) % 360; e.imp2.setAttribute('transform', `translate(862,866) rotate(${this.rot.imp2.toFixed(1)})`);
    this.rot.imp3 = (this.rot.imp3 + 240 * dt) % 360; e.imp3.setAttribute('transform', `translate(2205,1020) rotate(${this.rot.imp3.toFixed(1)})`);
    // trục/tuabin
    const rr = s.rpm / 3000;
    this.stripe = (this.stripe + Math.min(70, rr * 70) * dt) % 24.4;
    const tr = `translate(${(-this.stripe).toFixed(2)},0)`;
    e.strHP.setAttribute('transform', tr); e.strLP.setAttribute('transform', tr); e.strGen.setAttribute('transform', tr);
    const blur = Math.max(0, Math.min(1, (rr - 0.12) / 0.5)) * 0.55;
    e.blurHP.setAttribute('opacity', blur.toFixed(2)); e.blurLP.setAttribute('opacity', blur.toFixed(2));
    // van
    const vOpen = (v, open) => { const b = v.firstElementChild; b.setAttribute('fill', open ? '#fff' : '#C62828'); };
    vOpen(e.vTSV, s.steamOk && !s.scram); vOpen(e.vDump, s.tripSeen && !s.steamOk && s.steam > 20);
    e.sgHeat.setAttribute('opacity', Math.min(1, s.p).toFixed(2));
    e.przHeat.setAttribute('opacity', (0.65 + 0.35 * Math.sin(this.t * 2)).toFixed(2));
    // trạng thái cảnh báo
    const pulse = 0.5 + 0.5 * Math.sin(this.t * (s.status === 'overheat' ? 9 : 5));
    const warn = s.status === 'warning', red = s.status === 'overheat' || s.status === 'scram';
    e.bcnAg.setAttribute('opacity', warn ? (0.35 + 0.65 * pulse).toFixed(2) : '0');
    e.bcnRg.setAttribute('opacity', red ? (0.3 + 0.7 * pulse).toFixed(2) : '0');
    e.vesselAlarm.setAttribute('opacity', red ? (0.25 + 0.75 * pulse).toFixed(2) : '0');
  }
}
