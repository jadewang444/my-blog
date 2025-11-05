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
    // small delay for fonts and styles
    await page.waitForTimeout(800);

    // take screenshot
    const shotPath = `/tmp/verify-${width}.png`;
    await page.screenshot({ path: shotPath, fullPage: false });

    // find nav toggle
    const navHandle = await page.$('.mobile-nav-toggle');
    const navBox = navHandle ? await navHandle.boundingBox() : null;
    const navVisible = navHandle ? await navHandle.isVisible() : false;

    // find caption element
    const captionHandle = await page.$('figcaption.home-photo-caption, figcaption.about-photo-caption, figure figcaption');
    const captionBox = captionHandle ? await captionHandle.boundingBox() : null;

    // find image box (first img inside hero/about figure)
    const imgHandle = await page.$('figure.hero img, figure.about-photo-figure img, figure img');
    const imgBox = imgHandle ? await imgHandle.boundingBox() : null;

    // determine vertical gap between image bottom and caption top (if both present)
    let gap = null;
    if (imgBox && captionBox) {
      gap = captionBox.y - (imgBox.y + imgBox.height);
    }

    // try to open menu by clicking the button (if visible)
    let menuOpened = false;
    if (navHandle && navVisible) {
      try {
        await navHandle.click({ timeout: 1500 });
        await page.waitForTimeout(300);
        // detect nav open by checking aria-expanded attribute
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