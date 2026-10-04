import { BaseComponent } from '../base-component.js';
import { getGenreLabel } from '../../../services/movies.js';

const template = window.Handlebars.compile(`
  <article class="movie-card" data-movie-id="{{id}}">
    <div class="movie-card__cover">
      <img class="movie-card__poster" src="{{poster}}" alt="Постер: {{title}}" loading="lazy" decoding="async" width="360" height="900">
      <span class="movie-card__fallback" hidden>Постер недоступен</span>
    </div>
    <div class="movie-card__body">
      <div class="movie-card__info">
      <div class="movie-card__meta"><span>{{year}} · {{typeLabel}}</span><span class="movie-card__rating">★ {{rating}}</span></div>
      <h3>{{title}}</h3>
      <p class="movie-card__english-title" lang="en">{{englishTitle}}</p>
      <p class="movie-card__runtime">{{#if isSeries}}{{#if hasEpisodeInfo}}{{seasonsLabel}} · {{episodesLabel}}{{/if}}{{#if episodeDurationLabel}}<span class="movie-card__series-runtime">{{episodeDurationLabel}}/серия</span>{{/if}}{{else}}{{durationLabel}}{{/if}}</p>
      <p class="movie-card__genres">{{genreLabels}}</p>
      <dl class="movie-card__credits"><div><dt>Режиссёр</dt><dd>{{directorLabel}}</dd></div><div><dt>Продюсер</dt><dd>{{producerLabel}}</dd></div></dl>
      </div>
      <div class="movie-card__description"><p class="movie-card__description-text" tabindex="0" role="region" aria-label="Описание: {{title}}">{{description}}</p></div>
    </div>
  </article>
`);
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (hours ? hours + ' ч' : '') + (rest ? (hours ? ' ' : '') + rest + ' мин' : '');
};
const plural = (count, forms) => {
  const last = count % 10, lastTwo = count % 100;
  return count + ' ' + forms[lastTwo >= 11 && lastTwo <= 14 ? 2 : last === 1 ? 0 : last >= 2 && last <= 4 ? 1 : 2];
};
export class MovieCard extends BaseComponent {
  constructor(movie) {
    const hasEpisodeInfo = Number.isFinite(movie.seasons) && Number.isFinite(movie.episodes);
    super(template, { ...movie, isSeries: movie.type === 'series',
      hasEpisodeInfo,
      seasonsLabel: plural(movie.seasons || 0, ['сезон', 'сезона', 'сезонов']),
      episodesLabel: plural(movie.episodes || 0, ['серия', 'серии', 'серий']),
      durationLabel: formatDuration(movie.durationMinutes || 0),
      episodeDurationLabel: movie.episodeMinutes ? `≈ ${formatDuration(movie.episodeMinutes)}` : '',
      directorLabel: (movie.directors || []).join(', ') || 'Нет данных', producerLabel: (movie.producers || []).join(', ') || 'Не указан', rating: Number.isFinite(movie.rating) ? movie.rating.toFixed(1) : '—',
      typeLabel: movie.type === 'series' ? 'Сериал' : 'Фильм', genreLabels: movie.genres.map(getGenreLabel).join(' · ') });
  }
  create() {
    if (this.element) return this.element;
    const element = super.create();
    const image = element.querySelector('img');
    image.addEventListener('error', () => { image.hidden = true; element.querySelector('.movie-card__fallback').hidden = false; });
    return element;
  }
}
export const createMovieCard = (movie) => new MovieCard(movie).render();
