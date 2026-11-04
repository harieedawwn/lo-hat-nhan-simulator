import { PIPES } from './geometry.js';
import { pipeSvg } from './plant_reactor.js';

const S = 'stroke="#1B2B48" stroke-opacity=".6" stroke-width="1.4"';
const roofY = (x) => 504 - 34 * Math.max(0, 1 - Math.abs(x - 1036) / 340);

export function valve(id, x, y, rot = 0) {
  return `<g id="${id}" transform="translate(${x},${y}) rotate(${rot})"><path d="M-8,-6 L8,6 V-6 L-8,6 Z" class="vbody" fill="#fff" stroke="#1B2B48" stroke-width="1.4" stroke-linejoin="round"/><path d="M0,0 V-10 M-5,-10 H5" stroke="#1B2B48" stroke-width="1.6"/></g>`;
}

/** Nhà tuabin: kết cấu, tường, mái giàn thép (bản vẽ cắt). */
export function hallBack() {
  const truss = [];
  for (let x = 722; x <= 1350; x += 52.4) {
    const y = roofY(x);
    truss.push(`<path d="M${x.toFixed(1)},520 V${(y + 8).toFixed(1)}"/>`);
  }
  for (let i = 0; i < 12; i++) {
    const x0 = 722 + i * 52.4, x1 = x0 + 52.4;
    truss.push(`<path d="M${x0.toFixed(1)},520 L${((x0 + x1) / 2).toFixed(1)},${(roofY((x0 + x1) / 2) + 8).toFixed(1)} L${x1.toFixed(1)},520"/>`);
  }
  const wins = Array.from({ length: 12 }, (_, i) => {
    const x = 742 + i * 50;
    return `<rect x="${x}" y="596" width="38" height="70" fill="url(#gGlass)" stroke="#6E7F97" stroke-width="1.2"/><path d="M${x + 4},662 L${x + 20},600 M${x + 14},662 L${x + 30},600" stroke="#fff" stroke-opacity=".6" stroke-width="3"/><path d="M${x},631 H${x + 38}" stroke="#6E7F97" stroke-width="1"/>`;
  }).join('');
  const clere = Array.from({ length: 14 }, (_, i) => `<rect x="${734 + i * 44}" y="526" width="32" height="16" fill="url(#gGlass)" stroke="#6E7F97" stroke-width="1"/>`).join('');
  return `<g id="hallBack" data-part="hall" class="part">
<ellipse cx="1036" cy="906" rx="360" ry="9" fill="url(#gAO)"/>
<path d="M720,900 V${roofY(720) + 8} L1036,${roofY(1036) + 8} L1352,${roofY(1352) + 8} V900 Z" fill="#E7EBF1" ${S}/>
<path d="M720,712 H1352 V900 H720 Z" fill="url(#gConcD)" opacity=".85"/>
<path d="M720,712 H1352 V900 H720 Z" fill="url(#pPanel)"/>
${clere}${wins}
<g stroke="#46556C" stroke-width="2" fill="none">${truss.join('')}<path d="M722,520 H1350" stroke-width="4"/></g>
<path d="M696,504 L1036,470 L1376,504 L1376,513 L1036,479 L696,513 Z" fill="#6F7E97" stroke="#1B2B48" stroke-opacity=".7" stroke-width="1.4"/>
<path d="M696,504 L1036,470 L1376,504" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>
<rect x="700" y="900" width="672" height="36" fill="url(#gConcD)" ${S}/><rect x="700" y="900" width="672" height="36" fill="url(#pRebar)"/>
<rect x="706" y="500" width="14" height="400" fill="url(#gConc)" ${S}/><rect x="1352" y="500" width="14" height="400" fill="url(#gConc)" ${S}/>
<rect x="706" y="500" width="14" height="400" fill="url(#pRebar)"/><rect x="1352" y="500" width="14" height="400" fill="url(#pRebar)"/>
<rect x="720" y="690" width="225" height="22" fill="url(#gConcV)" ${S}/><rect x="1095" y="690" width="257" height="22" fill="url(#gConcV)" ${S}/>
<rect x="905" y="712" width="20" height="188" fill="url(#gConc)" ${S}/>
<rect x="1160" y="712" width="150" height="188" fill="url(#gConc)" ${S}/><rect x="1160" y="712" width="150" height="188" fill="url(#pRebar)"/>
<path d="M1190,900 V850 A30,30 0 0 1 1250,850 V900 Z" fill="#9AA5B6" ${S} opacity=".8"/>
<path d="M722,696 H946 M1094,696 H1350" stroke="#8D9AAE" stroke-width="1"/>
<g stroke="#46556C" stroke-width="2.4" fill="none"><path d="M726,690 V664 M726,664 H760 M760,664 V690 M744,664 V690"/><path d="M1330,690 V664 H1346 V690"/></g>
<g id="hallStair" stroke="#46556C" stroke-width="1.6" fill="none"><path d="M740,900 L740,712 M752,900 L752,712" stroke-opacity=".0"/></g>
</g>`;
}

