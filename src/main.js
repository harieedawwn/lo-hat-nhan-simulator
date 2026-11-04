import './styles.css';
import { installErrorHandlers, isInApp, isZalo, isIOS, isIPhone, isAndroid, isSafari, appName, openExternalAndroid, copyLink, canFullscreen, isFullscreen, requestFS, exitFS } from './ui/inapp.js';
import { toast, openPopover, closePopover, popItem, openInfo, closeInfo, openHelp, closeHelp, Tour } from './ui/modals.js';
import { store } from './ui/storage.js';
import { QualityGov, QNAMES } from './ui/quality.js';
import { Panel } from './ui/panel.js';
import { Stage } from './render/stage.js';
import { Sound } from './audio.js';
import { createState, step, derive, DT, setRodTarget, scram, recover } from './sim/model.js';

installErrorHandlers(() => toast('Có lỗi nhỏ xảy ra. Bạn có thể tải lại trang.', { label: 'Tải lại', fn: () => location.reload() }));

const $ = (id) => document.getElementById(id);
const root = document.documentElement, body = document.body;
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const mqs = { phLand: matchMedia('(max-height:520px) and (orientation:landscape)'), phPort: matchMedia('(max-width:760px) and (orientation:portrait)'), tabPort: matchMedia('(min-width:761px) and (orientation:portrait)') };
const layoutMode = () => (mqs.phLand.matches ? 'phLand' : mqs.phPort.matches ? 'phPort' : mqs.tabPort.matches ? 'tabPort' : 'desk');

/* ---------- trạng thái ---------- */
let scenario = 'rated', s = createState(scenario), paused = false, speed = 1, acc = 0, d = derive(s);
const sound = new Sound();
const stage = new Stage($('stage'), { onPick: (k) => openInfo(k) });
const panel = new Panel();
const gov = new QualityGov((lvl) => { stage.setQuality(lvl); stage.lens.setQuality(lvl); sound.setQuality && sound.setQuality(lvl); });
stage.setQuality(gov.level); stage.lens.setQuality(gov.level);
stage.warm(s, d);

/* ---------- bố cục ---------- */
let SHEET_H = 262, sheetOpen = false, drawerOpen = true;
function applyLayout() {
  const m = layoutMode();
  ['m-desk', 'm-tabport', 'm-phport', 'm-phland'].forEach((c) => body.classList.remove(c));
  body.classList.add({ desk: 'm-desk', tabPort: 'm-tabport', phPort: 'm-phport', phLand: 'm-phland' }[m]);
  const top = $('top');
  root.style.setProperty('--hdr', (body.classList.contains('immersive') ? 0 : top.offsetHeight) + 'px');
  SHEET_H = parseInt(getComputedStyle(root).getPropertyValue('--sheet-h')) || 262;
  let pb = 0, pr = 0;
  let pt = 0;
  if (m === 'phPort') { pb = SHEET_H + 56; pt = 52; setSheet(sheetOpen, false); }
  if (m === 'phLand') { pr = drawerOpen ? Math.min(340, innerWidth * 0.48) : 0; pb = 58; }
  root.style.setProperty('--drawW', pr + 'px');
  stage.setPads(pt, pb, pr);
  $('panel').classList.toggle('closed', m === 'phLand' && !drawerOpen);
}
function setSheet(open, animate = true) {
  sheetOpen = open; const p = $('panel');
  p.classList.toggle('dragging', !animate);
  p.style.setProperty('--sheetY', open ? '0px' : `calc(100% - ${SHEET_H}px)`);
  body.classList.toggle('sheet-open', open);
  $('sheetHandle').setAttribute('aria-expanded', String(open));
  if (!animate) requestAnimationFrame(() => p.classList.remove('dragging'));
}
(function sheetDrag() {
  const h = $('sheetHandle'), p = $('panel'); let y0 = 0, off0 = 0, moved = false, drag = false, lastY = 0, lastT = 0, vel = 0;
  const colOff = () => p.offsetHeight - SHEET_H;
  h.addEventListener('pointerdown', (e) => {
    if (layoutMode() === 'phLand') return;
    drag = true; moved = false; y0 = e.clientY; off0 = sheetOpen ? 0 : colOff(); lastY = y0; lastT = performance.now(); vel = 0; h.setPointerCapture(e.pointerId);
    p.classList.add('dragging');
  });
  h.addEventListener('pointermove', (e) => {
    if (!drag) return; const dy = e.clientY - y0; if (Math.abs(dy) > 4) moved = true;
    const off = Math.max(0, Math.min(colOff(), off0 + dy)); p.style.setProperty('--sheetY', off + 'px');
    const now = performance.now(); vel = (e.clientY - lastY) / Math.max(1, now - lastT); lastY = e.clientY; lastT = now;
  });
  const end = (e) => {
    if (!drag) return; drag = false; p.classList.remove('dragging');
    if (layoutMode() === 'phLand') return;
    if (!moved) { setSheet(!sheetOpen); return; }
    const cur = parseFloat(p.style.getPropertyValue('--sheetY')) || 0;
    setSheet(vel < -0.4 ? true : vel > 0.4 ? false : cur < colOff() / 2);
  };
  h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
  h.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (layoutMode() === 'phLand') toggleDrawer(); else setSheet(!sheetOpen); } });
  h.addEventListener('click', (e) => { if (layoutMode() === 'phLand') toggleDrawer(); else if (e.detail === 0) setSheet(!sheetOpen); });
})();
function toggleDrawer() { drawerOpen = !drawerOpen; applyLayout(); }
Object.values(mqs).forEach((q) => (q.addEventListener ? q.addEventListener('change', applyLayout) : q.addListener(applyLayout)));
addEventListener('orientationchange', () => setTimeout(applyLayout, 200));
addEventListener('resize', () => { applyLayout(); });

