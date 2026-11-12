const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

async function testOfflineEdits(directory) {
  global.localStorage = {
    getItem(key) { return this[key] ?? null; },
    setItem(key, value) { this[key] = value; },
    removeItem(key) { delete this[key]; },
  };
  global.window = { location: { origin: 'https://example.test' } };
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: { onLine: true, locks: { request: async (_, action) => action() } },
  });
  const account = { id: 7, username: 'viewer', email: 'viewer@example.test' };
  const other = { id: 9, username: 'other', email: 'other@example.test' };
  let signedIn = account;
  let review = null;
  let score = 0;
  let mutations = 0;
  let online = true;

  function json(data, status = 200) {
    return Response.json(data, { status });
  }
  global.fetch = async (input, options = {}) => {
    if (!online) throw new TypeError('Offline');
    const { pathname } = new URL(input, window.location.origin);
    const method = options.method ?? 'GET';
    if (pathname === '/api/authorised') return json({ user: signedIn });
    if (pathname === '/api/me/profile') return json({ user: signedIn });
    if (pathname === '/review-authors.json') return json({});
    if (pathname === '/api/films/12/rating/me') return json({ rating: { score } });
    if (pathname === '/api/films/12/rating' && method === 'PUT') {
      mutations++;
      score = JSON.parse(options.body).score;
      return json({ rating: { score } });
    }
    if (pathname === '/api/films/12/reviews') {
      if (method === 'GET') return json({ reviews: review ? [review] : [], total: review ? 1 : 0 });
      mutations++;
      review = { ...JSON.parse(options.body), id: 42, author_id: account.id, version: 1 };
      return json({ review }, 201);
    }
    throw new Error('Unexpected request ' + method + ' ' + pathname);
  };

  const { store } = require(path.join(directory, 'core/store.js'));
  const { saveOfflineAccount, offlineAccount } = require(path.join(directory, 'services/offline-storage.js'));
  const { pendingFilmEdit, syncFilmEdits } = require(path.join(directory, 'services/offline-film-edits.js'));
  const { loadMyReview, myScore, reviewDraft, saveReview, setScore } = require(path.join(directory, 'services/my-review.js'));
  const { request } = require(path.join(directory, 'api/http.js'));
  saveOfflineAccount(account);
  store.set({ user: account });
  await request('/me/profile');
  await loadMyReview(12);
  navigator.onLine = online = false;
  assert.deepEqual((await request('/me/profile')).user, account);

  assert.equal(await setScore(12, 8), true);
  assert.equal(await setScore(12, 9), true);
  assert.equal(myScore(12), 9);
  const values = { title: 'A review', text: 'Written while offline.', spoiler: false };
  assert.equal(await saveReview(12, values), true);
  assert.deepEqual(reviewDraft(12), values);
  assert.equal(mutations, 0);
  assert.equal(await syncFilmEdits(), false);

  navigator.onLine = online = true;
  signedIn = other;
  assert.equal(await syncFilmEdits(), false);
  assert.equal(mutations, 0);
  signedIn = account;
  assert.equal(await syncFilmEdits(), true);
  assert.equal(score, 9);
  assert.equal(review.content, values.text);
  assert.equal(mutations, 2);
  assert.equal(await syncFilmEdits(), false);

  await loadMyReview(12);
  navigator.onLine = online = false;
  await saveReview(12, { ...values, text: 'Edited offline.' });
  review = { ...review, version: 2, content: 'Edited elsewhere.' };
  navigator.onLine = online = true;
  assert.equal(await syncFilmEdits(), false);
  assert.equal(review.content, 'Edited elsewhere.');
  assert.equal(pendingFilmEdit(12, 'review').conflict, true);
  assert.equal(reviewDraft(12).text, 'Edited offline.');
  assert.equal(mutations, 2);

  saveOfflineAccount(null);
  store.set({ user: null });
  assert.equal(offlineAccount(), null);
  assert.equal(Object.keys(localStorage).filter(key => key.startsWith('frame:offline:')).length, 0);
  console.log('Passed: private snapshot, offline edits, account isolation, reconnect, review conflict and logout cleanup.');
}

const directory = mkdtempSync(path.join(tmpdir(), 'frame-offline-test-'));
(async () => {
  try {
    execFileSync(process.execPath, [
      require.resolve('typescript/bin/tsc'), '--target', 'ES2022', '--module', 'commonjs',
      '--skipLibCheck', '--outDir', directory, 'src/services/my-review.ts',
    ], { stdio: 'inherit' });
    await testOfflineEdits(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
