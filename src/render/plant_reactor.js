import { PIPES, TUBE_A, SG_X, tubePath } from './geometry.js';

const S = 'stroke="#1B2B48" stroke-opacity=".6" stroke-width="1.4"';

export function pipeSvg(p) {
  const base = { hot: '#A3162E', cold: '#E5645B', steam: '#EEF1F5', water: '#2F76C4', cool: '#12919A', warm: '#58C0A0' }[p.cls];
  const edge = { hot: '#4B0B18', cold: '#8A2E2B', steam: '#7C8899', water: '#173F75', cool: '#0A4F55', warm: '#2D7A62' }[p.cls];
  const dash = p.loop === 1 ? '' : p.loop === 2 ? 'stroke-dasharray="10 6"' : 'stroke-dasharray="2 5" stroke-linecap="round"';
  return `<g class="pipe l${p.loop}" data-pipe="${p.id}" data-part="${p.part}">
<path d="${p.d}" fill="none" stroke="${edge}" stroke-width="${p.w + 3.4}" stroke-linejoin="round"/>
<path d="${p.d}" fill="none" stroke="${base}" stroke-width="${p.w}" stroke-linejoin="round"/>
<path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="${Math.max(2, p.w * 0.28)}" ${dash} stroke-linejoin="round" transform="translate(0,-${(p.w * 0.18).toFixed(1)})"/>
<path d="${p.d}" fill="none" stroke="transparent" stroke-width="${p.w + 14}" stroke-linejoin="round"/>
</g>`;
}

function contain() {
  const outer = 'M70,900 L70,300 A310,130 0 0 1 690,300 L690,900 Z';
  const inner = 'M96,884 L96,300 A284,104 0 0 1 664,300 L664,884 Z';
  return `<g id="containment" data-part="containment" class="part">
<ellipse cx="380" cy="906" rx="360" ry="10" fill="url(#gAO)"/>
<rect x="56" y="900" width="648" height="46" fill="url(#gConcD)" ${S}/>
<rect x="56" y="900" width="648" height="46" fill="url(#pRebar)"/>
<path d="${outer}" fill="url(#gConc)" ${S}/>
<path d="${outer} ${inner}" fill="url(#pRebar)" fill-rule="evenodd"/>
<path d="${inner}" fill="url(#gInside)" />
<path d="${inner}" fill="none" stroke="#7088A6" stroke-width="3"/>
<path d="M96,900 H664" stroke="#1B2B48" stroke-opacity=".4"/>
<rect x="96" y="884" width="568" height="16" fill="url(#gConcD)" ${S}/>
<path d="M98,300 L98,884" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
<g id="crane" opacity=".95">
<rect x="98" y="296" width="26" height="8" fill="#9AA5B6" ${S}/><rect x="636" y="296" width="26" height="8" fill="#9AA5B6" ${S}/>
<rect x="118" y="302" width="524" height="10" rx="2" fill="url(#gYellow)" ${S}/>
<path d="M130,312 L180,302 L230,312 L280,302 L330,312 L380,302 L430,312 L480,302 L530,312 L580,302 L630,312" fill="none" stroke="#9A7420" stroke-width="1.2"/>
<rect x="300" y="294" width="34" height="10" rx="2" fill="#E3B24B" ${S}/>
<path d="M317,312 V340" stroke="#46556C" stroke-width="1.6" stroke-dasharray="3 2"/><path d="M317,340 q-6,0 -6,6 q0,6 6,6" fill="none" stroke="#46556C" stroke-width="2.4"/>
</g>
</g>`;
}

