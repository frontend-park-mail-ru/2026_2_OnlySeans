import './sidebar.css';
import templateSource from './Sidebar.hbs';
import { Component } from '../../core/component.js';
import { store } from '../../core/store.js';
import { readLibrary, watchLibrary } from '../../services/library.js';
import { loadAssets } from '../../core/assets.js';
import { Icon } from '../../core/icons.js';
import { Logo } from '../logo/Logo.js';
import type { LibraryList } from '../../services/library.js';

const template = await loadAssets({ template: templateSource });

const GROUPS: {
  caption: string;
  forUser?: boolean;
  links: { href: string; text: string; icon: string; count?: LibraryList }[];
}[] = [
  {
    caption: 'Каталог',
    links: [
      { href: '/', text: 'Главная', icon: Icon.HOME },
      { href: '/films', text: 'Фильмы', icon: Icon.FILMS },
      { href: '/series', text: 'Сериалы', icon: Icon.SERIES },
      { href: '/collections', text: 'Подборки', icon: Icon.GRID },
      { href: '/genres', text: 'Жанры', icon: Icon.TAG },
      { href: '/upcoming', text: 'Скоро в кино', icon: Icon.CALENDAR },
      { href: '/map', text: 'Карта съёмок', icon: Icon.MAP },
      { href: '/wheel', text: 'Что посмотреть', icon: Icon.FILMS },
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
      { href: '/admin', text: 'Управление каталогом', icon: Icon.SETTINGS },
    ],
  },
  {
    caption: 'Приложение',
    links: [{ href: '/settings', text: 'Настройки', icon: Icon.SETTINGS }],
  },
];

const countLabel = (count: number) => (count >= 99 ? '99+' : count || '');

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
        current: link.href === location.pathname ? 'page' : 'false',
        count: link.count ? countLabel(library[link.count].length) : '',
      })),
    }));
    return {
      groups,
      collapsed: this.props.collapsed,
      toggleLabel: this.props.collapsed
        ? 'Развернуть панель навигации'
        : 'Свернуть панель навигации',
    };
  }

  onRender() {
    this.insert('logo', new Logo());
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
