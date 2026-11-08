import { Component } from '../../core/component.js';
import { loadStyles, loadTemplate } from '../../core/assets.js';

loadStyles(new URL('./poster-stack.css', import.meta.url));
const template = await loadTemplate(new URL('./PosterStack.hbs', import.meta.url));

export class PosterStack extends Component {
  static template = template;

  context() {
    return {
      size: this.props.size || 'small',
      posters: this.props.films.slice(0, 3).map((film) => film.poster),
    };
  }
}
