const { chromium } = require('playwright');

async function analyzeCanvas(page, canvasId) {
  const result = await page.evaluate((id) => {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Count pixels by brightness
    let black = 0, dark = 0, mid = 0, light = 0, white = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const brightness = (r + g + b) / 3;
      
      if (brightness < 20) black++;
      else if (brightness < 80) dark++;
      else if (brightness < 160) mid++;
      else if (brightness < 230) light++;
      else white++;
    }
    
    // Check for tick marks: look for vertical black lines
    // Sample a horizontal row at 1/4 height and count black pixel transitions
    let rowY = Math.floor(canvas.height / 4);
    let tickTransitions = 0;
    let inBlack = false;
    
    for (let x = 0; x < canvas.width; x++) {
      const idx = (rowY * canvas.width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const isBlack = (r < 50 && g < 50 && b < 50);
      
      if (isBlack && !inBlack) {
        tickTransitions++;
        inBlack = true;
      } else if (!isBlack) {
        inBlack = false;
      }
    }
    
    return {
      width: canvas.width,
      height: canvas.height,
      black, dark, mid, light, white,
      tickTransitions
    };
  }, canvasId);
  
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect JS errors
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  
  await page.goto('file:///home/bbear/WELDING/apps/measuring/index.html');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  
  console.log('=== JS Errors ===');
  if (errors.length === 0) {
    console.log('None');
  } else {
    errors.forEach(e => console.log('  ' + e));
  }
  
  console.log('\n=== Tape Canvas Analysis ===');
  const tape = await analyzeCanvas(page, 'tape-canvas');
  if (tape) {
    console.log(`  Size: ${tape.width}x${tape.height}`);
    console.log(`  Black pixels: ${tape.black} (${(tape.black/(tape.width*tape.height)*100).toFixed(2)}%)`);
    console.log(`  Dark pixels: ${tape.dark}`);
    console.log(`  Tick mark transitions detected: ${tape.tickTransitions}`);
  } else {
    console.log('  Canvas not found!');
  }
  
  // Switch to caliper tab
  await page.click('#tabbar .tab[data-tab="caliper"]');
  await page.waitForTimeout(1000);
  
  console.log('\n=== Caliper Canvas Analysis ===');
  const caliper = await analyzeCanvas(page, 'caliper-canvas');
  if (caliper) {
    console.log(`  Size: ${caliper.width}x${caliper.height}`);
    console.log(`  Black pixels: ${caliper.black} (${(caliper.black/(caliper.width*caliper.height)*100).toFixed(2)}%)`);
    console.log(`  Dark pixels: ${caliper.dark}`);
    console.log(`  Tick mark transitions detected: ${caliper.tickTransitions}`);
  } else {
    console.log('  Canvas not found!');
  }
  
  // Switch to weld tab
  await page.click('#tabbar .tab[data-tab="weld"]');
  await page.waitForTimeout(1000);
  
  console.log('\n=== Weld Canvas Analysis ===');
  const weld = await analyzeCanvas(page, 'weld-canvas');
  if (weld) {
    console.log(`  Size: ${weld.width}x${weld.height}`);
    console.log(`  Black pixels: ${weld.black} (${(weld.black/(weld.width*weld.height)*100).toFixed(2)}%)`);
    console.log(`  Dark pixels: ${weld.dark}`);
    console.log(`  Tick mark transitions detected: ${weld.tickTransitions}`);
  } else {
    console.log('  Canvas not found!');
  }
  
  // Take final screenshots for the user to examine
  await page.click('#tabbar .tab[data-tab="tape"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-tape.png' });
  
  await page.click('#tabbar .tab[data-tab="caliper"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-caliper.png' });
  
  await page.click('#tabbar .tab[data-tab="weld"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-weld.png' });
  
  console.log('\n=== Screenshots saved ===');
  console.log('  /tmp/final-tape.png');
  console.log('  /tmp/final-caliper.png');
  console.log('  /tmp/final-weld.png');
  
  await browser.close();
})();
