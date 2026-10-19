// Review the recollection directly; no manual puzzle playthrough is needed.
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = process.env.UI_SCREENSHOT_DIR || path.join(root, 'artifacts/memory-novel');
const specs = [
  { name: 'desktop', engine: chromium, width: 1366, height: 768 },
  { name: 'phone', engine: webkit, width: 852, height: 393, touch: true }
];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  for (const spec of specs) {
    const browser = await spec.engine.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width: spec.width, height: spec.height },
        isMobile: !!spec.touch, hasTouch: !!spec.touch
      });
      await context.addInitScript(() => {
        localStorage.setItem('saigononazo-help-seen', '1');
        localStorage.setItem('saigononazo-settings-v1', JSON.stringify({ instantText: true, volume: 0 }));
      });
      const page = await context.newPage();
      const errors = [], missing = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
      const base = process.env.PUBLIC_BASE_URL || 'https://memory.local/';
      if (!process.env.PUBLIC_BASE_URL) await page.route('https://memory.local/**', async route => {
        const file = path.resolve(root, decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//, '') || 'index.html');
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
        await route.fulfill({ path: file });
      });
      await page.goto(base, { waitUntil: 'load' });
      await page.locator('#testRoomButton').click();
      await page.locator('[data-room="room02"]').click();
      await page.evaluate(() => {
        // Finish the room introduction before starting its recollection.
        for (let i = 0; i < 100 && document.querySelector('#roomNextButton'); i++) Dialogue.advance();
        completeRoom2();
      });

      async function advanceTo(id) {
        const result = await page.evaluate(id => {
          const matches = () => { const last = GameLog.list().at(-1)?.id; return last === id || last?.startsWith(id + '_'); };
          for (let i = 0; i < 500 && !matches() && document.querySelector('#roomNextButton'); i++) Dialogue.advance();
          return { matches: matches(), last: GameLog.list().at(-1)?.id };
        }, id);
        assert.ok(result.matches, JSON.stringify(result));
      }
      async function inspect(id, girl, shot) {
        await advanceTo(id);
        const highSchool = id === 'room2_final_hanamaru' || Number(id.match(/memory_(\d+)/)?.[1]) >= 15;
        assert.equal(await page.locator('.memory-background').getAttribute('src'), highSchool ? 'images/background/memories/room02/high-school-music-room.png' : 'images/background/memories/room01/music-room.png');
        await page.locator('.memory-background').evaluate(im => im.decode());
        assert.equal(await page.locator('.memory-girl:visible').count(), girl ? 1 : 0, id);
        if (girl) {
          assert.equal(await page.locator('.memory-girl').getAttribute('src'), 'images/characters/memories/room02/girl-blazer.png');
          await page.locator('.memory-girl').evaluate(im => im.decode());
        }
        assert.equal(await page.locator('.hana-portrait:visible').count(), 0);
        if (shot) await page.screenshot({ path: path.join(out, `memory02-${spec.name}-${shot}.png`) });
      }
      await inspect('room2_memory_001', false, 'background');
      await inspect('room2_memory_004', true, 'blazer');
      await inspect('room2_memory_012', false);
      await inspect('room2_memory_014', false);
      await inspect('room2_memory_015', false, 'high-school-background');
      await inspect('room2_memory_018', false);
      await inspect('room2_memory_021', true);
      await inspect('room2_memory_053_flower_01', true, 'hanamaru');
      await page.getByRole('button', { name: '非表示', exact: true }).click();
      assert.equal(await page.locator('.memory-girl:visible').count(), 1);
      await page.screenshot({ path: path.join(out, `memory02-${spec.name}-without-dialogue.png`) });
      await page.locator('.dialogue-restore').click({ position: { x: 100, y: 100 } });
      await inspect('room2_final_hanamaru', false, 'thought');
      await inspect('room2_memory_096', false);
      await page.evaluate(() => {
        for (let i = 0; i < 500 && document.querySelector('#roomNextButton'); i++) Dialogue.advance();
      });
      assert.equal(await page.locator('.memory-scene').count(), 0);
      assert.equal(await page.locator('#game').getAttribute('data-memory-stage'), null);
      assert.equal(await page.evaluate(() => room2State.unlocked), true);
      assert.deepEqual(errors, [], spec.name + ' runtime errors');
      assert.deepEqual(missing, [], spec.name + ' missing assets');
      console.log('PASS ' + spec.name + ': Room 2 background, blazer, dialogue-only sprite, flower line, hide/restore and return');
    } finally {
      await browser.close();
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