function vessel() {
  const outer = 'M170,490 L170,790 A80,56 0 0 0 330,790 L330,490 A80,52 0 0 0 170,490 Z';
  const inner = 'M184,492 L184,790 A66,44 0 0 0 316,790 L316,492 A66,40 0 0 0 184,492 Z';
  const asm = [210, 226, 242, 258, 274].map((x, i) => `<rect class="asm" data-i="${i}" x="${x}" y="620" width="16" height="160" fill="#7C8AA3"/>`).join('');
  const rods = [218, 250, 282].map((cx) => `
<g class="rodset" data-cx="${cx}">
<g stroke="#10151F" stroke-linecap="butt">
<path d="M${cx - 5},624 V780" stroke-width="2.4"/><path d="M${cx - 1.7},624 V780" stroke-width="2.4"/><path d="M${cx + 1.7},624 V780" stroke-width="2.4"/><path d="M${cx + 5},624 V780" stroke-width="2.4"/></g>
<path d="M${cx - 5.6},624 V780 M${cx - 2.3},624 V780 M${cx + 1.1},624 V780 M${cx + 4.4},624 V780" stroke="#fff" stroke-opacity=".35" stroke-width=".7"/>
<rect x="${cx - 7}" y="614" width="14" height="9" rx="1.5" fill="#46556C" stroke="#10151F" stroke-width=".8"/>
<path d="M${cx},614 V340" stroke="#8C98AB" stroke-width="3"/>
<path d="M${cx},614 V340" stroke="#2B3A55" stroke-width="3" stroke-dasharray="1.3 6.7"/>
</g>`).join('');
  const crdm = [218, 250, 282].map((cx) => `
<rect x="${cx - 9}" y="356" width="18" height="98" rx="3" fill="#EEF2F7" ${S}/>
<rect x="${cx - 11}" y="352" width="22" height="8" rx="2.5" fill="url(#gCylHd)" ${S}/>
<g fill="#6F7E97" ${S}><rect x="${cx - 12}" y="378" width="24" height="9" rx="2"/><rect x="${cx - 12}" y="392" width="24" height="9" rx="2"/><rect x="${cx - 12}" y="406" width="24" height="9" rx="2"/></g>`).join('');
  return `<g id="vesselGroup">
<ellipse cx="250" cy="850" rx="100" ry="9" fill="url(#gAO)"/>
<g data-part="rpv" class="part">
<path d="${outer}" fill="url(#gCylHd)" stroke="#1B2B48" stroke-width="1.6"/>
<rect x="162" y="484" width="176" height="14" rx="3" fill="#5D6D86" ${S}/>
<path d="${inner}" fill="url(#gPrimCold)"/>
<g clip-path="url(#clipVesselIn)">
<rect x="184" y="440" width="132" height="70" fill="url(#gPrimHot)" opacity=".85"/>
<rect x="184" y="500" width="132" height="120" fill="url(#gPrimHot)" opacity=".9"/>
<rect x="184" y="620" width="132" height="190" fill="url(#gPrimMix)"/>
<rect x="184" y="780" width="132" height="70" fill="url(#gPrimCold)"/>
<rect x="184" y="500" width="24" height="120" fill="#EE9A92" opacity=".0"/>
</g>
<g data-part="water" class="part"><rect x="184" y="500" width="24" height="310" fill="#EE9A92" opacity=".55" clip-path="url(#clipVesselIn)"/>
<rect x="292" y="600" width="24" height="210" fill="#EE9A92" opacity=".55" clip-path="url(#clipVesselIn)"/></g>
<rect x="292" y="500" width="24" height="100" fill="#8D2C3A" opacity=".5" clip-path="url(#clipVesselIn)"/>
<path d="M208,504 V806 M292,504 V806" stroke="#46556C" stroke-width="4"/>
<path d="M208,806 H292" stroke="#46556C" stroke-width="4"/>
<rect x="212" y="502" width="76" height="10" fill="#5D6D86"/>
<path d="M184,492 L184,790 A66,44 0 0 0 316,790 L316,492 A66,40 0 0 0 184,492 Z" fill="none" stroke="#1B2B48" stroke-opacity=".55" stroke-width="1.2"/>
<rect x="330" y="534" width="14" height="22" rx="2" fill="#5D6D86" ${S}/><rect x="330" y="589" width="14" height="22" rx="2" fill="#5D6D86" ${S}/>
</g>
<g data-part="core" class="part">
<ellipse id="cher" cx="250" cy="700" rx="52" ry="92" fill="url(#gCher)" opacity="0"/>
${asm}
<rect x="210" y="620" width="80" height="160" fill="url(#pFuel)"/>
<rect x="210" y="620" width="80" height="160" fill="url(#gAxial)"/>
<g stroke="#1B2B48" stroke-opacity=".5" stroke-width="1"><path d="M210,646 H290 M210,690 H290 M210,734 H290 M210,764 H290"/><path d="M226,620 V780 M242,620 V780 M258,620 V780 M274,620 V780" stroke-opacity=".28"/></g>
<rect x="209" y="619" width="82" height="162" fill="none" ${S}/>
</g>
<g data-part="rods" class="part">
<g clip-path="url(#clipRods)" id="rodsAll">${rods}</g>
${crdm}
<rect x="205" y="350" width="90" height="108" fill="transparent"/>
</g>
<g id="vesselAlarm" opacity="0"><path d="${outer}" fill="none" stroke="#E5322D" stroke-width="6" stroke-linejoin="round"/></g>
</g>`;
}

