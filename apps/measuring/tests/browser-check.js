// Playwright browser verification script
// Loads the app, switches between tabs, takes screenshots

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

  // Enable console log capture
  page.on('console', msg => console.log('[' + msg.type() + '] ' + msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR] ' + err.message));

  const APP_URL = 'file:///home/bbear/WELDING/apps/measuring/index.html';

  console.log('Loading app: ' + APP_URL);
  try {
    await page.goto(APP_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log('Error loading page: ' + e.message);
    await browser.close();
    return;
  }

  // Check if tape tab loaded
  console.log('\n=== TAPING TAB (default) ===');
  try {
    await page.screenshot({ path: '/tmp/tape-tab.png', fullPage: false });
    console.log('Screenshot: /tmp/tape-tab.png');

    // Check canvas has content
    const hasCanvas = await page.evaluate(() => {
      return document.querySelector('#tape-canvas') !== null;
    });
    console.log('Tape canvas exists: ' + hasCanvas);
  } catch (e) {
    console.log('Error: ' + e.message);
  }

  // Switch to caliper tab
  console.log('\n=== CALIPER TAB ===');
  try {
    await page.click('#tabbar .tab[data-tab="caliper"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/caliper-tab.png', fullPage: false });
    console.log('Screenshot: /tmp/caliper-tab.png');

    const hasCanvas = await page.evaluate(() => {
      return document.querySelector('#caliper-canvas') !== null;
    });
    console.log('Caliper canvas exists: ' + hasCanvas);
  } catch (e) {
    console.log('Error: ' + e.message);
  }

  // Switch to welding tab
  console.log('\n=== WELDING TAB ===');
  try {
    await page.click('#tabbar .tab[data-tab="weld"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/weld-tab.png', fullPage: false });
    console.log('Screenshot: /tmp/weld-tab.png');

    const hasCanvas = await page.evaluate(() => {
      return document.querySelector('#weld-canvas') !== null;
    });
    console.log('Weld canvas exists: ' + hasCanvas);
  } catch (e) {
    console.log('Error: ' + e.message);
  }

  // Check for errors in the console
  console.log('\n=== SUMMARY ===');
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Page contains content: ' + (bodyText.length > 0));

  // Check localStorage is working
  try {
    const storageWorked = await page.evaluate(() => {
      try {
        localStorage.setItem('_test', 'ok');
        const val = localStorage.getItem('_test');
        localStorage.removeItem('_test');
        return val === 'ok';
      } catch (e) {
        return false;
      }
    });
    console.log('LocalStorage works: ' + storageWorked);
  } catch (e) {
    console.log('LocalStorage check failed: ' + e.message);
  }

  await browser.close();
  console.log('\nDone. Check /tmp/*.png for screenshots.');
})();
