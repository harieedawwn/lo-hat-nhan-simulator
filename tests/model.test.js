import { describe, it, expect } from 'vitest';
import { createState, step, run, setRodTarget, scram, recover, canRecover, derive, DT, P_RATED } from '../src/sim/model.js';
import { calcCorner, E_FISSION } from '../src/sim/calc.js';
import { fmt, fmtSci } from '../src/sim/format.js';

function steady(w) {
  const s = createState('rated');
  setRodTarget(s, w);
  run(s, 1200);
  return s;
}

describe('trạng thái ổn định định mức (w = 80 %)', () => {
  const s = createState('rated');
  run(s, 600);
  const d = derive(s);
  it('3000 MWt ±1 %', () => expect(Math.abs(d.pTh - 3000) / 3000).toBeLessThan(0.01));
  it('1000 MWe ±2 %', () => expect(Math.abs(d.pe - 1000) / 1000).toBeLessThan(0.02));
  it('T_nóng ≈ 324 °C', () => expect(s.tHot).toBeCloseTo(324, 0));
  it('T_lạnh ≈ 290 °C', () => expect(s.tCold).toBeCloseTo(290, 0));
  it('k = 1,000', () => expect(s.k.toFixed(3)).toBe('1.000'));
  it('tuabin đã hòa lưới ở 3000 vòng/phút', () => { expect(s.rpm).toBe(3000); expect(s.breaker).toBe(true); });
  it('trạng thái bình thường', () => expect(s.status).toBe('normal'));
  it('cân bằng năng lượng P_nhiệt = P_điện + P_thải', () => expect(d.pe + d.waste).toBeCloseTo(d.pTh, 6));
  it('lưu lượng hơi ≈ 1650 kg/s, 64 bar', () => { expect(s.steam).toBeGreaterThan(1640); expect(s.steam).toBeLessThan(1670); expect(s.pSteam).toBeCloseTo(64, 1); });
  it('hiệu suất ≈ 33 %, thải ≈ 2000 MW', () => { expect(d.eta).toBeCloseTo(0.333, 2); expect(d.waste).toBeCloseTo(2000, -1); });
});

describe('công suất ổn định đơn điệu theo độ rút thanh', () => {
  it('tăng theo w', () => {
    let prev = -1;
    for (const w of [10, 20, 30, 40, 50, 60, 70, 80]) {
      const s = createState('rated'); setRodTarget(s, w); run(s, 400);
      const p = s.p; expect(p).toBeGreaterThan(prev); prev = p;
      expect(p).toBeCloseTo(w / 80, 2);
    }
  });
});

