import './film-hero.css';
import templateSource from './FilmHero.hbs';
import { Component } from '../../../core/component.js';
import { countLabel } from '../../../core/format.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { loadAssets } from '../../../core/assets.js';

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
    };
  }

  onRender() {
    const { film } = this.props;
    this.insert('actions', new MovieActions({ film, variant: 'hero' }));
  }
}
