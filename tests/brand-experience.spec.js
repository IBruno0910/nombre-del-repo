import { test, expect } from '@playwright/test';

async function freezeClock(page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
}

test('intro keeps its mark, brand and services separate through the reveal on all screen sizes', async ({ page }) => {
  await freezeClock(page);
  for (const [width, height, lang] of [[1440, 900, 'en'], [390, 844, 'es'], [320, 568, 'es'], [844, 390, 'en']]) {
    await page.setViewportSize({ width, height });
    await page.goto(`/${lang}`);
    await page.evaluate(() => sessionStorage.removeItem('owa-intro-seen'));
    await page.reload();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.evaluate(async () => { await document.fonts.ready; await document.querySelector('.brand-intro__name img').decode(); });
    for (const time of [600, 1600, 2350]) {
      const layout = await page.evaluate(time => {
        const intro = document.querySelector('.brand-intro');
        for (const animation of intro.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = time; }
        const rects = [...intro.querySelector('.brand-intro__stage').children].map(el => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        });
        const skip = intro.querySelector('button').getBoundingClientRect();
        return {
          separate: rects.every((r, i) => i === 0 || r.top >= rects[i - 1].bottom + 8),
          fits: rects.every(r => r.top >= 0 && r.bottom < skip.top && r.left >= 0 && r.right <= innerWidth),
        };
      }, time);
      expect(layout, `${width}×${height}, ${time}ms`).toEqual({ separate: true, fits: true });
    }
    await page.getByRole('button', { name: lang === 'es' ? 'Saltar introducción' : 'Skip intro' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/intro-active/);
    await expect(page.locator('.header .brand')).toBeFocused();
  }
});

test('intro exits automatically, restores the page and only appears once per session', async ({ page }) => {
  await freezeClock(page);
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.clock.runFor(3500);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/intro-active/);
  await expect(page.locator('.header .brand')).toBeFocused();
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('intro supports keyboard skip, Escape and reduced motion without locking the page', async ({ browser }) => {
  const page = await browser.newPage();
  await freezeClock(page);
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/intro-active/);
  await page.evaluate(() => sessionStorage.clear());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/intro-active/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/intro-active/);
  await page.close();
});

test('larger navigation stays clear, fits the header and opens an accessible menu on smaller screens', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('owa-intro-seen', 'true'));
  for (const lang of ['es', 'en']) {
    await page.goto(`/${lang}`);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1440, 1120, 1024, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const header = page.locator('.header');
      const layout = await header.evaluate(el => {
        const s = getComputedStyle(el);
        const children = [...el.querySelector('.header-inner').children].filter(e => getComputedStyle(e).display !== 'none');
        const rects = children.map(e => e.getBoundingClientRect());
        return {
          blur: s.backdropFilter,
          background: s.backgroundColor,
          fits: rects.every((r, i) => r.left >= 0 && r.right <= innerWidth && (i === 0 || r.left >= rects[i - 1].right)),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(layout, `${lang}, ${width}px`).toEqual({ blur: 'none', background: 'rgba(0, 0, 0, 0)', fits: true, overflow: false });
      if (width > 1100) {
        await expect(header.locator('.navigation a').first()).toHaveCSS('font-size', '16px');
      } else {
        const menu = header.getByRole('button', { name: lang === 'es' ? 'Abrir menú' : 'Open menu' });
        await menu.click();
        await expect(header.locator('.navigation a').first()).toHaveCSS('font-size', '18px');
        await expect(header.locator('.mobile-contact')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(menu).toHaveAttribute('aria-expanded', 'false');
      }
    }
  }
});
