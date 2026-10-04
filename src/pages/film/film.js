import { BaseComponent } from '../../components/ui/base-component.js';
import { renderTemplate } from '../../components/ui/render-template.js';
import { createPageShell, loadData } from '../../components/ui/page-shell/page-shell.js';
import { coverProps, watchCovers } from '../../components/ui/film-cover/film-cover.js';
import { createFilmGrid } from '../../components/ui/film-tile/film-tile.js';
import { createListToggle } from '../../components/ui/list-toggle/list-toggle.js';
import { getMovie, getMovies } from '../../api/movies.js';
import { findSimilar } from '../../services/movies.js';
import { LISTS } from '../../services/library.js';

const template = window.Handlebars.compile(`
  <div class="film">
    <a class="page-back" href="/films" data-link>‹ Фильмы</a>
    <p class="page-status" role="status">Загружаем фильм…</p>
    <div class="film__content"></div>
  </div>
`);

const detailsTemplate = window.Handlebars.compile(`
  <div>
    <div class="film__details">
      <div class="film__poster">{{> filmCover cover}}</div>
      <div class="film__info">
        <h1 class="page-title">{{title}}</h1>
        <p class="page-subtitle">{{sub}}</p>
        <div class="film__actions">
          {{#if trailer}}<a class="button film__trailer" href="{{trailer}}" target="_blank" rel="noopener">Смотреть трейлер</a>{{/if}}
        </div>
        <h2 class="film__heading">{{heading}}</h2>
        <dl class="film__facts">
          {{#each facts}}<div><dt>{{label}}</dt><dd>{{value}}</dd></div>{{/each}}
        </dl>
        <p class="film__description">{{description}}</p>
      </div>
    </div>
    <section class="film__similar" hidden>
      <h2 class="section-title">Похожее</h2>
    </section>
  </div>
`);

const toFacts = (movie) => [
  { label: 'Год', value: movie.year },
  { label: 'Жанр', value: movie.genres.join(', ') },
  { label: 'Длительность', value: movie.durationMinutes ? `${movie.durationMinutes} мин` : '' },
  { label: 'Возраст', value: `${movie.ageLimit}+` },
].filter((fact) => fact.value);

export class FilmPage extends BaseComponent {
  constructor({ navigate }) {
    super(template, {});
    this.navigate = navigate;
    this.id = Number(new URLSearchParams(window.location.search).get('id'));
  }

  render() {
    document.title = 'Фильм — Frame';

    const content = this.create();
    loadData(content, Promise.all([getMovie(this.id), getMovies()]), ([movie, movies]) => {
      document.title = `${movie.title} — Frame`;
      content.querySelector('.film__content').replaceChildren(this.createDetails(movie, movies));
    });

    return createPageShell({ navigate: this.navigate, content });
  }

  createDetails(movie, movies) {
    const isSeries = movie.type === 'series';
    const details = renderTemplate(detailsTemplate, {
      ...movie,
      sub: [movie.englishTitle, movie.year].filter(Boolean).join(', '),
      heading: isSeries ? 'О сериале' : 'О фильме',
      facts: toFacts(movie),
      cover: coverProps(movie),
    });
    watchCovers(details);

    const shared = { movieId: movie.id };
    details.querySelector('.film__actions').append(
      createListToggle({ ...shared, list: LISTS.WATCHLIST, addText: 'Буду смотреть', removeText: 'В списке' }),
      createListToggle({ ...shared, list: LISTS.FAVORITES, addText: 'В избранное', removeText: 'В избранном' }),
    );

    const similar = findSimilar(movie, movies);
    if (similar.length) {
      const section = details.querySelector('.film__similar');
      section.hidden = false;
      section.appendChild(createFilmGrid(similar));
    }

    return details;
  }
}
