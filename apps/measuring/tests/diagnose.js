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

  // Check tape tab
  console.log('\n=== TAPE TAB ===');
  try {
    const tapeCanvas = page.locator('#tape-canvas');
    if (await tapeCanvas.isVisible()) {
      console.log('Tape canvas: VISIBLE');
      // Check if canvas has content (non-transparent pixels)
      const hasContent = await page.evaluate(() => {
        const canvas = document.getElementById('tape-canvas');
        if (!canvas) return 'no canvas element';
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no 2d context';
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Count non-transparent pixels
        let nonTransparent = 0;
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) nonTransparent++;
        }
        return `canvas ${canvas.width}x${canvas.height}, ${nonTransparent} non-transparent pixels`;
      });
      console.log('Tape canvas content: ' + hasContent);
    } else {
      console.log('Tape canvas: NOT VISIBLE');
    }

    const questionText = await page.evaluate(() => {
      const el = document.getElementById('tape-question');
      return el ? el.innerText : 'no question element';
    });
    console.log('Question text: ' + questionText);
  } catch (e) {
    console.log('Error: ' + e.message);
  }

  // Check caliper tab
  console.log('\n=== CALIPER TAB ===');
  try {
    await page.click('#tabbar .tab[data-tab="caliper"]');
    await page.waitForTimeout(1000);

    const caliperCanvas = page.locator('#caliper-canvas');
    if (await caliperCanvas.isVisible()) {
      console.log('Caliper canvas: VISIBLE');
      const hasContent = await page.evaluate(() => {
        const canvas = document.getElementById('caliper-canvas');
        if (!canvas) return 'no canvas element';
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no 2d context';
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let nonTransparent = 0;
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) nonTransparent++;
        }
        return `canvas ${canvas.width}x${canvas.height}, ${nonTransparent} non-transparent pixels`;
      });
      console.log('Caliper canvas content: ' + hasContent);
    } else {
      console.log('Caliper canvas: NOT VISIBLE');
    }

    const questionText = await page.evaluate(() => {
      const el = document.getElementById('caliper-question');
      return el ? el.innerText : 'no question element';
    });
    console.log('Question text: ' + questionText);
  } catch (e) {
    console.log('Error: ' + e.message);
  }

  // Check weld tab
  console.log('\n=== WELD TAB ===');
  try {
    await page.click('#tabbar .tab[data-tab="weld"]');
    await page.waitForTimeout(1000);

    const weldCanvas = page.locator('#weld-canvas');
    if (await weldCanvas.isVisible()) {
      console.log('Weld canvas: VISIBLE');
      const hasContent = await page.evaluate(() => {
        const canvas = document.getElementById('weld-canvas');
        if (!canvas) return 'no canvas element';
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no 2d context';
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let nonTransparent = 0;
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) nonTransparent++;
        }
        return `canvas ${canvas.width}x${canvas.height}, ${nonTransparent} non-transparent pixels`;
      });
      console.log('Weld canvas content: ' + hasContent);
    } else {
      console.log('Weld canvas: NOT VISIBLE');
    }

    const questionText = await page.evaluate(() => {
      const el = document.getElementById('weld-question');
      return el ? el.innerText : 'no question element';
    });
    console.log('Question text: ' + questionText);
  } catch (e) {
    console.log('Error: ' + e.message);
  }

  await browser.close();
  console.log('\nDone.');
})();