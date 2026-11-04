import { PARTS, LOOP_NAMES } from './parts.js';
import { store } from './storage.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---- toast ---- */
let toastT = 0;
export function toast(msg, action, ms = 4200) {
  const t = $('toast'); t.innerHTML = '';
  const sp = document.createElement('span'); sp.textContent = msg; t.appendChild(sp);
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.onclick = action.fn; t.appendChild(b); }
  t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, action ? 12000 : ms);
}

/* ---- popover ---- */
let popFor = null;
export function closePopover() { const p = $('popover'); if (!p.hidden) { p.hidden = true; if (popFor) popFor.setAttribute('aria-expanded', 'false'); popFor = null; } }
export function openPopover(btn, build) {
  const p = $('popover');
  if (popFor === btn && !p.hidden) { closePopover(); return; }
  closePopover();
  p.innerHTML = ''; build(p);
  p.hidden = false; popFor = btn; btn.setAttribute('aria-expanded', 'true');
  const r = btn.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
  let x = Math.min(window.innerWidth - pw - 8, Math.max(8, r.right - pw)), y = r.bottom + 6;
  if (y + ph > window.innerHeight - 8) y = Math.max(8, r.top - ph - 6);
  p.style.left = x + 'px'; p.style.top = y + 'px';
  const first = p.querySelector('button'); if (first) first.focus({ preventScroll: true });
}
export function popItem(p, label, on, fn) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (on) b.className = 'on'; b.onclick = () => { fn(); }; p.appendChild(b); return b; }
document.addEventListener('pointerdown', (e) => { const p = $('popover'); if (!p.hidden && !p.contains(e.target) && !(popFor && popFor.contains(e.target))) closePopover(); }, true);

/* ---- thẻ thông tin ---- */
let lastFocus = null;
export function openInfo(key) {
  const P = PARTS[key]; if (!P) return;
  const c = $('infocard');
  const loopTag = P.loop ? `<span class="tag l${P.loop}">${LOOP_NAMES[P.loop]}</span>` : `<span class="tag">${LOOP_NAMES[0]}</span>`;
  const radTag = P.rad === 'co' ? '<span class="tag rad">Có phóng xạ</span>' : '<span class="tag norad">Không phóng xạ</span>';
  c.innerHTML = `<button class="ic-x" aria-label="Đóng thẻ thông tin">×</button><div class="ic-tags">${loopTag}${radTag}</div><h3 id="icTitle">${esc(P.name)}</h3><p>${esc(P.what)}</p><table>${P.fig.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table><p class="fun"><b>Bạn có biết?</b>${esc(P.fun)}</p>`;
  c.hidden = false; lastFocus = document.activeElement;
  c.querySelector('.ic-x').onclick = closeInfo; c.scrollTop = 0;
  c.querySelector('.ic-x').focus({ preventScroll: true });
}
export function closeInfo() { const c = $('infocard'); if (!c.hidden) { c.hidden = true; if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (_) { /* */ } } }