function pressurizer() {
  const sh = 'M366,300 A32,28 0 0 1 430,300 L430,450 A32,28 0 0 1 366,450 Z';
  return `<g id="przGroup" data-part="pressurizer" class="part">
<ellipse cx="398" cy="482" rx="40" ry="5" fill="url(#gAO)"/>
<path d="${sh}" fill="url(#gCylHd)" stroke="#1B2B48" stroke-width="1.6"/>
<path d="M372,300 A26,22 0 0 1 424,300 L424,450 A26,22 0 0 1 372,450 Z" fill="#F4F6FA"/>
<g clip-path="url(#clipPrz)"><rect x="366" y="360" width="64" height="130" fill="url(#gPrimHot)"/>
<path d="M370,360 H426" stroke="#fff" stroke-width="2" opacity=".8"/></g>
<path d="M372,300 A26,22 0 0 1 424,300 L424,450 A26,22 0 0 1 372,450 Z" fill="none" stroke="#1B2B48" stroke-opacity=".35"/>
<g stroke="#F08A24" stroke-width="2.6" fill="none" stroke-linejoin="round" id="przHeat"><path d="M382,468 V420 l6,-8 l6,8 V468"/><path d="M398,468 V416 l6,-8 l6,8 V468" transform="translate(-6,0)"/><path d="M414,468 V420 l6,-8 l6,8 V468" transform="translate(-14,0)"/></g>
<path d="M398,272 V258" stroke="#46556C" stroke-width="4"/><rect x="391" y="250" width="14" height="9" rx="2" fill="#C9CED6" ${S}/>
<g fill="#fff" opacity=".7"><circle cx="388" cy="330" r="3"/><circle cx="410" cy="318" r="2.2"/><circle cx="400" cy="346" r="2.6"/></g>
</g>`;
}

function steamGen() {
  const shell = 'M468,780 L468,505 L448,470 L448,360 A72,28 0 0 1 592,360 L592,470 L572,505 L572,780 Z';
  const cans = [468, 494, 520, 546, 572].map((x) => `<rect x="${x - 7}" y="396" width="14" height="46" rx="2" fill="url(#gCylHd)" ${S}/><path d="M${x - 7},408 q7,6 14,0 M${x - 7},420 q7,6 14,0 M${x - 7},432 q7,6 14,0" stroke="#EEF2F7" stroke-width="1" fill="none" opacity=".7"/>`).join('');
  const tubes = TUBE_A.map((a) => {
    const L = `M${SG_X - a},778 L${SG_X - a},560 A${a},${a} 0 0 1 ${SG_X},${560 - a}`;
    const R = `M${SG_X},${560 - a} A${a},${a} 0 0 1 ${SG_X + a},560 L${SG_X + a},778`;
    return `<path d="${L}" stroke="#4B0B18" stroke-width="4.6" fill="none"/><path d="${R}" stroke="#8A2E2B" stroke-width="4.6" fill="none"/><path d="${L}" stroke="#A3162E" stroke-width="3.2" fill="none"/><path d="${R}" stroke="#E5645B" stroke-width="3.2" fill="none"/>`;
  }).join('');
  return `<g id="sgGroup">
<ellipse cx="520" cy="855" rx="80" ry="8" fill="url(#gAO)"/>
<g data-part="steamgen" class="part">
<path d="${shell}" fill="url(#gCylHd)" stroke="#1B2B48" stroke-width="1.6"/>
<g clip-path="url(#clipSGsec)">
<rect x="440" y="320" width="160" height="130" fill="#F7F9FC"/>
<rect id="sgSteamTint" x="440" y="320" width="160" height="130" fill="#EAF0F7"/>
<rect x="440" y="446" width="160" height="340" fill="url(#gWaterSec)"/>
<path d="M444,446 H596" stroke="#fff" stroke-width="2.2" opacity=".9"/>
<rect x="478" y="520" width="84" height="258" fill="none" stroke="#46556C" stroke-width="1.2" stroke-dasharray="5 3"/>
<g stroke="#46556C" stroke-width="1.2" opacity=".8"><path d="M479,640 H561 M479,705 H561"/></g>
</g>
${cans}
<path d="${shell}" fill="none" stroke="#1B2B48" stroke-opacity=".55" stroke-width="1.2"/>
<rect x="464" y="776" width="112" height="12" fill="#46556C" ${S}/>
<path d="M464,788 L576,788 L576,812 A56,36 0 0 1 464,812 Z" fill="url(#gCylHd)" stroke="#1B2B48" stroke-width="1.6"/>
<path d="M472,788 L520,788 L520,840 A46,30 0 0 1 472,812 Z" fill="#C9505F" opacity=".92"/>
<path d="M520,788 L568,788 L568,812 A46,30 0 0 1 520,840 Z" fill="#EE9A92" opacity=".95"/>
<rect x="518" y="788" width="4" height="56" fill="#46556C"/>
<rect x="462" y="810" width="12" height="24" rx="2" fill="#5D6D86" ${S}/><rect x="566" y="810" width="12" height="24" rx="2" fill="#5D6D86" ${S}/>
</g>
<g data-part="utubes" class="part">${tubes}<rect x="474" y="500" width="92" height="282" fill="transparent"/></g>
<g id="sgHeat" opacity="0">${[600, 650, 700, 740].map((y, i) => `<path d="M${i % 2 ? 500 : 538},${y} h-12 l4,-4 M${i % 2 ? 500 : 538},${y} h-12 l4,4" stroke="#F08A24" stroke-width="1.6" fill="none"/>`).join('')}</g>
</g>`;
}

