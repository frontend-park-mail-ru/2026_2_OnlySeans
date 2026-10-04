import { BaseComponent } from '../../components/ui/base-component.js';
import { createPageShell, loadData } from '../../components/ui/page-shell/page-shell.js';
import { createFilmGrid } from '../../components/ui/film-tile/film-tile.js';
import { createSelect, createTabs, toItems } from '../../components/ui/filters/filters.js';
import { getMovies } from '../../api/movies.js';
import { collectGenres, collectYears, filterMovies, plural } from '../../services/movies.js';

const template = window.Handlebars.compile(`
  <div class="catalog">
    <h1 class="page-title">{{title}}</h1>
    <div class="page-toolbar">
      <div class="catalog__genres"></div>
      <div class="catalog__years"></div>
    </div>
    <p class="page-subtitle"></p>
    <p class="page-status" role="status">Загружаем каталог…</p>
    <div class="catalog__list"></div>
  </div>
`);

class CatalogPage extends BaseComponent {
  constructor({ navigate }, { type, title, forms }) {
    super(template, { title });
    this.navigate = navigate;
    this.title = title;
    this.forms = forms;
    this.filters = { type, query: new URLSearchParams(window.location.search).get('q') || '' };
  }

  render() {
    document.title = `${this.title} — Frame`;

    const content = this.create();
    loadData(content, getMovies(), (movies) => {
      this.movies = filterMovies(movies, { type: this.filters.type });
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

    content.querySelector('.catalog__genres').appendChild(createTabs({
      label: 'Жанры',
      items: toItems(collectGenres(this.movies), 'Все'),
      onChange: (genre) => update({ genre }),
    }));
    content.querySelector('.catalog__years').appendChild(createSelect({
      label: 'Год',
      items: toItems(collectYears(this.movies), 'Все годы'),
      onChange: (year) => update({ year }),
    }));
  }

  show(content) {
    const movies = filterMovies(this.movies, this.filters);
    const { query } = this.filters;

    content.querySelector('.page-subtitle').textContent = plural(movies.length, this.forms)
      + (query ? ` по запросу «${query}»` : '');
    content.querySelector('.page-status').textContent = movies.length ? '' : 'Ничего не найдено.';
    content.querySelector('.catalog__list').replaceChildren(createFilmGrid(movies));
  }
}

export class FilmsPage extends CatalogPage {
  constructor(props) {
    super(props, { type: 'movie', title: 'Фильмы', forms: ['фильм', 'фильма', 'фильмов'] });
  }
}

export class SeriesPage extends CatalogPage {
  constructor(props) {
    super(props, { type: 'series', title: 'Сериалы', forms: ['сериал', 'сериала', 'сериалов'] });
  }
}
