import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { ConfirmDialog } from '../confirm-dialog/ConfirmDialog.js';
import { notify } from '../../services/notice.js';
import { displayName, logout } from '../../services/session.js';
import { loginPathHere } from '../../services/auth-return.js';
import { Logo } from '../logo/Logo.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./site-header.css', import.meta.url));
const template = await loadTemplate(new URL('./SiteHeader.hbs', import.meta.url));

export class SiteHeader extends Component {
  static template = template;

  context() {
    const user = store.get('user');
    const name = displayName(user);
    return {
      user,
      name,
      avatarUrl: store.get('avatarUrl'),
      onProfile: location.pathname === '/profile',
      loginHref: loginPathHere(),
    };
  }

  onRender() {
    this.insert('logo', new Logo());
    this.watch(store.watch('user', () => this.update()));
    this.watch(store.watch('avatarUrl', () => this.update()));

    const menu = this.find('.site-header__account-menu');
    if (!menu) return;
    this.on('click', (event) => {
      if (!menu.contains(event.target)) menu.open = false;
    }, document);
    this.on('keydown', (event) => {
      if (menu.open && event.key === 'Escape' && !event.defaultPrevented) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    }, document);
    this.delegate('click', '[data-account-logout]', () => this.#logout('/'));
    this.delegate('click', '[data-account-switch]', () => this.#logout('/login'));
    for (const image of this.findAll('.site-header__avatar img')) {
      const reveal = () => {
        if (!image.naturalWidth) return;
        image.hidden = false;
        image.previousElementSibling.hidden = true;
      };
      this.on('load', reveal, image);
      reveal();
    }
  }

  syncRoute() {
    const { loginHref, onProfile } = this.context();
    this.find('.site-header__login')?.setAttribute('href', loginHref);
    const menu = this.find('.site-header__account-menu');
    if (menu) menu.open = false;
    const account = this.find('.site-header__menu a[href="/profile"]');
    if (account && onProfile) account.setAttribute('aria-current', 'page');
    else account?.removeAttribute('aria-current');
  }

  async #logout(destination) {
    const menu = this.find('.site-header__account-menu');
    if (menu) menu.open = false;
    if (!await ConfirmDialog.ask({ title: 'Выйти из аккаунта?', confirmText: 'Выйти' })) return;
    try {
      await logout();
      this.props.navigate(destination);
    } catch {
      notify('Не удалось выйти. Попробуйте ещё раз.', { type: 'error' });
    }
  }
}
