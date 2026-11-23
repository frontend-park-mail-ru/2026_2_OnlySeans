import './site-header.css';
import templateSource from './SiteHeader.hbs';
import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { displayName } from '../../services/session.js';
import { loginPathHere } from '../../services/auth-return.js';
import { Logo } from '../logo/Logo.js';
import { loadAssets } from '../../core/assets.js';
import { getAvatar } from '../../api/avatar.js';
import { SearchField } from '../search-field/SearchField.js';

const template = await loadAssets({ template: templateSource });

export class SiteHeader extends Component {
  static template = template;

  #avatarUserId = null;
  #search: SearchField;

  context() {
    const user = store.get('user');
    const name = displayName(user);
    const avatar = store.get('avatar');
    return {
      user,
      name,
      avatar: user && avatar?.userId === user.id ? avatar.url : '',
      onProfile: location.pathname === '/profile',
      current: location.pathname === '/profile' ? 'page' : 'false',
      loginHref: loginPathHere(),
    };
  }

  onRender() {
    this.insert('logo', new Logo({ compact: true }));
    const search = this.insert('search', new SearchField({ navigate: this.props.navigate }));
    this.#search = search;
    const closeSearch = () => {
      this.element.classList.remove('site-header--searching');
      this.find('.site-header__search').setAttribute('aria-expanded', 'false');
    };
    this.delegate('click', '.site-header__search', () => {
      const open = this.element.classList.toggle('site-header--searching');
      this.find('.site-header__search').setAttribute('aria-expanded', String(open));
      if (open) search.focus();
    });
    this.on('keydown', (event) => {
      if (event.key === 'Escape' && this.element.classList.contains('site-header--searching')) {
        closeSearch();
        this.find('.site-header__search').focus();
      }
    });
    this.watch(store.watch('user', () => this.update()));
    this.watch(store.watch('avatar', () => this.update()));
    this.#loadAvatar();
  }

  async #loadAvatar() {
    const userId = store.get('user')?.id;
    if (userId === this.#avatarUserId) return;
    this.#avatarUserId = userId;
    if (!userId) return;
    const current = store.get('avatar');
    const url = await getAvatar().catch(() => '');
    if (store.get('user')?.id === userId && store.get('avatar') === current)
      store.set({ avatar: { userId, url } });
  }

  syncRoute() {
    this.#search.syncRoute();
    this.element.classList.remove('site-header--searching');
    this.find('.site-header__search').setAttribute('aria-expanded', 'false');
    const { loginHref, onProfile } = this.context();
    this.find('.site-header__login')?.setAttribute('href', loginHref);
    const account = this.find('.site-header__account');
    if (account && onProfile) account.setAttribute('aria-current', 'page');
    else account?.removeAttribute('aria-current');
  }
}
