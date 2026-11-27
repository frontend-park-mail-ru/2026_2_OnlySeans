const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function pager(getFilmsPage) {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(__dirname + '/src/services/catalog-pager.ts', 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    },
  ).outputText;
  new Function('exports', 'require', code)(exports, () => ({ getFilmsPage }));
  return exports.CatalogPager;
}
const films = (start, count) => Array.from({ length: count }, (_, i) => ({ id: start + i }));
const all = (films) => films;
const signal = () => new AbortController().signal;

test('лента получает только нужные страницы и восстанавливается из успешных порций', async () => {
  const calls = [];
  const Pager = pager(async (offset) => {
    calls.push(offset);
    return { films: films(offset + 1, 20), total: 100 };
  });
  const first = new Pager();
  await first.loadTo(20, all, signal());
  assert.deepEqual(calls, [0]);
  assert.equal(first.complete, false);
  await first.loadTo(40, all, signal());
  const restored = new Pager();
  await restored.loadTo(40, all, signal());
  assert.deepEqual(calls, [0, 20]);
  assert.equal(restored.films.length, 40);
});

test('ошибка догрузки сохраняет карточки и повторяет прежний offset', async () => {
  let fail = true;
  const calls = [];
  const Pager = pager(async (offset) => {
    calls.push(offset);
    if (offset === 20 && fail) throw new Error('network');
    return { films: films(offset + 1, 20), total: 40 };
  });
  const feed = new Pager();
  await feed.loadTo(20, all, signal());
  await assert.rejects(feed.loadTo(40, all, signal()), /network/);
  assert.equal(feed.films.length, 20);
  fail = false;
  await feed.loadTo(40, all, signal());
  assert.deepEqual(calls, [0, 20, 20]);
  assert.equal(feed.complete, true);
});

test('отбор типа не останавливает чтение на пустой для него странице', async () => {
  const calls = [];
  const Pager = pager(async (offset) => {
    calls.push(offset);
    return { films: films(offset + 1, 20), total: 60 };
  });
  const feed = new Pager();
  await feed.loadTo(
    2,
    (items) => items.filter((item) => item.id > 20 && item.id % 10 === 0),
    signal(),
  );
  assert.deepEqual(calls, [0, 20]);
  assert.equal(feed.films.length, 40);
  assert.equal(feed.complete, false);
});

test('отменённый поздний ответ не меняет ленту и кеш', async () => {
  const controller = new AbortController();
  const Pager = pager(async () => {
    controller.abort();
    return { films: films(1, 20), total: 20 };
  });
  const feed = new Pager();
  await assert.rejects(feed.loadTo(20, all, controller.signal), { name: 'AbortError' });
  assert.deepEqual(feed.films, []);
  assert.deepEqual(new Pager().films, []);
});

test('повтор страницы сервером не создаёт дубли и бесконечные запросы', async () => {
  let calls = 0;
  const Pager = pager(async () => {
    calls++;
    return { films: films(1, 20), total: 100 };
  });
  const feed = new Pager();
  await assert.rejects(feed.loadTo(40, all, signal()), /повторил/);
  assert.equal(feed.films.length, 20);
  assert.equal(calls, 2);
});

test('принудительное обновление не принимает кеш старого курсора', async () => {
  const Pager = pager(async (offset) => ({ films: films(offset + 1, 20), total: 100 }));
  const old = new Pager();
  await old.loadTo(20, all, signal());
  const fresh = new Pager({ fresh: true });
  await old.loadTo(60, all, signal());
  assert.deepEqual(new Pager().films, []);
  await fresh.loadTo(20, all, signal());
  assert.equal(new Pager().films.length, 20);
});
