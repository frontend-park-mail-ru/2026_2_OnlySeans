import { store } from '../core/store.js';
import { authPath } from '../services/auth-return.js';
import { Component } from '../core/component.js';
import { LoadErrorPage } from '../pages/load-error/LoadErrorPage.js';

export type Navigate = (path: string, options?: { replace?: boolean }) => void;
export interface PageProps {
  params: Record<string, string>;
  query: URLSearchParams;
  restoreScroll: number | null;
  navigate: Navigate;
  type?: 'movie' | 'series';
  mode?: 'login' | 'register';
  list?: 'favorite' | 'watchlater' | 'watched';
}
export interface Route {
  path?: string;
  page?: new (props: PageProps) => Component;
  load?: () => Promise<new (props: PageProps) => Component>;
  redirect?: string;
  props?: Partial<PageProps>;
  layout?: string;
  access?: string;
}
interface Layout extends Component {
  show(page: Component, options?: { toTop?: boolean }): void;
}
type GuardedPage = Component & { beforeLeave?: () => boolean | Promise<boolean> };
interface RouterOptions {
  routes: Route[];
  layouts: Record<string, new (props: { navigate: Navigate }) => Layout>;
  notFound: Route;
  root: HTMLElement | null;
  checkSession?: () => Promise<void>;
}

/** SPA-роутер с восстановлением прокрутки, ленивыми страницами и проверкой beforeLeave. */
export class Router {
  readonly notFound;
  #routes;
  #layouts;
  #root: HTMLElement;
  #checkSession;
  #layout: Layout | null = null;
  #layoutName: string | null = null;
  #visit = 0;
  #loadingTimer: ReturnType<typeof setTimeout> | undefined;
  #restoringScroll = false;
  #activePage: GuardedPage | null = null;
  #position = 0;
  #restorePop: (() => void) | null = null;
  #approvedPop = false;
  #checkingPop = false;

  constructor({ routes, layouts, notFound, root, checkSession }: RouterOptions) {
    if (!root) throw new Error('Не найден контейнер приложения.');
    this.#routes = routes.map((route) => ({ ...route, pattern: toPattern(route.path || '/') }));
    this.#layouts = layouts;
    this.notFound = notFound;
    this.#root = root;
    this.#checkSession = checkSession;
    this.navigate = this.navigate.bind(this);
  }

  start() {
    this.#position = history.state?.framePosition || 0;
    history.replaceState({ ...history.state, framePosition: this.#position }, '');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    document.addEventListener('click', (event) => this.#onLinkClick(event));
    window.addEventListener('pagehide', () => this.#rememberScroll());
    window.addEventListener('popstate', () => void this.#onPop());
    this.#render();
  }

  async navigate(path: string, { replace = false } = {}) {
    if (this.#checkingPop) return;
    if (this.#activePage?.beforeLeave && !(await this.#activePage.beforeLeave())) return;
    this.#rememberScroll();
    const target = new URL(path, location.href);
    const isAuth = (pathname: string) => pathname === '/login' || pathname === '/register';
    if (isAuth(location.pathname) && isAuth(target.pathname)) replace = true;
    if (replace) history.replaceState({ framePosition: this.#position }, '', path);
    else history.pushState({ framePosition: ++this.#position }, '', path);

    this.#render({ toTop: !replace && !location.hash });
  }

  async #onPop() {
    if (this.#restorePop) {
      const restored = this.#restorePop;
      this.#restorePop = null;
      restored();
      return;
    }
    const next = history.state?.framePosition ?? this.#position - 1;
    const delta = next - this.#position;
    if (this.#checkingPop) {
      if (delta) history.go(-delta);
      return;
    }
    if (!this.#approvedPop && delta && this.#activePage?.beforeLeave) {
      this.#checkingPop = true;
      await new Promise<void>((resolve) => {
        this.#restorePop = resolve;
        history.go(-delta);
      });
      const allowed = await this.#activePage.beforeLeave();
      this.#checkingPop = false;
      if (allowed) {
        this.#approvedPop = true;
        history.go(delta);
      }
      return;
    }
    this.#approvedPop = false;
    this.#position = next;
    void this.#render({ restoreScroll: history.state?.frameScrollY || 0 });
  }

  refresh() {
    this.#render();
  }

  #onLinkClick(event: MouseEvent) {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[data-link]')
        : null;
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    this.navigate(`${url.pathname}${url.search}${url.hash}`);
  }

  #match(pathname: string) {
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
    if (this.#restoringScroll) return;
    history.replaceState({ ...history.state, frameScrollY: window.scrollY }, '');
  }

  async #render({
    toTop = false,
    restoreScroll = null,
  }: { toTop?: boolean; restoreScroll?: number | null } = {}) {
    const visit = ++this.#visit;
    this.#restoringScroll = true;
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

    let Page = route.page;
    if (!Page && route.load) {
      this.#loadingTimer ??= setTimeout(() => (document.documentElement.dataset.loading = ''), 120);
      try {
        Page = await route.load();
      } catch {
        Page = LoadErrorPage;
      }
      if (visit !== this.#visit) return;
    }
    if (!Page) throw new Error('Для маршрута не указана страница.');
    const page: Component & { prepare?: () => Promise<void> } = new Page({
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
    this.#loadingTimer = undefined;
    delete document.documentElement.dataset.loading;

    const layoutName = route.layout || 'app';
    if (layoutName !== this.#layoutName) {
      this.#layout?.destroy();
      this.#layout = new this.#layouts[layoutName]({ navigate: this.navigate });
      this.#layoutName = layoutName;
      this.#root.replaceChildren(this.#layout.render());
    }
    this.#layout?.show(page, { toTop });
    this.#activePage = page;
    requestAnimationFrame(() => {
      if (visit !== this.#visit) return;
      if (restoreScroll !== null) window.scrollTo(0, restoreScroll);
      requestAnimationFrame(() => {
        if (visit === this.#visit) this.#restoringScroll = false;
      });
    });
  }
}

function toPattern(path: string) {
  const keys: string[] = [];
  const source = path.replace(/:(\w+)/g, (_: string, key: string) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${source}$`), keys };
}
