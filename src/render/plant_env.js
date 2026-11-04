import { W, H, GROUND, PIPES, TUBE_A } from './geometry.js';

export const COL = {
  ink: '#1B2B48', ink2: '#3E4F6C', hot: '#A3162E', cold: '#E5645B',
  steam: '#EEF1F5', steamEdge: '#8996A8', water: '#2F76C4', cool: '#12919A', warm: '#58C0A0',
};

/** Định nghĩa gradient, mẫu, ký hiệu dùng chung. */
export function defs() {
  const lg = (id, stops, attrs = 'x1="0" y1="0" x2="1" y2="0"') =>
    `<linearGradient id="${id}" ${attrs}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
  const V = 'x1="0" y1="0" x2="0" y2="1"';
  return `<defs>
${lg('gSky', [[0, '#C9DCEC'], [0.5, '#E3EDF4'], [1, '#F6F2E9']], `gradientUnits="userSpaceOnUse" x1="0" y1="-600" x2="0" y2="${GROUND}"`)}
${lg('gSoil', [[0, '#DACFBB'], [0.45, '#CCBFA7'], [1, '#B8AA90']], `gradientUnits="userSpaceOnUse" x1="0" y1="${GROUND}" x2="0" y2="1600"`)}
${lg('gGrass', [[0, '#B4C7A0'], [1, '#97AE86']], V)}
${lg('gConc', [[0, '#E9EBEF'], [0.5, '#D6DAE0'], [1, '#C5CAD2']])}
${lg('gConcV', [[0, '#E9EBEF'], [1, '#CDD2DA']], V)}
${lg('gConcD', [[0, '#C9CED6'], [1, '#AEB5C0']], V)}
${lg('gCylH', [[0, '#7F8EA6'], [0.3, '#C3CFDF'], [0.55, '#E8EEF6'], [1, '#6F7E97']])}
${lg('gCylHd', [[0, '#46556C'], [0.35, '#8095B1'], [0.6, '#A9B9CF'], [1, '#3F4D63']])}
${lg('gCylV', [[0, '#E3EAF3'], [0.45, '#BCC8D8'], [1, '#6F7E97']], V)}
${lg('gMetalV', [[0, '#F1F5FA'], [0.5, '#BFCADA'], [1, '#7E8DA5']], V)}
${lg('gPaintBlue', [[0, '#5D83B8'], [0.5, '#7FA3D2'], [1, '#456A9E']], V)}
${lg('gPaintBlueH', [[0, '#3F6296'], [0.4, '#7FA3D2'], [1, '#36568A']])}
${lg('gGreenV', [[0, '#8FB5A0'], [0.5, '#6E9985'], [1, '#4F7966']], V)}
${lg('gGreenH', [[0, '#4F7966'], [0.45, '#8FB5A0'], [1, '#456C5B']])}
${lg('gYellow', [[0, '#F0C766'], [1, '#C99A2E']], V)}
${lg('gWaterSec', [[0, '#A8CCEE'], [1, '#6AA3DA']], V)}
${lg('gWaterBasin', [[0, '#5BC0C4'], [1, '#2C9AA3']], V)}
${lg('gLake', [[0, '#8EC3E0'], [1, '#4B93BF']], V)}
${lg('gGlass', [[0, '#CFE5F5'], [1, '#9FC6E4']], 'x1="0" y1="0" x2="1" y2="1"')}
${lg('gPrimCold', [[0, '#F2B4AC'], [1, '#EE9A92']], V)}
${lg('gPrimHot', [[0, '#C9505F'], [1, '#D9737A']], V)}
${lg('gPrimMix', [[0, '#C9505F'], [0.5, '#DE7B78'], [1, '#EE9A92']], V)}
${lg('gTowerOut', [[0, '#C2C7CF'], [0.22, '#E6E9EE'], [0.5, '#DDE1E7'], [1, '#B3B9C3']])}
${lg('gTowerIn', [[0, '#B9C5D3'], [0.35, '#DCE4EC'], [0.7, '#E9EEF3'], [1, '#B4C0CE']])}
${lg('gTowerShade', [[0, '#1B2B48', 0.16], [0.18, '#1B2B48', 0], [0.8, '#1B2B48', 0], [1, '#1B2B48', 0.16]])}
<radialGradient id="gAO" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#1B2B48" stop-opacity=".30"/><stop offset="1" stop-color="#1B2B48" stop-opacity="0"/></radialGradient>
<radialGradient id="gGlowA" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFC24A" stop-opacity=".95"/><stop offset=".35" stop-color="#FFB020" stop-opacity=".45"/><stop offset="1" stop-color="#FFB020" stop-opacity="0"/></radialGradient>
<radialGradient id="gGlowR" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF4A44" stop-opacity=".95"/><stop offset=".35" stop-color="#E5322D" stop-opacity=".45"/><stop offset="1" stop-color="#E5322D" stop-opacity="0"/></radialGradient>
<radialGradient id="gCher" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="#7CC6FF" stop-opacity=".9"/><stop offset="1" stop-color="#4C9BEA" stop-opacity="0"/></radialGradient>
<linearGradient id="gAxial" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".30"/></linearGradient>
<pattern id="pRebar" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 4.5H9M4.5 0V9" stroke="#8892A0" stroke-width=".6" opacity=".35"/><circle cx="4.5" cy="4.5" r=".9" fill="#7C8696" opacity=".4"/></pattern>
<pattern id="pHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V7" stroke="#C62828" stroke-width="1.4" opacity=".42"/></pattern>
<pattern id="pFuel" width="3.2" height="10" patternUnits="userSpaceOnUse"><rect width="1.7" height="10" fill="#3A4558" opacity=".55"/><rect x="0" width=".6" height="10" fill="#fff" opacity=".28"/></pattern>
<pattern id="pFill" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H10M0 5H10" stroke="#8795A8" stroke-width="1.2" opacity=".75"/><path d="M0 0V10" stroke="#8795A8" stroke-width="1" opacity=".5"/></pattern>
<pattern id="pPanel" width="26" height="40" patternUnits="userSpaceOnUse"><rect width="26" height="40" fill="none"/><path d="M0 0V40" stroke="#9AA3B2" stroke-width="1" opacity=".5"/><path d="M0 20H26" stroke="#9AA3B2" stroke-width=".6" opacity=".3"/></pattern>
<pattern id="pStripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(55)"><rect width="7" height="14" fill="#2B3A55" opacity=".35"/></pattern>
<pattern id="pStripe2" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(55)"><rect width="7" height="14" fill="#fff" opacity=".35"/></pattern>
<pattern id="pGravel" width="14" height="10" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#A89B82" opacity=".7"/><circle cx="10" cy="7" r="1" fill="#9C8F76" opacity=".7"/><circle cx="7" cy="2" r=".7" fill="#B8AB92" opacity=".7"/></pattern>
<clipPath id="clipRods"><rect x="200" y="368" width="100" height="440"/></clipPath>
<clipPath id="clipVesselIn"><path d="M184,492 L184,790 A66,44 0 0 0 316,790 L316,492 A66,40 0 0 0 184,492 Z"/></clipPath>
<clipPath id="clipSGsec"><path d="M468,780 L468,505 L448,470 L448,360 A72,28 0 0 1 592,360 L592,470 L572,505 L572,780 Z"/></clipPath>
<clipPath id="clipPrz"><path d="M366,300 A32,28 0 0 1 430,300 L430,450 A32,28 0 0 1 366,450 Z"/></clipPath>
<symbol id="trefoil" viewBox="-50 -50 100 100"><circle r="50" fill="#F5C518"/><circle r="47" fill="none" stroke="#111" stroke-width="2.5"/>
<g fill="#111">${[90, 210, 330].map((a) => `<path d="${blade(a)}"/>`).join('')}<circle r="8"/></g></symbol>
<symbol id="hardhat" viewBox="0 0 20 12"><path d="M2 10 A8 8 0 0 1 18 10 Z" fill="#F7C531" stroke="#1B2B48" stroke-width=".8"/><rect x="0.5" y="9.6" width="19" height="2" rx="1" fill="#F7C531" stroke="#1B2B48" stroke-width=".8"/></symbol>
</defs>`;
}

/** Cánh hoa thị phóng xạ: hình quạt 60°, bán kính trong 15, ngoài 40. */
function blade(centerDeg) {
  const r1 = 14, r2 = 40, a0 = ((centerDeg - 30) * Math.PI) / 180, a1 = ((centerDeg + 30) * Math.PI) / 180;
  const p = (r, a) => `${(r * Math.cos(a)).toFixed(2)},${(-r * Math.sin(a)).toFixed(2)}`;
  return `M${p(r1, a0)} L${p(r2, a0)} A${r2},${r2} 0 0 0 ${p(r2, a1)} L${p(r1, a1)} A${r1},${r1} 0 0 1 ${p(r1, a0)} Z`;
}

const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

/** Nền: trời, đồi xa, mây, đất, lớp cắt đất, hồ. Vẽ rộng hơn khung để lấp đầy mọi tỉ lệ màn hình. */
export function background() {
  const hills = `<path d="M-2000,${GROUND} L-2000,720 C-1400,700 -900,760 -400,730 C100,700 300,640 600,690 C900,740 1200,700 1500,660 C1800,620 2100,700 2400,680 C3000,650 4000,720 4600,700 L4600,${GROUND} Z" fill="#CBD9E6" opacity=".75"/>
<path d="M-2000,${GROUND} L-2000,790 C-1200,770 -600,800 0,780 C500,760 900,810 1400,790 C1900,770 2300,800 2700,780 C3300,760 4000,800 4600,790 L4600,${GROUND} Z" fill="#BCCDDC" opacity=".8"/>`;
  const cloud = (x, y, s, o) => `<g transform="translate(${x},${y}) scale(${s})" opacity="${o}" fill="#fff"><ellipse cx="0" cy="0" rx="80" ry="18"/><ellipse cx="-30" cy="-14" rx="36" ry="20"/><ellipse cx="22" cy="-18" rx="44" ry="24"/></g>`;
  const stones = Array.from({ length: 70 }, () => {
    const x = -300 + rnd() * 3200, y = GROUND + 20 + rnd() * 210, rr = 1.5 + rnd() * 4;
    return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${rr.toFixed(1)}" ry="${(rr * 0.65).toFixed(1)}" fill="${rnd() > 0.5 ? '#C0B398' : '#E4DAC7'}" opacity=".7"/>`;
  }).join('');
  return `<g id="bg">
<rect x="-2000" y="-1000" width="6600" height="${GROUND + 1000}" fill="url(#gSky)"/>
${cloud(300, 90, 1.2, 0.8)}${cloud(1150, 150, 0.9, 0.7)}${cloud(2150, 90, 1.3, 0.75)}${cloud(-500, 120, 1, 0.7)}${cloud(2900, 140, 1, 0.7)}
${hills}
<rect x="-2000" y="${GROUND}" width="6600" height="1400" fill="url(#gSoil)"/>
<path d="M-2000,${GROUND + 62} C-500,${GROUND + 48} 900,${GROUND + 82} 2450,${GROUND + 60} S4000,${GROUND + 70} 4600,${GROUND + 56}" stroke="#B3A68D" stroke-width="1.4" fill="none" opacity=".7"/>
<path d="M-2000,${GROUND + 150} C-300,${GROUND + 138} 1200,${GROUND + 170} 2450,${GROUND + 144} S4000,${GROUND + 160} 4600,${GROUND + 150}" stroke="#A89B82" stroke-width="1.4" fill="none" opacity=".6"/>
<path d="M-2000,${GROUND + 232} C-400,${GROUND + 220} 1000,${GROUND + 250} 2450,${GROUND + 226} S4000,${GROUND + 240} 4600,${GROUND + 230}" stroke="#A89B82" stroke-width="1.2" fill="none" opacity=".5"/>
${stones}
<rect x="-2000" y="${GROUND - 7}" width="6600" height="8" fill="url(#gGrass)"/>
<rect x="-2000" y="${GROUND - 1}" width="6600" height="3" fill="#7F9570" opacity=".7"/>
</g>`;
}

