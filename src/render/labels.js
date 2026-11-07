import { fmt } from '../sim/format.js';

/** Nhãn tiếng Việt với đường dẫn; tự tránh chồng chéo theo độ ưu tiên (lớp màn hình). */
export const LABELS = [
  { id: 'containment', t: 'Vỏ bọc lò (bê tông + lót thép)', x: 100, y: 450, dirs: 'ul', p: 2, part: 'containment' },
  { id: 'rpv', t: 'Thùng lò áp lực', x: 172, y: 700, dirs: 'lu', p: 1, part: 'rpv', live: (s) => `${fmt0(s.pPrim)} bar` },
  { id: 'core', t: 'Lõi lò – bó nhiên liệu UO₂', x: 238, y: 760, dirs: 'dl', p: 1, part: 'core' },
  { id: 'rods', t: 'Thanh điều khiển + cơ cấu dẫn động', x: 218, y: 372, dirs: 'ul', p: 1, part: 'rods', live: (s, d) => `rút ${fmt1(s.rod)} %` },
  { id: 'prz', t: 'Bình điều áp', x: 430, y: 330, dirs: 'ur', p: 1, part: 'pressurizer' },
  { id: 'sg', t: 'Bình sinh hơi', x: 590, y: 420, dirs: 'ru', p: 1, part: 'steamgen' },
  { id: 'utube', t: 'Ống chữ U (ranh giới vòng 1 | vòng 2)', x: 536, y: 640, dirs: 'rd', p: 2, part: 'utubes' },
  { id: 'pump1', t: 'Bơm vòng 1', x: 640, y: 762, dirs: 'ru', p: 2, part: 'pump1' },
  { id: 'hot', t: 'Nhánh nóng', x: 398, y: 680, dirs: 'rl', p: 2, part: 'pipe1', live: (s) => `${fmt0(s.tHot)} °C` },
  { id: 'cold', t: 'Nhánh lạnh', x: 480, y: 862, dirs: 'dr', p: 2, part: 'pipe1', live: (s) => `${fmt0(s.tCold)} °C` },
  { id: 'rad', t: 'Khu vực có phóng xạ – vòng 1', x: 135, y: 650, dirs: 'ur', p: 2, part: 'radzone' },
  { id: 'steam', t: 'Đường hơi chính', x: 770, y: 420, dirs: 'rl', p: 2, part: 'steamline', live: (s) => `${fmt0(s.pSteam)} bar` },
  { id: 'hp', t: 'Tuabin cao áp', x: 850, y: 668, dirs: 'dl', p: 1, part: 'turbine' },
  { id: 'lp', t: 'Tuabin hạ áp', x: 1020, y: 596, dirs: 'ur', p: 1, part: 'turbine', live: (s) => `${fmt0(s.rpm)} vòng/phút` },
  { id: 'gen', t: 'Máy phát điện (cùng trục)', x: 1230, y: 592, dirs: 'ul', p: 1, part: 'generator' },
  { id: 'cond', t: 'Bình ngưng (ranh giới vòng 2 | vòng 3)', x: 1020, y: 790, dirs: 'dl', p: 1, part: 'condenser' },
  { id: 'feed', t: 'Bơm cấp nước', x: 860, y: 880, dirs: 'dl', p: 2, part: 'feedpump' },
  { id: 'dump', t: 'Đường xả hơi về bình ngưng', x: 850, y: 736, dirs: 'dl', p: 3, part: 'steamdump' },
  { id: 'bus', t: 'Thanh dẫn 24 kV', x: 1348, y: 540, dirs: 'udr', p: 2, part: 'busduct' },
  { id: 'tagIn', t: 'VÀO 24 kV · dòng lớn', x: 1404, y: 766, dirs: 'ldu', p: 3, part: 'transformer', sm: 1 },
  { id: 'tagOut', t: 'RA 500 kV · dòng nhỏ', x: 1446, y: 668, dirs: 'lu', p: 3, part: 'transformer', sm: 1 },
  { id: 'brk', t: 'Máy cắt điện', x: 1573, y: 708, dirs: 'dr', p: 2, part: 'switchyard' },
  { id: 'tr', t: 'Máy biến áp tăng áp (24 kV → 500 kV)', x: 1440, y: 800, dirs: 'dr', p: 1, part: 'transformer' },
  { id: 'sw', t: 'Trạm phân phối', x: 1612, y: 800, dirs: 'rd', p: 3, part: 'switchyard' },
  { id: 'lines', t: 'Đường dây truyền tải', x: 1790, y: 600, dirs: 'ru', p: 1, part: 'lines', live: (s) => `${fmt0(s.pe)} MWe` },
  { id: 'tower', t: 'Tháp làm mát', x: 1870, y: 660, dirs: 'lu', p: 1, part: 'tower' },
  { id: 'plume', t: 'Hơi nước bốc lên – không phóng xạ', x: 1990, y: 330, dirs: 'ru', p: 1, part: 'plume' },
  { id: 'basin', t: 'Bể nước lạnh', x: 2060, y: 930, dirs: 'dr', p: 2, part: 'basin' },
  { id: 'cpump', t: 'Bơm nước làm mát', x: 2205, y: 1045, dirs: 'dl', p: 2, part: 'coolpump' },
  { id: 'intake', t: 'Cửa lấy nước sông/hồ', x: 2257, y: 960, dirs: 'ur', p: 1, part: 'intake' },
];
const fmt0 = (n) => fmt(n, 0);
const fmt1 = (n) => fmt(n, 1);

