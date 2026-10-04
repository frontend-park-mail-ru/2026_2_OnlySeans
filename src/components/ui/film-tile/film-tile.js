import { BaseComponent } from '../base-component.js';
import { coverProps, watchCovers } from '../film-cover/film-cover.js';

const template = window.Handlebars.compile(`
  <a class="film-tile" href="/film?id={{id}}" data-link>
    <div class="film-tile__cover">{{> filmCover cover}}</div>
    <h3 class="film-tile__title">{{title}}</h3>
    <p class="film-tile__meta">{{meta}}</p>
  </a>
`);

export class FilmTile extends BaseComponent {
  constructor(movie) {
    super(template, {
      id: movie.id,
      title: movie.title,
      meta: [movie.year, movie.genres[0]].filter(Boolean).join(', '),
      cover: coverProps(movie),
    });
  }

  create() {
    if (this.element) return this.element;

    const element = super.create();
    watchCovers(element);

    return element;
  }
}

export const createFilmTile = (movie) => new FilmTile(movie).render();

export const createFilmGrid = (movies) => {
  const grid = document.createElement('div');
  grid.className = 'film-grid';
  grid.append(...movies.map(createFilmTile));

  return grid;
};
