import { SCRAM_TIME } from '../sim/model.js';
import { ROTOR } from './plant_hall.js';

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

const COL_N = '#D2463F', COL_S = '#2F67B8';
/** Độ sáng cánh theo cosφ (mép tối → giữa sáng). */
const SHADE = ['#55647D', '#6A7A93', '#8192AB', '#98A8BF', '#B0BED1', '#C6D1E0', '#D8E1EC', '#E6ECF4'];
/** Cập nhật các phần tử SVG tĩnh theo trạng thái mô hình. */
export class Scene {
  constructor(root) {
    this.root = root;
    this.rods = [...root.querySelectorAll('.rodset')];
    this.asm = [...root.querySelectorAll('.asm')];
    this.el = {};
    for (const id of ['cher', 'vesselAlarm', 'bcnA', 'bcnAg', 'bcnR', 'bcnRg', 'imp1', 'imp2', 'imp3', 'genTop', 'genBot', 'genTxtTop', 'genTxtBot', 'blurHP', 'blurLP', 'vTSV', 'vDump', 'sgHeat', 'przHeat', 'sgSteamTint']) this.el[id] = $(id);
    this.rot = { imp1: 0, imp2: 0, imp3: 0 };
    this.theta = 0; this.lastHeat = -1; this.t = 0;
    // các phần tử cánh tạo sẵn một lần; mỗi khung chỉ đặt lại transform/fill
    const bb = [...root.querySelectorAll('path.bb')], bf = [...root.querySelectorAll('path.bf')];
    let k = 0;
    this.stages = ROTOR.stages.map((st) => { const n = (st.N >> 1) + 2, o = { ...st, back: bb.slice(k, k + n), front: bf.slice(k, k + n) }; k += n; return o; });
    this.genState = '';
    this.reduce = false;
  }
  /** Trống rôto giả 3D: cánh ở góc φ = θ + 2πi/N trượt quanh trống; rôto máy phát 2 cực N/S. */
  rotor(th, quality) {
    if (th === this._th && quality === this._q) return; // trục đứng yên → không cần cập nhật DOM
    this._th = th; this._q = quality;
    const AX = ROTOR.AX, R = ROTOR.R, step = quality === 0 ? 2 : 1;
    for (const st of this.stages) {
      let nf = 0, nb = 0;
      const R2 = R + st.len;
      for (let i = 0; i < st.N; i += step) {
        const ph = th + (2 * Math.PI * i) / st.N, c = Math.cos(ph), sn = Math.sin(ph);
        // gốc cánh trên mặt trống, đỉnh cánh; bề dày theo y (phương tiếp tuyến) nhân |cosφ|
        const yR = AX - R * sn, dy = -st.len * sn, b = st.b * c;
        if (c >= 0) {
          const el = st.front[nf++]; if (!el) continue;
          el.setAttribute('transform', `matrix(${st.a},${b.toFixed(2)},0,${dy.toFixed(2)},${st.x},${yR.toFixed(2)})`);
          el.setAttribute('fill', SHADE[Math.min(SHADE.length - 1, (c * SHADE.length) | 0)]);
        } else {
          if (Math.abs(R2 * sn) <= R) continue; // khuất hoàn toàn sau trống
          const el = st.back[nb++]; if (!el) continue;
          el.setAttribute('transform', `matrix(${st.a},${b.toFixed(2)},0,${dy.toFixed(2)},${st.x},${yR.toFixed(2)})`);
        }
      }
      for (; nf < st.front.length; nf++) if (st.front[nf].getAttribute('transform') !== 'scale(0)') st.front[nf].setAttribute('transform', 'scale(0)');
      for (; nb < st.back.length; nb++) if (st.back[nb].getAttribute('transform') !== 'scale(0)') st.back[nb].setAttribute('transform', 'scale(0)');
    }
    // máy phát: điểm mặt trụ ở góc ψ thuộc cực N nếu cos(ψ − θ) > 0; ranh giới nhìn ngang nằm ở y = AX ∓ R·cosθ
    const G = ROTOR.gen, e = this.el, topN = Math.sin(th) >= 0;
    const yb = AX + (topN ? 1 : -1) * G.R * Math.cos(th);
    const hTop = Math.max(0, yb - (AX - G.R)), hBot = 2 * G.R - hTop;
    e.genTop.setAttribute('height', hTop.toFixed(2));
    e.genBot.setAttribute('y', yb.toFixed(2)); e.genBot.setAttribute('height', hBot.toFixed(2));
    const st = topN ? 'N' : 'S';
    if (st !== this.genState) {
      this.genState = st;
      e.genTop.setAttribute('fill', topN ? COL_N : COL_S); e.genBot.setAttribute('fill', topN ? COL_S : COL_N);
      e.genTxtTop.textContent = topN ? 'N' : 'S'; e.genTxtBot.textContent = topN ? 'S' : 'N';
    }
    e.genTxtTop.setAttribute('y', ((AX - G.R + yb) / 2 + 4.3).toFixed(2));
    e.genTxtTop.setAttribute('opacity', Math.min(1, Math.max(0, (hTop - 7) / 14)).toFixed(2));
    e.genTxtBot.setAttribute('y', ((yb + AX + G.R) / 2 + 4.3).toFixed(2));
    e.genTxtBot.setAttribute('opacity', Math.min(1, Math.max(0, (hBot - 7) / 14)).toFixed(2));
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
    // một trục chung: HP, LP, máy phát cùng góc θ; 3000 vòng/phút → quay chậm minh hoạ 0,8 vòng/s
    this.theta = (this.theta + 2 * Math.PI * 0.8 * Math.min(1.2, rr) * dt) % (2 * Math.PI);
    this.rotor(this.theta, quality);
    const blur = Math.max(0, Math.min(1, (rr - 0.3) / 0.7)) * 0.1;
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