/** Hồ/sông (mặt cắt), cửa lấy nước. */
export function lake() {
  return `<g id="lake">
<path d="M2262,${GROUND - 1} L2262,${GROUND + 6} C2300,${GROUND + 70} 2330,${GROUND + 132} 2380,${GROUND + 140} L4000,${GROUND + 140} L4000,${GROUND + 6} L4000,${GROUND - 1} Z" fill="#B8AB92"/>
<path d="M2268,${GROUND + 8} C2304,${GROUND + 66} 2334,${GROUND + 126} 2380,${GROUND + 132} L4000,${GROUND + 132} L4000,${GROUND + 8} Z" fill="url(#gLake)"/>
<path d="M2268,${GROUND + 8} L4000,${GROUND + 8}" stroke="#fff" stroke-width="2" opacity=".7"/>
<path d="M2330,${GROUND + 24} q14,-5 28,0 t28,0 t28,0 M2420,${GROUND + 44} q14,-5 28,0 t28,0 M2300,${GROUND + 66} q10,-4 20,0 t20,0" stroke="#fff" stroke-width="1.3" fill="none" opacity=".55"/>
<g transform="translate(2300,${GROUND + 82})" opacity=".55"><path d="M0 0 q10-8 22-2 l8-5 l-2 10 l-8-4 q-10 6 -20 1 Z" fill="#1B2B48"/></g>
<g data-part="intake" class="part">
<rect x="2240" y="${GROUND - 18}" width="34" height="118" fill="url(#gConc)" stroke="#1B2B48" stroke-opacity=".5" stroke-width="1.4"/>
<rect x="2244" y="${GROUND - 14}" width="26" height="12" fill="#C9CED6" stroke="#1B2B48" stroke-opacity=".4"/>
<g stroke="#46556C" stroke-width="1.4">${Array.from({ length: 10 }, (_, i) => `<path d="M2246,${GROUND + 6 + i * 9} H2272"/>`).join('')}</g>
<path d="M2273,${GROUND + 8} v82" stroke="#46556C" stroke-width="2"/>
<rect x="2236" y="${GROUND - 22}" width="42" height="6" fill="#8D9AAE" stroke="#1B2B48" stroke-opacity=".5"/>
<rect x="2240" y="${GROUND - 18}" width="34" height="118" fill="transparent"/>
</g>
</g>`;
}

