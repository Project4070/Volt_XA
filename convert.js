const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 4000, height: 4000, deviceScaleFactor: 4 });
  await page.goto('file:///C:/Volt_XA.svg', { waitUntil: 'networkidle0', timeout: 60000 });

  await page.waitForSelector('svg');
  await new Promise(r => setTimeout(r, 3000));

  const clip = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    const { x, y, width, height } = svg.getBoundingClientRect();
    return { x, y, width: Math.ceil(width), height: Math.ceil(height) };
  });

  await page.screenshot({
    path: 'C:\\Users\\where\\Desktop\\Volt_XA.png',
    clip: clip
  });

  await browser.close();
  console.log('Done! Output: C:\\Users\\where\\Desktop\\Volt_XA.png');
  console.log(`Resolution: ${clip.width * 4} x ${clip.height * 4} pixels`);
})();