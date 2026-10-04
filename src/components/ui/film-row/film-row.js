import { BaseComponent } from '../base-component.js';
import { coverProps, watchCovers } from '../film-cover/film-cover.js';
import { createListToggle } from '../list-toggle/list-toggle.js';
import { LISTS } from '../../../services/library.js';

const template = window.Handlebars.compile(`
  <article class="film-row">
    <span class="film-row__number">{{number}}</span>
    <a class="film-row__cover" href="/film?id={{id}}" data-link tabindex="-1" aria-hidden="true">{{> filmCover cover}}</a>
    <div class="film-row__info">
      <a class="film-row__title" href="/film?id={{id}}" data-link>{{title}}</a>
      <p class="film-row__text">{{sub}}</p>
      <p class="film-row__text">{{genreLabels}}</p>
    </div>
    <div class="film-row__actions"></div>
  </article>
`);

export class FilmRow extends BaseComponent {
  constructor(movie, { number, navigate, onChange }) {
    super(template, {
      id: movie.id,
      number,
      title: movie.title,
      sub: [movie.englishTitle, movie.year].filter(Boolean).join(', '),
      genreLabels: movie.genres.join(', '),
      cover: coverProps(movie),
    });
    this.movie = movie;
    this.navigate = navigate;
    this.onChange = onChange;
  }

  create() {
    if (this.element) return this.element;

    const element = super.create();
    watchCovers(element);

    const shared = { movieId: this.movie.id, navigate: this.navigate, onChange: this.onChange };
    element.querySelector('.film-row__actions').append(
      createListToggle({ ...shared, list: LISTS.WATCHLIST, addText: 'Буду смотреть', removeText: 'Убрать' }),
      createListToggle({ ...shared, list: LISTS.FAVORITES, addText: 'В избранное', removeText: 'В избранном' }),
    );

    return element;
  }
}

export const createFilmRows = (movies, options) => {
  const list = document.createElement('div');
  list.className = 'film-rows';
  list.append(...movies.map((movie, index) => new FilmRow(movie, { ...options, number: index + 1 }).render()));

  return list;
};
