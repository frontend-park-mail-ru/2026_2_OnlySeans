const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { setImmediate: flush } = require('node:timers/promises');

test('runtime polling applies only validated settings for the current account', async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'frame-onlineconf-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--target', 'ES2022',
    '--module', 'commonjs', '--skipLibCheck', '--outDir', dir, 'src/services/onlineconf.ts']);

  t.mock.timers.enable({ apis: ['setInterval'] });
  global.document = Object.assign(new EventTarget(), { hidden: false });
  global.window = Object.assign(new EventTarget(), {
    location: { origin: 'https://onlyseans.test' }, setInterval, clearInterval, setTimeout, clearTimeout,
  });
  const requests = [];
  global.fetch = (url, options) => {
    assert.equal(url.pathname, '/api/onlineconf/runtime');
    assert.equal(options.credentials, 'include');
    assert.equal(options.cache, 'no-store');
    return new Promise((resolve, reject) => requests.push({ resolve, reject, signal: options.signal }));
  };
  function reply(index, flag, max = 500, revision = 1, theme = null) {
    requests[index].resolve(Response.json({
      revision, configs: { 'reviews.max_length': max, 'frontend.watch_button_theme': theme },
      flags: { 'reviews.write_enabled': flag, 'frontend.watch_button_theme_enabled': theme !== null },
    }));
    return flush();
  }

  const { store } = require(path.join(dir, 'core/store.js'));
  const { startOnlineConf, refreshOnlineConf, handleReviewRejection } = require(path.join(dir, 'services/onlineconf.js'));
  const { ApiError } = require(path.join(dir, 'api/http.js'));
  const { isValidReviewTitle } = require(path.join(dir, 'api/reviews.js'));
  assert.equal(isValidReviewTitle(' 🎬а '), false);
  assert.equal(isValidReviewTitle(' 🎬аб '), true);
  assert.equal(isValidReviewTitle('🎬'.repeat(255)), true);
  assert.equal(isValidReviewTitle('🎬'.repeat(256)), false);
  const settings = () => store.get('onlineconf');
  store.set({ user: { id: 1 } });
  const stop = startOnlineConf();
  t.after(stop);
  assert.equal(startOnlineConf(), stop);
  window.dispatchEvent(new Event('online'));
  assert.equal(requests.length, 1);
  await reply(0, true);
  assert.equal(settings().writeEnabled, true);
  assert.equal(settings().maxLength, 500);

  t.mock.timers.tick(14_999);
  assert.equal(requests.length, 1);
  t.mock.timers.tick(1);
  assert.equal(requests.length, 2);
  store.set({ user: { id: 2 } });
  assert.equal(requests[1].signal.aborted, true);
  assert.equal(settings().writeEnabled, false);
  await reply(2, false, 200);
  await reply(1, true, 1000, 2);
  assert.equal(settings().userId, 2);
  assert.equal(settings().revision, 1);
  assert.equal(settings().maxLength, 200);

  window.dispatchEvent(new Event('online'));
  requests[3].reject(new TypeError('Offline'));
  await flush();
  assert.equal(settings().status, 'stale');
  assert.equal(settings().maxLength, 200);
  document.hidden = true;
  t.mock.timers.tick(15_000);
  assert.equal(requests.length, 4);
  document.hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  await reply(4, 'false');
  assert.equal(settings().status, 'fallback');
  assert.equal(settings().writeEnabled, false);

  // A rejected write needs a snapshot fetched after the rejection, even during a poll.
  t.mock.timers.tick(15_000);
  const refresh = refreshOnlineConf();
  assert.equal(requests.length, 7);
  assert.equal(requests[5].signal.aborted, true);
  await reply(6, false, 200, 3);
  await refresh;
  await reply(5, true, 500, 2);
  assert.equal(settings().revision, 3);
  assert.equal(settings().writeEnabled, false);

  // An invalid response must not let a lagging replica restore an older permission.
  window.dispatchEvent(new Event('online'));
  await reply(7, 'false', 200, 4);
  assert.equal(settings().status, 'fallback');
  window.dispatchEvent(new Event('online'));
  await reply(8, true, 500, 2);
  assert.equal(settings().writeEnabled, false);
  window.dispatchEvent(new Event('online'));
  await reply(9, false, 200, 3);
  assert.equal(settings().status, 'ready');
  store.set({ user: { id: 3 } });
  await reply(10, true, 500, 1);
  assert.equal(settings().writeEnabled, true);

  const poll = async (flag, max, revision, theme = null) => {
    const count = requests.length;
    t.mock.timers.tick(15_000);
    assert.equal(requests.length, count + 1);
    await reply(count, flag, max, revision, theme);
  };
  await poll(true, 500, 8, 'wine');
  assert.equal(settings().watchButtonTheme, 'wine');
  await poll(false, 20000, 0);
  assert.equal(settings().writeEnabled, false);
  assert.equal(settings().status, 'fallback');
  assert.equal(settings().watchButtonTheme, null);
  await poll(true, 500, 7);
  assert.equal(settings().writeEnabled, false);
  await poll(true, 500, 8, 'amber');
  assert.equal(settings().writeEnabled, true);
  assert.equal(settings().watchButtonTheme, 'amber');

  const denied = new ApiError(403, 'disabled', 'feature_disabled');
  handleReviewRejection(denied, 3);
  assert.equal(settings().writeEnabled, false);
  requests.at(-1).reject(new TypeError('offline'));
  await flush();
  await poll(true, 500, 8);
  assert.equal(settings().writeEnabled, false);
  await poll(true, 500, 9);
  assert.equal(settings().writeEnabled, true);

  const tooLong = new ApiError(400, 'too long', 'review_too_long', { max_length: 100, revision: 10 });
  handleReviewRejection(tooLong, 3);
  assert.equal(settings().maxLength, 100);
  await reply(requests.length - 1, true, 500, 9);
  assert.equal(settings().maxLength, 100);
  await poll(true, 500, 11);
  assert.equal(settings().maxLength, 500);
  store.set({ user: { id: 4 } });
  await reply(requests.length - 1, true, 500, 1);
  const beforeStop = requests.length;
  handleReviewRejection(denied, 3);
  assert.equal(settings().writeEnabled, true);
  assert.equal(requests.length, beforeStop);
  stop();
  t.mock.timers.tick(30_000);
  window.dispatchEvent(new Event('online'));
  assert.equal(requests.length, beforeStop);
});