function bladeRows(x0, x1, axisY, n, minLen, maxLen, flip = false, id) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1);
    const t = flip ? 1 - i / (n - 1) : i / (n - 1);
    const len = minLen + (maxLen - minLen) * t;
    rows.push(`<rect x="${(x - 1.3).toFixed(1)}" y="${(axisY - 14 - len).toFixed(1)}" width="2.6" height="${len.toFixed(1)}" fill="#3F4D63"/><rect x="${(x - 1.3).toFixed(1)}" y="${(axisY + 14).toFixed(1)}" width="2.6" height="${len.toFixed(1)}" fill="#3F4D63"/>`);
    // cánh tĩnh xen kẽ
    const xs = x + (x1 - x0) / (n - 1) / 2;
    if (i < n - 1) {
      const t2 = flip ? 1 - (i + 0.5) / (n - 1) : (i + 0.5) / (n - 1);
      const l2 = minLen + (maxLen - minLen) * t2;
      rows.push(`<rect x="${(xs - 1).toFixed(1)}" y="${(axisY - 14 - l2 - 4).toFixed(1)}" width="2" height="${(l2 * 0.85).toFixed(1)}" fill="#8896AB"/><rect x="${(xs - 1).toFixed(1)}" y="${(axisY + 14 + l2 * 0.15 + 4).toFixed(1)}" width="2" height="${(l2 * 0.85).toFixed(1)}" fill="#8896AB"/>`);
    }
  }
  return rows.join('');
}

function casing(id, x, y, w, h, part) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#EEF2F7" stroke="#1B2B48" stroke-width="1.6"/>
<rect x="${x}" y="${y}" width="${w}" height="9" rx="4" fill="url(#gCylV)" ${S}/><rect x="${x}" y="${y + h - 9}" width="${w}" height="9" rx="4" fill="url(#gCylV)" ${S}/>`;
}

export function hallEquip() {
  const AX = 640;
  const hpRotor = `<rect x="806" y="${AX - 14}" width="88" height="28" fill="url(#gCylV)" ${S}/>`;
  const lpRotor = `<rect x="955" y="${AX - 14}" width="130" height="28" fill="url(#gCylV)" ${S}/>`;
  const genRotor = `<rect x="1176" y="${AX - 18}" width="108" height="36" fill="url(#gCylV)" ${S}/>`;
  const stripes = (id, x, w, h) => `<g clip-path="url(#clip${id})"><g id="str${id}"><rect x="${x - 30}" y="${AX - h / 2}" width="${w + 60}" height="${h}" fill="url(#pStripe)"/></g></g>`;
  const clips = `<defs><clipPath id="clipHP"><rect x="806" y="${AX - 14}" width="88" height="28"/></clipPath><clipPath id="clipLP"><rect x="955" y="${AX - 14}" width="130" height="28"/></clipPath><clipPath id="clipGen"><rect x="1176" y="${AX - 18}" width="108" height="36"/></clipPath></defs>`;
  const lpBlades = bladeRows(960, 1012, AX, 6, 8, 26, false) + bladeRows(1028, 1080, AX, 6, 8, 26, true);
  const windings = (x, dir) => `<path d="M${x},604 q${dir * 18},18 0,36 M${x + dir * 6},604 q${dir * 18},18 0,36 M${x},640 q${dir * 18},18 0,36 M${x + dir * 6},640 q${dir * 18},18 0,36" fill="none" stroke="#E08A2B" stroke-width="3" stroke-linecap="round"/>`;
  return `${clips}
