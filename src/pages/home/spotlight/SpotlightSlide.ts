import templateSource from './SpotlightSlide.hbs';
import { Component } from '../../../core/component.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { loadAssets } from '../../../core/assets.js';
import { loadCatalogRatings } from '../../../services/catalog-ratings.js';

const template = await loadAssets({ template: templateSource });

export class SpotlightSlide extends Component {
  static template = template;

  context() {
    const minutes = this.props.film.duration;
    const hours = Math.floor(minutes / 60);
    return {
      ...this.props,
      mobileGenre: this.props.film.genres[0]?.toLocaleLowerCase('ru'),
      mobileDuration: minutes
        ? hours
          ? `${hours} ч${minutes % 60 ? ` ${minutes % 60} мин` : ''}`
          : `${minutes} мин`
        : '',
      ratingStar: new URL('../../../assets/images/feed/spotlight-star.svg', import.meta.url).href,
    };
  }

  onRender() {
    this.insert('actions', new MovieActions({ film: this.props.film, variant: 'spotlight' }));
    const controller = new AbortController();
    this.watch(() => controller.abort());
    void loadCatalogRatings([this.props.film], { signal: controller.signal })
      .then((ratings) => {
        if (controller.signal.aborted) return;
        const rating = ratings.get(this.props.film.id);
        if (!rating?.votes) return;
        const label = rating.average.toLocaleString('ru', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
        const badge = this.find('[data-spotlight-rating]');
        badge.hidden = false;
        badge.setAttribute('aria-label', `Рейтинг Frame ${label} из 10`);
        this.find('[data-spotlight-score]').textContent = label;
      })
      .catch(() => {});
  }
}
