// Public-site visual smoke checks. Requires Playwright and its Chromium/WebKit browsers.
// Run: PUBLIC_BASE_URL=https://bqlohakuto.github.io/saigononazo/ node tests/public-opening.browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');

const site = process.env.PUBLIC_BASE_URL || 'https://bqlohakuto.github.io/saigononazo/';
const out = process.env.UI_SCREENSHOT_DIR || path.join(process.cwd(), 'artifacts', 'public-opening');
const cases = [
  { name: 'desktop-chromium', engine: chromium, viewport: { width: 1366, height: 768 }, mobile: false },
  { name: 'landscape-webkit', engine: webkit, viewport: { width: 852, height: 393 }, mobile: true }
];

function within(inner, outer, tolerance = 2) {
  return !!inner && !!outer && inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance;
}

async function runCase(spec) {
  const browser = await spec.engine.launch({ headless: true });
  const context = await browser.newContext({
    viewport: spec.viewport, isMobile: spec.mobile, hasTouch: spec.mobile,
    deviceScaleFactor: spec.mobile ? 2 : 1,
    reducedMotion: 'reduce'
  });
  await context.addInitScript(() => {
    localStorage.setItem('saigononazo-help-seen', '1');
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(12000);

  async function shot(label) {
    const folder = path.join(out, spec.name);
    fs.mkdirSync(folder, { recursive: true });
    await page.screenshot({ path: path.join(folder, label + '.png') });
  }
  async function advanceTo(id) {
    const result = await page.evaluate(target => {
      const targetIndex = openingScenario.findIndex(line => line.logId === target);
      if (targetIndex < 0) throw new Error('Unknown opening LOG ID: ' + target);
      for (let i = 0; i < 300 && currentScene === 'opening' && openingIndex < targetIndex; i++) {
        Dialogue.advance();
      }
      return { index: openingIndex, targetIndex, phase: document.querySelector('.opening')?.dataset.phase };
    }, id);
    assert(result.index >= result.targetIndex, JSON.stringify(result));
  }
  async function getState() {
    return page.locator('.opening').evaluate(el => ({
      phase: el.dataset.phase,
      eyeOpening: el.dataset.eyeOpening,
      view: el.dataset.view,
      hanaVisible: el.dataset.hanaVisible
    }));
  }

  try {
    const response = await page.goto(site, { waitUntil: 'load', timeout: 60000 });
    assert.equal(response.status(), 200, 'The public URL must load');
    const expectedVersion = '20261012-fine-opening-art-01';
    const stylesheet = await page.locator('link[href*="design-ui.css"]').getAttribute('href');
    assert(stylesheet.includes(expectedVersion), 'Deployed CSS cache version is older than main: ' + stylesheet);
    await page.locator('#startButton').waitFor();
    await shot('00-title');
    await page.evaluate(() => { settings.instantText = true; settings.volume = 0; });
    await page.locator('#startButton').click();
    await page.locator('#playerName').fill('表示確認');
    await page.locator('#decideButton').click();
    assert.equal((await getState()).phase, 'red');
    await shot('01-red');

    await advanceTo('opening_04');
    assert.equal((await getState()).phase, 'black');
    await shot('02-dark');

    await advanceTo('opening_05');
    assert.equal((await getState()).eyeOpening, 'true');
    const eyelid = await page.locator('.pixel-opening-world').evaluate(el =>
      getComputedStyle(el, '::before').content);
    assert.notEqual(eyelid, 'none', 'Eyelid mask must be rendered');
    await shot('03-eyelids');

    await advanceTo('opening_07');
    assert.equal((await getState()).phase, 'room');
    const asset = await page.evaluate(async () => {
      const el = document.querySelector('.pixel-opening-background');
      const css = getComputedStyle(el).backgroundImage;
      const url = css.match(/url\\(["']?(.*?)["']?\\)/)?.[1];
      if (!url) return { css, ok: false };
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return { css, url, status: response.status, ok: false };
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return { css, url, ok: response.ok, type: response.headers.get('content-type'), ...dimensions };
    });
    assert(asset.url?.includes('white-room-fine.png'), 'Old white-room background is still referenced: ' + JSON.stringify(asset));
    assert(asset.ok && asset.type?.includes('image/png') && asset.width > 0 && asset.height > 0,
      'Fine opening PNG did not download/decode: ' + JSON.stringify(asset));
    await shot('04-white-room');

    await advanceTo('opening_14');
    assert.equal((await getState()).hanaVisible, 'true');
    assert(await page.locator('#character-area').isVisible(), 'Hana should appear at opening_14');
    const hana = await page.locator('#openingHanaSprite').evaluate(async img => {
      await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight, src: img.currentSrc };
    });
    assert(hana.width > 0 && hana.height > 0, 'Hana image did not decode');
    await shot('05-hana');

    await advanceTo('opening_31');
    assert.equal((await getState()).view, 'door');
    assert(await page.locator('.pixel-opening-door').evaluate(el => el.classList.contains('visible')));
    assert(!(await page.locator('.pixel-opening-door').evaluate(el => el.classList.contains('open'))));
    await shot('06-door-closed');

    await advanceTo('opening_39');
    assert(await page.locator('.pixel-opening-door').evaluate(el => el.classList.contains('open')),
      'Door did not enter opening state');
    await shot('07-door-open');

    await advanceTo('opening_41');
    assert(await page.locator('.pixel-opening-whiteout').evaluate(el => el.classList.contains('visible')),
      'Whiteout should appear at opening_41');
    await shot('08-whiteout');

    await page.evaluate(() => {
      for (let i = 0; i < 300 && currentScene === 'opening'; i++) Dialogue.advance();
    });
    await page.locator('.first-room').waitFor({ state: 'visible', timeout: 15000 });
    assert(await page.locator('.first-room-entry-fade').count() === 1,
      'First room must enter through white fade');
    await shot('09-room01-transition');
    await page.locator('.first-room-entry-fade').waitFor({ state: 'detached', timeout: 8000 });
    const background = await page.locator('#roomBackground').evaluate(async img => {
      await img.decode();
      return { src: img.getAttribute('src'), width: img.naturalWidth };
    });
    assert(background.src.includes('room01_front_fine.png') && background.width > 0,
      'First room fine art did not load: ' + JSON.stringify(background));
    await shot('10-room01');

    const layout = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector)?.getBoundingClientRect()?.toJSON();
      return {
        game: rect('#game'), viewport: { x: 0, y: 0, width: innerWidth, height: innerHeight },
        scene: rect('.room-stage'), hud: rect('.gameplay-hud'),
        left: rect('.room-navigation button:first-child'),
        right: rect('.room-navigation button:last-child'),
        portraitOverlayVisible: !!document.querySelector('.design-orientation') &&
          getComputedStyle(document.querySelector('.design-orientation')).display !== 'none'
      };
    });
    assert(within(layout.game, layout.viewport), 'Game canvas spills outside viewport: ' + JSON.stringify(layout));
    assert(within(layout.scene, layout.game), 'First-room stage spills outside game: ' + JSON.stringify(layout));
    if (spec.mobile) assert(!layout.portraitOverlayVisible, 'Landscape phone is mistakenly locked as portrait');
    assert.deepEqual(errors, [], 'JavaScript page errors');
    console.log(JSON.stringify({ case: spec.name, result: 'PASS', asset, background, layout }));
  } catch (error) {
    await shot('failure').catch(() => {});
    console.error(JSON.stringify({ case: spec.name, result: 'FAIL', pageErrors: errors }));
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

(async () => {
  for (const spec of cases) await runCase(spec);
  console.log('PASS public opening: desktop Chromium + landscape WebKit');
})().catch(error => { console.error(error); process.exitCode = 1; });
