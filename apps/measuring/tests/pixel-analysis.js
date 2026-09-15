const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[ERROR] ' + msg.text());
  });
  page.on('pageerror', err => console.log('[PAGE ERROR] ' + err.message));

  const APP_URL = 'file:///home/bbear/WELDING/apps/measuring/index.html';

  console.log('Loading app...');
  await page.goto(APP_URL);
  await page.waitForTimeout(2000);

  // === TAPE CANVAS ===
  console.log('\n=== TAPE CANVAS DETAILED ANALYSIS ===');
  const tapeResult = await page.evaluate(() => {
    const canvas = document.getElementById('tape-canvas');
    if (!canvas) return { error: 'no tape-canvas element' };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: 'no 2d context' };

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let blackPixels = 0;
    let darkPixels = 0;
    let whitePixels = 0;
    let otherPixels = 0;

    for (let i = 0; i < image.data.length; i += 16) {
      const r = image.data[i];
      const g = image.data[i+1];
      const b = image.data[i+2];
      const a = image.data[i+3];

      if (a < 128) { continue; } // transparent

      const brightness = (r + g + b) / 3;
      if (brightness < 50) blackPixels++;
      else if (brightness < 150) darkPixels++;
      else if (brightness > 200) whitePixels++;
      else otherPixels++;
    }

    return {
      width: canvas.width,
      height: canvas.height,
      blackPixels: blackPixels * 4,
      darkPixels: darkPixels * 4,
      whitePixels: whitePixels * 4,
      otherPixels: otherPixels * 4
    };
  });
  console.log(JSON.stringify(tapeResult, null, 2));

  // Check if we can see tick marks - sample horizontal line at y=50
  const tapeTickCheck = await page.evaluate(() => {
    const canvas = document.getElementById('tape-canvas');
    if (!canvas) return { error: 'no canvas' };
    const ctx = canvas.getContext('2d');
    const lineData = ctx.getImageData(0, 50, canvas.width, 1);
    let tickCount = 0;
    let inTick = false;
    for (let x = 0; x < lineData.width; x++) {
      const offset = x * 4;
      const brightness = (lineData.data[offset] + lineData.data[offset+1] + lineData.data[offset+2]) / 3;
      if (brightness < 100 && !inTick) {
        tickCount++;
        inTick = true;
      } else if (brightness >= 100) {
        inTick = false;
      }
    }
    return { tickCount, lineWidth: lineData.width };
  });
  console.log('Tape tick marks found:', tapeTickCheck);

  // === CALIPER CANVAS ===
  console.log('\n=== CALIPER CANVAS DETAILED ANALYSIS ===');
  await page.click('#tabbar .tab[data-tab="caliper"]');
  await page.waitForTimeout(1500);

  const caliperResult = await page.evaluate(() => {
    const canvas = document.getElementById('caliper-canvas');
    if (!canvas) return { error: 'no caliper-canvas element' };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: 'no 2d context' };

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let blackPixels = 0;
    let darkPixels = 0;
    let whitePixels = 0;
    let otherPixels = 0;

    for (let i = 0; i < image.data.length; i += 16) {
      const r = image.data[i];
      const g = image.data[i+1];
      const b = image.data[i+2];
      const a = image.data[i+3];

      if (a < 128) { continue; }

      const brightness = (r + g + b) / 3;
      if (brightness < 50) blackPixels++;
      else if (brightness < 150) darkPixels++;
      else if (brightness > 200) whitePixels++;
      else otherPixels++;
    }

    return {
      width: canvas.width,
      height: canvas.height,
      blackPixels: blackPixels * 4,
      darkPixels: darkPixels * 4,
      whitePixels: whitePixels * 4,
      otherPixels: otherPixels * 4
    };
  });
  console.log(JSON.stringify(caliperResult, null, 2));

  // === WELD CANVAS ===
  console.log('\n=== WELD CANVAS DETAILED ANALYSIS ===');
  await page.click('#tabbar .tab[data-tab="weld"]');
  await page.waitForTimeout(1500);

  const weldResult = await page.evaluate(() => {
    const canvas = document.getElementById('weld-canvas');
    if (!canvas) return { error: 'no weld-canvas element' };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: 'no 2d context' };

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let blackPixels = 0;
    let darkPixels = 0;
    let whitePixels = 0;
    let otherPixels = 0;

    for (let i = 0; i < image.data.length; i += 16) {
      const r = image.data[i];
      const g = image.data[i+1];
      const b = image.data[i+2];
      const a = image.data[i+3];

      if (a < 128) { continue; }

      const brightness = (r + g + b) / 3;
      if (brightness < 50) blackPixels++;
      else if (brightness < 150) darkPixels++;
      else if (brightness > 200) whitePixels++;
      else otherPixels++;
    }

    return {
      width: canvas.width,
      height: canvas.height,
      blackPixels: blackPixels * 4,
      darkPixels: darkPixels * 4,
      whitePixels: whitePixels * 4,
      otherPixels: otherPixels * 4
    };
  });
  console.log(JSON.stringify(weldResult, null, 2));

  await browser.close();
  console.log('\nDone.');
})();