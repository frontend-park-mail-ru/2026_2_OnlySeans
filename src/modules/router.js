import { getAuthReturnPath } from '../services/auth-return.js';
import { apiRequest } from '../api/auth.js';
import { store } from './store.js';
import { updateAuthLayout } from '../pages/login/auth-layout.js';
import { preserveCatalogNavigation } from './catalog-transition.js';
import { stopViewTransition, trackViewTransition } from '../services/view-transitions.js';

// маршрут с параметрами вроде /film/:id → { View, params } или null
const matchParamRoute = (routes, path) => {
  for (const [pattern, View] of Object.entries(routes)) {
    if (!pattern.includes(':')) continue;
    const keys = [];
    const expression = pattern
      .split('/')
      .map((part) => {
        if (!part.startsWith(':')) return part;
        keys.push(part.slice(1));
        return '([^/]+)';
      })
      .join('/');
    const match = path.match(new RegExp(`^${expression}/?$`));
    if (match) {
      const params = Object.fromEntries(keys.map((key, index) => [key, match[index + 1]]));
      return { View, params };
    }
  }
  return null;
};

export class Router {
  /**
   * @param {Object} routes - Карта маршрутов вида { '/': MainView, '/login': LoginView }
   * @param {HTMLElement} rootElement - HTML-элемент, куда рендерить страницы (например, #app)
   */

