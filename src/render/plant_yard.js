import { GROUND, PIPES, TOWER_A, TOWER_C, ARM_Y, span } from './geometry.js';
import { pipeSvg } from './plant_reactor.js';

const S = 'stroke="#1B2B48" stroke-opacity=".6" stroke-width="1.4"';
const TC = 1990; // tâm tháp làm mát
const half = (y) => Math.sqrt(112 * 112 + Math.pow(0.55 * (y - 650), 2));

function insulator(x, y, n = 4, h = 10) {
  return Array.from({ length: n }, (_, i) => `<ellipse cx="${x}" cy="${y + i * (h / n * 2.2)}" rx="6" ry="2.6" fill="#E9D8BF" stroke="#7A5C3E" stroke-width=".8"/>`).join('');
}

export function transformerYard() {
  const rad = Array.from({ length: 6 }, (_, i) => `<rect x="${1384 + i * 7}" y="800" width="4" height="92" fill="url(#gCylHd)"/>`).join('') +
    Array.from({ length: 6 }, (_, i) => `<rect x="${1480 + i * 7}" y="800" width="4" height="92" fill="url(#gCylHd)"/>`).join('');
  return `<g id="yard">
<g data-part="transformer" class="part">
<ellipse cx="1440" cy="902" rx="82" ry="7" fill="url(#gAO)"/>
<rect x="1372" y="896" width="140" height="8" fill="url(#gConcD)" ${S}/>
${rad}
<rect x="1396" y="788" width="88" height="106" rx="6" fill="url(#gGreenV)" stroke="#1B2B48" stroke-width="1.6"/>
<path d="M1396,812 H1484 M1396,840 H1484 M1396,868 H1484" stroke="#1B2B48" stroke-opacity=".25"/>
<rect x="1388" y="782" width="104" height="10" rx="4" fill="#6E9985" ${S}/>
<rect x="1402" y="756" width="16" height="28" rx="2" fill="#C9CED6" ${S}/><path d="M1402,764 H1418 M1402,772 H1418" stroke="#8D9AAE"/>
<rect x="1454" y="738" width="16" height="46" rx="2" fill="#E8D6BC" stroke="#7A5C3E" stroke-width="1.2"/><path d="M1454,748 H1470 M1454,758 H1470 M1454,768 H1470" stroke="#B49A76"/>
<rect x="1498" y="768" width="22" height="32" rx="5" fill="#6E9985" ${S}/>
<circle cx="1410" cy="760" r="6" fill="#C99A3E" stroke="#1B2B48" stroke-opacity=".6"/>
</g>
<g data-part="switchyard" class="part">
<path d="M1536,900 V690 M1636,900 V690" stroke="#46556C" stroke-width="5"/>
<path d="M1530,690 H1642" stroke="#46556C" stroke-width="5"/>
<path d="M1536,720 L1556,690 M1636,720 L1616,690" stroke="#46556C" stroke-width="2"/>
${insulator(1566, 692)}${insulator(1590, 692)}${insulator(1614, 692)}
<g transform="translate(1566,830)"><rect x="-9" y="0" width="18" height="70" rx="3" fill="url(#gCylHd)" ${S}/>${insulator(0, -34, 5, 12)}</g>
<g transform="translate(1596,830)"><rect x="-9" y="0" width="18" height="70" rx="3" fill="url(#gCylHd)" ${S}/>${insulator(0, -34, 5, 12)}</g>
<rect x="1552" y="880" width="56" height="20" fill="url(#gConcD)" ${S}/>
<path d="M1536,700 H1650" stroke="#46556C" stroke-width="1.2" stroke-dasharray="3 3" opacity="0"/>
</g>
</g>`;
}

