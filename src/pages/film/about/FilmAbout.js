import { Component } from '../../../core/component.js';
import { countLabel } from '../../../core/format.js';
import { loadCatalog } from '../../../services/catalog.js';
import { SectionHeading } from '../../../components/section-heading/SectionHeading.js';
import { MovieGrid } from '../../../components/movie-grid/MovieGrid.js';
import { StatusMessage } from '../../../components/status-message/StatusMessage.js';
import { loadInto } from '../../../components/status-message/load-into.js';
import { FilmRating } from './FilmRating.js';
import { loadStyles, loadTemplate } from '../../../core/assets.js';

loadStyles(new URL('./film-about.css', import.meta.url));
const template = await loadTemplate(new URL('./FilmAbout.hbs', import.meta.url));

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
    this.insert('rating', new FilmRating({ film: this.props.film }));
    this.insert('similar-heading', new SectionHeading({ title: 'Похожие фильмы и сериалы' }));
    this.#loadSimilar();
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
