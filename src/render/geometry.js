/** Hình học thế giới (đơn vị: px của hệ toạ độ SVG) và đường ống dùng chung cho SVG + hạt Canvas. */
export const W = 2450, H = 1100, GROUND = 900;

/** Đường gấp khúc có bo góc. pts: [[x,y],...] */
export function poly(pts, r = 14) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(cx - px, cy - py), l2 = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const ax = cx + ((px - cx) / l1) * rr, ay = cy + ((py - cy) / l1) * rr;
    const bx = cx + ((nx - cx) / l2) * rr, by = cy + ((ny - cy) / l2) * rr;
    d += ` L${ax.toFixed(1)},${ay.toFixed(1)} Q${cx},${cy} ${bx.toFixed(1)},${by.toFixed(1)}`;
  }
  const e = pts[pts.length - 1];
  return d + ` L${e[0]},${e[1]}`;
}

/** Ống vẽ (độ rộng w). cls: kiểu màu. loop: 1/2/3. */
export const PIPES = [
  // Vòng 1
  { id: 'hotleg', loop: 1, cls: 'hot', w: 22, part: 'pipe1', d: poly([[322, 545], [398, 545], [398, 822], [472, 822]], 18) },
  { id: 'surge', loop: 1, cls: 'hot', w: 12, part: 'pressurizer', d: 'M398,545 L398,478' },
  { id: 'coldA', loop: 1, cls: 'cold', w: 22, part: 'pipe1', d: 'M570,822 L600,822' },
  { id: 'coldB', loop: 1, cls: 'cold', w: 22, part: 'pipe1', d: poly([[622, 846], [622, 862], [362, 862], [362, 600], [316, 600]], 18) },
  // Vòng 2
  { id: 'steam', loop: 2, cls: 'steam', w: 18, part: 'steamline', d: poly([[520, 336], [520, 325], [770, 325], [770, 585], [815, 585], [815, 604]], 14) },
  { id: 'cross', loop: 2, cls: 'steam', w: 14, part: 'turbine', d: poly([[890, 604], [890, 558], [1020, 558], [1020, 592]], 12) },
  { id: 'dump', loop: 2, cls: 'steam', w: 12, part: 'dump', d: poly([[770, 585], [770, 736], [946, 736]], 12) },
  { id: 'cond', loop: 2, cls: 'water', w: 13, part: 'feedpump', d: 'M946,866 L878,866' },
  { id: 'feed', loop: 2, cls: 'water', w: 12, part: 'feedpump', d: poly([[860, 848], [860, 820], [745, 820], [745, 480], [612, 480], [612, 455], [588, 455]], 14) },
  // Vòng 3
  { id: 'sup', loop: 3, cls: 'cool', w: 16, part: 'coolpump', d: poly([[2190, 1020], [1104, 1020], [1104, 846]], 18) },
  { id: 'ret', loop: 3, cls: 'warm', w: 16, part: 'coolpump', d: poly([[1112, 774], [1150, 774], [1150, 960], [1990, 960], [1990, 768]], 18) },
  { id: 'suction', loop: 3, cls: 'cool', w: 14, part: 'coolpump', d: poly([[2142, 946], [2205, 946], [2205, 1004]], 12) },
  { id: 'makeup', loop: 3, cls: 'cool', w: 10, part: 'intake', d: 'M2254,925 L2142,925' },
];

/** U-tube: nửa bán kính a (so với trục SG x=520) */
export const TUBE_A = [10, 18, 26, 34, 42];
export const SG_X = 520;
export const tubePath = (a, y0 = 800, yTop = 560) =>
  `M${SG_X - a},${y0} L${SG_X - a},${yTop} A${a},${a} 0 0 1 ${SG_X + a},${yTop} L${SG_X + a},${y0}`;

