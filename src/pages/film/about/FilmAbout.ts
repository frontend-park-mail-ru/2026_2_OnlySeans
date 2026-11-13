import './film-about.css';
import templateSource from './FilmAbout.hbs';
import { Component } from '../../../core/component.js';
import { store } from '../../../core/store.js';
import { countLabel } from '../../../core/format.js';
import { loadCatalog } from '../../../services/catalog.js';
import { SectionHeading } from '../../../components/section-heading/SectionHeading.js';
import { MovieGrid } from '../../../components/movie-grid/MovieGrid.js';
import { StatusMessage } from '../../../components/status-message/StatusMessage.js';
import { loadInto } from '../../../components/status-message/load-into.js';
import { FilmPeople } from './FilmPeople.js';
import { FilmRating } from './FilmRating.js';
import { FilmReviews } from '../reviews/FilmReviews.js';
import { loadMyReview } from '../../../services/my-review.js';
import { loadAssets } from '../../../core/assets.js';

const template = await loadAssets({ template: templateSource });

const SIMILAR_COUNT = 6;

function similarFilms(film, catalog) {
  const genres = new Set(film.genres);
  return catalog
    .filter((other) => other.id !== film.id)
    .map((other) => ({ other, shared: other.genres.filter((genre) => genres.has(genre)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, SIMILAR_COUNT)
    .map(({ other }) => other);
}

export class FilmAbout extends Component {
  static template = template;

  context() {
    const { film } = this.props;
    const details = [
      { term: 'Год', value: film.year },
      { term: 'Тип', value: film.isSeries ? 'Сериал' : 'Фильм' },
      { term: 'Жанры', value: film.genres.join(', ') },
      {
        term: film.isSeries ? 'Серия' : 'Длительность',
        value: film.duration ? `${film.duration} мин` : '',
      },
      { term: 'Возраст', value: film.ageLimit === null ? '' : `${film.ageLimit}+` },
      { term: 'Сезоны', value: this.#seasons() },
    ];
    return { film, details: details.filter((item) => item.value) };
  }

  onRender() {
    const { people = [] } = this.props;
    if (people.length) this.insert('people', new FilmPeople({ people }));
    else this.find('[data-slot="people"]').remove();
    this.insert('rating', new FilmRating({ film: this.props.film }));
    this.insert('reviews', new FilmReviews({ film: this.props.film }));
    this.#loadMine();
    this.watch(store.watch('user', () => this.#loadMine()));
    this.insert('similar-heading', new SectionHeading({ title: 'Похожие фильмы и сериалы' }));
    this.#loadSimilar();
  }

  #loadMine() {
    loadMyReview(this.props.film.id).catch(() => {});
  }

  #seasons() {
    const { seasons } = this.props.film;
    if (!seasons.length) return '';
    const episodes = seasons.reduce((sum, season) => sum + season.episodes, 0);
    const seasonText = countLabel(seasons.length, ['сезон', 'сезона', 'сезонов']);
    return `${seasonText}, ${countLabel(episodes, ['серия', 'серии', 'серий'])}`;
  }

  #loadSimilar() {
    loadInto(this, 'similar', {
      loading: 'Подбираем похожие...',
      load: async () => similarFilms(this.props.film, await loadCatalog()),
      render: (films) =>
        films.length
          ? new MovieGrid({ films, view: 'grid' })
          : new StatusMessage({ text: 'Похожих пока нет.' }),
      failure: () => 'Не удалось подобрать похожие.',
    });
  }
}
