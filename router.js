export class Router {
    /**
     * @param {Object} routes - Карта маршрутов вида { '/': MainView, '/login': LoginView }
     * @param {HTMLElement} rootElement - HTML-элемент, куда рендерить страницы (например, #app)
     */

    constructor(routes, rootElement){
        this.routes = routes;
        this.rootElement = rootElement;

        window.addEventListener('popstate', () => this.route());

        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[data-link]');
            if (link) {
                event.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });
    }

    /**
     * Метод для программного перехода на другой URL
     * @param {string} path - Путь для перехода (например, '/login')
     */
    navigate(path){
        if (window.location.pathname === path) return; // Если путь не изменился, ничего не делаем
        
    window.history.pushState({}, '', path);

    this.route()
    
}
    /**
     * Метод определения текущего пути и отрисовки соответствующего View
     */
    route() {
        const path = window.location.pathname;

        const ViewClass = this.routes[path] || this.routes['404'];

        if (!ViewClass) {
            this.rootElement.textContent = '404 - Page not found';
            return;
        }

        this.rootElement.innerHTML = '';

        const viewInstance = new ViewClass();

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