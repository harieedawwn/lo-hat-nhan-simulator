import { store } from './storage.js';
/** Mức chất lượng: 0 thấp, 1 trung bình, 2 cao. Tự động theo thiết bị và đo khung hình. */
export const QNAMES = ['Thấp', 'Trung bình', 'Cao'];
export function initialQuality() {
  const mode = store.get('quality', 'auto');
  if (mode === 'high') return 2; if (mode === 'mid') return 1; if (mode === 'low') return 0;
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4, dpr = window.devicePixelRatio || 1;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (mem <= 2 || cores <= 2) return 0;
  if (mobile && (mem <= 4 || cores <= 6 || dpr >= 3)) return 1;
  return 2;
}
export class QualityGov {
  constructor(onChange) { this.onChange = onChange; this.level = initialQuality(); this.auto = store.get('quality', 'auto') === 'auto'; this.sum = 0; this.n = 0; this.t = 0; this.low = 0; }
  setMode(m) { store.set('quality', m); this.auto = m === 'auto'; this.sum = this.n = this.t = this.low = 0; this.level = m === 'auto' ? initialQuality() : m === 'high' ? 2 : m === 'mid' ? 1 : 0; this.onChange(this.level); }
  /** gọi mỗi khung với dt thật (s) */
  frame(dt) {
    if (!this.auto || dt > 0.2) return;
    this.sum += dt; this.n++; this.t += dt;
    const win = this.t < 4 ? 1.5 : 3;
    if (this.sum >= win) {
      const fps = this.n / this.sum; this.sum = 0; this.n = 0;
      if (fps < 38 && this.level > 0) { this.low++; if (this.low >= 1) { this.level--; this.low = 0; this.onChange(this.level); } } else this.low = 0;
    }
  }
}
