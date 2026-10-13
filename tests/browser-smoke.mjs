import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:8765';
const LIVE_ID = 'aAaAaAaAaAa';
const VIDEO_ID = 'BbBbBbBbBbB';
const feed = {
  live: { id: LIVE_ID, title: 'ASTREA Test Transmission' },
  videos: [
    { id: VIDEO_ID, title: 'ICARUS Engineering Log', duration: 155, thumbnail: '/assets/thumbnails/' + VIDEO_ID + '.jpg' }
  ]
};

const browser = await chromium.launch({ headless: true });
let checks = 0;
try {
  for (const locale of ['de-DE','en-US']) {
    for (const width of [375,768,1366]) {
      const context = await browser.newContext({ locale, viewport: { width, height: 850 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      const youtubeRequests = [];
      page.on('pageerror', err => errors.push(err.message));
      page.on('request', request => {
        if (request.url().includes('youtube-nocookie.com') || request.url().includes('i.ytimg.com')) {
          youtubeRequests.push(request.url());
        }
      });
      await page.route('**/data/videos.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feed) }));
      await page.route('**/assets/thumbnails/' + VIDEO_ID + '.jpg', route => route.fulfill({
        status: 404, contentType: 'text/plain', body: 'No thumbnail in test fixture'
      }));
      await page.route('https://www.youtube-nocookie.com/**', route => route.abort());
      const response = await page.goto(ORIGIN + '/index.html', { waitUntil:'domcontentloaded' });
      assert(response?.ok());
      await page.locator('.video-card').first().waitFor();
      assert.equal(await page.locator('#live-frame').getAttribute('src'), null);
      assert.equal(await page.locator('#modal-iframe').getAttribute('src'), null);
      assert.equal(youtubeRequests.length, 0, 'YouTube loaded without visitor action');

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 2, `${locale} ${width}: ${overflow}px horizontal overflow`);
      await page.locator('.video-card').click();
      assert.equal(await page.locator('#player-modal').isVisible(), true);
      assert.equal(await page.locator('#modal-iframe').getAttribute('src'), null);
      assert.equal(youtubeRequests.length, 0, 'YouTube loaded just by opening the modal');
      await page.locator('#player-consent-button').click();
      assert.match(await page.locator('#modal-iframe').getAttribute('src'), /youtube-nocookie[.]com\/embed\//);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#player-modal').isVisible(), false);
      assert.equal(await page.locator('#modal-iframe').getAttribute('src'), null);
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('video-card')), true);
      await page.locator('.video-card').click();
      assert.equal(await page.locator('#modal-iframe').getAttribute('src'), null, 'Player must ask again when reopened');
      await page.locator('.modal-close').click();

      assert.equal(await page.locator('#live-frame').getAttribute('src'), null);
      await page.locator('#live-consent').click();
      assert.match(await page.locator('#live-frame').getAttribute('src'), /youtube-nocookie[.]com\/embed\//);
      assert.deepEqual(errors, [], `${locale} ${width}: browser script exceptions`);
      checks += 1;
      await context.close();
    }
  }

  const context = await browser.newContext({ locale: 'de-DE', viewport:{ width:1200, height:850 }});
  const page = await context.newPage();
  await page.route('**/data/videos.json', route => route.fulfill({ json:feed }));
  await page.goto(ORIGIN + '/index.html');
  assert.equal(await page.locator('html').getAttribute('lang'), 'de');
  await page.getByRole('button',{name:'English'}).click();
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.match(await page.locator('[data-i18n="hero_title"]').innerText(), /Watch the build/);
  await page.goto(ORIGIN + '/404.html');
  assert.match(await page.locator('[data-404="title"]').innerText(), /Hello stranger/);
  await context.close();
  console.log(`PASS: ${checks} player consent/mobile renders + languages + 404`);
} finally {
  await browser.close();
}