/* ---------- thanh điều khiển ---------- */
const slider = $('rodSlider');
const setPct = () => slider.style.setProperty('--pct', slider.value + '%');
slider.addEventListener('input', () => { setRodTarget(s, +slider.value); setPct(); sound.uiClick && sound.uiClick(0.5); });
const nudge = (dv) => { if (s.scram) return; setRodTarget(s, Math.round(s.rodTarget) + dv); syncSlider(true); };
function syncSlider(force) { if (force || document.activeElement !== slider) { slider.value = String(Math.round(s.rodTarget)); setPct(); } }
function holdRepeat(btn, dv) {
  let t1 = 0, t2 = 0; const stop = () => { clearTimeout(t1); clearInterval(t2); };
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); nudge(dv); t1 = setTimeout(() => { t2 = setInterval(() => nudge(dv), 90); }, 380); sound.uiClick && sound.uiClick(0.6); });
  ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((ev) => btn.addEventListener(ev, stop));
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nudge(dv); } });
}
holdRepeat($('rodMinus'), -1); holdRepeat($('rodPlus'), 1);
$('btnIn').onclick = () => { if (!s.scram) { setRodTarget(s, 0); syncSlider(true); } };
$('btnOut').onclick = () => { if (!s.scram) { setRodTarget(s, 100); syncSlider(true); toast('Rút hết thanh làm công suất vượt mức: hãy quan sát cảnh báo, đếm ngược và SCRAM tự động.'); } };
$('btnRecover').onclick = () => { if (recover(s)) { syncSlider(true); toast('Đã khôi phục. Thanh ở 0 % – hãy rút lại từ từ.'); } };

const sb = $('btnScram'); let holdT = 0, holdOn = false;
const doScram = () => { scram(s, 'manual'); syncSlider(true); closeConfirm(); };
sb.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault(); if (s.scram) return; holdOn = true; sb.classList.add('holding');
  holdT = setTimeout(() => { holdOn = false; sb.classList.remove('holding'); doScram(); sound.uiClick && sound.uiClick(1); }, 600);
});
const cancelHold = () => { if (holdOn) { holdOn = false; clearTimeout(holdT); sb.classList.remove('holding'); toast('Giữ nút SCRAM 0,6 giây để dập lò.', null, 2200); } else { clearTimeout(holdT); sb.classList.remove('holding'); } };
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => sb.addEventListener(ev, cancelHold));
sb.addEventListener('contextmenu', (e) => e.preventDefault());
function openConfirm() { if (s.scram) return; $('confirmScram').hidden = false; $('csNo').focus(); }
function closeConfirm() { $('confirmScram').hidden = true; }
sb.addEventListener('click', (e) => { if (e.detail === 0) openConfirm(); });
sb.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openConfirm(); } });
$('csNo').onclick = closeConfirm; $('csYes').onclick = doScram;
$('confirmScram').addEventListener('click', (e) => { if (e.target.id === 'confirmScram') closeConfirm(); });