<g id="hallEquip">
<g data-part="turbine" class="part">
<ellipse cx="1020" cy="694" rx="260" ry="5" fill="url(#gAO)"/>
<g id="msr"><rect x="905" y="546" width="96" height="24" rx="12" fill="url(#gCylV)" ${S}/><path d="M914,558 H992" stroke="#5D6D86" stroke-width="1" stroke-dasharray="3 3"/></g>
${casing('hp', 796, 600, 108, 80)}
${hpRotor}${stripes('HP', 806, 88, 28)}
${bladeRows(816, 886, AX, 8, 6, 15, false)}
<rect id="blurHP" x="810" y="606" width="80" height="68" fill="#C7D3E3" opacity="0"/>
<rect x="796" y="600" width="12" height="80" fill="url(#gCylHd)" ${S}/><rect x="892" y="600" width="12" height="80" fill="url(#gCylHd)" ${S}/>
${casing('lp', 945, 590, 150, 100)}
${lpRotor}${stripes('LP', 955, 130, 28)}${lpBlades}
<rect id="blurLP" x="958" y="596" width="124" height="88" fill="#C7D3E3" opacity="0"/>
<rect x="945" y="590" width="12" height="100" fill="url(#gCylHd)" ${S}/><rect x="1083" y="590" width="12" height="100" fill="url(#gCylHd)" ${S}/>
<path d="M948,690 L1092,690 L1082,712 L958,712 Z" fill="url(#gCylV)" ${S}/>
<rect x="958" y="712" width="124" height="12" fill="url(#gCylV)" ${S}/>
<rect x="796" y="${AX - 4}" width="12" height="8" fill="#8C98AB"/>
<rect x="896" y="${AX - 4}" width="62" height="8" fill="#8C98AB" ${S}/><rect x="1086" y="${AX - 4}" width="92" height="8" fill="#8C98AB" ${S}/>
<rect x="898" y="${AX - 12}" width="6" height="24" fill="#46556C"/><rect x="1089" y="${AX - 12}" width="6" height="24" fill="#46556C"/>
${PIPES.filter((p) => p.id === 'cross').map(pipeSvg).join('')}
</g>
<g data-part="generator" class="part">
<rect x="1150" y="590" width="160" height="100" rx="12" fill="url(#gPaintBlue)" stroke="#1B2B48" stroke-width="1.6"/>
<rect x="1160" y="600" width="140" height="80" rx="6" fill="#EEF2F7" ${S}/>
<g id="statorL" fill="#9AA6B8" ${S}><rect x="1178" y="604" width="104" height="13"/><rect x="1178" y="663" width="104" height="13"/></g>
<path d="M1184,604 V617 M1192,604 V617 M1200,604 V617 M1208,604 V617 M1216,604 V617 M1224,604 V617 M1232,604 V617 M1240,604 V617 M1248,604 V617 M1256,604 V617 M1264,604 V617 M1272,604 V617 M1184,663 V676 M1192,663 V676 M1200,663 V676 M1208,663 V676 M1216,663 V676 M1224,663 V676 M1232,663 V676 M1240,663 V676 M1248,663 V676 M1256,663 V676 M1264,663 V676 M1272,663 V676" stroke="#46556C" stroke-width=".8" opacity=".7"/>
${windings(1176, -1)}${windings(1284, 1)}
${genRotor}${stripes('Gen', 1176, 108, 36)}
<g font-family="Be Vietnam Pro,sans-serif" font-weight="700" font-size="11" text-anchor="middle"><text x="1200" y="${AX + 4}" fill="#C62828" opacity=".85">N</text><text x="1260" y="${AX + 4}" fill="#1D4E9E" opacity=".85">S</text></g>
<rect x="1310" y="608" width="34" height="64" rx="6" fill="url(#gGreenH)" ${S}/>
<rect x="1318" y="620" width="18" height="40" fill="#EEF2F7" ${S}/>
<rect x="1280" y="578" width="12" height="14" fill="#C9CED6" ${S}/>
<rect x="1104" y="${AX - 4}" width="52" height="8" fill="#8C98AB"/>
<rect x="1308" y="${AX - 4}" width="12" height="8" fill="#8C98AB"/>
<g id="busG" data-part="busduct"><path d="M1285,590 V540 H1410 V775" fill="none" stroke="#1B2B48" stroke-width="9" stroke-linejoin="round"/><path d="M1285,590 V540 H1410 V775" fill="none" stroke="#C99A3E" stroke-width="6" stroke-linejoin="round"/><path d="M1285,590 V540 H1410 V775" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.6" stroke-linejoin="round" transform="translate(-1,-1)"/></g>
</g>
<g id="valves">${valve('vTSV', 800, 585)}${valve('vDump', 770, 668, 90)}${valve('vMSV', 716, 325)}</g>
</g>`;
}

export function condenser() {
  const lowT = [810, 817, 824, 831, 838].map((y) => `<path d="M946,${y} H1094" stroke="#12919A" stroke-width="2.2"/>`).join('');
  const upT = [758, 765, 772, 779, 786].map((y) => `<path d="M946,${y} H1094" stroke="#58C0A0" stroke-width="2.2"/>`).join('');
  const sup = PIPES.filter((p) => p.id === 'sup' || p.id === 'ret');
  return `<g id="condGroup">
