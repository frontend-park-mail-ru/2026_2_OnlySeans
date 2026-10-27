import { BaseComponent } from '../base-component.js';
import { createSiteLogo } from '../site-logo/site-logo.js';
import { store } from '../../../modules/store.js';
import { createThemeToggle } from '../theme-toggle/theme-toggle.js';

const template = window.Handlebars.compile(`
  <header class="site-header site-header--minimal">
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
    const logoMark = document.createElement('img');
    logoMark.src = new URL('../../../media/auth/logo-mark.svg', import.meta.url).href;
    logoMark.width = 30;
    logoMark.height = 30;
    logoMark.alt = '';
    element.querySelector('.site-header__brand').append(logoMark, createSiteLogo());
    element.refreshAuthActions = () => this.renderActions(element);
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
      actions.replaceChildren(createThemeToggle(), loginLink, status);
      return;
    }

    const account = document.createElement('a');account.className = 'site-header__account';
    account.href = '/profile';account.dataset.link = '';account.setAttribute('aria-label', 'Открыть мой профиль');
    account.title = 'Мой профиль';if (location.pathname === '/profile') account.setAttribute('aria-current', 'page');
    const name = user.username || user.name || user.email || 'Пользователь';
    const avatar = document.createElement('span');avatar.className = 'site-header__user-avatar';avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = name.split(/\s+/).slice(0,2).map(part => part[0]).join('');
    const username = document.createElement('span');username.className = 'site-header__username';username.textContent = name;
    account.append(avatar, username);actions.replaceChildren(createThemeToggle(), account, status);
  }
}
export const createSiteHeader = (options) => new SiteHeader(options).render();
