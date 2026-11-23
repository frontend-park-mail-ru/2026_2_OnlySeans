import './skeleton.css';
import templateSource from './Skeleton.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

/** Скелетон главной страницы с общей анимацией перелива. */
export class Skeleton extends Component {
  static template = template;

  context() {
    return {
      home: !this.props.variant,
      showHero: !this.props.variant || ['film', 'person'].includes(this.props.variant),
      person: this.props.variant === 'person',
      stats: Array.from({ length: 4 }),
      film: this.props.variant === 'film',
      catalog: this.props.variant === 'catalog',
      row: this.props.variant === 'row',
      showCollections: !this.props.variant || this.props.variant === 'collections',
      showCards: !this.props.variant || ['catalog', 'row'].includes(this.props.variant),
      modifier: this.props.variant ? `skeleton--${this.props.variant}` : '',
      cards: Array.from({ length: this.props.variant === 'row' ? 5 : 10 }),
      collections: Array.from({ length: 3 }),
    };
  }
}
