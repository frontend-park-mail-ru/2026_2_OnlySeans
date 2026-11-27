import './mobile-nav.css';
import templateSource from './MobileNav.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });
const LINKS = [
  { href: '/', label: 'Главная', icon: 'home', paths: ['/'] },
  {
    href: '/films',
    label: 'Каталог',
    icon: 'films',
    paths: ['/films', '/series', '/genres', '/collections', '/film', '/person'],
  },
  { href: '/search', label: 'Поиск', icon: 'search', paths: ['/search'] },
  { href: '/upcoming', label: 'Скоро', icon: 'calendar', paths: ['/upcoming'] },
  {
    href: '/favorites',
    label: 'Моё кино',
    icon: 'user',
    paths: ['/profile', '/favorites', '/watch-later', '/watched'],
  },
];

/** Нижняя навигация мобильной версии; состояние синхронизируется с SPA-роутером. */
export class MobileNav extends Component {
  static template = template;

  context() {
    return { links: LINKS };
  }

  syncRoute() {
    this.findAll('a').forEach((link, index) => {
      const active = LINKS[index].paths.some(
        (path) =>
          location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`)),
      );
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}
