// Chụp bộ ảnh chuẩn để so sánh trước/sau khi chỉnh đồ hoạ.
// Dùng: npx vite preview --port 4173 &  rồi  npm run shots -- <thư-mục-ra> [url]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [,, dir = '/tmp/shots', url = 'http://localhost:4173/'] = process.argv;
mkdirSync(dir, { recursive: true });
const ZONES = {
  '1-lo': [40, 130, 800, 820],
  '2-tuabin': [680, 440, 800, 500],
  '3-dien': [1120, 460, 760, 470],
  '4-thap': [1500, 40, 950, 1000],
};
const b = await chromium.launch();
const go = async (w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript("localStorage.setItem('pwr.tour','1')");
  const p = await ctx.newPage();
  await p.goto(url); await p.waitForTimeout(700);
  await p.evaluate("document.getElementById('goNormal')?.click()"); await p.waitForTimeout(2500);
  return p;
};
// toàn giao diện (có bảng điều khiển, nhãn) – máy tính và điện thoại ngang
for (const [name, w, h] of [['0-toan-canh', 1600, 900], ['0-dien-thoai', 844, 390]]) {
  const p = await go(w, h); await p.screenshot({ path: `${dir}/${name}.png` }); await p.context().close();
}
// từng vùng, không nhãn, không bảng
const p = await go(1200, 760);
await p.addStyleTag({ content: '#panel,#top,#overlay,#lensBox{display:none!important}#app{display:block!important}#stageWrap{position:fixed!important;inset:0!important}' });
for (const [name, [x, y, w, h]] of Object.entries(ZONES)) {
  await p.evaluate(`(()=>{const st=__app.stage; st.labels.setVisible(false); st.resize(); const s=Math.min(1200/${w},760/${h}); st.camera.to(s, 600-(${x}+${w}/2)*s, 380-(${y}+${h}/2)*s, 0);})()`);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${dir}/${name}.png` });
}
await b.close();
console.log('Đã chụp vào', dir);
