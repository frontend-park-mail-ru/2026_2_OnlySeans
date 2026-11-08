import { Component } from '../../../core/component.js';
import { MovieActions } from '../../../components/movie-actions/MovieActions.js';
import { loadTemplate } from '../../../core/assets.js';

const template = await loadTemplate(new URL('./SpotlightSlide.hbs', import.meta.url));

export class SpotlightSlide extends Component {
  static template = template;

  onRender() {
    this.insert('actions', new MovieActions({ film: this.props.film, variant: 'spotlight' }));
  }
}
