import { BaseComponent } from '../base-component.js';

const ITEMS = [
  { href: '/', label: 'Главная', icon: 'M3 11 12 3l9 8v10H3z' },
  { href: '/films', label: 'Фильмы', icon: 'M6 4l14 8-14 8z' },
  { href: '/series', label: 'Сериалы', icon: 'M3 5h18v12H3zM8 21h8' },
  { href: '/collections', label: 'Подборки', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { href: '/favorites', label: 'Избранное', icon: 'M6 3h12v18l-6-5-6 5z' },
  { href: '/watchlist', label: 'Буду смотреть', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l4 2' },
];

const template = window.Handlebars.compile(`
  <nav class="side-menu" aria-label="Основное меню">
    {{#each items}}
      <a class="side-menu__item" href="{{href}}" data-link {{#if active}}aria-current="page"{{/if}}>
        <svg class="side-menu__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="{{icon}}"/></svg>
        <span>{{label}}</span>
      </a>
    {{/each}}
  </nav>
`);

export class SideMenu extends BaseComponent {
  constructor() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    super(template, { items: ITEMS.map((item) => ({ ...item, active: item.href === path })) });
  }
}

export const createSideMenu = () => new SideMenu().render();
