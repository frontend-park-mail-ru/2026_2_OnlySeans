import { BaseComponent } from '../base-component.js';
import { createSiteLogo } from '../site-logo/site-logo.js';
import { store } from '../../../modules/store.js';
import { createThemeToggle } from '../theme-toggle/theme-toggle.js';
import { element } from '../../../utils/dom.js';

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
    const header = super.create();
    const logoMark = element('img');
    logoMark.src = new URL('../../../media/auth/logo-mark.svg', import.meta.url).href;
    logoMark.width = 30;
    logoMark.height = 30;
    logoMark.alt = '';
    header.querySelector('.site-header__brand').append(logoMark, createSiteLogo());
    this.renderActions(header);
    this.watchUser(header);
    return header;
  }

  // шапка сама перерисовывается при входе, выходе и истёкшей сессии;
  // отписку вызывает боковая панель, вместе с которой шапка живёт и удаляется
  watchUser(header) {
    header.disposeUserWatch = store.watch('user', () => this.renderActions(header));
  }

  renderActions(header) {
    const actions = header.querySelector('.site-header__actions');
    const status = header.querySelector('.site-header__status');
    const user = store.get('user');
    if (!user) {
      const loginLink = element('a', 'site-header__login');
      loginLink.href = '/login';
      loginLink.dataset.link = '';
      loginLink.textContent = 'Войти';
      actions.replaceChildren(createThemeToggle(), loginLink, status);
      return;
    }

    const account = element('span', 'site-header__account');
    const name = user.username || user.name || user.email || 'Пользователь';
    const avatar = element('span', 'site-header__user-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('');
    const username = element('span', 'site-header__username', name);
    account.append(avatar, username);
    actions.replaceChildren(createThemeToggle(), account, status);
  }
}
export const createSiteHeader = (options) => new SiteHeader(options).render();
