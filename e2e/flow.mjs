import { chromium } from 'playwright';
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
await p.goto(url); await p.waitForTimeout(600);
await p.evaluate("localStorage.setItem('pwr.tour','1')");
await p.click('#goNormal'); await p.waitForTimeout(300);
const st = () => p.evaluate(() => ({ status: __app.s.status, rod: __app.s.rod, p: +__app.s.p.toFixed(3), k: +__app.s.k.toFixed(3), cd: __app.s.countdown, scram: __app.s.scram, rpm: Math.round(__app.s.rpm), br: __app.s.breaker, title: document.getElementById('stTitle').textContent }));
await p.evaluate('__app.setSpeed(2)');
await p.click('#btnOut'); 
for (let i = 0; i < 20; i++) { await p.waitForTimeout(1000); const x = await st(); console.log(i, JSON.stringify(x)); if (x.scram) break; }
await p.waitForTimeout(8000);
console.log('after', JSON.stringify(await st()), await p.textContent('#recoverHint'));
for (let i = 0; i < 40; i++) { await p.waitForTimeout(1000); if (!(await p.$eval('#btnRecover', (e) => e.disabled))) break; }
await p.click('#btnRecover'); console.log('recovered', JSON.stringify(await st()));
await p.fill('#rodSlider', '80'); await p.dispatchEvent('#rodSlider', 'input');
await p.waitForTimeout(100); await p.evaluate('__app.setRodTarget(80)');
for (let i = 0; i < 40; i++) { await p.waitForTimeout(1000); const x = await st(); if (x.br && x.rpm === 3000) { console.log('resync', i, JSON.stringify(x)); break; } }
console.log('errors', errs);
await b.close();