describe('SCRAM', () => {
  const s = createState('rated'); run(s, 30);
  scram(s);
  const rods = [];
  const log = {};
  for (let i = 1; i <= 20 / DT; i++) {
    step(s);
    const t = i * DT;
    if (Math.abs(t - 1) < 1e-9) log.p1 = s.p;
    if (Math.abs(t - 2.5) < 1e-9) log.rod25 = s.rod;
    if (Math.abs(t - 2) < 1e-9) log.rod2 = s.rod;
    if (Math.abs(t - 10) < 1e-9) log.p10 = s.p;
    if (Math.abs(t - 60) < 1e-9) log.k60 = s.k;
    if (t > 0.2 && log.pe0 === undefined && !s.breaker) log.pe0 = s.pe;
    rods.push(s.rod);
  }
  it('thanh về 0 trong ≤ 2,5 s', () => { expect(log.rod25).toBe(0); expect(log.rod2).toBeLessThan(1); });
  it('thanh rơi đơn điệu', () => { for (let i = 1; i < rods.length; i++) expect(rods[i]).toBeLessThanOrEqual(rods[i - 1]); });
  it('tổng nhiệt ≈ 6–7 % sau 1 s', () => { expect(log.p1).toBeGreaterThan(0.06); expect(log.p1).toBeLessThan(0.075); });
  it('nhiệt giảm dần nhưng còn dư nhiệt', () => { expect(s.p).toBeLessThan(log.p1); expect(s.pd).toBeGreaterThan(0.02); });
  it('máy cắt mở, P_điện = 0', () => { expect(s.breaker).toBe(false); expect(s.pe).toBe(0); });
  it('k < 1 sau SCRAM', () => { expect(s.k).toBeLessThan(0.96); expect(s.k).toBeGreaterThanOrEqual(0.9); });
  it('trạng thái dập lò', () => expect(s.status).toBe('scram'));
  it('tuabin về 0 vòng/phút', () => { run(s, 40); expect(s.rpm).toBe(0); });
  it('dư nhiệt sau 1 giờ thực (≈6 min mô phỏng) ≈ 1–2 %', () => {
    const q = createState('rated'); run(q, 30); scram(q); run(q, 360);
    expect(q.pd).toBeGreaterThan(0.01); expect(q.pd).toBeLessThan(0.02);
  });
  it('dư nhiệt sau 1 phút thực (6 s) ≈ 3 %', () => {
    const q = createState('rated'); run(q, 30); scram(q); run(q, 6);
    // thành phần nhiệt phân rã (không tính đuôi phân hạch τ = 15 s theo đặc tả)
    expect(q.pd).toBeGreaterThan(0.025); expect(q.pd).toBeLessThan(0.035);
  });
});

describe('bảo vệ tự động', () => {
  it('Quá nhiệt → đếm ngược 5 s → SCRAM', () => {
    const s = createState('rated'); setRodTarget(s, 90); // p → 1,125 > 1,10
    let tOver = null, tScram = null;
    for (let i = 0; i < 60 / DT && tScram === null; i++) {
      step(s);
      if (s.status === 'overheat' && tOver === null) tOver = s.t;
      if (s.scram) tScram = s.t;
    }
    expect(tOver).not.toBeNull();
    expect(tScram - tOver).toBeGreaterThan(4.8);
    expect(tScram - tOver).toBeLessThan(5.3);
    expect(s.scramReason).toBe('auto');
  });
  it('p ≥ 1,18 → tắt lò ngay', () => {
    const s = createState('rated'); setRodTarget(s, 100);
    run(s, 30);
    expect(s.scram).toBe(true);
    expect(s.scramReason).toBe('prompt');
  });
  it('Cảnh báo giữa 1,03 và 1,10', () => {
    const s = createState('rated'); setRodTarget(s, 85); run(s, 200); // p = 1,0625
    expect(s.status).toBe('warning');
  });
  it('đếm ngược huỷ khi trở lại bình thường', () => {
    const s = createState('rated'); setRodTarget(s, 90);
    for (let i = 0; i < 400 && s.status !== 'overheat'; i++) step(s);
    expect(s.status).toBe('overheat'); run(s, 2); setRodTarget(s, 80); run(s, 30);
    expect(s.scram).toBe(false); expect(s.status).toBe('normal');
  });
});

describe('Khôi phục', () => {
  it('chỉ khi ổn định; thanh ở 0; hòa lưới lại', () => {
    const s = createState('rated'); run(s, 10); scram(s);
    expect(recover(s)).toBe(false);             // quá sớm
    run(s, 3); expect(canRecover(s)).toBe(false);
    run(s, 60);
    expect(canRecover(s)).toBe(true);
    expect(recover(s)).toBe(true);
    expect(s.scram).toBe(false); expect(s.rod).toBe(0); expect(s.status).toBe('normal');
    setRodTarget(s, 80); run(s, 200);
    expect(s.breaker).toBe(true); expect(s.rpm).toBe(3000);
    expect(derive(s).pe).toBeGreaterThan(900);
  });
  it('không đổi mục tiêu thanh khi đang SCRAM', () => {
    const s = createState('rated'); scram(s); setRodTarget(s, 80); run(s, 5);
    expect(s.rod).toBe(0);
  });
});