/** Huy hiệu vòng (số 1-2-3) – luôn hiển thị. */
export const BADGES = [
  { n: 1, x: 362, y: 760 }, { n: 1, x: 296, y: 560 },
  { n: 2, x: 745, y: 650 }, { n: 2, x: 1010, y: 866 },
  { n: 3, x: 1500, y: 1020 }, { n: 3, x: 1500, y: 960 },
];

const NS = 'http://www.w3.org/2000/svg';
export class Labels {
  constructor(svg, onPick) {
    this.svg = svg; this.onPick = onPick; this.visible = true; this.items = [];
    this.cv = document.createElement('canvas').getContext('2d');
    this.font = '600 12.5px "Be Vietnam Pro",system-ui,sans-serif';
    this.fontSm = '700 10.5px "Be Vietnam Pro",system-ui,sans-serif';
    for (const L of LABELS) {
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', L.sm ? 'lbl sm' : 'lbl'); g.dataset.part = L.part;
      g.innerHTML = '<path class="lead"/><circle class="dot" r="3.2"/><rect class="bg" rx="6"/><text class="t"></text><text class="live"></text>';
      svg.appendChild(g);
      this.cv.font = L.sm ? this.fontSm : this.font;
      const w = this.cv.measureText(L.t).width;
      this.items.push({ L, g, w, lead: g.children[0], dot: g.children[1], bg: g.children[2], tx: g.children[3], live: g.children[4], on: false, txt: '' });
      g.children[3].textContent = L.t;
    }
    this.badges = BADGES.map((b) => {
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'bdg l' + b.n);
      g.innerHTML = `<circle r="12"/><text y="4.5">${b.n}</text>`; svg.appendChild(g); return { b, g };
    });
    svg.addEventListener('click', (e) => { const g = e.target.closest('.lbl'); if (g) onPick(g.dataset.part); });
  }
  remeasure() { for (const it of this.items) { this.cv.font = it.L.sm ? this.fontSm : this.font; it.w = this.cv.measureText(it.L.t).width; } }
  setVisible(v) { this.visible = v; this.svg.classList.toggle('off', !v); }
  /** cam: {x,y,s}; cw,ch: kích thước; hide: tập các nhãn bị ẩn (độ ưu tiên) */
  layout(cam, cw, ch, obst) {
    const sx = (x) => cam.x + cam.s * x, sy = (y) => cam.y + cam.s * y;
    for (const bd of this.badges) {
      const x = sx(bd.b.x), y = sy(bd.b.y), ok = x > -20 && x < cw + 20 && y > -20 && y < ch + 20;
      bd.g.style.display = ok ? '' : 'none';
      if (ok) bd.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${Math.max(0.8, Math.min(1.2, cam.s * 1.2))})`);
    }
    if (!this.visible) return;
    const sk = cw < 520 ? 1.6 : cw < 900 ? 1.25 : 1; const maxP = cam.s * sk < 0.5 ? 1 : cam.s * sk < 0.85 ? 2 : 3;
    const placed = (obst || []).map((o) => ({ x: o.x, y: o.y, w: o.w, h: o.h }));
    for (const bd of this.badges) { if (bd.g.style.display === 'none') continue; const bx = sx(bd.b.x), by = sy(bd.b.y); placed.push({ x: bx - 13, y: by - 13, w: 26, h: 26 }); }
    const order = [...this.items].sort((a, b) => a.L.p - b.L.p);
    const H = 22;
    for (const it of order) {
      const { L } = it;
      let ok = L.p <= maxP;
      const ax = sx(L.x), ay = sy(L.y);
      if (ax < 4 || ax > cw - 4 || ay < 4 || ay > ch - 4) ok = false;
      let best = null;
      const twoLine = !!L.live;
      const sm = !!L.sm, bw = it.w + (sm ? 12 : 18), bh = sm ? 17 : twoLine ? H + 15 : H;
      if (ok) {
        const D = 26 + (cam.s < 0.6 ? 10 : 0);
        for (const d of L.dirs) {
          let rx, ry;
          if (d === 'r') { rx = ax + D; ry = ay - bh / 2; }
          else if (d === 'l') { rx = ax - D - bw; ry = ay - bh / 2; }
          else if (d === 'u') { rx = ax - bw / 2; ry = ay - D - bh; }
          else { rx = ax - bw / 2; ry = ay + D; }
          if (rx < 4 || ry < 4 || rx + bw > cw - 4 || ry + bh > ch - 4) continue;
          let clash = false;
          for (const q of placed) if (rx < q.x + q.w + 4 && rx + bw + 4 > q.x && ry < q.y + q.h + 3 && ry + bh + 3 > q.y) { clash = true; break; }
          if (!clash) { best = { rx, ry, d }; break; }
        }
      }
      if (!best) { if (it.on) { it.g.style.display = 'none'; it.on = false; } continue; }
      placed.push({ x: best.rx, y: best.ry, w: bw, h: bh });
      it.on = true; it.g.style.display = '';
      it.bw = bw; it.bh = bh;
      const cx = best.d === 'r' ? best.rx : best.d === 'l' ? best.rx + bw : best.rx + bw / 2;
      const cy = best.d === 'u' ? best.ry + bh : best.d === 'd' ? best.ry : best.ry + bh / 2;
      it.lead.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} L${cx.toFixed(1)},${cy.toFixed(1)}`);
      it.dot.setAttribute('cx', ax.toFixed(1)); it.dot.setAttribute('cy', ay.toFixed(1));
      it.bg.setAttribute('x', best.rx.toFixed(1)); it.bg.setAttribute('y', best.ry.toFixed(1)); it.bg.setAttribute('width', bw); it.bg.setAttribute('height', bh);
      it.tx.setAttribute('x', (best.rx + (sm ? 6 : 9)).toFixed(1)); it.tx.setAttribute('y', (best.ry + (sm ? 12 : 15)).toFixed(1));
      it.live.setAttribute('x', (best.rx + 9).toFixed(1)); it.live.setAttribute('y', (best.ry + 29).toFixed(1));
      it.live.style.display = twoLine ? '' : 'none';
    }
  }
  updateLive(s, d) {
    for (const it of this.items) {
      if (!it.on || !it.L.live) continue;
      const v = it.L.live(s, d);
      if (v !== it.txt) { it.txt = v; it.live.textContent = v; }
    }
  }
}