/* ---------- kịch bản, đặt lại ---------- */
function load(sc) {
  scenario = sc; s = createState(sc); d = derive(s); acc = 0; panel.clearTrend(); panel.lastStatus = '';
  stage.flows.prewarm(s, d); syncSlider(true);
  if (sc === 'startup') toast('Lò đang dừng nóng (291 °C). Hãy rút thanh điều khiển và quan sát k, công suất, tuabin.', null, 6000);
}
$('tbReset').onclick = () => { load(scenario); closePopover(); };
$('tbScenario').onclick = (e) => openPopover(e.currentTarget, (p) => {
  popItem(p, 'Vận hành định mức 100 %', scenario === 'rated', () => { load('rated'); closePopover(); });
  popItem(p, 'Khởi động từ dừng lò nóng', scenario === 'startup', () => { load('startup'); closePopover(); });
});
$('tbSpeed').onclick = (e) => openPopover(e.currentTarget, (p) => {
  for (const v of [0.5, 1, 2]) popItem(p, String(v).replace('.', ',') + '×', speed === v, () => { setSpeed(v); closePopover(); });
});
function setSpeed(v) { speed = v; $('tbSpeedTxt').textContent = String(v).replace('.', ',') + '×'; }
$('tbPause').onclick = () => togglePause();
function togglePause() { paused = !paused; $('tbPause').setAttribute('aria-pressed', String(paused)); $('tbPause').lastElementChild.textContent = paused ? 'Chạy tiếp' : 'Tạm dừng'; }
$('tbLabels').onclick = () => toggleLabels();
function toggleLabels() { const on = $('tbLabels').getAttribute('aria-pressed') !== 'true'; $('tbLabels').setAttribute('aria-pressed', String(on)); stage.labels.setVisible(on); stage.dirty = true; }

