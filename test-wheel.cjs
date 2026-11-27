const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadWheel() {
  let user = null;
  const saved = new Map();
  const dependencies = {
    '../core/store.js': { store: { get: () => user } },
    './storage.js': {
      readJson: (key, fallback) => saved.get(key) ?? fallback,
      writeJson: (key, value) => {
        saved.set(key, value);
        return true;
      },
    },
  };
  const source = fs.readFileSync(path.join(__dirname, 'src/services/wheel.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', 'location', compiled)(exports, (name) => dependencies[name], {
    origin: 'https://frame.example',
  });
  return {
    ...exports,
    setUser: (value) => {
      user = value;
    },
  };
}

test('взвешенный выбор учитывает точные границы секторов', () => {
  const { pickWheel } = loadWheel();
  const entries = [
    { id: 1, weight: 1 },
    { id: 2, weight: 3 },
  ];
  assert.equal(pickWheel(entries, 0), 1);
  assert.equal(pickWheel(entries, 0.249999), 1);
  assert.equal(pickWheel(entries, 0.25), 2);
  assert.equal(pickWheel(entries, 0.999999), 2);
  for (const random of [-1, 1, NaN, Infinity]) assert.throws(() => pickWheel(entries, random));
  assert.throws(() => pickWheel([{ id: 1, weight: 0 }], 0));
  assert.throws(() =>
    pickWheel(
      [
        { id: 1, weight: Number.MAX_VALUE },
        { id: 2, weight: Number.MAX_VALUE },
      ],
      0,
    ),
  );
});

test('ссылка переносит веса и победителя, отклоняет дубли и неверные значения', () => {
  const { wheelShare, readWheelShare } = loadWheel();
  const result = {
    winner: 2,
    entries: [
      { id: 1, weight: 1 },
      { id: 2, weight: 3 },
    ],
    at: 1,
    source: 'Избранное',
  };
  const url = new URL(wheelShare(result));
  assert.deepEqual(readWheelShare(url.searchParams), {
    winner: result.winner,
    entries: result.entries,
  });
  for (const value of [
    '{',
    JSON.stringify({ winner: 8, entries: result.entries }),
    JSON.stringify({
      winner: 1,
      entries: [
        { id: 1, weight: 1 },
        { id: 1, weight: 1 },
      ],
    }),
    JSON.stringify({
      winner: 1,
      entries: [
        { id: 1, weight: -1 },
        { id: 2, weight: 1 },
      ],
    }),
  ])
    assert.equal(readWheelShare(new URLSearchParams({ choice: value })), null);
});

test('история ограничена 50 результатами и изолирована по аккаунтам', () => {
  const wheel = loadWheel();
  const result = {
    winner: 1,
    entries: [
      { id: 1, weight: 1 },
      { id: 2, weight: 2 },
    ],
    at: Date.now(),
    source: 'Каталог',
  };
  wheel.rememberWheel(result);
  wheel.setUser({ id: 1 });
  assert.deepEqual(wheel.readWheelHistory(), []);
  for (let index = 0; index < 60; index++)
    wheel.rememberWheel({ ...result, at: result.at + index });
  assert.equal(wheel.readWheelHistory().length, 50);
  wheel.setUser({ id: 2 });
  assert.deepEqual(wheel.readWheelHistory(), []);
  wheel.setUser(null);
  assert.equal(wheel.readWheelHistory().length, 1);
});
