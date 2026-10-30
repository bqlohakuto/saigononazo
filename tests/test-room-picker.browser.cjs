// Regression test for the title screen's eight-room test picker, including iOS-like landscape WebKit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');

const site = process.env.PUBLIC_BASE_URL || 'https://bqlohakuto.github.io/saigononazo/';
const out = process.env.UI_SCREENSHOT_DIR || 'artifacts/test-room-picker';
const expected = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')
  .match(/style[.]css[?]v=([^"']+)/)?.[1];
assert(expected, 'Expected stylesheet cache version in index.html');

const cases = [
  {name: 'desktop-chromium', browser: chromium, viewport: {width: 1366, height: 768}, mobile: false},
  {name: 'iphone-landscape-webkit', browser: webkit, viewport: {width: 852, height: 393}, mobile: true},
  {name: 'small-landscape-webkit', browser: webkit, viewport: {width: 667, height: 375}, mobile: true},
  {name: 'very-short-landscape-webkit', browser: webkit, viewport: {width: 640, height: 240}, mobile: true}
];

function inside(a, b, tolerance = 3) {
  return a && b && a.x >= b.x - tolerance && a.y >= b.y - tolerance &&
    a.right <= b.right + tolerance && a.bottom <= b.bottom + tolerance;
}

(async () => {
  for (const spec of cases) {
    const browser = await spec.browser.launch({headless: true});
    try {
      const context = await browser.newContext({
        viewport: spec.viewport, isMobile: spec.mobile, hasTouch: spec.mobile,
        deviceScaleFactor: spec.mobile ? 2 : 1
      });
      await context.addInitScript(() => { localStorage.setItem('saigononazo-help-seen', '1'); localStorage.setItem('saigononazo-first-visit-notice-v1', 'accepted'); });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const response = await page.goto(site + '?preview=1&test_picker_ci=' + Date.now(), {waitUntil: 'load', timeout: 60000});
      assert.equal(response.status(), 200, spec.name + ': published game not available');
      const cssUrl = await page.locator('link[href*="style.css"]').first().getAttribute('href');
      assert(cssUrl.includes(expected), spec.name + ': stale published stylesheet ' + cssUrl);
      // The 240px synthetic case validates the dialog itself, independently of title-menu layout.
      if (spec.viewport.height < 300) await page.evaluate(() => showTestRoomPicker());
      else await page.locator('#testRoomButton').click();

      const opts = page.locator('.test-room-options');
      const buttons = opts.locator('button[data-room]');
      assert.equal(await buttons.count(), 8, spec.name + ': all eight rooms must be in the picker');
      const initial = await page.evaluate(() => {
        const r = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
        const el = document.querySelector('.test-room-options');
        return {
          overlay: r('.test-room-overlay'), panel: r('.test-room-panel'),
          close: r('.test-room-panel .device-close'), options: r('.test-room-options'),
          columns: getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length,
          overflowY: getComputedStyle(el).overflowY, touchAction: getComputedStyle(el).touchAction,
          clientHeight: el.clientHeight, scrollHeight: el.scrollHeight
        };
      });
      assert(inside(initial.panel, initial.overlay), spec.name + ': dialog extends outside the game viewport: ' + JSON.stringify(initial));
      assert(inside(initial.close, initial.panel), spec.name + ': close button must remain visible');
      assert.equal(initial.overflowY, 'auto', spec.name + ': options should be scrollable');
      assert.equal(initial.touchAction, 'pan-y', spec.name + ': touch scrolling must be enabled');
      assert.equal(initial.columns, 2, spec.name + ': fixed 16:9 canvas must keep two columns regardless of device');
      // A compact viewport may legitimately fit all eight options after 16:9 scaling.
      // Reachability is verified below by scrolling the last room into view and
      // checking that its bounding box is inside the options list.
      const folder = path.join(out, spec.name);
      fs.mkdirSync(folder, {recursive: true});
      await page.screenshot({path: path.join(folder, '01-picker.png')});
      const last = page.locator('.test-room-options [data-room="room08"]');
      await last.scrollIntoViewIfNeeded();
      const after = await page.evaluate(() => {
        const a = document.querySelector('.test-room-options [data-room="room08"]').getBoundingClientRect();
        const b = document.querySelector('.test-room-options').getBoundingClientRect();
        return {last: a.toJSON(), list: b.toJSON()};
      });
      assert(inside(after.last, after.list), spec.name + ': eighth room is not reachable by scrolling: ' + JSON.stringify(after));
      await page.screenshot({path: path.join(folder, '02-eighth-visible.png')});
      await last.click();
      await page.waitForFunction(() => currentScene === 'room08');
      assert.equal(await page.locator('.test-room-overlay').count(), 0, 'Picker should close after a selection');
      assert.deepEqual(errors, [], spec.name + ': page errors');
      await context.close();
      console.log(spec.name + ': 8 rooms, close button, scrolling, and room 8 launch OK');
    } finally {
      await browser.close();
    }
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