/* ---------- âm thanh ---------- */
let soundOn = store.get('sound', '1') === '1', vol = parseFloat(store.get('vol', '0.7')) || 0.7;
function applySound() { sound.setEnabled(soundOn); sound.setVolume(vol); $('tbSound').classList.toggle('muted', !soundOn); store.set('sound', soundOn ? '1' : '0'); store.set('vol', vol); }
$('tbSound').onclick = (e) => openPopover(e.currentTarget, (p) => {
  const b = popItem(p, soundOn ? 'Âm thanh: Bật' : 'Âm thanh: Tắt', soundOn, () => { soundOn = !soundOn; if (soundOn) sound.init && sound.init(); applySound(); b.textContent = soundOn ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'; b.className = soundOn ? 'on' : ''; });
  const v = document.createElement('div'); v.className = 'vol'; v.innerHTML = '<span>Âm lượng</span><input type="range" min="0" max="1" step="0.05" aria-label="Âm lượng">';
  const r = v.querySelector('input'); r.value = String(vol); r.oninput = () => { vol = +r.value; applySound(); }; p.appendChild(v);
  if (isIOS) { const n = document.createElement('p'); n.className = 'hint'; n.style.cssText = 'margin:4px 12px 8px;max-width:230px'; n.textContent = 'Nếu không nghe tiếng, hãy tắt chế độ im lặng của iPhone.'; p.appendChild(n); }
});

/* ---------- cài đặt, thêm ---------- */
function settingsMenu(p) {
  const h = document.createElement('h4'); h.textContent = 'Chất lượng'; p.appendChild(h);
  const cur = store.get('quality', 'auto');
  [['auto', 'Tự động'], ['high', 'Cao'], ['mid', 'Trung bình'], ['low', 'Thấp']].forEach(([k, l]) => popItem(p, l + (k === 'auto' ? ` (hiện: ${QNAMES[gov.level]})` : ''), cur === k, () => { gov.setMode(k); closePopover(); toast('Chất lượng: ' + l); }));
  const h2 = document.createElement('h4'); h2.textContent = 'Hiển thị'; p.appendChild(h2);
  popItem(p, 'Kính lúp lõi lò', stage.lensOn, () => { setLens(!stage.lensOn); closePopover(); });
}
$('tbSettings').onclick = (e) => openPopover(e.currentTarget, settingsMenu);
$('tbMore').onclick = (e) => openPopover(e.currentTarget, (p) => { popItem(p, 'Đặt lại', false, () => { load(scenario); closePopover(); }); settingsMenu(p); });
function setLens(on) { stage.setLens(on); $('lensToggle').setAttribute('aria-pressed', String(on)); }
$('lensClose').onclick = () => setLens(false); $('lensToggle').onclick = () => setLens(true);

/* ---------- toàn màn hình / chế độ bao phủ ---------- */
function enterImmersive(first) {
  body.classList.add('immersive'); $('exitImm').hidden = false; applyLayout();
  if (first) {
    if (store.get('rotateHint') !== '1' && layoutMode() === 'phPort') { store.set('rotateHint', '1'); toast('Xoay ngang điện thoại để xem rộng hơn.', null, 6000); }
  }
}
function exitImmersive() { body.classList.remove('immersive'); $('exitImm').hidden = true; applyLayout(); }
function toggleFull() {
  if (isFullscreen()) { exitFS(); return; }
  if (body.classList.contains('immersive')) { exitImmersive(); return; }
  if (canFullscreen()) requestFS(); else enterImmersive(true);
}
$('tbFull').onclick = toggleFull; $('exitImm').onclick = exitImmersive;
['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => { applyLayout(); }));

/* ---------- sơ đồ: điểm nhìn, làm nổi bật ---------- */
const focusBtns = [...document.querySelectorAll('.focusbar [data-focus]')];
focusBtns.forEach((b) => (b.onclick = () => stage.focus(b.dataset.focus, reduce ? 0 : 700)));
const hlBtns = [...document.querySelectorAll('.hlbar [data-hl]')];
let hl = 0;
function setHL(n) { hl = n; stage.setHighlight(n); hlBtns.forEach((b) => b.classList.toggle('on', +b.dataset.hl === n)); }
hlBtns.forEach((b) => (b.onclick = () => setHL(+b.dataset.hl)));

/* ---------- trợ giúp, tour ---------- */
const tour = new Tour({ sheet: (o) => { if (layoutMode() === 'phPort') setSheet(o); else if (layoutMode() === 'phLand' && o === false) { /* giữ ngăn kéo */ } } });
$('tbHelp').onclick = () => openHelp(() => tour.start());
document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => closeHelp()));
$('helpModal').addEventListener('click', (e) => { if (e.target.id === 'helpModal') closeHelp(); });

/* ---------- phím tắt ---------- */
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target, tag = t && t.tagName;
  if (e.key === 'Escape') { closeInfo(); closeHelp(); closePopover(); closeConfirm(); if (tour.on) tour.end(); return; }
  if (!$('start').hidden) return;
  const typing = tag === 'INPUT' && t.type !== 'range';
  if (typing) return;
  const onBtn = tag === 'BUTTON' || tag === 'SUMMARY';
  switch (e.key) {
    case ' ': if (!(t.closest && t.closest('#popover,#confirmScram,#helpModal,#infocard,#tour,#start,summary'))) { e.preventDefault(); togglePause(); } break;
    case 'ArrowLeft': if (tag !== 'INPUT') { e.preventDefault(); nudge(e.shiftKey ? -5 : -1); } break;
    case 'ArrowRight': if (tag !== 'INPUT') { e.preventDefault(); nudge(e.shiftKey ? 5 : 1); } break;
    case 'l': case 'L': toggleLabels(); break;
    case 'f': case 'F': toggleFull(); break;
    case '1': case '2': case '3': setHL(hl === +e.key ? 0 : +e.key); break;
    case '0': stage.focus('overview', 600); break;
    default:
  }
});

