import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { displayName } from '../../services/session.js';
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
      onProfile: location.pathname === '/profile',
      loginHref: loginPathHere(),
    };
  }

  onRender() {
    this.insert('logo', new Logo());
    this.watch(store.watch('user', () => this.update()));
  }

  syncRoute() {
    const { loginHref, onProfile } = this.context();
    this.find('.site-header__login')?.setAttribute('href', loginHref);
    const account = this.find('.site-header__account');
    if (account && onProfile) account.setAttribute('aria-current', 'page');
    else account?.removeAttribute('aria-current');
  }
}
