import { BaseComponent } from '../base-component.js';
import { createSiteLogo } from '../site-logo/site-logo.js';
import { createLogoutButton } from '../logout-button/logout-button.js';
import { createThemeToggle } from '../theme-toggle/theme-toggle.js';
import { store } from '../../../modules/store.js';
import { logout } from '../../../services/auth.js';

const template = window.Handlebars.compile(`
  <header class="site-header">
    <div class="site-header__brand"></div>
    <nav class="site-header__nav" aria-label="Разделы">
      <a href="/films" data-link>Фильмы</a>
      <a href="/series" data-link>Сериалы</a>
      <a href="/collections" data-link>Подборки</a>
    </nav>
    <form class="site-header__search" role="search">
      <input type="search" name="q" placeholder="Фильмы и сериалы" aria-label="Поиск по фильмам и сериалам">
    </form>
    <div class="site-header__tools"></div>
    <div class="site-header__actions">
      <p class="site-header__status" role="status" aria-live="polite"></p>
    </div>
  </header>
`);
export class SiteHeader extends BaseComponent {
  constructor({ navigate } = {}) {
    super(template, {});
    this.navigate = navigate;
  }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    element.querySelector('.site-header__brand').appendChild(createSiteLogo());
    element.querySelector('.site-header__tools').appendChild(createThemeToggle());
    element.querySelector('.site-header__search').addEventListener('submit', (event) => {
      event.preventDefault();
      const query = new FormData(event.target).get('q').trim();
      this.navigate(query ? `/films?q=${encodeURIComponent(query)}` : '/films');
    });
    this.renderActions(element);
    return element;
  }

  renderActions(element) {
    const actions = element.querySelector('.site-header__actions');
    const status = element.querySelector('.site-header__status');
    const user = store.get('user');

    if (!user) {
      const loginLink = document.createElement('a');
      loginLink.className = 'site-header__login';
      loginLink.href = '/login';
      loginLink.dataset.link = '';
      loginLink.textContent = 'Войти';
      actions.replaceChildren(loginLink, status);
      return;
    }

    const username = document.createElement('a');
    username.className = 'site-header__username';
    username.href = '/profile';
    username.dataset.link = '';
    username.textContent = user.username || user.name || user.email || 'Пользователь';

    const logoutButton = createLogoutButton({
      onClick: async () => {
        const status = element.querySelector('.site-header__status');
        logoutButton.disabled = true;
        status.textContent = '';

        try {
          if (!await logout()) {
            status.textContent = 'Не удалось выйти из аккаунта. Попробуйте ещё раз.';
            logoutButton.disabled = false;
            return;
          }

          this.navigate('/login');
        } catch (error) {
          console.error('Не удалось выйти из аккаунта:', error);
          status.textContent = 'Не удалось связаться с сервером. Попробуйте ещё раз.';
          logoutButton.disabled = false;
        }
      },
    });

    actions.replaceChildren(username, logoutButton, status);
  }
}
export const createSiteHeader = (options) => new SiteHeader(options).render();
