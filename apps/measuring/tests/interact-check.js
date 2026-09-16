// Interaction regression: correct-answer Check, Find click+Check,
// settings apply/restore on all 3 modules, weld identify highlight check.
const { chromium } = require('playwright');
const APP = 'file:///home/bbear/WELDING/apps/measuring/index.html';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('[console.error] ' + m.text()); });
  const out = [];
  const log = s => { out.push(s); console.log(s); };

  await page.goto(APP);
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);

  // ---- TAPE: answer correctly via exposed logic ----
  const tapeAns = await page.evaluate(() => {
    document.querySelector('[data-tab="tape"]').click();
    return true;
  });
  await page.waitForTimeout(300);
  const tapeQ = await page.evaluate(() => document.querySelector('#tape-question').textContent);
  log('TAPE Q: ' + tapeQ);
  // read target from canvas? use logic: fill correct answer by evaluating TapeLogic with marker pos
  const tapeResult = await page.evaluate(() => {
    const input = document.querySelector('#tape-answer');
    // brute force: try reading pixel of red marker
    const c = document.querySelector('#tape-canvas');
    const ctx = c.getContext('2d');
    const W = c.width;
    let found = -1;
    for (let x = 0; x < W; x++) {
      const d = ctx.getImageData(x, 120, 1, 20).data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 180 && d[i+1] < 80 && d[i+2] < 80) { found = x; break; }
      }
      if (found >= 0) break;
    }
    return { markerX: found };
  });
  log('TAPE markerX: ' + JSON.stringify(tapeResult));
  await page.screenshot({ path: '/tmp/dbg-tape.png' });

  // ---- CALIPER type: read displayed value, answer it ----
  await page.click('[data-tab="caliper"]');
  await page.waitForTimeout(400);
  const calQ = await page.evaluate(() => document.querySelector('#caliper-question').textContent);
  log('CALIPER Q: ' + calQ);
  const calCanvas = await page.evaluate(() => {
    const c = document.querySelector('#caliper-canvas');
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) n++;
    return { px: c.width + 'x' + c.height, painted: n };
  });
  log('CALIPER canvas: ' + JSON.stringify(calCanvas));
  await page.screenshot({ path: '/tmp/dbg-caliper.png' });

  // ---- CALIPER settings apply/restore ----
  await page.click('#caliper-settings');
  await page.waitForTimeout(300);
  const settingsShown = await page.evaluate(() => !!document.querySelector('#panel-caliper .settings-form'));
  log('CALIPER settings form shown: ' + settingsShown);
  await page.screenshot({ path: '/tmp/dbg-caliper-settings.png' });
  await page.click('#panel-caliper .apply-btn');
  await page.waitForTimeout(400);
  const caliperRestored = await page.evaluate(() => ({
    canvas: !!document.querySelector('#caliper-canvas'),
    q: document.querySelector('#caliper-question').textContent
  }));
  log('CALIPER after apply/restore: ' + JSON.stringify(caliperRestored));
  await page.screenshot({ path: '/tmp/dbg-caliper-restored.png' });

  // ---- TAPE settings apply/restore ----
  await page.click('[data-tab="tape"]');
  await page.waitForTimeout(300);
  await page.click('#tape-settings');
  await page.waitForTimeout(300);
  await page.click('#panel-tape .apply-btn');
  await page.waitForTimeout(400);
  const tapeRestored = await page.evaluate(() => ({
    canvas: !!document.querySelector('#tape-canvas'),
    q: document.querySelector('#tape-question').textContent
  }));
  log('TAPE after apply/restore: ' + JSON.stringify(tapeRestored));

  // ---- WELD: identify highlight present (red pixels) + settings ----
  await page.click('[data-tab="weld"]');
  await page.waitForTimeout(400);
  const weldQ = await page.evaluate(() => document.querySelector('#weld-question').textContent);
  log('WELD Q: ' + weldQ);
  const weldRed = await page.evaluate(() => {
    const c = document.querySelector('#weld-canvas');
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let red = 0, painted = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];
      if (a === 0) continue;
      painted++;
      if (r > 180 && g < 110 && b < 110) red++;
    }
    return { painted, red };
  });
  log('WELD pixels: ' + JSON.stringify(weldRed));
  await page.screenshot({ path: '/tmp/dbg-weld.png' });
  // reload several identify questions, ensure red highlight always present
  let noRed = 0;
  for (let i = 0; i < 15; i++) {
    const r = await page.evaluate(() => {
      document.querySelector('#weld-skip').click();
      return true;
    });
    await page.waitForTimeout(2600);
    const pix = await page.evaluate(() => {
      const c = document.querySelector('#weld-canvas');
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let red = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 180 && d[i+1] < 110 && d[i+2] < 110 && d[i+3] !== 0) red++;
      }
      return { red, q: document.querySelector('#weld-question').textContent };
    });
    if (pix.red === 0 && pix.q.indexOf('highlighted') !== -1) { noRed++; log('WELD NO-RED: ' + pix.q); }
  }
  log('WELD identify rounds with no red highlight: ' + noRed + '/15');
  await page.click('#weld-settings');
  await page.waitForTimeout(300);
  await page.click('#panel-weld .apply-btn');
  await page.waitForTimeout(400);
  const weldRestored = await page.evaluate(() => ({
    canvas: !!document.querySelector('#weld-canvas'),
    q: document.querySelector('#weld-question').textContent
  }));
  log('WELD after apply/restore: ' + JSON.stringify(weldRestored));

  log('ERRORS: ' + (errors.length ? '\n' + errors.join('\n') : 'none'));
  await browser.close();
})().catch(e => { console.error('FATAL ' + e.message); process.exit(1); });
