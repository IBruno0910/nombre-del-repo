import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('owa-intro-seen', 'true'));
});

test('service banners reveal on scroll, preserve selection and work with the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en');
  const banner = page.locator('[data-service-id="3"]');
  await banner.scrollIntoViewIfNeeded();
  await expect(banner.locator('.service-banner-content')).toHaveCSS('opacity', '1');
  expect(await banner.evaluate(el => el.clientWidth)).toBe(1440);
  const image = banner.locator('img');
  await expect(image).toHaveAttribute('src', '/images/services/corporate-solutions.jpg');
  const before = await banner.locator('.service-photo').evaluate(el => getComputedStyle(el).transform);
  await page.evaluate(() => window.scrollBy({top:140,behavior:'instant'}));
  await expect.poll(() => banner.locator('.service-photo').evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  await banner.getByRole('button').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveText('Corporate solutions');
  await page.keyboard.press('Escape');
  await expect(banner.getByRole('button')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('button', {name:'Ask about this service'}).click();
  await expect(page.locator('.contact-form select')).toHaveValue('3');
});

test('all mobile banners remain legible and usable with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/es');
  for (const id of [2,0,1,3,4]) {
    const banner = page.locator(`[data-service-id="${id}"]`);
    await banner.scrollIntoViewIfNeeded();
    await expect(banner.locator('.service-banner-content')).toHaveCSS('opacity', '1');
    await expect(banner.locator('.service-photo')).toHaveCSS('transform', 'none');
    const fit = await banner.evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return [...el.querySelectorAll('h3,.service-summary,.service-more')].every(item => {
        const rect = item.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth && rect.top >= bounds.top && rect.bottom <= bounds.bottom;
      });
    });
    expect(fit).toBe(true);
    await banner.getByRole('button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
