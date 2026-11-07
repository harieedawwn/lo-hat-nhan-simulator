import { background, lake, trees, defs, person, truck } from './plant_env.js';
import { reactorBuilding } from './plant_reactor.js';
import { hallBack, hallEquip, condenser } from './plant_hall.js';
import { transformerYard, transmission, transmissionWires, coolingTower, undergroundL3 } from './plant_yard.js';

/** Nội dung nhóm "world" (toạ độ thế giới). */
export function buildPlant() {
  return `${defs()}
<g id="world">
${background()}
${lake()}
${trees()}
${transmission()}
${coolingTower()}
${hallBack()}
${transformerYard()}
${reactorBuilding()}
${hallEquip()}
${condenser()}
${undergroundL3()}
${transmissionWires()}
<g id="folk">${person(742, 900)}${person(1658, 900, -1, 0.95)}${person(1880, 900, 1, 0.9)}${person(2214, 900, -1, 1)}${truck(1768, 900)}</g>
</g>`;
}