/* ---- hướng dẫn ---- */
export function helpHTML() {
  return `<h2 id="hmT">Hướng dẫn sử dụng</h2>
<p>Mô phỏng 2D nhà máy điện hạt nhân lò nước áp lực (PWR) 1000 MW – Vật lí 12 (Kết nối tri thức), chương IV “Vật lí hạt nhân” và Bài 24 “Công nghiệp hạt nhân”.</p>
<button class="hbtn" id="replayTour">Xem lại hướng dẫn nhanh (4 bước)</button>
<h3>Cách dùng</h3>
<ul>
<li><b>Thanh điều khiển:</b> kéo thanh trượt “Độ rút thanh điều khiển” hoặc dùng − / +. Rút nhiều thì công suất tăng; k &gt; 1 khi công suất đang tăng, k &lt; 1 khi đang giảm, k = 1 khi ổn định.</li>
<li><b>SCRAM:</b> giữ nút đỏ 0,6 giây (hoặc bấm rồi xác nhận nếu dùng bàn phím) để dập lò khẩn cấp. Thanh rơi hết trong ≈ 2 giây nhưng nhiệt phân rã vẫn còn 6–7 %.</li>
<li><b>Khôi phục:</b> chỉ bấm được khi lò đã ổn định. Thanh vẫn ở 0 %, bạn rút lại để khởi động.</li>
<li><b>Sơ đồ:</b> kéo để di chuyển, chụm hai ngón (hoặc cuộn chuột) để thu phóng, chạm vào một bộ phận để xem thẻ thông tin. Dùng các nút “Lò phản ứng / Tuabin – máy phát / Tháp làm mát / Toàn cảnh”.</li>
<li><b>Làm nổi bật vòng 1 / 2 / 3</b> làm mờ phần còn lại. Nút <b>Nhãn</b> ẩn toàn bộ tên bộ phận để hỏi học sinh “đây là bộ phận nào?”.</li>
<li><b>Kịch bản:</b> “Vận hành định mức 100 %” hoặc “Khởi động từ dừng lò nóng” (rút thanh, xem k &gt; 1, tuabin tăng tốc và hòa lưới).</li>
</ul>
<h3>Ý nghĩa màu sắc</h3>
<table>
<tr><td>Vòng 1 ①</td><td>Sơ cấp, <b>có phóng xạ</b>, nằm trong vỏ bọc lò. Nhánh nóng đỏ thẫm (≈ 325 °C), nhánh lạnh đỏ san hô (≈ 291 °C). Nét liền.</td></tr>
<tr><td>Vòng 2 ②</td><td>Thứ cấp, không phóng xạ. Hơi trắng xám, nước cấp xanh dương. Nét đứt.</td></tr>
<tr><td>Vòng 3 ③</td><td>Làm mát, không phóng xạ. Nước lạnh xanh lơ, nước ấm xanh ngọc. Nét chấm.</td></tr>
<tr><td>Xung vàng</td><td>Điện năng, mật độ tỉ lệ với công suất điện.</td></tr>
<tr><td>Màu lõi lò</td><td>Bản đồ nhiệt minh hoạ (xanh → vàng → cam → đỏ khi công suất tăng). Lõi thật không phát sáng đỏ.</td></tr>
<tr><td>Đám hơi trắng</td><td>Hơi nước từ tháp làm mát – không phóng xạ.</td></tr>
</table>
<p>Màu không phải là dấu hiệu duy nhất: mỗi vòng còn có số ①②③, kiểu nét và tên gọi.</p>
<h3>Phím tắt (cho giáo viên)</h3>
<table>
<tr><td><kbd>Space</kbd></td><td>Tạm dừng / chạy tiếp</td></tr>
<tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Giảm / tăng độ rút thanh 1 % (giữ <kbd>Shift</kbd>: 5 %)</td></tr>
<tr><td><kbd>L</kbd></td><td>Bật / tắt nhãn</td></tr>
<tr><td><kbd>F</kbd></td><td>Toàn màn hình</td></tr>
<tr><td><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></td><td>Làm nổi bật vòng 1 / 2 / 3 (bấm lại để bỏ)</td></tr>
<tr><td><kbd>0</kbd></td><td>Về toàn cảnh</td></tr>
<tr><td><kbd>Esc</kbd></td><td>Đóng thẻ thông tin / cửa sổ</td></tr>
</table>
<h3>Gợi ý cho giáo viên</h3>
<div class="act"><b>1. Ba vòng nước không bao giờ trộn lẫn</b>Bấm “Làm nổi bật” vòng 1, 2, 3 lần lượt. Yêu cầu học sinh chỉ ra hai nơi nhiệt đi qua thành kim loại (ống chữ U và ống bình ngưng) và giải thích vì sao đám hơi ở tháp làm mát không phóng xạ. Ẩn nhãn rồi hỏi: “chỉ vào bộ phận này là gì?”.</div>
<div class="act"><b>2. SCRAM và nhiệt phân rã</b>Ở 100 % công suất bấm SCRAM. Quan sát k giảm xuống dưới 1, công suất phân hạch về gần 0 nhưng tổng nhiệt vẫn ≈ 6–7 %, tuabin ngắt, đường xả hơi hoạt động, bơm vẫn chạy, đám hơi nhỏ lại nhưng không biến mất. Hỏi: vì sao phải tiếp tục làm mát lõi sau khi dừng phản ứng dây chuyền?</div>
<div class="act"><b>3. Tính lượng ²³⁵U tiêu thụ</b>Mở “Góc tính toán”. Cho học sinh tự tính N = P/E₁ rồi m = N·t·A/N<sub>A</sub> ở 3 000 MW nhiệt và so với số trên màn hình (≈ 3,2 kg/ngày). Thử độ rút 40 % và so sánh với lượng than tương đương (≈ 8 800 tấn/ngày ở 100 %).</div>
<h3>Phản ứng phân hạch ví dụ</h3>
<p>²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + 3n (kiểm tra: A: 236 = 141 + 92 + 3; Z: 92 = 56 + 36). Mỗi phân hạch toả ≈ 200 MeV.</p>`;
}
export function openHelp(onTour) {
  const w = $('helpModal'); $('helpBody').innerHTML = helpHTML(); w.hidden = false; lastFocus = document.activeElement;
  w.querySelector('.modal').scrollTop = 0;
  w.querySelector('[data-close]').focus({ preventScroll: true });
  $('replayTour').onclick = () => { closeHelp(); onTour(); };
}
export function closeHelp() { const w = $('helpModal'); if (!w.hidden) { w.hidden = true; try { lastFocus && lastFocus.focus({ preventScroll: true }); } catch (_) { /* */ } } }

