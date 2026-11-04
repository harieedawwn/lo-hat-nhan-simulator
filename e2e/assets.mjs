// Tạo icon, ảnh OG, ảnh xem trước và ảnh minh hoạ README từ chính ứng dụng. Dùng: node e2e/assets.mjs [url]
import { chromium } from 'playwright';
import fs from 'node:fs';
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const b = await chromium.launch();
const svg = fs.readFileSync('public/favicon.svg', 'utf8');
async function iconPng(size, out, pad = 0, flat = false) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * (1 - pad * 2));
  await p.setContent(`<body style="margin:0;background:${pad ? '#14213D' : 'transparent'};display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body>`);
  await p.screenshot({ path: out, omitBackground: !pad }); await p.close();
}
await iconPng(32, 'public/favicon-32.png'); await iconPng(180, 'public/apple-touch-icon.png', 0.06);
await iconPng(192, 'public/icon-192.png'); await iconPng(512, 'public/icon-512.png'); await iconPng(512, 'public/icon-maskable-512.png', 0.14);

async function open(w, h, opts = {}) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: opts.dpr || 1 });
  await p.goto(url); await p.waitForTimeout(700);
  await p.evaluate("localStorage.setItem('pwr.tour','1');localStorage.setItem('pwr.sound','0');document.getElementById('snOff').click();document.getElementById('goNormal').click()");
  await p.waitForTimeout(800); return p;
}
const bare = `#top,#panel,#overlay,#lab,#lensBox,#vignette,#toast,#tour{display:none!important}#app{display:block!important}#stageWrap{position:fixed!important;inset:0!important}`;
// xem trước màn hình khởi động
{
  const p = await open(900, 380); await p.addStyleTag({ content: bare }); await p.waitForTimeout(300);
  await p.evaluate("__app.stage.resize();__app.stage.camera.to(0.364, 4, 12, 0)"); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'public/preview.jpg', type: 'jpeg', quality: 78 }); await p.close();
}
// ảnh OG 1200×630
{
  const p = await open(1200, 630); await p.addStyleTag({ content: bare }); await p.waitForTimeout(300);
  await p.evaluate("__app.stage.resize();__app.stage.camera.to(0.49, 0, 200, 0)"); await p.waitForTimeout(2500);
  await p.addStyleTag({ content: `body::after{content:"";position:fixed;inset:0;background:linear-gradient(180deg,rgba(244,242,236,.94) 0,rgba(244,242,236,.9) 175px,rgba(244,242,236,0) 250px);z-index:50;pointer-events:none}
  #og{position:fixed;left:44px;top:36px;z-index:60;font-family:"Be Vietnam Pro",sans-serif;color:#14213D;max-width:1100px}#og h1{margin:0;font-size:44px;line-height:1.12;font-weight:700;letter-spacing:-.01em}#og p{margin:10px 0 0;font-size:22px;color:#3E4F6C}#og b{display:inline-block;margin-top:14px;font-size:20px;background:#fff;border:1px solid #C6CEDA;border-radius:999px;padding:7px 16px}` });
  await p.evaluate(`document.body.insertAdjacentHTML('beforeend','<div id="og"><h1>Mô phỏng nhà máy điện hạt nhân</h1><p>Lò phản ứng nước áp lực (PWR) 1000 MW · Vật lí 12</p><b>Trường THPT Trần Quốc Toản (Đồng Tháp)</b></div>')`);
  await p.waitForTimeout(400); await p.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 80 }); await p.close();
}
// ảnh minh hoạ README
{
  const p = await open(1440, 900); await p.waitForTimeout(1200);
  await p.screenshot({ path: 'docs/hero.png' }); await p.close();
  const q = await open(390, 844, { dpr: 2 }); await q.waitForTimeout(600); await q.screenshot({ path: 'docs/mobile.png' }); await q.close();
}
await b.close();
