import { test, expect } from '@playwright/test';
import type { createGrinch, GrinchController } from '../src/index.js';
declare global {
  interface Window {
    createGrinch: typeof createGrinch;
    grinch: GrinchController;
    clicks: number;
  }
}
test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto('/fixture.html');
  await page.waitForFunction(() => !!window.grinch);
});
test('steals, returns and becomes friendly without modifying content', async ({ page }) => {
  const before = await page.locator('#one').innerHTML();
  expect(await page.evaluate(() => window.grinch.steal('#one'))).toBe(true);
  await page.clock.runFor(6500);
  expect((await page.evaluate(() => window.grinch.getState())).totalStolen).toBe(1);
  await page.evaluate(() => window.grinch.shoo());
  await page.clock.runFor(1200);
  expect((await page.evaluate(() => window.grinch.getState())).stolen).toBe(0);
  await page.evaluate(() => window.grinch.redeem());
  await page.clock.runFor(2500);
  const s = await page.evaluate(() => window.grinch.getState());
  expect(s.mood).toBe('friendly');
  expect(s.gifts.every((g) => g.state === 'available')).toBe(true);
  expect(await page.locator('#one').innerHTML()).toBe(before);
});
test('paused document coordinates survive scrolling and live targets move', async ({ page }) => {
  await page.evaluate(() => window.grinch.pause());
  const a = await page.evaluate(() => window.grinch.getState());
  await page.evaluate(() => window.scrollTo(0, 150));
  await page.waitForTimeout(120);
  const b = await page.evaluate(() => window.grinch.getState());
  expect(b.character?.y).toBe(a.character?.y);
  expect(b.gifts[0]?.y).toBe(a.gifts[0]?.y);
  await page.locator('#one').evaluate((el) => {
    el.style.transform = 'translateY(50px)';
  });
  await page.waitForTimeout(120);
  expect((await page.evaluate(() => window.grinch.getState())).gifts[0]!.y).toBe(
    a.gifts[0]!.y + 50,
  );
  await page.evaluate(() => {
    window.grinch.resume();
    window.grinch.steal('#one');
  });
  await page.waitForTimeout(150);
  expect((await page.evaluate(() => window.grinch.getState())).phase).not.toBe('idle');
});
test('nested scrolling reanchors gifts; teardown releases the overlay', async ({ page }) => {
  await page.evaluate(() => {
    window.grinch.destroy();
    window.grinch = window.createGrinch({
      targets: '#three',
      entrance: 'appear',
      autoSteal: false,
    });
    window.grinch.pause();
    window.scrollTo(0, 800);
  });
  await page.waitForTimeout(120);
  const a = await page.evaluate(() => window.grinch.getState().gifts[0]!.y);
  await page.locator('#scrollbox').evaluate((el) => {
    el.scrollTop = 100;
  });
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.grinch.getState().gifts[0]!.y)).toBe(a - 100);
  await page.evaluate(() => {
    window.grinch.destroy();
    window.grinch.destroy();
  });
  await expect(page.locator('[data-fluri-grinch]')).toHaveCount(0);
});
test('invalid selectors leave no installed overlay and host clicks work', async ({ page }) => {
  await page.evaluate(() => window.grinch.destroy());
  expect(
    await page.evaluate(() => {
      try {
        window.createGrinch({ targets: '[' });
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  await expect(page.locator('[data-fluri-grinch]')).toHaveCount(0);
  await page.evaluate(() => {
    window.grinch = window.createGrinch({ entrance: 'appear', autoSteal: false, controls: true });
  });
  await page.locator('#click').click();
  expect(await page.evaluate(() => window.clicks)).toBe(1);
  await page.getByRole('button', { name: 'Pause Grinch', exact: true }).click();
  expect(await page.evaluate(() => window.grinch.getState().state)).toBe('paused');
});
test('respects reduced motion and contains layout on phones', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForFunction(() => !!window.grinch);
  const before = await page.evaluate(() => window.grinch.getState());
  expect(before.reducedMotion).toBe(true);
  expect(before.phase).toBe('idle');
  expect(await page.evaluate(() => window.grinch.steal())).toBe(false);
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const react = page.getByRole('tab', { name: 'React', exact: true });
  await react.click();
  await expect(react).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#code-content')).toContainText('useEffect');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Vue', exact: true })).toBeFocused();
});

test('continues a heist while the document scrolls', async ({ page }) => {
  await page.evaluate(() => {
    window.grinch.destroy();
    window.grinch = window.createGrinch({
      targets: '#two',
      entrance: 'appear',
      fearRadius: 0,
      autoSteal: false,
    });
    window.grinch.steal();
  });
  const start = await page.evaluate(() => window.grinch.getState().character!.x);
  await page.evaluate(() => window.scrollTo(0, 80));
  await page.clock.runFor(200);
  const moved = await page.evaluate(() => window.grinch.getState());
  expect(moved.character!.x).toBeGreaterThan(start);
  expect(moved.gifts[0]!.y).toBe(
    await page.locator('#two').evaluate((el) => el.getBoundingClientRect().top + window.scrollY),
  );
});
