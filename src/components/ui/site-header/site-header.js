import { BaseComponent } from '../base-component.js';
import { createThemeToggle } from '../theme-toggle/theme-toggle.js';
import { store } from '../../../modules/store.js';

const template = window.Handlebars.compile(`
  <header class="site-header">
    <a class="site-header__logo" href="/discover" data-link aria-label="OnlySeans — подбор фильмов">ONLY<span>SEANS</span><small>КИНО ДЛЯ ВАШЕГО ВЕЧЕРА</small></a>
    <form class="header-search" role="search" action="/search" method="get"><label class="visually-hidden" for="header-query">Поиск фильмов, актёров и режиссёров</label><input id="header-query" name="q" type="search" value="{{query}}" placeholder="Фильмы, актёры, режиссёры" required><button class="header-search__button" type="submit">Найти</button></form>
    <nav class="site-header__nav" aria-label="Подборки"><a href="/movies/russian-films" data-link>Российские фильмы</a><a href="/movies/russian-series" data-link>Российские сериалы</a><a href="/movies/foreign-films" data-link>Зарубежные фильмы</a><a href="/movies/foreign-series" data-link>Зарубежные сериалы</a><a href="/movies/recommended" data-link>Для вас</a></nav>
    <div class="site-header__actions">{{#if userName}}<span class="site-header__user">{{userName}}</span>{{else}}<a class="site-header__login" href="/login" data-link>Войти</a>{{/if}}</div>
  </header>
`);

export class SiteHeader extends BaseComponent {
  constructor({ navigate } = {}) {
    const user = store.get('user');
    super(template, { userName: user ? user.username || user.email || 'Мой аккаунт' : '', query: new URLSearchParams(window.location.search).get('q') || '' });
    this.navigate = navigate;
  }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    element.querySelector('.site-header__actions').appendChild(createThemeToggle());
    element.querySelector('.header-search').addEventListener('submit', (event) => {
      event.preventDefault();
      const q = element.querySelector('#header-query').value.trim();
      if (!q) return;
      const url = '/search?' + new URLSearchParams({ q });
      if (this.navigate) this.navigate(url); else window.location.assign(url);
    });
    return element;
  }
}
export const createSiteHeader = (props) => new SiteHeader(props).render();
