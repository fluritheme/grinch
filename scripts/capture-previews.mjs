import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('assets/readme', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
await page.goto('http://127.0.0.1:5196/');
await page.waitForFunction(() => !!window.grinch);
await page.waitForFunction(() => window.grinch.getState().phase !== 'arriving');
await page.evaluate(() => window.grinch.pause());
await page.screenshot({ path: 'assets/readme/playground.png' });
await page.setViewportSize({ width: 1280, height: 730 });
await page.goto('http://127.0.0.1:5196/preview.html');
await page.waitForFunction(() => !!window.previewLeft && !!window.previewRight);
await page.evaluate(() => window.previewLeft.steal());
await page.waitForFunction(() => window.previewLeft.getState().phase === 'stashing');
await page.evaluate(() => {
  window.previewLeft.pause();
  window.previewRight.redeem();
});
await page.waitForTimeout(700);
await page.evaluate(() => window.previewRight.pause());
await page.screenshot({ path: 'assets/readme/routines.png' });
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto('http://127.0.0.1:5196/preview.html');
await page.waitForFunction(() => !!window.previewLeft);
await page.evaluate(() => {
  window.previewRight.destroy();
  document.querySelector('#right').remove();
  document.querySelector('.row').style.gridTemplateColumns = '1fr';
  document.querySelector('#left').style.height = '630px';
  document.querySelector('#left h1').innerHTML = 'A little green.<br>A little greed.';
  document.querySelector('#left h1').style.fontSize = '100px';
  document.querySelector('#left p').textContent = 'A mischievous holiday visitor for your website.';
  document.querySelector('#left article').style.left = '700px';
  document.querySelector('#left article').style.top = '420px';
  document.querySelector('#left article').textContent = 'GRINCH BY FLURI · INTERACTIVE PREVIEW';
  document.querySelector('#left article').style.fontSize = '23px';
  window.previewLeft.destroy();
  window.previewLeft = window.createGrinch({
    root: document.querySelector('#left'),
    territory: 'root',
    size: 1.8,
    entrance: 'appear',
    autoSteal: false,
    fearRadius: 0,
  });
});
await page.waitForTimeout(100);
await page.screenshot({ path: 'demo/public/social.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:5196/');
await page.waitForFunction(() => !!window.grinch);
await page.waitForFunction(() => window.grinch.getState().phase !== 'arriving');
await page.evaluate(() => window.grinch.pause());
await page.screenshot({ path: 'assets/readme/mobile.png', fullPage: true });
await browser.close();
console.log('Captured real package previews.');
