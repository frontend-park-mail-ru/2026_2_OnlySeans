import { Component } from '../../core/component.js';
import { countLabel } from '../../core/format.js';
import { PosterStack } from '../poster-stack/PosterStack.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./collection-card.css', import.meta.url));
const template = await loadTemplate(new URL('./CollectionCard.hbs', import.meta.url));

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