/* ---------- màn hình khởi động ---------- */
let started = false;
function boot() {
  $('boot').classList.add('gone'); $('app').hidden = false;
  const m = layoutMode();
  stage.camera.initialFocus = m === 'phPort' ? 'reactor' : m === 'phLand' ? 'main' : 'overview';
  applyLayout();
  stage.resize();
  if (m === 'phPort' || m === 'phLand') setLens(false);
  if (m === 'phLand') drawerOpen = false;
  applyLayout();
  // chọn âm thanh
  const setSn = (on) => { soundOn = on; $('snOn').classList.toggle('on', on); $('snOff').classList.toggle('on', !on); $('snOn').setAttribute('aria-pressed', String(on)); $('snOff').setAttribute('aria-pressed', String(!on)); $('muteNote').hidden = !(on && isIOS); };
  setSn(soundOn);
  $('snOn').onclick = () => setSn(true); $('snOff').onclick = () => setSn(false);
  if (isInApp) {
    $('inappNote').hidden = false; $('inappName').textContent = `Bạn đang mở trong ${appName || 'ứng dụng'}.`;
    $('goFull').textContent = 'Xem ngay tại đây'; $('goNormal').hidden = true;
    if (isIOS) $('iosGuide').hidden = false;
    $('btnOpenExt').onclick = () => {
      if (isAndroid) { openExternalAndroid(); setTimeout(() => { if (!document.hidden) { const h = $('extHint'); h.hidden = false; h.textContent = 'Chưa mở được? Hãy sao chép liên kết rồi dán vào Chrome hoặc trình duyệt khác.'; } }, 1600); }
      else { $('iosGuide').hidden = false; const h = $('extHint'); h.hidden = false; h.textContent = 'Chạm “⋯” ở góc trên bên phải → “Mở bằng trình duyệt”, hoặc sao chép liên kết bên dưới.'; }
    };
    $('btnCopy').onclick = async () => { const ok = await copyLink(); const h = $('extHint'); h.hidden = false; h.textContent = ok ? 'Đã sao chép liên kết. Hãy dán vào trình duyệt.' : 'Không sao chép được tự động; hãy nhấn giữ thanh địa chỉ để sao chép.'; };
  }
  if (isSafari && isIPhone) $('a2hs').hidden = false;
  const go = (full) => {
    if (started) return; started = true;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (_) { /* */ }
    if (soundOn) { sound.init && sound.init(); }
    applySound();
    if (full && !isInApp) { if (canFullscreen()) requestFS(); else enterImmersive(true); }
    else if (full && isInApp && isIPhone) { /* giữ nguyên chế độ thường trong WebView */ }
    $('start').hidden = true; applyLayout();
    if (soundOn && isIOS && !isInApp) toast('Nếu không nghe tiếng, hãy tắt chế độ im lặng của iPhone.', null, 6000);
    if (store.get('tour') !== '1') setTimeout(() => tour.start(), 700);
    else if (layoutMode() === 'phPort' && store.get('rot') !== '1') setTimeout(() => { if (!document.hidden) toast('Mẹo: xoay ngang điện thoại để xem sơ đồ rộng hơn.', { label: 'Đóng', fn: () => { $('toast').hidden = true; store.set('rot', '1'); } }); }, 3500);
    lastT = performance.now();
  };
  $('goFull').onclick = () => go(true); $('goNormal').onclick = () => go(false);
  $('start').hidden = false; $('goFull').focus({ preventScroll: true });
  requestAnimationFrame(loop);
}

/* ---------- vòng lặp ---------- */
let lastT = performance.now(), lastUI = 0, lastFocusName = '';
function loop(now) {
  const rdt = Math.min(0.25, Math.max(0, (now - lastT) / 1000)); lastT = now;
  if (!document.hidden) {
    gov.frame(rdt);
    let simDt = 0;
    if (!paused && started) { simDt = rdt * speed; acc += simDt; let n = 0; while (acc >= DT && n < 10) { step(s); acc -= DT; n++; } if (n === 10) acc = 0; }
    if (now - lastUI >= 100) { lastUI = now; d = derive(s); panel.update(s, d, s.t, { announce: (m) => { $('srLive').textContent = m; } }); stage.live(s, d); syncSlider(false); const fn = stage.camera.focusName; if (fn !== lastFocusName) { lastFocusName = fn; focusBtns.forEach((b) => b.classList.toggle('on', b.dataset.focus === fn)); } }
    stage.frame(s, d, rdt, simDt);
    sound.update && sound.update(s, d, rdt, stage.camera.focusName, started && !paused);
  }
  requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { sound.suspend && sound.suspend(); } else { lastT = performance.now(); sound.resume && sound.resume(); } });
window.__app = { renderAudioTest: () => Sound.renderTest(3), get s() { return s; }, get d() { return d; }, stage, panel, sound, gov, setRodTarget: (v) => { setRodTarget(s, v); syncSlider(true); }, scram: () => scram(s, 'manual'), recover: () => recover(s), load, setSpeed, derive };
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { stage.labels.remeasure(); stage.dirty = true; });
boot();
