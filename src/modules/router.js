import { CookieService } from '../utils/cookies.js';

export class Router {
    /**
     * @param {Object} routes - Карта маршрутов вида { '/': MainView, '/login': LoginView }
     * @param {HTMLElement} rootElement - HTML-элемент, куда рендерить страницы (например, #app)
     */

    constructor(routes, rootElement){
        this.routes = routes;
        this.rootElement = rootElement;
        this.publicRoutes = new Set(['/', '/index.html', '/login', '/register', '/discover',]);
        this.authenticatedRoutes = new Set(['/collections']);

        window.addEventListener('popstate', () => this.route());

        document.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;

            const link = event.target.closest('a[data-link]');
            if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const url = new URL(link.href, window.location.href);
            if (url.origin !== window.location.origin || link.target === '_blank') return;

            event.preventDefault();
            this.navigate(`${url.pathname}${url.search}${url.hash}`);
        });
    }

    hasSession() {
        return Boolean(
            CookieService.get('session_id') ||
            CookieService.get('sessionId') ||
            CookieService.get('session')
        );
    }

    getRedirectPath(path) {
        const normalizedPath = new URL(path || '/', window.location.origin).pathname.replace(/\/+$/, '') || '/';
        const isAuthenticated = this.hasSession();

        if (isAuthenticated && this.publicRoutes.has(normalizedPath)) {
            return '/discover';
        }

        if (!isAuthenticated && this.authenticatedRoutes.has(normalizedPath)) {
            return '/login';
        }

        return null;
    }

    /**
     * Метод для программного перехода на другой URL
     * @param {string} path - Путь для перехода (например, '/login')
     */
    navigate(path){
        const redirectPath = this.getRedirectPath(path);
        const targetPath = redirectPath || path;

        if (window.location.pathname === targetPath) return;

        window.history.pushState({}, '', targetPath);
        this.route();
    }
    /**
     * Метод определения текущего пути и отрисовки соответствующего View
     */
    route() {
        const path = window.location.pathname;
        const redirectPath = this.getRedirectPath(path);
        const activePath = redirectPath || path;

        if (redirectPath) {
            if (window.location.pathname !== redirectPath) {
                window.history.replaceState({}, '', redirectPath);
            }
        }

        const ViewClass = this.routes[activePath] || this.routes['404'];

        if (!ViewClass) {
            this.rootElement.textContent = '404 - Page not found';
            return;
        }

        this.rootElement.innerHTML = '';

        const viewInstance = new ViewClass({ navigate: (nextPath) => this.navigate(nextPath) });

        const renderedContent = viewInstance.render();

        if (typeof renderedContent === 'string'){
            this.rootElement.innerHTML = renderedContent;
        } else if (renderedContent instanceof HTMLElement) {
            this.rootElement.appendChild(renderedContent);
        }
    }

    start() {
        this.route();
    }
}
