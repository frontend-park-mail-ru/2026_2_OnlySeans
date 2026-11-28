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
  function reply(index, flag, max = 500, revision = 1, blocks = [], blocksEnabled = true, snapshotReady) {
    requests[index].resolve(Response.json({
      revision, snapshot_ready: snapshotReady, configs: { 'reviews.max_length': max, 'frontend.home_blocks': blocks },
      flags: { 'reviews.write_enabled': flag, 'frontend.home_blocks_enabled': blocksEnabled },
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

  const poll = async (flag, max, revision, blocks = [], blocksEnabled = true, snapshotReady) => {
    const count = requests.length;
    t.mock.timers.tick(15_000);
    assert.equal(requests.length, count + 1);
    await reply(count, flag, max, revision, blocks, blocksEnabled, snapshotReady);
  };
  const blocks = [{ type: 'banner', title: 'Сегодня в кино', text: 'Выбор редакции' }, { type: 'collection', id: 3 }];
  await poll(true, 500, 6, blocks, false);
  assert.deepEqual(settings().homeBlocks, []);
  await poll(true, 500, 7, [{ type: 'unknown' }]);
  assert.deepEqual(settings().homeBlocks, []);
  assert.equal(settings().writeEnabled, true);
  await poll(true, 500, 8, blocks);
  assert.deepEqual(settings().homeBlocks, blocks);
  await poll(false, 20000, 0);
  assert.equal(settings().writeEnabled, false);
  assert.equal(settings().status, 'fallback');
  assert.deepEqual(settings().homeBlocks, []);
  await poll(true, 500, 7);
  assert.equal(settings().writeEnabled, false);
  await poll(true, 500, 8, blocks);
  assert.equal(settings().writeEnabled, true);
  assert.deepEqual(settings().homeBlocks, blocks);

  const denied = new ApiError(403, 'disabled', 'feature_disabled');
  handleReviewRejection(denied, 3);
  assert.equal(settings().writeEnabled, false);
  requests.at(-1).reject(new TypeError('offline'));
  await flush();
  await poll(true, 500, 8);
  assert.equal(settings().writeEnabled, false);
  await poll(true, 500, 9);
  assert.equal(settings().writeEnabled, true);

  // The write was rejected at revision 9, but this tab already has permission at 10.
  await poll(true, 500, 10);
  t.mock.timers.tick(15_000);
  const inFlight = requests.at(-1);
  const delayedDenial = new ApiError(403, 'disabled', 'feature_disabled', { revision: 9 });
  assert.match(handleReviewRejection(delayedDenial, 3), /В момент отправки/);
  assert.equal(settings().writeEnabled, true, 'an older rejection cannot revoke a newer permission');
  assert.equal(settings().revision, 10);
  assert.equal(inFlight.signal.aborted, false);
  assert.equal(requests.at(-1), inFlight);
  await reply(requests.length - 1, true, 500, 10);

  const currentDenial = new ApiError(403, 'disabled', 'feature_disabled', { revision: 10 });
  handleReviewRejection(currentDenial, 3);
  assert.equal(settings().writeEnabled, false, 'a current rejection must close the form immediately');
  await reply(requests.length - 1, true, 500, 10);
  assert.equal(settings().writeEnabled, false);

  const tooLong = new ApiError(400, 'too long', 'review_too_long', { max_length: 100, revision: 10 });
  handleReviewRejection(tooLong, 3);
  assert.equal(settings().maxLength, 100);
  await reply(requests.length - 1, true, 500, 9);
  assert.equal(settings().maxLength, 100);
  await poll(true, 500, 11, blocks);
  assert.equal(settings().maxLength, 500);
  assert.equal(settings().writeEnabled, true);
  assert.deepEqual(settings().homeBlocks, blocks);
  handleReviewRejection(new ApiError(403, 'disabled', 'feature_disabled', { revision: 12 }), 3);
  assert.equal(settings().writeEnabled, false);
  await reply(requests.length - 1, true, 500, 11, blocks);
  assert.equal(settings().writeEnabled, false);
  store.set({ user: { id: 4 } });
  assert.deepEqual(settings().homeBlocks, []);
  await reply(requests.length - 1, false, 20000, 0, [], false, false);
  assert.equal(settings().status, 'fallback');
  await poll(false, 20000, 0, [], false, true);
  assert.equal(settings().status, 'ready');
  assert.equal(settings().revision, 0);
  assert.equal(settings().writeEnabled, false);
  assert.equal(settings().maxLength, 20000);
  assert.ok(settings().lastSuccessAt);
  await poll(true, 500, 1, blocks, true, 'false');
  assert.equal(settings().status, 'fallback');
  assert.equal(settings().writeEnabled, false);
  assert.deepEqual(settings().homeBlocks, []);
  await poll(true, 500, 1, [], false, true);
  const beforeStop = requests.length;
  handleReviewRejection(denied, 3);
  assert.equal(settings().writeEnabled, true);
  assert.equal(requests.length, beforeStop);
  stop();
  t.mock.timers.tick(30_000);
  window.dispatchEvent(new Event('online'));
  assert.equal(requests.length, beforeStop);
});
