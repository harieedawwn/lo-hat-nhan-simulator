import { chromium } from 'playwright';
const [,, url, out, rx, ry, rw, rh, w = '1200', h = '700'] = process.argv;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: +h } });
await ctx.addInitScript("localStorage.setItem('pwr.tour','1')");
const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(600); await p.evaluate("document.getElementById('goNormal').click()"); await p.waitForTimeout(600);
await p.addStyleTag({ content: '#panel,#top,#overlay,#lensBox{display:none!important}#app{display:block!important}#stageWrap{position:fixed!important;inset:0!important}' });
await p.evaluate(`(()=>{const st=__app.stage; st.labels.setVisible(false); st.resize(); const s=Math.min(${w}/${rw},${h}/${rh}); st.camera.to(s, ${w}/2-(${rx}+${rw}/2)*s, ${h}/2-(${ry}+${rh}/2)*s, 0);})()`);
await p.waitForTimeout(1200); await p.screenshot({ path: out }); await b.close();
