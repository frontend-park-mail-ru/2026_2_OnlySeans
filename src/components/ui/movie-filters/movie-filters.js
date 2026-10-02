import { BaseComponent } from '../base-component.js';
import { createButton } from '../button/button.js';
import { RangeField } from '../range-field/range-field.js';
import { FilterList } from '../filter-list/filter-list.js';
import { GENRES, COUNTRIES, MEDIA_TYPES, SEARCH_PLACEHOLDER } from '../../../services/movies.js';
const template = window.Handlebars.compile(`
  <section class="movie-filters" aria-labelledby="filters-title">
    <h2 id="filters-title">Поиск по фильтрам</h2>
    <p class="movie-filters__description">По всей медиатеке</p>
    <form><div class="movie-filters__categories"></div><div class="movie-filters__ranges"></div><div class="movie-filters__lists"></div>
      <p class="movie-filters__hint">+ включить · − исключить</p>
      <div class="movie-filters__actions"></div>
    </form><p class="movie-filters__status" role="status"></p>
  </section>
`);
export class MovieFilters extends BaseComponent {
  constructor({ years, values = {} }) { super(template, {}); this.years = years; this.values = values; }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    const minYear = 1950;
    const maxYear = Math.max(...this.years, new Date().getFullYear());
    this.ranges = [
      new RangeField({ name: 'year', label: 'Год выхода', min: minYear, max: maxYear, from: this.values.yearFrom ?? minYear, to: this.values.yearTo ?? maxYear }),
      new RangeField({ name: 'rating', label: 'Оценка', min: 0, max: 10, step: .1, from: this.values.ratingFrom ?? 0, to: this.values.ratingTo ?? 10 }),
    ];
    this.ranges.forEach((range) => range.mount(element.querySelector('.movie-filters__ranges')));
    this.categories = new FilterList({ name: 'Types', label: 'Категории', options: MEDIA_TYPES, buttonsOnly: true, included: this.values.includeTypes || [], excluded: this.values.excludeTypes || [] });
    this.categories.mount(element.querySelector('.movie-filters__categories'));
    this.lists = [['Genres','Жанры',GENRES],['Countries','Страны',COUNTRIES]].map(([name,label,options]) =>
      new FilterList({ name, label, options, included: this.values['include' + name] || [], excluded: this.values['exclude' + name] || [] }));
    this.lists.forEach((list) => list.mount(element.querySelector('.movie-filters__lists')));
    const submit = createButton({ text: 'Найти в медиатеке', type: 'submit' });
    const reset = createButton({ text: 'Сбросить' });
    reset.className = 'movie-filters__reset';
    reset.addEventListener('click', () => {
      this.ranges.forEach((range) => range.reset());
      this.lists.forEach((list) => list.reset());
      this.categories.reset();
      this.setStatus('');
    });
    element.querySelector('.movie-filters__actions').append(submit, reset);
    element.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.setStatus(SEARCH_PLACEHOLDER);
    });
    return element;
  }
  setStatus(message) { this.create().querySelector('.movie-filters__status').textContent = message; }
}
