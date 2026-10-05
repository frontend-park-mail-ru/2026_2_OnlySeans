import { BaseComponent } from '../base-component.js';
import { createSiteLogo } from '../site-logo/site-logo.js';
import { createLogoutButton } from '../logout-button/logout-button.js';
import { store } from '../../../modules/store.js';
import { logout } from '../../../services/auth.js';

const template = window.Handlebars.compile(`
  <header class="site-header">
    <div class="site-header__brand"></div>
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

    const username = document.createElement('span');
    username.className = 'site-header__username';
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
