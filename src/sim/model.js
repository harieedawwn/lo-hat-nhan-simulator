/**
 * Mô hình mô phỏng nhà máy điện hạt nhân PWR 1000 MWe – thuần túy, không DOM, xác định.
 * Đây là mô hình dạy học đơn giản hoá, thời gian được nén (xem README, mục "Giả thiết").
 * Bước cố định DT = 0,05 s mô phỏng.
 */
export const DT = 0.05;
export const P_RATED = 3000;          // MWt
export const ETA = 0.333;             // hiệu suất nhiệt → điện
export const H_STEAM = 1.81;          // MJ/kg (nhiệt cấp cho 1 kg hơi)
export const ROD_RATE = 8;            // %/s (nén thời gian; thực tế thanh dịch chuyển chậm)
export const ROD_STEP = 0.5;          // %/bước
export const SCRAM_TIME = 2;          // s
export const RPM_SYNC = 3000;         // 60·f/p, f = 50 Hz, p = 1 cặp cực
export const ROLLUP_TIME = 12;        // s
export const COAST_TIME = 25;         // s (nén từ hàng chục phút)
export const FRAC_FISSION = 0.935;    // phần nhiệt toả ngay khi phân hạch
export const FRAC_DECAY = 0.065;      // phần nhiệt từ phân rã sản phẩm phân hạch
export const COUNTDOWN = 5;           // s đếm ngược trước khi tự động SCRAM (mục đích dạy học)
export const P_HOT = 33;
export const T_BASE = 291;
export const T_BOIL_155 = 345;        // điểm sôi ở 155 bar
export const T0_WW = 1.08;            // s thực – gốc thời gian để Way–Wigner liên tục với 6,5 %
export const TIME_COMPRESS = 10;

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lag = (cur, target, tau, dt) => cur + (target - cur) * (1 - Math.exp(-dt / tau));

/** Trạng thái đầy đủ (mọi thứ ở dạng số/boolean để tránh cấp phát trong vòng lặp nóng). */
export function createState(scenario = 'rated') {
  const s = {
    scenario,
    t: 0,
    rodTarget: 80, rod: 80, rodAcc: 0,
    scram: false, scramT: 0, scramRod0: 0, scramPf0: 0, scramReason: 'none',
    pf: 1, pfStar: 1, pd: FRAC_DECAY, shut: false, shutT: 0, shutPd0: 0,
    p: 1, k: 1,
    tHot: 291 + P_HOT, tCold: 291 - 1, pPrim: 155,
    steam: P_RATED / H_STEAM, steamBump: 0, pSteam: 64,
    rpm: RPM_SYNC, breaker: true, steamOk: true, turb: 'synced', tripSeen: false,
    pe: ETA * P_RATED,
    status: 'normal', countdown: -1, over: false, warn: false,
    ev: { rodStep: 0, sync: 0, trip: 0, scram: 0, recover: 0 },
  };
  if (scenario === 'startup') {
    Object.assign(s, {
      rodTarget: 0, rod: 0, pf: 0, pfStar: 0, pd: 0, p: 0, k: 0.924,
      tHot: T_BASE, tCold: T_BASE, steam: 0, rpm: 0, breaker: false, steamOk: false,
      turb: 'stopped', pe: 0,
    });
  }
  return s;
}

/** Đặt mục tiêu độ rút thanh (0–100 %). Bị khoá khi đang SCRAM. */
export function setRodTarget(s, w) {
  if (s.scram) return;
  s.rodTarget = clamp(Number.isFinite(w) ? w : 0, 0, 100);
}

function doScram(s, reason) {
  if (s.scram) return;
  s.scram = true; s.scramT = 0; s.scramRod0 = s.rod; s.scramPf0 = s.pf;
  s.scramReason = reason; s.rodTarget = 0; s.countdown = -1; s.rodAcc = 0;
  s.shut = true; s.shutT = 0; s.shutPd0 = s.pd;
  s.ev.scram++;
}
export function scram(s, reason = 'manual') { doScram(s, reason); }

export function canRecover(s) {
  return s.scram && s.pf < 0.01 && s.tHot < T_BASE + 3;
}
/** "Khôi phục": chỉ khi nhà máy ổn định; thanh vẫn ở 0. */
export function recover(s) {
  if (!canRecover(s)) return false;
  s.scram = false; s.scramReason = 'none'; s.rod = 0; s.rodTarget = 0; s.scramT = 0;
  s.status = 'normal'; s.countdown = -1; s.over = false; s.warn = false;
  s.ev.recover++;
  return true;
}

export function k_label(k) {
  return k > 1.0005 ? 'Vượt tới hạn' : k < 0.9995 ? 'Dưới tới hạn' : 'Tới hạn';
}

