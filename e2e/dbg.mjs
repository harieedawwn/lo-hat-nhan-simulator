import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://127.0.0.1:5173/'); await p.waitForTimeout(800);
await p.evaluate("document.getElementById('goNormal').click()"); await p.waitForTimeout(1500);
console.log(await p.evaluate(() => { const r = document.querySelector('#rodsCard').getBoundingClientRect(); const ring = document.getElementById('tourRing').style.cssText; const c = document.getElementById('tourCard').style.cssText; return JSON.stringify({ r, ring, c, sc: document.getElementById('pscroll').scrollTop, ws: [window.scrollX, window.scrollY, document.body.scrollTop] }); }));
await b.close();
