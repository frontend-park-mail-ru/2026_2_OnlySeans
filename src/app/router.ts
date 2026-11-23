import { store } from '../core/store.js';
import { authPath } from '../services/auth-return.js';

export class Router {
  readonly notFound;
  #routes;
  #layouts;
  #root;
  #checkSession;
  #layout = null;
  #layoutName = null;
  #visit = 0;
  #loadingTimer = null;
  #scrollFrame = 0;

  constructor({ routes, layouts, notFound, root, checkSession }) {
    this.#routes = routes.map((route) => ({ ...route, pattern: toPattern(route.path) }));
    this.#layouts = layouts;
    this.notFound = notFound;
    this.#root = root;
    this.#checkSession = checkSession;
    this.navigate = this.navigate.bind(this);
  }

  start() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    document.addEventListener('click', (event) => this.#onLinkClick(event));
    window.addEventListener(
      'scroll',
      () => {
        if (this.#scrollFrame) return;
        this.#scrollFrame = requestAnimationFrame(() => {
          this.#scrollFrame = 0;
          this.#rememberScroll();
        });
      },
      { passive: true },
    );
    window.addEventListener('popstate', () => {
      cancelAnimationFrame(this.#scrollFrame);
      this.#scrollFrame = 0;
      this.#render({ restoreScroll: history.state?.frameScrollY || 0 });
    });
    this.#render();
  }

  navigate(path, { replace = false } = {}) {
    this.#rememberScroll();
    cancelAnimationFrame(this.#scrollFrame);
    this.#scrollFrame = 0;
    const target = new URL(path, location.href);
    const isAuth = (pathname) => pathname === '/login' || pathname === '/register';
    if (isAuth(location.pathname) && isAuth(target.pathname)) replace = true;
    if (replace) history.replaceState(null, '', path);
    else history.pushState(null, '', path);

    this.#render({ toTop: !replace && !location.hash });
  }

  refresh() {
    this.#render();
  }

  #onLinkClick(event) {
    const link = event.target.closest('a[data-link]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    this.navigate(`${url.pathname}${url.search}${url.hash}`);
  }

  #match(pathname) {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    for (const route of this.#routes) {
      const found = path.match(route.pattern.regex);
      if (found) {
        const params = Object.fromEntries(
          route.pattern.keys.map((key, index) => [key, decodeURIComponent(found[index + 1])]),
        );
        return { route, params };
      }
    }
    return { route: this.notFound, params: {} };
  }

  #rememberScroll() {
    history.replaceState({ ...history.state, frameScrollY: window.scrollY }, '');
  }

  async #render({
    toTop = false,
    restoreScroll = null,
  }: { toTop?: boolean; restoreScroll?: number } = {}) {
    const visit = ++this.#visit;
    const { route, params } = this.#match(location.pathname);
    const here = `${location.pathname}${location.search}`;

    if (route.redirect) {
      this.navigate(`${route.redirect}${location.search}`, { replace: true });
      return;
    }

    if (route.access === 'user' && this.#checkSession) {
      await this.#checkSession();
      if (visit !== this.#visit) return;
    }

    const user = store.get('user');

    if (route.access === 'user' && !user) {
      this.navigate(authPath('login', here), { replace: true });
      return;
    }
    if (route.access === 'guest' && user) {
      const back = new URLSearchParams(location.search).get('returnTo');
      this.navigate(back?.startsWith('/') && !back.startsWith('//') ? back : '/', {
        replace: true,
      });
      return;
    }

    const page = new route.page({
      ...route.props,
      params,
      query: new URLSearchParams(location.search),
      restoreScroll,
      navigate: this.navigate,
    });

    if (page.prepare) {
      this.#loadingTimer ??= setTimeout(() => (document.documentElement.dataset.loading = ''), 120);
      await page.prepare();

      if (visit !== this.#visit) return;
    }
    clearTimeout(this.#loadingTimer);
    this.#loadingTimer = null;
    delete document.documentElement.dataset.loading;

    const layoutName = route.layout || 'app';
    if (layoutName !== this.#layoutName) {
      this.#layout?.destroy();
      this.#layout = new this.#layouts[layoutName]({ navigate: this.navigate });
      this.#layoutName = layoutName;
      this.#root.replaceChildren(this.#layout.render());
    }
    this.#layout.show(page, { toTop });
    if (restoreScroll !== null)
      requestAnimationFrame(() => {
        if (visit === this.#visit) window.scrollTo(0, restoreScroll);
      });
  }
}

function toPattern(path) {
  const keys = [];
  const source = path.replace(/:(\w+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${source}$`), keys };
}