export function trees() {
  const tree = (x, s = 1, k = 0) => {
    const c = ['#6C8F5C', '#7DA06A', '#5E8452'][k % 3];
    return `<g transform="translate(${x},${GROUND}) scale(${s})"><ellipse cx="0" cy="2" rx="26" ry="4" fill="url(#gAO)"/><rect x="-3" y="-34" width="6" height="36" fill="#7A5C3E"/><circle cx="0" cy="-58" r="26" fill="${c}"/><circle cx="-14" cy="-44" r="18" fill="${c}"/><circle cx="15" cy="-46" r="19" fill="${c}"/><circle cx="-6" cy="-66" r="12" fill="#fff" opacity=".12"/></g>`;
  };
  return `<g id="trees">${[18, 42, 1500, 1840 + 0, 2215, 2330].map((x, i) => (x === 1840 ? '' : tree(x, 0.8 + (i % 3) * 0.18, i))).join('')}</g>`;
}

export function person(x, y, flip = 1, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${flip * s},${s})">
<ellipse cx="0" cy="1" rx="9" ry="2.4" fill="url(#gAO)"/>
<path d="M-3,-17 L-3,0 M3,-17 L3,0" stroke="#2B3A55" stroke-width="3.2" stroke-linecap="round"/>
<path d="M-6,-30 L-6,-16 L6,-16 L6,-30 Q6,-34 0,-34 Q-6,-34 -6,-30 Z" fill="#F08A24" stroke="#1B2B48" stroke-width=".8"/>
<path d="M-6,-26 H6" stroke="#fff" stroke-width="1.6" opacity=".85"/>
<path d="M-6,-30 L-10,-20 M6,-30 L10,-21" stroke="#F08A24" stroke-width="3" stroke-linecap="round"/>
<circle cx="0" cy="-39" r="4.8" fill="#E9B98E" stroke="#1B2B48" stroke-width=".8"/>
<path d="M-5.6,-40 A5.6,5 0 0 1 5.6,-40 Z" fill="#F7C531" stroke="#1B2B48" stroke-width=".8"/>
<rect x="-6.4" y="-41" width="12.8" height="2" rx="1" fill="#F7C531" stroke="#1B2B48" stroke-width=".8"/></g>`;
}

export function truck(x, y) {
  return `<g transform="translate(${x},${y})"><ellipse cx="30" cy="2" rx="40" ry="4" fill="url(#gAO)"/>
<path d="M0,-6 L0,-24 L34,-24 L44,-38 L66,-38 L70,-22 L72,-6 Z" fill="#F4F6F9" stroke="#1B2B48" stroke-width="1.2" stroke-opacity=".7"/>
<path d="M46,-35 L63,-35 L66,-23 L40,-23 Z" fill="url(#gGlass)" stroke="#1B2B48" stroke-width=".8" stroke-opacity=".6"/>
<rect x="0" y="-9" width="72" height="4" fill="#2F76C4" opacity=".85"/>
<circle cx="16" cy="-4" r="8" fill="#2B3A55"/><circle cx="16" cy="-4" r="3.5" fill="#C9CED6"/>
<circle cx="56" cy="-4" r="8" fill="#2B3A55"/><circle cx="56" cy="-4" r="3.5" fill="#C9CED6"/></g>`;
}
