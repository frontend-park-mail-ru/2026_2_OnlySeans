import { BaseComponent } from '../../components/ui/base-component.js';
import { createPageShell, loadData } from '../../components/ui/page-shell/page-shell.js';
import { createFilmRows } from '../../components/ui/film-row/film-row.js';
import { createSelect, createTabs, toItems } from '../../components/ui/filters/filters.js';
import { getCollection } from '../../api/movies.js';
import { collectGenres, collectYears, countLabel, filterMovies } from '../../services/movies.js';

const TYPES = [
  { value: '', label: 'Все' },
  { value: 'movie', label: 'Фильмы' },
  { value: 'series', label: 'Сериалы' },
];

const template = window.Handlebars.compile(`
  <div class="collection">
    <aside class="collection__filters">
      <a class="page-back" href="/collections" data-link>‹ Все подборки</a>
      <div class="collection__controls"></div>
    </aside>
    <div class="collection__main">
      <h1 class="page-title"></h1>
      <p class="page-subtitle collection__description"></p>
      <p class="page-subtitle collection__count"></p>
      <p class="page-status" role="status">Загружаем подборку…</p>
      <div class="collection__list"></div>
    </div>
  </div>
`);

export class CollectionPage extends BaseComponent {
  constructor({ navigate }) {
    super(template, {});
    this.navigate = navigate;
    this.id = Number(new URLSearchParams(window.location.search).get('id'));
    this.filters = {};
  }

  render() {
    document.title = 'Подборка — Frame';

    const content = this.create();
    loadData(content, getCollection(this.id), (collection) => {
      document.title = `${collection.title} — Frame`;
      this.movies = collection.movies;
      content.querySelector('.page-title').textContent = collection.title;
      content.querySelector('.collection__description').textContent = collection.description;
      this.addFilters(content);
      this.show(content);
    });

    return createPageShell({ navigate: this.navigate, content });
  }

  addFilters(content) {
    const update = (patch) => {
      this.filters = { ...this.filters, ...patch };
      this.show(content);
    };

    content.querySelector('.collection__controls').append(
      createTabs({ label: 'Тип', items: TYPES, onChange: (type) => update({ type }) }),
      createSelect({
        label: 'Жанры',
        items: toItems(collectGenres(this.movies), 'Все жанры'),
        onChange: (genre) => update({ genre }),
      }),
      createSelect({
        label: 'Годы',
        items: toItems(collectYears(this.movies), 'Все годы'),
        onChange: (year) => update({ year }),
      }),
    );
  }

  show(content) {
    const movies = filterMovies(this.movies, this.filters);

    content.querySelector('.collection__count').textContent = countLabel(movies);
    content.querySelector('.page-status').textContent = movies.length ? '' : 'Ничего не найдено.';
    content.querySelector('.collection__list').replaceChildren(
      createFilmRows(movies, { navigate: this.navigate }),
    );
  }
}
