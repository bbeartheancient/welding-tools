const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  
  // Collect all console messages and errors
  const logs = [];
  page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
  page.on('pageerror', err => logs.push('[ERROR] ' + err.message));
  
  await page.goto('file:///home/bbear/WELDING/apps/measuring/index.html');
  await page.waitForTimeout(2000);
  
  console.log('=== Console Logs ===');
  logs.forEach(l => console.log(l));
  
  // Check if modules loaded
  console.log('\n=== Module Checks ===');
  const tapeExists = await page.evaluate(() => typeof TapeLogic !== 'undefined');
  const caliperExists = await page.evaluate(() => typeof CaliperLogic !== 'undefined');
  const weldExists = await page.evaluate(() => typeof WeldGame !== 'undefined');
  console.log('TapeLogic loaded:', tapeExists);
  console.log('CaliperLogic loaded:', caliperExists);
  console.log('WeldGame loaded:', weldExists);
  
  // Inspect tape canvas pixels more carefully
  console.log('\n=== Tape Canvas Row 0 ===');
  const tapeRow = await page.evaluate(() => {
    const canvas = document.getElementById('tape-canvas');
    if (!canvas) return 'NO CANVAS';
    const ctx = canvas.getContext('2d');
    // Check a single row of pixels at y=1 (just below top)
    let blackCount = 0;
    for (let x = 0; x < canvas.width; x++) {
      const px = ctx.getImageData(x, 1, 1, 1).data;
      if (px[0] < 50 && px[1] < 50 && px[2] < 50) {
        blackCount++;
        if (blackCount <= 5) {
          console.log('  Black pixel at x=' + x);
        }
      }
    }
    return 'Black pixels in row y=1: ' + blackCount;
  });
  console.log(tapeRow);
  
  // Check for specific pixel positions that should have tick marks
  console.log('\n=== Tape Canvas Pixel Inspection ===');
  const tapePixels = await page.evaluate(() => {
    const canvas = document.getElementById('tape-canvas');
    if (!canvas) return 'NO CANVAS';
    const ctx = canvas.getContext('2d');
    
    // According to facts, precision 16 means ticks every 1/16 inch
    // 256 pixels per inch, so 1/16 inch = 16 pixels
    // Check for ticks at expected positions
    let results = [];
    for (let x = 0; x < Math.min(canvas.width, 200); x += 16) {
      const px = ctx.getImageData(x, 50, 1, 1).data;
      const isDark = px[0] < 100;
      results.push('x=' + x + ': ' + (isDark ? 'DARK (' + px[0] + ')' : 'light (' + px[0] + ')'));
    }
    return results;
  });
  tapePixels.forEach(r => console.log(r));
  
  // Check caliper canvas
  console.log('\n=== Caliper Tab ===');
  await page.click('#tabbar .tab[data-tab="caliper"]');
  await page.waitForTimeout(1000);
  
  const caliperPixels = await page.evaluate(() => {
    const canvas = document.getElementById('caliper-canvas');
    if (!canvas) return 'NO CANVAS';
    const ctx = canvas.getContext('2d');
    
    let results = [];
    // Check beam area
    for (let y = 100; y < 150; y += 10) {
      let rowHasDark = false;
      for (let x = 100; x < 400; x += 20) {
        const px = ctx.getImageData(x, y, 1, 1).data;
        if (px[0] < 100) {
          rowHasDark = true;
          break;
        }
      }
      results.push('Beam row y=' + y + ': ' + (rowHasDark ? 'has dark pixels' : 'all light'));
    }
    return results;
  });
  caliperPixels.forEach(r => console.log(r));
  
  // Check weld canvas
  console.log('\n=== Weld Tab ===');
  await page.click('#tabbar .tab[data-tab="weld"]');
  await page.waitForTimeout(1000);
  
  const weldPixels = await page.evaluate(() => {
    const canvas = document.getElementById('weld-canvas');
    if (!canvas) return 'NO CANVAS';
    const ctx = canvas.getContext('2d');
    
    // Look for the reference line (should be horizontal)
    let lineFound = false;
    for (let y = 200; y < 300; y += 5) {
      let rowDarkCount = 0;
      for (let x = 100; x < 500; x += 10) {
        const px = ctx.getImageData(x, y, 1, 1).data;
        if (px[0] < 100) rowDarkCount++;
      }
      if (rowDarkCount > 5) {
        lineFound = true;
        console.log('Found dark row at y=' + y + ' with ' + rowDarkCount + ' dark pixels');
      }
    }
    return 'Reference line found: ' + lineFound;
  });
  console.log(weldPixels);
  
  await browser.close();
})();