function pump1() {
  const imp = [0, 72, 144, 216, 288].map((a) => `<path d="M0,0 C8,-4 12,-12 14,-20" stroke="#EEF2F7" stroke-width="3" fill="none" stroke-linecap="round" transform="rotate(${a})"/>`).join('');
  return `<g data-part="pump1" class="part">
<ellipse cx="622" cy="866" rx="46" ry="6" fill="url(#gAO)"/>
<rect x="608" y="738" width="28" height="56" rx="4" fill="url(#gPaintBlueH)" ${S}/>
<g stroke="#1B2B48" stroke-opacity=".35" stroke-width="1">${[746, 752, 758, 764, 770, 776, 782].map((y) => `<path d="M608,${y} H636"/>`).join('')}</g>
<rect x="604" y="732" width="36" height="9" rx="3" fill="url(#gCylHd)" ${S}/>
<rect x="612" y="792" width="20" height="6" fill="#5D6D86" ${S}/>
<circle cx="622" cy="822" r="29" fill="url(#gCylHd)" stroke="#1B2B48" stroke-width="1.6"/>
<circle cx="622" cy="822" r="22" fill="#F2B4AC" ${S}/>
<g id="imp1" transform="translate(622,822)">${imp}<circle r="4.5" fill="#46556C"/></g>
</g>`;
}

function trefoilPlate() {
  return `<g id="radSign" data-part="radzone" class="part"><rect x="108" y="640" width="54" height="64" rx="5" fill="#fff" ${S}/><use href="#trefoil" x="116" y="646" width="38" height="38"/><rect x="112" y="690" width="46" height="8" rx="2" fill="#C62828"/></g>`;
}

function radZone() {
  const halo = PIPES.filter((p) => p.loop === 1).map((p) => `<path d="${p.d}" fill="none" stroke="url(#pHatch)" stroke-width="${p.w + 30}" stroke-linejoin="round"/>`).join('');
  return `<g id="radzone" opacity=".95">${halo}
<rect x="156" y="432" width="194" height="436" rx="14" fill="url(#pHatch)" stroke="#C62828" stroke-opacity=".45" stroke-dasharray="7 5" stroke-width="1.4"/>
<rect x="352" y="254" width="92" height="238" rx="30" fill="url(#pHatch)" stroke="#C62828" stroke-opacity=".45" stroke-dasharray="7 5" stroke-width="1.4"/>
<rect x="452" y="776" width="136" height="84" rx="22" fill="url(#pHatch)" stroke="#C62828" stroke-opacity=".45" stroke-dasharray="7 5" stroke-width="1.4"/>
<rect x="584" y="788" width="76" height="86" rx="20" fill="url(#pHatch)" stroke="#C62828" stroke-opacity=".45" stroke-dasharray="7 5" stroke-width="1.4"/>
</g>`;
}

export function reactorBuilding() {
  const p1 = PIPES.filter((p) => p.loop === 1).map(pipeSvg).join('');
  const sgpipes = PIPES.filter((p) => p.id === 'steam' || p.id === 'feed').map(pipeSvg).join('');
  return `<defs><linearGradient id="gInside" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF2F7"/><stop offset="1" stop-color="#DDE4EC"/></linearGradient></defs>
${contain()}
${radZone()}
<g id="ctInside">
${trefoilPlate()}
${steamGen()}
${pressurizer()}
${vessel()}
<g id="loop1pipes">${p1}</g>
${pump1()}
</g>
<g id="steamOutPipes">${sgpipes}</g>
<g id="beacons">
<g transform="translate(350,170)"><rect x="-6" y="-2" width="12" height="6" fill="#5D6D86"/><circle id="bcnA" cx="0" cy="-8" r="8" fill="#FFC24A" stroke="#1B2B48" stroke-width="1" stroke-opacity=".6"/><circle id="bcnAg" cx="0" cy="-8" r="34" fill="url(#gGlowA)" opacity="0"/></g>
<g transform="translate(410,170)"><rect x="-6" y="-2" width="12" height="6" fill="#5D6D86"/><circle id="bcnR" cx="0" cy="-8" r="8" fill="#FF5A52" stroke="#1B2B48" stroke-width="1" stroke-opacity=".6"/><circle id="bcnRg" cx="0" cy="-8" r="34" fill="url(#gGlowR)" opacity="0"/></g>
</g>`;
}
