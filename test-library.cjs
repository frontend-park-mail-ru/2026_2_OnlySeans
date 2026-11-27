const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function libraryFixture() {
  let user = { id: 7 };
  let data = { favorite: [1], watchlater: [1, 2], watched: [] };
  let failRemoval = false;
  let changeAccount = false;
  const calls = [];
  const request = async (path, options) => {
    if (path === '/me/library') return structuredClone(data);
    calls.push([path, options.body.saved]);
    const [, list, rawId] = path.match(/lists\/(\w+)\/(\d+)/);
    if (list === 'watchlater' && failRemoval) throw new Error('unavailable');
    const id = Number(rawId);
    data[list] = data[list].filter((value) => value !== id);
    if (options.body.saved) data[list].push(id);
    if (changeAccount) user = { id: 8 };
    return structuredClone(data);
  };
  const deps = {
    '../core/store.js': { store: { get: () => user } },
    '../core/event-bus.js': {
      eventBus: {
        emit() {},
        on() {
          return () => {};
        },
      },
    },
    '../api/http.js': { request },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(`${__dirname}/src/services/library.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'require', code)(exports, (name) => deps[name]);
  return {
    service: exports,
    calls,
    failRemoval(value) {
      failRemoval = value;
    },
    changeAccount() {
      changeAccount = true;
    },
  };
}

test('перенос из смотреть позже сохраняет избранное и не создаёт повторов', async () => {
  const fixture = libraryFixture();
  await fixture.service.loadLibrary();
  await fixture.service.moveToWatched(1);
  await fixture.service.moveToWatched(1);
  assert.deepEqual(fixture.service.readLibrary(), { favorite: [1], watchlater: [2], watched: [1] });
});

test('сбой удаления сохраняет фильм в обоих списках и допускает повтор переноса', async () => {
  const fixture = libraryFixture();
  await fixture.service.loadLibrary();
  fixture.failRemoval(true);
  await assert.rejects(fixture.service.moveToWatched(1), /остался в «Смотреть позже»/);
  assert.deepEqual(fixture.service.readLibrary(), {
    favorite: [1],
    watchlater: [1, 2],
    watched: [1],
  });
  fixture.failRemoval(false);
  await fixture.service.moveToWatched(1);
  assert.deepEqual(fixture.service.readLibrary().watchlater, [2]);
});

test('смена аккаунта между запросами останавливает перенос и скрывает прежние списки', async () => {
  const fixture = libraryFixture();
  await fixture.service.loadLibrary();
  fixture.changeAccount();
  await assert.rejects(fixture.service.moveToWatched(1), /Пользователь изменился/);
  assert.equal(fixture.calls.length, 1);
  assert.deepEqual(fixture.service.readLibrary(), { favorite: [], watchlater: [], watched: [] });
});