/* ---- hướng dẫn nhanh 4 bước ---- */
export class Tour {
  constructor(hooks) { this.h = hooks; this.i = 0; this.on = false; this.steps = [
    { t: '#rodsCard', title: 'Thanh điều khiển', text: 'Kéo thanh trượt để rút hoặc đưa thanh điều khiển vào lõi. Công suất bám theo; k > 1 khi đang tăng, k < 1 khi đang giảm.', pre: () => this.h.sheet(false) },
    { t: '#heroCard', title: 'Chuỗi chuyển hoá năng lượng', text: 'Nhiệt → hơi nước → tuabin → điện. Hãy đổi độ rút thanh và xem độ trễ lan dọc theo chuỗi.', pre: () => this.h.sheet(true) },
    { t: '#btnScram', title: 'SCRAM – dập lò khẩn cấp', text: 'Giữ nút đỏ 0,6 giây: thanh rơi hết trong ≈ 2 giây. Phản ứng dây chuyền dừng nhưng dư nhiệt phân rã vẫn còn 6–7 %.', pre: () => this.h.sheet(false) },
    { t: '.focusbar', title: 'Sơ đồ nhà máy', text: 'Kéo để di chuyển, chụm hai ngón để phóng to, chạm vào bộ phận bất kỳ để xem thẻ thông tin. Dùng các nút này để bay tới lò, tuabin hay tháp làm mát; kính lúp “Bên trong lõi lò” cho thấy phản ứng dây chuyền.', pre: () => this.h.sheet(false) },
  ]; this.card = $('tourCard'); this.ring = $('tourRing');
    this.card.querySelector('.next').onclick = () => this.go(this.i + 1);
    this.card.querySelector('.skip').onclick = () => this.end();
    window.addEventListener('resize', () => { if (this.on) this.place(); });
  }
  start() { this.on = true; $('tour').hidden = false; this.go(0); }
  end() { this.on = false; $('tour').hidden = true; store.set('tour', '1'); this.h.sheet(false); }
  go(i) {
    if (i >= this.steps.length) { this.end(); return; }
    this.i = i; const s = this.steps[i]; s.pre && s.pre();
    this.card.querySelector('.tc-step').textContent = `Bước ${i + 1} / ${this.steps.length}`;
    this.card.querySelector('h3').textContent = s.title; this.card.querySelector('p').textContent = s.text;
    this.card.querySelector('.next').textContent = i === this.steps.length - 1 ? 'Xong' : 'Tiếp';
    setTimeout(() => { const el = document.querySelector(s.t); if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'nearest' }); } catch (_) { /* */ } } this.place(); this.card.querySelector('.next').focus({ preventScroll: true }); }, 330);
  }
  place() {
    const s = this.steps[this.i]; const el = document.querySelector(s.t); if (!el) return;
    const r = el.getBoundingClientRect(), pad = 6, vw = window.innerWidth, vh = window.innerHeight;
    Object.assign(this.ring.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
    const ch = this.card.offsetHeight || 170, cw = this.card.offsetWidth || 320;
    let y = r.bottom + 14; if (y + ch > vh - 8) y = r.top - ch - 14; if (y < 8) y = Math.max(8, (vh - ch) / 2);
    let x = Math.min(vw - cw - 8, Math.max(8, r.left + r.width / 2 - cw / 2));
    Object.assign(this.card.style, { top: y + 'px', left: x + 'px', transform: 'none' });
  }
}