  constructor(routes, rootElement) {
    this.routes = routes;
    this.rootElement = rootElement;
    this.authRoutes = new Set(['/login', '/register']);
    this.navigationId = 0;
    this.catalogRoutes = new Set([
      '/',
      '/discover',
      '/films',
      '/series',
      '/collections',
      '/watch-later',
      '/favorites',
      '/watched',
      '/my-collections',
    ]);

    window.addEventListener('popstate', () => {
      void this.route();
    });

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest('a[data-link]');
      if (
        !link ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || link.target === '_blank') return;

      event.preventDefault();
      this.navigate(`${url.pathname}${url.search}${url.hash}`);
    });
  }

  async isAuthorized() {
    const { ok, status, data } = await apiRequest('/api/authorised');

    if (status === 401 || status === 403) {
      store.setState({ user: null });
      return false;
    }

    if (!ok) {
      throw new Error(`Authorization check failed with status ${status}`);
    }

    if (!data?.user) {
      throw new Error('Authorization check response is missing the user');
    }

    store.setState({ user: data.user });
    return true;
  }

  /**
   * Метод для программного перехода на другой URL
   * @param {string} path - Путь для перехода (например, '/login')
   */
  navigate(path, { refresh = false, render = true, replace = false } = {}) {
    const target = new URL(path, window.location.href);
    const targetPath = `${target.pathname}${target.search}${target.hash}`;
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentPath === targetPath) {
      if (refresh) void this.route();
      return;
    }

    if (replace) history.replaceState(history.state, '', targetPath);
    else history.pushState(null, '', targetPath);
    if (render) void this.route();
  }
  /**
   * Метод определения текущего пути и отрисовки соответствующего View
   */
  async route() {
    const navigationId = ++this.navigationId;
    stopViewTransition();
    this.transition?.skipTransition();
    this.rootElement
      .querySelector('main')
      ?.getAnimations()
      .forEach((animation) => animation.cancel());
    const currentAuthShell = this.rootElement.querySelector('[data-auth-shell]');
    const requestedAuthPath = window.location.pathname.replace(/\/+$/, '');
    const preserveAuthShell = currentAuthShell && this.authRoutes.has(requestedAuthPath);
    if (!this.rootElement.firstChild) this.rootElement.textContent = 'Проверка сессии...';
    this.rootElement.setAttribute('aria-busy', 'true');

    try {
      const isAuthorized = await this.isAuthorized();
      if (navigationId !== this.navigationId) return;

      const requestedPath = window.location.pathname;
      const normalizedPath = requestedPath.replace(/\/+$/, '') || '/';
      const redirectPath =
        isAuthorized && this.authRoutes.has(normalizedPath) ? getAuthReturnPath() || '/' : null;
      const activePath = redirectPath
        ? new URL(redirectPath, location.origin).pathname
        : requestedPath;

      if (redirectPath) {
        window.history.replaceState(window.history.state, '', redirectPath);
      }

      let ViewClass = this.routes[activePath];
      let params = {};
      if (!ViewClass) {
        const matched = matchParamRoute(this.routes, activePath);
        if (matched) {
          ViewClass = matched.View;
          params = matched.params;
        }
      }
      ViewClass ||= this.routes['404'];

      if (!ViewClass) {
        this.rootElement.textContent = '404 - Page not found';
        return;
      }

      const currentCatalog = this.rootElement.querySelector('.catalog-page');
      const catalogTransition = currentCatalog && this.catalogRoutes.has(activePath);
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animateNavigation =
        Boolean(this.rootElement.firstElementChild) && !preserveAuthShell && !reducedMotion;
      const focusedLink = document.activeElement?.closest('a[data-link]');
      const navigationFocus = focusedLink?.closest('.site-sidebar, .catalog-topbar')
        ? focusedLink.getAttribute('href')
        : null;
      const commit = () => {
        if (navigationId !== this.navigationId) return;
        const viewInstance = new ViewClass({
          params,
          navigate: (nextPath, options) => this.navigate(nextPath, options),
        });
        const renderedContent = viewInstance.render();
        if (
          preserveAuthShell &&
          currentAuthShell.isConnected &&
          renderedContent instanceof HTMLElement &&
          renderedContent.hasAttribute('data-auth-shell')
        ) {
          updateAuthLayout(currentAuthShell, renderedContent);
          return;
        }
        if (
          catalogTransition &&
          renderedContent instanceof HTMLElement &&
          renderedContent.classList.contains('catalog-page')
        )
          preserveCatalogNavigation(currentCatalog, renderedContent);
        this.rootElement.replaceChildren();
        if (typeof renderedContent === 'string') this.rootElement.innerHTML = renderedContent;
        else if (renderedContent instanceof HTMLElement)
          this.rootElement.appendChild(renderedContent);
        if (catalogTransition) {
          window.scrollTo({ top: 0, behavior: 'instant' });
          if (navigationFocus)
            [...this.rootElement.querySelectorAll('.site-sidebar a, .catalog-topbar a')]
              .find(
                (link) =>
                  link.getAttribute('href') === navigationFocus &&
                  link.getClientRects().length &&
                  !link.closest('[inert]'),
              )
              ?.focus({ preventScroll: true });
        }
      };
      if (animateNavigation && document.startViewTransition) {
        stopViewTransition();
        // в каталоге оболочка остаётся на месте, остальные страницы сменяются целиком
        if (!catalogTransition) document.documentElement.classList.add('route-surface');
        if (this.authRoutes.has(activePath) || currentAuthShell)
          document.documentElement.classList.add('route-auth');
        const transition = document.startViewTransition(commit);
        this.transition = transition;
        trackViewTransition(transition, () =>
          document.documentElement.classList.remove('route-surface', 'route-auth'),
        );
        // при быстрой навигации анимация может не успеть — это нормально
        transition.ready.catch(() => {});
        await transition.updateCallbackDone;
      } else {
        commit();
        if (animateNavigation)
          (this.rootElement.querySelector('main') || this.rootElement.firstElementChild)?.animate(
            [
              { opacity: 0, transform: 'translateY(8px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' },
          );
      }
    } catch (error) {
      if (navigationId !== this.navigationId) return;
      console.error('Failed to check authorization:', error);
      this.rootElement.textContent = 'Не удалось проверить сессию. Попробуйте обновить страницу.';
    } finally {
      if (navigationId === this.navigationId) this.rootElement.removeAttribute('aria-busy');
    }
  }

  start() {
    void this.route();
  }
}
