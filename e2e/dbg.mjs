import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript("localStorage.setItem('pwr.tour','1')");
const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://127.0.0.1:4173/'); await p.waitForTimeout(600); await p.click('#goNormal'); await p.waitForTimeout(500);
await p.click('#rodPlus');
console.log(await p.evaluate(() => document.activeElement.id + ' ' + document.getElementById('start').hidden));
await p.keyboard.press('Space'); console.log(await p.getAttribute('#tbPause', 'aria-pressed'));
await b.close();
