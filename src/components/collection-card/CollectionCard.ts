import './collection-card.css';
import templateSource from './CollectionCard.hbs';
import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { PosterStack } from '../poster-stack/PosterStack.js';
import { loadAssets } from '../../core/assets.js';

const template = await loadAssets({ template: templateSource });

export class CollectionCard extends Component {
  static template = template;

  context() {
    return {
      ...this.props,
      count: countLabel(this.props.films.length, ['фильм', 'фильма', 'фильмов']),
    };
  }

  onRender() {
    this.insert('posters', new PosterStack({ films: this.props.films }));
  }
}
