import './film-hero.css';
import templateSource from './FilmHero.hbs';
import { Component } from '../../../core/component.js';
import { countLabel } from '../../../core/format.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { loadAssets } from '../../../core/assets.js';
import { FilmRating } from '../about/FilmRating.js';

const template = await loadAssets({ template: templateSource });

export class FilmHero extends Component {
  static template = template;

  context() {
    const { film } = this.props;
    const meta = [film.year, film.isSeries ? 'Сериал' : 'Фильм'];
    if (film.duration) meta.push(`${film.duration} мин`);
    if (film.isSeries && film.seasons.length)
      meta.push(countLabel(film.seasons.length, ['сезон', 'сезона', 'сезонов']));
    if (film.ageLimit !== null) meta.push(`${film.ageLimit}+`);
    return {
      ...this.props,
      meta: meta.filter(Boolean),
      badges: [
        film.ageLimit === null ? '' : `${film.ageLimit}+`,
        ...film.genres.slice(0, 2),
      ].filter(Boolean),
      mobileMeta: [
        film.originalTitle,
        film.year,
        film.duration && `${Math.floor(film.duration / 60)} ч ${film.duration % 60} мин`,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  }

  onRender() {
    const { film } = this.props;
    this.insert('actions', new MovieActions({ film, variant: 'hero' }));
    this.insert('rating', new FilmRating({ film }));
  }
}
