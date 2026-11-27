import './poster-stack.css';
import templateSource from './PosterStack.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import type { Film } from '../../api/films.js';

const template = await loadAssets({ template: templateSource });

export class PosterStack extends Component<{ films: Film[]; size?: string }> {
  static template = template;

  context() {
    return {
      size: this.props.size || 'small',
      posters: this.props.films.slice(0, 3).map((film) => film.poster),
    };
  }
}
