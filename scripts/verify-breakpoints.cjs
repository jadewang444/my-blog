const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const url = 'https://www.jadewang.space/';
  const widths = [375, 390, 430, 768, 1024];
  const results = [];

  for (const width of widths) {
    const height = (width < 768) ? 800 : 900;
    await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: 'networkidle' });
  // give client-side JS (hydration) more time on slower connections/devices
  await page.waitForTimeout(2500);

    const shotPath = `/tmp/verify-${width}.png`;
    await page.screenshot({ path: shotPath, fullPage: false });

    const navHandle = await page.$('.mobile-nav-toggle');
    const navBox = navHandle ? await navHandle.boundingBox() : null;
    const navVisible = navHandle ? await navHandle.isVisible() : false;

    const captionHandle = await page.$('figcaption.home-photo-caption, figcaption.about-photo-caption, figure figcaption');
    const captionBox = captionHandle ? await captionHandle.boundingBox() : null;

    const imgHandle = await page.$('figure.hero img, figure.about-photo-figure img, figure img');
    const imgBox = imgHandle ? await imgHandle.boundingBox() : null;

    let gap = null;
    if (imgBox && captionBox) {
      gap = Math.round(captionBox.y - (imgBox.y + imgBox.height));
    }

    let menuOpened = false;
    if (navHandle && navVisible) {
      try {
        await navHandle.click({ timeout: 1500 });
        // allow time for click to be handled and aria-expanded to update
        await page.waitForTimeout(500);
        const attr = await page.getAttribute('.mobile-nav-toggle', 'aria-expanded');
        menuOpened = attr === 'true' || attr === 'True' || attr === '1';
      } catch (e) {
        menuOpened = false;
      }
    }

    results.push({ width, navBox, navVisible, menuOpened, imgBox, captionBox, gap, shotPath });
    console.log(`Captured ${shotPath} — navVisible=${navVisible} menuOpened=${menuOpened} gap=${gap}`);
  }

  await browser.close();
  const out = '/tmp/verify-results.json';
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log('Results written to', out);
})();