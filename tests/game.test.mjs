// Headless browser tests for index.html.
// Run with: npm test   (needs Playwright's Chromium: npx playwright install chromium)
//
// The tests drive the game through window.__pandavas, the debug hook at the
// bottom of index.html. They move the player straight to each objective
// instead of steering by hand, so they check that the mission scripts,
// checkpoints and revive logic work end to end, not how hard the game is.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAME_URL = pathToFileURL(path.join(ROOT, 'index.html')).href;
// The game loads three.js r128 from cdnjs for the 3D moments. Serve the copy from
// node_modules instead so the tests don't depend on the network and the 3D code runs.
const THREE_JS = path.join(ROOT, 'node_modules', 'three', 'build', 'three.min.js');
const HAVE_THREE = existsSync(THREE_JS);

let browser;
before(async () => {
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});
after(async () => { await browser?.close(); });

// Opens the game in a landscape phone-sized page and collects any page errors.
async function openGame({ touch = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: touch, isMobile: touch });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // A failed three.js download is fine: the game skips the 3D moments without it.
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  if (HAVE_THREE) await page.route('**/three.min.js', (route) => route.fulfill({ path: THREE_JS, contentType: 'text/javascript' }));
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__pandavas);
  // Small helpers that run inside the page.
  await page.evaluate(() => {
    const H = window.__pandavas;
    // Clicks through any dialog or 3D cut-scene until the game is back in play (or finished).
    H.settle = () => { for (let i = 0; i < 200; i++) { const s = H.G.state; if (s === 'cine' || s === 'dialog') H.advance(); else return s; } return H.G.state; };
    H.run = (frames) => { for (let i = 0; i < frames; i++) { H.step(1); if (H.G.state !== 'play') H.settle(); if (H.G.state === 'done' || H.G.state === 'fail') break; } return H.G.state; };
    H.interact = (label) => { const w = H.world(); const it = w.interacts.find((x) => x.label === label && (!x.on || x.on())); if (!it) throw new Error('no interaction ' + label); w.player.x = it.x; w.player.y = it.y; it.fn(); return H.settle(); };
  });
  return { page, errors, close: () => context.close() };
}

const gameErrors = (page) => page.evaluate(() => ({ count: window.__pandavas.G.errors || 0, last: window.__pandavas.G.lastError || null }));

async function assertClean(page, errors) {
  const g = await gameErrors(page);
  assert.equal(g.count, 0, 'game loop threw: ' + g.last);
  assert.deepEqual(errors, [], 'page errors');
}

test('3D story moments play and hand control back', { skip: !HAVE_THREE && 'three.js not installed (npm install)' }, async () => {
  const { page, errors, close } = await openGame();
  const r = await page.evaluate(async () => {
    const H = window.__pandavas;
    H.start(0, 0); H.settle();
    const w = H.world();
    for (const name of ['BHEEMAN', 'KUTTAN', 'TINTU']) H.interact('WAKE ' + name);
    // Waking the last kid triggers the 'FIVE KIDS. ONE PLAN.' cut-scene after the dialog.
    const it = w.interacts.find((x) => x.label === 'WAKE SHIBU'); w.player.x = it.x; w.player.y = it.y; it.fn();
    while (H.G.state === 'dialog') H.advance();
    const sawCine = H.G.state === 'cine' && !!H.cine();
    const title = document.getElementById('ctitle').textContent;
    // Let it run on its own; it lasts 3.4 seconds.
    await new Promise((res) => { const t0 = performance.now(); (function wait() { if (H.G.state !== 'cine' || performance.now() - t0 > 8000) res(); else requestAnimationFrame(wait); })(); });
    return { sawCine, title, after: H.G.state };
  });
  assert.ok(r.sawCine, 'no 3D cut-scene started');
  assert.equal(r.title, 'FIVE KIDS. ONE PLAN.');
  assert.notEqual(r.after, 'cine', 'cut-scene never ended');
  await assertClean(page, errors);
  await close();
});

test('menu loads with both missions', async () => {
  const { page, errors, close } = await openGame();
  assert.equal(await page.evaluate(() => window.__pandavas.G.state), 'menu');
  for (const id of ['#m1', '#m2']) assert.ok(await page.isVisible(id), id + ' visible');
  await assertClean(page, errors);
  await close();
});

test('mission 1 plays from start to finish', async () => {
  const { page, errors, close } = await openGame();
  const result = await page.evaluate(() => {
    const H = window.__pandavas, T = H.T, log = [];
    H.start(0, 0); H.settle();
    let w = H.world();
    for (const name of ['BHEEMAN', 'KUTTAN', 'TINTU', 'SHIBU']) H.interact('WAKE ' + name);
    log.push('woken ' + w.woken + ' stage ' + w.stage);
    // Keep the patrols out of the way so the scripted route isn't spotted.
    for (const g of w.guards) if (g !== w.gateGuard) { g.down = true; g.hp = 0; }
    H.interact('OPEN LOCKER');
    log.push('gun ' + w.player.gun + ' stage ' + w.stage);
    w.gateGuard.down = true; w.gateGuard.hp = 0;
    H.run(5);
    log.push('gate ' + w.gateOpen + ' stage ' + w.stage);
    for (const g of w.guards) { g.down = true; g.hp = 0; }
    w.player.x = 66 * T; w.player.y = 45.5 * T;
    H.run(5);
    log.push('train moving ' + w.train.moving + ' stage ' + w.stage);
    for (let i = 0; i < 600 && H.G.state !== 'done' && H.G.state !== 'fail'; i++) {
      w = H.world(); const d = w.trainDoor(); w.player.x = d.x; w.player.y = d.y; H.run(1);
    }
    return { state: H.G.state, log };
  });
  assert.equal(result.state, 'done', result.log.join('\n'));
  await assertClean(page, errors);
  await close();
});

