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
  await page.waitForTimeout(1500);

  // Analyze tape canvas pixel by pixel
  console.log('\n=== TAPE CANVAS PIXEL ANALYSIS ===');
  const tapeAnalysis = await page.evaluate(() => {
    const canvas = document.get('tape-canvas');
    if (!canvas) return 'no canvas element';
    const ctx = canvas.getcontext('2d');
    if (!ctx) return 'no 2d context';

    // Sample a horizontal line across the middle of the ruler area
    // The ruler should be near the top of the canvas
    const sampleY = 50;
    const image = ctx.imagedata(0, sampleY, canvas.width, 1);
    const pixels = [];
    let blackCount = 0;
    let whiteCount = 0;

    for (let i = 0; i < image.width; i += 10) {
      const offset = i * 4;
      const r = image.data[offset];
      const g = image.data[offset + 1];
      const b = image.data[offset + 2];
      const brightness = (r + g + b) / 3;

      if (brightness < 50) {
        blackCount++;
        pixels.push({x: i, color: 'black'});
      } else if (brightness > 200) {
        whiteCount++;
      }
    }

    return {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      blackPixels: blackCount,
      whitePixels: whiteCount,
      samplePixels: pixels.slice(0, 10)
    };
  });

  console.log('Tape canvas analysis:', tapeAnalysis);

  // Analyze caliper canvas
  console.log('\n=== CALIPER CANVAS PIXEL ANALYSIS ===');
  await page.click('#tabbar .tab[data-tab="caliper"]');
  await page.wait(1000);

  const caliperAnalysis = await page.evaluate(() => {
    const canvas = document.get('caliper-canvas');
    if (!canvas) return 'no canvas element';
    const ctx = canvas.getcontext('2d');
    if (!ctx) return 'no 2d context';

    // Check multiple areas of the canvas
    const areas = [
      {name: 'beam-top', x: 100, y: 100, w: 200, h: 10},
      {name: 'dial-area', x: 600, y: 150, w: 100, h: 100},
      {name: 'jaw-area', x: 100, y: 200, w: 50, h: 100}
    ];

    const results = {};
    for (const area of areas) {
      const image = ctx.imagedata(area.x, area.y, area.w, area.h);
      let nonBackground = 0;
      let total = area.w * area.h;

      for (let i = 0; i < image.data.length; i += 4) {
        const r = image.data[i];
        const g = image.data[i + 1];
        const b = image.data[i + 2];
        // Background is white (255,255,255)
        if (r < 250 || g < 250 || b < 250) {
          nonBackground++;
        }
      }

      results[area.name] = {
        nonBackground: nonBackground,
        total: total,
        percentage: Math.round((nonBackground / total) * 100)
      };
    }

    return results;
  });

  console.log('Caliper canvas analysis:', caliperAnalysis);

  // Analyze weld canvas
  console.log('\n=== WELD CANVAS PIXEL ANALYSIS ===');
  await page.click('#tabbar .tab[data-tab="weld"]');
  await page.wait(1000);

  const weldAnalysis = await page.evaluate(() => {
    const canvas = document.get('weld-canvas');
    if (!canvas) return 'no canvas element';
    const ctx = canvas.getcontext('2d');
    if (!ctx) return 'no 2d context';

    // Check for the reference line (should be horizontal)
    const lineArea = ctx.imagedata(100, 250, 600, 5);
    let linePixels = 0;
    for (let i = 0; i < lineArea.data.length; i += 4) {
      if (lineArea.data[i] < 200) linePixels++;
    }

    // Check for triangle (weld symbol)
    const triangleArea = ctx.imagedata(350, 250, 100, 100);
    let trianglePixels = 0;
    for (let i = 0; i < triangleArea.data.length; i += 4) {
      if (triangleArea.data[i] < 200) trianglePixels++;
    }

    return {
      referenceLinePixels: linePixels,
      trianglePixels: trianglePixels,
      totalLinePixels: 600 * 5,
      totalTrianglePixels: 100 * 100
    };
  });

  console.log('Weld canvas analysis:', weldAnalysis);

  await browser.close();
  console.log('\nDone.');
})();