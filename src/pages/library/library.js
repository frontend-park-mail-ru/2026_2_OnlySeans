import { renderTemplate } from '../../components/ui/render-template.js';
import { createSiteHeader } from '../../components/ui/site-header/site-header.js';
import { createMovieCard } from '../../components/ui/movie-card/movie-card.js';
import { MovieFilters } from '../../components/ui/movie-filters/movie-filters.js';
import { getMovies } from '../../api/movies.js';
import { getFiltersFromUrl, SEARCH_PLACEHOLDER } from '../../services/movies.js';
const template = window.Handlebars.compile(`
  <div class="discover-page media-library"><div class="discover-page__layout">
    <aside class="discover-page__sidebar" aria-label="Поиск и фильтры"><div class="discover-page__controls"></div></aside>
    <main class="discover-page__main">
      <a class="movie-category__back" href="/discover" data-link>← Все подборки</a>
      <div class="movie-category__heading"><p class="discover-page__eyebrow">ВСЯ МЕДИАТЕКА</p><h1>{{title}}</h1><p class="discover-page__lead">{{description}}</p></div>
      <p class="movie-category__status" role="status">Загружаем медиатеку…</p><div class="movie-category__grid"></div>
    </main></div><footer class="discover-page__footer"><span>ONLYSEANS · Вся медиатека в одном месте</span><span>Демонстрационный каталог · Оценки условные</span></footer>
  </div>
`);
export class LibraryPage {
  constructor({ navigate }) {
    this.navigate = navigate;
    this.filters = getFiltersFromUrl();
    this.isSearch = window.location.pathname === '/search';
    this.query = (new URLSearchParams(window.location.search).get('q') || '').trim();
  }
  render() {
    const title = this.isSearch ? (this.query ? 'Поиск: «' + this.query + '»' : 'Поиск по медиатеке') : 'Медиатека';
    document.title = title + ' — OnlySeans';
    this.page = renderTemplate(template, { title, description: this.isSearch ? 'Фильмы, актёры и режиссёры.' : 'Все фильмы и сериалы демонстрационного каталога.' });
    this.page.prepend(createSiteHeader({ navigate: this.navigate }));
    getMovies().then((movies) => {
      if (this.destroyed) return;
      const filters = new MovieFilters({ years: movies.map((movie) => movie.year), values: this.filters });
      filters.mount(this.page.querySelector('.discover-page__controls'));
      const result = this.isSearch ? [] : movies;
      this.page.querySelector('.movie-category__grid').replaceChildren(...result.map(createMovieCard));
      this.page.querySelector('.movie-category__status').textContent = this.isSearch ? SEARCH_PLACEHOLDER : 'В каталоге: ' + movies.length;
    }).catch(() => { if (!this.destroyed) this.page.querySelector('.movie-category__status').textContent = 'Не удалось загрузить медиатеку. Обновите страницу.'; });
    return this.page;
  }
  destroy() { this.destroyed = true; }
}
