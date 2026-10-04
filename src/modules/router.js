import { apiRequest } from '../api/auth.js';

export class Router {
    /**
     * @param {Object} routes - Карта маршрутов вида { '/': MainView, '/login': LoginView }
     * @param {HTMLElement} rootElement - HTML-элемент, куда рендерить страницы (например, #app)
     */

    constructor(routes, rootElement){
        this.routes = routes;
        this.rootElement = rootElement;
        this.authRoutes = new Set(['/login', '/register']);
        this.authenticatedRoutes = new Set(['/collections']);
        this.navigationId = 0;

        window.addEventListener('popstate', () => {
            void this.route();
        });

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

    async isAuthorized() {
        const { ok, status } = await apiRequest('/api/authorised');

        if (status === 401 || status === 403) {
            return false;
        }

        if (!ok) {
            throw new Error(`Authorization check failed with status ${status}`);
        }

        return true;
    }

    /**
     * Метод для программного перехода на другой URL
     * @param {string} path - Путь для перехода (например, '/login')
     */
    navigate(path){
        const target = new URL(path, window.location.href);
        const targetPath = `${target.pathname}${target.search}${target.hash}`;
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (currentPath === targetPath) return;

        window.history.pushState({}, '', targetPath);
        void this.route();
    }
    /**
     * Метод определения текущего пути и отрисовки соответствующего View
     */
    async route() {
        const navigationId = ++this.navigationId;
        this.rootElement.textContent = 'Проверка сессии...';

        try {
            const isAuthorized = await this.isAuthorized();
            if (navigationId !== this.navigationId) return;

            const requestedPath = window.location.pathname;
            const normalizedPath = requestedPath.replace(/\/+$/, '') || '/';
            const redirectPath = isAuthorized && this.authRoutes.has(normalizedPath)
                ? '/'
                : !isAuthorized && this.authenticatedRoutes.has(normalizedPath)
                    ? '/login'
                    : null;
            const activePath = redirectPath || requestedPath;

            if (redirectPath) {
                window.history.replaceState({}, '', redirectPath);
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
        } catch (error) {
            if (navigationId !== this.navigationId) return;
            console.error('Failed to check authorization:', error);
            this.rootElement.textContent = 'Не удалось проверить сессию. Попробуйте обновить страницу.';
        }
    }

    start() {
        void this.route();
    }
}