export function transmission() {
  const tower = (cx, s = 1) => {
    const top = 540, bw = 36;
    const lat = [];
    for (let y = top + 20; y < GROUND - 20; y += 36) {
      const w1 = 4 + ((y - top) / (GROUND - top)) * bw, w2 = 4 + ((y + 36 - top) / (GROUND - top)) * bw;
      lat.push(`<path d="M${cx - w1},${y} L${cx + w2},${y + 36} M${cx + w1},${y} L${cx - w2},${y + 36} M${cx - w1},${y} H${cx + w1}"/>`);
    }
    const arms = ARM_Y.map((y) => `<path d="M${cx - 58},${y} H${cx + 58}" stroke-width="3.4"/><path d="M${cx - 58},${y} V${y + 12} M${cx + 58},${y} V${y + 12}" stroke-width="2"/><ellipse cx="${cx - 58}" cy="${y + 15}" rx="3" ry="4" fill="#E9D8BF" stroke="#7A5C3E" stroke-width=".8"/><ellipse cx="${cx + 58}" cy="${y + 15}" rx="3" ry="4" fill="#E9D8BF" stroke="#7A5C3E" stroke-width=".8"/>`).join('');
    return `<g stroke="#46556C" stroke-width="1.6" fill="none"><path d="M${cx - 4},${top} L${cx - bw - 4},${GROUND} M${cx + 4},${top} L${cx + bw + 4},${GROUND}" stroke-width="3"/>${lat.join('')}${arms}<path d="M${cx},${top - 18} V${top}" stroke-width="2.4"/><path d="M${cx - 30},${top + 24} L${cx},${top - 18} L${cx + 30},${top + 24}" stroke-width="1.6"/></g>`;
  };
  const wires = [
    ...ARM_Y.map((y, i) => `<path d="${span(1636, 692, TOWER_A - 58, y + 14, 6)}"/>`),
    ...ARM_Y.map((y) => `<path d="${span(TOWER_A + 58, y + 14, TOWER_C - 58, y + 14, 40)}"/>`),
    ...ARM_Y.map((y) => `<path d="${span(TOWER_C + 58, y + 14, TOWER_C + 400, y + 14, 30)}"/>`),
  ].join('');
  return `<g id="lines" data-part="lines" class="part">
<ellipse cx="${TOWER_A}" cy="902" rx="50" ry="5" fill="url(#gAO)"/><ellipse cx="${TOWER_C}" cy="902" rx="50" ry="5" fill="url(#gAO)"/>
${tower(TOWER_A)}${tower(TOWER_C)}
<g fill="none" stroke="#2B3A55" stroke-width="1.8">${wires}</g>
</g>`;
}

