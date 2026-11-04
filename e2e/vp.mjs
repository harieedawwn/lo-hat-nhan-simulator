import { chromium, devices } from 'playwright';
const [,, url, out, w, h, touch = '0', ...js] = process.argv;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: touch === '1', isMobile: touch === '1' });
const p = await ctx.newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
await p.goto(url); await p.waitForTimeout(900);
for (const j of js) { await p.evaluate(j); await p.waitForTimeout(700); }
await p.screenshot({ path: out });
if (errs.length) console.log(errs.join('\n'));
await b.close();
