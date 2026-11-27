import templateSource from './FavoriteCard.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { MovieCard } from '../../components/movie-card/MovieCard.js';
import type { Film } from '../../api/films.js';

const template = await loadAssets({ template: templateSource });

export class FavoriteCard extends Component<{
  film: Film;
  score: number | null;
  shared: boolean;
  onShelves(film: Film): void;
}> {
  static template = template;
  onRender() {
    this.insert('movie', new MovieCard({ film: this.props.film }));
    const cover = this.find('.movie-card__cover');
    const measure = () =>
      this.element.style.setProperty(
        '--favorite-cover-height',
        `${cover.getBoundingClientRect().height}px`,
      );
    const frame = requestAnimationFrame(measure);
    this.watch(() => cancelAnimationFrame(frame));
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(cover);
      this.watch(() => observer.disconnect());
    }
    this.delegate('click', '[data-shelf-picker]', () => this.props.onShelves(this.props.film));
  }
}
