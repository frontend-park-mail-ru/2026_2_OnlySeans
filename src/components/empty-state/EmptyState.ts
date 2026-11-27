import './empty-state.css';
import templateSource from './EmptyState.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });
const illustration = new URL('../../assets/images/empty-film.png', import.meta.url).href;
const catalogIllustrations = {
  movie: new URL('../../assets/images/empty-catalog-film.svg', import.meta.url).href,
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
      ...this.props,
      modifier: this.props.variant ? `empty-state--${this.props.variant}` : '',
      secondary: this.props.level === 2,
      token: ['movie', 'series'].includes(this.props.variant),
      personState: this.props.variant === 'person',
      canRetry: Boolean(this.props.onRetry),
    };
  }

  onRender() {
    if (this.props.onRetry) this.delegate('click', 'button', () => this.props.onRetry());
  }
}
