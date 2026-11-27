const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('возвраты сохраняют прокрутку; поздний модуль не меняет новый маршрут, ошибка загрузки восстанавливается', async () => {
  const location = new URL('https://example.test/films');
  const listeners = new Map();
  const frames = [];
  const entries = [{ state: null, url: location.href }];
  let index = 0;
  let scrollY = 0;
  let writes = 0;
  const history = {
    scrollRestoration: 'auto',
    get state() {
      return entries[index].state;
    },
    replaceState(state, unused, url) {
      writes++;
      entries[index] = { state, url: url ? new URL(url, location).href : location.href };
      location.href = entries[index].url;
    },
    pushState(state, unused, url) {
      entries.splice(++index);
      entries.push({ state, url: new URL(url, location).href });
      location.href = entries[index].url;
    },
    go(delta) {
      index += delta;
      location.href = entries[index].url;
      queueMicrotask(() => listeners.get('popstate')());
    },
  };
  const window = {
    get scrollY() {
      return scrollY;
    },
    scrollTo(x, y) {
      scrollY = y;
    },
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
  };
  class Page {
    constructor(props) {
      this.props = props;
    }
  }
  let shown;
  let resolveLazy;
  class LoadErrorPage extends Page {}
  class SlowPage extends Page {}
  class Layout {
    render() {
      return {};
    }
    destroy() {}
    show(page) {
      shown = page;
      scrollY = 0;
      listeners.get('scroll')?.();
    }
  }
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync('src/app/router.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    window,
    history,
    location,
    URL,
    URLSearchParams,
    document: { addEventListener() {}, documentElement: { dataset: {} } },
    requestAnimationFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    },
    setTimeout,
    clearTimeout,
    require: (name) => {
      if (name === '../pages/load-error/LoadErrorPage.js') return { LoadErrorPage };
      if (name === '../core/store.js') return { store: { get: () => null } };
      if (name === '../services/auth-return.js') return { authPath: () => '/login' };
      assert.fail(name);
    },
  });
  const router = new exports.Router({
    routes: [
      { path: '/films', page: Page },
      { path: '/film/:id', page: Page },
      {
        path: '/slow',
        load: () =>
          new Promise((resolve) => {
            resolveLazy = resolve;
          }),
      },
      {
        path: '/broken',
        load: async () => {
          throw new Error('chunk unavailable');
        },
      },
    ],
    notFound: { page: Page },
    root: { replaceChildren() {} },
    layouts: { app: Layout },
  });
  const flush = () => {
    while (frames.length) frames.shift()();
  };
  router.start();
  flush();
  scrollY = 1350;
  for (let visit = 0; visit < 3; visit++) {
    router.navigate('/film/1');
    flush();
    assert.equal(entries[0].state.frameScrollY, 1350);
    index = 0;
    location.href = entries[index].url;
    const before = writes;
    listeners.get('popstate')();
    assert.equal(scrollY, 0, 'новая разметка временно короче страницы');
    listeners.get('scroll')?.();
    flush();
    assert.equal(scrollY, 1350);
    assert.equal(entries[0].state.frameScrollY, 1350);
    assert.equal(writes, before, 'восстановление не перезаписывает history');
  }
  scrollY = 1480;
  listeners.get('pagehide')();
  assert.equal(history.state.frameScrollY, 1480);
  router.navigate('/slow');
  router.navigate('/film/2');
  resolveLazy(SlowPage);
  await new Promise(setImmediate);
  assert.equal(shown.props.params.id, '2');
  assert.ok(!(shown instanceof SlowPage));
  router.navigate('/broken');
  await new Promise(setImmediate);
  assert.ok(shown instanceof LoadErrorPage);
  const protectedPage = shown;
  const protectedURL = location.href;
  protectedPage.beforeLeave = async () => false;
  await router.navigate('/film/3');
  assert.equal(shown, protectedPage);
  assert.equal(location.href, protectedURL);
  protectedPage.beforeLeave = async () => true;
  await router.navigate('/film/3');
  const formPage = shown;
  formPage.beforeLeave = async () => false;
  history.go(-1);
  await new Promise(setImmediate);
  assert.equal(location.pathname, '/film/3');
  assert.equal(shown, formPage);
  formPage.beforeLeave = async () => true;
  history.go(-1);
  await new Promise(setImmediate);
  assert.equal(location.pathname, '/broken');
  assert.ok(shown instanceof LoadErrorPage);
});
