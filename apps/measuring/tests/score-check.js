// Verify scoring flows: caliper Find click+Check, caliper Type correct answer, tape correct answer.
const { chromium } = require('playwright');
const APP = 'file:///home/bbear/WELDING/apps/measuring/index.html';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(APP);
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);

  // Force caliper find mode via localStorage then reload
  await page.evaluate(() => {
    localStorage.setItem('weldtrain_caliper_settings', JSON.stringify({ unit: 'inch', resolution: '1/8', mode: 'find' }));
    localStorage.setItem('weldtrain_tape_settings', JSON.stringify({ precision: '8' }));
  });
  await page.reload();
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);
  await page.click('[data-tab="caliper"]');
  await page.waitForTimeout(300);
  const q = await page.evaluate(() => document.querySelector('#caliper-question').textContent);
  console.log('FIND Q: ' + q);
  // click at target position: parse target from question is hard; instead click beam center and check feedback appears
  const box = await page.evaluate(() => {
    const c = document.querySelector('#caliper-canvas');
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await page.mouse.click(box.x + box.w * 0.3, box.y + 120);
  await page.waitForTimeout(300);
  await page.click('#caliper-check');
  await page.waitForTimeout(300);
  const fb = await page.evaluate(() => {
    const el = document.querySelector('#panel-caliper .feedback');
    return el ? el.textContent : '(no feedback)';
  });
  console.log('FIND feedback after click+check: ' + fb);
  const score1 = await page.evaluate(() => document.querySelector('#panel-caliper .score').textContent);
  console.log('FIND score: ' + score1);
  await page.screenshot({ path: '/tmp/dbg-find.png' });

  // Type mode: set mode via settings UI to type/0.001, read displayed value via pixel? use answer = displayed text
  await page.evaluate(() => {
    localStorage.setItem('weldtrain_caliper_settings', JSON.stringify({ unit: 'inch', resolution: '0.001', mode: 'type' }));
  });
  await page.reload();
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);
  await page.click('[data-tab="caliper"]');
  await page.waitForTimeout(300);
  const shown = await page.evaluate(() => {
    // displayed value is drawn on canvas; recompute: read target through debug hook is impossible,
    // so answer with the value shown under dial via OCR-free trick: expose CaliperLogic? Instead:
    // click Check with empty input -> no-op; we need the target. Use formatTarget on... expose via window? Not available.
    // Fallback: try skipping to see correct string
    document.querySelector('#caliper-skip').click();
    return true;
  });
  await page.waitForTimeout(300);
  const skipFb = await page.evaluate(() => {
    const el = document.querySelector('#panel-caliper .feedback');
    return el ? el.textContent : '(no feedback)';
  });
  console.log('TYPE skip feedback (reveals correct): ' + skipFb);
  await page.waitForTimeout(2500);

  console.log('ERRORS: ' + (errors.length ? errors.join(' | ') : 'none'));
  await browser.close();
})().catch(e => { console.error('FATAL ' + e.message); process.exit(1); });
