const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.argv[2] || 'https://www.jadewang.space/';
  const widths = [390, 768, 1280];
  const results = [];
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  for (const w of widths) {
    const h = w <= 768 ? 900 : 900;
    await page.setViewportSize({ width: w, height: h });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // allow hydration

    // Take screenshot
    const shotPath = `./tmp/verify-${w}.png`;
    await page.screenshot({ path: shotPath, fullPage: false });

    // ALIGNMENT: find calendar icon + date text
    const dateSelectors = ['time.jotting-date', '.preface-date', '.preface-date.text-center', '.jotting-date'];
    let dateEl = null;
    for (const sel of dateSelectors) {
      dateEl = await page.$(sel);
      if (dateEl) break;
    }

    let alignDelta = null;
    let alignInfo = {};
    if (dateEl) {
      // calendar svg inside
      const svg = await dateEl.$('svg');
      const txt = await dateEl.evaluate((el) => {
        // find the first text node (excluding svg)
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            const s = node.textContent.trim();
            if (s) return s;
          }
        }
        return el.innerText || '';
      });

      const svgBox = svg ? await svg.boundingBox() : null;
      const textBox = await dateEl.boundingBox();
      if (svgBox && textBox) {
        // vertical center of svg vs text box center
        const svgCenter = svgBox.y + svgBox.height / 2;
        const textCenter = textBox.y + textBox.height / 2;
        alignDelta = Math.abs(Math.round(svgCenter - textCenter));
        alignInfo = { svgBox, textBox, svgCenter, textCenter };
      }
    }

    // NAV STACKING: header z-index vs hero
    const header = await page.$('header');
    const hero = await page.$('figure.hero, .about-photo-figure, .hero');
    const headerZ = header ? await page.evaluate((el) => getComputedStyle(el).zIndex || 'auto', header) : 'missing';
    const heroZ = hero ? await page.evaluate((el) => getComputedStyle(el).zIndex || 'auto', hero) : 'missing';

    // NAV CLICK: find toggle
    const toggle = await page.$('.mobile-nav-toggle');
    let navClickResult = { exists: !!toggle, before: null, after: null, troubles: [] };
    if (toggle) {
      const before = await page.getAttribute('.mobile-nav-toggle', 'aria-expanded');
      navClickResult.before = before;
      try {
        await toggle.click({ timeout: 2000 });
        await page.waitForTimeout(400);
        const mid = await page.getAttribute('.mobile-nav-toggle', 'aria-expanded');
        navClickResult.after = mid;

        // click again to close
        await toggle.click({ timeout: 2000 });
        await page.waitForTimeout(400);
        const final = await page.getAttribute('.mobile-nav-toggle', 'aria-expanded');
        navClickResult.final = final;
      } catch (e) {
        navClickResult.troubles.push(String(e));
      }
    }

    const passAlign = (alignDelta !== null && alignDelta <= 1);
    const passStack = (headerZ === 'auto' || heroZ === 'auto') ? null : (Number(headerZ) > Number(heroZ));
    const passNav = !!(navClickResult.before !== null && navClickResult.after === 'true' && navClickResult.final === 'false');

    results.push({
      width: w,
      shot: shotPath,
      alignment: { delta: alignDelta, pass: passAlign, info: alignInfo },
      stacking: { headerZ, heroZ, pass: passStack },
      nav: { ...navClickResult, pass: passNav }
    });

    console.log(`W=${w}: align=${alignDelta}px (${passAlign? 'PASS':'FAIL'}) headerZ=${headerZ} heroZ=${heroZ} navPass=${passNav}`);
  }

  await browser.close();
  const out = './tmp/verify-ui-results.json';
  fs.mkdirSync('./tmp', { recursive: true });
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log('Full results written to', out);
})();