describe('kịch bản khởi động từ dừng lò nóng', () => {
  it('rút thanh → k > 1 → hòa lưới', () => {
    const s = createState('startup');
    expect(s.rpm).toBe(0); expect(s.tHot).toBe(291); expect(s.k).toBeLessThan(1);
    setRodTarget(s, 80);
    let kmax = 0, synced = null;
    for (let i = 0; i < 300 / DT; i++) {
      step(s); kmax = Math.max(kmax, s.k);
      if (s.breaker && synced === null) synced = s.t;
    }
    expect(kmax).toBeGreaterThan(1.001);
    expect(synced).not.toBeNull();
    expect(s.rpm).toBe(3000);
    expect(derive(s).pe).toBeGreaterThan(950);
    expect(s.status).toBe('normal');
  });
});

describe('Góc tính toán', () => {
  const c = calcCorner(3000, 3000, 1000);
  it('N ≈ 9,4 × 10¹⁹ phân hạch/s', () => { expect(c.N / 1e19).toBeCloseTo(9.36, 1); });
  it('200 MeV = 3,204 × 10⁻¹¹ J', () => expect(E_FISSION).toBeCloseTo(3.204e-11, 14));
  it('U-235 ≈ 3,2 kg/ngày', () => expect(c.uKgDay).toBeCloseTo(3.16, 1));
  it('khối lượng chuyển hoá ≈ 2,9 g/ngày', () => expect(c.massGDay).toBeCloseTo(2.88, 1));
  it('than ≈ 8 800 tấn/ngày', () => { expect(c.coalTDay).toBeGreaterThan(8700); expect(c.coalTDay).toBeLessThan(8900); });
  it('η ≈ 33 %, thải ≈ 2000 MW', () => { expect(c.eta).toBeCloseTo(1 / 3, 3); expect(c.waste).toBe(2000); });
  it('tỉ lệ thuận với công suất', () => {
    const h = calcCorner(1500, 1500, 500);
    expect(h.N).toBeCloseTo(c.N / 2, -5); expect(h.uKgDay).toBeCloseTo(c.uKgDay / 2, 6);
  });
  it('số liệu trong mô hình khớp: N từ trạng thái ổn định', () => {
    const s = createState('rated'); run(s, 60); const d = derive(s);
    const k = calcCorner(d.pFis, d.pTh, d.pe);
    expect(k.N / 1e19).toBeCloseTo(9.36, 1);
  });
  it('định dạng số kiểu Việt Nam', () => {
    expect(fmt(3000)).toBe('3 0' + '00'); expect(fmt(0.333, 3)).toBe('0,333');
    expect(fmt(8846.6)).toBe('8 847'); expect(fmtSci(9.3624e19)).toBe('9,4 × 10¹⁹');
  });
  it('phản ứng ví dụ cân bằng A, Z', () => {
    expect(235 + 1).toBe(141 + 92 + 3); expect(92).toBe(56 + 36);
  });
});

describe('độ bền số học', () => {
  it('không NaN/Infinity sau 10 000 bước với đầu vào ngẫu nhiên', () => {
    let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (const sc of ['rated', 'startup']) {
      const s = createState(sc);
      for (let i = 0; i < 10000; i++) {
        const r = rnd();
        if (r < 0.01) setRodTarget(s, rnd() * 100);
        else if (r < 0.012) scram(s);
        else if (r < 0.02) recover(s);
        step(s);
        for (const key of ['rod', 'pf', 'pd', 'p', 'k', 'tHot', 'tCold', 'steam', 'rpm', 'pe', 'pPrim', 'pSteam']) {
          if (!Number.isFinite(s[key])) throw new Error(key + ' không hữu hạn tại bước ' + i);
        }
        const d = derive(s);
        for (const key of Object.keys(d)) if (typeof d[key] === 'number' && !Number.isFinite(d[key])) throw new Error('derive.' + key);
      }
    }
  });
});
