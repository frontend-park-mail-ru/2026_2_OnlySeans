import { renderTemplate } from '../../components/ui/render-template.js';
import { createSiteHeader } from '../../components/ui/site-header/site-header.js';
import { createMovieCard } from '../../components/ui/movie-card/movie-card.js';
import { createAuthGate } from '../../components/ui/auth-gate/auth-gate.js';
import { MovieFilters } from '../../components/ui/movie-filters/movie-filters.js';
import { getMovies } from '../../api/movies.js';
import { getFiltersFromUrl, getCategoryConfig, selectCategoryMovies, shuffleMovies } from '../../services/movies.js';
import { store } from '../../modules/store.js';
const template = window.Handlebars.compile(`
  <div class="discover-page movie-category"><div class="discover-page__layout">
    <aside class="discover-page__sidebar" aria-label="Поиск и фильтры"><div class="discover-page__controls"></div></aside>
    <main class="discover-page__main">
      <a class="movie-category__back" href="/discover" data-link>← Все подборки</a>
      <div class="movie-category__heading"><p class="discover-page__eyebrow">ВАША КОЛЛЕКЦИЯ</p><h1>{{title}}</h1><p class="discover-page__lead">{{description}}</p></div>
      <p class="movie-category__status" role="status">Загружаем фильмы…</p><div class="movie-category__grid"></div><div class="movie-category__gate"></div>
    </main></div>
    <footer class="discover-page__footer"><span>Демонстрационный каталог · Оценки условные</span></footer>
  </div>
`);
export class MovieCategoryPage {
  constructor({ navigate }) { this.navigate = navigate; this.category = window.location.pathname.split('/').pop(); }
  render() {
    const config = getCategoryConfig(this.category);
    document.title = config.title + ' — OnlySeans';
    this.page = renderTemplate(template, config);
    this.page.prepend(createSiteHeader({ navigate: this.navigate }));
    getMovies().then((movies) => {
      if (this.destroyed) return;
      this.movies = this.category === 'recommended' ? shuffleMovies(movies.filter((movie) => movie.type === 'movie')) : movies;
      const filters = new MovieFilters({ years: movies.map((movie) => movie.year), values: getFiltersFromUrl() });
      filters.mount(this.page.querySelector('.discover-page__controls'));
      this.update();
      this.stopUserWatch = store.watch('user', () => this.update());
    }).catch(() => { if (!this.destroyed) this.page.querySelector('.movie-category__status').textContent = 'Не удалось загрузить фильмы. Обновите страницу.'; });
    return this.page;
  }
  update() {
    const locked = this.category === 'recommended' && !store.get('user');
    const movies = locked ? [] : selectCategoryMovies(this.movies, getCategoryConfig(this.category));
    this.page.querySelector('.movie-category__grid').replaceChildren(...movies.map(createMovieCard));
    this.page.querySelector('.movie-category__gate').replaceChildren(...(locked ? [createAuthGate()] : []));
    this.page.querySelector('.movie-category__status').textContent = locked ? '' : 'Найдено: ' + movies.length;
  }
  destroy() { this.destroyed = true; this.stopUserWatch?.(); }
}
