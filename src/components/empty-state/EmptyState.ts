import './empty-state.css';
import templateSource from './EmptyState.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });
const illustration = new URL('../../assets/images/empty-film.png', import.meta.url).href;
const catalogIllustrations: Record<string, string> = {
  upcoming: new URL('../../assets/images/empty-calendar.svg', import.meta.url).href,
  collections: new URL('../../assets/images/empty-collections.svg', import.meta.url).href,
  movie: new URL('../../assets/images/empty-catalog-film.svg', import.meta.url).href,
  favorite: new URL('../../assets/images/favorites/empty-heart.svg', import.meta.url).href,
  watchlater: new URL('../../assets/images/empty-watchlater.svg', import.meta.url).href,
  watched: new URL('../../assets/images/empty-watched.svg', import.meta.url).href,
  series: new URL('../../assets/images/empty-catalog-series.svg', import.meta.url).href,
  error: new URL('../../assets/images/catalog-error.png', import.meta.url).href,
  person: new URL('../../assets/images/empty-person.png', import.meta.url).href,
};

/** Пустое состояние с доступной кнопкой повторного запроса. */
export class EmptyState extends Component {
  static template = template;

  context() {
    return {
      illustration: catalogIllustrations[this.props.variant] || illustration,
      illustrationSize: 48,
      ...this.props,
      requestErrorIcon: new URL('../../assets/images/feed/request-error.svg', import.meta.url).href,
      requestErrorMobile: new URL(
        '../../assets/images/feed/request-error-mobile.svg',
        import.meta.url,
      ).href,
      requestRetryIcon: new URL('../../assets/images/feed/request-retry.svg', import.meta.url).href,
      requestRetryMobile: new URL(
        '../../assets/images/feed/request-retry-mobile.svg',
        import.meta.url,
      ).href,
      linksClass: this.props.requestError ? 'empty-state__actions' : '',
      modifier:
        this.props.variant === 'collections'
          ? 'empty-state--movie empty-state--collections'
          : this.props.requestError
            ? 'empty-state--request-error'
            : ['favorite', 'watchlater', 'watched', 'upcoming'].includes(this.props.variant)
              ? `empty-state--movie empty-state--${this.props.variant}`
              : this.props.variant
                ? `empty-state--${this.props.variant}`
                : '',
      secondary: this.props.level === 2,
      token: [
        'movie',
        'series',
        'favorite',
        'watchlater',
        'watched',
        'collections',
        'upcoming',
      ].includes(this.props.variant),
      personState: this.props.variant === 'person',
      canRetry: Boolean(this.props.onRetry),
    };
  }

  onRender() {
    if (this.props.onRetry) this.delegate('click', 'button', () => this.props.onRetry());
  }
}
