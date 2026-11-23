import './movie-card.css';
import templateSource from './MovieCard.hbs';
import { Component } from '../../core/component.js';
import { MovieActions } from '../movie-actions/MovieActions.js';
import { loadAssets } from '../../core/assets.js';
import type { CatalogRating } from '../../services/catalog-filters.js';

const template = await loadAssets({ template: templateSource });

export class MovieCard extends Component {
  static template = template;

  onRender() {
    this.insert('actions', new MovieActions({ film: this.props.film, variant: 'card' }));
    this.setRating(this.props.rating);
  }

  setRating(rating?: CatalogRating) {
    const badge = this.find('[data-rating]');
    badge.hidden = !rating?.votes;
    if (!rating?.votes) return;
    const label = rating.average.toLocaleString('ru', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    this.find('[data-rating-label]').textContent = label;
    badge.setAttribute('aria-label', `Рейтинг ${label} из 10`);
  }
}