export function coolingTower() {
  const ys = []; for (let y = 470; y <= GROUND; y += 10) ys.push(y);
  const L = ys.map((y) => `${(TC - half(y)).toFixed(1)},${y}`);
  const R = ys.map((y) => `${(TC + half(y)).toFixed(1)},${y}`).reverse();
  const outer = `M${L.join(' L')} L${R.join(' L')} Z`;
  const wallT = 15;
  const Li = ys.map((y) => `${(TC - half(y) + wallT).toFixed(1)},${y}`);
  const Ri = ys.map((y) => `${(TC + half(y) - wallT).toFixed(1)},${y}`).reverse();
  const inner = `M${Li.join(' L')} L${Ri.join(' L')} Z`;
  const rimW = half(470);
  const noz = Array.from({ length: 13 }, (_, i) => {
    const x = TC - 96 + i * 16;
    return `<path d="M${x - 3},766 h6 l-3,6 z" fill="#46556C"/>`;
  }).join('');
  const piers = Array.from({ length: 9 }, (_, i) => {
    const x = TC - 158 + i * 39.5;
    return `<path d="M${x},900 L${x + 14},842" stroke="#8C98AB" stroke-width="7"/><path d="M${x + 39.5},900 L${x + 25.5},842" stroke="#8C98AB" stroke-width="7"/>`;
  }).join('');
  const hr = half(840);
  return `<g id="towerGroup">
<g data-part="tower" class="part">
<ellipse cx="${TC}" cy="904" rx="205" ry="9" fill="url(#gAO)"/>
<path d="${outer}" fill="url(#gTowerOut)" stroke="#1B2B48" stroke-opacity=".7" stroke-width="1.6"/>
<path d="${outer}" fill="url(#pRebar)" opacity=".8"/>
<path d="${inner}" fill="url(#gTowerIn)" stroke="#1B2B48" stroke-opacity=".5" stroke-width="1.2"/>
<path d="${inner}" fill="url(#gTowerShade)"/>
<g stroke="#7F8CA0" stroke-width="1" opacity=".55">${[500, 540, 580, 620, 660, 700, 740, 780].map((y) => `<path d="M${(TC - half(y) + wallT).toFixed(1)},${y} H${(TC + half(y) - wallT).toFixed(1)}"/>`).join('')}</g>
<g stroke="#fff" stroke-opacity=".28" stroke-width="3" fill="none"><path d="M${TC - 100},560 Q${TC - 66},700 ${TC - 120},880"/></g>
<ellipse cx="${TC}" cy="470" rx="${rimW.toFixed(1)}" ry="9" fill="#C7CCD5" stroke="#1B2B48" stroke-opacity=".6" stroke-width="1.4"/>
<ellipse cx="${TC}" cy="470" rx="${(rimW - 10).toFixed(1)}" ry="6" fill="#EEF1F5" stroke="#1B2B48" stroke-opacity=".3"/>
<rect x="${TC - hr + wallT}" y="842" width="${2 * (hr - wallT)}" height="58" fill="#DDE3EA" opacity=".0"/>
<rect x="${TC - 140}" y="800" width="280" height="42" fill="url(#pFill)" stroke="#5D6D86" stroke-width="1.4" opacity=".95"/>
<rect x="${TC - 140}" y="800" width="280" height="42" fill="#8FB5C9" opacity=".18"/>
<g id="airIn" stroke="#6E9AB5" stroke-width="1.6" fill="none" opacity=".7"><path d="M${TC - 178},880 q16,-12 36,-12 M${TC + 178},880 q-16,-12 -36,-12"/></g>
${piers}
<path d="M${TC - 112},842 H${TC + 112}" stroke="#5D6D86" stroke-width="3"/>
</g>
<g data-part="spray" class="part">
<rect x="${TC - 104}" y="760" width="208" height="7" rx="3" fill="#C9CED6" ${S}/>
${noz}
</g>
<g data-part="basin" class="part">
<rect x="${TC - 164}" y="896" width="328" height="58" rx="3" fill="url(#gConcD)" ${S}/>
<rect x="${TC - 156}" y="906" width="312" height="42" fill="url(#gWaterBasin)" stroke="#0A4F55" stroke-opacity=".5"/>
<path d="M${TC - 152},910 H${TC + 152}" stroke="#fff" stroke-opacity=".75" stroke-width="2"/>
<path d="M${TC - 120},920 q12,-4 24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0" stroke="#fff" stroke-opacity=".5" fill="none" stroke-width="1.3"/>
<rect x="${TC - 164}" y="896" width="328" height="58" fill="url(#pRebar)"/>
</g>
</g>`;
}

export function undergroundL3() {
  const p = PIPES.filter((q) => q.loop === 3);
  const pit = `<g data-part="coolpump" class="part">
<rect x="2178" y="956" width="54" height="76" rx="4" fill="url(#gConc)" ${S} opacity=".95"/>
<rect x="2194" y="962" width="22" height="26" rx="3" fill="url(#gPaintBlueH)" ${S}/>
<rect x="2192" y="956" width="26" height="8" fill="url(#gCylHd)" ${S}/>
<circle cx="2205" cy="1020" r="20" fill="url(#gCylHd)" stroke="#1B2B48" stroke-width="1.6"/>
<circle cx="2205" cy="1020" r="14" fill="#BFE6E8" ${S}/>
<g id="imp3" transform="translate(2205,1020)">${[0, 72, 144, 216, 288].map((a) => `<path d="M0,0 C5,-3 8,-8 9,-12" stroke="#12919A" stroke-width="2.2" fill="none" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#46556C"/></g>
</g>`;
  return `<g id="l3pipes">
<g opacity=".55"><path d="M1100,1020 H2190 M1150,960 H1990" stroke="url(#pGravel)" stroke-width="34" fill="none"/></g>
${p.map(pipeSvg).join('')}
${pit}
</g>`;
}
