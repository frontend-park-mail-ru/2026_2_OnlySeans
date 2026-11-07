import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { readLibrary, watchLibrary } from '../../services/library.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./sidebar.css', import.meta.url));
const template = await loadTemplate(new URL('./Sidebar.hbs', import.meta.url));

const GROUPS = [
  {
    caption: 'Каталог',
    links: [
      { href: '/', text: 'Главная', icon: 'home' },
      { href: '/films', text: 'Фильмы', icon: 'films' },
      { href: '/series', text: 'Сериалы', icon: 'series' },
      { href: '/collections', text: 'Подборки', icon: 'grid' },
    ],
  },
  {
    caption: 'Моё кино',
    forUser: true,
    links: [
      { href: '/profile', text: 'Мой профиль', icon: 'user' },
      { href: '/watch-later', text: 'Смотреть позже', icon: 'clock', count: 'watchlater' },
      { href: '/watched', text: 'Просмотрено', icon: 'eye' },
      { href: '/favorites', text: 'Избранное', icon: 'heart', count: 'favorite' },
    ],
  },
];

const countLabel = (count) => (count > 99 ? '99+' : count || '');

export class Sidebar extends Component {
  static template = template;

  context() {
    const user = store.get('user');
    const library = readLibrary();
    const groups = GROUPS.filter((group) => !group.forUser || user).map((group) => ({
      caption: group.caption,
      links: group.links.map((link) => ({
        ...link,
        active: link.href === location.pathname,
        count: link.count ? countLabel(library[link.count].length) : '',
      })),
    }));
    return { groups, collapsed: this.props.collapsed };
  }

  onRender() {
    this.delegate('click', '.sidebar__toggle', () => this.props.onToggle());
    this.watch(store.watch('user', () => this.update()));
    this.watch(watchLibrary(() => this.update()));
  }

  syncRoute() {
    this.findAll('.sidebar__link').forEach((link) => {
      if (link.getAttribute('href') === location.pathname)
        link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}
