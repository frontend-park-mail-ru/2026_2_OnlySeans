const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function environment() {
  let user = { id: 1 };
  let fail = false;
  const values = new Map();
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(`${__dirname}/src/services/profile-bio.ts`, 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    },
  ).outputText;
  const dependencies = {
    '../core/store.js': { store: { get: () => user } },
    './storage.js': {
      readJson: (key, fallback) => values.get(key) ?? fallback,
      writeJson: (key, value) => {
        if (fail) return false;
        values.set(key, value);
        return true;
      },
    },
  };
  new Function('exports', 'require', code)(exports, (name) => dependencies[name]);
  return {
    api: exports,
    values,
    user: (value) => {
      user = value;
    },
    fail: () => {
      fail = true;
    },
  };
}

test('описание и любимые жанры изолированы по аккаунтам, гость не получает личные данные', () => {
  const { api, user } = environment();
  api.saveProfileBio(' Люблю кино ');
  api.saveProfileGenres(['Драма', 'Драма', 'Комедия']);
  user({ id: 2 });
  assert.equal(api.readProfileBio(), '');
  assert.deepEqual(api.readProfileGenres(), []);
  api.saveProfileGenres(['Триллер']);
  user({ id: 1 });
  assert.equal(api.readProfileBio(), 'Люблю кино');
  assert.deepEqual(api.readProfileGenres(), ['Драма', 'Комедия']);
  user(null);
  assert.deepEqual(api.readProfileGenres(), []);
  assert.throws(() => api.saveProfileGenres(['Драма']), /Войдите/);
});

test('жанры ограничены десятью, повреждённое значение хранилища нормализуется', () => {
  const { api, values } = environment();
  assert.throws(
    () => api.saveProfileGenres(Array.from({ length: 11 }, (_, i) => String(i))),
    /10 жанров/,
  );
  values.set('frame:profile-bio:1:genres', ['Драма', null, 42, 'Драма', 'x'.repeat(101)]);
  assert.deepEqual(api.readProfileGenres(), ['Драма']);
  values.set('frame:profile-bio:1:genres', { genres: ['Драма'] });
  assert.deepEqual(api.readProfileGenres(), []);
});

test('сбой записи жанров не выдаётся за успешное сохранение и сохраняет прежний выбор', () => {
  const { api, fail } = environment();
  api.saveProfileGenres(['Драма']);
  fail();
  assert.throws(() => api.saveProfileGenres(['Комедия']), /Не удалось сохранить/);
  assert.deepEqual(api.readProfileGenres(), ['Драма']);
});
