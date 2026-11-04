/** Định dạng số theo kiểu Việt Nam: dấu phẩy thập phân, cách nghìn bằng dấu cách mảnh. */
const THIN = ' ';
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };

export function fmt(n, digits = 0) {
  if (!Number.isFinite(n)) return '–';
  const neg = n < 0 && Math.abs(n) >= 0.5 * Math.pow(10, -digits);
  const s = Math.abs(n).toFixed(digits);
  const [i, f] = s.split('.');
  const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  return (neg ? '−' : '') + g + (f ? ',' + f : '');
}
/** 9,4 × 10¹⁹ */
export function fmtSci(n, digits = 1) {
  if (!Number.isFinite(n) || n === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(n)));
  const m = n / Math.pow(10, e);
  let ms = m.toFixed(digits), ee = e;
  if (parseFloat(ms) >= 10) { ms = (m / 10).toFixed(digits); ee = e + 1; }
  return ms.replace('.', ',') + ' × 10' + String(ee).split('').map((c) => SUP[c] || c).join('');
}
