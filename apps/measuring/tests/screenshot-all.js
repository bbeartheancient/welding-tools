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

  // Take screenshot of tape
  console.log('Taking tape screenshot...');
  await page.screenshot({ path: '/tmp/welding-tape.png', fullPage: false });
  console.log('Tape screenshot saved to /tmp/welding-tape.png');

  // Switch to caliper tab
  console.log('Switching to caliper tab...');
  await page.click('#tabbar .tab[data-tab="caliper"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/welding-caliper.png', fullPage: false });
  console.log('Caliper screenshot saved to /tmp/welding-caliper.png');

  // Switch to weld tab
  console.log('Switching to weld tab...');
  await page.click('#tabbar .tab[data-tab="weld"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/welding-weld.png', fullPage: false });
  console.log('Weld screenshot saved to /tmp/welding-weld.png');

  await browser.close();
  console.log('\nAll screenshots saved.');
})();