<g data-part="condenser" class="part">
<ellipse cx="1020" cy="886" rx="110" ry="6" fill="url(#gAO)"/>
<rect x="945" y="724" width="150" height="124" rx="6" fill="#F4F7FB" stroke="#1B2B48" stroke-width="1.6"/>
<rect x="945" y="724" width="150" height="8" fill="url(#gCylV)" ${S}/>
<rect id="sgCondSteam" x="948" y="732" width="144" height="18" fill="#E5EAF1" opacity=".9"/>
<rect x="947" y="750" width="146" height="94" fill="#EAF0F7"/>
${upT}${lowT}
<path d="M947,798 H1093" stroke="#8795A8" stroke-width="1" stroke-dasharray="4 3"/>
<rect x="945" y="848" width="150" height="34" rx="4" fill="url(#gCylV)" ${S}/>
<rect x="948" y="858" width="144" height="21" fill="url(#gWaterSec)" ${S}/>
<path d="M950,859 H1090" stroke="#fff" stroke-opacity=".8" stroke-width="1.6"/>
<path d="M928,752 H946 V844 H928 Q922,844 922,838 V758 Q922,752 928,752 Z" fill="url(#gWaterBasin)" ${S}/>
<path d="M1094,752 H1112 V796 H1094 Z" fill="#58C0A0" ${S}/><path d="M1094,802 H1112 V844 H1094 Z" fill="#12919A" ${S}/><path d="M1094,796 H1112 V802 H1094 Z" fill="#46556C"/>
<path d="M924,798 H946" stroke="#46556C" stroke-width="1" stroke-opacity="0"/>
</g>
<g data-part="steamdump" class="part" id="dumpGroup">${PIPES.filter((p) => p.id === 'dump').map(pipeSvg).join('')}</g>
<g data-part="feedpump" class="part">
${PIPES.filter((p) => p.id === 'cond' || p.id === 'feed').map(pipeSvg).join('')}
<ellipse cx="860" cy="888" rx="34" ry="5" fill="url(#gAO)"/>
<rect x="822" y="854" width="22" height="24" rx="3" fill="url(#gPaintBlueH)" ${S}/>
<rect x="840" y="862" width="8" height="8" fill="#8C98AB"/>
<circle cx="862" cy="866" r="17" fill="url(#gCylHd)" stroke="#1B2B48" stroke-width="1.6"/>
<circle cx="862" cy="866" r="12" fill="#CFE0F3" ${S}/>
<g id="imp2" transform="translate(862,866)">${[0, 90, 180, 270].map((a) => `<path d="M0,0 C5,-3 8,-7 9,-11" stroke="#46556C" stroke-width="2" fill="none" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}</g>
</g>
</g>`;
}
