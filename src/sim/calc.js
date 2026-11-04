/** "Góc tính toán": các con số suy ra từ công suất hiện tại (SI). */
export const MEV = 1.602176634e-13;      // J
export const E_FISSION_MEV = 200;
export const E_FISSION = E_FISSION_MEV * MEV; // 3,204 × 10⁻¹¹ J
export const N_A = 6.02214076e23;
export const C = 2.99792458e8;
export const COAL_MJ_PER_KG = 29.3;
export const M_U235 = 235;               // g/mol
export const DAY = 86400;

/**
 * @param {number} pFisMW  công suất phân hạch quy đổi (p_f × 3000 MW; 200 MeV đã gồm phần nhiệt phân rã)
 * @param {number} pThMW   công suất nhiệt đang sinh ra trong lò (MW)
 * @param {number} peMW    công suất điện (MW)
 */
export function calcCorner(pFisMW, pThMW, peMW) {
  const N = (pFisMW * 1e6) / E_FISSION;                         // phân hạch/s
  const uKgDay = (N * DAY / N_A) * M_U235 / 1000;               // kg U-235/ngày
  const massGDay = (pThMW * 1e6 * DAY / (C * C)) * 1000;        // g/ngày (E = mc²)
  const coalTDay = (pThMW * 1e6 * DAY) / (COAL_MJ_PER_KG * 1e6) / 1000; // tấn/ngày
  const eta = pThMW > 1 ? peMW / pThMW : 0;
  const waste = Math.max(0, pThMW - peMW);
  return { N, uKgDay, massGDay, coalTDay, eta, waste };
}
