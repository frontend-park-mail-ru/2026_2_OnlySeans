import { renderTemplate } from '../../components/ui/render-template.js';
import { createSiteHeader } from '../../components/ui/site-header/site-header.js';
import { MovieFilters } from '../../components/ui/movie-filters/movie-filters.js';
import { MovieCollection } from '../../components/ui/movie-collection/movie-collection.js';
import { getMovies } from '../../api/movies.js';
import { getFiltersFromUrl, getCategoryUrl, MOVIE_CATEGORIES, selectCategoryMovies, shuffleMovies } from '../../services/movies.js';
import { store } from '../../modules/store.js';
const template = window.Handlebars.compile(`
  <div class="discover-page"><div class="discover-page__layout">
    <aside class="discover-page__sidebar" aria-label="Поиск и фильтры"><div class="discover-page__controls"></div></aside>
    <main class="discover-page__main">
      <section class="discover-page__intro" aria-labelledby="discover-title">
        <h1 id="discover-title">Хороший вечер<br>начинается <span>с кино.</span></h1>
      </section>
      <p class="discover-page__load-status" role="status">Загружаем подборки…</p>
      <div class="discover-page__collections"></div>
    </main></div>
    <footer class="discover-page__footer"><span>Демонстрационный каталог · Оценки условные</span></footer>
  </div>
`);
export class DiscoverPage {
  constructor({ navigate }) { this.navigate = navigate; this.movies = []; this.filters = getFiltersFromUrl(); }
  render() {
    document.title = 'Что посмотреть — OnlySeans';
    this.page = renderTemplate(template, {});
    this.page.prepend(createSiteHeader({ navigate: this.navigate }));
    const parent = this.page.querySelector('.discover-page__collections');
    this.collections = MOVIE_CATEGORIES.map((category) => new MovieCollection({ id: category.id, href: getCategoryUrl(category.id), eyebrow: category.eyebrow, title: category.title, subtitle: category.description }));
    this.collections.forEach((collection) => collection.mount(parent));
    getMovies().then((movies) => {
      if (this.destroyed) return;
      this.movies = movies;
      this.randomMovies = shuffleMovies(movies.filter((movie) => movie.type === 'movie'));
      this.filtersComponent = new MovieFilters({ years: movies.map((movie) => movie.year), values: this.filters });
      this.filtersComponent.mount(this.page.querySelector('.discover-page__controls'));
      this.page.querySelector('.discover-page__load-status').hidden = true;
      this.updateCollections();
      this.stopUserWatch = store.watch('user', () => this.updateCollections());
    }).catch(() => { if (!this.destroyed) this.page.querySelector('.discover-page__load-status').textContent = 'Не удалось загрузить каталог. Обновите страницу.'; });
    return this.page;
  }
  updateCollections() {
    MOVIE_CATEGORIES.forEach((category, index) => {
      const recommended = category.id === 'recommended';
      this.collections[index].update(selectCategoryMovies(recommended ? this.randomMovies : this.movies, category), 'Подборка пока пуста.',
        { href: getCategoryUrl(category.id), locked: recommended && !store.get('user') });
    });
  }
  destroy() { this.destroyed = true; this.stopUserWatch?.(); this.collections?.forEach((collection) => collection.remove()); }
}
