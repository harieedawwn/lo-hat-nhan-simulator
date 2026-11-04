import { chromium } from 'playwright';
const [,, url, prefix, w = '1600', h = '900', ...views] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
await p.goto(url); await p.waitForTimeout(1200);
for (const v of views) {
  if (v.startsWith('js:')) { await p.evaluate(v.slice(3)); await p.waitForTimeout(600); continue; }
  await p.evaluate((n) => window.__app.stage.focus(n, 0), v);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${prefix}-${v}.png` });
}
if (errs.length) console.log(errs.join('\n'));
await b.close();