/** Đường dòng hạt Canvas. spread: độ lệch ngang; speed: px/s tại lưu lượng định mức; drive: khoá điều khiển. */
export const FLOWS = [
  // Vòng 1 (luôn chạy, bơm không dừng)
  { id: 'l1_up', loop: 1, d: poly([[250, 830], [250, 545], [398, 545], [398, 822], [492, 822]], 20), spread: 34, spreadFn: 'core', speed: 70, gap: 14, drive: 'one', c0: 'c1', c1: 'c0', size: 2.4 },
  ...TUBE_A.map((a, i) => ({ id: 'l1_t' + i, loop: 1, d: tubePath(a), spread: 0, speed: 70, gap: 22, drive: 'one', c0: 'c0', c1: 'c1', size: 1.8 })),
  { id: 'l1_cold', loop: 1, d: poly([[546, 806], [546, 822], [622, 822], [622, 862], [362, 862], [362, 600], [304, 600], [304, 800], [250, 826]], 18), spread: 5, speed: 70, gap: 12, drive: 'one', c0: 'c1', c1: 'c1', size: 2.4 },
  { id: 'l1_dcL', loop: 1, d: poly([[196, 590], [196, 800], [250, 826]], 18), spread: 5, speed: 70, gap: 12, drive: 'one', c0: 'c1', c1: 'c1', size: 2.2 },
  // Vòng 2
  { id: 'l2_a', loop: 2, d: poly([[520, 430], [520, 325], [770, 325], [770, 585]], 14), spread: 3, speed: 120, gap: 15, drive: 'steam', kind: 'steam', size: 3.2 },
  { id: 'l2_b', loop: 2, d: poly([[770, 585], [815, 585], [815, 614], [890, 614], [890, 558], [1020, 558], [1020, 592]], 12), spread: 3, speed: 120, gap: 15, drive: 'turb', kind: 'steam', size: 3.0 },
  { id: 'l2_lpL', loop: 2, d: poly([[1020, 592], [1020, 616], [965, 616], [965, 700], [965, 746]], 8), spread: 4, speed: 100, gap: 11, drive: 'turb', kind: 'steam', size: 2.4 },
  { id: 'l2_lpR', loop: 2, d: poly([[1020, 616], [1075, 616], [1075, 700], [1075, 746]], 8), spread: 4, speed: 100, gap: 12, drive: 'turb', kind: 'steam', size: 2.3 },
  { id: 'l2_lpM', loop: 2, d: 'M1020,700 L1020,746', spread: 14, speed: 100, gap: 10, drive: 'turb', kind: 'steam', size: 2.2 },
  { id: 'l2_dump', loop: 2, d: poly([[770, 585], [770, 736], [946, 736], [1000, 736]], 10), spread: 3, speed: 130, gap: 11, drive: 'dump', kind: 'steam', size: 3.2 },
  { id: 'l2_feed', loop: 2, d: poly([[1000, 866], [878, 866], [860, 866], [860, 820], [745, 820], [745, 480], [612, 480], [612, 455], [567, 455], [567, 772], [545, 790]], 12), spread: 2, speed: 80, gap: 15, drive: 'steam', kind: 'water', size: 2.4 },
  // Vòng 3
  { id: 'l3_sup', loop: 3, d: poly([[2190, 1020], [1104, 1020], [1104, 846], [1104, 838]], 18), spread: 3, speed: 90, gap: 17, drive: 'one', c0: 'k0', c1: 'k0', size: 2.4 },
  ...[812, 823, 834].map((y, i) => ({ id: 'l3_lo' + i, loop: 3, d: `M1100,${y} L938,${y}`, spread: 0, speed: 90, gap: 24, drive: 'one', c0: 'k0', c1: 'k1', size: 1.8 })),
  ...[760, 774, 788].map((y, i) => ({ id: 'l3_up' + i, loop: 3, d: `M938,${y} L1100,${y}`, spread: 0, speed: 90, gap: 24, drive: 'one', c0: 'k1', c1: 'k2', size: 1.8 })),
  { id: 'l3_ret', loop: 3, d: poly([[1100, 774], [1150, 774], [1150, 960], [1990, 960], [1990, 776]], 18), spread: 3, speed: 90, gap: 17, drive: 'one', c0: 'k2', c1: 'k2', size: 2.4 },
  { id: 'l3_suc', loop: 3, d: poly([[2142, 946], [2205, 946], [2205, 1004]], 12), spread: 2, speed: 90, gap: 13, drive: 'one', c0: 'k0', c1: 'k0', size: 2.2 },
  { id: 'l3_mk', loop: 3, d: 'M2254,925 L2142,925', spread: 1.5, speed: 40, gap: 18, drive: 'makeup', c0: 'k0', c1: 'k0', size: 2.0 },
];

/** Dây dẫn truyền tải (xung năng lượng). */
export const TOWER_A = 1730, TOWER_C = 2398;
export const ARM_Y = [575, 615, 655];
export function span(x0, y0, x1, y1, sag) {
  return `M${x0},${y0} Q${(x0 + x1) / 2},${(y0 + y1) / 2 + sag * 2} ${x1},${y1}`;
}
export const ELEC = [
  { id: 'bus', d: poly([[1285, 590], [1285, 540], [1410, 540], [1410, 775]], 10) },
  { id: 'hv', d: poly([[1462, 742], [1462, 692], [1590, 692], [1636, 692]], 8) },
  ...ARM_Y.map((y, i) => ({ id: 'tx' + i, d: span(1636, 692 - i * 0, TOWER_A - 58, y + 14, 6) })),
  ...ARM_Y.map((y, i) => ({ id: 'ty' + i, d: span(TOWER_A + 58, y + 14, TOWER_C - 58, y + 14, 38) })),
];

export const FOCUS = {
  overview: { x: 0, y: 90, w: 2450, h: 1010 },
  reactor: { x: 50, y: 150, w: 690, h: 800 },
  turbine: { x: 690, y: 440, w: 700, h: 480 },
  tower: { x: 1780, y: 40, w: 680, h: 1000 },
};
