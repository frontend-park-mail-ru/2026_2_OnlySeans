import './sidebar.css';
import templateSource from './Sidebar.hbs';
import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { readLibrary, watchLibrary } from '../../services/library.js';
import { loadAssets } from '../../core/assets.js';
import { Icon } from '../../core/icons.js';

const template = await loadAssets({ template: templateSource });

const GROUPS = [
  {
    caption: 'Каталог',
    links: [
      { href: '/', text: 'Главная', icon: Icon.HOME },
      { href: '/films', text: 'Фильмы', icon: Icon.FILMS },
      { href: '/series', text: 'Сериалы', icon: Icon.SERIES },
      { href: '/collections', text: 'Подборки', icon: Icon.GRID },
    ],
  },
  {
    caption: 'Моё кино',
    forUser: true,
    links: [
      { href: '/profile', text: 'Мой профиль', icon: Icon.USER },
      { href: '/watch-later', text: 'Смотреть позже', icon: Icon.CLOCK, count: 'watchlater' },
      { href: '/watched', text: 'Просмотрено', icon: Icon.EYE },
      { href: '/favorites', text: 'Избранное', icon: Icon.HEART, count: 'favorite' },
    ],
  },
];

const countLabel = (count) => (count >= 99 ? '99+' : count || '');

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
