// Kiểm thử đầu-cuối bằng Playwright. Dùng: node e2e/run.mjs [url]  (mặc định: bản dựng xem thử cổng 4173)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const arg = process.argv[2];
let srv = null, base = arg;
if (!base) { srv = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' }); base = 'http://127.0.0.1:4173/'; await new Promise((r) => setTimeout(r, 2500)); }
const ZALO_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo/23.07.01';
const results = []; let failed = 0;
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' – ' + extra : ''}`); if (!cond) failed++; };
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

async function page(w, h, { touch = false, ua, q = '?zarsrc=31&utm_source=zalo', skipTour = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, userAgent: ua, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  if (skipTour) await ctx.addInitScript("try{localStorage.setItem('pwr.tour','1');localStorage.setItem('pwr.rot','1')}catch(e){}");
  await p.goto(base + q); await p.waitForSelector('#start:not([hidden])', { timeout: 8000 });
  p.errs = errs; return p;
}
const state = (p) => p.evaluate(() => ({ status: __app.s.status, rod: __app.s.rod, p: __app.s.p, k: __app.s.k, scram: __app.s.scram, rpm: __app.s.rpm, br: __app.s.breaker, pe: __app.s.pe, tHot: __app.s.tHot, cd: __app.s.countdown }));
const hscroll = (p) => p.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth, body: document.body.scrollWidth - innerWidth }));
async function smalls(p) {
  return p.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button,input,summary,[role=button],a')) {
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (el.closest('[hidden]')) continue;
      const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      if (r.width < 43.5 || r.height < 43.5) out.push((el.id || el.className || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    return out;
  });
}

// 1. Các cỡ màn hình + chuỗi Zalo
for (const [name, w, h, touch] of [['điện thoại dọc 390×844', 390, 844, true], ['điện thoại ngang 844×390', 844, 390, true], ['máy tính bảng 820×1180', 820, 1180, true], ['máy tính 1440×900', 1440, 900, false]]) {
  const p = await page(w, h, { touch });
  ok(`[${name}] tải với ?zarsrc=…&utm_source=zalo`, true);
  const hs = await hscroll(p); ok(`[${name}] không cuộn ngang ở màn hình khởi động`, hs.doc <= 0 && hs.body <= 0, JSON.stringify(hs));
  await p.screenshot({ path: `e2e/out/start-${w}x${h}.png` });
  await p.click('#goNormal'); await p.waitForTimeout(1200);
  const hs2 = await hscroll(p); ok(`[${name}] không cuộn ngang`, hs2.doc <= 0 && hs2.body <= 0, JSON.stringify(hs2));
  const sm = await smalls(p); ok(`[${name}] nút ≥ 44 px`, sm.length === 0, sm.join('; '));
  await p.screenshot({ path: `e2e/out/app-${w}x${h}.png` });
  if (w === 390) { await p.evaluate("document.getElementById('sheetHandle').click()"); await p.waitForTimeout(500); const sm2 = await smalls(p); ok(`[${name}] nút ≥ 44 px (bảng mở rộng)`, sm2.length === 0, sm2.join('; ')); await p.screenshot({ path: `e2e/out/app-${w}x${h}-open.png` }); }
  ok(`[${name}] không lỗi console`, p.errs.length === 0, p.errs.join(' | '));
  await p.context().close();
}

// 2. Zalo UA: ghi chú hiện ra, "Xem ngay tại đây" chạy được
{
  const p = await page(390, 844, { touch: true, ua: ZALO_UA });
  const note = await p.isVisible('#inappNote'); ok('Zalo UA: hiện ghi chú trong ứng dụng', note);
  ok('Zalo UA: nội dung ghi chú', (await p.textContent('#inappNote')).includes('Mô phỏng vẫn chạy tốt ngay tại đây'));
  ok('Zalo UA: nút chính “Xem ngay tại đây”', (await p.textContent('#goFull')).trim() === 'Xem ngay tại đây');
  ok('Zalo UA (iOS): hiện hướng dẫn 2 bước', await p.isVisible('#iosGuide'));
  await p.click('#btnCopy'); await p.waitForTimeout(200);
  ok('Zalo UA: nút sao chép liên kết phản hồi', await p.isVisible('#extHint'));
  await p.screenshot({ path: 'e2e/out/start-zalo.png' });
  await p.click('#goFull'); await p.waitForTimeout(1500);
  ok('Zalo UA: “Xem ngay tại đây” vào mô phỏng', !(await p.isVisible('#start')) && await p.isVisible('#stage'));
  // 2b. Zalo Android: nút “Mở bằng trình duyệt” thử intent rồi hiện hướng dẫn sao chép
{
  const p = await page(412, 860, { touch: true, ua: 'Mozilla/5.0 (Linux; Android 13; Pixel 6 Build/TP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36 Zalo/23.07.01' });
  ok('Zalo Android: hiện ghi chú, không hiện hướng dẫn iOS', (await p.isVisible('#inappNote')) && !(await p.isVisible('#iosGuide')));
  await p.click('#btnOpenExt'); await p.waitForTimeout(2200);
  ok('Zalo Android: không mở được thì hiện hướng dẫn sao chép liên kết', await p.isVisible('#extHint'));
  await p.context().close();
}
// 3. Lỗi từ script ngoài không hiện gì
  await p.evaluate(() => { const s = document.createElement('script'); s.textContent = "throw new ReferenceError('zaloJSV2 is not defined')"; document.head.appendChild(s); window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.', filename: '' })); Promise.reject(new Error('webkit.messageHandlers.zalo is undefined')); });
  await p.waitForTimeout(600);
  ok('Lỗi từ script lạ (zaloJSV2) bị bỏ qua, không có toast', !(await p.isVisible('#toast')));
  // nhưng lỗi của chính ta thì hiện toast “Tải lại”
  await p.evaluate(() => { const base = new URL('./', location.href).href; window.dispatchEvent(new ErrorEvent('error', { message: 'boom', filename: base + 'assets/index-x.js' })); });
  await p.waitForTimeout(300);
  ok('Lỗi của chính ứng dụng hiện toast “Tải lại” (không chặn)', (await p.isVisible('#toast')) && (await p.textContent('#toast')).includes('Tải lại'));
  await p.context().close();
}

// 4. Luồng điều khiển đầy đủ
{
  const p = await page(1440, 900);
  await p.click('#goNormal'); await p.waitForTimeout(500);
  await p.evaluate('__app.setSpeed(2)');
  await p.fill('#rodSlider', '70'); await p.waitForTimeout(100);
  ok('Thanh trượt đặt mục tiêu', (await p.evaluate('__app.s.rodTarget')) === 70);
  await p.click('#rodPlus'); await p.click('#rodPlus'); await p.click('#rodMinus');
  ok('Nút − / + thay đổi 1 %', (await p.evaluate('__app.s.rodTarget')) === 71, String(await p.evaluate('__app.s.rodTarget')));
  await p.keyboard.press('Escape'); await p.focus('body'); await p.keyboard.press('ArrowRight');
  ok('Phím → tăng độ rút', (await p.evaluate('__app.s.rodTarget')) === 72);
  await p.keyboard.press('Space'); ok('Space tạm dừng', (await p.getAttribute('#tbPause', 'aria-pressed')) === 'true'); await p.keyboard.press('Space');
  await p.fill('#rodSlider', '80'); await p.waitForTimeout(200);
  await p.waitForTimeout(8000);
  let s0 = await state(p); ok('Trở lại định mức: bình thường, k = 1,000', s0.status === 'normal' && Math.abs(s0.k - 1) < 0.0006, JSON.stringify({ st: s0.status, k: s0.k.toFixed(4) }));
  await p.click('#btnOut');
  let sawOver = false, sawCd = false, scrammed = false;
  for (let i = 0; i < 60 && !scrammed; i++) { await p.waitForTimeout(500); const s = await state(p); if (s.status === 'overheat') { sawOver = true; if (await p.isVisible('#stCount')) sawCd = true; } if (s.scram) scrammed = true; }
  ok('“Rút hết thanh” → Quá nhiệt (đếm ngược hiện)', sawOver && sawCd);
  ok('→ tự động SCRAM', scrammed && (await p.evaluate('__app.s.scramReason')) !== 'manual');
  ok('Trạng thái hiển thị “Dập lò khẩn cấp (SCRAM)”', (await p.textContent('#stTitle')).includes('SCRAM'));
  await p.waitForTimeout(3000); const s1 = await state(p);
  ok('Thanh về 0 sau ≈ 2 s, P_điện = 0, tuabin chạy đà', s1.rod === 0 && s1.pe === 0 && s1.rpm < 3000);
  ok('Khôi phục bị khoá khi chưa ổn định', await p.$eval('#btnRecover', (e) => e.disabled));
  for (let i = 0; i < 60; i++) { if (!(await p.$eval('#btnRecover', (e) => e.disabled))) break; await p.waitForTimeout(500); }
  await p.click('#btnRecover'); await p.waitForTimeout(200);
  const s2 = await state(p); ok('Khôi phục: bình thường, thanh ở 0 %', !s2.scram && s2.rod === 0 && s2.status === 'normal');
  await p.fill('#rodSlider', '80'); let sync = false;
  for (let i = 0; i < 90 && !sync; i++) { await p.waitForTimeout(500); const s = await state(p); if (s.br && s.rpm === 3000 && s.pe > 800) sync = true; }
  ok('Rút lại thanh → tuabin hòa lưới lại', sync);
  // SCRAM giữ 0,6 s bằng chuột
  const bb = await p.locator('#btnScram').boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(250); await p.mouse.up();
  ok('SCRAM: nhấn nhanh không dập lò (chống bấm nhầm)', !(await state(p)).scram);
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up();
  ok('SCRAM: giữ 0,6 s thì dập lò', (await state(p)).scram);
  // kịch bản khởi động
  await p.evaluate("__app.load('startup')"); await p.waitForTimeout(300);
  ok('Kịch bản khởi động: tuabin 0, 291 °C', (await state(p)).rpm === 0);
  await p.fill('#rodSlider', '80'); let kmax = 0, sync2 = false;
  for (let i = 0; i < 120 && !sync2; i++) { await p.waitForTimeout(500); const s = await state(p); kmax = Math.max(kmax, s.k); if (s.br && s.rpm === 3000) sync2 = true; }
  ok('Khởi động: k > 1 rồi hòa lưới', kmax > 1.001 && sync2, 'kmax=' + kmax.toFixed(3));
  ok('Luồng điều khiển: không lỗi console', p.errs.length === 0, p.errs.join(' | '));
  await p.context().close();
}

// 5. Hiệu năng: làm chậm CPU 4× ở cỡ điện thoại
for (const [lvl, name] of [[2, 'Cao'], [1, 'Trung bình'], [0, 'Thấp']]) {
  const p = await page(390, 844, { touch: true });
  const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.click('#goNormal'); await p.waitForTimeout(500);
  await p.evaluate((l) => { __app.gov.setMode(l === 2 ? 'high' : l === 1 ? 'mid' : 'low'); }, lvl);
  await p.evaluate("__app.setRodTarget(80)"); await p.waitForTimeout(1500);
  const fps = await p.evaluate(() => new Promise((res) => { const ts = []; let n = 0; function f(t) { ts.push(t); if (++n < 120) requestAnimationFrame(f); else { const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); res({ avg: 1000 / (d.reduce((a, b) => a + b, 0) / d.length), p95: d[Math.floor(d.length * 0.95)] }); } } requestAnimationFrame(f); }));
  results.push(`INFO  Hiệu năng 390×844, CPU ×4, chất lượng ${name}: ${fps.avg.toFixed(1)} khung/giây, p95 ${fps.p95.toFixed(1)} ms`);
  await p.context().close();
}
{
  const p = await page(1440, 900);
  await p.click('#goNormal'); await p.waitForTimeout(1500);
  const fps = await p.evaluate(() => new Promise((res) => { const ts = []; let n = 0; function f(t) { ts.push(t); if (++n < 180) requestAnimationFrame(f); else res(1000 / ((ts[ts.length - 1] - ts[0]) / (ts.length - 1))); } requestAnimationFrame(f); }));
  results.push(`INFO  Hiệu năng 1440×900 (không giảm tốc): ${fps.toFixed(1)} khung/giây`);
  // 6. Âm thanh ngoại tuyến
  const a = await p.evaluate('__app.renderAudioTest()');
  ok('Âm thanh: đồ thị dựng được, đỉnh < 0 dBFS', a.peak < 1 && a.peak > 0.001, a.db.toFixed(2) + ' dBFS');
  ok('Âm thanh: AudioContext sống', (await p.evaluate("__app.sound.ctx ? __app.sound.ctx.state : 'none'")) !== 'none');
  await p.context().close();
}
await browser.close(); if (srv) srv.kill();
console.log(results.join('\n')); console.log(failed ? `\n${failed} KIỂM TRA THẤT BẠI` : '\nTẤT CẢ ĐẠT');
process.exit(failed ? 1 : 0);