/** Một bước DT. */
export function step(s, dt = DT) {
  s.t += dt;

  // ---- thanh điều khiển ----
  if (s.scram) {
    s.scramT += dt;
    const u = Math.min(1, s.scramT / SCRAM_TIME);
    s.rod = s.scramRod0 * (1 - u * u); // rơi tự do: x ∝ t²
    if (u >= 1) s.rod = 0;
  } else if (s.rod !== s.rodTarget) {
    const dir = s.rodTarget > s.rod ? 1 : -1;
    s.rodAcc += ROD_RATE * dt;
    while (s.rodAcc >= ROD_STEP - 1e-9 && s.rod !== s.rodTarget) {
      const d = Math.min(ROD_STEP, Math.abs(s.rodTarget - s.rod));
      s.rod = dir > 0 ? s.rod + d : s.rod - d;
      if (Math.abs(s.rod - s.rodTarget) < 1e-9) s.rod = s.rodTarget;
      s.rodAcc -= ROD_STEP;
      s.ev.rodStep++;
    }
    if (s.rod === s.rodTarget) s.rodAcc = 0;
  }

  // ---- công suất phân hạch ----
  if (s.scram) {
    s.pfStar = 0;
    const ts = s.scramT;
    s.pf = s.scramPf0 * (0.025 * Math.exp(-ts / 15) + 0.975 * Math.exp(-ts / 0.2));
  } else {
    s.pfStar = s.rod / 80;
    s.pf = lag(s.pf, s.pfStar, s.pfStar > s.pf ? 3 : 2, dt);
  }

  // ---- nhiệt phân rã ----
  if (!s.shut && s.pf < 0.01) { s.shut = true; s.shutT = 0; s.shutPd0 = s.pd; }
  else if (s.shut && !s.scram && s.pf > 0.02) { s.shut = false; }
  if (s.shut) {
    s.shutT += dt;
    // Way–Wigner: P/P0 ∝ t^-0,2 với thời gian nén ×10, liên tục tại t = 0
    s.pd = s.shutPd0 * Math.pow(1 + (TIME_COMPRESS * s.shutT) / T0_WW, -0.2);
  } else {
    s.pd = lag(s.pd, FRAC_DECAY * s.pf, 60, dt);
  }
  s.p = FRAC_FISSION * s.pf + s.pd;

  // ---- hệ số nhân neutron k (suy ra từ tốc độ đổi của p_f) ----
  let kT;
  if (s.scram) {
    kT = 0.90 + 0.05 * (1 - Math.exp(-s.scramT / 2));
  } else {
    const r = s.pfStar / Math.max(s.pf, 1e-3);
    const g = (r - 1) / (r >= 1 ? 3 : 2);
    kT = g >= 0 ? 1 + 0.02 * Math.tanh(g / 0.05) : 1 - 0.10 * Math.tanh(-g / 0.5);
  }
  s.k = clamp(lag(s.k, kT, 0.3, dt), 0.85, 1.02);

  // ---- vòng sơ cấp ----
  s.tHot = lag(s.tHot, T_BASE + P_HOT * s.p, 6, dt);
  s.tCold = lag(s.tCold, T_BASE - 1 * s.p, 6, dt);
  s.pPrim = 155 + 0.4 * Math.sin(0.37 * s.t) + 0.1 * Math.sin(1.3 * s.t);

  // ---- hơi ----
  s.steam = lag(s.steam, (s.p * P_RATED) / H_STEAM, 3, dt);
  s.steamBump = s.steamBump * Math.exp(-dt / 4);
  s.pSteam = 64 + s.steamBump;

  // ---- tuabin – máy phát ----
  if (s.scram) s.steamOk = false;
  else if (s.p > 0.03) s.steamOk = true;
  else if (s.p < 0.02) s.steamOk = false;

  if (s.steamOk) {
    if (s.rpm < RPM_SYNC) {
      s.rpm = Math.min(RPM_SYNC, s.rpm + (RPM_SYNC / ROLLUP_TIME) * dt);
      s.turb = 'rolling';
    }
    if (s.rpm >= RPM_SYNC) {
      if (!s.breaker) { s.breaker = true; s.ev.sync++; s.tripSeen = false; }
      s.turb = 'synced';
    }
  } else {
    if (s.breaker) { s.breaker = false; s.ev.trip++; s.steamBump = 5; s.pe = 0; }
    if (s.rpm > 0) {
      s.tripSeen = true;
      s.rpm = Math.max(0, s.rpm - (RPM_SYNC / COAST_TIME) * dt);
      s.turb = s.rpm > 0 ? 'coasting' : 'stopped';
    } else s.turb = 'stopped';
  }
  if (s.breaker) s.pe = lag(s.pe, ETA * s.steam * H_STEAM, 2, dt);
  else s.pe = 0;

  // ---- trạng thái & bảo vệ ----
  if (!s.scram) {
    s.over = s.over ? !(s.p < 1.09 && s.tHot < 327.0) : (s.p > 1.10 || s.tHot > 327.5);
    s.warn = s.warn ? !(s.p < 1.025 && s.tHot < 325.0) : (s.p > 1.03 || s.tHot > 325.5);
    if (s.over) {
      if (s.countdown < 0) s.countdown = COUNTDOWN;
      s.countdown -= dt;
      if (s.p >= 1.18) doScram(s, 'prompt');
      else if (s.countdown <= 0) doScram(s, 'auto');
    } else s.countdown = -1;
  }
  s.status = s.scram ? 'scram' : s.over ? 'overheat' : s.warn ? 'warning' : 'normal';
  return s;
}

/** Các đại lượng suy ra để hiển thị (cấp phát 1 object – gọi ≤ 10 lần/s). */
export function derive(s) {
  const pTh = s.p * P_RATED;
  const waste = Math.max(0, pTh - s.pe);
  return {
    pTh, pFis: s.pf * P_RATED, pDecay: s.pd * P_RATED, pFisHeat: FRAC_FISSION * s.pf * P_RATED,
    pe: s.pe, waste, eta: pTh > 1 ? s.pe / pTh : 0,
    dTcool: 10 * waste / 2000,
    steam: s.steam, pSteam: s.pSteam, rpm: s.rpm,
    tHot: s.tHot, tCold: s.tCold, pPrim: s.pPrim, k: s.k, kLabel: k_label(s.k),
  };
}

/** Chạy n bước (tiện cho kiểm thử). */
export function run(s, seconds, dt = DT) {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) step(s, dt);
  return s;
}
