const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, 'src', file), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', compiled)(exports, (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  });
  return exports;
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const account = { id: 7, username: 'Зритель', email: 'viewer@example.test' };
const other = { id: 8, username: 'Другой', email: 'other@example.test' };
class ApiError extends Error {
  constructor(status) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

function session(api = {}, initial = null) {
  let user = initial;
  let saved = initial;
  const service = load('services/session.ts', {
    '../api/auth.js': {
      fetchCurrentUser: async () => account,
      login: async () => account,
      register: async () => account,
      logout: async () => {},
      ...api,
    },
    '../api/http.js': { ApiError, isUnavailable: (error) => error instanceof TypeError },
    '../api/errors.js': { HttpStatus: { UNAUTHORIZED: 401 } },
    './offline-storage.js': {
      offlineAccount: () => saved,
      saveOfflineAccount: (value) => {
        saved = value;
      },
    },
    './library.js': { loadLibrary: async () => {} },
    './storage.js': { loadPreferences: async () => {} },
    '../core/store.js': {
      store: {
        get: () => user,
        set: (patch) => {
          user = patch.user;
        },
      },
    },
  });
  return { ...service, user: () => user, saved: () => saved };
}

test('пустое поле показывает ошибку после касания, скрытое поле не мешает входу', () => {
  const { FormValidator } = load('core/form-validator.ts');
  const field = {
    value: '',
    setError(message) {
      this.error = message;
    },
  };
  let active = true;
  const validator = new FormValidator([
    { field, check: () => 'Введите имя', active: () => active },
  ]);
  assert.equal(validator.validate(), false);
  assert.equal(field.error, '');
  validator.touch(field);
  validator.validate();
  assert.equal(field.error, 'Введите имя');
  active = false;
  assert.equal(validator.validate(), true);
  assert.equal(field.error, '');
});

test('валидация допускает серверные символы и отклоняет неверные данные', () => {
  const { checkEmail, checkUsername, checkNewPassword } = load('services/validation.ts');
  assert.equal(checkUsername('Élodie 王'), '');
  assert.ok(checkUsername('viewer!'));
  assert.ok(checkUsername('a'));
  assert.ok(checkEmail(`${'a'.repeat(245)}@example.test`));
  assert.equal(checkEmail('viewer@example.test'), '');
  assert.equal(checkNewPassword('Strong1!'), '');
  for (const value of ['short1A', 'lowercase1', 'NoNumbers', 'Русский1A', 'A1' + 'x'.repeat(31)]) {
    assert.ok(checkNewPassword(value), value);
  }
});

test('поздняя проверка старой сессии не отменяет успешный вход', async () => {
  const check = deferred();
  const app = session({ fetchCurrentUser: () => check.promise });
  const pending = app.refreshSession();
  await app.login({});
  check.resolve(null);
  await pending;
  assert.deepEqual(app.user(), account);
  assert.deepEqual(app.saved(), account);
});

test('поздняя проверка не возвращает пользователя после выхода', async () => {
  const check = deferred();
  const app = session({ fetchCurrentUser: () => check.promise }, account);
  const pending = app.refreshSession();
  await app.logout();
  check.resolve(account);
  await pending;
  assert.equal(app.user(), null);
  assert.equal(app.saved(), null);
});

test('401 при выходе очищает истёкшую сессию, сетевая ошибка её сохраняет', async () => {
  const expired = session(
    {
      logout: async () => {
        throw new ApiError(401);
      },
    },
    account,
  );
  await expired.logout();
  assert.equal(expired.user(), null);
  const unavailable = session(
    {
      logout: async () => {
        throw new TypeError('Offline');
      },
    },
    account,
  );
  await assert.rejects(unavailable.logout(), TypeError);
  assert.deepEqual(unavailable.user(), account);
});

test('проверки сессии объединяются, новая проверка переживает старый запрос', async () => {
  const first = deferred();
  const second = deferred();
  let calls = 0;
  const app = session({ fetchCurrentUser: () => (++calls === 1 ? first.promise : second.promise) });
  const old = app.refreshSession();
  assert.equal(app.refreshSession(), old);
  await app.login({});
  const current = app.refreshSession();
  first.resolve(null);
  await old;
  assert.equal(app.refreshSession(), current);
  second.resolve(other);
  await current;
  assert.deepEqual(app.user(), other);
  assert.equal(calls, 2);
});

test('офлайн-снимок восстанавливается при сбое сети и удаляется при истечении сессии', async () => {
  const offline = session(
    {
      fetchCurrentUser: async () => {
        throw new TypeError('Offline');
      },
    },
    account,
  );
  await offline.restoreSession();
  assert.deepEqual(offline.user(), account);
  const expired = session({ fetchCurrentUser: async () => null }, account);
  await expired.restoreSession();
  assert.equal(expired.user(), null);
  assert.equal(expired.saved(), null);
});

test('прямой запрос к API передаёт cookies и не добавляет запрещённый CORS-заголовок', async (context) => {
  const previousWindow = global.window;
  const previousFetch = global.fetch;
  context.after(() => {
    global.window = previousWindow;
    global.fetch = previousFetch;
  });
  global.window = { location: { origin: 'https://frontend.test' } };
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json({ user: account });
  };
  const { request } = load('api/http.ts', {
    './errors.js': { HttpStatus: { NO_CONTENT: 204 } },
    '../config.js': { API_URL: 'https://backend.test' },
    '../services/offline-storage.js': { offlineAccount: () => null },
  });
  await request('/login', { method: 'POST', body: { email: account.email, password: 'Strong1!' } });
  await request('/authorised', { fresh: true });
  assert.equal(calls[0].url.href, 'https://backend.test/api/login');
  assert.equal(calls[0].options.credentials, 'include');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(calls[1].options.credentials, 'include');
  assert.equal(calls[1].options.cache, 'reload');
  assert.equal(calls[1].options.headers['X-Frame-Fresh'], undefined);
});

test('401 авторизации означает гостя, ошибка сервера не означает выход', async () => {
  let status = 401;
  const api = load('api/auth.ts', {
    './http.js': {
      ApiError,
      request: async () => {
        throw new ApiError(status);
      },
    },
    './errors.js': { HttpStatus: { UNAUTHORIZED: 401 } },
  });
  assert.equal(await api.fetchCurrentUser(), null);
  status = 503;
  await assert.rejects(api.fetchCurrentUser(), (error) => error.status === 503);
});

test('неразобранный JSON не превращается в успешный пустой ответ API', async (context) => {
  const previousFetch = global.fetch;
  const previousWindow = global.window;
  context.after(() => {
    global.fetch = previousFetch;
    global.window = previousWindow;
  });
  global.window = { location: { origin: 'https://frontend.test' } };
  let status = 200;
  global.fetch = async () =>
    new Response('{broken', { status, headers: { 'Content-Type': 'application/json' } });
  const { request } = load('api/http.ts', {
    './errors.js': { HttpStatus: { NO_CONTENT: 204 } },
    '../config.js': { API_URL: 'https://backend.test' },
    '../services/offline-storage.js': { offlineAccount: () => null },
  });
  await assert.rejects(request('/films/1/rating'), (error) => error.status === 502);
  status = 401;
  await assert.rejects(request('/authorised'), (error) => error.status === 401);
});
