import { Component } from '../../../core/component.js';
import { countLabel } from '../../../core/format.js';
import { BackLink } from '../../../components/back-link/BackLink.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { loadStyles, loadTemplate } from '../../../core/assets.js';

loadStyles(new URL('./film-hero.css', import.meta.url));
const template = await loadTemplate(new URL('./FilmHero.hbs', import.meta.url));

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
    this.insert(
      'back',
      new BackLink(
        film.isSeries ? { href: '/series', text: 'Сериалы' } : { href: '/films', text: 'Фильмы' },
      ),
    );
    this.insert('actions', new MovieActions({ film, variant: 'hero' }));
  }
}
