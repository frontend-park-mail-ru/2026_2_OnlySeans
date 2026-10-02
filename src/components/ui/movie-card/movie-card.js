import { BaseComponent } from '../base-component.js';
import { getGenreLabel } from '../../../services/movies.js';

const template = window.Handlebars.compile(`
  <article class="movie-card">
    <div class="movie-card__cover">
      <img class="movie-card__poster" src="{{poster}}" alt="Постер: {{title}}" loading="lazy" decoding="async" width="360" height="540">
      <span class="movie-card__fallback" hidden>Постер недоступен</span>
    </div>
    <div class="movie-card__body">
      <div class="movie-card__meta"><span>{{year}} · {{typeLabel}}</span><span class="movie-card__rating" aria-label="Демонстрационная оценка {{rating}} из 10">★ {{rating}}</span></div>
      <h3 title="{{title}}">{{title}}</h3>
      <p class="movie-card__genres">{{genreLabels}}</p>
      <p class="movie-card__description">{{description}}</p>
    </div>
  </article>
`);

export class MovieCard extends BaseComponent {
  constructor(movie) {
    super(template, {
      ...movie, rating: movie.rating.toFixed(1),
      typeLabel: movie.type === 'series' ? 'Сериал' : 'Фильм',
      genreLabels: movie.genres.map(getGenreLabel).join(' · '),
    });
  }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    const image = element.querySelector('img');
    const fallback = () => { image.hidden = true; element.querySelector('.movie-card__fallback').hidden = false; };
    image.addEventListener('error', fallback);
    return element;
  }
}

export const createMovieCard = (movie) => new MovieCard(movie).render();
