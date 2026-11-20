// Chụp một vùng tuỳ ý của cảnh (toạ độ thế giới SVG 2450×1100), không nhãn, không bảng; in lỗi console nếu có.
// Dùng: npx vite preview --port 4173 &  rồi  node e2e/zoom.mjs <ra.png> <x> <y> <w> <h> [rộng=1200] [cao=700] [url]
import { chromium } from 'playwright';
const [,, out, rx, ry, rw, rh, w = '1200', h = '700', url = 'http://localhost:4173/'] = process.argv;
if (!rh) { console.log('Dùng: node e2e/zoom.mjs <ra.png> <x> <y> <w> <h> [rộng] [cao] [url]'); process.exit(1); }
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: +h } });
await ctx.addInitScript("localStorage.setItem('pwr.tour','1')");
const p = await ctx.newPage(); const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
await p.goto(url); await p.waitForTimeout(600); await p.evaluate("document.getElementById('goNormal').click()"); await p.waitForTimeout(600);
await p.addStyleTag({ content: '#panel,#top,#overlay,#lensBox{display:none!important}#app{display:block!important}#stageWrap{position:fixed!important;inset:0!important}' });
await p.evaluate(`(()=>{const st=__app.stage; st.labels.setVisible(false); st.resize(); const s=Math.min(${w}/${rw},${h}/${rh}); st.camera.to(s, ${w}/2-(${rx}+${rw}/2)*s, ${h}/2-(${ry}+${rh}/2)*s, 0);})()`);
await p.waitForTimeout(1200); await p.screenshot({ path: out }); await b.close();
if (errs.length) console.log(errs.join('\n'));