test('mission 2 plays from start to finish', async () => {
  const { page, errors, close } = await openGame();
  const result = await page.evaluate(() => {
    const H = window.__pandavas, T = H.T, log = [];
    H.start(1, 0); H.settle();
    let w = H.world(); const p = w.player;
    const putCar = (x, y) => { p.car.x = x; p.car.y = y; p.car.speed = 0; p.x = x; p.y = y; };
    // Steal the parked car next to the start.
    const car = w.cars.find((c) => Math.abs(c.x - 16.3 * T) < 4 && Math.abs(c.y - 29.5 * T) < 4);
    p.x = car.x - 20; p.y = car.y; H.input.actQ = true; H.run(3);
    if (!p.car) throw new Error('could not enter car');
    log.push('stage after car ' + w.stage);
    putCar(21 * T, 72.5 * T); H.run(5);
    log.push('stage after godown ' + w.stage + ' allies ' + w.allies.length);
    putCar(84.5 * T, 24 * T); H.run(5);
    log.push('stage after bungalow ' + w.stage);
    H.input.actQ = true; H.run(3);
    if (p.car) throw new Error('could not leave car');
    for (const g of w.goons) { g.down = true; g.hp = 0; }
    p.x = w.meera.x + 20; p.y = w.meera.y; H.run(5);
    log.push('stage after meera ' + w.stage);
    for (const g of w.study) { g.down = true; g.hp = 0; }
    w.mission.bossDown(w, w.kamath); H.settle();
    log.push('stage after kamath ' + w.stage);
    const c2 = w.cars.find((c) => !c.wreck && c.kind !== 'police' && !c.driver);
    p.x = c2.x - 20; p.y = c2.y; c2.speed = 0; H.input.actQ = true; H.run(3);
    if (!p.car) throw new Error('could not get escape car');
    for (let i = 0; i < 10 && H.G.state !== 'done'; i++) { putCar(55 * T, 83.5 * T); H.run(5); }
    log.push('stage at beach ' + w.stage);
    return { state: H.G.state, log };
  });
  assert.equal(result.state, 'done', result.log.join('\n'));
  await assertClean(page, errors);
  await close();
});

for (const [mi, cps] of [[0, [0, 1, 2, 3, 4]], [1, [0, 1, 2, 3]]]) {
  for (const cp of cps) {
    test(`mission ${mi + 1} checkpoint ${cp} loads and runs`, async () => {
      const { page, errors, close } = await openGame();
      const state = await page.evaluate(([mi, cp]) => {
        const H = window.__pandavas; H.start(mi, cp); H.settle(); H.run(180); return H.G.state;
      }, [mi, cp]);
      assert.notEqual(state, 'menu');
      await assertClean(page, errors);
      await close();
    });
  }
}

test('gang members get downed teammates back up', async () => {
  const { page, errors, close } = await openGame();
  const r = await page.evaluate(() => {
    const H = window.__pandavas; H.start(1, 2); H.settle();
    const w = H.world();
    for (const g of w.goons) { g.down = true; g.hp = 0; }
    const a = w.allies.find((x) => x.name === 'Kuttan');
    a.hp = 0; a.down = true; a.bleed = 35; a.helping = null; a.moving = false;
    for (let i = 0; i < 60 * 15 && a.down; i++) H.run(1);
    return { down: a.down, state: H.G.state };
  });
  assert.equal(r.down, false, 'Kuttan was not revived (state ' + r.state + ')');
  await assertClean(page, errors);
  await close();
});

test('the gang picks Sony up when he goes down', async () => {
  const { page, errors, close } = await openGame();
  const r = await page.evaluate(() => {
    const H = window.__pandavas; H.start(1, 2); H.settle();
    const w = H.world(), p = w.player;
    for (const g of w.goons) { g.down = true; g.hp = 0; }
    p.hp = 0; p.down = true; p.bleed = 22; p.moving = false; p.reviving = null;
    for (let i = 0; i < 60 * 15 && p.down; i++) H.run(1);
    return { down: p.down, state: H.G.state };
  });
  assert.equal(r.down, false, 'Sony was not revived (state ' + r.state + ')');
  await assertClean(page, errors);
  await close();
});

test('traffic stays on the road', async () => {
  const { page, errors, close } = await openGame();
  const r = await page.evaluate(() => {
    const H = window.__pandavas; H.start(1, 0); H.settle(); H.run(60 * 20);
    const w = H.world(), T = H.T, TL = H.TL;
    const road = new Set([TL.ROAD]);
    const off = w.cars.filter((c) => c.driver === 'ai' && !road.has(w.map.get(Math.floor(c.x / T), Math.floor(c.y / T))));
    return { total: w.cars.filter((c) => c.driver === 'ai').length, off: off.length };
  });
  assert.ok(r.total > 0, 'no AI traffic spawned');
  assert.ok(r.off <= Math.ceil(r.total * 0.1), `${r.off} of ${r.total} AI cars off the road`);
  await assertClean(page, errors);
  await close();
});

test('touch controls show during play on a phone', async () => {
  const { page, errors, close } = await openGame({ touch: true });
  await page.tap('#m1');
  await page.evaluate(() => window.__pandavas.settle());
  assert.ok(await page.isVisible('#touch'), 'touch controls hidden');
  await assertClean(page, errors);
  await close();
});
