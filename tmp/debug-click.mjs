import playwright from 'playwright';
(async()=>{
  const { chromium } = playwright;
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto('https://www.jadewang.space/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const flag = await p.evaluate(() => !!window.__mobileNavDelegated);
  console.log('delegated flag on page:', flag);

  const res = await p.evaluate(() => {
    const btn = document.querySelector('.mobile-nav-toggle');
    if (!btn) return { ok: false };
    const before = btn.getAttribute('aria-expanded');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return { before, after: btn.getAttribute('aria-expanded') };
  });
  console.log(res);
  await b.close();
})();
